import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { apiPostContact } from '../api/contact';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
  const { theme, toggle } = useTheme();

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [subject, setSubject] = useState('');
  const [body,    setBody]    = useState('');
  const [status,  setStatus]  = useState<Status>('idle');
  const [errMsg,  setErrMsg]  = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrMsg('');
    try {
      await apiPostContact({ name, email, subject, body });
      setStatus('success');
      setName(''); setEmail(''); setSubject(''); setBody('');
    } catch {
      setStatus('error');
      setErrMsg('送信に失敗しました。しばらく経ってから再度お試しください。');
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

      <div className="contact-page">
        <h1 className="legal-title">お問い合わせ</h1>
        <p className="legal-updated">内容を確認後、メールにてご返信いたします。</p>

        {status === 'success' ? (
          <div className="contact-success">
            <div className="contact-success-icon">✓</div>
            <h2>送信完了しました</h2>
            <p>お問い合わせありがとうございます。内容を確認後、ご連絡いたします。</p>
            <Link to="/" className="contact-back-btn">トップへ戻る</Link>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            {status === 'error' && (
              <p className="contact-error">{errMsg}</p>
            )}

            <div className="contact-row">
              <div className="contact-field">
                <label className="contact-label">お名前 <span className="contact-required">*</span></label>
                <input
                  type="text"
                  className="contact-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="山田 太郎"
                  required
                />
              </div>
              <div className="contact-field">
                <label className="contact-label">メールアドレス <span className="contact-required">*</span></label>
                <input
                  type="email"
                  className="contact-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            <div className="contact-field">
              <label className="contact-label">件名 <span className="contact-required">*</span></label>
              <input
                type="text"
                className="contact-input"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="お問い合わせの件名"
                required
              />
            </div>

            <div className="contact-field">
              <label className="contact-label">お問い合わせ内容 <span className="contact-required">*</span></label>
              <textarea
                className="contact-textarea"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="お問い合わせの内容をご記入ください"
                rows={12}
                required
              />
            </div>

            <div className="contact-actions">
              <Link to="/" className="contact-cancel">キャンセル</Link>
              <button type="submit" className="contact-submit" disabled={status === 'loading'}>
                {status === 'loading' ? <span className="btn-spinner" /> : '送信する'}
              </button>
            </div>
          </form>
        )}
      </div>

      <footer className="lp-footer">
        <p>
          © 2025 believeriver ·{' '}
          <Link to="/disclaimer">免責事項</Link>{' '}
          · <Link to="/privacy">プライバシーポリシー</Link>
        </p>
      </footer>
    </div>
  );
}
