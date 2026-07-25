import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, CircularProgress, Tooltip, Grid, InputAdornment,
  TablePagination, Tabs, Tab, Card, CardContent, Divider,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, Visibility, ArrowBack,
  People, Email, Phone, LocationOn, Business, Clear,
} from '@mui/icons-material';
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
  toggleCustomerStatus, clearCustomerError, clearSelectedCustomer,
} from '../store/slices/customerSlice';

const INITIAL_FORM = {
  code: '',
  name: '',
  legalName: '',
  group: 'retail',
  type: 'company',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  taxNumber: '',
  vatNumber: '',
  registrationNumber: '',
  currency: 'AED',
  paymentTerms: 'net30',
  creditLimit: 0,
  creditDays: 30,
  arAccountId: '',
  billingAddress: '',
  shippingAddress: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
  status: 'active',
  isActive: true,
};

const CUSTOMER_GROUPS = [
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'government', label: 'Government' },
];

const CUSTOMER_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
];

const PAYMENT_TERMS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'net15', label: 'Net 15 Days' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net45', label: 'Net 45 Days' },
  { value: 'net60', label: 'Net 60 Days' },
];

const CURRENCIES = [
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'QAR', label: 'QAR - Qatari Riyal' },
  { value: 'OMR', label: 'OMR - Omani Rial' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
];

const Customers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const {
    customers,
    selectedCustomer,
    loading,
    error,
    saving,
    pagination,
  } = useSelector((state) => state.customers);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isDetail = location.pathname.includes('/detail') || location.pathname.includes('/view');

  const loadData = useCallback(() => {
    dispatch(fetchCustomers({
      search,
      page: page + 1,
      limit: rowsPerPage,
    }));
  }, [dispatch, search, page, rowsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if ((isEditing || isNew) && id) {
      const customer = customers.find((c) => c.id === id);
      if (customer) {
        setForm({
          code: customer.code || '',
          name: customer.name || '',
          legalName: customer.legalName || '',
          group: customer.group || 'retail',
          type: customer.type || 'company',
          email: customer.email || '',
          phone: customer.phone || '',
          mobile: customer.mobile || '',
          website: customer.website || '',
          taxNumber: customer.taxNumber || '',
          vatNumber: customer.vatNumber || '',
          registrationNumber: customer.registrationNumber || '',
          currency: customer.currency || 'AED',
          paymentTerms: customer.paymentTerms || 'net30',
          creditLimit: customer.creditLimit || 0,
          creditDays: customer.creditDays || 30,
          arAccountId: customer.arAccountId || '',
          billingAddress: customer.billingAddress || '',
          shippingAddress: customer.shippingAddress || '',
          city: customer.city || '',
          state: customer.state || '',
          country: customer.country || '',
          postalCode: customer.postalCode || '',
          contactPerson: customer.contactPerson || '',
          contactEmail: customer.contactEmail || '',
          contactPhone: customer.contactPhone || '',
          notes: customer.notes || '',
          status: customer.status || 'active',
          isActive: customer.isActive !== false,
        });
        setDialogOpen(true);
      }
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, customers]);

  useEffect(() => {
    if (isDetail && id) {
      dispatch(fetchCustomer(id));
      setDetailOpen(true);
    }
  }, [isDetail, id, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearCustomerError());
      dispatch(clearSelectedCustomer());
    };
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.code.trim()) errors.code = 'Customer code is required';
    if (form.code.trim().length > 50) errors.code = 'Code max 50 characters';
    if (!form.name.trim()) errors.name = 'Customer name is required';
    if (form.name.trim().length > 200) errors.name = 'Name max 200 characters';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email format';
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errors.contactEmail = 'Invalid contact email format';
    }
    if (form.creditLimit && (isNaN(form.creditLimit) || Number(form.creditLimit) < 0)) {
      errors.creditLimit = 'Must be a positive number';
    }
    if (form.creditDays && (isNaN(form.creditDays) || Number(form.creditDays) < 0)) {
      errors.creditDays = 'Must be a positive number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isEditing && id) {
      const result = await dispatch(updateCustomer({ id, data: form }));
      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
      }
    } else {
      const result = await dispatch(createCustomer(form));
      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await dispatch(deleteCustomer(deleteConfirm));
    if (result.meta.requestStatus === 'fulfilled') {
      setDeleteConfirm(null);
      loadData();
    }
  };

  const handleToggleStatus = async (customerId) => {
    await dispatch(toggleCustomerStatus(customerId));
  };

  const handleClose = () => {
    setDialogOpen(false);
    setDetailOpen(false);
    setForm(INITIAL_FORM);
    setFormErrors({});
    setDeleteConfirm(null);
    if (isEditing || isNew || isDetail) {
      navigate('/app/sales/customers');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPage(0);
      loadData();
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Customers</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer accounts, contacts, and billing information
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/app/sales/customers/new')}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearCustomerError())}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by code, name, email, phone, TRN/VAT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearch(''); setPage(0); }}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={form.status || 'all'}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Customers Table */}
      <Paper sx={{ width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Group</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact Person</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Credit Limit</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No customers found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {customer.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {customer.name}
                          </Typography>
                          {customer.vatNumber && (
                            <Typography variant="caption" color="text.secondary">
                              TRN: {customer.vatNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.group}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{customer.contactPerson || '-'}</TableCell>
                        <TableCell>{customer.phone || customer.mobile || '-'}</TableCell>
                        <TableCell>
                          {customer.email ? (
                            <Typography variant="body2" color="primary">
                              {customer.email}
                            </Typography>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {customer.creditLimit ? (
                            <Typography variant="body2" fontWeight={600}>
                              {Number(customer.creditLimit).toLocaleString()} {customer.currency}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No limit</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.status}
                            size="small"
                            color={getStatusColor(customer.status)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/app/sales/customers/${customer.id}/view`)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/app/sales/customers/${customer.id}/edit`)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirm(customer.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={pagination.total || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEditing ? 'Edit Customer' : 'New Customer'}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <ArrowBack />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Basic Info" />
            <Tab label="Contact" />
            <Tab label="Address" />
            <Tab label="Financial" />
          </Tabs>

          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Customer Code *"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  error={!!formErrors.code}
                  helperText={formErrors.code}
                  size="small"
                  disabled={isEditing}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Customer Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Legal Name"
                  value={form.legalName}
                  onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Group"
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  size="small"
                >
                  {CUSTOMER_GROUPS.map((g) => (
                    <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  size="small"
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Registration No."
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  size="small"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  size="small"
                  placeholder="https://"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}

          {tabValue === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  error={!!formErrors.contactEmail}
                  helperText={formErrors.contactEmail}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          )}

          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Billing Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line"
                  value={form.billingAddress}
                  onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                  size="small"
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State / Province"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                  Shipping Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Shipping Address"
                  value={form.shippingAddress}
                  onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}

          {tabValue === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Currency"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  size="small"
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Payment Terms"
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  size="small"
                >
                  {PAYMENT_TERMS.map((pt) => (
                    <MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Credit Days"
                  type="number"
                  value={form.creditDays}
                  onChange={(e) => setForm({ ...form, creditDays: e.target.value })}
                  error={!!formErrors.creditDays}
                  helperText={formErrors.creditDays}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Credit Limit"
                  type="number"
                  value={form.creditLimit}
                  onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                  error={!!formErrors.creditLimit}
                  helperText={formErrors.creditLimit}
                  size="small"
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="VAT / TRN Number"
                  value={form.vatNumber}
                  onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax Number"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : (isEditing ? <Edit /> : <Add />)}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this customer? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog
        open={detailOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Customer Details
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <ArrowBack />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {selectedCustomer ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {selectedCustomer.code} - {selectedCustomer.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Group</Typography>
                        <Typography variant="body2"><Chip label={selectedCustomer.group} size="small" /></Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Typography variant="body2">
                          <Chip label={selectedCustomer.status} size="small" color={getStatusColor(selectedCustomer.status)} />
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Currency</Typography>
                        <Typography variant="body2">{selectedCustomer.currency}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                        <Typography variant="body2">{selectedCustomer.paymentTerms}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {selectedCustomer.email && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Contact Info</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="body2">{selectedCustomer.email}</Typography>
                      </Box>
                      {selectedCustomer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2">{selectedCustomer.phone}</Typography>
                        </Box>
                      )}
                      {selectedCustomer.mobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2">{selectedCustomer.mobile}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {selectedCustomer.vatNumber && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Tax Info</Typography>
                      <Typography variant="body2">TRN/VAT: {selectedCustomer.vatNumber}</Typography>
                      {selectedCustomer.taxNumber && (
                        <Typography variant="body2">Tax Number: {selectedCustomer.taxNumber}</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {(selectedCustomer.billingAddress || selectedCustomer.city) && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Address</Typography>
                      {selectedCustomer.billingAddress && (
                        <Typography variant="body2">{selectedCustomer.billingAddress}</Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.country, selectedCustomer.postalCode]
                          .filter(Boolean).join(', ') || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose}>Close</Button>
          {selectedCustomer && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                handleClose();
                navigate(`/app/sales/customers/${selectedCustomer.id}/edit`);
              }}
            >
              Edit Customer
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;