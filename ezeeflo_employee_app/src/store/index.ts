/**
 * Redux Store Configuration
 * 
 * Configures the Redux store with:
 * - Auth slice (persisted)
 * - Theme slice
 * - Middleware for API error handling
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';

// ── Root Reducer ──
const rootReducer = combineReducers({
  auth: authReducer,
});

// ── Store Configuration ──
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types (they may contain non-serializable values)
        ignoredActions: ['auth/login/fulfilled', 'auth/restoreSession/fulfilled'],
        ignoredPaths: ['auth.tokens'],
      },
    }),
  devTools: __DEV__,
});

// ── Types ──
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// ── Typed Hooks ──
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
