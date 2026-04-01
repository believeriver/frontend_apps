import { configureStore } from '@reduxjs/toolkit';
import stockReducer from './stockSlice';
import financeReducer from './financeSlice';
import companyListReducer from './companyListSlice';

export const store = configureStore({
  reducer: {
    stock: stockReducer,
    finance: financeReducer,
    companyList: companyListReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
