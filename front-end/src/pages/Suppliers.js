import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, CircularProgress, Tooltip, Grid, InputAdornment,
  TablePagination, Card, CardContent, Divider,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, Visibility,
  Email, Phone, LocationOn, Business, Clear, ArrowBack,
} from '@mui/icons-material';
import {
  fetchSuppliers, fetchSupplier, createSupplier, updateSupplier, deleteSupplier,
  toggleSupplierStatus, clearSupplierError, clearSelectedSupplier,
} from '../store/slices/supplierSlice';
import { fetchAccountSelect } from '../store/slices/accountSlice';

const INITIAL_FORM = {
  code: '',
  name: '',
  contactPerson: '',
  phone: '',
  mobile: '',
  email: '',
  vatNumber: '',
  address: '',
  paymentTerms: 'net30',
  creditLimit: 0,
  apAccountId: '',
  status: 'active',
};

const PAYMENT_TERMS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'net15', label: 'Net 15 Days' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net45', label: 'Net 45 Days' },
  { value: 'net60', label: 'Net 60 Days' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
];

const Suppliers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const {
    suppliers, selectedSupplier, pagination, loading, error, saving, deleting,
  } = useSelector((state) => state.suppliers);
  const { accountSelect } = useSelector((state) => state.accounts);

  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Load data
  const loadData = useCallback(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      search: searchText || undefined,
      sortBy: 'name',
      sortOrder: 'ASC',
    };
    dispatch(fetchSuppliers(params));
  }, [dispatch, page, rowsPerPage, searchText]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    dispatch(fetchAccountSelect(''));
  }, [dispatch]);

  // View mode from route
  useEffect(() => {
    if (id && location.pathname.includes('/suppliers/') && !location.pathname.includes('/edit')) {
      dispatch(fetchSupplier(id));
      setViewDialog(true);
    }
  }, [id, location.pathname, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearSupplierError());
      dispatch(clearSelectedSupplier());
    };
  }, [dispatch]);

  // Handlers
  const handleSearch = () => {
    setPage(0);
    loadData();
  };

  const handleRefresh = () => {
    setSearchText('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.code.trim()) errors.code = 'Supplier code is required';
    if (form.code.trim().length > 50) errors.code = 'Code max 50 characters';
    if (!form.name.trim()) errors.name = 'Supplier name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email format';
    }
    if (form.creditLimit && form.creditLimit < 0) {
      errors.creditLimit = 'Credit limit cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setForm(INITIAL_FORM);
    setFormErrors({});
    setIsEditing(false);
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (supplier) => {
    setForm({
      code: supplier.code || '',
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      mobile: supplier.mobile || '',
      email: supplier.email || '',
      vatNumber: supplier.vatNumber || '',
      address: supplier.address || '',
      paymentTerms: supplier.paymentTerms || 'net30',
      creditLimit: supplier.creditLimit ?? 0,
      apAccountId: supplier.apAccountId || '',
      status: supplier.status || 'active',
    });
    setFormErrors({});
    setIsEditing(true);
    setEditingId(supplier.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setForm(INITIAL_FORM);
    setFormErrors({});
    setEditingId(null);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    dispatch(clearSelectedSupplier());
    if (location.pathname.includes('/suppliers/')) {
      navigate('/app/purchases/suppliers');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const payload = {
      ...form,
      creditLimit: parseFloat(form.creditLimit) || 0,
    };

    if (isEditing) {
      const result = await dispatch(updateSupplier({ id: editingId, data: payload }));
      if (updateSupplier.fulfilled.match(result)) {
        handleCloseDialog();
      }
    } else {
      const result = await dispatch(createSupplier(payload));
      if (createSupplier.fulfilled.match(result)) {
        handleCloseDialog();
      }
    }
  };

  const handleDeleteClick = (supplier) => {
    setDeleteTarget(supplier);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      const result = await dispatch(deleteSupplier(deleteTarget.id));
      if (deleteSupplier.fulfilled.match(result)) {
        setDeleteDialog(false);
        setDeleteTarget(null);
      }
    }
  };

  const handleToggleStatus = async (supplier) => {
    await dispatch(toggleSupplierStatus(supplier.id));
  };

  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      blocked: 'error',
    };
    return <Chip label={status || 'active'} color={colors[status] || 'default'} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Suppliers
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          New Supplier
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearSupplierError())}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search suppliers..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchText && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchText(''); setPage(0); }}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="outlined" startIcon={<Search />} onClick={handleSearch} fullWidth>
                Search
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="text" startIcon={<Refresh />} onClick={handleRefresh} fullWidth>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Contact Person</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>VAT/TRN</strong></TableCell>
                <TableCell><strong>Payment Terms</strong></TableCell>
                <TableCell><strong>Credit Limit</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography color="textSecondary" py={3}>
                      No suppliers found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>{supplier.code}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{supplier.name}</Typography>
                    </TableCell>
                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                    <TableCell>{supplier.phone || supplier.mobile || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.vatNumber || '-'}</TableCell>
                    <TableCell>{supplier.paymentTerms || '-'}</TableCell>
                    <TableCell>
                      {supplier.creditLimit ? parseFloat(supplier.creditLimit).toLocaleString('en-AE', { style: 'currency', currency: 'AED' }) : '-'}
                    </TableCell>
                    <TableCell>{getStatusChip(supplier.status)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/app/purchases/suppliers/${supplier.id}/view`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(supplier)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(supplier)}>
                          <Delete fontSize="small" />
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
            count={pagination.total || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </TableContainer>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Supplier' : 'New Supplier'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Code *"
                value={form.code}
                onChange={handleInputChange('code')}
                error={!!formErrors.code}
                helperText={formErrors.code}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name *"
                value={form.name}
                onChange={handleInputChange('name')}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={form.contactPerson}
                onChange={handleInputChange('contactPerson')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={handleInputChange('phone')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mobile"
                value={form.mobile}
                onChange={handleInputChange('mobile')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={handleInputChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VAT / TRN Number"
                value={form.vatNumber}
                onChange={handleInputChange('vatNumber')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={form.address}
                onChange={handleInputChange('address')}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Payment Terms"
                value={form.paymentTerms}
                onChange={handleInputChange('paymentTerms')}
              >
                {PAYMENT_TERMS.map((pt) => (
                  <MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={form.creditLimit}
                onChange={handleInputChange('creditLimit')}
                error={!!formErrors.creditLimit}
                helperText={formErrors.creditLimit}
                InputProps={{
                  startAdornment: <InputAdornment position="start">AED</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={form.status}
                onChange={handleInputChange('status')}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Accounts Payable Account"
                value={form.apAccountId}
                onChange={handleInputChange('apAccountId')}
              >
                <MenuItem value=""><em>Select Account</em></MenuItem>
                {accountSelect.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : null}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Supplier Details
          {selectedSupplier && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => {
                handleOpenEdit(selectedSupplier);
                setViewDialog(false);
                dispatch(clearSelectedSupplier());
              }}
              sx={{ ml: 2 }}
            >
              Edit
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedSupplier ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Supplier Code</Typography>
                <Typography variant="body1" fontWeight="medium">{selectedSupplier.code}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Name</Typography>
                <Typography variant="body1" fontWeight="medium">{selectedSupplier.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Contact Person</Typography>
                <Typography variant="body1">{selectedSupplier.contactPerson || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box>{getStatusChip(selectedSupplier.status)}</Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Phone</Typography>
                <Typography variant="body1">{selectedSupplier.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Mobile</Typography>
                <Typography variant="body1">{selectedSupplier.mobile || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Email</Typography>
                <Typography variant="body1">{selectedSupplier.email || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">VAT / TRN Number</Typography>
                <Typography variant="body1">{selectedSupplier.vatNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Address</Typography>
                <Typography variant="body1">{selectedSupplier.address || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">Payment Terms</Typography>
                <Typography variant="body1">{selectedSupplier.paymentTerms || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">Credit Limit</Typography>
                <Typography variant="body1">
                  {selectedSupplier.creditLimit
                    ? parseFloat(selectedSupplier.creditLimit).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })
                    : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary">AP Account</Typography>
                <Typography variant="body1">
                  {selectedSupplier.apAccount
                    ? `${selectedSupplier.apAccount.code} - ${selectedSupplier.apAccount.name}`
                    : '-'}
                </Typography>
              </Grid>
              {selectedSupplier.creator && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Created By</Typography>
                  <Typography variant="body1">{selectedSupplier.creator.username || '-'}</Typography>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Created At</Typography>
                <Typography variant="body1">
                  {selectedSupplier.createdAt ? new Date(selectedSupplier.createdAt).toLocaleString() : '-'}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete supplier "{deleteTarget?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;