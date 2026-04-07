import { configureStore } from '@reduxjs/toolkit';
import stockReducer from './stockSlice';
import financeReducer from './financeSlice';
import companyListReducer from './companyListSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    stock: stockReducer,
    finance: financeReducer,
    companyList: companyListReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
