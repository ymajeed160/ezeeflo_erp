import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, Card, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, CircularProgress, FormControlLabel, Checkbox,
  Link,
} from '@mui/material';
import {
  Visibility, VisibilityOff, AdminPanelSettings,
} from '@mui/icons-material';
import { login } from '../../services/superAdminService';
import { setAuth } from '../../store/superAdminAuthSlice';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login({ email, password });
      dispatch(setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      }));
      navigate('/superadmin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 50%, #e3f2fd 100%)',
      p: 2,
    }}>
      <Card sx={{
        maxWidth: 440,
        width: '100%',
        p: 5,
        borderRadius: 3,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        transition: 'box-shadow 0.3s ease',
        '&:hover': { boxShadow: '0 12px 48px rgba(0,0,0,0.18)' },
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ff9800, #f57c00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 36, color: 'white' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
            Super Admin Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to manage all companies
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            autoFocus
            required
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
            />
            <Link href="#" underline="hover" sx={{ fontSize: 13, color: '#ff9800', cursor: 'pointer' }}>
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #ff9800, #f57c00)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f57c00, #ef6c00)',
              },
              boxShadow: '0 4px 16px rgba(255, 152, 0, 0.4)',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Super Admin'}
          </Button>
        </Box>

        <Typography variant="caption" color="text.disabled" textAlign="center" display="block" sx={{ mt: 3 }}>
          Secure authentication • Restricted access
        </Typography>
      </Card>
    </Box>
  );
};

export default SuperAdminLogin;
