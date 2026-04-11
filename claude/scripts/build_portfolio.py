"""
test@example.com のポートフォリオをモデルケースとして構築するスクリプト。

選定基準:
  - 無配なし（dividend > 0）
  - 財務スコアリングで上位100銘柄を選定
    * 売上高右肩上がり
    * 営業利益率 10%以上
    * EPS 右肩上がり
    * 自己資本比率 40-80%+
    * 営業CF黒字・増加傾向
    * 現金増加傾向
    * 一株配当右肩上がり
    * 配当性向 30-50%（80-90%まで許容）
"""

import requests
import time
import random
import json
from datetime import date, timedelta
from typing import Optional, List, Dict, Tuple

BASE_URL = "http://127.0.0.1:8000"

# ── 認証 ──────────────────────────────────────────────────────
def get_token(email: str, password: str):
    r = requests.post(f"{BASE_URL}/api/auth/login/", json={"email": email, "password": password})
    d = r.json()
    return d["access"], d["refresh"]

# ── ポートフォリオリセット ─────────────────────────────────────
def clear_portfolio(access: str):
    items = requests.get(
        f"{BASE_URL}/api/portfolio/",
        headers={"Authorization": f"Bearer {access}"}
    ).json()
    deleted = 0
    for item in items:
        for rec in item["records"]:
            requests.delete(
                f"{BASE_URL}/api/portfolio/{rec['id']}/",
                headers={"Authorization": f"Bearer {access}"}
            )
            deleted += 1
    print(f"  削除: {deleted} 件")

# ── 企業一覧取得 ───────────────────────────────────────────────
def get_company_list(access: str) -> list[dict]:
    r = requests.get(
        f"{BASE_URL}/api_market/companies/",
        headers={"Authorization": f"Bearer {access}"}
    )
    return r.json()

# ── 財務データ取得 ─────────────────────────────────────────────
def get_financials(code: str) -> Optional[List[Dict]]:
    try:
        r = requests.get(f"{BASE_URL}/api_market/companies/{code}/", timeout=5)
        if r.status_code != 200:
            return None
        return r.json().get("financials", [])
    except Exception:
        return None

# ── 財務スコアリング ───────────────────────────────────────────
def score_financials(financials: List[Dict], dividend_yield: Optional[float]) -> float:
    if not financials:
        return -999

    # データが揃っている直近5期を対象
    recent = [f for f in financials if f.get("fiscal_year")][-8:]
    if len(recent) < 3:
        return -999

    score = 0.0

    # ── 営業利益率 ───────────────────────────────────────────
    margins = [f["operating_margin"] for f in recent if f.get("operating_margin") is not None]
    if margins:
        avg_margin = sum(margins) / len(margins)
        if avg_margin >= 20:   score += 30
        elif avg_margin >= 10: score += 20
        elif avg_margin >= 5:  score += 5
        else:                  score -= 20
        # 直近3期が平均以上なら加点
        if len(margins) >= 3 and min(margins[-3:]) >= 10:
            score += 10
    else:
        score -= 10

    # ── 営業CF ───────────────────────────────────────────────
    cfs = [f["operating_cash_flow"] for f in recent if f.get("operating_cash_flow") is not None]
    if cfs:
        if all(c > 0 for c in cfs):          score += 20  # 全期間黒字
        elif sum(1 for c in cfs if c > 0) >= len(cfs) * 0.8:
                                              score += 10
        else:                                score -= 15
        # 増加トレンド
        if len(cfs) >= 3 and cfs[-1] > cfs[0]: score += 10
    else:
        score -= 5

    # ── EPS ──────────────────────────────────────────────────
    eps_list = [f["eps"] for f in recent if f.get("eps") is not None]
    if eps_list and len(eps_list) >= 3:
        if all(e > 0 for e in eps_list):      score += 15
        if eps_list[-1] > eps_list[0]:        score += 10
    elif not eps_list:
        score -= 5

    # ── 自己資本比率 ──────────────────────────────────────────
    equities = [f["equity_ratio"] for f in recent if f.get("equity_ratio") is not None]
    if equities:
        avg_eq = sum(equities) / len(equities)
        if avg_eq >= 80:        score += 20
        elif avg_eq >= 60:      score += 15
        elif avg_eq >= 40:      score += 10
        elif avg_eq >= 20:      score += 0
        else:                   score -= 10

    # ── 現金増加 ──────────────────────────────────────────────
    cash_list = [f["cash_and_equivalents"] for f in recent if f.get("cash_and_equivalents") is not None]
    if cash_list and len(cash_list) >= 3:
        if cash_list[-1] > cash_list[0]: score += 10

    # ── 一株配当 ──────────────────────────────────────────────
    divs = [f["dividend_per_share"] for f in recent if f.get("dividend_per_share") is not None]
    if divs:
        if all(d > 0 for d in divs):           score += 15  # 無配なし
        if len(divs) >= 3 and divs[-1] >= divs[0]: score += 10  # 増配傾向

    # ── 配当性向 ──────────────────────────────────────────────
    payouts = [f["payout_ratio"] for f in recent if f.get("payout_ratio") is not None]
    if payouts:
        avg_payout = sum(payouts) / len(payouts)
        if 30 <= avg_payout <= 50:  score += 15
        elif 50 < avg_payout <= 80: score += 5
        elif 80 < avg_payout <= 90: score += 0
        elif avg_payout > 90:       score -= 10

    # ── 配当利回り bonus ─────────────────────────────────────
    if dividend_yield:
        if 3 <= dividend_yield <= 6:   score += 10
        elif dividend_yield > 6:       score += 5
        elif dividend_yield < 1:       score -= 5

    return score

# ── 購入履歴登録 ──────────────────────────────────────────────
def add_positions(access: str, code: str, entries: List[Dict]):
    """entries: [{shares, purchase_price, purchased_at, memo}]"""
    for e in entries:
        payload = {"company_code": code, **e}
        r = requests.post(
            f"{BASE_URL}/api/portfolio/",
            json=payload,
            headers={"Authorization": f"Bearer {access}"}
        )
        if r.status_code not in (200, 201):
            print(f"    ⚠️  {code} 追加失敗: {r.text[:80]}")

# ── 購入履歴を生成（2〜3回に分けて購入） ─────────────────────
def make_purchase_history(current_stock_price: float, total_shares: int) -> List[Dict]:
    entries = []
    remaining = total_shares
    today = date.today()

    # 1〜3回に分けて購入
    n_lots = random.choices([1, 2, 3], weights=[30, 50, 20])[0]
    lot_shares = [remaining // n_lots] * n_lots
    lot_shares[-1] += remaining - sum(lot_shares)

    for i, sh in enumerate(lot_shares):
        if sh <= 0:
            continue
        # 購入日: 最大3年前〜最近（バラバラ）
        days_back = random.randint(30 + i * 120, 365 * 3 - i * 30)
        purchase_date = today - timedelta(days=days_back)
        # 購入単価: 現在値の ±20% 程度
        variation = random.uniform(-0.18, 0.10)
        purchase_price = round(current_stock_price * (1 + variation) / 100) * 100
        purchase_price = max(purchase_price, 100)

        entries.append({
            "shares":        sh,
            "purchase_price": purchase_price,
            "purchased_at":  purchase_date.isoformat(),
            "memo":          ["長期保有", "配当目的", "積立", ""][random.randint(0, 3)],
        })

    return entries

# ── メイン ─────────────────────────────────────────────────────
def main():
    print("=== ポートフォリオ構築スクリプト ===\n")

    # 認証
    print("1. ログイン...")
    access, _ = get_token("test@example.com", "TestPass123!")

    # リセット
    print("2. 既存ポートフォリオをクリア...")
    clear_portfolio(access)

    # 企業一覧取得
    print("3. 企業一覧取得中...")
    companies = get_company_list(access)

    # 無配除外・dividend_rankでソート
    candidates = [
        c for c in companies
        if c.get("dividend") and c["dividend"] > 0
    ]
    candidates.sort(key=lambda c: c.get("dividend_rank") or 9999)

    print(f"   配当あり銘柄: {len(candidates)} 件")

    # 上位500銘柄から財務チェック（配当ランク順）
    print("4. 財務スコアリング（上位500銘柄）...")
    scored = []
    target = candidates[:500]

    for i, c in enumerate(target):
        code = c["code"]
        fins = get_financials(code)
        sc   = score_financials(fins, c.get("dividend"))
        scored.append({
            "code":           code,
            "name":           c["name"],
            "stock":          c["stock"],
            "dividend":       c.get("dividend"),
            "dividend_rank":  c.get("dividend_rank"),
            "score":          sc,
        })

        if (i + 1) % 50 == 0:
            print(f"   {i+1}/500 完了...")
        time.sleep(0.05)  # サーバー負荷軽減

    # スコア上位100銘柄を選定
    scored.sort(key=lambda x: x["score"], reverse=True)
    top100 = [s for s in scored if s["score"] > 20][:100]

    print(f"\n5. 選定銘柄: {len(top100)} 件")
    print(f"   スコア範囲: {top100[-1]['score']:.1f} 〜 {top100[0]['score']:.1f}")

    # ── ポートフォリオ登録 ────────────────────────────────────
    print("\n6. ポートフォリオに登録中...")

    # 銘柄ごとの投資規模（スコアに応じて重み付け）
    max_score = top100[0]["score"]
    added = 0

    for rank, item in enumerate(top100):
        code  = item["code"]
        name  = item["name"]
        stock_str = item["stock"].replace(",", "")
        try:
            price = float(stock_str)
        except ValueError:
            continue

        # 購入株数: 上位ほど多めに（100〜1000株の範囲）
        weight = (item["score"] / max_score)
        base_units = max(1, int(weight * 10))  # 1〜10単元
        unit_size = 100  # 1単元 = 100株

        # 少額銘柄は多めに、高額銘柄は少なめに
        if price >= 10000:   unit_size = 1
        elif price >= 3000:  unit_size = 10
        elif price >= 1000:  unit_size = 100
        else:                unit_size = 100

        total_shares = base_units * unit_size

        entries = make_purchase_history(price, total_shares)
        add_positions(access, code, entries)
        added += 1

        div_str = f"{item['dividend']:.2f}%" if item['dividend'] else "—"
        print(f"  [{added:3d}] {code} {name[:15]:15s} "
              f"スコア:{item['score']:5.1f} 株数:{total_shares:5d} 利回:{div_str}")

        time.sleep(0.1)

    print(f"\n✅ 完了: {added} 銘柄を登録しました")

    # 最終確認
    final = requests.get(
        f"{BASE_URL}/api/portfolio/",
        headers={"Authorization": f"Bearer {access}"}
    ).json()
    total_records = sum(len(it["records"]) for it in final)
    print(f"   登録銘柄数: {len(final)} / 購入履歴総数: {total_records}")

if __name__ == "__main__":
    main()
