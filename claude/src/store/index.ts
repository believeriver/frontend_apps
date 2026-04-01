import { configureStore } from '@reduxjs/toolkit';
import stockReducer from './stockSlice';
import financeReducer from './financeSlice';

export const store = configureStore({
  reducer: {
    stock: stockReducer,
    finance: financeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
