import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { DashboardItem } from '../../types';

const COLORS = [
  '#3fb950', '#58a6ff', '#bc8cff', '#ffa500', '#79c0ff',
  '#56d364', '#e3b341', '#d2a8ff', '#ff7b72', '#39d353',
];

interface Props {
  data: DashboardItem[];
  topN?: number;
}

export default function DividendBarChart({ data, topN = 20 }: Props) {
  const chartData = data
    .filter((d) => d.dividend_income != null && d.dividend_income > 0)
    .sort((a, b) => b.dividend_income! - a.dividend_income!)
    .slice(0, topN)
    .map((d) => ({
      name: d.company_name.length > 12 ? d.company_name.slice(0, 12) + '…' : d.company_name,
      fullName: d.company_name,
      code: d.company_code,
      income: Math.round(d.dividend_income!),
      yield: d.dividend_yield,
    }));

  // 横向きバーなので高さは件数に応じて確保
  const chartHeight = Math.max(300, chartData.length * 28 + 40);

  return (
    <div className="pf-chart-card">
      <h3 className="pf-chart-title">
        配当収入 上位{Math.min(topN, chartData.length)}銘柄（年間・円）
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 4, right: 80, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#8b949e', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#e6edf3', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{ background: '#1e242c', border: '1px solid #30363d', borderRadius: 6 }}
            labelStyle={{ color: '#ccc' }}
            formatter={(v, _, props: any) => [
              `${Number(v).toLocaleString('ja-JP')} 円`,
              `${props.payload.fullName}（${props.payload.code}）/ 利回 ${props.payload.yield?.toFixed(2)}%`,
            ]}
          />
          <Bar dataKey="income" radius={[0, 4, 4, 0]} barSize={18}
            label={{
              position: 'right',
              formatter: (v: any) => `${Number(v).toLocaleString('ja-JP')}`,
              fill: '#8b949e',
              fontSize: 11,
            }}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
