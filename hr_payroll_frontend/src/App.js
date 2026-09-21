import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import HRLogin from './pages/Login/HRLogin';
import Dashboard from './pages/Dashboard/Dashboard';
import Employees from './pages/Employees/Employees';
import Organization from './pages/Organization/Organization';
import AttendancePage from './pages/Attendance/AttendancePage';
import LeavePage from './pages/Leave/LeavePage';
import PayrollPage from './pages/Payroll/PayrollPage';
import BenefitsPage from './pages/Benefits/BenefitsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import HRModulesPage from './pages/HRModules/HRModulesPage';
import MasterDataPage from './pages/MasterData/MasterDataPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SecurityPage from './pages/Security/SecurityPage';
import ReleaseNotes from './pages/ReleaseNotes/ReleaseNotes';

// Super Admin Imports
import SuperAdminProtectedRoute from './components/SuperAdmin/SuperAdminProtectedRoute';
import SuperAdminLayout from './components/SuperAdmin/SuperAdminLayout';
import SuperAdminLogin from './pages/SuperAdmin/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import Companies from './pages/SuperAdmin/Companies';
import CompanyForm from './pages/SuperAdmin/CompanyForm';
import CompanyView from './pages/SuperAdmin/CompanyView';
import Subscriptions from './pages/SuperAdmin/Subscriptions';
import Modules from './pages/SuperAdmin/Modules';
import AuditLogs from './pages/SuperAdmin/AuditLogs';
import Announcements from './pages/SuperAdmin/Announcements';
import Reports from './pages/SuperAdmin/Reports';
import CompanyAdmins from './pages/SuperAdmin/CompanyAdmins';
import Settings from './pages/SuperAdmin/Settings';
import EmailTemplates from './pages/SuperAdmin/EmailTemplates';
import Licenses from './pages/SuperAdmin/Licenses';

const App = () => {
  const mode = useSelector((state) => state.theme.mode);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1976d2', light: '#e3f2fd', dark: '#1565c0' },
          secondary: { main: '#9c27b0', light: '#f3e5f5', dark: '#7b1fa2' },
          success: { main: '#2e7d32', light: '#e8f5e9' },
          warning: { main: '#ed6c02', light: '#fff3e0' },
          error: { main: '#d32f2f', light: '#fce4ec' },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 8 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', fontWeight: 600 },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: { boxShadow: mode === 'light' ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.3)' },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/hr/dashboard" replace />} />

        {/* Login page */}
        <Route path="/login" element={<HRLogin />} />

        {/* Protected HR routes */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="organization" element={<Organization />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="benefits" element={<BenefitsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="master-data" element={<MasterDataPage />} />
          <Route path="hr-modules" element={<HRModulesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="release-notes" element={<ReleaseNotes />} />
        </Route>

        {/* Super Admin Routes — completely isolated from HR routes */}
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route
          path="/superadmin"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminLayout />
            </SuperAdminProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/create" element={<CompanyForm />} />
          <Route path="companies/:id" element={<CompanyView />} />
          <Route path="companies/:id/edit" element={<CompanyForm />} />
          <Route path="admins" element={<CompanyAdmins />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="licenses" element={<Licenses />} />
          <Route path="modules" element={<Modules />} />
          <Route path="security" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="email-templates" element={<EmailTemplates />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
};

/** Simple 404 page */
const NotFoundPage = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, fontFamily: 'sans-serif' }}>
    <span style={{ fontSize: 64 }}>404</span>
    <h2 style={{ margin: 0 }}>Page Not Found</h2>
  </div>
);

/** Placeholder for Super Admin pages (to be implemented in future phases) */
const SuperAdminPlaceholder = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column', gap: 16 }}>
    <h2>{title || 'Coming Soon'}</h2>
    <p style={{ color: '#666' }}>This module will be implemented in a future phase.</p>
  </div>
);

export default App;
