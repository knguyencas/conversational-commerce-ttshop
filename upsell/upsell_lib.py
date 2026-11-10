"""Mô hình mua kèm (upsell) ở mức LOẠI HÀNG, học từ Amazon Reviews 2023."""
from __future__ import annotations

import io
import json
import math
import re
import time
from collections import Counter, defaultdict

import numpy as np
import pandas as pd
import requests

from category_map import SHOP_CATEGORIES, map_category

BASE = "https://huggingface.co/datasets/McAuley-Lab/Amazon-Reviews-2023/resolve/main"
RATINGS_URL = BASE + "/benchmark/5core/rating_only/{cat}.csv"
META_URL = BASE + "/raw/meta_categories/meta_{cat}.jsonl"
DAY_MS = 86_400_000


def read_ratings(cat: str, max_rows: int | None = None) -> pd.DataFrame:
    """Đánh giá đã lọc 5-core: user_id, parent_asin, timestamp (ms)."""
    t0 = time.time()
    df = pd.read_csv(RATINGS_URL.format(cat=cat), usecols=["user_id", "parent_asin", "timestamp"],
                     nrows=max_rows, dtype={"user_id": "string", "parent_asin": "string", "timestamp": "int64"})
    print(f"{cat}: {len(df):,} đánh giá, {df.user_id.nunique():,} người, {df.parent_asin.nunique():,} sản phẩm "
          f"({time.time() - t0:.0f}s)")
    return df


ASIN_RE = re.compile(r'"parent_asin":\s*"([^"]+)"')


def stream_meta(cat: str, wanted: set[str], max_bytes: int | None = None, log_every: int = 200_000) -> dict[str, str]:
    """Đọc file thông tin sản phẩm theo dòng (không cần tải hết vào RAM)."""
    t0, n, kept, seen_bytes = time.time(), 0, {}, 0
    headers = {"Range": f"bytes=0-{max_bytes}"} if max_bytes else {}
    with requests.get(META_URL.format(cat=cat), stream=True, timeout=60, headers=headers) as r:
        r.raise_for_status()
        for raw in r.iter_lines():
            if not raw:
                continue
            n += 1
            seen_bytes += len(raw)
            line = raw.decode("utf-8", "ignore")
            m = ASIN_RE.search(line)
            if not m or m.group(1) not in wanted:
                continue
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            shop_cat = map_category(d.get("categories"), d.get("title"))
            if shop_cat:
                kept[m.group(1)] = shop_cat
            if n % log_every == 0:
                print(f"  {cat}: {n:,} dòng, {seen_bytes / 1e9:.1f} GB, giữ {len(kept):,} sản phẩm ({time.time() - t0:.0f}s)")
    print(f"{cat}: đọc {n:,} sản phẩm, gán được loại cho {len(kept):,} ({time.time() - t0:.0f}s)")
    return kept


def build_events(ratings: pd.DataFrame, item_cat: dict[str, str]) -> pd.DataFrame:
    """Mỗi dòng: một người mua (đánh giá) một món thuộc loại hàng của shop, theo ngày."""
    ev = ratings.assign(cat=ratings.parent_asin.map(item_cat)).dropna(subset=["cat"])
    ev = ev.assign(day=(ev.timestamp // DAY_MS).astype("int64"))[["user_id", "day", "cat"]]
    ev = ev.drop_duplicates().sort_values(["user_id", "day"]).reset_index(drop=True)
    return ev


def user_pairs(days: list[int], cats: list[str], window: int) -> set[tuple[str, str]]:
    """Các cặp (A, B) khác loại xuất hiện trong cùng một cửa sổ `window` ngày (cả 2 chiều)."""
    pairs = set()
    j0 = 0
    for i in range(len(days)):
        while days[i] - days[j0] > window:
            j0 += 1
        for j in range(j0, i):
            if cats[i] != cats[j]:
                pairs.add((cats[i], cats[j]))
                pairs.add((cats[j], cats[i]))
    return pairs


def count_pairs(ev: pd.DataFrame, window: int):
    """Đếm theo NGƯỜI (mỗi người góp tối đa 1 cho mỗi cặp), để người mua nhiều không lấn át."""
    co, anchor = Counter(), Counter()
    for _, g in ev.groupby("user_id", sort=False):
        if g.cat.nunique() < 2:
            continue
        ps = user_pairs(g.day.tolist(), g.cat.tolist(), window)
        co.update(ps)
        anchor.update({a for a, _ in ps})
    return co, anchor


def test_cases(ev: pd.DataFrame, window: int):
    """Ca kiểm tra: (loại khách đang mua A, tập loại thật sự mua kèm trong cửa sổ)."""
    cases = []
    for _, g in ev.groupby("user_id", sort=False):
        if g.cat.nunique() < 2:
            continue
        by_anchor = defaultdict(set)
        for a, b in user_pairs(g.day.tolist(), g.cat.tolist(), window):
            by_anchor[a].add(b)
        cases.extend((a, frozenset(bs)) for a, bs in by_anchor.items())
    return cases


class Popularity:
    """Baseline: mời loại hàng hay được mua kèm nhất nói chung, không quan tâm khách đang mua gì."""
    name = "Baseline (phổ biến)"

    def __init__(self, co: Counter):
        self.pop = Counter()
        for (_, b), n in co.items():
            self.pop[b] += n

    def rank(self, anchor: str, k: int) -> list[str]:
        return [c for c, _ in self.pop.most_common() if c != anchor][:k]


class CoPurchase:
    """P(B | A) làm mượt: (đếm(A,B) + α·phổ_biến(B)) / (đếm(A) + α). α kéo về baseline khi A ít dữ liệu."""
    name = "Mua cùng nhau P(B|A)"

    def __init__(self, co: Counter, anchor: Counter, alpha: float = 20.0):
        self.co, self.anchor, self.alpha = co, anchor, alpha
        total = Counter()
        for (_, b), n in co.items():
            total[b] += n
        s = sum(total.values()) or 1
        self.prior = {c: total[c] / s for c in SHOP_CATEGORIES}

    def score(self, a: str, b: str) -> float:
        return (self.co[(a, b)] + self.alpha * self.prior.get(b, 0)) / (self.anchor[a] + self.alpha)

    def rank(self, anchor: str, k: int) -> list[str]:
        others = [c for c in SHOP_CATEGORIES if c != anchor]
        return sorted(others, key=lambda b: -self.score(anchor, b))[:k]


class Lift(CoPurchase):
    """Lift = P(B|A) / P(B): B được mua kèm A nhiều hơn mức bình thường bao nhiêu lần. Xếp hạng giống PMI = log(lift)."""
    name = "Lift / PMI"

    def score(self, a: str, b: str) -> float:
        return super().score(a, b) / max(self.prior.get(b, 0.0), 1e-9)


class ALSMatrix:
    """Phân rã ma trận người × loại hàng bằng implicit ALS (Hu, Koren, Volinsky 2008), gợi ý cho khách vừa mua A."""
    name = "Phân rã ma trận ALS"

    def __init__(self, ev: pd.DataFrame, factors: int = 8, reg: float = 0.1, alpha: float = 10.0,
                 iters: int = 12, seed: int = 0, chunk: int = 200_000):
        self.cats = list(SHOP_CATEGORIES)
        idx = {c: i for i, c in enumerate(self.cats)}
        g = ev.loc[ev.cat.isin(idx), ["user_id", "cat"]].drop_duplicates()
        g = g[g.groupby("user_id").cat.transform("nunique") >= 2]
        users = pd.factorize(g.user_id)[0]
        R = np.zeros((int(users.max()) + 1 if len(users) else 0, len(self.cats)), dtype=np.float32)
        R[users, g.cat.map(idx).to_numpy()] = 1.0
        self.n_users, k, n_items = R.shape[0], factors, len(self.cats)
        rng = np.random.default_rng(seed)
        Y = rng.normal(0, 0.1, (n_items, k)).astype(np.float32)
        X = np.zeros((self.n_users, k), dtype=np.float32)
        lam = reg * np.eye(k, dtype=np.float32)
        for _ in range(iters if self.n_users else 0):
            X = self._solve_users(R, Y, lam, alpha, chunk)
            Y = self._solve_items(R, X, lam, alpha)
        self.Y, self.lam, self.alpha = Y, lam, alpha
        self.table = {a: self._rank_new_user(idx[a]) for a in self.cats}

    @staticmethod
    def _solve_users(R, Y, lam, alpha, chunk):
        """Bước cố định loại hàng, giải vector của mọi người theo từng khối (A_u x_u = b_u)."""
        k = Y.shape[1]
        YtY = Y.T @ Y + lam
        YY = (Y[:, :, None] * Y[:, None, :]).reshape(len(Y), k * k)
        X = np.empty((R.shape[0], k), dtype=np.float32)
        for s in range(0, R.shape[0], chunk):
            r = R[s:s + chunk]
            A = YtY[None] + alpha * (r @ YY).reshape(-1, k, k)
            b = (1 + alpha) * (r @ Y)
            X[s:s + chunk] = np.linalg.solve(A, b[:, :, None])[:, :, 0]
        return X

    @staticmethod
    def _solve_items(R, X, lam, alpha):
        """Bước cố định người, giải vector của từng loại hàng."""
        XtX = X.T @ X + lam
        Y = np.empty((R.shape[1], X.shape[1]), dtype=np.float32)
        for i in range(R.shape[1]):
            Xi = X[R[:, i] > 0]
            Y[i] = np.linalg.solve(XtX + alpha * Xi.T @ Xi, (1 + alpha) * Xi.sum(axis=0))
        return Y

    def _rank_new_user(self, a: int) -> list[str]:
        """Khách mới chỉ mới mua loại A: tính vector của khách (fold-in) rồi xếp các loại còn lại."""
        y = self.Y[a]
        x = np.linalg.solve(self.Y.T @ self.Y + self.lam + self.alpha * np.outer(y, y), (1 + self.alpha) * y)
        order = np.argsort(-(self.Y @ x))
        return [self.cats[j] for j in order if j != a]

    def rank(self, anchor: str, k: int) -> list[str]:
        return self.table.get(anchor, [])[:k]


def evaluate(model, cases) -> dict:
    """Hit@3: có ít nhất 1 loại đúng trong 3 gợi ý đầu. Recall@5: tỉ lệ loại đúng nằm trong 5 gợi ý."""
    if not cases:
        return {"so_ca": 0}
    hit3 = rec5 = 0.0
    for a, truth in cases:
        top3, top5 = model.rank(a, 3), model.rank(a, 5)
        hit3 += any(c in truth for c in top3)
        rec5 += len(truth & set(top5)) / len(truth)
    return {"so_ca": len(cases), "hit_at_3": round(hit3 / len(cases), 4), "recall_at_5": round(rec5 / len(cases), 4)}


def rules(model: CoPurchase, k: int = 3) -> list[dict]:
    out = []
    for a in SHOP_CATEGORIES:
        for i, b in enumerate(model.rank(a, k), 1):
            out.append({"anchor_category": a, "rec_category": b, "rank": i,
                        "score": round(model.score(a, b), 4), "support": model.co[(a, b)]})
    return out


def rules_sql(rows: list[dict]) -> str:
    esc = lambda s: s.replace("'", "''")
    lines = ["-- Luật mua kèm học từ Amazon Reviews 2023 (sinh bởi upsell/train_upsell.ipynb)",
             "BEGIN;", "DELETE FROM upsell_rules WHERE source = 'amazon';"]
    for r in rows:
        lines.append("INSERT INTO upsell_rules (anchor_category, rec_category, rank, score, support, source) VALUES "
                     f"('{esc(r['anchor_category'])}', '{esc(r['rec_category'])}', {r['rank']}, {r['score']}, {r['support']}, 'amazon');")
    lines.append("COMMIT;")
    return "\n".join(lines) + "\n"
