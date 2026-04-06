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

const TS = {
  contentStyle: { background: '#1e242c', border: '1px solid #30363d', borderRadius: 6 },
  labelStyle:   { color: '#ccc' },
  itemStyle:    { color: '#e6edf3' },
};

const AXIS = {
  tick:    { fill: '#8b949e', fontSize: 11 },
  axisLine:{ stroke: '#333' },
};

type ChartRecord = Record<string, string | number | null>;

function hasData(data: ChartRecord[], ...keys: string[]): boolean {
  return data.some((d) => keys.some((k) => d[k] != null && d[k] !== 0));
}

interface MiniBarProps {
  title: string;
  data: ChartRecord[];
  bars: { key: string; color: string; unit?: string }[];
  yUnit?: string;
  height?: number;
}

function MiniBar({ title, data, bars, yUnit = '', height = 240 }: MiniBarProps) {
  if (!hasData(data, ...bars.map((b) => b.key))) return null;
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="year" {...AXIS} tickLine={false} />
          <YAxis {...AXIS} axisLine={false} tickLine={false} width={58} unit={yUnit} />
          <Tooltip {...TS} formatter={(v, name) => {
            const bar = bars.find((b) => b.key === name);
            return [`${Number(v).toLocaleString('ja-JP')}${bar?.unit ?? yUnit}`, name];
          }} />
          {bars.length > 1 && <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />}
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MiniLineProps {
  title: string;
  data: ChartRecord[];
  lines: { key: string; color: string }[];
  yUnit?: string;
  height?: number;
}

function MiniLine({ title, data, lines, yUnit = '', height = 240 }: MiniLineProps) {
  if (!hasData(data, ...lines.map((l) => l.key))) return null;
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="year" {...AXIS} tickLine={false} />
          <YAxis {...AXIS} axisLine={false} tickLine={false} width={48} unit={yUnit} />
          <Tooltip {...TS} formatter={(v, name) => [`${Number(v).toFixed(2)}${yUnit}`, name]} />
          {lines.length > 1 && <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />}
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color}
              strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// EPS は正負で色分け
function EpsChart({ data, height = 240 }: { data: ChartRecord[]; height?: number }) {
  if (!hasData(data, 'EPS')) return null;
  return (
    <div className="chart-card">
      <h3 className="chart-title">EPS・一株当たり利益 (円)</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="year" {...AXIS} tickLine={false} />
          <YAxis {...AXIS} axisLine={false} tickLine={false} width={58} unit="円" />
          <Tooltip {...TS} formatter={(v) => [`${Number(v).toLocaleString('ja-JP')}円`, 'EPS']} />
          <Bar dataKey="EPS" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={(d.EPS as number) >= 0 ? '#4e8ef7' : '#f85149'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function FinancialCharts({ financials }: Props) {
  const recent = financials.slice(-12);

  // ① 売上高（億円）
  const salesData: ChartRecord[] = recent.map((d) => ({
    year: d.fiscal_year,
    売上高: toOku(d.sales),
  }));

  // ② 営業CF・現金等（億円）
  const cfData: ChartRecord[] = recent.map((d) => ({
    year: d.fiscal_year,
    営業CF:  toOku(d.operating_cash_flow),
    現金等:  toOku(d.cash_and_equivalents),
  }));

  // ③ EPS（円）
  const epsData: ChartRecord[] = recent.map((d) => ({
    year: d.fiscal_year,
    EPS: d.eps,
  }));

  // ④ 一株配当（円）
  const dividendData: ChartRecord[] = recent.map((d) => ({
    year: d.fiscal_year,
    一株配当: d.dividend_per_share,
  }));

  // ⑤ 営業利益率・配当性向（%）
  const marginData: ChartRecord[] = recent.map((d) => ({
    year: d.fiscal_year,
    営業利益率: d.operating_margin,
    配当性向:   d.payout_ratio,
  }));

  // ⑥ 自己資本比率（%）
  const equityData: ChartRecord[] = recent.map((d) => ({
    year: d.fiscal_year,
    自己資本比率: d.equity_ratio,
  }));

  return (
    <div className="financial-charts">
      {/* ① 売上高 */}
      <MiniBar
        title="売上高 (億円)"
        data={salesData}
        bars={[{ key: '売上高', color: '#4e8ef7', unit: '億円' }]}
      />

      {/* ② 営業CF・現金等 */}
      <MiniBar
        title="営業CF・現金等 (億円)"
        data={cfData}
        bars={[
          { key: '営業CF', color: '#58a6ff', unit: '億円' },
          { key: '現金等', color: '#3fb950', unit: '億円' },
        ]}
      />

      {/* ③ EPS */}
      <EpsChart data={epsData} />

      {/* ④ 一株配当 */}
      <MiniBar
        title="一株配当 (円)"
        data={dividendData}
        bars={[{ key: '一株配当', color: '#3fb950', unit: '円' }]}
      />

      {/* ⑤ 営業利益率・配当性向 */}
      <MiniLine
        title="営業利益率・配当性向 (%)"
        data={marginData}
        lines={[
          { key: '営業利益率', color: '#4e8ef7' },
          { key: '配当性向',   color: '#ffa500' },
        ]}
        yUnit="%"
      />

      {/* ⑥ 自己資本比率 */}
      <MiniLine
        title="自己資本比率 (%)"
        data={equityData}
        lines={[{ key: '自己資本比率', color: '#bc8cff' }]}
        yUnit="%"
      />
    </div>
  );
}
