import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { apiGetScreening, apiRefreshScreening } from '../api/screening';
import type { ScreeningItem, ScreeningParams, ScreeningDetails } from '../types/screening';
import CompanyDetailModal from '../components/CompanyDetailModal';

const MAX_SCORE = 110;
const PAGE_SIZE = 50;

// ── スコアバー ──────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / MAX_SCORE) * 100);
  const color = pct >= 80 ? '#3fb950' : pct >= 60 ? '#d29922' : '#8b949e';
  return (
    <div className="scr-score-wrap">
      <span className="scr-score-num" style={{ color }}>{score}</span>
      <div className="scr-score-bar">
        <div className="scr-score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── 条件バッジ ──────────────────────────────────────────────
type BadgeDef = { label: string; ok: boolean | null };

function buildBadges(d: ScreeningDetails): BadgeDef[] {
  return [
    { label: '売上↗',    ok: d.sales_growth },
    { label: '利益率✓',  ok: d.operating_margin_ok },
    { label: 'EPS✓',     ok: d.eps_no_negative && d.eps_growth },
    { label: '自己資本✓', ok: d.equity_ratio_40 },
    { label: 'CF✓',      ok: d.cf_positive },
    { label: '配当✓',    ok: d.dividend_stable },
    { label: '配当性向✓', ok: d.payout_ratio_ok },
  ];
}

function DetailBadges({ d }: { d: ScreeningDetails }) {
  const badges = buildBadges(d);
  return (
    <div className="scr-badges">
      {badges.map(b => (
        <span
          key={b.label}
          className={`scr-badge ${b.ok === true ? 'ok' : b.ok === false ? 'ng' : 'na'}`}
          title={b.ok === null ? 'データ不足' : b.ok ? '条件達成' : '条件未達'}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

// ── メインページ ────────────────────────────────────────────
export default function ScreeningPage() {
  const { accessToken, isSuperuser } = useSelector((s: RootState) => s.auth);

  // フィルタ状態
  const [dividendMin,   setDividendMin]   = useState('');
  const [marginMin,     setMarginMin]     = useState('');
  const [equityMin,     setEquityMin]     = useState('');
  const [minYears,      setMinYears]      = useState('');
  const [scoreMin,      setScoreMin]      = useState('50');
  const [excludeReit,   setExcludeReit]   = useState(true);
  const [sortBy,        setSortBy]        = useState<'score' | 'dividend'>('score');

  // データ
  const [results,      setResults]      = useState<ScreeningItem[]>([]);
  const [count,        setCount]        = useState(0);
  const [refreshedAt,  setRefreshedAt]  = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [refreshMsg,   setRefreshMsg]   = useState('');
  const [page,         setPage]         = useState(1);

  // モーダル
  const [detailTarget, setDetailTarget] = useState<{ code: string; name: string } | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const params: ScreeningParams = {
        sort_by:              sortBy,
        exclude_reit:         excludeReit,
        dividend_yield_min:   dividendMin   ? parseFloat(dividendMin)   : undefined,
        equity_ratio_min:     equityMin     ? parseFloat(equityMin)     : undefined,
        operating_margin_min: marginMin     ? parseFloat(marginMin)     : undefined,
        min_years:            minYears      ? parseInt(minYears)        : undefined,
      };
      const data = await apiGetScreening(params);
      const filtered = scoreMin
        ? data.results.filter(r => r.score >= parseInt(scoreMin))
        : data.results;
      setResults(filtered);
      setCount(data.count);
      setRefreshedAt(data.refreshed_at);
    } finally {
      setLoading(false);
    }
  }, [sortBy, excludeReit, dividendMin, marginMin, equityMin, minYears, scoreMin]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRefresh = async () => {
    if (!accessToken) return;
    setRefreshing(true);
    setRefreshMsg('');
    try {
      const res = await apiRefreshScreening(accessToken);
      setRefreshMsg(`✓ ${res.message}`);
      await fetch();
    } catch {
      setRefreshMsg('更新に失敗しました');
    } finally {
      setRefreshing(false);
    }
  };

  // ページネーション
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paged = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmtPct  = (v: number | null) => v != null ? `${v.toFixed(1)}%` : '—';
  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div className="scr-page">
      {detailTarget && (
        <CompanyDetailModal
          code={detailTarget.code}
          name={detailTarget.name}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {/* ── ヘッダー ── */}
      <div className="scr-header">
        <div>
          <h1 className="scr-title">財務スクリーニング</h1>
          <p className="scr-sub">最終更新: {fmtDate(refreshedAt)}</p>
        </div>
        {isSuperuser && (
          <div className="scr-header-actions">
            {refreshMsg && <span className="scr-refresh-msg">{refreshMsg}</span>}
            <button className="scr-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? '更新中...' : '🔄 スクリーニング更新'}
            </button>
          </div>
        )}
      </div>

      {/* ── フィルタ ── */}
      <div className="scr-filter-panel">
        <div className="scr-filter-row">
          <label className="scr-filter-label">
            配当利回り
            <div className="scr-filter-input-wrap">
              <input className="scr-filter-input" type="number" min="0" step="0.5"
                value={dividendMin} onChange={e => setDividendMin(e.target.value)} placeholder="0" />
              <span className="scr-filter-unit">% 以上</span>
            </div>
          </label>
          <label className="scr-filter-label">
            営業利益率
            <div className="scr-filter-input-wrap">
              <input className="scr-filter-input" type="number" min="0" step="1"
                value={marginMin} onChange={e => setMarginMin(e.target.value)} placeholder="0" />
              <span className="scr-filter-unit">% 以上</span>
            </div>
          </label>
          <label className="scr-filter-label">
            自己資本比率
            <div className="scr-filter-input-wrap">
              <input className="scr-filter-input" type="number" min="0" step="5"
                value={equityMin} onChange={e => setEquityMin(e.target.value)} placeholder="0" />
              <span className="scr-filter-unit">% 以上</span>
            </div>
          </label>
          <label className="scr-filter-label">
            最低分析年数
            <div className="scr-filter-input-wrap">
              <input className="scr-filter-input" type="number" min="1" step="1"
                value={minYears} onChange={e => setMinYears(e.target.value)} placeholder="なし" />
              <span className="scr-filter-unit">年</span>
            </div>
          </label>
          <label className="scr-filter-label">
            スコア
            <div className="scr-filter-input-wrap">
              <input className="scr-filter-input" type="number" min="0" max="110" step="5"
                value={scoreMin} onChange={e => setScoreMin(e.target.value)} placeholder="0" />
              <span className="scr-filter-unit">以上 / {MAX_SCORE}点</span>
            </div>
          </label>
        </div>
        <div className="scr-filter-row scr-filter-row-bottom">
          <label className="scr-checkbox-label">
            <input type="checkbox" checked={excludeReit} onChange={e => setExcludeReit(e.target.checked)} />
            リート除外
          </label>
          <div className="scr-sort-group">
            <span className="scr-sort-label">並び替え</span>
            {(['score', 'dividend'] as const).map(v => (
              <label key={v} className="scr-radio-label">
                <input type="radio" name="sortBy" value={v} checked={sortBy === v} onChange={() => setSortBy(v)} />
                {v === 'score' ? 'スコア順' : '配当利回り順'}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── 結果サマリー ── */}
      <div className="scr-summary">
        {loading ? '読み込み中...' : `全${count.toLocaleString()}件中 ${results.length.toLocaleString()}件が条件に一致`}
      </div>

      {/* ── テーブル ── */}
      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="scr-table-wrap">
            <table className="scr-table">
              <thead>
                <tr>
                  <th className="scr-th-rank">ランク</th>
                  <th className="scr-th-code">コード</th>
                  <th className="scr-th-name">企業名</th>
                  <th className="scr-th-score">スコア</th>
                  <th className="scr-th-num">配当<br/>利回り</th>
                  <th className="scr-th-num">営業<br/>利益率</th>
                  <th className="scr-th-num">自己<br/>資本比率</th>
                  <th className="scr-th-num">分析年</th>
                  <th className="scr-th-badges">条件</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item, idx) => {
                  const rank = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={item.code} className="scr-row">
                      <td className="scr-td-rank">{rank}</td>
                      <td className="scr-td-code">
                        <a href={`/stock/${item.code}`} target="_blank" rel="noopener noreferrer" className="scr-code-link">
                          {item.code}
                        </a>
                      </td>
                      <td className="scr-td-name">
                        <div className="pf-name-cell">
                          <a href={`/stock/${item.code}`} target="_blank" rel="noopener noreferrer" className="scr-name-link">
                            {item.name}
                          </a>
                          <button
                            className="cdm-open-btn"
                            onClick={() => setDetailTarget({ code: item.code, name: item.name })}
                          >企業詳細</button>
                        </div>
                      </td>
                      <td className="scr-td-score">
                        <ScoreBar score={item.score} />
                      </td>
                      <td className="scr-td-num">
                        {item.dividend != null ? (
                          <span className={`dividend-badge ${item.dividend >= 5 ? 'high' : item.dividend >= 3 ? 'mid' : 'low'}`}>
                            {item.dividend.toFixed(2)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="scr-td-num">{fmtPct(item.details.operating_margin_val)}</td>
                      <td className="scr-td-num">{fmtPct(item.details.equity_ratio_val)}</td>
                      <td className="scr-td-num">{item.years_analyzed}年</td>
                      <td className="scr-td-badges">
                        <DetailBadges d={item.details} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="scr-pagination">
              <button className="scr-page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="scr-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              <span className="scr-page-info">{page} / {totalPages}</span>
              <button className="scr-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="scr-page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
