import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { loadBlogMeta, loadBlogPosts } from '../../store/blogSlice';
import type { BlogPostSummary } from '../../types/blog';

// ── 日付フォーマット ───────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '.');
}

// ── サムネイル ────────────────────────────────────────────
const THUMB_COLORS: Record<string, string> = {
  journal: 'rgba(180,200,190,0.5)',
  running: 'rgba(180,190,210,0.5)',
  reading: 'rgba(200,185,210,0.5)',
  note:    'rgba(210,200,175,0.5)',
  tech:    'rgba(175,195,210,0.5)',
};

function Thumbnail({ post, size = 'sm' }: { post: BlogPostSummary; size?: 'sm' | 'lg' }) {
  const bg = THUMB_COLORS[post.category?.name ?? ''] ?? 'rgba(180,180,175,0.4)';
  if (post.thumbnail) {
    return <img src={post.thumbnail} alt={post.title} className={`bl-thumb bl-thumb-${size}`} />;
  }
  return <div className={`bl-thumb bl-thumb-${size}`} style={{ background: bg }} />;
}

// ── フィーチャードカード ───────────────────────────────────
function FeaturedCard({ post }: { post: BlogPostSummary }) {
  const navigate = useNavigate();
  return (
    <article className="bl-featured" onClick={() => navigate(`/blog/${post.id}`)}>
      <div className="bl-featured-body">
        <span className="bl-cat-label">{post.category?.name?.toUpperCase()}</span>
        <h2 className="bl-featured-title">{post.title}</h2>
        <div className="bl-featured-meta">
          <span>{formatDate(post.created_at)}</span>
          {post.author.username && <><span>·</span><span>{post.author.username}</span></>}
          {post.reading_time > 0 && <><span>·</span><span>{post.reading_time} min read</span></>}
          {post.location && <><span>·</span><span>{post.location}</span></>}
        </div>
        {post.excerpt && <p className="bl-featured-excerpt">{post.excerpt}</p>}
        <span className="bl-read-more">続きを読む →</span>
      </div>
      <Thumbnail post={post} size="lg" />
    </article>
  );
}

// ── 記事カード ────────────────────────────────────────────
function PostCard({ post }: { post: BlogPostSummary }) {
  const navigate = useNavigate();
  return (
    <article className="bl-card" onClick={() => navigate(`/blog/${post.id}`)}>
      <Thumbnail post={post} size="sm" />
      <div className="bl-card-body">
        <span className="bl-cat-label">{post.category?.name}</span>
        <h3 className="bl-card-title">{post.title}</h3>
        <div className="bl-card-meta">{formatDate(post.created_at)}</div>
      </div>
    </article>
  );
}

// ── メインページ ──────────────────────────────────────────
export default function BlogListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { posts, postsLoading, categories, tags } = useSelector((s: RootState) => s.blog);
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const [catId,    setCatId]    = useState<number | undefined>();
  const [tagId,    setTagId]    = useState<number | undefined>();
  const [ordering, setOrdering] = useState<'created' | 'views' | 'likes'>('created');
  const [search,   setSearch]   = useState('');
  const [input,    setInput]    = useState('');

  useEffect(() => { dispatch(loadBlogMeta()); }, [dispatch]);

  const fetchPosts = useCallback(() => {
    const params: Record<string, unknown> = { ordering };
    if (catId != null) params.category = catId;
    if (tagId != null) params.tag      = tagId;
    if (search)        params.search   = search;
    dispatch(loadBlogPosts(params));
  }, [dispatch, catId, tagId, ordering, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const featured  = posts[0];
  const rest      = posts.slice(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(input);
  };

  return (
    <div className="bl-page">
      {/* フィルターバー */}
      <div className="bl-filter-bar">
        <div className="bl-cats">
          <button
            className={`bl-cat-btn ${catId == null ? 'active' : ''}`}
            onClick={() => { setCatId(undefined); setTagId(undefined); }}
          >All</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`bl-cat-btn ${catId === c.id ? 'active' : ''}`}
              onClick={() => { setCatId(c.id); setTagId(undefined); }}
            >{c.name}</button>
          ))}
        </div>
        <div className="bl-filter-right">
          <form onSubmit={handleSearch} className="bl-search-form">
            <input
              className="bl-search-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="検索..."
            />
            <button type="submit" className="bl-search-btn">🔍</button>
          </form>
          <select
            className="bl-sort-select"
            value={ordering}
            onChange={e => setOrdering(e.target.value as typeof ordering)}
          >
            <option value="created">新着順</option>
            <option value="views">閲覧数順</option>
            <option value="likes">いいね順</option>
          </select>
          {accessToken && (
            <>
              <button className="bl-write-btn" onClick={() => navigate('/blog/manage')}>
                📋 管理
              </button>
              <button className="bl-write-btn" onClick={() => navigate('/blog/new')}>
                ✏️ 投稿
              </button>
            </>
          )}
        </div>
      </div>

      {postsLoading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="bl-empty">記事がまだありません</div>
      ) : (
        <>
          {/* フィーチャード */}
          {featured && <FeaturedCard post={featured} />}

          {/* 記事グリッド */}
          {rest.length > 0 && (
            <section className="bl-grid-section">
              <h2 className="bl-section-label">RECENT POSTS</h2>
              <div className="bl-grid">
                {rest.map(p => <PostCard key={p.id} post={p} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* タグクラウド */}
      {tags.length > 0 && (
        <div className="bl-tags-footer">
          {tags.map(t => (
            <span
              key={t.id}
              className={`bl-tag-pill ${tagId === t.id ? 'active' : ''}`}
              onClick={() => setTagId(tagId === t.id ? undefined : t.id)}
            >{t.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
