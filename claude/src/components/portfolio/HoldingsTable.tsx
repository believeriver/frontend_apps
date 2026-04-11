import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { deletePosition, loadPortfolio } from '../../store/portfolioSlice';
import { DashboardItem, PortfolioItem, PortfolioRecord } from '../../types';
import PositionModal from './PositionModal';

interface Props {
  dashboard: DashboardItem[];
  items: PortfolioItem[];
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString('ja-JP', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function HoldingsTable({ dashboard, items }: Props) {
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
  const rows = dashboard.map((d) => ({
    ...d,
    records: items.find((it) => it.company_code === d.company_code)?.records ?? [],
    cost: d.avg_purchase_price * d.total_shares,
  }));

  return (
    <>
      <div className="table-scroll">
        <table className="list-table pf-table">
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th className="col-name">銘柄</th>
              <th>業種</th>
              <th>保有株数</th>
              <th>平均取得単価</th>
              <th>取得総額</th>
              <th>配当利回り</th>
              <th>年間配当収入</th>
              <th>PER</th>
              <th>PBR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const isOpen = expanded.has(d.company_code);
              return (
                <>
                  <tr key={d.company_code} className="list-row pf-row">
                    {/* 展開ボタン */}
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpand(d.company_code)}
                        title={isOpen ? '折りたたむ' : '購入履歴を見る'}
                      >
                        {isOpen ? '▾' : '▸'}
                      </button>
                    </td>
                    <td className="td-name">
                      <span
                        className="pf-name-link"
                        onClick={() => navigate(`/stock/${d.company_code}`)}
                      >
                        <span className="td-code" style={{ marginRight: 8 }}>{d.company_code}</span>
                        {d.company_name}
                      </span>
                    </td>
                    <td>
                      {d.industry
                        ? <span className="industry-tag">{d.industry}</span>
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmt(d.total_shares)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(d.avg_purchase_price)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(d.cost)}</td>
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
                      <td colSpan={2} style={{ paddingLeft: 32, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        📅 {rec.purchased_at}
                        {rec.memo && <span style={{ marginLeft: 8, color: 'var(--text-dim)' }}>({rec.memo})</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.82rem' }}>{fmt(rec.shares)}</td>
                      <td style={{ textAlign: 'right', fontSize: '0.82rem' }}>{fmt(parseFloat(rec.purchase_price))}</td>
                      <td style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {fmt(parseFloat(rec.purchase_price) * rec.shares)}
                      </td>
                      <td colSpan={3} />
                      <td style={{ textAlign: 'right' }}>
                        <div className="pf-rec-actions">
                          <button
                            className="pf-edit-btn"
                            onClick={() => setEditTarget({ companyCode: d.company_code, record: rec })}
                          >編集</button>
                          <button
                            className="pf-delete-btn"
                            onClick={() => setDeleteConfirm({ id: rec.id, name: `${d.company_name} (${rec.purchased_at})` })}
                          >削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              );
            })}
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
