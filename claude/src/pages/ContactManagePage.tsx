import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTheme } from '../hooks/useTheme';
import {
  apiGetContactList, apiPatchContact, apiDeleteContact,
  type ContactMessage,
} from '../api/contact';

export default function ContactManagePage() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { accessToken, isSuperuser } = useSelector((s: RootState) => s.auth);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter,   setFilter]   = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (!isSuperuser || !accessToken) {
      navigate('/', { replace: true });
      return;
    }
    apiGetContactList(accessToken)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [accessToken, isSuperuser, navigate]);

  const handleOpen = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.is_read && accessToken) {
      await apiPatchContact(accessToken, msg.id, { is_read: true });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
  };

  const handleDelete = async (id: number) => {
    if (!accessToken || !confirm('このメッセージを削除しますか？')) return;
    await apiDeleteContact(accessToken, id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = messages.filter(m =>
    filter === 'all'    ? true :
    filter === 'unread' ? !m.is_read :
                          m.is_read
  );

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="lp-root">
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-grid" />

      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand" style={{ textDecoration: 'none' }}>◈ believeriver</Link>
        <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <div className="cm-page">
        <div className="cm-header">
          <h1 className="cm-title">お問い合わせ管理</h1>
          <div className="cm-filter">
            {(['all', 'unread', 'read'] as const).map(f => (
              <button
                key={f}
                className={`cm-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? `すべて (${messages.length})` :
                 f === 'unread' ? `未読 (${unreadCount})` :
                 `既読 (${messages.length - unreadCount})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="cm-empty">読み込み中...</p>
        ) : filtered.length === 0 ? (
          <p className="cm-empty">メッセージはありません</p>
        ) : (
          <div className="cm-layout">
            {/* 一覧 */}
            <div className="cm-list">
              {filtered.map(msg => (
                <div
                  key={msg.id}
                  className={`cm-item ${selected?.id === msg.id ? 'active' : ''} ${!msg.is_read ? 'unread' : ''}`}
                  onClick={() => handleOpen(msg)}
                >
                  <div className="cm-item-top">
                    {!msg.is_read && <span className="cm-badge">未読</span>}
                    <span className="cm-item-name">{msg.name}</span>
                    <span className="cm-item-date">
                      {new Date(msg.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="cm-item-subject">{msg.subject}</div>
                  <div className="cm-item-preview">{msg.body.slice(0, 60)}{msg.body.length > 60 ? '…' : ''}</div>
                </div>
              ))}
            </div>

            {/* 詳細 */}
            <div className="cm-detail">
              {selected ? (
                <>
                  <div className="cm-detail-header">
                    <div>
                      <h2 className="cm-detail-subject">{selected.subject}</h2>
                      <div className="cm-detail-meta">
                        <span>{selected.name}</span>
                        <a href={`mailto:${selected.email}`} className="cm-detail-email">{selected.email}</a>
                        <span>{new Date(selected.created_at).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                    <button className="cm-delete-btn" onClick={() => handleDelete(selected.id)}>削除</button>
                  </div>
                  <div className="cm-detail-body">{selected.body}</div>
                  <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`} className="cm-reply-btn">
                    返信する →
                  </a>
                </>
              ) : (
                <p className="cm-empty">メッセージを選択してください</p>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="lp-footer">
        <p>© 2025 believeriver · <Link to="/">← トップへ戻る</Link></p>
      </footer>
    </div>
  );
}
