import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiLogin, apiRegister, apiLogout, apiRefresh, apiUpdateProfile } from '../api/auth';

const REFRESH_KEY = 'ir_refresh_token';
const SUPERUSER_KEY = 'ir_is_superuser';

interface AuthState {
  email: string | null;
  accessToken: string | null;
  isSuperuser: boolean;
  loading: boolean;
  error: string | null;
}

function savedRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

const initialState: AuthState = {
  email: null,
  accessToken: null,
  isSuperuser: localStorage.getItem(SUPERUSER_KEY) === 'true',
  loading: false,
  error: null,
};

// ── Thunks ──────────────────────────────────────────────────

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await apiLogin(email, password);
      localStorage.setItem(REFRESH_KEY, res.refresh);
      localStorage.setItem(SUPERUSER_KEY, String(res.is_superuser));
      return { email: res.email, accessToken: res.access, isSuperuser: res.is_superuser };
    } catch (e: any) {
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.non_field_errors?.[0] ||
        'ログインに失敗しました';
      return rejectWithValue(msg);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    { email, password, password2 }: { email: string; password: string; password2: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiRegister(email, password, password2);
      return res.email;
    } catch (e: any) {
      const data = e.response?.data;
      const msg =
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.password2?.[0] ||
        data?.non_field_errors?.[0] ||
        data?.detail ||
        '登録に失敗しました';
      return rejectWithValue(msg);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = (getState() as { auth: AuthState }).auth;
    const refresh = savedRefresh();
    if (state.accessToken && refresh) {
      try {
        await apiLogout(state.accessToken, refresh);
      } catch {
        // サーバー側エラーでもローカルはクリア
      }
    }
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(SUPERUSER_KEY);
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    { token, email, username }: { token: string; email?: string; username?: string },
    { rejectWithValue }
  ) => {
    try {
      return await apiUpdateProfile(token, { email, username });
    } catch (e: any) {
      const data = e.response?.data;
      const msg = data?.email?.[0] || data?.username?.[0] || data?.detail || '更新に失敗しました';
      return rejectWithValue(msg);
    }
  }
);

/** アプリ起動時: localStorage にリフレッシュトークンがあれば自動ログイン */
export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    const refresh = savedRefresh();
    if (!refresh) return rejectWithValue('no token');
    try {
      const access = await apiRefresh(refresh);
      return access;
    } catch {
      localStorage.removeItem(REFRESH_KEY);
      return rejectWithValue('refresh failed');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.email = action.payload.email;
        state.accessToken = action.payload.accessToken;
        state.isSuperuser = action.payload.isSuperuser;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        // 登録成功 → ログインページへ誘導（自動ログインしない）
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.email = null;
        state.accessToken = null;
        state.isSuperuser = false;
        state.error = null;
      });

    // restoreSession
    builder
      .addCase(restoreSession.fulfilled, (state, action: PayloadAction<string>) => {
        state.accessToken = action.payload;
        // email はトークンからは取れないため空のまま（ログイン時に設定）
      })
      .addCase(restoreSession.rejected, (state) => {
        state.accessToken = null;
        state.email = null;
      });

    // updateProfile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.email = action.payload.email;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
