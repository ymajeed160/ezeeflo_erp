import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, Alert, IconButton, Tooltip, Stack, TextField,
  TablePagination, InputAdornment, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Search, LockReset, Lock, LockOpen, Block, CheckCircle, VpnKey } from '@mui/icons-material';
import axios from 'axios';

const API = '/api/superadmin';
const tk = () => { try { return JSON.parse(localStorage.getItem('persist:sa_auth')).accessToken; } catch { return null; } };
const h = () => ({ headers: { Authorization: `Bearer ${tk()}` } });

const CompanyAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [resetDialog, setResetDialog] = useState({ open: false, admin: null, password: '' });

  const fetch = async () => {
    try { setLoading(true); const { data } = await axios.get(`${API}/admins`, { ...h(), params: { page: page + 1, limit: rowsPerPage, search } }); setAdmins(data.data || []); setTotal(data.meta?.pagination?.total || 0); }
    catch (e) { setError('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page, rowsPerPage, search]);

  const handleAction = async (id, action) => {
    try { await axios.post(`${API}/admins/${id}/toggle-status`, { action }, h()); fetch(); }
    catch { setError('Action failed'); }
  };

  const handleReset = async () => {
    try {
      const { data } = await axios.post(`${API}/admins/${resetDialog.admin.id}/reset-password`, { newPassword: resetDialog.password || undefined }, h());
      setResetDialog({ open: false, admin: null, password: '' });
      alert(`Password reset. Temporary password: ${data.data?.tempPassword || 'Welcome@123'}`);
      fetch();
    } catch { setError('Reset failed'); }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Company Administrators</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <TextField size="small" placeholder="Search admins..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ minWidth: 300 }} />
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead><TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell><TableCell sx={{ fontWeight: 600 }}>Email/Username</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Company</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              : admins.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>No administrators found</TableCell></TableRow>
                : admins.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell><Typography fontWeight={600}>{a.firstName} {a.lastName}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{a.email}</Typography><Typography variant="caption" color="text.secondary">@{a.username}</Typography></TableCell>
                    <TableCell>
                      {a.companyDetails?.map(c => <Chip key={c.id} label={c.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Chip icon={a.isActive ? <CheckCircle /> : <Block />} label={a.isActive ? 'Active' : 'Inactive'} color={a.isActive ? 'success' : 'default'} size="small" />
                        {a.isLocked && <Chip icon={<Lock />} label="Locked" color="warning" size="small" />}
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="caption">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : 'Never'}</Typography></TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Reset Password"><IconButton size="small" color="primary" onClick={() => setResetDialog({ open: true, admin: a, password: '' })}><VpnKey fontSize="small" /></IconButton></Tooltip>
                        {a.isLocked
                          ? <Tooltip title="Unlock"><IconButton size="small" color="success" onClick={() => handleAction(a.id, 'unlock')}><LockOpen fontSize="small" /></IconButton></Tooltip>
                          : <Tooltip title="Lock"><IconButton size="small" color="warning" onClick={() => handleAction(a.id, 'lock')}><Lock fontSize="small" /></IconButton></Tooltip>}
                        {a.isActive
                          ? <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => handleAction(a.id, 'deactivate')}><Block fontSize="small" /></IconButton></Tooltip>
                          : <Tooltip title="Activate"><IconButton size="small" color="success" onClick={() => handleAction(a.id, 'activate')}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>

      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, admin: null, password: '' })}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Reset password for <strong>{resetDialog.admin?.email}</strong>?</Typography>
          <TextField fullWidth label="New Password (leave blank for default)" type="password" value={resetDialog.password}
            onChange={e => setResetDialog({ ...resetDialog, password: e.target.value })} helperText="Default: Welcome@123" />
        </DialogContent>
        <DialogActions><Button onClick={() => setResetDialog({ open: false, admin: null, password: '' })}>Cancel</Button><Button variant="contained" color="warning" onClick={handleReset}>Reset Password</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyAdmins;
