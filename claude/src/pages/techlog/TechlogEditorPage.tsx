import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import MarkdownRenderer from '../../components/techlog/MarkdownRenderer';
import { apiGetPost, apiCreatePost, apiUpdatePost, apiGetCategories, apiGetTags } from '../../api/techlog';
import { TechCategory, TechTag, PostStatus } from '../../types/techlog';

export default function TechlogEditorPage() {
  const { uuid } = useParams<{ uuid?: string }>();
  const navigate  = useNavigate();
  const { accessToken } = useSelector((s: RootState) => s.auth);
  const isEdit = !!uuid;

  const [title,      setTitle]      = useState('');
  const [content,    setContent]    = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagIds,     setTagIds]     = useState<number[]>([]);
  const [categories, setCategories] = useState<TechCategory[]>([]);
  const [tags,       setTags]       = useState<TechTag[]>([]);
  const [preview,    setPreview]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) { navigate('/login'); return; }
    Promise.all([apiGetCategories(), apiGetTags()]).then(([cats, ts]) => {
      setCategories(cats);
      setTags(ts);
    });
    if (isEdit && uuid) {
      apiGetPost(uuid, accessToken).then((p) => {
        setTitle(p.title);
        setContent(p.content);
        setCategoryId(p.category?.id ?? null);
        setTagIds(p.tags.map((t) => t.id));
      });
    }
  }, [uuid, accessToken, isEdit, navigate]);

  const toggleTag = (id: number) => {
    setTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const handleSave = async (s: PostStatus) => {
    if (!accessToken || !title.trim()) { setError('タイトルを入力してください'); return; }
    setError(null);
    setSaving(true);
    try {
      const body = {
        title:       title.trim(),
        content,
        status:      s,
        category_id: categoryId,
        tags:        tagIds,
      };
      if (isEdit && uuid) {
        await apiUpdatePost(uuid, body, accessToken);
        navigate(s === 'published' ? `/techlog/${uuid}` : '/techlog/my');
      } else {
        const created = await apiCreatePost(body, accessToken);
        navigate(`/techlog/${created.id}`);
      }
    } catch (e: any) {
      const data = e.response?.data;
      setError(
        data?.detail ??
        data?.title?.[0] ??
        data?.content?.[0] ??
        data?.category_id?.[0] ??
        '保存に失敗しました'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tl-editor-layout">
      {/* ツールバー */}
      <div className="tl-editor-toolbar">
        <input
          className="tl-editor-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力..."
        />
        <div className="tl-editor-toolbar-right">
          <button className={`tl-preview-toggle ${preview ? 'active' : ''}`} onClick={() => setPreview(!preview)}>
            {preview ? '✏️ 編集' : '👁 プレビュー'}
          </button>
          <button className="tl-save-draft-btn" onClick={() => handleSave('draft')} disabled={saving}>
            下書き保存
          </button>
          <button className="tl-publish-btn" onClick={() => handleSave('published')} disabled={saving}>
            {saving ? '保存中...' : '公開する'}
          </button>
        </div>
      </div>

      {error && <p className="auth-error" style={{ margin: '0 24px' }}>{error}</p>}

      <div className="tl-editor-body">
        {/* メタ情報パネル */}
        <div className="tl-editor-meta-panel">
          <div className="tl-editor-section">
            <label className="tl-editor-label">カテゴリ</label>
            <select
              className="tl-editor-select"
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">なし</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="tl-editor-section">
            <label className="tl-editor-label">タグ（クリックで選択）</label>
            <div className="tl-tag-cloud">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className={`tl-tag ${tagIds.includes(t.id) ? 'active' : ''}`}
                  onClick={() => toggleTag(t.id)}
                >#{t.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* エディタ / プレビュー */}
        <div className="tl-editor-content">
          {preview ? (
            <div className="tl-markdown-body tl-preview-pane">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p style={{ color: 'var(--text-dim)' }}>本文を入力するとここにプレビューが表示されます</p>
              )}
            </div>
          ) : (
            <textarea
              className="tl-editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Markdown で記事を書いてください..."
            />
          )}
        </div>
      </div>
    </div>
  );
}
