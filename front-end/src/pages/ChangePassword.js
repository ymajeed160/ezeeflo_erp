import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  VpnKey,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import authApi from '../services/authApi';

const ChangePassword = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword) {
      e.newPassword = 'New password is required';
    } else {
      if (form.newPassword.length < 8) e.newPassword = 'Minimum 8 characters';
      else if (!/[A-Z]/.test(form.newPassword)) e.newPassword = 'Must contain an uppercase letter';
      else if (!/[a-z]/.test(form.newPassword)) e.newPassword = 'Must contain a lowercase letter';
      else if (!/[0-9]/.test(form.newPassword)) e.newPassword = 'Must contain a number';
    }
    if (form.newPassword !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    if (form.newPassword && form.currentPassword === form.newPassword) {
      e.newPassword = 'New password must be different from current password';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMessage(null);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({
        severity: 'error',
        text: err.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Success state
  if (success) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', py: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6, px: 4 }}>
            <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Password Changed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your password has been updated. Please use your new password the next time you log in.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/app/profile')}
              >
                Back to Profile
              </Button>
              <Button
                variant="contained"
                onClick={() => setSuccess(false)}
              >
                Change Again
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 1 }}
          color="inherit"
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={700}>
          Change Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update your password to keep your account secure.
        </Typography>
      </Box>

      {message && (
        <Alert
          severity={message.severity}
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            {/* Current Password */}
            <TextField
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              fullWidth
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleShow('current')}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* New Password */}
            <TextField
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              fullWidth
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              error={!!errors.newPassword}
              helperText={errors.newPassword || 'Min 8 characters, uppercase, lowercase & number'}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleShow('new')}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm New Password */}
            <TextField
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              fullWidth
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleShow('confirm')}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Requirements */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Password Requirements:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: form.newPassword.length >= 8 ? 'success.main' : 'text.disabled',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  At least 8 characters
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: /[A-Z]/.test(form.newPassword) ? 'success.main' : 'text.disabled',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  One uppercase letter
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: /[a-z]/.test(form.newPassword) ? 'success.main' : 'text.disabled',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  One lowercase letter
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: /[0-9]/.test(form.newPassword) ? 'success.main' : 'text.disabled',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  One number
                </Typography>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} /> : <Lock />}
                sx={{ minWidth: 180 }}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePassword;
