import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getToken } from '../../utils/auth';
import { clearAuth } from '../../store/slices/authSlice';
import { setActiveCompany, fetchCompanies } from '../../store/slices/companySlice';

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
  if (isAuthenticated && !getToken()) {
    dispatch(clearAuth());
    dispatch(setActiveCompany(null));
    window.location.replace('/login');
    return null;
  }

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