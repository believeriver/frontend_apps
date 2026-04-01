import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { FinancialRecord } from '../types';

interface Props {
  financials: FinancialRecord[];
}

function toOku(v: number | null): number | null {
  if (v == null) return null;
  return Math.round(v / 1_000_000) / 100;
}

const tooltipStyle = {
  contentStyle: { background: '#1e242c', border: '1px solid #30363d', borderRadius: 6 },
  labelStyle: { color: '#ccc' },
  itemStyle: { color: '#e6edf3' },
};

export default function FinancialCharts({ financials }: Props) {
  // 直近10件
  const recent = financials.slice(-10);

  const cashFlowData = recent
    .filter((d) => d.operating_cash_flow != null)
    .map((d) => ({
      year: d.fiscal_year,
      営業CF: toOku(d.operating_cash_flow),
      現金等: toOku(d.cash_and_equivalents),
    }));

  const marginData = recent
    .filter((d) => d.operating_margin != null)
    .map((d) => ({
      year: d.fiscal_year,
      営業利益率: d.operating_margin,
      配当性向: d.payout_ratio,
    }));

  const dividendData = recent
    .filter((d) => d.dividend_per_share != null)
    .map((d) => ({
      year: d.fiscal_year,
      一株配当: d.dividend_per_share,
    }));

  return (
    <div className="financial-charts">
      {cashFlowData.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">営業CF・現金等 (億円)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cashFlowData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="year" tick={{ fill: '#8b949e', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#333' }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v} 億円`]} />
              <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />
              <Bar dataKey="営業CF" fill="#4e8ef7" radius={[3, 3, 0, 0]} />
              <Bar dataKey="現金等" fill="#00c805" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {marginData.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">営業利益率・配当性向 (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={marginData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="year" tick={{ fill: '#8b949e', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#333' }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={40} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)}%`]} />
              <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />
              <Line type="monotone" dataKey="営業利益率" stroke="#4e8ef7" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="配当性向" stroke="#ffa500" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {dividendData.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">一株配当 (円)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dividendData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="year" tick={{ fill: '#8b949e', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#333' }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v} 円`]} />
              <Bar dataKey="一株配当" radius={[3, 3, 0, 0]}>
                {dividendData.map((_, i) => (
                  <Cell key={i} fill="#3fb950" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
