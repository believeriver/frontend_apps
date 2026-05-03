import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { register, clearError } from '../store/authSlice';

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, accessToken, isSuperuser } = useSelector((s: RootState) => s.auth);

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [done,      setDone]      = useState(false);

  useEffect(() => {
    // 管理者はログイン中でも登録ページを開けるようにする
    if (accessToken && !isSuperuser) navigate('/', { replace: true });
  }, [accessToken, isSuperuser, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // クライアント側バリデーション
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== password2) {
      setLocalError('パスワードが一致しません');
      return;
    }
    if (password.length < 8) {
      setLocalError('パスワードは8文字以上で設定してください');
      return;
    }
    const result = await dispatch(register({ email, password, password2 }));
    if (register.fulfilled.match(result)) {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">IR Dashboard</div>
          <div className="auth-success">
            <span className="auth-success-icon">✓</span>
            <h2>登録が完了しました</h2>
            <p>登録したメールアドレスとパスワードでログインできます。</p>
            {isSuperuser ? (
              <button className="auth-btn" style={{ display: 'block', width: '100%', marginTop: 16 }}
                onClick={() => { setDone(false); setEmail(''); setPassword(''); setPassword2(''); }}>
                続けて登録する
              </button>
            ) : (
              <Link to="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
                ログインページへ
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">IR Dashboard</div>
        <h1 className="auth-title">新規登録</h1>

        {(error || localError) && (
          <p className="auth-error">{localError ?? error}</p>
        )}

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
            <label className="auth-label">パスワード <small>(8文字以上)</small></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを設定"
              className="auth-input"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">パスワード（確認）</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="もう一度入力"
              className="auth-input"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'アカウントを作成'}
          </button>
        </form>

        <p className="auth-footer">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
