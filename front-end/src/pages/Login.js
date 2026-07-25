import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Home } from '@mui/icons-material';
import { login, clearError } from '../store/slices/authSlice';
import { selectCompany } from '../store/slices/companySlice';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, companies, defaultCompanyId } = useSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      const userCompanies = companies ?? [];
      if (userCompanies.length === 1) {
        // Auto-select the only company and go to dashboard
        const company = userCompanies[0];
        dispatch(selectCompany(company.id)).then(() => {
          navigate(`/app/dashboard?companyId=${company.id}`, { replace: true });
        });
      } else if (userCompanies.length > 1) {
        // Multiple companies — show selection page
        navigate('/select-company', { replace: true });
      } else {
        // No companies — redirect to create
        navigate('/company/create', { replace: true });
      }
    }
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch, companies]);

  const validate = () => {
    const errors = {};
    if (!identifier) errors.identifier = 'Email or username is required';
    if (!password) errors.password = 'Password is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      dispatch(login({ identifier, password }));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        position: 'relative',
      }}
    >
      {/* Home Button */}
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: 'text.secondary',
          bgcolor: 'background.paper',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          '&:hover': { bgcolor: '#f5f3ff', color: '#7c3aed' },
          width: 44,
          height: 44,
        }}
      >
        <Home />
      </IconButton>

      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Box
              component="img"
              src="/images/newlogo.png"
              alt="ezeeflo"
              sx={{
                width: 260,
                height: 'auto',
                mx: 'auto',
                mb: 0.5,
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={!!validationErrors.identifier}
                helperText={validationErrors.identifier}
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              autoComplete="current-password"
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
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => navigate('/forgot-password')}
                variant="text"
                size="small"
              >
                Forgot Password?
              </Button>
            </Box>
          </form>

        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;