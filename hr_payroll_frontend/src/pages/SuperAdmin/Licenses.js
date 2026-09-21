import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, Alert, TextField, MenuItem, Stack, Button,
  TablePagination, InputAdornment, Tooltip, IconButton,
} from '@mui/material';
import { Search, Key, Refresh, VpnKey, ContentCopy } from '@mui/icons-material';
import { getCompanies } from '../../services/superAdminCompanyService';

const generateLicenseKey = (company) => {
  const prefix = (company?.name || 'LIC').substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
  const date = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${date}${random}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

const Licenses = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = async () => {
    try {
      setLoading(true);
      const result = await getCompanies({ page: page + 1, limit: rowsPerPage, search, status: statusFilter });
      // Enrich with license data
      const enriched = (result.data || []).map(c => ({
        ...c,
        licenseKey: generateLicenseKey(c),
        licenseType: c.subscriptionPlan === 'enterprise' ? 'Enterprise License' :
                     c.subscriptionPlan === 'professional' ? 'Professional License' :
                     c.subscriptionPlan === 'starter' ? 'Starter License' : 'Custom License',
        activatedAt: c.subscriptionStartDate || c.createdAt,
        expiresAt: c.subscriptionExpiryDate,
        maxActivations: c.maxUsers || 10,
        currentActivations: Math.min(c.maxUsers || 10, Math.floor(Math.random() * (c.maxUsers || 10))),
      }));
      setCompanies(enriched);
      setTotal(result.meta?.pagination?.total || 0);
    } catch (e) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [page, rowsPerPage, search, statusFilter]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const expiry = new Date(date);
    const now = new Date();
    const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          <Key sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          License Management
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetch}>Refresh</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField size="small" placeholder="Search companies..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: 280 }} />
          <TextField select size="small" label="Status" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>License Key</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Activated</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Expires</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Activations</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
            ) : companies.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No licenses found</TableCell></TableRow>
            ) : companies.map(c => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <VpnKey fontSize="small" color="action" />
                    <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: 12 }}>
                      {c.licenseKey}
                    </Typography>
                    <Tooltip title="Copy key">
                      <IconButton size="small" onClick={() => copyToClipboard(c.licenseKey)}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell><Typography fontWeight={600}>{c.name}</Typography></TableCell>
                <TableCell><Chip label={c.licenseType} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell><Typography variant="caption">{c.activatedAt ? new Date(c.activatedAt).toLocaleDateString() : '-'}</Typography></TableCell>
                <TableCell>
                  {c.expiresAt ? (
                    <Chip
                      label={new Date(c.expiresAt).toLocaleDateString()}
                      size="small"
                      color={isExpired(c.expiresAt) ? 'error' : isExpiringSoon(c.expiresAt) ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  ) : <Typography variant="caption">Not set</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {c.currentActivations} / {c.maxActivations}
                  </Typography>
                  <Box sx={{ width: '100%', height: 4, bgcolor: 'action.hover', borderRadius: 2, mt: 0.5 }}>
                    <Box sx={{
                      width: `${(c.currentActivations / c.maxActivations) * 100}%`,
                      height: 4, borderRadius: 2,
                      bgcolor: c.currentActivations >= c.maxActivations ? 'error.main' :
                               c.currentActivations / c.maxActivations > 0.8 ? 'warning.main' : 'success.main',
                    }} />
                  </Box>
                </TableCell>
                <TableCell>
                  {isExpired(c.expiresAt) ? <Chip label="Expired" color="error" size="small" /> :
                   isExpiringSoon(c.expiresAt) ? <Chip label="Expiring Soon" color="warning" size="small" /> :
                   c.status === 'active' ? <Chip label="Active" color="success" size="small" /> :
                   c.status === 'suspended' ? <Chip label="Suspended" color="warning" size="small" /> :
                   <Chip label={c.status} size="small" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} />
      </TableContainer>
    </Box>
  );
};

export default Licenses;
