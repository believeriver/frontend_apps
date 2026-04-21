import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateProfile } from '../store/authSlice';
import { apiChangePassword } from '../api/auth';
import { useTheme } from '../hooks/useTheme';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();
  const { accessToken, email } = useSelector((s: RootState) => s.auth);

  // プロフィール
  const [newEmail,    setNewEmail]    = useState('');
  const [username,    setUsername]    = useState('');
  const [profileMsg,  setProfileMsg]  = useState('');
  const [profileErr,  setProfileErr]  = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // パスワード
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [newPw2,     setNewPw2]     = useState('');
  const [pwMsg,      setPwMsg]      = useState('');
  const [pwErr,      setPwErr]      = useState('');
  const [pwSaving,   setPwSaving]   = useState(false);

  useEffect(() => {
    if (!accessToken) navigate('/login', { replace: true });
    if (email) setNewEmail(email);
  }, [accessToken, email, navigate]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(''); setProfileErr('');
    setProfileSaving(true);
    const res = await dispatch(updateProfile({
      token: accessToken!,
      email: newEmail || undefined,
      username: username || undefined,
    }));
    setProfileSaving(false);
    if (updateProfile.fulfilled.match(res)) {
      setProfileMsg('プロフィールを更新しました。');
    } else {
      setProfileErr(res.payload as string);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    if (newPw !== newPw2) { setPwErr('新しいパスワードが一致しません。'); return; }
    setPwSaving(true);
    try {
      await apiChangePassword(accessToken!, {
        current_password: currentPw,
        new_password:     newPw,
        new_password2:    newPw2,
      });
      setPwMsg('パスワードを変更しました。');
      setCurrentPw(''); setNewPw(''); setNewPw2('');
    } catch (e: any) {
      const data = e.response?.data;
      setPwErr(
        data?.current_password?.[0] ||
        data?.new_password?.[0] ||
        data?.non_field_errors?.[0] ||
        data?.detail ||
        'パスワードの変更に失敗しました。'
      );
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-grid" />

      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand" style={{ textDecoration: 'none' }}>◈ believeriver</Link>
        <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <div className="settings-page">
        <h1 className="legal-title">アカウント設定</h1>

        {/* プロフィール編集 */}
        <section className="settings-section">
          <h2 className="settings-section-title">プロフィール</h2>
          <form onSubmit={handleProfileSave} className="settings-form">
            <div className="settings-field">
              <label className="settings-label">メールアドレス</label>
              <input
                type="email"
                className="settings-input"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">ユーザー名</label>
              <input
                type="text"
                className="settings-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>
            {profileMsg && <p className="settings-success">{profileMsg}</p>}
            {profileErr && <p className="settings-error">{profileErr}</p>}
            <div className="settings-actions">
              <button type="submit" className="settings-btn" disabled={profileSaving}>
                {profileSaving ? '保存中...' : '保存する'}
              </button>
            </div>
          </form>
        </section>

        {/* パスワード変更 */}
        <section className="settings-section">
          <h2 className="settings-section-title">パスワード変更</h2>
          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="settings-field">
              <label className="settings-label">現在のパスワード</label>
              <input
                type="password"
                className="settings-input"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="現在のパスワード"
                required
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">新しいパスワード</label>
              <input
                type="password"
                className="settings-input"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="8文字以上"
                required
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">新しいパスワード（確認）</label>
              <input
                type="password"
                className="settings-input"
                value={newPw2}
                onChange={e => setNewPw2(e.target.value)}
                placeholder="もう一度入力"
                required
              />
            </div>
            {pwMsg && <p className="settings-success">{pwMsg}</p>}
            {pwErr && <p className="settings-error">{pwErr}</p>}
            <div className="settings-actions">
              <button type="submit" className="settings-btn" disabled={pwSaving}>
                {pwSaving ? '変更中...' : 'パスワードを変更する'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <footer className="lp-footer">
        <p>© 2025 believeriver · <Link to="/">← トップへ戻る</Link></p>
      </footer>
    </div>
  );
}
