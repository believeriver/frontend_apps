// ── TechLog 型定義 ─────────────────────────────────────────

export interface TechCategory {
  id: number;
  name: string;
  created_at?: string;
}

export interface TechTag {
  id: number;
  name: string;
}

export interface TechAuthor {
  id: string;       // UUID
  username: string;
  email: string;
}

export type PostStatus = 'draft' | 'published';

/** 一覧用（本文なし） */
export interface TechPostSummary {
  id: string;           // UUID (APIは"id"フィールド)
  title: string;
  status: PostStatus;
  author: TechAuthor;
  category: TechCategory | null;
  tags: TechTag[];
  views: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

/** コメント */
export interface TechComment {
  id: number;
  author: TechAuthor;
  content: string;
  created_at: string;
  updated_at: string;
}

/** 詳細用（本文・コメントあり） */
export interface TechPostDetail extends TechPostSummary {
  content: string;
  is_liked?: boolean;    // APIが返す場合のみ
  comments: TechComment[];
}

/** 記事作成/更新入力 */
export interface PostInput {
  title: string;
  content: string;
  status: PostStatus;
  category_id?: number | null;
  tags?: number[];
}
