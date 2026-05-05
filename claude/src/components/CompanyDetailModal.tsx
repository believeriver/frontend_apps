import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { apiGetCompanyDetail, apiFetchCompanyDetail, CompanyDetailData } from '../api/companyDetail';

interface Props {
  code: string;
  name: string;
  onClose: () => void;
}

export default function CompanyDetailModal({ code, name, onClose }: Props) {
  const { accessToken, isSuperuser } = useSelector((s: RootState) => s.auth);
  const [detail,    setDetail]    = useState<CompanyDetailData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [fetching,  setFetching]  = useState(false);
  const [noData,    setNoData]    = useState(false);
  const [fetchMsg,  setFetchMsg]  = useState('');

  useEffect(() => {
    load();
    // ESCキーで閉じる
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code]);

  const load = async () => {
    setLoading(true);
    setNoData(false);
    setFetchMsg('');
    const data = await apiGetCompanyDetail(code);
    if (data) { setDetail(data); setNoData(false); }
    else       { setDetail(null); setNoData(true); }
    setLoading(false);
  };

  const handleFetch = async () => {
    if (!accessToken) return;
    setFetching(true);
    setFetchMsg('');
    try {
      const data = await apiFetchCompanyDetail(code, accessToken);
      setDetail(data);
      setNoData(false);
      setFetchMsg('更新しました');
    } catch {
      setFetchMsg('取得に失敗しました');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="cdm-overlay" onClick={onClose}>
      <div className="cdm-modal" onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="cdm-header">
          <div className="cdm-title-area">
            <span className="cdm-code">{code}</span>
            <h2 className="cdm-title">{name}</h2>
            <span className="cdm-badge">企業詳細</span>
          </div>
          <button className="cdm-close" onClick={onClose}>✕</button>
        </div>

        {/* ボディ */}
        <div className="cdm-body">
          {loading ? (
            <div className="cdm-center"><div className="spinner" /></div>
          ) : noData ? (
            <div className="cdm-no-data">
              <p className="cdm-no-data-msg">まだ詳細情報が登録されていません</p>
              {isSuperuser && (
                <button className="cdm-fetch-btn" onClick={handleFetch} disabled={fetching}>
                  {fetching ? '取得中...' : '📡 APIから取得'}
                </button>
              )}
            </div>
          ) : detail ? (
            <>
              {detail.summary && (
                <section className="cdm-section">
                  <h3 className="cdm-section-title">概要</h3>
                  <p className="cdm-text">{detail.summary}</p>
                </section>
              )}
              {detail.business && (
                <section className="cdm-section">
                  <h3 className="cdm-section-title">事業内容</h3>
                  <p className="cdm-text">{detail.business}</p>
                </section>
              )}
              {detail.feature && (
                <section className="cdm-section">
                  <h3 className="cdm-section-title">特徴・強み</h3>
                  <p className="cdm-text">{detail.feature}</p>
                </section>
              )}
              {detail.risk && (
                <section className="cdm-section">
                  <h3 className="cdm-section-title">リスク・注意点</h3>
                  <p className="cdm-text cdm-text-risk">{detail.risk}</p>
                </section>
              )}
              {detail.website && (
                <section className="cdm-section">
                  <h3 className="cdm-section-title">公式サイト</h3>
                  <a href={detail.website} target="_blank" rel="noopener noreferrer" className="cdm-link">
                    {detail.website}
                  </a>
                </section>
              )}
            </>
          ) : null}
        </div>

        {/* フッター */}
        {!loading && (
          <div className="cdm-footer">
            <span className="cdm-fetched-at">
              {detail?.fetched_at
                ? `最終取得: ${new Date(detail.fetched_at).toLocaleString('ja-JP')}`
                : ''}
            </span>
            <div className="cdm-footer-actions">
              {fetchMsg && <span className="cdm-fetch-msg">{fetchMsg}</span>}
              {isSuperuser && !noData && (
                <button className="cdm-fetch-btn" onClick={handleFetch} disabled={fetching}>
                  {fetching ? '取得中...' : '🔄 更新'}
                </button>
              )}
              <button className="cdm-close-btn" onClick={onClose}>閉じる</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
