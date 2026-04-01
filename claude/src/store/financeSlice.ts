import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCompanyData } from '../api/api';
import { CompanyData } from '../types';

interface FinanceState {
  data: CompanyData | null;
  loading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  data: null,
  loading: false,
  error: null,
};

export const loadCompany = createAsyncThunk(
  'finance/load',
  async (code: string) => fetchCompanyData(code)
);

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    clearCompany(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loadCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'データの取得に失敗しました';
      });
  },
});

export const { clearCompany } = financeSlice.actions;
export default financeSlice.reducer;
