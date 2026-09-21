import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Button, TextField, MenuItem, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Alert, CircularProgress, InputAdornment, Stack,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, Download, Visibility,
  CheckCircle, Cancel, Block, AccessTime, Archive, Business, Login,
} from '@mui/icons-material';
import {
  getCompanies, deleteCompany, changeCompanyStatus, exportCompanies,
} from '../../services/superAdminCompanyService';
import axios from 'axios';

const STATUS_CONFIG = {
  active: { color: 'success', icon: <CheckCircle fontSize="small" />, label: 'Active' },
  inactive: { color: 'default', icon: <Cancel fontSize="small" />, label: 'Inactive' },
  suspended: { color: 'warning', icon: <Block fontSize="small" />, label: 'Suspended' },
  expired: { color: 'error', icon: <Cancel fontSize="small" />, label: 'Expired' },
  pending_activation: { color: 'info', icon: <AccessTime fontSize="small" />, label: 'Pending' },
  archived: { color: 'secondary', icon: <Archive fontSize="small" />, label: 'Archived' },
};

const Companies = () => {
  const navigate = useNavigate();
  const accessToken = useSelector((s) => s.superAdminAuth?.accessToken);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, company: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, company: null, newStatus: '' });
  const [impersonateDialog, setImpersonateDialog] = useState({ open: false, company: null, loading: false });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCompanies({
        page: page + 1, limit: rowsPerPage, search, status: statusFilter,
      });
      setCompanies(result.data || []);
      setTotal(result.meta?.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally { setLoading(false); }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await deleteCompany(deleteDialog.company.id);
      setDeleteDialog({ open: false, company: null });
      fetchCompanies();
    } catch (err) {
      setError('Failed to delete company');
    } finally { setActionLoading(false); }
  };

  const handleStatusChange = async () => {
    try {
      setActionLoading(true);
      await changeCompanyStatus(statusDialog.company.id, statusDialog.newStatus);
      setStatusDialog({ open: false, company: null, newStatus: '' });
      fetchCompanies();
    } catch (err) {
      setError('Failed to change status');
    } finally { setActionLoading(false); }
  };

  const handleExport = async () => {
    try {
      const result = await exportCompanies('csv');
      const blob = new Blob([result], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'companies_export.csv'; a.click();
    } catch { setError('Export failed'); }
  };

  const handleImpersonate = async () => {
    try {
      setImpersonateDialog(prev => ({ ...prev, loading: true }));
      const tk = JSON.parse(localStorage.getItem('persist:sa_auth')).accessToken;
      const { data } = await axios.post('/api/superadmin/impersonate',
        { companyId: impersonateDialog.company.id },
        { headers: { Authorization: `Bearer ${tk}` } }
      );
      // Store impersonation token and redirect
      localStorage.setItem('impersonation_token', data.data.impersonationToken);
      setImpersonateDialog({ open: false, company: null, loading: false });
      window.open(`http://localhost:3005/hr/dashboard?token=${data.data.impersonationToken}`, '_blank');
    } catch (err) {
      setError('Impersonation failed: ' + (err.response?.data?.message || err.message));
      setImpersonateDialog(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight={700}>Companies</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>Export</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/superadmin/companies/create')}>
            Add Company
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            size="small" placeholder="Search companies..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: 280 }}
          />
          <TextField
            select size="small" label="Status" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </TextField>
          <IconButton onClick={fetchCompanies}><Refresh /></IconButton>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Employees</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Expiry</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
            ) : companies.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>No companies found</TableCell></TableRow>
            ) : (
              companies.map((c) => {
                const s = STATUS_CONFIG[c.status] || STATUS_CONFIG.inactive;
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business color="primary" fontSize="small" />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                          {c.legalName && <Typography variant="caption" color="text.secondary">{c.legalName}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell>{c.country || '-'}</TableCell>
                    <TableCell>
                      <Chip icon={s.icon} label={s.label} color={s.color} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={c.subscriptionPlan || 'starter'} size="small" variant="filled" color="primary" />
                    </TableCell>
                    <TableCell>{c.maxEmployees || 0}</TableCell>
                    <TableCell>
                      {c.subscriptionExpiryDate
                        ? new Date(c.subscriptionExpiryDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/superadmin/companies/${c.id}`)}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/superadmin/companies/${c.id}/edit`)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Login As Admin"><IconButton size="small" color="primary" onClick={() => setImpersonateDialog({ open: true, company: c, loading: false })}><Login fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, company: c })}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, company: null })}>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.company?.name}"? This will soft-delete the company.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, company: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={actionLoading}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Impersonation Dialog */}
      <Dialog open={impersonateDialog.open} onClose={() => setImpersonateDialog({ open: false, company: null, loading: false })}>
        <DialogTitle>Login as Company Admin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will be logged in as the Company Admin for <strong>{impersonateDialog.company?.name}</strong>.
            This action will be recorded in the audit logs.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpersonateDialog({ open: false, company: null, loading: false })}>Cancel</Button>
          <Button onClick={handleImpersonate} color="primary" variant="contained" disabled={impersonateDialog.loading}>
            {impersonateDialog.loading ? <CircularProgress size={20} /> : 'Login As Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;
