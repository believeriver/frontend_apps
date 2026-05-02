export type AlertStatus = 'none' | 'alert_10' | 'alert_20';

export interface WatchlistSummary {
  id: number;
  name: string;
  memo: string;
  item_count: number;
  alert_count: number;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: number;
  company_code: string;
  company_name: string;
  company_industry: string | null;
  company_dividend: number | null;
  target_price: number;
  current_price: number | null;
  price_diff_pct: number | null;
  alert_status: AlertStatus;
  alert_label: string;
  high_price_1y: number | null;
  high_price_1y_at: string | null;
  high_diff_pct: number | null;
  high_alert_status: AlertStatus;
  high_alert_label: string;
  memo: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistDetail extends WatchlistSummary {
  items: WatchlistItem[];
  alert_count: number;
}

export interface WatchlistInput {
  name: string;
  memo?: string;
}

export interface WatchlistItemInput {
  company_code_input: string;
  target_price: number;
  memo?: string;
}
