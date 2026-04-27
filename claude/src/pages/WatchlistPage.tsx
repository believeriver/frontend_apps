import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  apiGetWatchlists, apiGetWatchlist, apiCreateWatchlist,
  apiUpdateWatchlist, apiDeleteWatchlist,
  apiAddWatchlistItem, apiUpdateWatchlistItem, apiDeleteWatchlistItem,
  apiRefreshWatchlistItems,
} from '../api/watchlist';
import type {
  WatchlistSummary, WatchlistDetail, WatchlistItem,
} from '../types/watchlist';

// アラートステータスの色・アイコン
const ALERT_META = {
  none:      { color: '#3fb950', bg: 'rgba(63,185,80,0.12)',    icon: '✓',  label: 'なし'      },
  alert_10:  { color: '#d29922', bg: 'rgba(210,153,34,0.12)',   icon: '⚠',  label: '10%下落'   },
  alert_20:  { color: '#f85149', bg: 'rgba(248,81,73,0.12)',    icon: '🔴', label: '20%以上下落' },
} as const;

// ── リスト作成・編集フォーム ────────────────────────────────
function ListForm({
  initial, onSave, onCancel,
}: {
  initial: { name: string; memo: string };
  onSave: (name: string, memo: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [memo, setMemo] = useState(initial.memo);
  const [saving, setSaving] = useState(false);

  return (
    <div className="wl-form-inline">
      <input
        className="wl-input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="リスト名"
      />
      <input
        className="wl-input"
        value={memo}
        onChange={e => setMemo(e.target.value)}
        placeholder="メモ（任意）"
      />
      <div className="wl-form-actions">
        <button className="wl-cancel-btn" onClick={onCancel}>キャンセル</button>
        <button className="wl-save-btn" disabled={saving || !name.trim()} onClick={async () => {
          setSaving(true);
          await onSave(name.trim(), memo.trim());
          setSaving(false);
        }}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// ── アイテム追加フォーム ────────────────────────────────────
function AddItemForm({
  onAdd, onCancel,
}: {
  onAdd: (code: string, targetPrice: number, memo: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [code,        setCode]        = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [memo,        setMemo]        = useState('');
  const [saving,      setSaving]      = useState(false);

  return (
    <div className="wl-add-item-form">
      <input
        className="wl-input wl-input-code"
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="銘柄コード（例: 8708）"
      />
      <input
        className="wl-input wl-input-price"
        type="number"
        value={targetPrice}
        onChange={e => setTargetPrice(e.target.value)}
        placeholder="ターゲット価格"
      />
      <input
        className="wl-input"
        value={memo}
        onChange={e => setMemo(e.target.value)}
        placeholder="メモ（任意）"
      />
      <div className="wl-form-actions">
        <button className="wl-cancel-btn" onClick={onCancel}>キャンセル</button>
        <button
          className="wl-save-btn"
          disabled={saving || !code.trim() || !targetPrice}
          onClick={async () => {
            setSaving(true);
            await onAdd(code.trim(), parseFloat(targetPrice), memo.trim());
            setSaving(false);
          }}
        >
          {saving ? '追加中...' : '追加'}
        </button>
      </div>
    </div>
  );
}

// ── アイテム行 ──────────────────────────────────────────────
function ItemRow({
  item, listId, token, onUpdated, onDeleted,
}: {
  item: WatchlistItem;
  listId: number;
  token: string;
  onUpdated: (item: WatchlistItem) => void;
  onDeleted: (id: number) => void;
}) {
  const [editing,     setEditing]     = useState(false);
  const [targetPrice, setTargetPrice] = useState(String(item.target_price));
  const [memo,        setMemo]        = useState(item.memo);
  const [saving,      setSaving]      = useState(false);

  const meta = ALERT_META[item.alert_status];
  const diffPct = item.price_diff_pct;
  const diffSign = diffPct != null && diffPct > 0 ? '+' : '';

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiUpdateWatchlistItem(token, listId, item.id, {
        target_price: parseFloat(targetPrice),
        memo,
      });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${item.company_name}」を削除しますか？`)) return;
    await apiDeleteWatchlistItem(token, listId, item.id);
    onDeleted(item.id);
  };

  return (
    <div className={`wl-item-row ${item.alert_status !== 'none' ? 'wl-item-alert' : ''}`}>
      <div className="wl-item-left">
        <span
          className="wl-alert-badge"
          style={{ color: meta.color, background: meta.bg, borderColor: meta.color + '44' }}
          title={meta.label}
        >
          {meta.icon}
        </span>
        <div className="wl-item-info">
          <div className="wl-item-code-row">
            <span className="wl-item-code">{item.company_code}</span>
            {item.company_industry && (
              <span className="wl-item-industry">{item.company_industry}</span>
            )}
          </div>
          <Link to={`/stock/${item.company_code}`} className="wl-item-name">{item.company_name}</Link>
          <div className="wl-item-sub-row">
            {item.company_dividend != null && (
              <span className="wl-item-dividend">配当 {item.company_dividend.toFixed(2)}%</span>
            )}
            {item.memo && <span className="wl-item-memo">{item.memo}</span>}
          </div>
        </div>
      </div>

      <div className="wl-item-prices">
        <div className="wl-price-row">
          <span className="wl-price-label">現在値</span>
          <span className="wl-price-value">
            {item.current_price != null ? `¥${item.current_price.toLocaleString()}` : '—'}
          </span>
        </div>
        <div className="wl-price-row">
          <span className="wl-price-label">目標値</span>
          {editing ? (
            <input
              className="wl-input wl-input-price-inline"
              type="number"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
            />
          ) : (
            <span className="wl-price-value">¥{item.target_price.toLocaleString()}</span>
          )}
        </div>
        {diffPct != null && (
          <div className="wl-price-row">
            <span className="wl-price-label">乖離</span>
            <span
              className="wl-price-diff"
              style={{ color: diffPct < -10 ? meta.color : diffPct > 0 ? '#3fb950' : '#8b949e' }}
            >
              {diffSign}{diffPct.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="wl-item-right">
        {editing ? (
          <>
            <input
              className="wl-input wl-input-memo-inline"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="メモ"
            />
            <button className="wl-save-btn" disabled={saving} onClick={handleSave}>
              {saving ? '保存中...' : '保存'}
            </button>
            <button className="wl-cancel-btn" onClick={() => setEditing(false)}>キャンセル</button>
          </>
        ) : (
          <>
            <button className="wl-edit-btn" onClick={() => setEditing(true)}>編集</button>
            <button className="wl-del-btn" onClick={handleDelete}>削除</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── メインページ ────────────────────────────────────────────
export default function WatchlistPage() {
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const [lists,        setLists]        = useState<WatchlistSummary[]>([]);
  const [selected,     setSelected]     = useState<WatchlistDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [detailLoading,setDetailLoading]= useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [showNewList,  setShowNewList]  = useState(false);
  const [editingList,  setEditingList]  = useState(false);
  const [showAddItem,  setShowAddItem]  = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    loadLists();
  }, [accessToken]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const data = await apiGetWatchlists(accessToken!);
      setLists(data);
      if (data.length > 0 && !selected) {
        await loadDetail(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await apiGetWatchlist(accessToken!, id);
      setSelected(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateList = async (name: string, memo: string) => {
    const created = await apiCreateWatchlist(accessToken!, { name, memo });
    setLists(prev => [created, ...prev]);
    setSelected(created);
    setShowNewList(false);
  };

  const handleUpdateList = async (name: string, memo: string) => {
    if (!selected) return;
    const updated = await apiUpdateWatchlist(accessToken!, selected.id, { name, memo });
    setSelected(prev => prev ? { ...prev, name: updated.name, memo: updated.memo } : prev);
    setLists(prev => prev.map(l => l.id === updated.id ? { ...l, name: updated.name, memo: updated.memo } : l));
    setEditingList(false);
  };

  const handleDeleteList = async () => {
    if (!selected) return;
    if (!confirm(`「${selected.name}」を削除しますか？`)) return;
    await apiDeleteWatchlist(accessToken!, selected.id);
    const remaining = lists.filter(l => l.id !== selected.id);
    setLists(remaining);
    setSelected(null);
    if (remaining.length > 0) await loadDetail(remaining[0].id);
  };

  const handleAddItem = async (code: string, targetPrice: number, memo: string) => {
    if (!selected) return;
    const item = await apiAddWatchlistItem(accessToken!, selected.id, {
      company_code_input: code,
      target_price: targetPrice,
      memo,
    });
    setSelected(prev => prev ? { ...prev, items: [...prev.items, item], item_count: prev.item_count + 1 } : prev);
    setLists(prev => prev.map(l => l.id === selected.id ? { ...l, item_count: l.item_count + 1 } : l));
    setShowAddItem(false);
  };

  const handleItemUpdated = (updated: WatchlistItem) => {
    setSelected(prev => prev
      ? { ...prev, items: prev.items.map(i => i.id === updated.id ? updated : i) }
      : prev
    );
  };

  const handleItemDeleted = (id: number) => {
    setSelected(prev => {
      if (!prev) return prev;
      const items = prev.items.filter(i => i.id !== id);
      return { ...prev, items, item_count: items.length };
    });
    setLists(prev => prev.map(l => l.id === selected?.id ? { ...l, item_count: l.item_count - 1 } : l));
  };

  const handleRefresh = async () => {
    if (!selected) return;
    setRefreshing(true);
    try {
      const result = await apiRefreshWatchlistItems(accessToken!, selected.id);
      const { items, item_count } = result.watchlist;
      const alertCount = items.filter(i => i.alert_status !== 'none').length;
      setSelected(prev => prev ? { ...prev, items, item_count, alert_count: alertCount } : prev);
      setLists(prev => prev.map(l => l.id === selected.id ? { ...l, alert_count: alertCount } : l));
    } finally {
      setRefreshing(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="page-center">
        <div className="error-box" style={{ borderColor: 'var(--accent)' }}>
          <p className="error-title" style={{ color: 'var(--accent)' }}>ログインが必要です</p>
          <p className="error-msg">ウォッチリストはログイン後にご利用いただけます。</p>
          <Link to="/login" className="auth-btn" style={{ marginTop: 14, display: 'block', textAlign: 'center' }}>
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-center"><div className="spinner" /></div>;

  const alertItems = selected?.items.filter(i => i.alert_status !== 'none') ?? [];

  return (
    <div className="wl-page">
      {/* 左: リスト一覧 */}
      <aside className="wl-sidebar">
        <div className="wl-sidebar-header">
          <span className="wl-sidebar-title">ウォッチリスト</span>
          <button className="wl-new-btn" onClick={() => setShowNewList(true)} title="新規作成">＋</button>
        </div>

        {showNewList && (
          <ListForm
            initial={{ name: '', memo: '' }}
            onSave={handleCreateList}
            onCancel={() => setShowNewList(false)}
          />
        )}

        <ul className="wl-list">
          {lists.map(l => (
            <li
              key={l.id}
              className={`wl-list-item ${selected?.id === l.id ? 'active' : ''}`}
              onClick={() => loadDetail(l.id)}
            >
              <div className="wl-list-item-name">{l.name}</div>
              <div className="wl-list-item-meta">
                <span className="wl-list-item-count">{l.item_count}銘柄</span>
                {l.alert_count > 0 && (
                  <span className="wl-list-alert-badge">{l.alert_count}件のアラート</span>
                )}
              </div>
            </li>
          ))}
          {lists.length === 0 && (
            <li className="wl-empty-hint">リストを作成してください</li>
          )}
        </ul>
      </aside>

      {/* 右: 選択中リストの詳細 */}
      <div className="wl-main">
        {!selected ? (
          <div className="wl-empty">
            <p>ウォッチリストを選択するか、新規作成してください。</p>
          </div>
        ) : detailLoading ? (
          <div className="page-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* ヘッダー */}
            <div className="wl-main-header">
              <div className="wl-main-title-area">
                {editingList ? (
                  <ListForm
                    initial={{ name: selected.name, memo: selected.memo }}
                    onSave={handleUpdateList}
                    onCancel={() => setEditingList(false)}
                  />
                ) : (
                  <>
                    <div>
                      <h2 className="wl-main-title">{selected.name}</h2>
                      {selected.memo && <p className="wl-main-memo">{selected.memo}</p>}
                    </div>
                    <div className="wl-main-actions">
                      <button className="wl-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
                        {refreshing ? '更新中...' : '🔄 株価更新'}
                      </button>
                      <button className="wl-edit-btn" onClick={() => setEditingList(true)}>編集</button>
                      <button className="wl-del-btn" onClick={handleDeleteList}>削除</button>
                    </div>
                  </>
                )}
              </div>

              {/* アラートサマリー */}
              {alertItems.length > 0 && (
                <div className="wl-alert-summary">
                  {alertItems.map(item => (
                    <div key={item.id} className="wl-alert-row">
                      <span
                        className="wl-alert-dot"
                        style={{ color: ALERT_META[item.alert_status].color }}
                      >
                        {ALERT_META[item.alert_status].icon}
                      </span>
                      <span className="wl-alert-row-name">{item.company_name}</span>
                      <span className="wl-alert-row-label" style={{ color: ALERT_META[item.alert_status].color }}>
                        {item.alert_label}
                        {item.price_diff_pct != null && ` (${item.price_diff_pct.toFixed(1)}%)`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* アイテム追加ボタン */}
            <div className="wl-items-header">
              <span className="wl-items-count">{selected.item_count}銘柄</span>
              <button className="wl-add-item-btn" onClick={() => setShowAddItem(v => !v)}>
                {showAddItem ? 'キャンセル' : '＋ 銘柄を追加'}
              </button>
            </div>

            {showAddItem && (
              <AddItemForm
                onAdd={handleAddItem}
                onCancel={() => setShowAddItem(false)}
              />
            )}

            {/* アイテム一覧 */}
            <div className="wl-items-list">
              {selected.items.length === 0 ? (
                <p className="wl-empty-hint">銘柄を追加してください。</p>
              ) : (
                selected.items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    listId={selected.id}
                    token={accessToken!}
                    onUpdated={handleItemUpdated}
                    onDeleted={handleItemDeleted}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
