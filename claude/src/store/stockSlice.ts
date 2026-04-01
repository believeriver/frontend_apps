import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchStockHistory } from '../api/api';
import { StockPoint, TimeRange } from '../types';

interface StockState {
  history: StockPoint[];
  loading: boolean;
  error: string | null;
  selectedRange: TimeRange;
}

const initialState: StockState = {
  history: [],
  loading: false,
  error: null,
  selectedRange: '1Y',
};

export const loadStock = createAsyncThunk(
  'stock/load',
  async (code: string) => fetchStockHistory(code)
);

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setRange(state, action: PayloadAction<TimeRange>) {
      state.selectedRange = action.payload;
    },
    clearStock(state) {
      state.history = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadStock.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(loadStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'データの取得に失敗しました';
      });
  },
});

export const { setRange, clearStock } = stockSlice.actions;
export default stockSlice.reducer;
