import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch } from './store';
import { restoreSession, logout } from './store/authSlice';
import SearchBar from './components/SearchBar';
import TechSearchBar from './components/TechSearchBar';
import { useTheme } from './hooks/useTheme';

// Landing
import LandingPage    from './pages/LandingPage';
import DisclaimerPage from './pages/DisclaimerPage';
import PrivacyPage    from './pages/PrivacyPage';
import ContactPage       from './pages/ContactPage';
import ContactManagePage from './pages/ContactManagePage';
import ProfilePage       from './pages/ProfilePage';
import SettingsPage        from './pages/SettingsPage';
import AnnouncePage        from './pages/announce/AnnouncePage';
import AnnounceManagePage  from './pages/announce/AnnounceManagePage';

// IR Dashboard pages
import HomePage      from './pages/HomePage';
import StockPage     from './pages/StockPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import PortfolioPage from './pages/PortfolioPage';

// TechBlog pages
import TechlogListPage   from './pages/techlog/TechlogListPage';
import TechlogDetailPage from './pages/techlog/TechlogDetailPage';
import TechlogEditorPage from './pages/techlog/TechlogEditorPage';
import TechlogMyPage     from './pages/techlog/TechlogMyPage';

// Analytics
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';

// Blog pages
import BlogListPage    from './pages/blog/BlogListPage';
import BlogDetailPage  from './pages/blog/BlogDetailPage';
import BlogEditorPage  from './pages/blog/BlogEditorPage';
import BlogManagePage  from './pages/blog/BlogManagePage';

import './index.css';

// ── アプリ切替タブ ────────────────────────────────────────
function AppSwitcher() {
  const location    = useLocation();
  const isTechlog   = location.pathname.startsWith('/techlog');
  const isBlog      = location.pathname.startsWith('/blog');
  const isAnalytics = location.pathname.startsWith('/analytics');
  const isIR        = !isTechlog && !isBlog && !isAnalytics;
  const { isSuperuser } = useSelector((s: RootState) => s.auth);
  return (
    <div className="app-switcher">
      <NavLink to="/ir"      className={`app-tab ${isIR        ? 'active' : ''}`}>📈 IR</NavLink>
      <NavLink to="/techlog" className={`app-tab ${isTechlog   ? 'active' : ''}`}>✍️ Tech</NavLink>
      <NavLink to="/blog"    className={`app-tab ${isBlog      ? 'active' : ''}`}>📝 Blog</NavLink>
      {isSuperuser && (
        <NavLink to="/analytics" className={`app-tab ${isAnalytics ? 'active' : ''}`}>📊 Analytics</NavLink>
      )}
    </div>
  );
}

// ── 認証コントロール ──────────────────────────────────────
function AuthControl() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, accessToken } = useSelector((s: RootState) => s.auth);
  const isTechlog = location.pathname.startsWith('/techlog');

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  if (accessToken) {
    return (
      <div className="auth-control">
        {!isTechlog && (
          <NavLink
            to="/portfolio"
            className={({ isActive }) => `auth-nav-link pf-nav-link ${isActive ? 'active' : ''}`}
          >
            ポートフォリオ
          </NavLink>
        )}
        {isTechlog && (
          <NavLink
            to="/techlog/my"
            className={({ isActive }) => `auth-nav-link pf-nav-link ${isActive ? 'active' : ''}`}
          >
            マイ記事
          </NavLink>
        )}
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

// ── テーマ切替ボタン ──────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

// ── レイアウト ────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  const location  = useLocation();
  const isTechlog = location.pathname.startsWith('/techlog');
  const isBlog    = location.pathname.startsWith('/blog');
  const isIR      = !isTechlog && !isBlog && !location.pathname.startsWith('/analytics');
  const isEditor  = location.pathname.includes('/new') || location.pathname.includes('/edit');

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="logo" title="ポータルへ戻る">Home</Link>
        <AppSwitcher />
        {isIR      && !isEditor && <SearchBar />}
        {isTechlog && !isEditor && <TechSearchBar />}
        <ThemeToggle />
        <AuthControl />
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <p>
          {isTechlog
            ? 'TechBlog — 技術ブログプラットフォーム'
            : isBlog
            ? 'Blog — 日々の記録'
            : 'データは Django API より取得。投資判断の参考情報としてご利用ください。'}
        </p>
      </footer>
    </div>
  );
}

// ── ルーティング（Landing は Layout 外） ─────────────────────
function InnerRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const isLegalPage = ['/disclaimer', '/privacy', '/contact', '/contact/manage', '/profile', '/settings', '/announce', '/announce/manage'].includes(location.pathname);

  if (isLanding || isLegalPage) {
    return (
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/privacy"    element={<PrivacyPage />} />
        <Route path="/contact"        element={<ContactPage />} />
        <Route path="/contact/manage" element={<ContactManagePage />} />
        <Route path="/profile"        element={<ProfilePage />} />
        <Route path="/settings"        element={<SettingsPage />} />
        <Route path="/announce"        element={<AnnouncePage />} />
        <Route path="/announce/manage" element={<AnnounceManagePage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* IR Dashboard */}
        <Route path="/ir"            element={<HomePage />} />
        <Route path="/stock/:code"   element={<StockPage />} />
        <Route path="/portfolio"     element={<PortfolioPage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />

        {/* TechBlog */}
        <Route path="/techlog"            element={<TechlogListPage />} />
        <Route path="/techlog/my"         element={<TechlogMyPage />} />
        <Route path="/techlog/new"        element={<TechlogEditorPage />} />
        <Route path="/techlog/:uuid"      element={<TechlogDetailPage />} />
        <Route path="/techlog/:uuid/edit" element={<TechlogEditorPage />} />

        {/* Analytics */}
        <Route path="/analytics" element={<AnalyticsDashboard />} />

        {/* Blog */}
        <Route path="/blog"            element={<BlogListPage />} />
        <Route path="/blog/manage"     element={<BlogManagePage />} />
        <Route path="/blog/new"        element={<BlogEditorPage />} />
        <Route path="/blog/:uuid"      element={<BlogDetailPage />} />
        <Route path="/blog/:uuid/edit" element={<BlogEditorPage />} />
      </Routes>
    </Layout>
  );
}

// ── アプリ本体 ────────────────────────────────────────────
function AppInner() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <InnerRoutes />
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
