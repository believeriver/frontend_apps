import axios from 'axios';
import { StockPoint, CompanyData, CompanyListItem } from '../types';
import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/api/market`;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const fetchCompanyList = async (): Promise<CompanyListItem[]> => {
  const { data } = await client.get<CompanyListItem[]>('/companies/');
  return data;
};

/** start: 'YYYY-MM-DD' を渡すとその日以降のデータを取得。省略時はAPI側デフォルト（6ヶ月） */
export const fetchStockHistory = async (code: string, start?: string): Promise<StockPoint[]> => {
  const params = start ? { start } : {};
  const { data } = await client.get<StockPoint[]>(`/stock/${code}/`, { params });
  return data;
};

export const fetchCompanyData = async (code: string): Promise<CompanyData> => {
  const { data } = await client.get<CompanyData>(`/companies/${code}/`);
  return data;
};
