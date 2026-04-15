import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { BlogPostSummary, BlogPostDetail, BlogCategory, BlogTag, BlogComment } from '../types/blog';
import {
  apiGetBlogCategories, apiGetBlogTags,
  apiGetBlogPosts, apiGetBlogPost,
  apiGetBlogComments,
} from '../api/blog';

interface BlogState {
  categories:      BlogCategory[];
  tags:            BlogTag[];
  posts:           BlogPostSummary[];
  postsLoading:    boolean;
  detail:          BlogPostDetail | null;
  detailLoading:   boolean;
  comments:        BlogComment[];
  commentsLoading: boolean;
  error:           string | null;
}

const initialState: BlogState = {
  categories:      [],
  tags:            [],
  posts:           [],
  postsLoading:    false,
  detail:          null,
  detailLoading:   false,
  comments:        [],
  commentsLoading: false,
  error:           null,
};

const getToken = (state: RootState) => state.auth.accessToken ?? undefined;

// ── Thunks ────────────────────────────────────────────────
export const loadBlogMeta = createAsyncThunk('blog/loadMeta', async () => {
  const [categories, tags] = await Promise.all([
    apiGetBlogCategories(),
    apiGetBlogTags(),
  ]);
  return { categories, tags };
});

export const loadBlogPosts = createAsyncThunk(
  'blog/loadPosts',
  async (params: Record<string, unknown>, { getState }) => {
    const token = getToken(getState() as RootState);
    return apiGetBlogPosts(params, token);
  }
);

export const loadBlogPost = createAsyncThunk(
  'blog/loadPost',
  async (uuid: string, { getState }) => {
    const token = getToken(getState() as RootState);
    return apiGetBlogPost(uuid, token);
  }
);

export const loadBlogComments = createAsyncThunk(
  'blog/loadComments',
  async (uuid: string, { getState }) => {
    const token = getToken(getState() as RootState);
    return apiGetBlogComments(uuid, token);
  }
);

// ── Slice ─────────────────────────────────────────────────
const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    updateLike(state, action: PayloadAction<{ liked: boolean; count: number }>) {
      if (state.detail) {
        state.detail.is_liked   = action.payload.liked;
        state.detail.like_count = action.payload.count;
      }
    },
    addComment(state, action: PayloadAction<BlogComment>) {
      state.comments.push(action.payload);
      if (state.detail) state.detail.comment_count += 1;
    },
    updateComment(state, action: PayloadAction<BlogComment>) {
      const idx = state.comments.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) state.comments[idx] = action.payload;
    },
    removeComment(state, action: PayloadAction<number>) {
      state.comments = state.comments.filter(c => c.id !== action.payload);
      if (state.detail) state.detail.comment_count -= 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBlogMeta.fulfilled, (state, a) => {
        state.categories = a.payload.categories;
        state.tags       = a.payload.tags;
      })
      .addCase(loadBlogPosts.pending,   (state) => { state.postsLoading = true; state.error = null; })
      .addCase(loadBlogPosts.fulfilled, (state, a) => { state.postsLoading = false; state.posts = a.payload; })
      .addCase(loadBlogPosts.rejected,  (state, a) => { state.postsLoading = false; state.error = a.error.message ?? 'error'; })
      .addCase(loadBlogPost.pending,   (state) => { state.detailLoading = true; state.detail = null; state.error = null; })
      .addCase(loadBlogPost.fulfilled, (state, a) => { state.detailLoading = false; state.detail = a.payload; })
      .addCase(loadBlogPost.rejected,  (state, a) => { state.detailLoading = false; state.error = a.error.message ?? 'error'; })
      .addCase(loadBlogComments.pending,   (state) => { state.commentsLoading = true; })
      .addCase(loadBlogComments.fulfilled, (state, a) => { state.commentsLoading = false; state.comments = a.payload; })
      .addCase(loadBlogComments.rejected,  (state) => { state.commentsLoading = false; });
  },
});

export const { updateLike, addComment, updateComment, removeComment } = blogSlice.actions;
export default blogSlice.reducer;
