import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const EXAMPLES = ['8963', '7203', '9984', '6758', '9433'];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const go = (code: string) => navigate(`/stock/${code}`);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = query.trim();
    if (code) go(code);
  };

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">IR 情報ダッシュボード</h1>
        <p className="home-subtitle">銘柄コードを入力して株価・財務情報を確認できます</p>

        <form onSubmit={handleSubmit} className="home-search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="銘柄コードを入力 (例: 8963)"
            className="home-search-input"
            autoFocus
          />
          <button type="submit" className="home-search-btn">検索</button>
        </form>

        <div className="example-links">
          <span className="example-label">例：</span>
          {EXAMPLES.map((code) => (
            <button key={code} className="example-btn" onClick={() => go(code)}>
              {code}
            </button>
          ))}
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>株価チャート</h3>
          <p>インタラクティブなチャートで株価の推移を確認</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>業績グラフ</h3>
          <p>売上高・営業利益・純利益の棒グラフ</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>財務データ</h3>
          <p>ROE・ROA・EPS などの指標一覧</p>
        </div>
      </div>
    </div>
  );
}
