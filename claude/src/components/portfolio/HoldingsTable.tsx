import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { deletePosition, loadPortfolio } from '../../store/portfolioSlice';
import { DashboardItem, PortfolioItem, PortfolioRecord } from '../../types';
import PositionModal from './PositionModal';
import { getCategory, CATEGORY_META } from '../../utils/stockCategory';

const ACCOUNT_LABEL: Record<string, string> = {
  taxable:           '課税',
  nisa_growth:       'NISA成長',
  nisa_accumulation: 'NISAつみたて',
};

interface Props {
  dashboard: DashboardItem[];
  items: PortfolioItem[];
  currentPrices: Record<string, number>;
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString('ja-JP', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function HoldingsTable({ dashboard, items, currentPrices }: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { mutating } = useSelector((s: RootState) => s.portfolio);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editTarget, setEditTarget] = useState<{ companyCode: string; record: PortfolioRecord } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const toggleExpand = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    await dispatch(deletePosition(id));
    await dispatch(loadPortfolio());
    setDeleteConfirm(null);
  };

  // dashboardとitemsをコードで結合
  const rows = dashboard.map((d) => {
    const cost         = Math.round(d.avg_purchase_price * d.total_shares);
    const currentPrice = currentPrices[d.company_code] ?? null;
    const value        = currentPrice != null ? currentPrice * d.total_shares : null;
    const gain         = value != null ? value - cost : null;
    const gainPct      = gain != null && cost > 0 ? (gain / cost) * 100 : null;
    const category = getCategory(d.industry);
    return {
      ...d,
      records: items.find((it) => it.company_code === d.company_code)?.records ?? [],
      cost,
      currentPrice,
      value,
      gain,
      gainPct,
      category,
    };
  });

  // NISA/課税/混合でグループ分け
  const nisaRows    = rows.filter((r) => r.nisa_shares > 0 && r.taxable_shares === 0);
  const mixedRows   = rows.filter((r) => r.nisa_shares > 0 && r.taxable_shares > 0);
  const taxableRows = rows.filter((r) => r.nisa_shares === 0);

  const totalCols = 15; // 展開行のcolspan用

  const renderRow = (d: typeof rows[number]) => {
    const isOpen = expanded.has(d.company_code);
    const isNisa = d.nisa_shares > 0;
    return (
      <>
        <tr key={d.company_code} className={`list-row pf-row ${isNisa ? 'pf-row-nisa' : ''}`}>
          <td>
            <button className="expand-btn" onClick={() => toggleExpand(d.company_code)}
              title={isOpen ? '折りたたむ' : '購入履歴を見る'}>
              {isOpen ? '▾' : '▸'}
            </button>
          </td>
          <td className="td-name">
            <span className="pf-name-link" onClick={() => navigate(`/stock/${d.company_code}`)}>
              <span className="td-code" style={{ marginRight: 8 }}>{d.company_code}</span>
              {d.company_name}
            </span>
          </td>
          <td>
            {(() => {
              const m = CATEGORY_META[d.category];
              return (
                <span className="category-badge"
                  style={{ color: m.color, background: m.bg, borderColor: m.color }}>
                  {m.short === '—' ? m.label : `${m.short} ${m.label}`}
                </span>
              );
            })()}
          </td>
          <td>
            {d.industry ? <span className="industry-tag">{d.industry}</span> : '—'}
          </td>
          <td style={{ textAlign: 'right' }}>{fmt(d.total_shares)}</td>
          <td style={{ textAlign: 'right' }}>{fmt(d.avg_purchase_price)}</td>
          <td style={{ textAlign: 'right' }}>
            {d.currentPrice != null ? fmt(d.currentPrice) : '—'}
          </td>
          <td style={{ textAlign: 'right' }}>{fmt(d.cost)}</td>
          <td style={{ textAlign: 'right' }}>
            {d.value != null ? fmt(d.value) : '—'}
          </td>
          <td style={{ textAlign: 'right', fontWeight: 600,
            color: d.gain == null ? 'inherit' : d.gain >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            {d.gain != null ? `${d.gain >= 0 ? '+' : ''}${fmt(d.gain)}` : '—'}
          </td>
          <td style={{ textAlign: 'right', fontWeight: 600,
            color: d.gainPct == null ? 'inherit' : d.gainPct >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            {d.gainPct != null ? `${d.gainPct >= 0 ? '+' : ''}${d.gainPct.toFixed(2)}%` : '—'}
          </td>
          <td style={{ textAlign: 'right' }}>
            {d.dividend_yield != null
              ? <span className={`dividend-badge ${d.dividend_yield >= 5 ? 'high' : d.dividend_yield >= 3 ? 'mid' : 'low'}`}>
                  {d.dividend_yield.toFixed(2)}%
                </span>
              : '—'}
          </td>
          <td style={{ textAlign: 'right', color: 'var(--positive)', fontWeight: 600 }}>
            {d.dividend_income != null ? `${fmt(d.dividend_income)} 円` : '—'}
          </td>
          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
            {d.per ? fmt(d.per, 2) : '—'}
          </td>
          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
            {d.pbr ? fmt(d.pbr, 2) : '—'}
          </td>
        </tr>

        {/* 展開行: 購入履歴 */}
        {isOpen && d.records.map((rec) => (
          <tr key={rec.id} className="pf-record-row">
            <td />
            <td colSpan={3} style={{ paddingLeft: 32, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              📅 {rec.purchased_at}
              {rec.memo && <span style={{ marginLeft: 8, color: 'var(--text-dim)' }}>({rec.memo})</span>}
              <span className={`account-badge ${rec.account_type}`} style={{ marginLeft: 8 }}>
                {ACCOUNT_LABEL[rec.account_type] ?? rec.account_type}
              </span>
            </td>
            <td style={{ textAlign: 'right', fontSize: '0.82rem' }}>{fmt(rec.shares)}</td>
            <td style={{ textAlign: 'right', fontSize: '0.82rem' }}>{fmt(parseFloat(rec.purchase_price))}</td>
            <td />{/* 現在値 */}
            <td style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {fmt(parseFloat(rec.purchase_price) * rec.shares)}
            </td>
            <td colSpan={6} />
            <td style={{ textAlign: 'right' }}>
              <div className="pf-rec-actions">
                <button className="pf-edit-btn"
                  onClick={() => setEditTarget({ companyCode: d.company_code, record: rec })}>編集</button>
                <button className="pf-delete-btn"
                  onClick={() => setDeleteConfirm({ id: rec.id, name: `${d.company_name} (${rec.purchased_at})` })}>削除</button>
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <>
      <div className="table-scroll">
        <table className="list-table pf-table">
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th className="col-name">銘柄</th>
              <th>区分</th>
              <th>業種</th>
              <th>保有株数</th>
              <th>平均取得単価</th>
              <th>現在値</th>
              <th>取得総額</th>
              <th>評価額</th>
              <th>損益</th>
              <th>損益率</th>
              <th>配当利回り</th>
              <th>年間配当収入</th>
              <th>PER</th>
              <th>PBR</th>
            </tr>
          </thead>
          <tbody>
            {/* NISAのみ */}
            {nisaRows.length > 0 && (
              <tr className="pf-section-header">
                <td colSpan={totalCols}>
                  <span className="pf-section-nisa">🌿 NISA口座</span>
                  <span className="pf-section-count">{nisaRows.length} 銘柄</span>
                </td>
              </tr>
            )}
            {nisaRows.map(renderRow)}

            {/* NISA + 課税の混合 */}
            {mixedRows.length > 0 && (
              <tr className="pf-section-header">
                <td colSpan={totalCols}>
                  <span className="pf-section-mixed">🔀 NISA・課税 混合</span>
                  <span className="pf-section-count">{mixedRows.length} 銘柄</span>
                </td>
              </tr>
            )}
            {mixedRows.map(renderRow)}

            {/* 課税のみ */}
            {taxableRows.length > 0 && (
              <tr className="pf-section-header">
                <td colSpan={totalCols}>
                  <span className="pf-section-taxable">🏦 課税口座</span>
                  <span className="pf-section-count">{taxableRows.length} 銘柄</span>
                </td>
              </tr>
            )}
            {taxableRows.map(renderRow)}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      {editTarget && (
        <PositionModal
          onClose={() => setEditTarget(null)}
          editRecord={editTarget}
        />
      )}

      {/* 削除確認ダイアログ */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>削除の確認</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
              「{deleteConfirm.name}」の購入履歴を削除しますか？この操作は取り消せません。
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setDeleteConfirm(null)}>
                キャンセル
              </button>
              <button
                className="auth-btn"
                style={{ flex: 1, background: 'var(--negative)' }}
                disabled={mutating}
                onClick={() => handleDelete(deleteConfirm.id)}
              >
                {mutating ? <span className="btn-spinner" /> : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
