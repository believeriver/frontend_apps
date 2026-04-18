import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  apiGetSummary, apiGetDailyAccess, apiGetSiteStats,
  apiGetPopularPages, apiGetAccessLogs, apiGetSecurityLogs,
  apiDeleteAccessLogs, apiExportCsv,
} from '../../api/analytics';
import type {
  AnalyticsSummary, DailyCount, SiteStat,
  PopularPage, AccessLog, SecurityLog,
} from '../../types/analytics';

// ── 定数 ──────────────────────────────────────────────────
const SITE_COLORS: Record<string, string> = {
  blog:      '#d29922',
  techlog:   '#3fb950',
  market:    '#58a6ff',
  portfolio: '#bc8cff',
  other:     '#8b949e',
};
const ACTION_META = {
  login_success: { label: 'ログイン成功', color: 'var(--positive)' },
  login_failed:  { label: 'ログイン失敗', color: 'var(--negative)' },
  logout:        { label: 'ログアウト',   color: 'var(--text-muted)' },
};
const METHOD_COLOR: Record<string, string> = {
  GET: '#58a6ff', POST: '#3fb950', PATCH: '#d29922', DELETE: '#f85149',
};

// ── ユーティリティ ────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── サマリーカード ────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="an-stat-card">
      <div className="an-stat-label">{label}</div>
      <div className="an-stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="an-stat-sub">{sub}</div>}
    </div>
  );
}

// ── セクションヘッダー ─────────────────────────────────────
function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="an-section-head">
      <h2 className="an-section-title">{title}</h2>
      {children}
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────
export default function AnalyticsDashboard() {
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const [summary,       setSummary]       = useState<AnalyticsSummary | null>(null);
  const [daily,         setDaily]         = useState<DailyCount[]>([]);
  const [siteStats,     setSiteStats]     = useState<SiteStat[]>([]);
  const [popular,       setPopular]       = useState<PopularPage[]>([]);
  const [accessLogs,    setAccessLogs]    = useState<AccessLog[]>([]);
  const [secLogs,       setSecLogs]       = useState<SecurityLog[]>([]);
  const [activeTab,     setActiveTab]     = useState<'overview' | 'access' | 'security'>('overview');
  const [loading,       setLoading]       = useState(true);

  // アクセスログフィルター
  const [alSite,        setAlSite]        = useState('');
  const [alStatus,      setAlStatus]      = useState('');
  const [alMethod,      setAlMethod]      = useState('');
  const [alDateFrom,    setAlDateFrom]    = useState('');
  const [alDateTo,      setAlDateTo]      = useState('');
  const [alLimit,       setAlLimit]       = useState('100');

  // セキュリティログフィルター
  const [slAction,      setSlAction]      = useState('');
  const [slDateFrom,    setSlDateFrom]    = useState('');
  const [slDateTo,      setSlDateTo]      = useState('');

  // 削除UI
  const [delDateTo,     setDelDateTo]     = useState('');
  const [delSite,       setDelSite]       = useState('');
  const [delResult,     setDelResult]     = useState('');

  const [dailyDays,     setDailyDays]     = useState(30);
  const [dailySite,     setDailySite]     = useState('');

  if (!accessToken) return <div className="page-center">ログインが必要です。</div>;

  // ── 初期ロード ────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      apiGetSummary(accessToken),
      apiGetSiteStats(accessToken),
      apiGetPopularPages(accessToken, { limit: 10 }),
    ]).then(([s, ss, pp]) => {
      setSummary(s);
      setSiteStats(ss);
      setPopular(pp);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  // 日別アクセス
  useEffect(() => {
    if (!accessToken) return;
    const params: Record<string, unknown> = { days: dailyDays };
    if (dailySite) params.site = dailySite;
    apiGetDailyAccess(accessToken, params).then(setDaily);
  }, [accessToken, dailyDays, dailySite]);

  // アクセスログ
  const fetchAccessLogs = () => {
    if (!accessToken) return;
    const params: Record<string, unknown> = { limit: alLimit };
    if (alSite)     params.site        = alSite;
    if (alStatus)   params.status_code = alStatus;
    if (alMethod)   params.method      = alMethod;
    if (alDateFrom) params.date_from   = alDateFrom;
    if (alDateTo)   params.date_to     = alDateTo;
    apiGetAccessLogs(accessToken, params).then(setAccessLogs);
  };
  useEffect(() => {
    if (activeTab === 'access') fetchAccessLogs();
  }, [activeTab]);

  // セキュリティログ
  const fetchSecLogs = () => {
    if (!accessToken) return;
    const params: Record<string, unknown> = {};
    if (slAction)   params.action    = slAction;
    if (slDateFrom) params.date_from = slDateFrom;
    if (slDateTo)   params.date_to   = slDateTo;
    apiGetSecurityLogs(accessToken, params).then(setSecLogs);
  };
  useEffect(() => {
    if (activeTab === 'security') fetchSecLogs();
  }, [activeTab]);

  // ── 削除 ──────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!delDateTo && !delSite) { setDelResult('date_to または site を指定してください。'); return; }
    if (!confirm('ログを削除しますか？')) return;
    const params: { date_to?: string; site?: string } = {};
    if (delDateTo) params.date_to = delDateTo;
    if (delSite)   params.site    = delSite;
    const res = await apiDeleteAccessLogs(accessToken!, params);
    setDelResult(`${res.deleted} 件削除しました。`);
    fetchAccessLogs();
  };

  if (loading) return <div className="page-center"><div className="spinner" /></div>;

  const s = summary!;

  return (
    <div className="an-page">

      {/* ヘッダー */}
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-subtitle">アクセス解析・セキュリティログ</p>
        </div>
        <div className="an-header-actions">
          <button className="an-export-btn" onClick={() => apiExportCsv(accessToken!, { type: 'access' })}>
            ↓ アクセスCSV
          </button>
          <button className="an-export-btn" onClick={() => apiExportCsv(accessToken!, { type: 'security' })}>
            ↓ セキュリティCSV
          </button>
        </div>
      </div>

      {/* タブ */}
      <div className="an-tabs">
        {(['overview', 'access', 'security'] as const).map(t => (
          <button
            key={t}
            className={`an-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'overview' ? '📊 概要' : t === 'access' ? '📋 アクセスログ' : '🔒 セキュリティ'}
          </button>
        ))}
      </div>

      {/* ══ 概要タブ ══ */}
      {activeTab === 'overview' && (
        <div className="an-overview">

          {/* サマリーカード */}
          <div className="an-stat-grid">
            <StatCard label="本日のアクセス"    value={s.access_logs.today.toLocaleString()}       color="#58a6ff" />
            <StatCard label="7日間"             value={s.access_logs.last_7_days.toLocaleString()}  />
            <StatCard label="30日間"            value={s.access_logs.last_30_days.toLocaleString()} />
            <StatCard label="累計"              value={s.access_logs.total.toLocaleString()}         />
            <StatCard label="平均レスポンス"     value={`${s.access_logs.avg_response_ms.toFixed(1)} ms`} />
            <StatCard label="30日ログイン成功"   value={s.security_logs.login_success_30d} color="var(--positive)" />
            <StatCard label="30日ログイン失敗"   value={s.security_logs.login_failed_30d}  color={s.security_logs.login_failed_30d > 0 ? 'var(--negative)' : undefined} />
          </div>

          {/* 日別アクセスグラフ */}
          <div className="an-card">
            <SectionHeader title="日別アクセス数">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="an-select" value={dailyDays} onChange={e => setDailyDays(Number(e.target.value))}>
                  <option value={7}>7日</option>
                  <option value={30}>30日</option>
                  <option value={90}>90日</option>
                </select>
                <select className="an-select" value={dailySite} onChange={e => setDailySite(e.target.value)}>
                  <option value="">全サイト</option>
                  {['blog','techlog','market','portfolio','other'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </SectionHeader>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="acGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#58a6ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
                  tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Area type="monotone" dataKey="count" name="アクセス数"
                  stroke="#58a6ff" fill="url(#acGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="an-two-col">
            {/* サイト別 */}
            <div className="an-card">
              <SectionHeader title="サイト別アクセス（30日）" />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={s.access_logs.by_site} dataKey="count" nameKey="site"
                    cx="50%" cy="50%" outerRadius={70} label={false}
                    labelLine={false}>
                    {s.access_logs.by_site.map(e => (
                      <Cell key={e.site} fill={SITE_COLORS[e.site] ?? '#8b949e'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ステータスコード別 */}
            <div className="an-card">
              <SectionHeader title="ステータスコード別" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={s.access_logs.by_status_code} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="status_code" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="count" name="件数" radius={[4,4,0,0]}>
                    {s.access_logs.by_status_code.map(e => (
                      <Cell key={e.status_code}
                        fill={e.status_code >= 500 ? '#f85149' : e.status_code >= 400 ? '#d29922' : '#3fb950'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* サイト別統計テーブル */}
          <div className="an-card">
            <SectionHeader title="サイト別統計" />
            <table className="an-table">
              <thead><tr>
                <th>サイト</th><th>アクセス数</th><th>平均レスポンス</th><th>エラー数</th>
              </tr></thead>
              <tbody>
                {siteStats.map(r => (
                  <tr key={r.site}>
                    <td><span className="an-site-badge" style={{ background: `${SITE_COLORS[r.site]}22`, color: SITE_COLORS[r.site] ?? 'var(--text-muted)' }}>{r.site}</span></td>
                    <td>{r.count.toLocaleString()}</td>
                    <td>{r.avg_response.toFixed(1)} ms</td>
                    <td style={{ color: r.error_count > 0 ? 'var(--negative)' : 'var(--text-dim)' }}>{r.error_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 人気ページ */}
          <div className="an-card">
            <SectionHeader title="アクセスランキング Top 10" />
            <table className="an-table">
              <thead><tr>
                <th>#</th><th>パス</th><th>サイト</th><th>件数</th><th>平均レスポンス</th>
              </tr></thead>
              <tbody>
                {popular.map((r, i) => (
                  <tr key={r.path}>
                    <td className="an-rank">{i + 1}</td>
                    <td className="an-path">{r.path}</td>
                    <td><span className="an-site-badge" style={{ background: `${SITE_COLORS[r.site]}22`, color: SITE_COLORS[r.site] ?? 'var(--text-muted)' }}>{r.site}</span></td>
                    <td>{r.count.toLocaleString()}</td>
                    <td>{r.avg_response.toFixed(1)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ アクセスログタブ ══ */}
      {activeTab === 'access' && (
        <div>
          {/* フィルター */}
          <div className="an-card an-filter-card">
            <div className="an-filters">
              <select className="an-select" value={alSite} onChange={e => setAlSite(e.target.value)}>
                <option value="">全サイト</option>
                {['blog','techlog','market','portfolio','other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="an-select" value={alMethod} onChange={e => setAlMethod(e.target.value)}>
                <option value="">全メソッド</option>
                {['GET','POST','PATCH','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input className="an-input" type="number" placeholder="ステータス" value={alStatus} onChange={e => setAlStatus(e.target.value)} style={{ width: 90 }} />
              <input className="an-input" type="date" value={alDateFrom} onChange={e => setAlDateFrom(e.target.value)} />
              <input className="an-input" type="date" value={alDateTo}   onChange={e => setAlDateTo(e.target.value)} />
              <input className="an-input" type="number" placeholder="件数" value={alLimit} onChange={e => setAlLimit(e.target.value)} style={{ width: 70 }} />
              <button className="an-btn-primary" onClick={fetchAccessLogs}>絞り込み</button>
              <button className="an-export-btn" onClick={() => apiExportCsv(accessToken!, { type: 'access', date_from: alDateFrom, date_to: alDateTo, site: alSite })}>↓ CSV</button>
            </div>
          </div>

          {/* 削除 */}
          <div className="an-card an-delete-card">
            <span className="an-delete-label">ログ削除：</span>
            <input className="an-input" type="date" placeholder="この日付以前を削除" value={delDateTo} onChange={e => setDelDateTo(e.target.value)} />
            <select className="an-select" value={delSite} onChange={e => setDelSite(e.target.value)}>
              <option value="">サイト指定なし</option>
              {['blog','techlog','market','portfolio','other'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="an-btn-danger" onClick={handleDelete}>削除</button>
            {delResult && <span className="an-del-result">{delResult}</span>}
          </div>

          <div className="an-card">
            <SectionHeader title={`アクセスログ（${accessLogs.length} 件）`} />
            <div className="an-table-wrap">
              <table className="an-table an-table-sm">
                <thead><tr>
                  <th>日時</th><th>メソッド</th><th>パス</th><th>サイト</th>
                  <th>ステータス</th><th>レスポンス</th><th>IP</th><th>ユーザー</th>
                </tr></thead>
                <tbody>
                  {accessLogs.map(r => (
                    <tr key={r.id}>
                      <td className="an-nowrap">{fmtDate(r.created_at)}</td>
                      <td><span className="an-method-badge" style={{ color: METHOD_COLOR[r.method] ?? 'var(--text-muted)' }}>{r.method}</span></td>
                      <td className="an-path">{r.path}</td>
                      <td><span className="an-site-badge" style={{ background: `${SITE_COLORS[r.site]}22`, color: SITE_COLORS[r.site] ?? 'var(--text-muted)' }}>{r.site}</span></td>
                      <td style={{ color: r.status_code >= 400 ? 'var(--negative)' : r.status_code >= 300 ? 'var(--text-muted)' : 'var(--positive)' }}>{r.status_code}</td>
                      <td className="an-nowrap">{r.response_time.toFixed(1)} ms</td>
                      <td className="an-nowrap">{r.ip_address}</td>
                      <td>{r.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ セキュリティタブ ══ */}
      {activeTab === 'security' && (
        <div>
          {/* フィルター */}
          <div className="an-card an-filter-card">
            <div className="an-filters">
              <select className="an-select" value={slAction} onChange={e => setSlAction(e.target.value)}>
                <option value="">全アクション</option>
                <option value="login_success">ログイン成功</option>
                <option value="login_failed">ログイン失敗</option>
                <option value="logout">ログアウト</option>
              </select>
              <input className="an-input" type="date" value={slDateFrom} onChange={e => setSlDateFrom(e.target.value)} />
              <input className="an-input" type="date" value={slDateTo}   onChange={e => setSlDateTo(e.target.value)} />
              <button className="an-btn-primary" onClick={fetchSecLogs}>絞り込み</button>
              <button className="an-export-btn" onClick={() => apiExportCsv(accessToken!, { type: 'security', date_from: slDateFrom, date_to: slDateTo })}>↓ CSV</button>
            </div>
          </div>

          <div className="an-card">
            <SectionHeader title={`セキュリティログ（${secLogs.length} 件）`} />
            <div className="an-table-wrap">
              <table className="an-table an-table-sm">
                <thead><tr>
                  <th>日時</th><th>アクション</th><th>ユーザー</th><th>メール</th><th>IP</th><th>UA</th>
                </tr></thead>
                <tbody>
                  {secLogs.map(r => (
                    <tr key={r.id}>
                      <td className="an-nowrap">{fmtDate(r.created_at)}</td>
                      <td>
                        <span className="an-action-badge" style={{ color: ACTION_META[r.action]?.color ?? 'var(--text-muted)' }}>
                          {ACTION_META[r.action]?.label ?? r.action}
                        </span>
                      </td>
                      <td>{r.username}</td>
                      <td>{r.email}</td>
                      <td className="an-nowrap">{r.ip_address}</td>
                      <td className="an-ua">{r.user_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
