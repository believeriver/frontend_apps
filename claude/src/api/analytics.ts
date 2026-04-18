import axios from 'axios';
import type {
  AnalyticsSummary, AccessLog, SecurityLog,
  PopularPage, DailyCount, SiteStat,
} from '../types/analytics';
import { API_BASE } from './config';

const client = (token: string) =>
  axios.create({
    baseURL: `${API_BASE}/api/analytics`,
    headers: { Authorization: `Bearer ${token}` },
  });

export const apiGetSummary = (token: string): Promise<AnalyticsSummary> =>
  client(token).get<AnalyticsSummary>('/summary/').then(r => r.data);

export const apiGetAccessLogs = (token: string, params = {}): Promise<AccessLog[]> =>
  client(token).get<AccessLog[]>('/access-logs/', { params }).then(r => r.data);

export const apiDeleteAccessLogs = (token: string, params: { date_to?: string; site?: string }): Promise<{ deleted: number }> =>
  client(token).delete<{ deleted: number }>('/access-logs/', { params }).then(r => r.data);

export const apiGetSecurityLogs = (token: string, params = {}): Promise<SecurityLog[]> =>
  client(token).get<SecurityLog[]>('/security-logs/', { params }).then(r => r.data);

export const apiGetPopularPages = (token: string, params = {}): Promise<PopularPage[]> =>
  client(token).get<PopularPage[]>('/popular-pages/', { params }).then(r => r.data);

export const apiGetDailyAccess = (token: string, params = {}): Promise<DailyCount[]> =>
  client(token).get<DailyCount[]>('/daily/', { params }).then(r => r.data);

export const apiGetSiteStats = (token: string, params = {}): Promise<SiteStat[]> =>
  client(token).get<SiteStat[]>('/sites/', { params }).then(r => r.data);

export const apiExportCsv = (token: string, params: { type?: string; date_from?: string; date_to?: string; site?: string }) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url   = `${API_BASE}/api/analytics/export/?${query}`;
  // Bearerトークンをクエリに含められないためaxiosで取得してBlob DL
  return axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  }).then(r => {
    const href = URL.createObjectURL(r.data);
    const a    = document.createElement('a');
    a.href     = href;
    a.download = `${params.type ?? 'access'}_log_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(href);
  });
};
