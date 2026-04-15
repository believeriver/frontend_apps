import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { loadBlogPost, loadBlogComments, updateLike, addComment, updateComment, removeComment } from '../../store/blogSlice';
import {
  apiLikeBlogPost, apiUnlikeBlogPost,
  apiAddBlogComment, apiUpdateBlogComment, apiDeleteBlogComment,
} from '../../api/blog';
import MarkdownRenderer from '../../components/techlog/MarkdownRenderer';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '.');
}

export default function BlogDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const dispatch  = useDispatch<AppDispatch>();
  const navigate  = useNavigate();
  const { detail, detailLoading, comments, commentsLoading } = useSelector((s: RootState) => s.blog);
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const [commentInput, setCommentInput] = useState('');
  const [editId,       setEditId]       = useState<number | null>(null);
  const [editInput,    setEditInput]    = useState('');
  const [likeLoading,  setLikeLoading]  = useState(false);

  useEffect(() => {
    if (!uuid) return;
    dispatch(loadBlogPost(uuid));
    dispatch(loadBlogComments(uuid));
  }, [uuid, dispatch]);

  if (detailLoading) return <div className="page-center"><div className="spinner" /></div>;
  if (!detail)       return <div className="page-center">記事が見つかりません</div>;

  // ── いいね ────────────────────────────────────────────────
  const handleLike = async () => {
    if (!accessToken || likeLoading) return;
    setLikeLoading(true);
    try {
      if (detail.is_liked) {
        const res = await apiUnlikeBlogPost(detail.id, accessToken);
        dispatch(updateLike({ liked: false, count: res.like_count }));
      } else {
        const res = await apiLikeBlogPost(detail.id, accessToken);
        dispatch(updateLike({ liked: true, count: res.like_count }));
      }
    } finally {
      setLikeLoading(false);
    }
  };

  // ── コメント ──────────────────────────────────────────────
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !commentInput.trim()) return;
    const c = await apiAddBlogComment(detail.id, commentInput.trim(), accessToken);
    dispatch(addComment(c));
    setCommentInput('');
  };

  const handleUpdateComment = async (id: number) => {
    if (!accessToken || !editInput.trim()) return;
    const c = await apiUpdateBlogComment(detail.id, id, editInput.trim(), accessToken);
    dispatch(updateComment(c));
    setEditId(null);
  };

  const handleDeleteComment = async (id: number) => {
    if (!accessToken || !confirm('コメントを削除しますか？')) return;
    await apiDeleteBlogComment(detail.id, id, accessToken);
    dispatch(removeComment(id));
  };

  return (
    <div className="bl-detail-page">
      <div className="bl-detail-inner">

        {/* 戻るリンク */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button className="bl-back-btn" style={{ margin: 0 }} onClick={() => navigate('/blog')}>← 記事一覧</button>
          {accessToken && (
            <button className="bl-btn-ghost" onClick={() => navigate(`/blog/${detail.id}/edit`)}>✏️ 編集</button>
          )}
        </div>

        {/* ヘッダー */}
        <header className="bl-detail-header">
          <span className="bl-cat-label">{detail.category?.name?.toUpperCase()}</span>
          <h1 className="bl-detail-title">{detail.title}</h1>
          <div className="bl-detail-meta">
            <span>{formatDate(detail.created_at)}</span>
            {detail.author.username && <><span>·</span><span>{detail.author.username}</span></>}
            {detail.reading_time > 0 && <><span>·</span><span>{detail.reading_time} min read</span></>}
            {detail.location && <><span>·</span><span>📍 {detail.location}</span></>}
          </div>
        </header>

        {/* サムネイル */}
        {detail.thumbnail && (
          <div className="bl-detail-thumb-wrap">
            <img src={detail.thumbnail} alt={detail.title} className="bl-detail-thumb" />
          </div>
        )}

        {/* 本文 */}
        <div className="bl-detail-body tl-markdown-body">
          <MarkdownRenderer content={detail.content} />
        </div>

        {/* タグ */}
        {detail.tags.length > 0 && (
          <div className="bl-detail-tags">
            {detail.tags.map(t => (
              <span key={t.id} className="bl-tag-pill">{t.name}</span>
            ))}
          </div>
        )}

        {/* いいね */}
        <div className="bl-detail-actions">
          <button
            className={`bl-like-btn ${detail.is_liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={!accessToken || likeLoading}
          >
            {detail.is_liked ? '❤️' : '🤍'} {detail.like_count}
          </button>
          <span className="bl-detail-stat">👁 {detail.views}</span>
          <span className="bl-detail-stat">💬 {detail.comment_count}</span>
        </div>

        {/* コメント */}
        <section className="bl-comments">
          <h2 className="bl-comments-title">コメント ({detail.comment_count})</h2>

          {commentsLoading ? (
            <div className="spinner" style={{ margin: '1rem' }} />
          ) : (
            <div className="bl-comment-list">
              {comments.map(c => (
                <div key={c.id} className="bl-comment">
                  <div className="bl-comment-meta">
                    <span className="bl-comment-author">{c.author.username || 'Anonymous'}</span>
                    <span className="bl-comment-date">{formatDate(c.created_at)}</span>
                  </div>
                  {editId === c.id ? (
                    <div className="bl-comment-edit">
                      <textarea
                        className="bl-comment-textarea"
                        value={editInput}
                        onChange={e => setEditInput(e.target.value)}
                        rows={3}
                      />
                      <div className="bl-comment-edit-actions">
                        <button className="bl-btn-primary" onClick={() => handleUpdateComment(c.id)}>更新</button>
                        <button className="bl-btn-ghost" onClick={() => setEditId(null)}>キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="bl-comment-content">{c.content}</p>
                      {accessToken && (
                        <div className="bl-comment-actions">
                          <button className="bl-btn-ghost sm" onClick={() => { setEditId(c.id); setEditInput(c.content); }}>編集</button>
                          <button className="bl-btn-ghost sm danger" onClick={() => handleDeleteComment(c.id)}>削除</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* コメント投稿フォーム */}
          {accessToken ? (
            <form className="bl-comment-form" onSubmit={handleAddComment}>
              <textarea
                className="bl-comment-textarea"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="コメントを書く..."
                rows={3}
              />
              <button type="submit" className="bl-btn-primary" disabled={!commentInput.trim()}>
                投稿する
              </button>
            </form>
          ) : (
            <p className="bl-comment-login-note">コメントするには<button className="bl-link-btn" onClick={() => navigate('/login')}>ログイン</button>が必要です。</p>
          )}
        </section>
      </div>
    </div>
  );
}
