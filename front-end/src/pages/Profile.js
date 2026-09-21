import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  Avatar, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Stack,
} from '@mui/material';
import {
  Edit, Save, Cancel, Lock, Email, Phone, Person, Badge as BadgeIcon,
  CheckCircle, Block, Security, Devices,
  PowerSettingsNew, AdminPanelSettings,
  VpnKey, CloudOff,
} from '@mui/icons-material';
import authApi from '../services/authApi';
import userApi from '../services/userApi';
import { logout as logoutAction, setUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Profile form
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  });

  // Password dialog
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await userApi.updateProfile(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      setMessage({ severity: 'success', text: 'Profile updated successfully' });
      setEditMode(false);
      // Refresh user data
      if (res.data) {
        dispatch(setUser(res.data));
      }
    } catch (err) {
      setMessage({ severity: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = () => {
    const e = {};
    if (!pwdForm.currentPassword) e.currentPassword = 'Current password is required';
    if (!pwdForm.newPassword) e.newPassword = 'New password is required';
    else if (pwdForm.newPassword.length < 8) e.newPassword = 'Min 8 characters';
    else if (!/[A-Z]/.test(pwdForm.newPassword)) e.newPassword = 'Must contain an uppercase letter';
    else if (!/[a-z]/.test(pwdForm.newPassword)) e.newPassword = 'Must contain a lowercase letter';
    else if (!/[0-9]/.test(pwdForm.newPassword)) e.newPassword = 'Must contain a number';
    if (pwdForm.newPassword !== pwdForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setChangingPwd(true);
    try {
      await authApi.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setMessage({ severity: 'success', text: 'Password changed successfully' });
      setPasswordDialog(false);
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ severity: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await authApi.logoutAll();
      dispatch(logoutAction());
      navigate('/login');
    } catch (err) {
      setMessage({ severity: 'error', text: 'Failed to logout all sessions' });
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const roleName = user.roles?.[0]?.name || user.Roles?.[0]?.name || 'User';
  const statusColor = user.isActive ? 'success' : 'error';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>My Profile</Typography>
          <Typography variant="body2" color="text.secondary">Manage your account settings</Typography>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Profile Hero Card */}
      <Card sx={{ borderRadius: 3, mb: 3, overflow: 'visible' }}>
        <Box sx={{
          height: 100,
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          borderRadius: '12px 12px 0 0',
          position: 'relative',
        }} />
        <CardContent sx={{ pt: 0, px: 4, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            <Avatar
              sx={{
                width: 96, height: 96, fontSize: '2rem', fontWeight: 700,
                bgcolor: 'primary.main', border: '4px solid white',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                mt: '-56px',
              }}
            >
              {initials || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, pb: 0.5, mt: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={700}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Chip label={roleName} size="small" color="primary" variant="outlined" />
                <Chip
                  icon={user.isActive ? <CheckCircle /> : <Block />}
                  label={user.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  color={statusColor}
                />
                {user.isLocked && (
                  <Chip icon={<Lock />} label="Locked" size="small" color="error" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {user.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignSelf: 'flex-start', mt: 1.5 }}>
              {!editMode ? (
                <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={() => { setEditMode(false); setMessage(null); }}>
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 3, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Personal Info" icon={<Person />} iconPosition="start" />
          <Tab label="Security" icon={<Security />} iconPosition="start" />
          <Tab label="Sessions" icon={<Devices />} iconPosition="start" />
        </Tabs>

        {/* ═══ Tab 1: Personal Info ═══ */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="First Name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  disabled={!editMode}
                  InputProps={{ startAdornment: <Person fontSize="small" sx={{ mr: 1, color: 'action.disabled' }} /> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Last Name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  disabled={!editMode}
                  InputProps={{ startAdornment: <Person fontSize="small" sx={{ mr: 1, color: 'action.disabled' }} /> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Email"
                  value={form.email}
                  disabled
                  InputProps={{ startAdornment: <Email fontSize="small" sx={{ mr: 1, color: 'action.disabled' }} /> }}
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!editMode}
                  InputProps={{ startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: 'action.disabled' }} /> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Username"
                  value={user.username || ''}
                  disabled
                  InputProps={{ startAdornment: <BadgeIcon fontSize="small" sx={{ mr: 1, color: 'action.disabled' }} /> }}
                  helperText="Username cannot be changed"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="Role"
                  value={roleName}
                  disabled
                  InputProps={{ startAdornment: <AdminPanelSettings fontSize="small" sx={{ mr: 1, color: 'action.disabled' }} /> }}
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* ═══ Tab 2: Security ═══ */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              {/* Change Password */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <VpnKey color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>Password</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Update your password regularly to keep your account secure.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Lock />}
                      onClick={() => setPasswordDialog(true)}
                    >
                      Change Password
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Account Status */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Security color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>Account Status</Typography>
                    </Box>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={user.isActive ? 'success' : 'error'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Locked</Typography>
                        <Chip
                          label={user.isLocked ? 'Yes' : 'No'}
                          size="small"
                          color={user.isLocked ? 'error' : 'default'}
                        />
                      </Box>
                      {user.lastLogin && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Last Login</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {new Date(user.lastLogin).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Member Since</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Danger Zone */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'error.light' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PowerSettingsNew color="error" />
                      <Typography variant="subtitle1" fontWeight={600} color="error">Sessions</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Logout from all active sessions. You will be signed out from all devices.
                    </Typography>
                    <Button variant="outlined" color="error" startIcon={<CloudOff />} onClick={handleLogoutAll}>
                      Logout All Sessions
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* ═══ Tab 3: Sessions ═══ */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Active sessions for your account. You can logout from individual devices.
            </Alert>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><strong>Device</strong></TableCell>
                    <TableCell><strong>IP Address</strong></TableCell>
                    <TableCell><strong>Last Active</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Devices color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>Current Device</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {navigator.userAgent || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">Current Session</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>Now</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Active" size="small" color="success" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" color="text.secondary">Current</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Card>

      {/* ═══ Change Password Dialog ═══ */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock color="primary" />
            <span>Change Password</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              error={!!pwdErrors.currentPassword}
              helperText={pwdErrors.currentPassword}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              error={!!pwdErrors.newPassword}
              helperText={pwdErrors.newPassword || 'Min 8 chars, uppercase, lowercase & number'}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
              error={!!pwdErrors.confirmPassword}
              helperText={pwdErrors.confirmPassword}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={changingPwd}
            startIcon={changingPwd ? <CircularProgress size={16} /> : <Save />}
          >
            {changingPwd ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
