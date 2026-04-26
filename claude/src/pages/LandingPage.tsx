import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../hooks/useTheme';
import { logout } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store';
import { apiGetAnnounces, apiGetChangelogs } from '../api/announce';
import type { Announce, Changelog } from '../types/announce';
import { ANNOUNCE_TYPE_COLOR, CHANGELOG_TYPE_COLOR } from '../types/announce';

// ── GitHub SVG Icon ──────────────────────────────────────────
function GitHubIcon() {
  return (
    <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
        -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07
        -.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
        -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
        .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
        .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
        0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// ── アプリ定義 ────────────────────────────────────────────────
const APPS = [
  {
    to: '/ir',
    icon: '📈',
    title: 'IR Dashboard',
    desc: '高配当株のスクリーニング・ランキング、ポートフォリオ管理、配当・NISA分析',
    tags: ['株価', '配当利回り', 'NISA', 'ポートフォリオ'],
    color: '#58a6ff',
    glow: 'rgba(88,166,255,0.25)',
    border: 'rgba(88,166,255,0.4)',
    disabled: false,
  },
  {
    to: '/techlog',
    icon: '✍️',
    title: 'TechBlog',
    desc: 'Markdown・LaTeX・Mermaid対応の技術記事投稿・共有プラットフォーム',
    tags: ['Markdown', 'シンタックスハイライト', 'LaTeX', 'Mermaid'],
    color: '#3fb950',
    glow: 'rgba(63,185,80,0.25)',
    border: 'rgba(63,185,80,0.4)',
    disabled: false,
  },
  {
    to: '/blog',
    icon: '📝',
    title: 'Blog',
    desc: '日記・ランニング・読書など日々の記録をまとめたエディトリアルブログ',
    tags: ['journal', 'running', 'reading', 'note'],
    color: '#d29922',
    glow: 'rgba(210,153,34,0.25)',
    border: 'rgba(210,153,34,0.4)',
    disabled: false,
  },
  {
    to: '/analytics',
    icon: '📊',
    title: 'Analytics',
    desc: 'サイト全体のアクセス解析・セキュリティログ管理（管理者専用）',
    tags: ['アクセスログ', 'セキュリティ', 'CSV出力'],
    color: '#bc8cff',
    glow: 'rgba(188,140,255,0.25)',
    border: 'rgba(188,140,255,0.4)',
    disabled: false,
    adminOnly: true,
  },
] as const;

// ── Landing Page ──────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, email, isSuperuser } = useSelector((s: RootState) => s.auth);
  const visibleApps = APPS.filter(app => !('adminOnly' in app && app.adminOnly) || isSuperuser);

  const [announces,  setAnnounces]  = useState<Announce[]>([]);
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);

  useEffect(() => {
    apiGetAnnounces().then(a => setAnnounces(a.slice(0, 3)));
    apiGetChangelogs().then(c => setChangelogs(c.slice(0, 3)));
  }, []);

  const handleLogout = () => { dispatch(logout()); };
  return (
    <div className="lp-root">
      {/* 背景装飾 */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div className="lp-grid" />

      {/* ナビ */}
      <nav className="lp-nav">
        <Link to="/profile" className="lp-nav-brand" style={{ textDecoration: 'none' }}>◈ believeriver</Link>
        <Link to="/profile" className="lp-nav-profile">About</Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {isSuperuser && (
            <a
              href="https://github.com/believeriver"
              target="_blank"
              rel="noreferrer"
              className="lp-nav-github"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
          )}
          {accessToken ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="lp-nav-user">{email ?? 'ログイン中'}</span>
              <Link to="/settings" className="lp-nav-login">設定</Link>
              <button className="lp-nav-logout" onClick={handleLogout}>ログアウト</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link to="/login"    className="lp-nav-login">ログイン</Link>
              <Link to="/register" className="lp-nav-register">新規登録</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="lp-hero">
        <div className="lp-eyebrow">nonoco.believeriver.site</div>
        <h1 className="lp-title">
          <span className="lp-title-grad">believeriver</span>
        </h1>
        <p className="lp-tagline">個人開発アプリのポータルサイト</p>
        <p className="lp-sub">フルスタック個人開発 — Django REST × React / TypeScript</p>
      </section>

      {/* アプリカード */}
      <section className="lp-cards">
        {visibleApps.map((app) => (
          <Link
            key={app.to}
            to={app.to}
            className="lp-card"
            style={{
              '--lc-color':  app.color,
              '--lc-glow':   app.glow,
              '--lc-border': app.border,
            } as React.CSSProperties}
          >
            <div className="lc-shine" />
            <div className="lc-icon-wrap">
              <span className="lc-icon">{app.icon}</span>
            </div>
            <div className="lc-body">
              <h2 className="lc-title">{app.title}</h2>
              <p className="lc-desc">{app.desc}</p>
              <div className="lc-tags">
                {app.tags.map((t) => (
                  <span key={t} className="lc-tag">{t}</span>
                ))}
              </div>
            </div>
            <div className="lc-arrow">→</div>
          </Link>
        ))}

        {/* 管理者専用カード */}
        {isSuperuser && (
          <Link
            to="/announce/manage"
            className="lp-card"
            style={{
              '--lc-color':  '#79c0ff',
              '--lc-glow':   'rgba(121,192,255,0.25)',
              '--lc-border': 'rgba(121,192,255,0.4)',
            } as React.CSSProperties}
          >
            <div className="lc-shine" />
            <div className="lc-icon-wrap"><span className="lc-icon">📝</span></div>
            <div className="lc-body">
              <h2 className="lc-title">お知らせ管理</h2>
              <p className="lc-desc">お知らせ・変更履歴の登録・編集・削除（管理者専用）</p>
              <div className="lc-tags">
                {['お知らせ', '変更履歴', '管理者'].map(t => <span key={t} className="lc-tag">{t}</span>)}
              </div>
            </div>
            <div className="lc-arrow">→</div>
          </Link>
        )}
        {isSuperuser && (
          <Link
            to="/contact/manage"
            className="lp-card"
            style={{
              '--lc-color':  '#ff7b72',
              '--lc-glow':   'rgba(255,123,114,0.25)',
              '--lc-border': 'rgba(255,123,114,0.4)',
            } as React.CSSProperties}
          >
            <div className="lc-shine" />
            <div className="lc-icon-wrap">
              <span className="lc-icon">✉️</span>
            </div>
            <div className="lc-body">
              <h2 className="lc-title">お問い合わせ管理</h2>
              <p className="lc-desc">ユーザーからのお問い合わせの確認・返信・削除（管理者専用）</p>
              <div className="lc-tags">
                {['受信ボックス', '既読管理', '返信'].map(t => (
                  <span key={t} className="lc-tag">{t}</span>
                ))}
              </div>
            </div>
            <div className="lc-arrow">→</div>
          </Link>
        )}

        {/* Coming Soon */}
        <div className="lp-card lp-card-soon">
          <div className="lc-icon-wrap">
            <span className="lc-icon">🔜</span>
          </div>
          <div className="lc-body">
            <h2 className="lc-title" style={{ color: '#8b949e' }}>Coming Soon</h2>
            <p className="lc-desc">次のアプリを開発中...</p>
          </div>
        </div>
      </section>

      {/* お知らせ・変更履歴 */}
      {(announces.length > 0 || changelogs.length > 0) && (
        <section className="lp-info">
          {announces.length > 0 && (
            <div className="lp-info-col">
              <div className="lp-info-header">
                <span className="lp-info-title">📢 お知らせ</span>
                <Link to="/announce" className="lp-info-more">すべて見る →</Link>
              </div>
              <ul className="lp-info-list">
                {announces.map(a => (
                  <li key={a.id} className="lp-info-item">
                    <Link to="/announce" className="lp-info-link">
                      {a.is_pinned && <span className="lp-info-pin">📌</span>}
                      <span
                        className="lp-info-badge"
                        style={{ color: ANNOUNCE_TYPE_COLOR[a.type], borderColor: ANNOUNCE_TYPE_COLOR[a.type] + '55' }}
                      >{a.type_label}</span>
                      <span className="lp-info-text">{a.title}</span>
                      <span className="lp-info-date">
                        {new Date(a.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {changelogs.length > 0 && (
            <div className="lp-info-col">
              <div className="lp-info-header">
                <span className="lp-info-title">📋 変更履歴</span>
                <Link to="/announce" className="lp-info-more">すべて見る →</Link>
              </div>
              <ul className="lp-info-list">
                {changelogs.map(c => (
                  <li key={c.id} className="lp-info-item">
                    <Link to="/announce" className="lp-info-link">
                      <span className="lp-info-version">{c.version}</span>
                      <span
                        className="lp-info-badge"
                        style={{ color: CHANGELOG_TYPE_COLOR[c.type], borderColor: CHANGELOG_TYPE_COLOR[c.type] + '55' }}
                      >{c.type_label}</span>
                      <span className="lp-info-text">{c.title}</span>
                      <span className="lp-info-date">
                        {new Date(c.released_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* フッター */}
      <footer className="lp-footer">
        <p>
          © 2025 believeriver ·{' '}
          <a href="https://github.com/believeriver" target="_blank" rel="noreferrer">
            github.com/believeriver
          </a>{' '}
          · <Link to="/disclaimer">免責事項</Link>{' '}
          · <Link to="/privacy">プライバシーポリシー</Link>{' '}
          · <Link to="/contact">お問い合わせ</Link>
        </p>
      </footer>
    </div>
  );
}
