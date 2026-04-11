import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { IndustryItem } from '../../types';

const COLORS = [
  '#58a6ff', '#3fb950', '#ffa500', '#bc8cff', '#f85149',
  '#79c0ff', '#56d364', '#e3b341', '#d2a8ff', '#ff7b72',
];

interface Props {
  data: IndustryItem[];
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function IndustryPieChart({ data }: Props) {
  return (
    <div className="pf-chart-card">
      <h3 className="pf-chart-title">業種別ポートフォリオ</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total_cost"
            nameKey="industry"
            cx="50%"
            cy="50%"
            outerRadius={110}
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [
              `${Number(v).toLocaleString('ja-JP')} 円 (${data.find(d => d.industry === name)?.ratio.toFixed(1)}%)`,
              String(name),
            ]}
            contentStyle={{ background: '#1e242c', border: '1px solid #30363d', borderRadius: 6 }}
            labelStyle={{ color: '#ccc' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#8b949e', paddingTop: 8 }}
            formatter={(value, entry: any) => (
              <span style={{ color: '#e6edf3' }}>
                {value} <span style={{ color: '#8b949e' }}>({entry.payload.ratio.toFixed(1)}%)</span>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
