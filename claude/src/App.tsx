import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch } from './store';
import { restoreSession, logout } from './store/authSlice';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './index.css';

// ── ヘッダー内の認証コントロール ────────────────────────────
function AuthControl() {
  const dispatch  = useDispatch<AppDispatch>();
  const navigate  = useNavigate();
  const { email, accessToken } = useSelector((s: RootState) => s.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  if (accessToken) {
    return (
      <div className="auth-control">
        <span className="auth-user">{email ?? 'ログイン中'}</span>
        <button className="auth-logout-btn" onClick={handleLogout}>ログアウト</button>
      </div>
    );
  }

  return (
    <div className="auth-control">
      <Link to="/login"    className="auth-nav-link">ログイン</Link>
      <Link to="/register" className="auth-nav-btn">新規登録</Link>
    </div>
  );
}

// ── レイアウト ───────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="logo">IR Dashboard</Link>
        <SearchBar />
        <AuthControl />
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <p>データは Django API より取得。投資判断の参考情報としてご利用ください。</p>
      </footer>
    </div>
  );
}

// ── アプリ本体 ───────────────────────────────────────────────
function AppInner() {
  const dispatch = useDispatch<AppDispatch>();

  // 起動時にリフレッシュトークンでセッション復元
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/stock/:code" element={<StockPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
}
