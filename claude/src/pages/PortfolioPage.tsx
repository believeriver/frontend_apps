import { useEffect, useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadPortfolio } from '../store/portfolioSlice';
import IndustryPieChart from '../components/portfolio/IndustryPieChart';
import DividendBarChart from '../components/portfolio/DividendBarChart';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import PositionModal from '../components/portfolio/PositionModal';

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
  const totalDividend     = dashboard.reduce((s, d) => s + (d.dividend_income ?? 0), 0);
  const TAX_RATE          = 0.20315;  // 所得税15.315% + 住民税5%
  const totalDividendNet  = totalDividend * (1 - TAX_RATE);
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
