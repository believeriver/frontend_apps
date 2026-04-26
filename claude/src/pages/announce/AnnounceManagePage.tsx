import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import {
  apiGetAnnounces, apiCreateAnnounce, apiUpdateAnnounce, apiDeleteAnnounce,
  apiGetChangelogs, apiCreateChangelog, apiUpdateChangelog, apiDeleteChangelog,
} from '../../api/announce';
import type { Announce, AnnounceInput, Changelog, ChangelogInput } from '../../types/announce';
import { ANNOUNCE_TYPE_COLOR, CHANGELOG_TYPE_COLOR } from '../../types/announce';

type Tab = 'announce' | 'changelog';

const ANNOUNCE_TYPES = ['info', 'maintenance', 'feature', 'bugfix', 'warning'] as const;
const ANNOUNCE_STATUSES = ['draft', 'published', 'archived'] as const;
const CHANGELOG_TYPES = ['feature', 'improve', 'bugfix', 'security', 'infra', 'breaking'] as const;

const emptyAnnounce = (): AnnounceInput => ({
  title: '', content: '', type: 'info', status: 'draft', is_pinned: false, start_at: null, end_at: null,
});
const emptyChangelog = (): ChangelogInput => ({
  version: '', type: 'feature', title: '', content: '',
  released_at: new Date().toISOString().slice(0, 10) + 'T00:00:00+09:00',
});

// ── お知らせフォーム ────────────────────────────────────────
function AnnounceForm({
  initial, onSave, onCancel,
}: {
  initial: AnnounceInput;
  onSave: (data: AnnounceInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AnnounceInput>(initial);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof AnnounceInput, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="anm-form">
      <div className="anm-form-field">
        <label>タイトル</label>
        <input className="anm-input" value={form.title} onChange={e => set('title', e.target.value)} required />
      </div>
      <div className="anm-form-row">
        <div className="anm-form-field">
          <label>タイプ</label>
          <select className="anm-select" value={form.type} onChange={e => set('type', e.target.value)}>
            {ANNOUNCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="anm-form-field">
          <label>ステータス</label>
          <select className="anm-select" value={form.status} onChange={e => set('status', e.target.value)}>
            {ANNOUNCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="anm-form-field anm-checkbox-field">
          <label>
            <input type="checkbox" checked={form.is_pinned} onChange={e => set('is_pinned', e.target.checked)} />
            　ピン留め
          </label>
        </div>
      </div>
      <div className="anm-form-row">
        <div className="anm-form-field">
          <label>開始日時（任意）</label>
          <input type="datetime-local" className="anm-input"
            value={form.start_at?.slice(0, 16) ?? ''}
            onChange={e => set('start_at', e.target.value ? e.target.value + ':00+09:00' : null)} />
        </div>
        <div className="anm-form-field">
          <label>終了日時（任意）</label>
          <input type="datetime-local" className="anm-input"
            value={form.end_at?.slice(0, 16) ?? ''}
            onChange={e => set('end_at', e.target.value ? e.target.value + ':00+09:00' : null)} />
        </div>
      </div>
      <div className="anm-form-field">
        <label>本文（Markdown）</label>
        <textarea className="anm-textarea" rows={8} value={form.content}
          onChange={e => set('content', e.target.value)} />
      </div>
      <div className="anm-form-actions">
        <button className="anm-cancel-btn" onClick={onCancel}>キャンセル</button>
        <button className="anm-save-btn" disabled={saving} onClick={async () => {
          setSaving(true);
          await onSave(form);
          setSaving(false);
        }}>
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}

// ── 変更履歴フォーム ────────────────────────────────────────
function ChangelogForm({
  initial, onSave, onCancel,
}: {
  initial: ChangelogInput;
  onSave: (data: ChangelogInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ChangelogInput>(initial);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ChangelogInput, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="anm-form">
      <div className="anm-form-row">
        <div className="anm-form-field">
          <label>バージョン</label>
          <input className="anm-input" value={form.version} placeholder="v1.0.0"
            onChange={e => set('version', e.target.value)} />
        </div>
        <div className="anm-form-field">
          <label>タイプ</label>
          <select className="anm-select" value={form.type} onChange={e => set('type', e.target.value)}>
            {CHANGELOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="anm-form-field">
          <label>リリース日</label>
          <input type="date" className="anm-input"
            value={form.released_at.slice(0, 10)}
            onChange={e => set('released_at', e.target.value + 'T00:00:00+09:00')} />
        </div>
      </div>
      <div className="anm-form-field">
        <label>タイトル</label>
        <input className="anm-input" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div className="anm-form-field">
        <label>本文（Markdown）</label>
        <textarea className="anm-textarea" rows={8} value={form.content}
          onChange={e => set('content', e.target.value)} />
      </div>
      <div className="anm-form-actions">
        <button className="anm-cancel-btn" onClick={onCancel}>キャンセル</button>
        <button className="anm-save-btn" disabled={saving} onClick={async () => {
          setSaving(true);
          await onSave(form);
          setSaving(false);
        }}>
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}

// ── メインページ ────────────────────────────────────────────
export default function AnnounceManagePage() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { accessToken, isSuperuser } = useSelector((s: RootState) => s.auth);

  const [tab,        setTab]        = useState<Tab>('announce');
  const [announces,  setAnnounces]  = useState<Announce[]>([]);
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editAnn,    setEditAnn]    = useState<Announce | null>(null);
  const [editCl,     setEditCl]     = useState<Changelog | null>(null);

  useEffect(() => {
    if (!isSuperuser || !accessToken) { navigate('/', { replace: true }); return; }
    reload();
  }, [accessToken, isSuperuser, navigate]);

  const reload = () => {
    setLoading(true);
    Promise.all([
      apiGetAnnounces({ all: 'true' }, accessToken!),
      apiGetChangelogs(),
    ]).then(([a, c]) => { setAnnounces(a); setChangelogs(c); })
      .finally(() => setLoading(false));
  };

  // お知らせ保存
  const saveAnnounce = async (data: AnnounceInput) => {
    if (editAnn) {
      await apiUpdateAnnounce(accessToken!, editAnn.id, data);
    } else {
      await apiCreateAnnounce(accessToken!, data);
    }
    setShowForm(false); setEditAnn(null); reload();
  };

  // 変更履歴保存
  const saveChangelog = async (data: ChangelogInput) => {
    if (editCl) {
      await apiUpdateChangelog(accessToken!, editCl.id, data);
    } else {
      await apiCreateChangelog(accessToken!, data);
    }
    setShowForm(false); setEditCl(null); reload();
  };

  const deleteAnnounce = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await apiDeleteAnnounce(accessToken!, id);
    reload();
  };

  const deleteChangelog = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await apiDeleteChangelog(accessToken!, id);
    reload();
  };

  return (
    <div className="lp-root">
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-grid" />

      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand" style={{ textDecoration: 'none' }}>◈ believeriver</Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link to="/announce" className="lp-nav-login">公開ページ</Link>
          <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <div className="anm-page">
        <div className="anm-header">
          <h1 className="legal-title">お知らせ管理</h1>
          <button className="anm-new-btn" onClick={() => { setShowForm(true); setEditAnn(null); setEditCl(null); }}>
            ＋ 新規作成
          </button>
        </div>

        <div className="an-tabs">
          <button className={`an-tab ${tab === 'announce' ? 'active' : ''}`} onClick={() => { setTab('announce'); setShowForm(false); }}>
            📢 お知らせ <span className="an-tab-count">{announces.length}</span>
          </button>
          <button className={`an-tab ${tab === 'changelog' ? 'active' : ''}`} onClick={() => { setTab('changelog'); setShowForm(false); }}>
            📋 変更履歴 <span className="an-tab-count">{changelogs.length}</span>
          </button>
        </div>

        {/* フォーム */}
        {showForm && tab === 'announce' && (
          <AnnounceForm
            initial={editAnn ? { title: editAnn.title, content: editAnn.content, type: editAnn.type, status: editAnn.status, is_pinned: editAnn.is_pinned, start_at: editAnn.start_at, end_at: editAnn.end_at } : emptyAnnounce()}
            onSave={saveAnnounce}
            onCancel={() => { setShowForm(false); setEditAnn(null); }}
          />
        )}
        {showForm && tab === 'changelog' && (
          <ChangelogForm
            initial={editCl ? { version: editCl.version, type: editCl.type, title: editCl.title, content: editCl.content, released_at: editCl.released_at } : emptyChangelog()}
            onSave={saveChangelog}
            onCancel={() => { setShowForm(false); setEditCl(null); }}
          />
        )}

        {/* 一覧 */}
        {loading ? <p className="an-empty">読み込み中...</p> : (
          <div className="anm-list">
            {tab === 'announce' && announces.map(a => (
              <div key={a.id} className="anm-row">
                <div className="anm-row-left">
                  {a.is_pinned && <span className="an-pin">📌</span>}
                  <span className="an-badge" style={{ background: ANNOUNCE_TYPE_COLOR[a.type] + '22', color: ANNOUNCE_TYPE_COLOR[a.type], border: `1px solid ${ANNOUNCE_TYPE_COLOR[a.type]}55` }}>
                    {a.type_label}
                  </span>
                  <span className="anm-row-status" style={{ color: a.status === 'published' ? '#3fb950' : a.status === 'draft' ? '#8b949e' : '#d29922' }}>
                    {a.status_label}
                  </span>
                  <span className="anm-row-title">{a.title}</span>
                </div>
                <div className="anm-row-right">
                  <span className="an-card-date">{new Date(a.created_at).toLocaleDateString('ja-JP')}</span>
                  <button className="anm-edit-btn" onClick={() => { setEditAnn(a); setShowForm(true); }}>編集</button>
                  <button className="anm-del-btn" onClick={() => deleteAnnounce(a.id)}>削除</button>
                </div>
              </div>
            ))}
            {tab === 'changelog' && changelogs.map(c => (
              <div key={c.id} className="anm-row">
                <div className="anm-row-left">
                  <span className="an-version">{c.version}</span>
                  <span className="an-badge" style={{ background: CHANGELOG_TYPE_COLOR[c.type] + '22', color: CHANGELOG_TYPE_COLOR[c.type], border: `1px solid ${CHANGELOG_TYPE_COLOR[c.type]}55` }}>
                    {c.type_label}
                  </span>
                  <span className="anm-row-title">{c.title}</span>
                </div>
                <div className="anm-row-right">
                  <span className="an-card-date">{new Date(c.released_at).toLocaleDateString('ja-JP')}</span>
                  <button className="anm-edit-btn" onClick={() => { setEditCl(c); setShowForm(true); }}>編集</button>
                  <button className="anm-del-btn" onClick={() => deleteChangelog(c.id)}>削除</button>
                </div>
              </div>
            ))}
            {tab === 'announce' && announces.length === 0 && <p className="an-empty">お知らせはありません。</p>}
            {tab === 'changelog' && changelogs.length === 0 && <p className="an-empty">変更履歴はありません。</p>}
          </div>
        )}
      </div>

      <footer className="lp-footer">
        <p>© 2025 believeriver · <Link to="/">← トップへ戻る</Link></p>
      </footer>
    </div>
  );
}
