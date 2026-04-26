import axios from 'axios';
import { API_BASE } from './config';
import type { Announce, AnnounceInput, Changelog, ChangelogInput } from '../types/announce';

const BASE = `${API_BASE}/api/announce`;

const client = (token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return axios.create({ baseURL: BASE, headers });
};

// ページネーション対応ヘルパー
function toArray<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : (data?.results ?? []);
}

// ── お知らせ ─────────────────────────────────────────────
export const apiGetAnnounces = (params: Record<string, string> = {}, token?: string): Promise<Announce[]> =>
  client(token).get('/', { params }).then(r => toArray<Announce>(r.data));

export const apiGetAnnounce = (id: number): Promise<Announce> =>
  client().get<Announce>(`/${id}/`).then(r => r.data);

export const apiCreateAnnounce = (token: string, data: AnnounceInput): Promise<Announce> =>
  client(token).post<Announce>('/', data).then(r => r.data);

export const apiUpdateAnnounce = (token: string, id: number, data: Partial<AnnounceInput>): Promise<Announce> =>
  client(token).patch<Announce>(`/${id}/`, data).then(r => r.data);

export const apiDeleteAnnounce = (token: string, id: number): Promise<void> =>
  client(token).delete(`/${id}/`).then(() => undefined);

// ── 変更履歴 ─────────────────────────────────────────────
export const apiGetChangelogs = (params: Record<string, string> = {}): Promise<Changelog[]> =>
  client().get('/changelog/', { params }).then(r => toArray<Changelog>(r.data));

export const apiCreateChangelog = (token: string, data: ChangelogInput): Promise<Changelog> =>
  client(token).post<Changelog>('/changelog/', data).then(r => r.data);

export const apiUpdateChangelog = (token: string, id: number, data: Partial<ChangelogInput>): Promise<Changelog> =>
  client(token).patch<Changelog>(`/changelog/${id}/`, data).then(r => r.data);

export const apiDeleteChangelog = (token: string, id: number): Promise<void> =>
  client(token).delete(`/changelog/${id}/`).then(() => undefined);
