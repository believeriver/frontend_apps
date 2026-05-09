export interface ScreeningDetails {
  sales_growth:         boolean | null;
  sales_stable:         boolean | null;
  operating_margin_ok:  boolean | null;
  operating_margin_10:  boolean | null;
  operating_margin_val: number  | null;
  eps_no_negative:      boolean | null;
  eps_growth:           boolean | null;
  eps_val:              number  | null;
  equity_ratio_40:      boolean | null;
  equity_ratio_60:      boolean | null;
  equity_ratio_80:      boolean | null;
  equity_ratio_val:     number  | null;
  cf_positive:          boolean | null;
  cf_growth:            boolean | null;
  cf_val:               number  | null;
  cash_growth:          boolean | null;
  cash_val:             number  | null;
  dividend_stable:      boolean | null;
  dividend_growth:      boolean | null;
  dividend_val:         number  | null;
  payout_ratio_ok:      boolean | null;
  payout_ratio_high:    boolean | null;
  payout_ratio_val:     number  | null;
}

export interface ScreeningLatest {
  fiscal_year:             string;
  sales:                   number | null;
  operating_margin:        number | null;
  eps:                     number | null;
  equity_ratio:            number | null;
  operating_cash_flow:     number | null;
  cash_and_equivalents:    number | null;
  dividend_per_share:      number | null;
  payout_ratio:            number | null;
}

export interface ScreeningItem {
  code:           string;
  name:           string;
  dividend:       number | null;
  score:          number;
  years_analyzed: number;
  details:        ScreeningDetails;
  latest:         ScreeningLatest;
}

export interface ScreeningResponse {
  count:        number;
  refreshed_at: string | null;
  results:      ScreeningItem[];
}

export interface ScreeningParams {
  sort_by?:              'score' | 'dividend';
  exclude_reit?:         boolean;
  dividend_yield_min?:   number;
  equity_ratio_min?:     number;
  operating_margin_min?: number;
  min_years?:            number;
}
