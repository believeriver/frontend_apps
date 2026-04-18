import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function PrivacyPage() {
  const { theme, toggle } = useTheme();
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

      <div className="legal-page">
        <h1 className="legal-title">プライバシーポリシー</h1>
        <p className="legal-updated">最終更新: 2026年4月18日</p>

        <section className="legal-section">
          <h2>1. 収集する情報</h2>
          <p>当サイトでは、以下の情報を収集する場合があります。</p>
          <ul>
            <li>アクセスログ（IPアドレス、アクセス日時、参照URL、ブラウザ情報など）</li>
            <li>ユーザー登録時に入力されたメールアドレス・ユーザー名</li>
            <li>ログイン・ログアウトの記録（セキュリティログ）</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. 情報の利用目的</h2>
          <p>収集した情報は、以下の目的で利用します。</p>
          <ul>
            <li>サービスの運営・改善</li>
            <li>不正アクセス・セキュリティインシデントの検知・対応</li>
            <li>アクセス状況の統計分析（個人を特定しない形で利用）</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. 情報の第三者提供</h2>
          <p>
            収集した個人情報は、法令に基づく場合を除き、第三者に提供・開示しません。
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Cookieについて</h2>
          <p>
            当サイトでは、ログイン状態の維持のためにJWT（JSON Web Token）をブラウザのローカルストレージに保存しています。
            これはサービス提供に必要な技術的措置です。
          </p>
        </section>

        <section className="legal-section">
          <h2>5. 広告・アフィリエイトについて</h2>
          <p>
            現時点では広告・アフィリエイトは導入しておりません。
            将来的に導入する場合、アフィリエイトプログラム提供会社がCookieを使用して行動履歴を収集することがあります。
            その際はあらためて本ポリシーを更新し、詳細をお知らせします。
          </p>
        </section>

        <section className="legal-section">
          <h2>6. 情報の管理・保管</h2>
          <p>
            収集した情報は適切なセキュリティ対策を施したサーバーで管理します。
            アクセスログは一定期間経過後に削除されます。
          </p>
        </section>

        <section className="legal-section">
          <h2>7. お問い合わせ</h2>
          <p>
            個人情報の取り扱いに関するお問い合わせは、
            <a href="https://github.com/believeriver" target="_blank" rel="noreferrer">GitHub</a> よりご連絡ください。
          </p>
        </section>

        <div className="legal-nav">
          <Link to="/disclaimer">免責事項 →</Link>
          <Link to="/">← トップへ戻る</Link>
        </div>
      </div>

      <footer className="lp-footer">
        <p>© 2025 believeriver · <Link to="/disclaimer">免責事項</Link> · <Link to="/privacy">プライバシーポリシー</Link></p>
      </footer>
    </div>
  );
}
