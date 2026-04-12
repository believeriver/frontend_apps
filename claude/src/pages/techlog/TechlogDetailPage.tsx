import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import MarkdownRenderer from '../../components/techlog/MarkdownRenderer';
import { loadPostDetail, clearDetail, updateLike, addComment, updateComment, removeComment } from '../../store/techlogSlice';
import { apiLikePost, apiUnlikePost, apiAddComment, apiUpdateComment, apiDeleteComment } from '../../api/techlog';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return new Date(iso).toLocaleDateString('ja-JP');
}

export default function TechlogDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();
  const { detail, detailLoading } = useSelector((s: RootState) => s.techlog);
  const { accessToken, email } = useSelector((s: RootState) => s.auth);

  const [commentText,    setCommentText]    = useState('');
  const [editingId,      setEditingId]      = useState<number | null>(null);
  const [editingText,    setEditingText]    = useState('');
  const [likeLoading,    setLikeLoading]    = useState(false);
  const [commentSending, setCommentSending] = useState(false);

  useEffect(() => {
    if (uuid) dispatch(loadPostDetail(uuid));
    return () => { dispatch(clearDetail()); };
  }, [uuid, dispatch]);

  const handleLike = async () => {
    if (!accessToken || !detail || likeLoading) return;
    setLikeLoading(true);
    try {
      const isLiked = detail.is_liked ?? false;
      if (isLiked) {
        await apiUnlikePost(detail.id, accessToken);
        dispatch(updateLike({ id: detail.id, liked: false, count: detail.like_count - 1 }));
      } else {
        await apiLikePost(detail.id, accessToken);
        dispatch(updateLike({ id: detail.id, liked: true, count: detail.like_count + 1 }));
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !detail || !commentText.trim()) return;
    setCommentSending(true);
    try {
      const c = await apiAddComment(detail.id, commentText.trim(), accessToken);
      dispatch(addComment(c));
      setCommentText('');
    } finally {
      setCommentSending(false);
    }
  };

  const handleUpdateComment = async (id: number) => {
    if (!accessToken || !detail || !editingText.trim()) return;
    const c = await apiUpdateComment(detail.id, id, editingText.trim(), accessToken);
    dispatch(updateComment(c));
    setEditingId(null);
  };

  const handleDeleteComment = async (id: number) => {
    if (!accessToken || !detail) return;
    if (!confirm('コメントを削除しますか？')) return;
    await apiDeleteComment(detail.id, id, accessToken);
    dispatch(removeComment(id));
  };

  if (detailLoading) return <div className="page-center"><div className="spinner" /></div>;
  if (!detail)       return <div className="page-center"><p className="error-msg">記事が見つかりません</p></div>;

  const isAuthor = email === detail.author.email;
  const comments = detail.comments ?? [];

  return (
    <div className="tl-detail-layout">
      <div className="tl-detail-main">
        {/* 記事ヘッダー */}
        <div className="tl-detail-header">
          <div className="tl-detail-meta">
            <span className="tl-author">{detail.author.username || detail.author.email}</span>
            <span className="tl-date">{timeAgo(detail.created_at)}</span>
            {detail.category && <span className="tl-category-badge">{detail.category.name}</span>}
          </div>
          <h1 className="tl-detail-title">{detail.title}</h1>
          <div className="tl-card-tags">
            {detail.tags.map((t) => (
              <span key={t.id} className="tl-tag">#{t.name}</span>
            ))}
          </div>
          <div className="tl-detail-actions">
            <div className="tl-detail-stats">
              <span className="tl-stat">👁 {detail.views.toLocaleString()}</span>
              <button
                className={`tl-like-btn ${detail.is_liked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={!accessToken || likeLoading}
                title={accessToken ? (detail.is_liked ? 'いいねを取り消す' : 'いいね') : 'ログインが必要です'}
              >
                {detail.is_liked ? '❤️' : '🤍'} {detail.like_count}
              </button>
            </div>
            {isAuthor && (
              <div className="tl-author-actions">
                <button className="tl-edit-btn" onClick={() => navigate(`/techlog/${detail.id}/edit`)}>
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 本文 */}
        <div className="tl-markdown-body">
          <MarkdownRenderer content={detail.content} />
        </div>

        {/* コメント */}
        <div className="tl-comments">
          <h3 className="tl-comments-title">コメント ({comments.length})</h3>

          {accessToken && (
            <form onSubmit={handleAddComment} className="tl-comment-form">
              <textarea
                className="tl-comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="コメントを入力..."
                rows={3}
              />
              <button type="submit" className="tl-comment-submit" disabled={commentSending || !commentText.trim()}>
                {commentSending ? '送信中...' : '送信'}
              </button>
            </form>
          )}

          <div className="tl-comment-list">
            {comments.map((c) => (
              <div key={c.id} className="tl-comment">
                <div className="tl-comment-meta">
                  <span className="tl-author">{c.author.username || c.author.email}</span>
                  <span className="tl-date">{timeAgo(c.created_at)}</span>
                </div>
                {editingId === c.id ? (
                  <div className="tl-comment-edit">
                    <textarea
                      className="tl-comment-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                    />
                    <div className="tl-comment-edit-actions">
                      <button className="tl-comment-submit" onClick={() => handleUpdateComment(c.id)}>更新</button>
                      <button className="tl-comment-cancel" onClick={() => setEditingId(null)}>キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="tl-comment-text">{c.content}</p>
                    {email === c.author.email && (
                      <div className="tl-comment-actions">
                        <button className="tl-comment-action-btn" onClick={() => { setEditingId(c.id); setEditingText(c.content); }}>編集</button>
                        <button className="tl-comment-action-btn danger" onClick={() => handleDeleteComment(c.id)}>削除</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右サイドバー */}
      <aside className="tl-detail-sidebar">
        <div className="tl-author-card">
          <div className="tl-author-avatar">
            {(detail.author.username || detail.author.email)[0].toUpperCase()}
          </div>
          <div className="tl-author-name">{detail.author.username || detail.author.email}</div>
          <div className="tl-author-stats">
            <span className="tl-stat">👁 {detail.views}</span>
            <span className="tl-stat">❤️ {detail.like_count}</span>
          </div>
        </div>
        <button className="tl-back-btn" onClick={() => navigate('/techlog')}>
          ← 一覧へ戻る
        </button>
      </aside>
    </div>
  );
}
