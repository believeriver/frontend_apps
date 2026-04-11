import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiFetchPortfolio,
  apiFetchDashboard,
  apiFetchIndustry,
  apiAddPosition,
  apiUpdatePosition,
  apiDeletePosition,
} from '../api/portfolio';
import { fetchCompanyList } from '../api/api';
import {
  PortfolioItem,
  DashboardItem,
  IndustryItem,
  PortfolioInput,
} from '../types';
import { RootState } from './index';

interface PortfolioState {
  items: PortfolioItem[];
  dashboard: DashboardItem[];
  industry: IndustryItem[];
  currentPrices: Record<string, number>;   // code -> 現在株価
  loading: boolean;
  mutating: boolean;   // 追加・更新・削除中
  error: string | null;
}

const initialState: PortfolioState = {
  items: [],
  dashboard: [],
  industry: [],
  currentPrices: {},
  loading: false,
  mutating: false,
  error: null,
};

function token(state: RootState): string {
  const t = state.auth.accessToken;
  if (!t) throw new Error('ログインが必要です');
  return t;
}

// ── Thunks ──────────────────────────────────────────────────

export const loadPortfolio = createAsyncThunk(
  'portfolio/load',
  async (_, { getState }) => {
    const t = token(getState() as RootState);
    const [items, dashboard, industry, companies] = await Promise.all([
      apiFetchPortfolio(t),
      apiFetchDashboard(t),
      apiFetchIndustry(t),
      fetchCompanyList(),
    ]);
    const currentPrices: Record<string, number> = {};
    for (const c of companies) {
      const price = parseFloat(c.stock.replace(/,/g, ''));
      if (!isNaN(price)) currentPrices[c.code] = price;
    }
    return { items, dashboard, industry, currentPrices };
  }
);

export const addPosition = createAsyncThunk(
  'portfolio/add',
  async (body: PortfolioInput, { getState, rejectWithValue }) => {
    try {
      const t = token(getState() as RootState);
      await apiAddPosition(t, body);
    } catch (e: any) {
      const data = e.response?.data;
      const msg =
        data?.company_code?.[0] ||
        data?.shares?.[0] ||
        data?.purchase_price?.[0] ||
        data?.purchased_at?.[0] ||
        data?.non_field_errors?.[0] ||
        data?.detail ||
        '追加に失敗しました';
      return rejectWithValue(msg);
    }
  }
);

export const updatePosition = createAsyncThunk(
  'portfolio/update',
  async (
    { id, body }: { id: number; body: Partial<PortfolioInput> },
    { getState, rejectWithValue }
  ) => {
    try {
      const t = token(getState() as RootState);
      await apiUpdatePosition(t, id, body);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail ?? '更新に失敗しました');
    }
  }
);

export const deletePosition = createAsyncThunk(
  'portfolio/delete',
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const t = token(getState() as RootState);
      await apiDeletePosition(t, id);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail ?? '削除に失敗しました');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.items         = action.payload.items;
        state.dashboard     = action.payload.dashboard;
        state.industry      = action.payload.industry;
        state.currentPrices = action.payload.currentPrices;
      })
      .addCase(loadPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? '取得に失敗しました';
      });

    // add / update / delete: 成功後に再ロード（リフレッシュ戦略）
    const mutationPending = (state: PortfolioState) => {
      state.mutating = true;
      state.error = null;
    };
    const mutationDone = (state: PortfolioState) => {
      state.mutating = false;
    };
    const mutationFail = (state: PortfolioState, action: any) => {
      state.mutating = false;
      state.error = action.payload ?? action.error?.message ?? 'エラーが発生しました';
    };

    builder
      .addCase(addPosition.pending,    mutationPending)
      .addCase(addPosition.fulfilled,  mutationDone)
      .addCase(addPosition.rejected,   mutationFail)
      .addCase(updatePosition.pending,  mutationPending)
      .addCase(updatePosition.fulfilled, mutationDone)
      .addCase(updatePosition.rejected,  mutationFail)
      .addCase(deletePosition.pending,  mutationPending)
      .addCase(deletePosition.fulfilled, mutationDone)
      .addCase(deletePosition.rejected,  mutationFail);
  },
});

export const { clearError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
