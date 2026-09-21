import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Loyalty as LoyaltyIcon } from '@mui/icons-material';
import { loginUser, clearError } from '../store/authSlice';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ username, password }));
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F9FAFB', p: 2 }}>
      <Card sx={{ maxWidth: 440, width: '100%', p: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <LoyaltyIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>EzeeFlo Loyalty</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Username or Email" value={username}
              onChange={(e) => setUsername(e.target.value)} required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Password" type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)} required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading} sx={{ py: 1.5, fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              <Button size="small" onClick={() => navigate('/superadmin/login')} sx={{ textTransform: 'none' }}>
                Super Admin Login
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
