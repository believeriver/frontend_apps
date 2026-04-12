import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  apiGetCategories, apiGetTags, apiGetPosts, apiGetPost,
  PostListParams,
} from '../api/techlog';
import { TechCategory, TechTag, TechPostSummary, TechPostDetail, TechComment } from '../types/techlog';
import { RootState } from './index';

interface TechlogState {
  categories: TechCategory[];
  tags: TechTag[];

  // 一覧
  posts: TechPostSummary[];
  postsLoading: boolean;

  // 詳細
  detail: TechPostDetail | null;
  detailLoading: boolean;

  error: string | null;
}

const initialState: TechlogState = {
  categories: [],
  tags: [],
  posts: [],
  postsLoading: false,
  detail: null,
  detailLoading: false,
  error: null,
};

function getToken(state: RootState): string | undefined {
  return state.auth.accessToken ?? undefined;
}

// ── Thunks ──────────────────────────────────────────────────

export const loadMeta = createAsyncThunk('techlog/loadMeta', async () => {
  const [categories, tags] = await Promise.all([apiGetCategories(), apiGetTags()]);
  return { categories, tags };
});

export const loadPosts = createAsyncThunk(
  'techlog/loadPosts',
  async (params: PostListParams, { getState }) => {
    const token = getToken(getState() as RootState);
    return apiGetPosts(params, token);
  }
);

export const loadPostDetail = createAsyncThunk(
  'techlog/loadPostDetail',
  async (id: string, { getState }) => {
    const token = getToken(getState() as RootState);
    // 詳細にはコメントも含まれる
    return apiGetPost(id, token);
  }
);

// ── Slice ────────────────────────────────────────────────────
const techlogSlice = createSlice({
  name: 'techlog',
  initialState,
  reducers: {
    clearDetail(state) {
      state.detail = null;
    },
    updateLike(state, action: PayloadAction<{ id: string; liked: boolean; count: number }>) {
      const { id, liked, count } = action.payload;
      if (state.detail?.id === id) {
        state.detail.is_liked = liked;
        state.detail.like_count = count;
      }
      const p = state.posts.find((p) => p.id === id);
      if (p) p.like_count = count;
    },
    addComment(state, action: PayloadAction<TechComment>) {
      if (state.detail) {
        state.detail.comments.push(action.payload);
        state.detail.comment_count += 1;
      }
    },
    updateComment(state, action: PayloadAction<TechComment>) {
      if (state.detail) {
        const idx = state.detail.comments.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.detail.comments[idx] = action.payload;
      }
    },
    removeComment(state, action: PayloadAction<number>) {
      if (state.detail) {
        state.detail.comments = state.detail.comments.filter((c) => c.id !== action.payload);
        state.detail.comment_count -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMeta.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
        state.tags = action.payload.tags;
      })
      .addCase(loadPosts.pending, (state) => {
        state.postsLoading = true;
        state.error = null;
      })
      .addCase(loadPosts.fulfilled, (state, action) => {
        state.postsLoading = false;
        state.posts = action.payload;
      })
      .addCase(loadPosts.rejected, (state, action) => {
        state.postsLoading = false;
        state.error = action.error.message ?? '取得エラー';
      })
      .addCase(loadPostDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(loadPostDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(loadPostDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.error.message ?? '取得エラー';
      });
  },
});

export const { clearDetail, updateLike, addComment, updateComment, removeComment } = techlogSlice.actions;
export default techlogSlice.reducer;
