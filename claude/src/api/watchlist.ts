import axios from 'axios';
import { API_BASE } from './config';
import type {
  WatchlistSummary, WatchlistDetail,
  WatchlistItem, WatchlistInput, WatchlistItemInput,
} from '../types/watchlist';

const BASE = `${API_BASE}/api/watchlist`;

const client = (token: string) =>
  axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } });

// ── ウォッチリスト ──────────────────────────────────────────
export const apiGetWatchlists = (token: string): Promise<WatchlistSummary[]> =>
  client(token).get<WatchlistSummary[]>('/').then(r => r.data);

export const apiGetWatchlist = (token: string, id: number): Promise<WatchlistDetail> =>
  client(token).get<WatchlistDetail>(`/${id}/`).then(r => r.data);

export const apiCreateWatchlist = (token: string, data: WatchlistInput): Promise<WatchlistDetail> =>
  client(token).post<WatchlistDetail>('/', data).then(r => r.data);

export const apiUpdateWatchlist = (token: string, id: number, data: Partial<WatchlistInput>): Promise<WatchlistDetail> =>
  client(token).patch<WatchlistDetail>(`/${id}/`, data).then(r => r.data);

export const apiDeleteWatchlist = (token: string, id: number): Promise<void> =>
  client(token).delete(`/${id}/`).then(() => undefined);

// ── アイテム ────────────────────────────────────────────────
export const apiAddWatchlistItem = (token: string, listId: number, data: WatchlistItemInput): Promise<WatchlistItem> =>
  client(token).post<WatchlistItem>(`/${listId}/items/`, data).then(r => r.data);

export const apiUpdateWatchlistItem = (token: string, listId: number, itemId: number, data: Partial<WatchlistItemInput>): Promise<WatchlistItem> =>
  client(token).patch<WatchlistItem>(`/${listId}/items/${itemId}/`, data).then(r => r.data);

export const apiDeleteWatchlistItem = (token: string, listId: number, itemId: number): Promise<void> =>
  client(token).delete(`/${listId}/items/${itemId}/`).then(() => undefined);

interface RefreshResponse {
  updated:   { code: string; price: number; source: string }[];
  errors:    { code: string; error: string }[];
  watchlist: WatchlistDetail;
}

export const apiRefreshWatchlistItems = (token: string, listId: number): Promise<RefreshResponse> =>
  client(token).post<RefreshResponse>(`/${listId}/items/refresh/`).then(r => r.data);
