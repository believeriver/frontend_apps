import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { loadBlogMeta, loadBlogPost } from '../../store/blogSlice';
import { apiCreateBlogPost, apiUpdateBlogPost, apiUploadBlogImage, apiUploadBlogThumbnail } from '../../api/blog';
import MarkdownRenderer from '../../components/techlog/MarkdownRenderer';

type Tab = 'write' | 'preview';

export default function BlogEditorPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const isEdit    = !!uuid;
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();

  const { categories, tags, detail } = useSelector((s: RootState) => s.blog);
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [catId,    setCatId]    = useState<number | ''>('');
  const [tagIds,   setTagIds]   = useState<number[]>([]);
  const [location,    setLocation]    = useState('');
  const [status,      setStatus]      = useState<'draft' | 'published'>('draft');
  const [createdDate, setCreatedDate] = useState('');
  const [tab,      setTab]      = useState<Tab>('write');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [imgUploading,  setImgUploading]  = useState(false);
  const [thumbUrl,      setThumbUrl]      = useState<string | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { dispatch(loadBlogMeta()); }, [dispatch]);

  // 編集時：既存データをロード
  useEffect(() => {
    if (isEdit && uuid) dispatch(loadBlogPost(uuid));
  }, [isEdit, uuid, dispatch]);

  useEffect(() => {
    if (isEdit && detail && detail.id === uuid) {
      setTitle(detail.title);
      setContent(detail.content);
      setCatId(detail.category?.id ?? '');
      setTagIds(detail.tags.map(t => t.id));
      setLocation(detail.location ?? '');
      setStatus(detail.status === 'published' ? 'published' : 'draft');
      setCreatedDate(detail.created_at.slice(0, 16));
      setThumbUrl(detail.thumbnail_url ?? null);
    }
  }, [isEdit, detail, uuid]);

  // 認証・権限チェック
  if (!accessToken) {
    return <div className="page-center">ログインが必要です。</div>;
  }

  const toggleTag = (id: number) => {
    setTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!isEdit || !uuid) {
      setError('サムネイルをアップロードするには先に記事を保存してください。');
      return;
    }
    setThumbUploading(true);
    try {
      const res = await apiUploadBlogThumbnail(uuid, file, accessToken!);
      setThumbUrl(res.thumbnail_url);
    } catch {
      setError('サムネイルのアップロードに失敗しました。');
    } finally {
      setThumbUploading(false);
    }
  };

  // 画像をドロップ or ペーストで挿入（記事保存後にURLを取得する仕組みのため、
  // ここでは一時的にファイル名を表示し、保存後にURLへ置換）
  const handleImageUpload = async (file: File) => {
    if (!isEdit || !uuid) {
      setError('画像をアップロードするには先に記事を保存してください。');
      return;
    }
    setImgUploading(true);
    try {
      const { url } = await apiUploadBlogImage(uuid, file, accessToken);
      const markdown = `![${file.name}](${url})`;
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        setContent(c => c.slice(0, start) + markdown + c.slice(end));
      } else {
        setContent(c => c + '\n' + markdown);
      }
    } catch {
      setError('画像のアップロードに失敗しました。');
    } finally {
      setImgUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleImageUpload(file);
  };

  const handleSave = async (s: 'draft' | 'published') => {
    if (!title.trim()) { setError('タイトルを入力してください。'); return; }
    if (!content.trim()) { setError('本文を入力してください。'); return; }
    if (catId === '') { setError('カテゴリを選択してください。'); return; }
    setError('');
    setSaving(true);
    try {
      const body = {
        title:       title.trim(),
        content:     content.trim(),
        category_id: catId as number,
        tag_ids:     tagIds,
        location:    location.trim() || undefined,
        status:      s,
        ...(createdDate ? { created_at: new Date(createdDate).toISOString() } : {}),
      };
      if (isEdit && uuid) {
        await apiUpdateBlogPost(uuid, body, accessToken);
        navigate(`/blog/${uuid}`);
      } else {
        const created = await apiCreateBlogPost(body, accessToken);
        navigate(`/blog/${created.id}`);
      }
    } catch (e: unknown) {
      setError('保存に失敗しました。権限を確認してください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ble-page">
      {/* ヘッダー */}
      <div className="ble-header">
        <button className="bl-back-btn" onClick={() => navigate(isEdit && uuid ? `/blog/${uuid}` : '/blog')}>
          ← キャンセル
        </button>
        <div className="ble-header-actions">
          <select
            className="ble-status-select"
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
          <button className="ble-save-btn ghost" onClick={() => handleSave('draft')} disabled={saving}>
            下書き保存
          </button>
          <button className="ble-save-btn primary" onClick={() => handleSave('published')} disabled={saving}>
            {saving ? '保存中...' : isEdit ? '更新する' : '公開する'}
          </button>
        </div>
      </div>

      {error && <div className="ble-error">{error}</div>}

      <div className="ble-body">
        {/* 左：メタ情報 */}
        <aside className="ble-sidebar">
          <div className="ble-field">
            <label className="ble-label">カテゴリ</label>
            <select
              className="ble-select"
              value={catId}
              onChange={e => setCatId(Number(e.target.value))}
            >
              <option value="">-- 選択 --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="ble-field">
            <label className="ble-label">タグ</label>
            <div className="ble-tag-list">
              {tags.map(t => (
                <span
                  key={t.id}
                  className={`bl-tag-pill ${tagIds.includes(t.id) ? 'active' : ''}`}
                  onClick={() => toggleTag(t.id)}
                >{t.name}</span>
              ))}
            </div>
          </div>

          <div className="ble-field">
            <label className="ble-label">場所（任意）</label>
            <input
              className="ble-input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="例: Tokyo"
            />
          </div>

          <div className="ble-field">
            <label className="ble-label">投稿日時（任意）</label>
            <input
              type="datetime-local"
              className="ble-input"
              value={createdDate}
              onChange={e => setCreatedDate(e.target.value)}
            />
          </div>

          <div className="ble-field">
            <label className="ble-label">サムネイル</label>
            <div
              className="ble-thumb-area"
              onClick={() => thumbInputRef.current?.click()}
            >
              {thumbUrl ? (
                <img src={thumbUrl} alt="thumbnail" className="ble-thumb-preview" />
              ) : (
                <span className="ble-thumb-placeholder">
                  {thumbUploading ? 'アップロード中...' : 'クリックして画像を選択'}
                </span>
              )}
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailUpload(file);
                e.target.value = '';
              }}
            />
            {thumbUrl && (
              <button
                className="ble-thumb-remove"
                onClick={() => setThumbUrl(null)}
              >サムネイルを削除</button>
            )}
          </div>

          <div className="ble-hint">
            <p>💡 本文画像の挿入</p>
            <p>エディタ上で画像をペースト（Cmd+V）またはドロップすると自動でアップロードされます。</p>
            <p>※ 新規記事は先に「下書き保存」してから画像を挿入してください。</p>
          </div>
        </aside>

        {/* 右：エディタ */}
        <div className="ble-main">
          <input
            className="ble-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="タイトル"
          />

          {/* Write / Preview タブ */}
          <div className="ble-tabs">
            <button
              className={`ble-tab ${tab === 'write' ? 'active' : ''}`}
              onClick={() => setTab('write')}
            >Write</button>
            <button
              className={`ble-tab ${tab === 'preview' ? 'active' : ''}`}
              onClick={() => setTab('preview')}
            >Preview</button>
          </div>

          {tab === 'write' ? (
            <div style={{ position: 'relative' }}>
              {imgUploading && (
                <div className="ble-img-uploading">画像アップロード中...</div>
              )}
              <textarea
                ref={textareaRef}
                className="ble-textarea"
                value={content}
                onChange={e => setContent(e.target.value)}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                placeholder="Markdown で記事を書く...&#10;&#10;画像はペーストまたはドラッグ&ドロップで挿入できます。"
              />
            </div>
          ) : (
            <div className="ble-preview tl-markdown-body">
              {content ? <MarkdownRenderer content={content} /> : (
                <p style={{ color: 'var(--text-dim)' }}>プレビューする内容がありません。</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
