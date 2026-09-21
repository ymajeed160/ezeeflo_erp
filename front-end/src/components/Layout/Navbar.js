import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Tooltip,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode,
  LightMode,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  Key,
  Business,
} from '@mui/icons-material';
import { toggleTheme, toggleSidebar } from '../../store/slices/themeSlice';
import { logout as logoutAction, clearAuth } from '../../store/slices/authSlice';
import { clearActiveCompany } from '../../store/slices/companySlice';
import CompanySwitcher from './CompanySwitcher';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);
  const { activeCompany } = useSelector((state) => state.company);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  const handleNotifMenuOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifMenuClose = () => setNotifAnchorEl(null);

  const handleLogout = () => {
    handleProfileMenuClose();
    // Clear Redux state
    dispatch(clearAuth());
    dispatch(clearActiveCompany());

    // 💣 Wipe persisted state from localStorage so redux-persist can't restore old session
    // on browser back-button (bfcache) navigation
    try {
      localStorage.removeItem('persist:root');
      // Also clear any session-only tokens
      sessionStorage.clear();
    } catch { /* ignore */ }

    // Fire the async logout API call (fire-and-forget to invalidate the refresh token server-side)
    dispatch(logoutAction());

    // ⚠️ Use location.replace() instead of navigate() so the login page
    // replaces the current history entry. The browser's back button can NOT
    // go past the login page to cached app pages.
    window.location.replace('/login');
  };

  const handleChangePassword = () => {
    handleProfileMenuClose();
    navigate('/app/change-password');
  };

  const handleSwitchCompany = () => {
    handleProfileMenuClose();
    dispatch(clearActiveCompany());
    navigate('/select-company');
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            EzeeFlo ERP
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <CompanySwitcher />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={mode === 'light' ? 'Dark Mode' : 'Light Mode'}>
            <IconButton onClick={() => dispatch(toggleTheme())} color="inherit">
              {mode === 'light' ? <DarkMode /> : <LightMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton onClick={handleNotifMenuOpen} color="inherit">
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifMenuClose}
            PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
          >
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </Box>
          </Menu>

          <Box
            onClick={handleProfileMenuOpen}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', px: 1 }}
          >
            <Avatar
              sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.roles?.[0]?.name || 'User'}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                width: 240,
                mt: 1,
                borderRadius: 3,
                bgcolor: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0px 8px 24px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{
              p: 2.5, textAlign: 'center',
              background: 'linear-gradient(135deg, #1e293b 0%, #111827 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Avatar sx={{
                width: 52, height: 52, mx: 'auto', mb: 1.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                fontWeight: 700,
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Typography variant="subtitle2" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>{user?.email}</Typography>
              <Chip
                label={user?.roles?.[0]?.name || 'User'}
                size="small"
                sx={{
                  mt: 1, fontWeight: 600, fontSize: '0.7rem',
                  bgcolor: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              />
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/app/profile' + location.search); }}
              sx={{
                py: 1.2, color: '#d1d5db',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#f3f4f6' },
              }}>
              <ListItemIcon><AccountCircle fontSize="small" sx={{ color: '#9ca3af' }} /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleChangePassword}
              sx={{
                py: 1.2, color: '#d1d5db',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#f3f4f6' },
              }}>
              <ListItemIcon><Key fontSize="small" sx={{ color: '#9ca3af' }} /></ListItemIcon>
              Change Password
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/app/settings/system' + location.search); }}
              sx={{
                py: 1.2, color: '#d1d5db',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#f3f4f6' },
              }}>
              <ListItemIcon><Settings fontSize="small" sx={{ color: '#9ca3af' }} /></ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleSwitchCompany}
              sx={{
                py: 1.2, color: '#d1d5db',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#f3f4f6' },
              }}>
              <ListItemIcon><Business fontSize="small" sx={{ color: '#9ca3af' }} /></ListItemIcon>
              Switch Company
            </MenuItem>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <MenuItem onClick={handleLogout}
              sx={{
                py: 1.2, color: '#fca5a5',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.12)', color: '#fecaca' },
              }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;