import React from 'react';
import { useSelector } from 'react-redux';
import HRLogin from '../../pages/Login/HRLogin';

/**
 * HR Protected Route
 * 
 * Validates that the user has an ERP JWT token and a company is selected.
 * Redirects to login if not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const { accessToken, user } = useSelector((state) => state.hrAuth);

  if (!accessToken || !user) {
    return <HRLogin />;
  }

  return children;
};

export default ProtectedRoute;
