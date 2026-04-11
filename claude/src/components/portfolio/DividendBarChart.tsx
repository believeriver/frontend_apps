import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { DashboardItem } from '../../types';

interface Props {
  data: DashboardItem[];
}

export default function DividendBarChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.dividend_income != null && d.dividend_income > 0)
    .map((d) => ({
      name: d.company_name.length > 8 ? d.company_name.slice(0, 8) + '…' : d.company_name,
      fullName: d.company_name,
      income: d.dividend_income!,
      yield: d.dividend_yield,
    }))
    .sort((a, b) => b.income - a.income);

  return (
    <div className="pf-chart-card">
      <h3 className="pf-chart-title">銘柄別・年間配当収入 (円)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#8b949e', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: '#8b949e', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString('ja-JP')}
            width={70}
          />
          <Tooltip
            contentStyle={{ background: '#1e242c', border: '1px solid #30363d', borderRadius: 6 }}
            labelStyle={{ color: '#ccc' }}
            formatter={(v, _, props: any) => [
              `${Number(v).toLocaleString('ja-JP')} 円`,
              `${props.payload.fullName} (利回り ${props.payload.yield?.toFixed(2)}%)`,
            ]}
          />
          <Bar dataKey="income" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#3fb950' : i === 1 ? '#58a6ff' : '#bc8cff'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
