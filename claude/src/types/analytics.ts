export interface SummaryBySite   { site: string; count: number; }
export interface SummaryByStatus { status_code: number; count: number; }

export interface AnalyticsSummary {
  access_logs: {
    total: number;
    today: number;
    last_7_days: number;
    last_30_days: number;
    avg_response_ms: number;
    by_site: SummaryBySite[];
    by_status_code: SummaryByStatus[];
  };
  security_logs: {
    login_success_30d: number;
    login_failed_30d: number;
  };
}

export interface AccessLog {
  id: number;
  path: string;
  method: string;
  ip_address: string;
  username: string;
  status_code: number;
  response_time: number;
  user_agent: string;
  site: string;
  created_at: string;
}

export interface SecurityLog {
  id: number;
  action: 'login_success' | 'login_failed' | 'logout';
  ip_address: string;
  username: string;
  email: string;
  user_agent: string;
  created_at: string;
}

export interface PopularPage {
  path: string;
  site: string;
  count: number;
  avg_response: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface SiteStat {
  site: string;
  count: number;
  avg_response: number;
  error_count: number;
}
