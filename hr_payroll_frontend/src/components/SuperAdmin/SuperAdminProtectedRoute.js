import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

/**
 * Super Admin Protected Route
 * 
 * Only allows access to authenticated Super Admin users.
 * Redirects to /superadmin/login if not authenticated.
 */
const SuperAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, accessToken, user } = useSelector((state) => state.superAdminAuth);

  if (!isAuthenticated || !accessToken || !user) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return children;
};

export default SuperAdminProtectedRoute;
