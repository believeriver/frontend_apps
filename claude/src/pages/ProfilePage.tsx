import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { apiGetProfile } from '../api/profile';
import type { Profile, ProfileSkill } from '../types/profile';

// bioテキストを段落に分割して表示
function BioSection({ bio }: { bio: string }) {
  const lines = bio.split(/\r\n|\n/).map(l => l.trim());
  const blocks: { heading: boolean; text: string }[] = [];
  for (const line of lines) {
    if (!line) continue;
    // 日本語・英語どちらのセクション見出しも太字で表示
    const isHeading =
      /^(自己紹介|保有資格|技術スタック|業務経験|個人プロジェクト|趣味・関心|English Version|Name:|Location:|About|Certifications|Technical Stack|Work Experience|Personal Projects|Interests)/.test(line);
    blocks.push({ heading: isHeading, text: line });
  }
  return (
    <div className="pf-bio">
      {blocks.map((b, i) =>
        b.heading
          ? <h3 key={i} className="pf-bio-heading">{b.text}</h3>
          : <p key={i} className="pf-bio-p">{b.text}</p>
      )}
    </div>
  );
}

// スキルレベルバー（資格はlevelあり）
function SkillLevel({ level }: { level: number | null }) {
  if (level === null) return null;
  return (
    <div className="pf-skill-level">
      {[1, 2, 3, 4].map(i => (
        <span key={i} className={`pf-skill-dot ${i <= level ? 'filled' : ''}`} />
      ))}
    </div>
  );
}

// スキルをカテゴリごとにグループ化
function groupSkills(skills: ProfileSkill[]) {
  const map = new Map<string, { label: string; items: ProfileSkill[] }>();
  for (const s of skills) {
    if (!map.has(s.category)) {
      map.set(s.category, { label: s.category_label, items: [] });
    }
    map.get(s.category)!.items.push(s);
  }
  return map;
}

// 期間フォーマット
function formatPeriod(start: string, end: string | null) {
  const fmt = (d: string) => {
    const [y, m] = d.split('-');
    return `${y}年${parseInt(m)}月`;
  };
  return `${fmt(start)} 〜 ${end ? fmt(end) : '現在'}`;
}

export default function ProfilePage() {
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    apiGetProfile()
      .then(setProfile)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="lp-root">
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div className="lp-grid" />

      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand" style={{ textDecoration: 'none' }}>◈ believeriver</Link>
        <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <div className="pf-page">
        {loading && <p className="pf-loading">読み込み中...</p>}
        {error   && <p className="pf-loading">プロフィールの取得に失敗しました。</p>}

        {profile && (
          <>
            {/* ── ヒーロー ── */}
            <div className="pf-hero">
              <div className="pf-avatar">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} />
                  : <span className="pf-avatar-placeholder">{profile.name[0]}</span>
                }
              </div>
              <div className="pf-hero-info">
                <h1 className="pf-name">{profile.name}
                  <span className="pf-nickname"> @{profile.nickname}</span>
                </h1>
                <p className="pf-location">📍 {profile.location}</p>
                {profile.links.length > 0 && (
                  <div className="pf-links">
                    {profile.links.map(l => (
                      <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="pf-link">
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pf-body">
              {/* ── 左カラム: bio ── */}
              <div className="pf-col-main">
                <section className="pf-section">
                  <h2 className="pf-section-title">About</h2>
                  <BioSection bio={profile.bio} />
                </section>
              </div>

              {/* ── 右カラム: スキル・経歴 ── */}
              <div className="pf-col-side">
                {/* スキル */}
                {profile.skills.length > 0 && (
                  <section className="pf-section">
                    <h2 className="pf-section-title">Skills</h2>
                    {[...groupSkills(profile.skills)].map(([cat, { label, items }]) => (
                      <div key={cat} className="pf-skill-group">
                        <h3 className="pf-skill-cat">{label}</h3>
                        <div className="pf-skill-list">
                          {items.map(s => (
                            <div key={s.id} className="pf-skill-item">
                              <div className="pf-skill-name">
                                {s.name}
                                {s.description && (
                                  <span className="pf-skill-desc">{s.description}</span>
                                )}
                              </div>
                              <SkillLevel level={s.level} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {/* 経歴 */}
                {profile.careers.length > 0 && (
                  <section className="pf-section">
                    <h2 className="pf-section-title">Career</h2>
                    <div className="pf-career-list">
                      {profile.careers.map(c => (
                        <div key={c.id} className="pf-career-item">
                          <div className="pf-career-period">{formatPeriod(c.start_date, c.end_date)}</div>
                          <div className="pf-career-title">{c.title}</div>
                          <div className="pf-career-company">{c.company}</div>
                          {c.description && <p className="pf-career-desc">{c.description}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <p className="pf-updated">最終更新: {new Date(profile.updated_at).toLocaleDateString('ja-JP')}</p>
          </>
        )}
      </div>

      <footer className="lp-footer">
        <p>
          © 2025 believeriver ·{' '}
          <Link to="/disclaimer">免責事項</Link>{' '}
          · <Link to="/privacy">プライバシーポリシー</Link>{' '}
          · <Link to="/contact">お問い合わせ</Link>
        </p>
      </footer>
    </div>
  );
}
