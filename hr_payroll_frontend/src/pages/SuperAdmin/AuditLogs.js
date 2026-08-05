import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TablePagination,
  TextField, MenuItem, Stack,
} from '@mui/material';
import axios from 'axios';

const API_BASE = '/api/superadmin';

const getToken = () => { try { return JSON.parse(localStorage.getItem('persist:sa_auth')).accessToken; } catch { return null; } };

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const fetch = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/audit-logs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { page: page + 1, limit: rowsPerPage, action: actionFilter || undefined },
      });
      setLogs(data.data || []);
      setTotal(data.meta?.pagination?.total || 0);
    } catch (e) { setError('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page, rowsPerPage, actionFilter]);

  const actionColor = (action) => {
    if (action?.includes('CREATE')) return 'success';
    if (action?.includes('UPDATE')) return 'info';
    if (action?.includes('DELETE')) return 'error';
    if (action?.includes('LOGIN')) return 'primary';
    if (action?.includes('SUSPEND')) return 'warning';
    return 'default';
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Audit Logs</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField select size="small" label="Action" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">All</MenuItem>
            {['LOGIN','LOGOUT','CREATE_COMPANY','UPDATE_COMPANY','DELETE_COMPANY','COMPANY_ACTIVE','COMPANY_SUSPENDED','MODULE_ENABLED','MODULE_DISABLED','PASSWORD_CHANGED'].map(a => (
              <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>IP</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>No audit logs found</TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id} hover>
                <TableCell><Chip label={log.action?.replace(/_/g, ' ')} size="small" color={actionColor(log.action)} /></TableCell>
                <TableCell>{log.description || '-'}</TableCell>
                <TableCell>{log.superAdmin?.username || 'System'}</TableCell>
                <TableCell><Typography variant="caption">{log.ipAddress || '-'}</Typography></TableCell>
                <TableCell><Typography variant="caption">{new Date(log.createdAt).toLocaleString()}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
    </Box>
  );
};

export default AuditLogs;
