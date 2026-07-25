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
      elevation={1}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
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
            ezeeflo
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
            PaperProps={{ sx: { width: 220 } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Avatar sx={{ width: 48, height: 48, mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              <Chip
                label={user?.roles?.[0]?.name || 'User'}
                size="small"
                color="primary"
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/app/profile' + location.search); }}>
              <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleChangePassword}>
              <ListItemIcon><Key fontSize="small" /></ListItemIcon>
              Change Password
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/app/settings/system' + location.search); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleSwitchCompany}>
              <ListItemIcon><Business fontSize="small" /></ListItemIcon>
              Switch Company
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;