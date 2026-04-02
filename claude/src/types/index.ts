// GET /api_market/companies/  (一覧)
export interface CompanyListItem {
  code: string;
  name: string;
  stock: string;           // "59,100"
  dividend: number | null;
  dividend_rank: number | null;
  dividend_update: string | null;
  information: string | null;
}

// GET /api_market/stock/<code>/
export interface StockPoint {
  year: string;   // ISO datetime "2025-10-03T00:00:00"
  value: number;  // close price
}

// GET /api_market/companies/<code>/
export interface FinancialRecord {
  fiscal_year: string;
  sales: number | null;
  operating_margin: number | null;       // %
  eps: number | null;
  equity_ratio: number | null;           // %
  operating_cash_flow: number | null;
  cash_and_equivalents: number | null;
  dividend_per_share: number | null;
  payout_ratio: number | null;           // %
}

export interface CompanyInformation {
  industry: string | null;
  description: string | null;
  per: number | null;
  psr: number | null;
  pbr: number | null;
  updated_at: string | null;
}

export interface CompanyData {
  code: string;
  name: string;
  stock: string;           // "59,100" (カンマ区切り文字列)
  dividend: number | null; // 配当利回り %
  dividend_rank: number | null;
  dividend_update: string | null;
  information: CompanyInformation | null;
  financials: FinancialRecord[];
}

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y' | 'ALL';
