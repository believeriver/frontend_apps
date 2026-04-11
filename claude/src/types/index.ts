// ── 共通サブ型 ──────────────────────────────────────────────
export interface CompanyInformation {
  industry: string | null;
  description: string | null;
  per: number | null;
  psr: number | null;
  pbr: number | null;
  updated_at: string | null;
}

// GET /api_market/companies/  (一覧)
export interface CompanyListItem {
  code: string;
  name: string;
  stock: string;                        // "59,100"
  dividend: number | null;
  dividend_rank: number | null;
  dividend_update: string | null;
  information: CompanyInformation | null;
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

export interface CompanyData {
  code: string;
  name: string;
  stock: string;                        // "59,100" (カンマ区切り文字列)
  dividend: number | null;              // 配当利回り %
  dividend_rank: number | null;
  dividend_update: string | null;
  information: CompanyInformation | null;
  financials: FinancialRecord[];
}

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y' | 'ALL';

// ── Portfolio ────────────────────────────────────────────────

/** POST /api/portfolio/ の入力 */
export interface PortfolioInput {
  company_code: string;
  shares: number;
  purchase_price: number;
  purchased_at: string;   // YYYY-MM-DD
  memo?: string;
}

/** 購入履歴1件 */
export interface PortfolioRecord {
  id: number;
  shares: number;
  purchase_price: string;  // "58000.00"
  purchased_at: string;
  memo: string;
}

/** GET /api/portfolio/ の1要素（企業ごとに集計） */
export interface PortfolioItem {
  company_code: string;
  company_name: string;
  total_shares: number;
  avg_purchase_price: string;
  records: PortfolioRecord[];
}

/** GET /api/portfolio/dashboard/ の1要素 */
export interface DashboardItem {
  company_code: string;
  company_name: string;
  industry: string | null;
  per: number | null;
  pbr: number | null;
  total_shares: number;
  avg_purchase_price: number;
  dividend_yield: number | null;
  dividend_per_share: number | null;
  fiscal_year: string | null;
  dividend_income: number | null;
  dividend_income_source: string | null;
}

/** GET /api/portfolio/industry/ の1要素 */
export interface IndustryItem {
  industry: string;
  total_cost: number;
  ratio: number;
}
