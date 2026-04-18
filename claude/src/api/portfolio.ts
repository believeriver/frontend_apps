import axios from 'axios';
import {
  PortfolioItem,
  PortfolioRecord,
  PortfolioInput,
  DashboardItem,
  IndustryItem,
} from '../types';
import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/api/portfolio`;

function authClient(token: string) {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export const apiFetchPortfolio = (token: string): Promise<PortfolioItem[]> =>
  authClient(token).get<PortfolioItem[]>('/').then((r) => r.data);

export const apiFetchDashboard = (token: string): Promise<DashboardItem[]> =>
  authClient(token).get<DashboardItem[]>('/dashboard/').then((r) => r.data);

export const apiFetchIndustry = (token: string): Promise<IndustryItem[]> =>
  authClient(token).get<IndustryItem[]>('/industry/').then((r) => r.data);

export const apiAddPosition = (token: string, body: PortfolioInput): Promise<PortfolioRecord> =>
  authClient(token).post<PortfolioRecord>('/', body).then((r) => r.data);

export const apiUpdatePosition = (
  token: string,
  id: number,
  body: Partial<PortfolioInput>
): Promise<PortfolioRecord> =>
  authClient(token).patch<PortfolioRecord>(`/${id}/`, body).then((r) => r.data);

export const apiDeletePosition = (token: string, id: number): Promise<void> =>
  authClient(token).delete(`/${id}/`).then(() => undefined);
