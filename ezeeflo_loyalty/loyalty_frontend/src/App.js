import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import CustomerDetail from './pages/CustomerDetail';
import MembershipTiers from './pages/MembershipTiers';
import PointsOperations from './pages/PointsOperations';
import Transactions from './pages/Transactions';
import RewardsCatalog from './pages/RewardsCatalog';
import Campaigns from './pages/Campaigns';
import Coupons from './pages/Coupons';
import GiftCards from './pages/GiftCards';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import SecurityAudit from './pages/SecurityAudit';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import LoyaltyRuleEngine from './pages/LoyaltyRuleEngine';
import EnterpriseHub from './pages/EnterpriseHub';
import MembershipCards from './pages/MembershipCards';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Companies from './pages/Companies';
import CompanyForm from './pages/CompanyForm';
import Layout from './components/Layout/Layout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/superadmin/login" element={!isAuthenticated ? <SuperAdminLogin /> : <Navigate to="/superadmin/dashboard" />} />

      {/* Company Admin Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="membership" element={<MembershipTiers />} />
        <Route path="loyalty" element={<PointsOperations />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="rewards" element={<RewardsCatalog />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="giftcards" element={<GiftCards />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="security" element={<SecurityAudit />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="loyalty-rules" element={<LoyaltyRuleEngine />} />
        <Route path="enterprise" element={<EnterpriseHub />} />
        <Route path="membership-cards" element={<MembershipCards />} />
      </Route>

      {/* Super Admin Routes */}
      <Route path="/superadmin" element={<ProtectedRoute requireSuperAdmin><SuperAdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/superadmin/dashboard" />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/new" element={<CompanyForm />} />
        <Route path="companies/:id/edit" element={<CompanyForm />} />
        {/* Future super admin routes: plans, modules, billing, etc. */}
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
