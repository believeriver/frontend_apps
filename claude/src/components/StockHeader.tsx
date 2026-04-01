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

export default function StockHeader({ history, company }: Props) {
  const currentPrice = parsePrice(company.stock);
  const prevClose = history.length >= 2 ? history[history.length - 2].value : null;
  const priceChange = prevClose != null ? currentPrice - prevClose : null;
  const pctChange = prevClose != null && prevClose !== 0 ? (priceChange! / prevClose) * 100 : null;

  const isPositive = priceChange == null ? true : priceChange >= 0;
  const arrow = isPositive ? '▲' : '▼';
  const changeClass = isPositive ? 'positive' : 'negative';

  const high52 = history.length ? Math.max(...history.map((h) => h.value)) : null;
  const low52  = history.length ? Math.min(...history.map((h) => h.value)) : null;

  return (
    <div className="stock-header">
      <div className="stock-title">
        <h1 className="stock-name">{company.name}</h1>
        <span className="stock-code">{company.code}</span>
      </div>

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

      <div className="stock-meta">
        {company.dividend != null && (
          <div className="meta-item">
            <span className="meta-label">配当利回り</span>
            <span className="meta-value positive">{fmt(company.dividend, 2)}%</span>
          </div>
        )}
        {company.dividend_rank != null && (
          <div className="meta-item">
            <span className="meta-label">配当ランク</span>
            <span className="meta-value">{company.dividend_rank}位</span>
          </div>
        )}
        {high52 != null && (
          <div className="meta-item">
            <span className="meta-label">期間高値</span>
            <span className="meta-value positive">{fmt(high52)}</span>
          </div>
        )}
        {low52 != null && (
          <div className="meta-item">
            <span className="meta-label">期間安値</span>
            <span className="meta-value negative">{fmt(low52)}</span>
          </div>
        )}
        {company.dividend_update && (
          <div className="meta-item" style={{ minWidth: 220 }}>
            <span className="meta-label">データ更新</span>
            <span className="meta-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {company.dividend_update}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
