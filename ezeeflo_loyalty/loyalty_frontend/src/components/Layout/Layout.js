import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Box, IconButton, Avatar, Menu, MenuItem,
  Divider, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People as PeopleIcon, CardGiftcard as LoyaltyIcon,
  Stars as MembershipIcon, Redeem as RewardsIcon, Campaign as CampaignIcon,
  ConfirmationNumber as CouponIcon, CardMembership as GiftCardIcon,
  Share as ReferralIcon, Receipt as TransactionIcon, Assessment as ReportIcon,
  Settings as SettingsIcon, Security as SecurityIcon, Menu as MenuIcon,
  Logout as LogoutIcon, Person as PersonIcon, AdminPanelSettings as AdminIcon,
  Group as GroupIcon, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { logoutUser } from '../../store/authSlice';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 64;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Loyalty Accounts', icon: <LoyaltyIcon />, path: '/loyalty' },
  { text: 'Membership', icon: <MembershipIcon />, path: '/membership' },
  { text: 'Rewards', icon: <RewardsIcon />, path: '/rewards' },
  { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
  { text: 'Coupons', icon: <CouponIcon />, path: '/coupons' },
  { text: 'Gift Cards', icon: <GiftCardIcon />, path: '/giftcards' },
  { text: 'Referrals', icon: <ReferralIcon />, path: '/referrals' },
  { text: 'Transactions', icon: <TransactionIcon />, path: '/transactions' },
  { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Users & Roles', icon: <AdminIcon />, path: '/users' },
  { text: 'Role Permissions', icon: <GroupIcon />, path: '/roles' },
  { text: 'Rule Engine', icon: <LoyaltyIcon />, path: '/loyalty-rules' },
  { text: 'Digital Cards', icon: <MembershipIcon />, path: '/membership-cards' },
  { text: 'Enterprise Hub', icon: <SecurityIcon />, path: '/enterprise' },
  { text: 'Security & Audit', icon: <SecurityIcon />, path: '/security' },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
              sx={{ borderRadius: 2, mb: 0.5, justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 1 : 2 }}
              title={collapsed ? item.text : ''}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
              {!collapsed && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', color: 'text.primary', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          {!isMobile && (
            <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ mr: 1 }}>
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LoyaltyIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              EzeeFlo Loyalty
            </Typography>
          </Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.firstName} {user?.lastName}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid #E5E7EB', transition: 'width 0.3s' } }}>
          <Toolbar />
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
