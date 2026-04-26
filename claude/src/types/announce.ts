export type AnnounceType = 'info' | 'maintenance' | 'feature' | 'bugfix' | 'warning';
export type AnnounceStatus = 'draft' | 'published' | 'archived';
export type ChangelogType = 'feature' | 'improve' | 'bugfix' | 'security' | 'infra' | 'breaking';

export interface Announce {
  id: number;
  title: string;
  content: string;
  type: AnnounceType;
  type_label: string;
  status: AnnounceStatus;
  status_label: string;
  is_pinned: boolean;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnounceInput {
  title: string;
  content: string;
  type: AnnounceType;
  status: AnnounceStatus;
  is_pinned: boolean;
  start_at?: string | null;
  end_at?: string | null;
}

export interface Changelog {
  id: number;
  version: string;
  type: ChangelogType;
  type_label: string;
  title: string;
  content: string;
  released_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChangelogInput {
  version: string;
  type: ChangelogType;
  title: string;
  content: string;
  released_at: string;
}

// カラー定義
export const ANNOUNCE_TYPE_COLOR: Record<AnnounceType, string> = {
  info:        '#58a6ff',
  maintenance: '#d29922',
  feature:     '#3fb950',
  bugfix:      '#f85149',
  warning:     '#e3b341',
};

export const CHANGELOG_TYPE_COLOR: Record<ChangelogType, string> = {
  feature:  '#3fb950',
  improve:  '#58a6ff',
  bugfix:   '#f85149',
  security: '#d29922',
  infra:    '#bc8cff',
  breaking: '#f85149',
};
