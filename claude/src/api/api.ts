import axios from 'axios';
import { StockPoint, CompanyData, CompanyListItem } from '../types';

const BASE_URL = 'http://127.0.0.1:8000/api_market';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const fetchCompanyList = async (): Promise<CompanyListItem[]> => {
  const { data } = await client.get<CompanyListItem[]>('/companies/');
  return data;
};

export const fetchStockHistory = async (code: string): Promise<StockPoint[]> => {
  const { data } = await client.get<StockPoint[]>(`/stock/${code}/`);
  return data;
};

export const fetchCompanyData = async (code: string): Promise<CompanyData> => {
  const { data } = await client.get<CompanyData>(`/companies/${code}/`);
  return data;
};
