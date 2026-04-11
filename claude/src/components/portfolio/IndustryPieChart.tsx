import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector,
} from 'recharts';
import { useState } from 'react';
import { IndustryItem } from '../../types';

const COLORS = [
  '#58a6ff', '#3fb950', '#ffa500', '#bc8cff', '#f85149',
  '#79c0ff', '#56d364', '#e3b341', '#d2a8ff', '#ff7b72',
  '#39d353', '#a371f7', '#ffa657', '#ff6e96', '#2ea043',
  '#388bfd', '#e3b341', '#db6d28', '#8b949e', '#6e7681',
  '#58a6ff', '#3fb950',
];

interface Props {
  data: IndustryItem[];
}

// アクティブ時の強調スライス
const ActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#e6edf3" fontSize={13} fontWeight={700}>
        {payload.industry.length > 10 ? payload.industry.slice(0, 10) + '…' : payload.industry}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#e6edf3" fontSize={18} fontWeight={800}>
        {payload.ratio.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#8b949e" fontSize={11}>
        {payload.total_cost.toLocaleString('ja-JP')} 円
      </text>
    </g>
  );
};

export default function IndustryPieChart({ data }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="pf-chart-card">
      <h3 className="pf-chart-title">業種別ポートフォリオ</h3>
      <div className="pie-layout">
        {/* ドーナツチャート */}
        <div className="pie-chart-area">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total_cost"
                nameKey="industry"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                activeShape={ActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                {...{ activeIndex } as any}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${Number(v).toLocaleString('ja-JP')} 円`]}
                contentStyle={{ background: '#1e242c', border: '1px solid #30363d', borderRadius: 6 }}
                labelStyle={{ color: '#ccc' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* カスタム凡例テーブル */}
        <div className="pie-legend">
          {data.map((item, i) => (
            <div
              key={item.industry}
              className={`pie-legend-item ${activeIndex === i ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="pie-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="pie-legend-name">{item.industry}</span>
              <span className="pie-legend-pct">{item.ratio.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
