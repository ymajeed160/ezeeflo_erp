import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getToken } from '../../utils/auth';
import { clearAuth } from '../../store/slices/authSlice';import { setActiveCompany, fetchCompanies } from '../../store/slices/companySlice';

const ProtectedRoute = ({ children, allowedRoles = [], requireCompany = true }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, companies: authCompanies } = useSelector((state) => state.auth);
  const { activeCompanyId, companies } = useSelector((state) => state.company);
  const location = useLocation();

  // ── Initialize active company from URL companyId param ──
  const urlCompanyId = new URLSearchParams(location.search).get('companyId');

  // ── Handle browser back/forward cache (bfcache) ──
  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted) {
        const token = getToken();
        if (!token) {
          window.location.replace('/login');
        }
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Ask for confirmation before closing/reloading the tab, and end the session
  // when the page is actually unloaded (browser or tab closed).
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const handleBeforeUnload = (event) => {
      // Browsers show their own standard confirmation dialog.
      event.preventDefault();
      event.returnValue = 'Are you sure you want to close? Your session will be ended.';
      return event.returnValue;
    };

    const handlePageHide = () => {
      try {
        const state = JSON.parse(localStorage.getItem('persist:root') || '{}');
        const auth = state.auth ? JSON.parse(state.auth) : null;
        const refreshToken = auth?.refreshToken;
        if (!refreshToken) return;
        const url = `${process.env.REACT_APP_API_URL || '/api'}/auth/session-end`;
        const blob = new Blob([JSON.stringify({ refreshToken })], { type: 'application/json' });
        if (navigator.sendBeacon) navigator.sendBeacon(url, blob);
      } catch { /* ignore */ }
    };

    // "Refresh"/F5 and in-app navigation also trigger beforeunload in some browsers;
    // we only end the session on pagehide, which does not fire for a normal refresh
    // in Chrome after the user confirms — acceptable trade-off documented in UI.
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isAuthenticated]);

  // Initialize active company from URL param
  useEffect(() => {
    if (requireCompany && urlCompanyId && !activeCompanyId) {
      const matchFromCompany = companies?.find(c => c.id === urlCompanyId);
      const matchFromAuth = authCompanies?.find(c => c.id === urlCompanyId);
      const match = matchFromCompany || matchFromAuth;
      if (match) {
        dispatch(setActiveCompany(match));
      } else {
        dispatch(fetchCompanies());
      }
    }
  }, [urlCompanyId, activeCompanyId, requireCompany]);

  // Also check URL companyId after companies are loaded
  useEffect(() => {
    if (requireCompany && urlCompanyId && !activeCompanyId && companies?.length > 0) {
      const match = companies.find(c => c.id === urlCompanyId);
      if (match) {
        dispatch(setActiveCompany(match));
      }
    }
  }, [companies, urlCompanyId, activeCompanyId, requireCompany]);

  // If Redux says authenticated but no token exists in storage, force logout
  // React 19: must use useEffect for side effects, not render-phase dispatch
  useEffect(() => {
    if (isAuthenticated && !getToken()) {
      dispatch(clearAuth());
      dispatch(setActiveCompany(null));
      window.location.replace('/login');
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if company selection is needed — preserve companyId URL param if present
  if (requireCompany && !activeCompanyId && !urlCompanyId && (authCompanies?.length ?? 0) > 0) {
    return <Navigate to="/select-company" replace />;
  }

  if (allowedRoles.length > 0) {
    const userRoles = user?.roles?.map((r) => r.name) || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;