import axios from 'axios';
import { API_BASE } from './config';
import type { ScreeningResponse, ScreeningParams } from '../types/screening';

const BASE = `${API_BASE}/api/market/screening`;

export const apiGetScreening = (params: ScreeningParams = {}): Promise<ScreeningResponse> => {
  const p: Record<string, string> = {};
  if (params.sort_by)              p.sort_by              = params.sort_by;
  if (params.exclude_reit)         p.exclude_reit         = 'true';
  if (params.dividend_yield_min)   p.dividend_yield_min   = String(params.dividend_yield_min);
  if (params.equity_ratio_min)     p.equity_ratio_min     = String(params.equity_ratio_min);
  if (params.operating_margin_min) p.operating_margin_min = String(params.operating_margin_min);
  if (params.min_years)            p.min_years            = String(params.min_years);
  return axios.get<ScreeningResponse>(`${BASE}/`, { params: p }).then(r => r.data);
};

export const apiRefreshScreening = (token: string) =>
  axios.post(`${BASE}/refresh/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.data);
