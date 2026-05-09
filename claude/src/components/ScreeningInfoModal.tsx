interface Props {
  onClose: () => void;
}

const SCORE_TABLE = [
  { condition: '売上高が右肩上がり（毎期増収）',          field: 'sales_growth',         score: 10 },
  { condition: '売上高のブレが小さい（安定成長）',          field: 'sales_stable',         score: 5  },
  { condition: '営業利益率 8% 以上',                      field: 'operating_margin_ok',  score: 10 },
  { condition: '営業利益率 10% 以上（追加）',              field: 'operating_margin_10',  score: 5  },
  { condition: 'EPS にマイナスがない（赤字期なし）',        field: 'eps_no_negative',      score: 10 },
  { condition: 'EPS が右肩上がり（増益傾向）',             field: 'eps_growth',           score: 10 },
  { condition: '自己資本比率 40% 以上',                   field: 'equity_ratio_40',      score: 10 },
  { condition: '自己資本比率 60% 以上（追加）',            field: 'equity_ratio_60',      score: 5  },
  { condition: '自己資本比率 80% 以上（追加）',            field: 'equity_ratio_80',      score: 5  },
  { condition: '営業CF が毎期黒字',                       field: 'cf_positive',          score: 10 },
  { condition: '営業CF が右肩上がり（増加傾向）',          field: 'cf_growth',            score: 5  },
  { condition: '現金・現金同等物が増加',                   field: 'cash_growth',          score: 5  },
  { condition: '一株配当に無配期がない（減配なし）',        field: 'dividend_stable',      score: 10 },
  { condition: '配当が右肩上がり（増配傾向）',             field: 'dividend_growth',      score: 5  },
  { condition: '配当性向 30〜50%（健全な還元水準）',       field: 'payout_ratio_ok',      score: 10 },
];

const TOTAL = SCORE_TABLE.reduce((s, r) => s + r.score, 0);

const YOUTUBE_LINKS = [
  { label: '高配当株の見つけ方', url: 'https://www.youtube.com/watch?v=zghleRDu_Yw' },
  { label: '高配当株の８つのポイント', url: 'https://www.youtube.com/watch?v=Puu4fIqr8d8' },
];

export default function ScreeningInfoModal({ onClose }: Props) {
  return (
    <div className="cdm-overlay" onClick={onClose}>
      <div className="cdm-modal scr-info-modal" onClick={e => e.stopPropagation()}>
        <div className="cdm-header">
          <div className="cdm-title-area">
            <h2 className="cdm-title">スクリーニングのロジック</h2>
            <span className="cdm-badge">満点 {TOTAL}点</span>
          </div>
          <button className="cdm-close" onClick={onClose}>✕</button>
        </div>

        <div className="cdm-body">
          {/* 概要 */}
          <section className="cdm-section">
            <h3 className="cdm-section-title">概要</h3>
            <p className="cdm-text">
              過去の財務データ（売上高・営業利益率・EPS・自己資本比率・営業CF・現金・配当）を複数年にわたって分析し、
              「安定して成長している高配当企業」を定量的に評価するスコアリングです。
              各条件を満たすごとに点数が加算され、最大 {TOTAL} 点となります。
            </p>
          </section>

          {/* スコア表 */}
          <section className="cdm-section">
            <h3 className="cdm-section-title">スコア内訳</h3>
            <table className="scr-info-table">
              <thead>
                <tr>
                  <th>条件</th>
                  <th>点数</th>
                </tr>
              </thead>
              <tbody>
                {SCORE_TABLE.map(row => (
                  <tr key={row.field}>
                    <td>{row.condition}</td>
                    <td className="scr-info-score">+{row.score}</td>
                  </tr>
                ))}
                <tr className="scr-info-total-row">
                  <td>合計</td>
                  <td className="scr-info-score">{TOTAL}点</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 各指標の見方 */}
          <section className="cdm-section">
            <h3 className="cdm-section-title">各指標の見方</h3>
            <dl className="scr-info-dl">
              <dt>売上高</dt>
              <dd>継続的な増収は企業の成長性を示します。ブレが小さいほど安定した事業基盤があります。</dd>
              <dt>営業利益率</dt>
              <dd>本業でどれだけ効率よく稼いでいるかの指標。8%以上が一つの目安で、10%を超えると優良水準です。</dd>
              <dt>EPS（一株利益）</dt>
              <dd>赤字期がなく右肩上がりであれば、株主への利益還元の原資が安定して増えていることを意味します。</dd>
              <dt>自己資本比率</dt>
              <dd>借金に頼らず自己資金で事業を賄えているかの指標。40%以上で安全圏、60%・80%超はより盤石です。</dd>
              <dt>営業キャッシュフロー（CF）</dt>
              <dd>実際に手元に入ってくる現金の流れ。毎期黒字かつ増加傾向であれば、利益の質が高いと言えます。</dd>
              <dt>現金・現金同等物</dt>
              <dd>手元資金の増加は財務の余裕を示し、減配リスクの低さにもつながります。</dd>
              <dt>一株配当・配当性向</dt>
              <dd>配当が安定・増配傾向にあり、配当性向が30〜50%の範囲であれば、持続可能な株主還元と判断します。配当性向が高すぎると将来の減配リスクがあります。</dd>
            </dl>
          </section>

          {/* 参考動画 */}
          <section className="cdm-section">
            <h3 className="cdm-section-title">参考資料</h3>
            <div className="scr-info-links">
              {YOUTUBE_LINKS.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="scr-info-yt-link"
                >
                  <span className="scr-info-yt-icon">▶</span>
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="cdm-footer">
          <span className="cdm-fetched-at">※ データ不足の場合、その条件はスキップされます</span>
          <div className="cdm-footer-actions">
            <button className="cdm-close-btn" onClick={onClose}>閉じる</button>
          </div>
        </div>
      </div>
    </div>
  );
}
