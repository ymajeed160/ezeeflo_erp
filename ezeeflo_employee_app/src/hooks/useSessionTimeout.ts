/**
 * useSessionTimeout Hook
 * 
 * Monitors user activity and logs out after inactivity timeout.
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './useAuth';
import Config from '../config';

export const useSessionTimeout = () => {
  const { isAuthenticated, lastActivity, touchActivity, logout } = useAuth();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (isAuthenticated) {
      timerRef.current = setTimeout(() => {
        logout();
      }, Config.AUTH.SESSION_TIMEOUT);
    }
  }, [isAuthenticated, logout, clearTimer]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground — check timeout
        if (lastActivity) {
          const elapsed = Date.now() - lastActivity;
          if (elapsed >= Config.AUTH.SESSION_TIMEOUT) {
            logout();
          }
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
      clearTimer();
    };
  }, [lastActivity, logout, clearTimer]);

  // Start/restart timer when authenticated or activity changes
  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [isAuthenticated, lastActivity, startTimer, clearTimer]);

  return { touchActivity };
};
