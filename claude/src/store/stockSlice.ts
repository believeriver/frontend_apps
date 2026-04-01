import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchStockHistory } from '../api/api';
import { StockPoint, TimeRange } from '../types';
import { RootState } from './index';

// ── レンジ設定 ─────────────────────────────────────────────
export interface RangeConfig {
  label: string;
  value: TimeRange;
  /** APIに渡す start 日付を生成。null = ALL（最古まで） */
  getStart: () => string | null;
  /** デフォルト6ヶ月取得で賄えるか */
  coveredByDefault: boolean;
}

function dateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return dateStr(d);
}

function yearsAgo(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return dateStr(d);
}

export const RANGE_CONFIGS: RangeConfig[] = [
  { label: '1ヶ月',  value: '1M',  getStart: () => monthsAgo(1),  coveredByDefault: true  },
  { label: '3ヶ月',  value: '3M',  getStart: () => monthsAgo(3),  coveredByDefault: true  },
  { label: '6ヶ月',  value: '6M',  getStart: () => monthsAgo(6),  coveredByDefault: true  },
  { label: '1年',    value: '1Y',  getStart: () => yearsAgo(1),   coveredByDefault: false },
  { label: '3年',    value: '3Y',  getStart: () => yearsAgo(3),   coveredByDefault: false },
  { label: '5年',    value: '5Y',  getStart: () => yearsAgo(5),   coveredByDefault: false },
  { label: '10年',   value: '10Y', getStart: () => yearsAgo(10),  coveredByDefault: false },
  { label: '全期間', value: 'ALL', getStart: () => null,          coveredByDefault: false },
];

// ── State ────────────────────────────────────────────────────
interface StockState {
  history: StockPoint[];
  /** キャッシュの最古日付 (ISO date string)。null = まだ未取得 */
  fetchedStart: string | null;
  currentCode: string | null;
  loading: boolean;
  error: string | null;
  selectedRange: TimeRange;
}

const initialState: StockState = {
  history: [],
  fetchedStart: null,
  currentCode: null,
  loading: false,
  error: null,
  selectedRange: '6M',
};

// ── Thunks ──────────────────────────────────────────────────

/** 初回ロード（コード指定）。デフォルト6ヶ月を取得する */
export const loadStock = createAsyncThunk(
  'stock/load',
  async (code: string) => {
    const data = await fetchStockHistory(code);
    return { code, data };
  }
);

/** レンジ変更時。必要なら再フェッチ、不要ならスキップ */
export const changeRange = createAsyncThunk(
  'stock/changeRange',
  async (range: TimeRange, { getState, dispatch }) => {
    const state = (getState() as RootState).stock;
    const config = RANGE_CONFIGS.find((r) => r.value === range)!;

    // まずレンジを即時反映（UI上のボタン状態を先に更新）
    dispatch(setRange(range));

    if (!state.currentCode) return;

    // デフォルト取得で賄えるレンジならフェッチ不要
    if (config.coveredByDefault) return;

    const requiredStart = config.getStart(); // null = ALL

    // キャッシュで十分かチェック
    if (state.fetchedStart !== null) {
      if (requiredStart === null) {
        // ALL要求 → キャッシュが最古まで達していればOK
        // fetchedStart が APIの最古データ以前なら実質 ALL と判断できないため常に再取得
      } else if (state.fetchedStart <= requiredStart) {
        // キャッシュの方が古い → 追加取得不要
        return;
      }
    }

    // 追加フェッチ
    const startParam = requiredStart ?? '2000-01-01';
    dispatch(loadStockMore({ code: state.currentCode, start: startParam }));
  }
);

export const loadStockMore = createAsyncThunk(
  'stock/loadMore',
  async ({ code, start }: { code: string; start: string }) => {
    const data = await fetchStockHistory(code, start);
    return { data, start };
  }
);

// ── Slice ────────────────────────────────────────────────────
const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setRange(state, action: PayloadAction<TimeRange>) {
      state.selectedRange = action.payload;
    },
    clearStock(state) {
      state.history = [];
      state.fetchedStart = null;
      state.currentCode = null;
      state.error = null;
      state.selectedRange = '6M';
    },
  },
  extraReducers: (builder) => {
    // 初回ロード
    builder
      .addCase(loadStock.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.history = [];
        state.fetchedStart = null;
      })
      .addCase(loadStock.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCode = action.payload.code;
        state.history = action.payload.data;
        state.fetchedStart = action.payload.data[0]?.year.slice(0, 10) ?? null;
      })
      .addCase(loadStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'データの取得に失敗しました';
      });

    // 追加フェッチ（より古いデータを取得してマージ）
    builder
      .addCase(loadStockMore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadStockMore.fulfilled, (state, action) => {
        state.loading = false;
        // 重複を除いてマージ（新データが古いものを含むため全置換）
        state.history = action.payload.data;
        state.fetchedStart = action.payload.data[0]?.year.slice(0, 10) ?? state.fetchedStart;
      })
      .addCase(loadStockMore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? '追加データの取得に失敗しました';
      });
  },
});

export const { setRange, clearStock } = stockSlice.actions;
export default stockSlice.reducer;
