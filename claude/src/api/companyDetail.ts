import axios from 'axios';
import { API_BASE } from './config';

export interface CompanyDetailData {
  summary:    string;
  business:   string;
  feature:    string;
  risk:       string;
  website:    string;
  fetched_at: string | null;
}

const base = (code: string) => `${API_BASE}/api/market/companies/${code}`;

export const apiGetCompanyDetail = async (code: string): Promise<CompanyDetailData | null> => {
  try {
    const res = await axios.get<CompanyDetailData>(`${base(code)}/detail/`);
    return res.data;
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
};

export const apiFetchCompanyDetail = (code: string, token: string): Promise<CompanyDetailData> =>
  axios.post<CompanyDetailData>(
    `${base(code)}/fetch-detail/`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(r => r.data);
