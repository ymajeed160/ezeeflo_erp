import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearAuth } from '../../store/hrAuthSlice';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Box, IconButton, Avatar, Chip, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as OrgIcon,
  AccessTime as AttendanceIcon,
  EventNote as LeaveIcon,
  MonetizationOn as PayrollIcon,
  CreditCard as BenefitsIcon,
  Settings as SettingsIcon,
  Storage as MasterDataIcon,
  Hub as ModulesIcon,
  Assessment as ReportsIcon,
  Security as SecurityIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  NewReleases as ReleaseIcon,
} from '@mui/icons-material';
import { getUser } from '../../utils/auth';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/hr/dashboard' },
  { text: 'Employees', icon: <PeopleIcon />, path: '/hr/employees' },
  { text: 'Organization', icon: <OrgIcon />, path: '/hr/organization' },
  { text: 'Attendance', icon: <AttendanceIcon />, path: '/hr/attendance' },
  { text: 'Leave Management', icon: <LeaveIcon />, path: '/hr/leave' },
  { text: 'Payroll', icon: <PayrollIcon />, path: '/hr/payroll' },
  { text: 'Benefits & EOSB', icon: <BenefitsIcon />, path: '/hr/benefits' },
  { text: 'HR Modules', icon: <ModulesIcon />, path: '/hr/hr-modules' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/hr/reports' },
  { text: 'Security', icon: <SecurityIcon />, path: '/hr/security' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/hr/settings' },
  { text: 'Master Data', icon: <MasterDataIcon />, path: '/hr/master-data' },
  { text: 'Release Notes', icon: <ReleaseIcon />, path: '/hr/release-notes' },
];

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(!isMobile);
  const user = useSelector((state) => state.hrAuth?.user) || getUser();
  const tenants = useSelector((state) => state.hrAuth?.tenants) || [];
  const activeCompanyId = useSelector((state) => state.hrAuth?.activeCompanyId);
  const activeTenant = tenants.find(t => t.id === activeCompanyId);

  const handleLogout = () => {
    dispatch(clearAuth());
    localStorage.removeItem('persist:root');
    localStorage.removeItem('persist:hr_payroll');
    localStorage.removeItem('persist:hr_auth');
    window.location.replace('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(!open)} sx={{ mr: 2 }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            EzeeFlo HR & Payroll
          </Typography>
          {activeTenant && (
            <Chip
              label={activeTenant.name}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ mr: 2, borderColor: 'rgba(255,255,255,0.5)', color: 'white', fontWeight: 500 }}
            />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {user.firstName} {user.lastName}
                </Typography>
              </>
            )}
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.text}
                  onClick={() => !item.disabled && navigate(item.path)}
                  selected={isActive}
                  disabled={item.disabled}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    mb: 0.3,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.light' },
                    },
                    opacity: item.disabled ? 0.5 : 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}
                  />
                  {item.disabled && (
                    <Chip label="Soon" size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                  )}
                </ListItemButton>
              );
            })}
          </List>
          <Divider sx={{ mx: 2, my: 1 }} />
        </Box>
        {/* Sidebar Footer */}
        <Box sx={{ mt: 'auto', p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Powered by EzeeFlo
          </Typography>
          <Typography variant="caption" display="block" color="text.disabled">
            &copy; {new Date().getFullYear()} v3.0.0
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: open && !isMobile ? 0 : 0,
          transition: 'margin-left 0.3s',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
