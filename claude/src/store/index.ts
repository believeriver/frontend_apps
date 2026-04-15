import { configureStore } from '@reduxjs/toolkit';
import stockReducer       from './stockSlice';
import financeReducer     from './financeSlice';
import companyListReducer from './companyListSlice';
import authReducer        from './authSlice';
import portfolioReducer   from './portfolioSlice';
import techlogReducer     from './techlogSlice';
import blogReducer        from './blogSlice';

export const store = configureStore({
  reducer: {
    stock:       stockReducer,
    finance:     financeReducer,
    companyList: companyListReducer,
    auth:        authReducer,
    portfolio:   portfolioReducer,
    techlog:     techlogReducer,
    blog:        blogReducer,
  },
});

export type RootState  = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
