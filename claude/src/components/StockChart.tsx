import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { StockPoint, TimeRange } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setRange } from '../store/stockSlice';

interface Props {
  history: StockPoint[];
}

const RANGES: { label: string; value: TimeRange; months: number }[] = [
  { label: '1ヶ月', value: '1M', months: 1 },
  { label: '3ヶ月', value: '3M', months: 3 },
  { label: '6ヶ月', value: '6M', months: 6 },
  { label: '1年', value: '1Y', months: 12 },
  { label: '3年', value: '3Y', months: 36 },
  { label: '5年', value: '5Y', months: 60 },
];

function filterByRange(history: StockPoint[], months: number): StockPoint[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return history.filter((h) => new Date(h.year) >= cutoff);
}

function formatDate(iso: string): string {
  return iso.slice(0, 10); // "2025-10-03"
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-date">{label}</p>
      <p>終値: <strong>{Number(payload[0].value).toLocaleString('ja-JP')} 円</strong></p>
    </div>
  );
};

export default function StockChart({ history }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const selectedRange = useSelector((s: RootState) => s.stock.selectedRange);

  const rangeConfig = RANGES.find((r) => r.value === selectedRange) ?? RANGES[3];
  const filtered = useMemo(
    () => filterByRange(history, rangeConfig.months).map((h) => ({
      date: formatDate(h.year),
      value: h.value,
    })),
    [history, rangeConfig.months]
  );

  const firstValue = filtered[0]?.value ?? 0;
  const lastValue = filtered[filtered.length - 1]?.value ?? firstValue;
  const isPositive = lastValue >= firstValue;
  const color = isPositive ? '#3fb950' : '#f85149';

  const values = filtered.map((h) => h.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.05 || maxVal * 0.01;

  return (
    <div className="chart-container">
      <div className="range-buttons">
        {RANGES.map((r) => (
          <button
            key={r.value}
            className={`range-btn ${selectedRange === r.value ? 'active' : ''}`}
            onClick={() => dispatch(setRange(r.value))}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={filtered} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8b949e', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minVal - padding, maxVal + padding]}
            tick={{ fill: '#8b949e', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toLocaleString('ja-JP')}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={firstValue} stroke="#555" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#colorVal)"
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
