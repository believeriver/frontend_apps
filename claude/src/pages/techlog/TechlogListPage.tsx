import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { loadMeta, loadPosts } from '../../store/techlogSlice';
import { TechPostSummary } from '../../types/techlog';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}日前`;
  return new Date(iso).toLocaleDateString('ja-JP');
}

function ArticleCard({ post }: { post: TechPostSummary }) {
  const navigate = useNavigate();
  return (
    <article className="tl-card" onClick={() => navigate(`/techlog/${post.id}`)}>
      <div className="tl-card-meta">
        <span className="tl-author">{post.author.username || post.author.email}</span>
        <span className="tl-date">{timeAgo(post.created_at)}</span>
        {post.category && (
          <span className="tl-category-badge">{post.category.name}</span>
        )}
      </div>
      <h2 className="tl-card-title">{post.title}</h2>
      <div className="tl-card-tags">
        {post.tags.map((t) => (
          <span key={t.id} className="tl-tag">#{t.name}</span>
        ))}
      </div>
      <div className="tl-card-stats">
        <span className="tl-stat">👁 {post.views.toLocaleString()}</span>
        <span className="tl-stat">❤️ {post.like_count}</span>
        <span className="tl-stat">💬 {post.comment_count}</span>
      </div>
    </article>
  );
}

export default function TechlogListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { posts, postsLoading, categories, tags } = useSelector((s: RootState) => s.techlog);
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const [search,   setSearch]   = useState(searchParams.get('search') ?? '');
  const [catId,    setCatId]    = useState<number | undefined>(
    searchParams.get('category') ? Number(searchParams.get('category')) : undefined
  );
  const [tagId,    setTagId]    = useState<number | undefined>(
    searchParams.get('tag') ? Number(searchParams.get('tag')) : undefined
  );
  const [ordering, setOrdering] = useState<'views' | 'likes' | 'created'>('created');

  useEffect(() => {
    dispatch(loadMeta());
  }, [dispatch]);

  const fetchPosts = useCallback(() => {
    dispatch(loadPosts({
      search:   search || undefined,
      category: catId,
      tag:      tagId,
      ordering,
    }));
  }, [dispatch, search, catId, tagId, ordering]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p: Record<string, string> = {};
    if (search)        p.search   = search;
    if (catId != null) p.category = String(catId);
    if (tagId != null) p.tag      = String(tagId);
    setSearchParams(p);
    fetchPosts();
  };

  return (
    <div className="tl-list-layout">
      {/* サイドバー */}
      <aside className="tl-sidebar">
        <form onSubmit={handleSearch} className="tl-search-form">
          <input
            className="tl-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="キーワード検索..."
          />
          <button type="submit" className="tl-search-btn">検索</button>
        </form>

        {/* ソート */}
        <div className="tl-sidebar-section">
          <h3 className="tl-sidebar-title">並び替え</h3>
          {(['created', 'views', 'likes'] as const).map((o) => (
            <button
              key={o}
              className={`tl-sort-btn ${ordering === o ? 'active' : ''}`}
              onClick={() => setOrdering(o)}
            >
              {o === 'created' ? '🕒 新着順' : o === 'views' ? '👁 閲覧数順' : '❤️ いいね順'}
            </button>
          ))}
        </div>

        {/* カテゴリ */}
        {categories.length > 0 && (
          <div className="tl-sidebar-section">
            <h3 className="tl-sidebar-title">カテゴリ</h3>
            <button
              className={`tl-filter-btn ${catId == null ? 'active' : ''}`}
              onClick={() => setCatId(undefined)}
            >すべて</button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`tl-filter-btn ${catId === c.id ? 'active' : ''}`}
                onClick={() => setCatId(c.id)}
              >{c.name}</button>
            ))}
          </div>
        )}

        {/* タグ */}
        {tags.length > 0 && (
          <div className="tl-sidebar-section">
            <h3 className="tl-sidebar-title">タグ</h3>
            <div className="tl-tag-cloud">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className={`tl-tag ${tagId === t.id ? 'active' : ''}`}
                  onClick={() => setTagId(tagId === t.id ? undefined : t.id)}
                >#{t.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* 投稿ボタン */}
        {accessToken && (
          <button className="tl-write-btn" onClick={() => navigate('/techlog/new')}>
            ✏️ 記事を書く
          </button>
        )}
      </aside>

      {/* メインコンテンツ */}
      <main className="tl-main">
        <div className="tl-list-header">
          <h1 className="tl-list-title">
            {search ? `「${search}」の検索結果` : 'テックブログ'}
          </h1>
          <span className="tl-list-count">{posts.length} 件</span>
        </div>

        {postsLoading ? (
          <div className="page-center"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="tl-empty">記事がまだありません</div>
        ) : (
          <div className="tl-card-list">
            {posts.map((p) => <ArticleCard key={p.id} post={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
