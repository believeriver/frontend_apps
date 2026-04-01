import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import './index.css';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="logo">IR Dashboard</Link>
        <SearchBar />
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <p>データは Django API より取得。投資判断の参考情報としてご利用ください。</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stock/:code" element={<StockPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Provider>
  );
}
