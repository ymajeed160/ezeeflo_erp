import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Menu, MenuItem,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Grid, Card, CardContent, InputAdornment, Select, FormControl,
  Autocomplete, Tooltip,
} from '@mui/material';
import {
  Add, MoreVert, Search, Edit, Delete, Visibility,
  CallMerge, FilterList, Download, PersonAdd, Group,
} from '@mui/icons-material';
import customerApi from '../services/customerApi';
import { showSuccess, showError } from '../utils/toast';

const statusColors = { active: 'success', inactive: 'error' };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [segment, setSegment] = useState('');
  const [segments, setSegments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [mergeDialog, setMergeDialog] = useState({ open: false, primary: null });
  const [mergeTarget, setMergeTarget] = useState('');
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await customerApi.getAll({ page: page + 1, limit: 20, search, segment });
      setCustomers(data.data || []);
      setTotalPages(data.meta?.pagination?.totalPages || 1);
      setTotalCount(data.meta?.pagination?.total || 0);
    } catch (err) {
      showError('Failed to load customers');
    } finally { setLoading(false); }
  }, [page, search, segment]);

  const fetchSegments = useCallback(async () => {
    try {
      const { data } = await customerApi.getSegments();
      setSegments(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCustomers(); fetchSegments(); }, [fetchCustomers, fetchSegments]);

  const handleDelete = async () => {
    try {
      await customerApi.delete(selectedCustomer.id);
      showSuccess('Customer deleted');
      setDeleteDialog(false);
      fetchCustomers();
    } catch (err) { showError(err.response?.data?.message || 'Delete failed'); }
  };

  const handleMerge = async () => {
    try {
      await customerApi.merge({ primaryId: mergeDialog.primary.id, secondaryId: mergeTarget });
      showSuccess('Customers merged successfully');
      setMergeDialog({ open: false, primary: null });
      setMergeTarget('');
      fetchCustomers();
    } catch (err) { showError(err.response?.data?.message || 'Merge failed'); }
  };

  const getMembershipChip = (customer) => {
    const tier = customer.loyaltyAccount?.membership;
    if (!tier) return null;
    return (
      <Chip
        label={tier.name}
        size="small"
        sx={{ bgcolor: tier.color || '#6B7280', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Customers</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount} total customers | {totalCount > 0 ? Math.round(customers.filter(c => c.isActive).length / Math.max(customers.length, 1) * 100) : 0}% active
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />}>Export</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/customers/new')}>Add Customer</Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ py: '12px !important', px: 2 }}>
            <Typography variant="h6" fontWeight={700}>{totalCount}</Typography>
            <Typography variant="caption" color="text.secondary">Total Customers</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ py: '12px !important', px: 2 }}>
            <Typography variant="h6" fontWeight={700}>{segments.length}</Typography>
            <Typography variant="caption" color="text.secondary">Segments</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ py: '12px !important', px: 2 }}>
            <Typography variant="h6" fontWeight={700}>{customers.filter(c => c.loyaltyAccount?.membership).length}</Typography>
            <Typography variant="caption" color="text.secondary">With Membership</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ py: '12px !important', px: 2 }}>
            <Typography variant="h6" fontWeight={700}>{(customers.reduce((sum, c) => sum + (parseFloat(c.lifetimeValue) || 0), 0)).toLocaleString()}</Typography>
            <Typography variant="caption" color="text.secondary">Lifetime Value (AED)</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search customers..." size="small"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={segment} onChange={(e) => { setSegment(e.target.value); setPage(0); }} displayEmpty>
            <MenuItem value="">All Segments</MenuItem>
            {segments.map(s => <MenuItem key={s.name} value={s.name}>{s.name} ({s.count})</MenuItem>)}
          </Select>
        </FormControl>
        <Button startIcon={<FilterList />} onClick={fetchCustomers} variant="outlined" size="small" sx={{ height: 40 }}>Refresh</Button>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Segment</TableCell>
                <TableCell>Membership</TableCell>
                <TableCell>Points</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14 }}>
                        {customer.firstName?.[0]}{customer.lastName?.[0] || ''}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{customer.firstName} {customer.lastName || ''}</Typography>
                        <Typography variant="caption" color="text.secondary">{customer.code}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{customer.phone}</Typography>
                    <Typography variant="caption" color="text.secondary">{customer.email || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    {customer.segment ? <Chip label={customer.segment} size="small" variant="outlined" /> : '-'}
                  </TableCell>
                  <TableCell>{getMembershipChip(customer)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {customer.loyaltyAccount?.availablePoints?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">available</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={customer.isActive ? 'Active' : 'Inactive'} color={statusColors[customer.isActive ? 'active' : 'inactive']} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/customers/${customer.id}`)}><Visibility fontSize="small" /></IconButton></Tooltip>
                    <IconButton size="small" onClick={(e) => { setSelectedCustomer(customer); setAnchorEl(e.currentTarget); }}><MoreVert /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <PersonAdd sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No customers found</Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => navigate('/customers/new')}>Add First Customer</Button>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <Typography sx={{ py: 1 }}>Page {page + 1} of {totalPages}</Typography>
          <Button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        </Box>
      )}

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { navigate(`/customers/${selectedCustomer?.id}`); setAnchorEl(null); }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View Detail
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/customers/${selectedCustomer?.id}/edit`); setAnchorEl(null); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setMergeDialog({ open: true, primary: selectedCustomer }); setAnchorEl(null); }}>
          <CallMerge fontSize="small" sx={{ mr: 1 }} /> Merge
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedCustomer?.firstName} {selectedCustomer?.lastName}"? This will also deactivate their loyalty account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialog.open} onClose={() => setMergeDialog({ open: false, primary: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Merge Customers</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            All data from the secondary customer will be merged into <strong>{mergeDialog.primary?.firstName} {mergeDialog.primary?.lastName}</strong> ({mergeDialog.primary?.code}).
            The secondary customer will be deactivated.
          </DialogContentText>
          <Autocomplete
            options={customers.filter(c => c.id !== mergeDialog.primary?.id)}
            getOptionLabel={(c) => `${c.firstName} ${c.lastName || ''} (${c.code})`}
            value={customers.find(c => c.id === mergeTarget) || null}
            onChange={(_, val) => setMergeTarget(val?.id || '')}
            renderInput={(params) => <TextField {...params} label="Select secondary customer to merge" size="small" />}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialog({ open: false, primary: null })}>Cancel</Button>
          <Button onClick={handleMerge} variant="contained" color="warning" disabled={!mergeTarget}>Merge</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
