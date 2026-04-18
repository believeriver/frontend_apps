import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function DisclaimerPage() {
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
        <h1 className="legal-title">免責事項</h1>
        <p className="legal-updated">最終更新: 2026年4月18日</p>

        <section className="legal-section">
          <h2>1. 情報の正確性について</h2>
          <p>
            当サイト（believeriver）に掲載している情報は、正確性・完全性・最新性を保証するものではありません。
            掲載内容は予告なく変更・削除される場合があります。
          </p>
        </section>

        <section className="legal-section">
          <h2>2. 投資情報に関する免責</h2>
          <p>
            IR Dashboard をはじめとする投資関連コンテンツは、株式・投資信託・その他金融商品に関する情報提供を目的としており、
            特定の銘柄への投資を推奨・勧誘するものではありません。
            投資に関する最終的な判断はご自身の責任のもと行ってください。
            当サイトの情報を利用したことによる損失・損害について、当サイト管理者は一切の責任を負いません。
          </p>
        </section>

        <section className="legal-section">
          <h2>3. 外部リンクについて</h2>
          <p>
            当サイトには外部サイトへのリンクが含まれる場合があります。
            リンク先のコンテンツ・サービスについて、当サイトは管理・保証する立場になく、
            外部サイトの利用によって生じたいかなる損害についても責任を負いません。
          </p>
        </section>

        <section className="legal-section">
          <h2>4. 広告・アフィリエイトについて</h2>
          <p>
            現時点では当サイトに広告は掲載しておりません。
            将来的にアフィリエイトプログラムへの参加や広告掲載を行う可能性があります。
            その際は本ページにて明示いたします。
          </p>
        </section>

        <section className="legal-section">
          <h2>5. 著作権</h2>
          <p>
            当サイトに掲載されているコンテンツ（文章・画像・コードなど）の著作権は、
            特に明示がない限り当サイト管理者に帰属します。
            無断転載・複製・改変はご遠慮ください。
          </p>
        </section>

        <section className="legal-section">
          <h2>6. 準拠法</h2>
          <p>
            本免責事項は日本法に準拠し、解釈されるものとします。
          </p>
        </section>

        <div className="legal-nav">
          <Link to="/privacy">プライバシーポリシー →</Link>
          <Link to="/">← トップへ戻る</Link>
        </div>
      </div>

      <footer className="lp-footer">
        <p>© 2025 believeriver · <Link to="/disclaimer">免責事項</Link> · <Link to="/privacy">プライバシーポリシー</Link></p>
      </footer>
    </div>
  );
}
