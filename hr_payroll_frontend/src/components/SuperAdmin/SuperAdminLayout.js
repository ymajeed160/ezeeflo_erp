import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearAuth } from '../../store/superAdminAuthSlice';
import { logout as logoutApi } from '../../services/superAdminService';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Box, IconButton, Avatar, Divider, useMediaQuery, useTheme, Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as CompaniesIcon,
  People as AdminIcon,
  Subscriptions as SubscriptionIcon,
  Key as LicenseIcon,
  Extension as ModulesIcon,
  Security as SecurityIcon,
  Receipt as AuditIcon,
  Campaign as AnnouncementIcon,
  Email as EmailIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as SuperAdminIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 220;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/superadmin/dashboard' },
  { text: 'Companies', icon: <CompaniesIcon />, path: '/superadmin/companies' },
  { text: 'Company Administrators', icon: <AdminIcon />, path: '/superadmin/admins' },
  { text: 'Subscriptions', icon: <SubscriptionIcon />, path: '/superadmin/subscriptions' },
  { text: 'Licenses', icon: <LicenseIcon />, path: '/superadmin/licenses' },
  { text: 'Modules', icon: <ModulesIcon />, path: '/superadmin/modules' },
  { divider: true },
  { text: 'Security', icon: <SecurityIcon />, path: '/superadmin/security' },
  { text: 'Audit Logs', icon: <AuditIcon />, path: '/superadmin/audit-logs' },
  { text: 'Announcements', icon: <AnnouncementIcon />, path: '/superadmin/announcements' },
  { text: 'Email Templates', icon: <EmailIcon />, path: '/superadmin/email-templates' },
  { divider: true },
  { text: 'Reports', icon: <ReportsIcon />, path: '/superadmin/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/superadmin/settings' },
];

const SuperAdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(!isMobile);
  const user = useSelector((state) => state.superAdminAuth?.user);
  const accessToken = useSelector((state) => state.superAdminAuth?.accessToken);

  const handleLogout = async () => {
    try {
      if (accessToken) await logoutApi(accessToken);
    } catch { /* ignore */ }
    dispatch(clearAuth());
    localStorage.removeItem('persist:sa_auth');
    window.location.replace('/superadmin/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(!open)} sx={{ mr: 2 }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <SuperAdminIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            EzeeFlo Super Admin
          </Typography>
          <Chip
            label="Super Admin"
            size="small"
            sx={{
              mr: 2,
              bgcolor: 'rgba(255,152,0,0.2)',
              color: '#ffb74d',
              fontWeight: 600,
              border: '1px solid rgba(255,152,0,0.3)',
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff9800', fontSize: 14 }}>
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

      {/* Sidebar Drawer */}
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
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <List sx={{ pt: 0 }}>
            {menuItems.map((item, index) => {
              if (item.divider) {
                return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
              }
              const isActive = location.pathname === item.path ||
                (item.path !== '/superadmin/dashboard' && location.pathname.startsWith(item.path));
              return (
                <ListItemButton
                  key={item.text}
                  selected={isActive}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    mx: 0.25,
                    my: 0,
                    py: 0.6,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '& .MuiListItemIcon-root': { color: 'white' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        {/* Sidebar Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            EzeeFlo Super Admin Portal v1.0
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          mt: 8,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          width: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default SuperAdminLayout;
