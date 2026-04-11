export type StockCategory = 'defensive' | 'cyclical' | 'financial' | 'other';

export interface CategoryMeta {
  label: string;
  short: string;
  color: string;
  bg: string;
}

export const CATEGORY_META: Record<StockCategory, CategoryMeta> = {
  defensive: { label: 'ディフェンシブ', short: 'D', color: '#58a6ff', bg: 'rgba(88,166,255,0.15)' },
  cyclical:  { label: '景気敏感',       short: 'C', color: '#f0883e', bg: 'rgba(240,136,62,0.15)' },
  financial: { label: '金融',           short: 'F', color: '#bc8cff', bg: 'rgba(188,140,255,0.15)' },
  other:     { label: 'その他',         short: '—', color: '#8b949e', bg: 'rgba(139,148,158,0.12)' },
};

const DEFENSIVE = new Set([
  '食料品', '医薬品', '電気・ガス業', '陸運業', '情報・通信業',
  '小売業', '水産・農林業', '空運業', '倉庫・運輸関連業', 'サービス業',
]);

const CYCLICAL = new Set([
  '鉄鋼', '化学', '非鉄金属', '機械', '輸送用機器', '建設業',
  '不動産業', '海運業', '石油・石炭製品', '鉱業', 'ゴム製品',
  'ガラス・土石製品', '繊維製品', 'パルプ・紙', '金属製品',
  '電気機器', '精密機器', 'その他製品', '卸売業',
]);

const FINANCIAL = new Set([
  '銀行業', '証券、商品先物取引業', '保険業', 'その他金融業',
]);

export function getCategory(industry: string | null): StockCategory {
  if (!industry) return 'other';
  if (DEFENSIVE.has(industry)) return 'defensive';
  if (CYCLICAL.has(industry))  return 'cyclical';
  if (FINANCIAL.has(industry)) return 'financial';
  return 'other';
}
