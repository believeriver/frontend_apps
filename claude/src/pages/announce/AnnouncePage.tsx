import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { apiGetAnnounces, apiGetChangelogs } from '../../api/announce';
import type { Announce, Changelog } from '../../types/announce';
import { ANNOUNCE_TYPE_COLOR, CHANGELOG_TYPE_COLOR } from '../../types/announce';
import MarkdownRenderer from '../../components/techlog/MarkdownRenderer';

type Tab = 'announce' | 'changelog';

function AnnounceCard({ item }: { item: Announce }) {
  const [open, setOpen] = useState(false);
  const color = ANNOUNCE_TYPE_COLOR[item.type];
  return (
    <div className={`an-card ${item.is_pinned ? 'pinned' : ''}`}>
      <div className="an-card-header" onClick={() => setOpen(o => !o)}>
        <div className="an-card-meta">
          {item.is_pinned && <span className="an-pin">📌</span>}
          <span className="an-badge" style={{ background: color + '22', color, border: `1px solid ${color}55` }}>
            {item.type_label}
          </span>
          <span className="an-card-title">{item.title}</span>
        </div>
        <div className="an-card-right">
          <span className="an-card-date">
            {new Date(item.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </span>
          <span className="an-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="an-card-body tl-markdown-body">
          <MarkdownRenderer content={item.content} />
          {(item.start_at || item.end_at) && (
            <p className="an-period">
              期間: {item.start_at ? new Date(item.start_at).toLocaleString('ja-JP') : '—'}
              　〜　{item.end_at ? new Date(item.end_at).toLocaleString('ja-JP') : '—'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ChangelogCard({ item }: { item: Changelog }) {
  const [open, setOpen] = useState(false);
  const color = CHANGELOG_TYPE_COLOR[item.type];
  const isBold = item.type === 'breaking';
  return (
    <div className="an-card">
      <div className="an-card-header" onClick={() => setOpen(o => !o)}>
        <div className="an-card-meta">
          <span className="an-version">{item.version}</span>
          <span className="an-badge" style={{ background: color + '22', color, border: `1px solid ${color}55`, fontWeight: isBold ? 700 : 400 }}>
            {item.type_label}
          </span>
          <span className="an-card-title">{item.title}</span>
        </div>
        <div className="an-card-right">
          <span className="an-card-date">
            {new Date(item.released_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </span>
          <span className="an-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="an-card-body tl-markdown-body">
          <MarkdownRenderer content={item.content} />
        </div>
      )}
    </div>
  );
}

export default function AnnouncePage() {
  const { theme, toggle } = useTheme();
  const { isSuperuser } = useSelector((s: RootState) => s.auth);
  const [tab,        setTab]        = useState<Tab>('announce');
  const [announces,  setAnnounces]  = useState<Announce[]>([]);
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      apiGetAnnounces(),
      apiGetChangelogs(),
    ]).then(([a, c]) => {
      setAnnounces(a);
      setChangelogs(c);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="lp-root">
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-grid" />

      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand" style={{ textDecoration: 'none' }}>◈ believeriver</Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isSuperuser && (
            <Link to="/announce/manage" className="lp-nav-login">管理</Link>
          )}
          <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <div className="an-page">
        <div className="an-page-header">
          <h1 className="legal-title">お知らせ・更新情報</h1>
        </div>

        <div className="an-tabs">
          <button className={`an-tab ${tab === 'announce' ? 'active' : ''}`} onClick={() => setTab('announce')}>
            📢 お知らせ
            {announces.length > 0 && <span className="an-tab-count">{announces.length}</span>}
          </button>
          <button className={`an-tab ${tab === 'changelog' ? 'active' : ''}`} onClick={() => setTab('changelog')}>
            📋 変更履歴
            {changelogs.length > 0 && <span className="an-tab-count">{changelogs.length}</span>}
          </button>
        </div>

        {loading ? (
          <p className="an-empty">読み込み中...</p>
        ) : tab === 'announce' ? (
          announces.length === 0
            ? <p className="an-empty">現在お知らせはありません。</p>
            : <div className="an-list">
                {announces.map(a => <AnnounceCard key={a.id} item={a} />)}
              </div>
        ) : (
          changelogs.length === 0
            ? <p className="an-empty">変更履歴はありません。</p>
            : <div className="an-list">
                {changelogs.map(c => <ChangelogCard key={c.id} item={c} />)}
              </div>
        )}
      </div>

      <footer className="lp-footer">
        <p>
          © 2025 believeriver ·{' '}
          <Link to="/disclaimer">免責事項</Link>{' '}
          · <Link to="/privacy">プライバシーポリシー</Link>{' '}
          · <Link to="/contact">お問い合わせ</Link>
        </p>
      </footer>
    </div>
  );
}
