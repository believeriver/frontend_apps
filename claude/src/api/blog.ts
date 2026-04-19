import axios from 'axios';
import type { BlogPostSummary, BlogPostDetail, BlogCategory, BlogTag, BlogComment } from '../types/blog';
import { API_BASE } from './config';

const BASE = `${API_BASE}/api/blog`;

const client = (token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return axios.create({ baseURL: BASE, headers });
};

export const apiGetBlogCategories = (): Promise<BlogCategory[]> =>
  client().get<BlogCategory[]>('/categories/').then(r => r.data);

export const apiGetBlogTags = (): Promise<BlogTag[]> =>
  client().get<BlogTag[]>('/tags/').then(r => r.data);

export const apiGetBlogPosts = (params = {}, token?: string): Promise<BlogPostSummary[]> =>
  client(token).get<BlogPostSummary[]>('/posts/', { params }).then(r => r.data);

export const apiGetBlogPost = (uuid: string, token?: string): Promise<BlogPostDetail> =>
  client(token).get<BlogPostDetail>(`/posts/${uuid}/`).then(r => r.data);

export const apiGetBlogComments = (uuid: string, token?: string): Promise<BlogComment[]> =>
  client(token).get<BlogComment[]>(`/posts/${uuid}/comments/`).then(r => r.data);

export const apiAddBlogComment = (uuid: string, content: string, token: string): Promise<BlogComment> =>
  client(token).post<BlogComment>(`/posts/${uuid}/comments/`, { content }).then(r => r.data);

export const apiUpdateBlogComment = (uuid: string, id: number, content: string, token: string): Promise<BlogComment> =>
  client(token).patch<BlogComment>(`/posts/${uuid}/comments/${id}/`, { content }).then(r => r.data);

export const apiDeleteBlogComment = (uuid: string, id: number, token: string): Promise<void> =>
  client(token).delete(`/posts/${uuid}/comments/${id}/`).then(() => undefined);

export interface BlogPostInput {
  title: string;
  content: string;
  category_id: number;
  tag_ids?: number[];
  location?: string;
  status: 'draft' | 'published';
  created_at?: string;
}

export const apiCreateBlogPost = (body: BlogPostInput, token: string): Promise<BlogPostDetail> =>
  client(token).post<BlogPostDetail>('/posts/', body).then(r => r.data);

export const apiUpdateBlogPost = (uuid: string, body: Partial<BlogPostInput>, token: string): Promise<BlogPostDetail> =>
  client(token).patch<BlogPostDetail>(`/posts/${uuid}/`, body).then(r => r.data);

export const apiDeleteBlogPost = (uuid: string, token: string): Promise<void> =>
  client(token).delete(`/posts/${uuid}/`).then(() => undefined);

export const apiUploadBlogImage = (uuid: string, file: File, token: string): Promise<{ url: string }> => {
  const form = new FormData();
  form.append('image', file);
  return client(token).post<{ url: string }>(`/posts/${uuid}/images/`, form).then(r => r.data);
};

export const apiUploadBlogThumbnail = (uuid: string, file: File, token: string): Promise<{ thumbnail_url: string }> => {
  const form = new FormData();
  form.append('thumbnail', file);
  return client(token).patch<{ thumbnail_url: string }>(`/posts/${uuid}/`, form).then(r => r.data);
};

export const apiLikeBlogPost = (uuid: string, token: string): Promise<{ like_count: number }> =>
  client(token).post<{ like_count: number }>(`/posts/${uuid}/like/`).then(r => r.data);

export const apiUnlikeBlogPost = (uuid: string, token: string): Promise<{ like_count: number }> =>
  client(token).delete<{ like_count: number }>(`/posts/${uuid}/like/`).then(r => r.data);
