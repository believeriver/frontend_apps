export interface BlogAuthor {
  id: string;
  username: string;
}

export interface BlogCategory {
  id: number;
  name: string;
}

export interface BlogTag {
  id: number;
  name: string;
}

export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogPostSummary {
  id: string;
  title: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: BlogTag[];
  location: string | null;
  status: BlogStatus;
  views: number;
  like_count: number;
  comment_count: number;
  reading_time: number;
  thumbnail: string | null;
  excerpt: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: number;
  author: BlogAuthor;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  is_liked: boolean;
}
