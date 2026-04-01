import { FinancialRecord } from '../types';

interface Props {
  financials: FinancialRecord[];
}

function fmtOku(v: number | null): string {
  if (v == null) return '—';
  return `${(Math.round(v / 1_000_000) / 100).toLocaleString('ja-JP')}億`;
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${v.toFixed(2)}%`;
}

function fmtNum(v: number | null, dec = 2): string {
  if (v == null) return '—';
  return v.toLocaleString('ja-JP', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

type RowDef = {
  label: string;
  render: (r: FinancialRecord) => string;
};

const ROWS: RowDef[] = [
  { label: '売上高',         render: (r) => fmtOku(r.sales) },
  { label: '営業利益率',     render: (r) => fmtPct(r.operating_margin) },
  { label: '営業CF',         render: (r) => fmtOku(r.operating_cash_flow) },
  { label: '現金・同等物',   render: (r) => fmtOku(r.cash_and_equivalents) },
  { label: 'EPS (円)',       render: (r) => fmtNum(r.eps) },
  { label: '自己資本比率',   render: (r) => fmtPct(r.equity_ratio) },
  { label: '一株配当 (円)',  render: (r) => fmtNum(r.dividend_per_share) },
  { label: '配当性向',       render: (r) => fmtPct(r.payout_ratio) },
];

export default function FinancialTable({ financials }: Props) {
  // 新しい年が左になるよう逆順
  const sorted = [...financials].reverse();

  return (
    <div className="table-wrapper">
      <h3 className="section-title">財務データ一覧</h3>
      <div className="table-scroll">
        <table className="financial-table">
          <thead>
            <tr>
              <th className="th-label">項目</th>
              {sorted.map((d) => (
                <th key={d.fiscal_year}>{d.fiscal_year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ label, render }) => {
              const hasData = sorted.some((d) => render(d) !== '—');
              if (!hasData) return null;
              return (
                <tr key={label}>
                  <td className="td-label">{label}</td>
                  {sorted.map((d) => (
                    <td key={d.fiscal_year} className="td-value">{render(d)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
