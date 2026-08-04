/**
 * useAuth Hook
 * 
 * Convenience hook for accessing auth state and actions.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  loginThunk,
  logoutThunk,
  restoreSessionThunk,
  selectCompany,
  setBiometricEnabled,
  updateUserProfile,
  updateLastActivity,
} from '../store/authSlice';
import type { LoginCredentials, CompanyInfo, UserProfile } from '../types';
import BiometricService from '../services/BiometricService';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginThunk(credentials));
      if (loginThunk.fulfilled.match(result)) {
        return { success: true, data: result.payload };
      }
      return { success: false, error: result.payload as string };
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
  }, [dispatch]);

  const restoreSession = useCallback(async () => {
    const result = await dispatch(restoreSessionThunk());
    return restoreSessionThunk.fulfilled.match(result);
  }, [dispatch]);

  const switchCompany = useCallback(
    (company: CompanyInfo) => {
      dispatch(selectCompany(company));
    },
    [dispatch]
  );

  const toggleBiometric = useCallback(
    (enabled: boolean) => {
      dispatch(setBiometricEnabled(enabled));
    },
    [dispatch]
  );

  const updateProfile = useCallback(
    (data: Partial<UserProfile>) => {
      dispatch(updateUserProfile(data));
    },
    [dispatch]
  );

  const touchActivity = useCallback(() => {
    dispatch(updateLastActivity());
  }, [dispatch]);

  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    const isAvailable = await BiometricService.isHardwareAvailable();
    if (!isAvailable) return false;

    const isEnrolled = await BiometricService.isEnrolled();
    if (!isEnrolled) return false;

    const result = await BiometricService.authenticate();
    return result.success;
  }, []);

  return {
    ...auth,
    login,
    logout,
    restoreSession,
    switchCompany,
    toggleBiometric,
    updateProfile,
    touchActivity,
    authenticateWithBiometrics,
  };
};
