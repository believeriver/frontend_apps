import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { apiGetMyPosts, apiDeletePost } from '../../api/techlog';
import { TechPostSummary } from '../../types/techlog';

export default function TechlogMyPage() {
  const navigate = useNavigate();
  const { accessToken } = useSelector((s: RootState) => s.auth);
  const [posts,   setPosts]   = useState<TechPostSummary[]>([]);
  const [filter,  setFilter]  = useState<'all' | 'published' | 'draft'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) { navigate('/login'); return; }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    const params = filter === 'all' ? {} : { status: filter as 'published' | 'draft' };
    apiGetMyPosts(params, accessToken)
      .then((res) => setPosts(res))
      .finally(() => setLoading(false));
  }, [accessToken, filter]);

  const handleDelete = async (id: string, title: string) => {
    if (!accessToken || !confirm(`「${title}」を削除しますか？`)) return;
    await apiDeletePost(id, accessToken);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="tl-my-page">
      <div className="tl-my-header">
        <h1 className="tl-my-title">マイ記事</h1>
        <button className="tl-write-btn" onClick={() => navigate('/techlog/new')}>
          ✏️ 新規作成
        </button>
      </div>

      <div className="tl-my-filters">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            className={`tl-sort-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'すべて' : f === 'published' ? '公開済み' : '下書き'}
          </button>
        ))}
        <span className="tl-list-count">{posts.length} 件</span>
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="tl-empty">記事がありません</div>
      ) : (
        <div className="tl-my-list">
          {posts.map((p) => (
            <div key={p.id} className="tl-my-item">
              <div className="tl-my-item-info">
                <div className="tl-my-item-meta">
                  <span className={`tl-status-badge ${p.status}`}>
                    {p.status === 'published' ? '公開' : '下書き'}
                  </span>
                  {p.category && <span className="tl-category-badge">{p.category.name}</span>}
                  <span className="tl-date">{new Date(p.updated_at).toLocaleDateString('ja-JP')}</span>
                </div>
                <h3
                  className="tl-my-item-title"
                  onClick={() => navigate(`/techlog/${p.id}`)}
                >{p.title}</h3>
                <div className="tl-card-tags">
                  {p.tags.map((t) => <span key={t.id} className="tl-tag">#{t.name}</span>)}
                </div>
                <div className="tl-card-stats">
                  <span className="tl-stat">👁 {p.views}</span>
                  <span className="tl-stat">❤️ {p.like_count}</span>
                  <span className="tl-stat">💬 {p.comment_count}</span>
                </div>
              </div>
              <div className="tl-my-item-actions">
                <button className="tl-edit-btn" onClick={() => navigate(`/techlog/${p.id}/edit`)}>編集</button>
                <button className="pf-delete-btn" onClick={() => handleDelete(p.id, p.title)}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
