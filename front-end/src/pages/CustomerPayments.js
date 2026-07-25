import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as PostIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchCustomerPayments,
  fetchCustomerPayment,
  createCustomerPayment,
  updateCustomerPayment,
  deleteCustomerPayment,
  postCustomerPayment,
  cancelCustomerPayment,
  clearSelected,
} from '../store/slices/customerPaymentSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';
import accountApi from '../services/accountApi';
import CustomerPaymentApi from '../services/customerPaymentApi';
import SalesInvoiceApi from '../services/salesInvoiceApi';

const statusColors = {
  draft: 'default',
  posted: 'success',
  cancelled: 'error',
};

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
];

const CustomerPayments = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, selected, loading, error, count, page, limit, totalPages } = useSelector((s) => s.customerPayments);
  const customersList = useSelector((s) => s.customers?.customers || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [arAccounts, setArAccounts] = useState([]);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postTarget, setPostTarget] = useState(null);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'bank_transfer',
      reference: '',
      bankAccountId: '',
      paymentAccountId: '',
      customerAccountId: '',
      notes: '',
      allocations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'allocations' });
  const selectedCustomerId = formCustomerId;
  const paymentAmount = watch('amount');
  const allocatedAmount = watch('allocations')?.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0) || 0;
  const unallocated = (parseFloat(paymentAmount) || 0) - allocatedAmount;

  const loadData = useCallback(() => {
    dispatch(fetchCustomerPayments({ search, status: statusFilter, customerId: customerFilter, page, limit }));
  }, [dispatch, search, statusFilter, customerFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomers({ limit: 999 }));
  }, [loadData, dispatch]);

  // Fetch accounts for CoA selectors
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const [bankRes, arRes] = await Promise.all([
          accountApi.getByType('asset'),
          accountApi.getByType('asset'),
        ]);
        // Filter bank/cash accounts (from asset accounts)
        setBankAccounts(bankRes?.data || bankRes || []);
        setArAccounts(arRes?.data || arRes || []);
      } catch (e) {
        // Silently fail
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchCustomerPayment(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selected && openForm && editId) {
      reset({
        customerId: selected.customerId || '',
        paymentDate: selected.paymentDate?.split('T')[0] || '',
        amount: selected.amount || 0,
        paymentMethod: selected.paymentMethod || 'bank_transfer',
        reference: selected.reference || '',
        bankAccountId: selected.bankAccountId || '',
        paymentAccountId: selected.paymentAccountId || '',
        customerAccountId: selected.customerAccountId || '',
        notes: selected.notes || '',
        allocations: selected.allocations?.length ? selected.allocations.map((a) => ({
          invoiceId: a.salesInvoiceId || a.invoiceId || '',
          allocatedAmount: a.allocatedAmount || 0,
        })) : [],
      });
      setFormCustomerId(selected.customerId || '');
    }
  }, [selected, openForm, editId, reset]);

  // Fetch posted invoices for the selected customer (with outstanding balance > 0)
  // When editing, pass paymentId so existing allocated invoices aren't filtered out
  useEffect(() => {
    if (selectedCustomerId) {
      SalesInvoiceApi.listForAllocation(selectedCustomerId, editId)
        .then((res) => {
          setFilteredInvoices(res?.data || []);
        })
        .catch(() => {
          setFilteredInvoices([]);
        });
    } else {
      setFilteredInvoices([]);
    }
  }, [selectedCustomerId, editId]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    setFormCustomerId('');
    dispatch(clearSelected());
    reset({
      customerId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'bank_transfer',
      reference: '',
      bankAccountId: '',
      paymentAccountId: '',
      customerAccountId: '',
      notes: '',
      allocations: [],
    });
    setOpenForm(true);
  };

  const handleEdit = (cp) => {
    if (cp.status !== 'draft') {
      apiError('Only draft payments can be edited');
      return;
    }
    setViewMode(false);
    setEditId(cp.id);
    dispatch(fetchCustomerPayment(cp.id));
    setOpenForm(true);
  };

  const handleView = (cp) => {
    setViewMode(true);
    setEditId(cp.id);
    dispatch(fetchCustomerPayment(cp.id));
    setOpenForm(true);
  };

  const handleDelete = async (cp) => {
    if (cp.status !== 'draft') {
      apiError('Only draft payments can be deleted');
      return;
    }
    const confirmed = await confirmDialog('Are you sure you want to delete this payment?');
    if (confirmed) {
      dispatch(deleteCustomerPayment(cp.id)).then(() => loadData());
    }
  };

  const handlePost = async (cp) => {
    setPostTarget(cp);
    setOpenPostDialog(true);
  };

  const handlePostSubmit = async () => {
    if (!postTarget) return;
    const paymentAccountId = watch('paymentAccountId');
    const customerAccountId = watch('customerAccountId');
    const payload = { paymentAccountId, customerAccountId };
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
    try {
      const response = await CustomerPaymentApi.post(postTarget.id, payload);
      if (response) {
        apiSuccess('Payment posted successfully - Journal entry created');
        setOpenPostDialog(false);
        setPostTarget(null);
        loadData();
      }
    } catch (error) {
      apiError(error.response?.data?.message || error.message || 'Failed to post payment');
    }
  };

  const handleClosePost = () => {
    setOpenPostDialog(false);
    setPostTarget(null);
  };

  const handleCancel = async (cp) => {
    const confirmed = await confirmDialog(
      `Cancel Payment #${cp.paymentNumber}? This will mark the payment as cancelled.`
    );
    if (confirmed) {
      dispatch(cancelCustomerPayment(cp.id)).then((res) => {
        if (res.payload) loadData();
      });
    }
  };

  const onSubmit = async (data) => {
    const totalAllocated = (data.allocations || []).reduce(
      (sum, a) => sum + (parseFloat(a.allocatedAmount) || 0),
      0
    );
    const paymentAmt = parseFloat(data.amount) || 0;

    // Validate allocations don't exceed payment amount
    if (totalAllocated > paymentAmt) {
      apiError('Total allocated amount cannot exceed the payment amount');
      return;
    }

    // Validate each allocation doesn't exceed invoice outstanding balance
    for (const a of data.allocations || []) {
      const invoice = filteredInvoices.find((inv) => String(inv.id) === String(a.invoiceId));
      if (invoice && (parseFloat(a.allocatedAmount) || 0) > parseFloat(invoice.outstandingBalance || 0)) {
        apiError(`Allocation for invoice ${invoice.invoiceNumber} exceeds the outstanding balance`);
        return;
      }
    }

    const payload = {
      ...data,
      customerId: data.customerId,
      amount: parseFloat(data.amount),
      bankAccountId: data.bankAccountId || null,
      paymentAccountId: data.paymentAccountId || null,
      customerAccountId: data.customerAccountId || null,
      allocations: data.allocations?.map((a) => ({
        salesInvoiceId: a.invoiceId || null,
        allocatedAmount: parseFloat(a.allocatedAmount) || 0,
      })) || [],
    };

    if (editId) {
      await dispatch(updateCustomerPayment({ id: editId, data: payload }));
    } else {
      await dispatch(createCustomerPayment(payload));
    }
    setOpenForm(false);
    setEditId(null);
    dispatch(clearSelected());
    loadData();
  };

  const handleClose = () => {
    setOpenForm(false);
    setEditId(null);
    setViewMode(false);
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchCustomerPayments({ search, status: statusFilter, customerId: customerFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchCustomerPayments({ search, status: statusFilter, customerId: customerFilter, page: 1, limit: parseInt(e.target.value) }));
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Customer Payments
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Payment
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="posted">Posted</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                size="small"
                options={customersList || []}
                getOptionLabel={(o) => o.name || o.companyName || ''}
                value={customersList?.find((c) => String(c.id) === customerFilter) || null}
                onChange={(e, v) => setCustomerFilter(v ? String(v.id) : '')}
                renderInput={(params) => <TextField {...params} label="Customer" />}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="outlined" onClick={loadData} startIcon={<RefreshIcon />} fullWidth>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payment #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Method</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              items?.map((cp) => (
                <TableRow key={cp.id} hover>
                  <TableCell>{cp.paymentNumber}</TableCell>
                  <TableCell>{cp.paymentDate?.split('T')[0]}</TableCell>
                  <TableCell>{cp.customerName || '-'}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{cp.paymentMethod?.replace('_', ' ')}</TableCell>
                  <TableCell align="right">{formatCurrency(cp.amount)}</TableCell>
                  <TableCell>
                    <Chip label={cp.status} color={statusColors[cp.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleView(cp)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {cp.status === 'draft' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(cp)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(cp)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Post">
                            <IconButton size="small" color="success" onClick={() => handlePost(cp)}>
                              <PostIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {cp.status === 'posted' && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="error" onClick={() => handleCancel(cp)}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={count}
          page={page - 1}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewMode ? 'View Payment' : editId ? 'Edit Payment' : 'New Payment'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              {/* Customer */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customerId"
                  control={control}
                  rules={{ required: 'Customer is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      disabled={viewMode}
                      size="small"
                      options={customersList || []}
                      getOptionLabel={(o) => o.name || o.companyName || ''}
                      value={customersList?.find((c) => String(c.id) === String(field.value)) || null}
                      onChange={(e, v) => {
                        const newId = v ? String(v.id) : '';
                        const oldId = formCustomerId;
                        field.onChange(newId);
                        setFormCustomerId(newId);
                        // Clear allocations when user changes to a different customer
                        if (newId !== oldId && fields.length > 0) {
                          remove();
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          error={!!errors.customerId}
                          helperText={errors.customerId?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Payment Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment Date"
                  type="date"
                  disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                  {...register('paymentDate', { required: 'Date is required' })}
                  error={!!errors.paymentDate}
                  helperText={errors.paymentDate?.message}
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount"
                  type="number"
                  disabled={viewMode}
                  inputProps={{ step: 0.01, min: 0 }}
                  {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be > 0' } })}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              </Grid>

              {/* Payment Method */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Method"
                  disabled={viewMode}
                  {...register('paymentMethod', { required: 'Method is required' })}
                  error={!!errors.paymentMethod}
                  helperText={errors.paymentMethod?.message}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Reference */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reference #"
                  disabled={viewMode}
                  {...register('reference')}
                />
              </Grid>

              {/* Chart of Accounts Selection */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                  General Ledger Account Mapping
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="paymentAccountId"
                  control={control}
                  rules={{ required: 'Payment account is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      disabled={viewMode}
                      size="small"
                      options={bankAccounts}
                      getOptionLabel={(o) => `${o.code || ''} - ${o.name || ''}`}
                      value={bankAccounts.find((a) => a.id === field.value) || null}
                      onChange={(e, v) => field.onChange(v ? v.id : '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Payment Account (Bank/Cash)"
                          error={!!errors.paymentAccountId}
                          helperText={errors.paymentAccountId?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customerAccountId"
                  control={control}
                  rules={{ required: 'Customer account is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      disabled={viewMode}
                      size="small"
                      options={arAccounts}
                      getOptionLabel={(o) => `${o.code || ''} - ${o.name || ''}`}
                      value={arAccounts.find((a) => a.id === field.value) || null}
                      onChange={(e, v) => field.onChange(v ? v.id : '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer Account (A/R)"
                          error={!!errors.customerAccountId}
                          helperText={errors.customerAccountId?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes"
                  multiline
                  rows={2}
                  disabled={viewMode}
                  {...register('notes')}
                />
              </Grid>

              {/* Allocations Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Invoice Allocations
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span">
                      Unallocated: {' '}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      color={unallocated < -0.01 ? 'error' : unallocated > 0.01 ? 'warning.main' : 'success.main'}
                      fontWeight={700}
                    >
                      {formatCurrency(unallocated)}
                    </Typography>
                  </Box>
                </Box>

                {!viewMode && selectedCustomerId && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => append({ invoiceId: '', allocatedAmount: 0 })}
                    sx={{ mb: 1 }}
                  >
                    Add Allocation
                  </Button>
                )}

                {fields.map((field, index) => (
                  <Grid container spacing={1} key={field.id} sx={{ mb: 1 }} alignItems="center">
                    <Grid item xs={12} sm={viewMode ? 6 : 5}>
                      <Controller
                        name={`allocations.${index}.invoiceId`}
                        control={control}
                        render={({ field: f }) => (
                          <Autocomplete
                            disabled={viewMode}
                            size="small"
                            options={filteredInvoices}
                            getOptionLabel={(o) =>
                              `${o.invoiceNumber || ''} | ${o.invoiceDate ? new Date(o.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} | Total: ${formatCurrency(o.grandTotal || 0)} | Due: ${formatCurrency(o.outstandingBalance || 0)}`
                            }
                            value={filteredInvoices.find((inv) => String(inv.id) === String(f.value)) || null}
                            onChange={(e, v) => f.onChange(v ? String(v.id) : '')}
                            renderInput={(params) => (
                              <TextField {...params} label="Invoice" />
                            )}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={viewMode ? 4 : 4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Amount"
                        type="number"
                        disabled={viewMode}
                        inputProps={{ step: 0.01, min: 0 }}
                        error={
                          parseFloat(watch(`allocations.${index}.allocatedAmount`) || 0) >
                          (filteredInvoices.find((inv) => String(inv.id) === String(watch(`allocations.${index}.invoiceId`)))
                            ?.outstandingBalance || 0)
                        }
                        helperText={
                          parseFloat(watch(`allocations.${index}.allocatedAmount`) || 0) >
                          (filteredInvoices.find((inv) => String(inv.id) === String(watch(`allocations.${index}.invoiceId`)))
                            ?.outstandingBalance || 0)
                            ? 'Exceeds outstanding balance'
                            : ''
                        }
                        {...register(`allocations.${index}.allocatedAmount`, {
                          validate: (val) => {
                            const invoice = filteredInvoices.find((inv) => String(inv.id) === String(watch(`allocations.${index}.invoiceId`)));
                            if (invoice && parseFloat(val || 0) > parseFloat(invoice.outstandingBalance || 0)) {
                              return 'Exceeds outstanding balance';
                            }
                            return true;
                          },
                        })}
                      />
                    </Grid>
                    {!viewMode && (
                      <Grid item xs={12} sm={1}>
                        <IconButton color="error" onClick={() => remove(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    )}
                    {viewMode && (
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary">
                          {filteredInvoices.find((inv) => String(inv.id) === String(field.invoiceId))?.invoiceNumber || ''}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                ))}

                {!selectedCustomerId && !viewMode && (
                  <Typography variant="body2" color="text.secondary">
                    Select a customer to allocate invoices
                  </Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            {!viewMode && (
              <Button type="submit" variant="contained" disabled={loading}>
                {editId ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Post Confirmation Dialog */}
      <Dialog open={openPostDialog} onClose={handleClosePost} maxWidth="sm" fullWidth>
        <DialogTitle>Post Payment #{postTarget?.paymentNumber || ''}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will create a journal entry. Please review the accounts below before posting.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="paymentAccountId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      value={bankAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={bankAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Payment Account (Bank/Cash)" size="small" fullWidth />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="customerAccountId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      value={arAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={arAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Customer Account (A/R)" size="small" fullWidth />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePost}>Cancel</Button>
          <Button onClick={handlePostSubmit} variant="contained" color="primary">
            Post Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerPayments;