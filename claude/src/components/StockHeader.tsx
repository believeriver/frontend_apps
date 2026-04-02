import { StockPoint, CompanyData } from '../types';

interface Props {
  history: StockPoint[];
  company: CompanyData;
}

function parsePrice(s: string): number {
  return parseFloat(s.replace(/,/g, ''));
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString('ja-JP', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

interface MetaItem {
  label: string;
  value: string;
  cls?: string;
}

export default function StockHeader({ history, company }: Props) {
  const currentPrice = parsePrice(company.stock);
  const prevClose    = history.length >= 2 ? history[history.length - 2].value : null;
  const priceChange  = prevClose != null ? currentPrice - prevClose : null;
  const pctChange    = prevClose != null && prevClose !== 0
    ? (priceChange! / prevClose) * 100
    : null;

  const isPositive = priceChange == null ? true : priceChange >= 0;
  const arrow      = isPositive ? '▲' : '▼';
  const changeClass = isPositive ? 'positive' : 'negative';

  const high52 = history.length ? Math.max(...history.map((h) => h.value)) : null;
  const low52  = history.length ? Math.min(...history.map((h) => h.value)) : null;

  const info = company.information;

  // メタ情報リスト
  const metaItems: MetaItem[] = [
    ...(company.dividend != null
      ? [{ label: '配当利回り', value: `${fmt(company.dividend, 2)}%`, cls: 'positive' }]
      : []),
    ...(company.dividend_rank != null
      ? [{ label: '配当ランク', value: `${company.dividend_rank}位` }]
      : []),
    // PER・PSR・PBR
    ...(info?.per != null && info.per > 0
      ? [{ label: 'PER', value: `${fmt(info.per, 2)}倍` }]
      : []),
    ...(info?.pbr != null && info.pbr > 0
      ? [{ label: 'PBR', value: `${fmt(info.pbr, 2)}倍` }]
      : []),
    ...(info?.psr != null && info.psr > 0
      ? [{ label: 'PSR', value: `${fmt(info.psr, 2)}倍` }]
      : []),
    // 52週高値・安値
    ...(high52 != null
      ? [{ label: '期間高値', value: fmt(high52), cls: 'positive' }]
      : []),
    ...(low52 != null
      ? [{ label: '期間安値', value: fmt(low52), cls: 'negative' }]
      : []),
    ...(company.dividend_update
      ? [{ label: '更新日時', value: company.dividend_update }]
      : []),
  ];

  return (
    <div className="stock-header">
      {/* タイトル行 */}
      <div className="stock-title">
        <h1 className="stock-name">{company.name}</h1>
        <span className="stock-code">{company.code}</span>
        {info?.industry && (
          <span className="stock-industry">{info.industry}</span>
        )}
      </div>

      {/* 株価・前日比 */}
      <div className="stock-price-block">
        <span className="stock-price">{fmt(currentPrice)}</span>
        <span className="stock-currency">JPY</span>
        {priceChange != null && pctChange != null && (
          <span className={`stock-change ${changeClass}`}>
            {arrow} {fmt(Math.abs(priceChange), 0)}
            &nbsp;({isPositive ? '+' : ''}{fmt(pctChange, 2)}%)
          </span>
        )}
      </div>

      {/* メタ指標グリッド */}
      <div className="stock-meta">
        {metaItems.map(({ label, value, cls }) => (
          <div key={label} className="meta-item">
            <span className="meta-label">{label}</span>
            <span className={`meta-value ${cls ?? ''}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
