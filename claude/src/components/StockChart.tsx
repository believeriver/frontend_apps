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
import { StockPoint } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { changeRange, RANGE_CONFIGS } from '../store/stockSlice';

interface Props {
  history: StockPoint[];
}

function filterByStart(history: StockPoint[], start: string | null): StockPoint[] {
  if (!start) return history; // ALL
  return history.filter((h) => h.year.slice(0, 10) >= start);
}

function formatXTick(iso: string, rangeValue: string): string {
  const date = iso.slice(0, 10);
  if (rangeValue === '1M' || rangeValue === '3M') return date.slice(5); // MM-DD
  return date.slice(0, 7); // YYYY-MM
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-date">{String(label).slice(0, 10)}</p>
      <p>終値: <strong>{Number(payload[0].value).toLocaleString('ja-JP')} 円</strong></p>
    </div>
  );
};

export default function StockChart({ history }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedRange, loading } = useSelector((s: RootState) => s.stock);

  const config = RANGE_CONFIGS.find((r) => r.value === selectedRange) ?? RANGE_CONFIGS[2];

  const filtered = useMemo(() => {
    const start = config.getStart();
    return filterByStart(history, start).map((h) => ({
      date: h.year.slice(0, 10),
      value: h.value,
    }));
  }, [history, config]);

  const firstValue = filtered[0]?.value ?? 0;
  const lastValue  = filtered[filtered.length - 1]?.value ?? firstValue;
  const isPositive = lastValue >= firstValue;
  const color      = isPositive ? '#3fb950' : '#f85149';

  const values  = filtered.map((h) => h.value);
  const minVal  = values.length ? Math.min(...values) : 0;
  const maxVal  = values.length ? Math.max(...values) : 0;
  const padding = (maxVal - minVal) * 0.05 || maxVal * 0.01;

  // X軸の間引き設定
  const xInterval = (() => {
    const n = filtered.length;
    if (n <= 30)  return 0;
    if (n <= 90)  return 4;
    if (n <= 260) return 19;  // 約1ヶ月おき
    if (n <= 780) return 59;  // 約3ヶ月おき
    return 'preserveStartEnd';
  })();

  return (
    <div className="chart-container">
      <div className="range-buttons">
        {RANGE_CONFIGS.map((r) => (
          <button
            key={r.value}
            className={`range-btn ${selectedRange === r.value ? 'active' : ''} ${
              loading && selectedRange === r.value ? 'loading' : ''
            }`}
            onClick={() => dispatch(changeRange(r.value))}
            disabled={loading}
          >
            {loading && selectedRange === r.value ? (
              <span className="btn-spinner" />
            ) : (
              r.label
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="chart-loading">
          <div className="spinner" />
          <span>データ取得中...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="chart-loading">
          <span style={{ color: 'var(--text-muted)' }}>この期間のデータがありません</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={filtered} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8b949e', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#333' }}
              interval={xInterval}
              tickFormatter={(v) => formatXTick(v, selectedRange)}
            />
            <YAxis
              domain={[minVal - padding, maxVal + padding]}
              tick={{ fill: '#8b949e', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toLocaleString('ja-JP')}
              width={78}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={firstValue} stroke="#444" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorVal)"
              dot={false}
              activeDot={{ r: 4, fill: color }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
