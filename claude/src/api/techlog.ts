import axios from 'axios';
import {
  TechCategory, TechTag, TechPostSummary, TechPostDetail,
  TechComment, PostInput,
} from '../types/techlog';

const BASE = 'http://127.0.0.1:8000/api/techlog';

function client(token?: string) {
  return axios.create({
    baseURL: BASE,
    timeout: 10000,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ── カテゴリ・タグ ─────────────────────────────────────────
export const apiGetCategories = (): Promise<TechCategory[]> =>
  client().get<TechCategory[]>('/categories/').then((r) => r.data);

export const apiGetTags = (): Promise<TechTag[]> =>
  client().get<TechTag[]>('/tags/').then((r) => r.data);

// ── 記事一覧（配列返し） ────────────────────────────────────
export interface PostListParams {
  category?: number;
  tag?: number;
  author?: string;
  search?: string;
  ordering?: 'views' | 'likes' | 'created';
}

export const apiGetPosts = (
  params: PostListParams = {},
  token?: string,
): Promise<TechPostSummary[]> =>
  client(token).get<TechPostSummary[]>('/posts/', { params }).then((r) => r.data);

export const apiGetMyPosts = (
  params: { status?: 'draft' | 'published'; category?: number; search?: string; ordering?: string },
  token: string,
): Promise<TechPostSummary[]> =>
  client(token).get<TechPostSummary[]>('/posts/my/', { params }).then((r) => r.data);

// ── 記事詳細 ───────────────────────────────────────────────
export const apiGetPost = (id: string, token?: string): Promise<TechPostDetail> =>
  client(token).get<TechPostDetail>(`/posts/${id}/`).then((r) => r.data);

export const apiCreatePost = (body: PostInput, token: string): Promise<TechPostDetail> =>
  client(token).post<TechPostDetail>('/posts/', body).then((r) => r.data);

export const apiUpdatePost = (id: string, body: Partial<PostInput>, token: string): Promise<TechPostDetail> =>
  client(token).patch<TechPostDetail>(`/posts/${id}/`, body).then((r) => r.data);

export const apiDeletePost = (id: string, token: string): Promise<void> =>
  client(token).delete(`/posts/${id}/`).then(() => undefined);

// ── いいね ─────────────────────────────────────────────────
export const apiLikePost = (id: string, token: string): Promise<void> =>
  client(token).post(`/posts/${id}/like/`).then(() => undefined);

export const apiUnlikePost = (id: string, token: string): Promise<void> =>
  client(token).delete(`/posts/${id}/like/`).then(() => undefined);

// ── コメント ───────────────────────────────────────────────
export const apiGetComments = (id: string): Promise<TechComment[]> =>
  client().get<TechComment[]>(`/posts/${id}/comments/`).then((r) => r.data);

export const apiAddComment = (id: string, content: string, token: string): Promise<TechComment> =>
  client(token).post<TechComment>(`/posts/${id}/comments/`, { content }).then((r) => r.data);

export const apiUpdateComment = (id: string, commentId: number, content: string, token: string): Promise<TechComment> =>
  client(token).patch<TechComment>(`/posts/${id}/comments/${commentId}/`, { content }).then((r) => r.data);

export const apiDeleteComment = (id: string, commentId: number, token: string): Promise<void> =>
  client(token).delete(`/posts/${id}/comments/${commentId}/`).then(() => undefined);
