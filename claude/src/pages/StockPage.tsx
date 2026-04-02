import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadStock } from '../store/stockSlice';
import { loadCompany } from '../store/financeSlice';
import StockHeader from '../components/StockHeader';
import StockChart from '../components/StockChart';
import FinancialCharts from '../components/FinancialCharts';
import FinancialTable from '../components/FinancialTable';

export default function StockPage() {
  const { code } = useParams<{ code: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { history, loading: stockLoading, error: stockError } = useSelector(
    (s: RootState) => s.stock
  );
  const { data: company, loading: companyLoading, error: companyError } = useSelector(
    (s: RootState) => s.finance
  );

  useEffect(() => {
    if (code) {
      dispatch(loadStock(code));
      dispatch(loadCompany(code));
    }
  }, [code, dispatch]);

  const loading = stockLoading || companyLoading;
  const error   = stockError || companyError;

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p className="loading-text">データを取得中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="error-box">
          <p className="error-title">エラーが発生しました</p>
          <p className="error-msg">{error}</p>
          <p className="error-hint">Djangoサーバーが起動しているか、CORSの設定を確認してください。</p>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const info = company.information;

  return (
    <div className="stock-page">
      {/* 株価ヘッダー */}
      <StockHeader history={history} company={company} />

      {/* ── 企業情報（チャートの上） ── */}
      {info && (info.description || info.per || info.pbr || info.psr) && (
        <section className="section company-info-section">
          <h2 className="section-title">企業情報</h2>
          <div className="company-info-body">
            {/* 指標バッジ行 */}
            <div className="company-kpi-row">
              {info.industry && (
                <div className="kpi-card kpi-industry">
                  <span className="kpi-label">業種</span>
                  <span className="kpi-value">{info.industry}</span>
                </div>
              )}
              {info.per != null && info.per > 0 && (
                <div className="kpi-card">
                  <span className="kpi-label">PER</span>
                  <span className="kpi-value">{info.per.toFixed(2)}<small>倍</small></span>
                </div>
              )}
              {info.pbr != null && info.pbr > 0 && (
                <div className="kpi-card">
                  <span className="kpi-label">PBR</span>
                  <span className="kpi-value">{info.pbr.toFixed(2)}<small>倍</small></span>
                </div>
              )}
              {info.psr != null && info.psr > 0 && (
                <div className="kpi-card">
                  <span className="kpi-label">PSR</span>
                  <span className="kpi-value">{info.psr.toFixed(2)}<small>倍</small></span>
                </div>
              )}
            </div>
            {/* 企業説明 */}
            {info.description && (
              <p className="company-description">{info.description}</p>
            )}
          </div>
        </section>
      )}

      {/* ── 株価チャート ── */}
      {history.length > 0 && (
        <section className="section">
          <h2 className="section-title">株価チャート</h2>
          <StockChart history={history} />
        </section>
      )}

      {/* ── 業績推移 ── */}
      {company.financials?.length > 0 && (
        <>
          <section className="section">
            <h2 className="section-title">業績推移</h2>
            <FinancialCharts financials={company.financials} />
          </section>

          <section className="section">
            <FinancialTable financials={company.financials} />
          </section>
        </>
      )}
    </div>
  );
}
