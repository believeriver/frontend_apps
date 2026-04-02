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
  const error = stockError || companyError;

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

  return (
    <div className="stock-page">
      <StockHeader history={history} company={company} />

      {history.length > 0 && (
        <section className="section">
          <h2 className="section-title">株価チャート</h2>
          <StockChart history={history} />
        </section>
      )}

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

      {company.information?.description && (
        <section className="section">
          <h2 className="section-title">企業概要</h2>
          <p className="description">{company.information.description}</p>
        </section>
      )}
    </div>
  );
}
