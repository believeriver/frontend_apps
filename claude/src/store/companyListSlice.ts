import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchCompanyList } from '../api/api';
import { CompanyListItem } from '../types';

export type SortKey = 'dividend' | 'dividend_rank' | 'code' | 'name' | 'stock' | 'per' | 'pbr';
export type SortDir = 'asc' | 'desc';

interface CompanyListState {
  items: CompanyListItem[];
  loading: boolean;
  error: string | null;
  search: string;
  sortKey: SortKey;
  sortDir: SortDir;
  page: number;
}

const PAGE_SIZE = 50;

const initialState: CompanyListState = {
  items: [],
  loading: false,
  error: null,
  search: '',
  sortKey: 'dividend',
  sortDir: 'desc',
  page: 1,
};

export const loadCompanyList = createAsyncThunk(
  'companyList/load',
  async () => fetchCompanyList()
);

function parsePrice(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

export function applyFilter(items: CompanyListItem[], search: string): CompanyListItem[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter(
    (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  );
}

export function applySort(
  items: CompanyListItem[],
  key: SortKey,
  dir: SortDir
): CompanyListItem[] {
  const sorted = [...items].sort((a, b) => {
    let av: number | string, bv: number | string;
    switch (key) {
      case 'dividend':      av = a.dividend ?? -Infinity; bv = b.dividend ?? -Infinity; break;
      case 'dividend_rank': av = a.dividend_rank ?? Infinity; bv = b.dividend_rank ?? Infinity; break;
      case 'stock':         av = parsePrice(a.stock); bv = parsePrice(b.stock); break;
      case 'code':          av = a.code; bv = b.code; break;
      case 'name':          av = a.name; bv = b.name; break;
      case 'per':           av = a.information?.per ?? Infinity; bv = b.information?.per ?? Infinity; break;
      case 'pbr':           av = a.information?.pbr ?? Infinity; bv = b.information?.pbr ?? Infinity; break;
      default:              return 0;
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function paginate<T>(items: T[], page: number): T[] {
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export const PAGE_SIZE_EXPORT = PAGE_SIZE;

const companyListSlice = createSlice({
  name: 'companyList',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setSort(state, action: PayloadAction<{ key: SortKey; dir: SortDir }>) {
      state.sortKey = action.payload.key;
      state.sortDir = action.payload.dir;
      state.page = 1;
    },
    toggleSort(state, action: PayloadAction<SortKey>) {
      if (state.sortKey === action.payload) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = action.payload;
        state.sortDir = (action.payload === 'dividend') ? 'desc' : 'asc';
      }
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCompanyList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCompanyList.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadCompanyList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? '一覧の取得に失敗しました';
      });
  },
});

export const { setSearch, setSort, toggleSort, setPage } = companyListSlice.actions;
export default companyListSlice.reducer;
