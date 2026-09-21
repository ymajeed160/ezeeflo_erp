import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requireSuperAdmin = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to={requireSuperAdmin ? '/superadmin/login' : '/login'} />;
  }

  if (requireSuperAdmin && !user?.isSuperAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
