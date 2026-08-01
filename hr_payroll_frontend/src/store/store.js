import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import themeReducer from './slices/themeSlice';
import dashboardReducer from './slices/dashboardSlice';
import employeeReducer from './slices/employeeSlice';
import { orgReducers } from './slices/orgSlices';
import { attendanceReducers } from './slices/attendanceSlices';
import { leaveReducers } from './slices/leaveSlices';
import { payrollReducers } from './slices/payrollSlices';
import { benefitsReducers } from './slices/benefitsSlices';
import { hrModulesReducers } from './slices/hrModulesSlices';
import userReducer from './slices/userSlice';
import hrAuthReducer from './hrAuthSlice';

const persistConfig = {
  key: 'hr_payroll',
  storage,
  whitelist: ['theme'],
};

const appReducer = combineReducers({
  theme: themeReducer,
  hrAuth: hrAuthReducer,
  dashboard: dashboardReducer,
  employees: employeeReducer,
  ...orgReducers,
  ...attendanceReducers,
  ...leaveReducers,
  ...payrollReducers,
  ...benefitsReducers,
  ...hrModulesReducers,
  users: userReducer,
});

const persistedReducer = persistReducer(persistConfig, appReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
