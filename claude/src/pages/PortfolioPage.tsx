import { useEffect, useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadPortfolio } from '../store/portfolioSlice';
import IndustryPieChart from '../components/portfolio/IndustryPieChart';
import DividendBarChart from '../components/portfolio/DividendBarChart';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import PositionModal from '../components/portfolio/PositionModal';
import { getCategory, CATEGORY_META, StockCategory } from '../utils/stockCategory';

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="pf-summary-card">
      <span className="pf-summary-label">{label}</span>
      <span className="pf-summary-value">{value}</span>
      {sub && <span className="pf-summary-sub">{sub}</span>}
    </div>
  );
}

export default function PortfolioPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboard, industry, items, currentPrices, loading, error } = useSelector(
    (s: RootState) => s.portfolio
  );
  const { accessToken } = useSelector((s: RootState) => s.auth);
  const [showAdd, setShowAdd] = useState(false);
  const [showCatInfo, setShowCatInfo] = useState(false);

  useEffect(() => {
    if (accessToken) dispatch(loadPortfolio());
  }, [accessToken, dispatch]);

  // ログイン必須
  if (!accessToken) {
    return (
      <div className="page-center">
        <div className="error-box" style={{ borderColor: 'var(--accent)' }}>
          <p className="error-title" style={{ color: 'var(--accent)' }}>ログインが必要です</p>
          <p className="error-msg">ポートフォリオ機能はログイン後にご利用いただけます。</p>
          <Link to="/login" className="auth-btn" style={{ marginTop: 14, display: 'block', textAlign: 'center' }}>
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p className="loading-text">ポートフォリオを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="error-box">
          <p className="error-title">エラー</p>
          <p className="error-msg">{error}</p>
        </div>
      </div>
    );
  }

  // サマリー計算
  const totalCost       = dashboard.reduce((s, d) => s + d.avg_purchase_price * d.total_shares, 0);
  // カテゴリ別集計
  const categoryTotals = dashboard.reduce<Record<StockCategory, number>>(
    (acc, d) => {
      const cat  = getCategory(d.industry);
      const cost = d.avg_purchase_price * d.total_shares;
      acc[cat]  += cost;
      return acc;
    },
    { defensive: 0, cyclical: 0, financial: 0, other: 0 }
  );
  const categoryOrder: StockCategory[] = ['defensive', 'cyclical', 'financial', 'other'];

  const totalDividend  = dashboard.reduce((s, d) => s + (d.dividend_income ?? 0), 0);
  const TAX_RATE       = 0.20315;  // 所得税15.315% + 住民税5%

  // NISA対応の税引後計算
  // nisa_shares分は非課税、taxable_shares分のみ課税
  const totalDividendNet = dashboard.reduce((s, d) => {
    if (!d.dividend_income || d.total_shares === 0) return s;
    const perShare    = d.dividend_income / d.total_shares;
    const nisaIncome  = perShare * d.nisa_shares;               // 非課税
    const taxableIncome = perShare * d.taxable_shares;          // 課税
    return s + nisaIncome + taxableIncome * (1 - TAX_RATE);
  }, 0);
  const avgYield          = totalCost > 0 ? (totalDividend / totalCost) * 100 : 0;
  const stockCount      = dashboard.length;

  // 評価額・損益計算
  const totalValue = dashboard.reduce((s, d) => {
    const price = currentPrices[d.company_code];
    return price != null ? s + price * d.total_shares : s + d.avg_purchase_price * d.total_shares;
  }, 0);
  const totalGain    = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <div className="portfolio-page">
      {/* ページヘッダー */}
      <div className="pf-page-header">
        <div>
          <h1 className="pf-page-title">マイポートフォリオ</h1>
          <p className="pf-page-sub">{stockCount} 銘柄保有</p>
        </div>
        <button className="pf-add-btn" onClick={() => setShowAdd(true)}>
          ＋ 銘柄を追加
        </button>
      </div>

      {/* サマリーカード */}
      <div className="pf-summary-row">
        <SummaryCard
          label="総投資額"
          value={`${Math.round(totalCost).toLocaleString('ja-JP')} 円`}
        />
        <SummaryCard
          label="評価額"
          value={`${totalValue.toLocaleString('ja-JP')} 円`}
          sub={
            <span className={totalGain >= 0 ? 'gain-positive' : 'gain-negative'}>
              {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円
              　({totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%)
            </span>
          }
        />
        <SummaryCard
          label="年間配当収入（税引前）"
          value={`${totalDividend.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円`}
          sub={`月平均 ${(totalDividend / 12).toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円`}
        />
        <SummaryCard
          label="年間配当収入（税引後 20.315%）"
          value={`${totalDividendNet.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円`}
          sub={`月平均 ${(totalDividendNet / 12).toLocaleString('ja-JP', { maximumFractionDigits: 0 })} 円`}
        />
        <SummaryCard
          label="ポートフォリオ利回り"
          value={`${avgYield.toFixed(2)} %`}
        />
        <SummaryCard
          label="保有銘柄数"
          value={`${stockCount} 銘柄`}
        />
      </div>

      {/* カテゴリ別積み上げバー */}
      {totalCost > 0 && (
        <div className="category-bar-card">
          <div className="category-bar-header">
            <h3 className="pf-chart-title" style={{ marginBottom: 0 }}>銘柄区分</h3>
            <button
              className="cat-info-btn"
              onClick={() => setShowCatInfo((v) => !v)}
              title="カテゴリの説明を見る"
            >
              {showCatInfo ? '✕' : 'ℹ'}
            </button>
          </div>

          {/* カテゴリ説明パネル */}
          {showCatInfo && (
            <div className="cat-info-panel">
              {([
                {
                  cat: 'defensive' as const,
                  desc: '景気変動の影響を受けにくく、不況時も安定した収益を維持しやすい銘柄群。生活必需品・医療・インフラ系が中心。',
                  industries: '食料品・医薬品・電気ガス・陸運・情報通信・小売・水産農林・空運 など',
                },
                {
                  cat: 'cyclical' as const,
                  desc: '景気拡大期に大きく伸び、後退期には業績が落ちやすい銘柄群。製造業・資源・建設・輸出系が中心。',
                  industries: '鉄鋼・化学・機械・自動車・建設・不動産・海運・電気機器・卸売 など',
                },
                {
                  cat: 'financial' as const,
                  desc: '金融政策・金利動向の影響を強く受ける銘柄群。景気敏感の性質も持つが独立カテゴリとして分類。',
                  industries: '銀行・証券・保険・その他金融',
                },
                {
                  cat: 'other' as const,
                  desc: '上記3区分に分類されない業種。業種情報が未設定の銘柄もここに含まれます。',
                  industries: 'その他',
                },
              ] as const).map(({ cat, desc, industries }) => {
                const m = CATEGORY_META[cat];
                return (
                  <div key={cat} className="cat-info-row">
                    <span className="category-badge"
                      style={{ color: m.color, background: m.bg, borderColor: m.color, flexShrink: 0 }}>
                      {m.short === '—' ? m.label : `${m.short} ${m.label}`}
                    </span>
                    <div className="cat-info-text">
                      <p className="cat-info-desc">{desc}</p>
                      <p className="cat-info-industries">対象業種：{industries}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="category-bar-track">
            {categoryOrder.map((cat) => {
              const pct = (categoryTotals[cat] / totalCost) * 100;
              if (pct < 0.1) return null;
              const m = CATEGORY_META[cat];
              return (
                <div
                  key={cat}
                  className="category-bar-seg"
                  style={{ width: `${pct}%`, background: m.color }}
                  title={`${m.label}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="category-bar-legend">
            {categoryOrder.map((cat) => {
              const pct = (categoryTotals[cat] / totalCost) * 100;
              const m   = CATEGORY_META[cat];
              const cnt = dashboard.filter((d) => getCategory(d.industry) === cat).length;
              return (
                <div key={cat} className="category-legend-item">
                  <span className="category-legend-dot" style={{ background: m.color }} />
                  <span className="category-legend-label">{m.label}</span>
                  <span className="category-legend-pct" style={{ color: m.color }}>
                    {pct.toFixed(1)}%
                  </span>
                  <span className="category-legend-count">{cnt} 銘柄</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* グラフ行: 上下2段レイアウト */}
      {dashboard.length > 0 && (
        <div className="pf-charts-col">
          {/* 上段: 円グラフ（業種別）*/}
          {industry.length > 0 && <IndustryPieChart data={industry} />}
          {/* 下段: 横棒グラフ（配当収入上位20）*/}
          <DividendBarChart data={dashboard} topN={20} />
        </div>
      )}

      {/* 保有銘柄テーブル */}
      <div className="section" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            保有銘柄一覧
          </h2>
        </div>
        {dashboard.length === 0 ? (
          <div className="pf-empty">
            <p>まだ銘柄が登録されていません。</p>
            <button className="pf-add-btn" onClick={() => setShowAdd(true)}>
              ＋ 最初の銘柄を追加
            </button>
          </div>
        ) : (
          <HoldingsTable dashboard={dashboard} items={items} currentPrices={currentPrices} />
        )}
      </div>

      {showAdd && <PositionModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
