import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { login } from '../../services/hrAuthService';
import { setAuth } from '../../store/hrAuthSlice';
import { useDispatch } from 'react-redux';

const HRLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        tenants: result.tenants,
      }));
      navigate('/hr/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f0f2f5',
      p: 2,
    }}>
      <Card sx={{ maxWidth: 420, width: '100%', p: 4, borderRadius: 3, boxShadow: 1, transition: 'box-shadow 0.3s ease', '&:hover': { boxShadow: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="EzeeFlo HR & Payroll Logo"
            sx={{ width: 260, height: 'auto', mb: 0.5 }}
          />
          <Typography variant="body2" color="text.secondary">
            Sign in to your account
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, py: 1.5, borderRadius: 2, fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
          Secure authentication via EzeeFlo Platform
        </Typography>
      </Card>
    </Box>
  );
};

export default HRLogin;
