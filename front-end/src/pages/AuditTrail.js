import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, TextField, MenuItem,
  Button, Grid, Collapse, Tooltip, TablePagination,
} from '@mui/material';
import {
  FilterList, Clear, Visibility, OpenInNew,
} from '@mui/icons-material';
import { fetchAuditLogs, clearError } from '../store/slices/auditSlice';
import dayjs from 'dayjs';

const actionColors = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  VIEW: 'default',
  LOGIN: 'primary',
  LOGIN_FAILED: 'error',
  LOGOUT: 'warning',
  PASSWORD_CHANGED: 'warning',
  COMPANY_SWITCHED: 'secondary',
  SUBMIT: 'info',
  APPROVE: 'success',
  REJECT: 'error',
  POST: 'success',
  CANCEL: 'warning',
  VOID: 'error',
};

const actionOptions = [
  'CREATE', 'UPDATE', 'DELETE', 'VIEW',
  'SUBMIT', 'APPROVE', 'REJECT', 'POST', 'UNPOST',
  'CANCEL', 'VOID', 'PAY', 'RECEIVE', 'TRANSFER',
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
  'PASSWORD_CHANGED', 'COMPANY_SWITCHED',
  'USER_CREATED', 'ROLE_CHANGED', 'PERMISSION_CHANGED',
  'MODULE_ENABLED', 'MODULE_DISABLED', 'SUBSCRIPTION_CHANGED', 'SETTINGS_CHANGED',
];

const AuditTrail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, page, limit, loading } = useSelector((state) => state.auditLogs);

  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', action: '', module: '',
    entity: '', search: '', userId: '',
  });
  const [showFilters, setShowFilters] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFilter = () => {
    const params = { page: 1, limit: 20 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    dispatch(fetchAuditLogs(params));
    setHasSearched(true);
  };

  const handleClear = () => {
    setFilters({ dateFrom: '', dateTo: '', action: '', module: '', entity: '', search: '', userId: '' });
    setHasSearched(false);
  };

  const handlePageChange = (_, newPage) => {
    const params = { page: newPage + 1, limit };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    dispatch(fetchAuditLogs(params));
  };

  const handleRowsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    const params = { page: 1, limit: newLimit };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    dispatch(fetchAuditLogs(params));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Audit & History</Typography>
          <Typography variant="body2" color="text.secondary">
            Track all system activities and changes
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={showFilters ? <Clear /> : <FilterList />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Date From" type="date" size="small"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Date To" type="date" size="small"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth select label="Action" size="small" value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
                <MenuItem value="">All</MenuItem>
                {actionOptions.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Module" size="small" value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                placeholder="e.g. Sales" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Entity" size="small" value={filters.entity}
                onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                placeholder="e.g. Customer" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Search" size="small" value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="User, desc, ref..." />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="medium" onClick={handleFilter} sx={{ fontWeight: 600 }}>
                  Apply Filters
                </Button>
                <Button variant="text" size="small" onClick={handleClear}>Clear</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!hasSearched ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Apply Filters to View Audit Logs
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Set your search criteria above and click <strong>Apply Filters</strong>
                  </Typography>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No audit records match your filters.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => (
                <TableRow key={log.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/app/audit/${log.id}`)}>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {dayjs(log.createdAt).format('DD/MM/YYYY hh:mm A')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {log.username || 'System'}
                    </Typography>
                    {log.userEmail && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {log.userEmail}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small"
                      color={actionColors[log.action] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{log.module || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{log.entity}</Typography>
                      {log.entityReferenceNumber && (
                        <Typography variant="caption" color="text.secondary">
                          #{log.entityReferenceNumber}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{
                      maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {log.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {log.ipAddress || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/app/audit/${log.id}`); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </TableContainer>
    </Box>
  );
};

export default AuditTrail;
