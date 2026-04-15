import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { apiGetBlogPosts, apiDeleteBlogPost } from '../../api/blog';
import type { BlogPostSummary } from '../../types/blog';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '.');
}

const STATUS_LABEL: Record<string, string> = {
  published: '公開',
  draft:     '下書き',
  archived:  'アーカイブ',
};
const STATUS_COLOR: Record<string, string> = {
  published: 'var(--positive)',
  draft:     'var(--text-dim)',
  archived:  'var(--text-dim)',
};

export default function BlogManagePage() {
  const navigate = useNavigate();
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const [posts,   setPosts]   = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    // ステータスごとに並べて表示するためすべて取得
    Promise.all([
      apiGetBlogPosts({ status: 'draft' },     accessToken),
      apiGetBlogPosts({ status: 'published' }, accessToken),
      apiGetBlogPosts({ status: 'archived' },  accessToken),
    ])
      .then(([drafts, published, archived]) => {
        setPosts([...drafts, ...published, ...archived]);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!accessToken) {
    return <div className="page-center">ログインが必要です。</div>;
  }

  const handleDelete = async (post: BlogPostSummary) => {
    if (!confirm(`「${post.title}」を削除しますか？`)) return;
    await apiDeleteBlogPost(post.id, accessToken!);
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  const counts = {
    all:       posts.length,
    draft:     posts.filter(p => p.status === 'draft').length,
    published: posts.filter(p => p.status === 'published').length,
    archived:  posts.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="bl-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--bl-text)' }}>記事管理</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="bl-back-btn" style={{ margin: 0 }} onClick={() => navigate('/blog')}>← 一覧へ</button>
          <button className="ble-save-btn primary" onClick={() => navigate('/blog/new')}>✏️ 新規投稿</button>
        </div>
      </div>

      {/* フィルタータブ */}
      <div className="blm-tabs">
        {(['all', 'draft', 'published', 'archived'] as const).map(s => (
          <button
            key={s}
            className={`blm-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'すべて' : STATUS_LABEL[s]}
            <span className="blm-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="bl-empty">記事がありません</div>
      ) : (
        <div className="blm-list">
          {filtered.map(post => (
            <div key={post.id} className="blm-row">
              <div className="blm-row-main">
                <span
                  className="blm-status"
                  style={{ color: STATUS_COLOR[post.status] }}
                >
                  ● {STATUS_LABEL[post.status]}
                </span>
                <span className="blm-cat">{post.category?.name}</span>
                <h3
                  className="blm-title"
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  {post.title}
                </h3>
              </div>
              <div className="blm-row-meta">
                <span className="blm-date">{formatDate(post.updated_at)}</span>
                <span className="blm-stat">👁 {post.views}</span>
                <span className="blm-stat">❤️ {post.like_count}</span>
                <span className="blm-stat">💬 {post.comment_count}</span>
              </div>
              <div className="blm-row-actions">
                <button
                  className="bl-btn-ghost sm"
                  onClick={() => navigate(`/blog/${post.id}/edit`)}
                >編集</button>
                <button
                  className="bl-btn-ghost sm danger"
                  onClick={() => handleDelete(post)}
                >削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
