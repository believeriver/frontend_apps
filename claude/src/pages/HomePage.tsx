import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  loadCompanyList,
  setSearch,
  toggleSort,
  setPage,
  applyFilter,
  applySort,
  paginate,
  PAGE_SIZE_EXPORT as PAGE_SIZE,
  SortKey,
} from '../store/companyListSlice';

function parsePrice(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

function fmtRatio(v: number | null | undefined): string {
  if (v == null || v === 0) return '—';
  return `${v.toFixed(2)}`;
}

function truncate(s: string | null | undefined, len = 40): string {
  if (!s) return '—';
  return s.length <= len ? s : s.slice(0, len) + '…';
}

// ソート可能な列定義
const COLUMNS: { key: SortKey; label: string; align?: 'left' }[] = [
  { key: 'dividend_rank', label: 'ランク' },
  { key: 'code',          label: 'コード' },
  { key: 'name',          label: '企業名',   align: 'left' },
  { key: 'stock',         label: '株価 (円)' },
  { key: 'dividend',      label: '配当利回り' },
  { key: 'per',           label: 'PER (倍)' },
  { key: 'pbr',           label: 'PBR (倍)' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error, search, sortKey, sortDir, page } = useSelector(
    (s: RootState) => s.companyList
  );

  useEffect(() => {
    if (items.length === 0) dispatch(loadCompanyList());
  }, [dispatch, items.length]);

  const filtered   = useMemo(() => applyFilter(items, search),           [items, search]);
  const sorted     = useMemo(() => applySort(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const paged      = useMemo(() => paginate(sorted, page),               [sorted, page]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = useCallback((key: SortKey) => dispatch(toggleSort(key)), [dispatch]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="sort-icon muted">↕</span>;
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p className="loading-text">銘柄一覧を読み込み中... (3,000件超)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="error-box">
          <p className="error-title">取得エラー</p>
          <p className="error-msg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page-list">
      {/* ヘッダー */}
      <div className="list-header">
        <div>
          <h1 className="list-title">配当利回りランキング</h1>
          <p className="list-subtitle">
            {search
              ? `「${search}」の検索結果 ${sorted.length.toLocaleString()} 件`
              : `全 ${items.length.toLocaleString()} 銘柄`}
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
          placeholder="企業名・コードで検索..."
          className="list-search"
          autoFocus
        />
      </div>

      {/* テーブル */}
      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              {COLUMNS.map(({ key, label, align }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`sortable${align === 'left' ? ' col-name' : ''}`}
                >
                  {label} <SortIcon col={key} />
                </th>
              ))}
              {/* ソート不可の固定列 */}
              <th className="col-industry">業種</th>
              <th className="col-desc">企業説明</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => {
              const price = parsePrice(c.stock);
              const info  = c.information;
              return (
                <tr key={c.code} className="list-row" onClick={() => navigate(`/stock/${c.code}`)}>
                  <td className="td-rank">
                    {c.dividend_rank != null ? (
                      <span className={`rank-badge rank-${Math.ceil(c.dividend_rank / 500)}`}>
                        {c.dividend_rank}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="td-code">{c.code}</td>
                  <td className="td-name">{c.name}</td>
                  <td className="td-price">{price.toLocaleString('ja-JP')}</td>
                  <td className="td-dividend">
                    {c.dividend != null ? (
                      <span className={`dividend-badge ${c.dividend >= 5 ? 'high' : c.dividend >= 3 ? 'mid' : 'low'}`}>
                        {c.dividend.toFixed(2)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="td-ratio">{fmtRatio(info?.per)}</td>
                  <td className="td-ratio">{fmtRatio(info?.pbr)}</td>
                  <td className="td-industry">
                    {info?.industry
                      ? <span className="industry-tag">{info.industry}</span>
                      : '—'}
                  </td>
                  <td className="td-desc">{truncate(info?.description)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => dispatch(setPage(1))}>«</button>
          <button className="page-btn" disabled={page === 1} onClick={() => dispatch(setPage(page - 1))}>‹</button>

          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let p: number;
            if      (totalPages <= 7)       p = i + 1;
            else if (page <= 4)             p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else                             p = page - 3 + i;
            return (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => dispatch(setPage(p))}>
                {p}
              </button>
            );
          })}

          <button className="page-btn" disabled={page === totalPages} onClick={() => dispatch(setPage(page + 1))}>›</button>
          <button className="page-btn" disabled={page === totalPages} onClick={() => dispatch(setPage(totalPages))}>»</button>

          <span className="page-info">
            {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
            {Math.min(page * PAGE_SIZE, sorted.length).toLocaleString()} /
            {sorted.length.toLocaleString()} 件
          </span>
        </div>
      )}
    </div>
  );
}
