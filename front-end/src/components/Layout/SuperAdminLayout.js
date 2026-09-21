import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, AppBar, Toolbar, Avatar, Button,
} from '@mui/material';
import {
  Logout, Store, Shield,
} from '@mui/icons-material';
import { logout as logoutAction, clearAuth } from '../../store/slices/authSlice';
import { clearActiveCompany } from '../../store/slices/companySlice';

const SuperAdminLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(clearAuth());
    dispatch(clearActiveCompany());
    try {
      localStorage.removeItem('persist:root');
      sessionStorage.clear();
    } catch { /* ignore */ }
    dispatch(logoutAction());
    window.location.replace('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      {/* ─── Top Header Bar ─── */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1a1a2e', borderRadius: 0 }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Shield sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 0, mr: 1 }}>
            EzeeFlo
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, mr: 'auto' }}>
            Super Admin Panel
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Store />}
              onClick={() => navigate('/select-company')}
              sx={{
                color: '#fff', borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                textTransform: 'none',
              }}
            >
              Select Company
            </Button>

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                  {user.username?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {user.username}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              size="small"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Page Content ─── */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        {children}
      </Box>
    </Box>
  );
};

export default SuperAdminLayout;
