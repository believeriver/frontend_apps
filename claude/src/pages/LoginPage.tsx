import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login, clearError } from '../store/authSlice';

export default function LoginPage() {
  const navigate   = useNavigate();
  const dispatch   = useDispatch<AppDispatch>();
  const { loading, error, accessToken } = useSelector((s: RootState) => s.auth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // ログイン済みならホームへ
  useEffect(() => {
    if (accessToken) navigate('/', { replace: true });
  }, [accessToken, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">IR Dashboard</div>
        <h1 className="auth-title">ログイン</h1>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="auth-input"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              className="auth-input"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'ログイン'}
          </button>
        </form>

        <p className="auth-footer">
          アカウントをお持ちでない方は{' '}
          <Link to="/register">新規登録</Link>
        </p>
      </div>
    </div>
  );
}
