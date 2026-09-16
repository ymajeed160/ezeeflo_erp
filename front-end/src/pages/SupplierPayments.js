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
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as ApproveIcon,
  HowToReg as ConfirmIcon,
  Send as PostIcon,
  Undo as ReverseIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchSupplierPayments,
  fetchSupplierPaymentById,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
  cancelSupplierPayment,
  confirmSupplierPayment,
  postToJournalSupplierPayment,
  reverseSupplierPayment,
  clearCurrent,
} from '../store/slices/supplierPaymentSlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { fetchPurchaseInvoices } from '../store/slices/purchaseInvoiceSlice';
import { fetchActiveBankAccounts } from '../store/slices/bankAccountSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';
import accountApi from '../services/accountApi';
import supplierPaymentApi from '../services/supplierPaymentApi';

const statusColors = {
  draft: 'default',
  confirmed: 'info',
  approved: 'success',
  posted: 'success',
  cancelled: 'error',
};

const paymentMethods = [
  { value: 'Cash', label: 'Cash' },
  { value: 'BankTransfer', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
];

const SupplierPayments = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, currentItem, loading, error, total, page, limit, currentLoading, submitting } = useSelector((s) => s.supplierPayments);
  const suppliersList = useSelector((s) => s.suppliers?.suppliers || []);
  const invoicesList = useSelector((s) => s.purchaseInvoices?.items || []);
  const bankAccountsList = useSelector((s) => s.bankAccounts?.activeBankAccounts || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [postAccounts, setPostAccounts] = useState({ apAccountId: '', cashAccountId: '' });
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [liabilityAccounts, setLiabilityAccounts] = useState([]);
  const [confirmPreviewOpen, setConfirmPreviewOpen] = useState(false);
  const [confirmPreview, setConfirmPreview] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [reasonDialog, setReasonDialog] = useState({ open: false, action: null, target: null });
  const [reasonText, setReasonText] = useState('');

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      supplierId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'BankTransfer',
      referenceNumber: '',
      bankAccount: '',
      cashAccount: '',
      notes: '',
      allocations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'allocations' });
  const selectedSupplierId = watch('supplierId');
  const paymentMethod = watch('paymentMethod');
  const paymentAmount = watch('amount');
  const allocatedAmount = watch('allocations')?.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0) || 0;
  const unallocated = (parseFloat(paymentAmount) || 0) - allocatedAmount;
  const cashAccounts = assetAccounts.filter((a) => /cash|petty/i.test(a.name || '') && !/bank/i.test(a.name || ''));

  // Auto-sum allocated invoice amounts into the payment Amount field
  useEffect(() => {
    if (fields.length > 0) {
      setValue('amount', Math.round(allocatedAmount * 100) / 100);
    }
  }, [allocatedAmount, fields.length, setValue]);

  const loadData = useCallback(() => {
    const params = { search, status: statusFilter, supplierId: supplierFilter, page, limit };
    dispatch(fetchSupplierPayments(params));
  }, [dispatch, search, statusFilter, supplierFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchSuppliers({ limit: 999 }));
    dispatch(fetchPurchaseInvoices({ limit: 999 }));
    dispatch(fetchActiveBankAccounts());
    const loadAccounts = async () => {
      try {
        const [assetRes, liabilityRes] = await Promise.all([
          accountApi.getByType('asset'),
          accountApi.getByType('liability'),
        ]);
        setAssetAccounts(assetRes.data?.data || assetRes.data || []);
        setLiabilityAccounts(liabilityRes.data?.data || liabilityRes.data || []);
      } catch (e) { /* ignore */ }
    };
    loadAccounts();
  }, [loadData, dispatch]);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchSupplierPaymentById(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (currentItem && openForm && editId) {
      reset({
        supplierId: currentItem.supplierId || '',
        paymentDate: currentItem.paymentDate?.split('T')[0] || '',
        amount: currentItem.amount || 0,
        paymentMethod: currentItem.paymentMethod || 'BankTransfer',
        referenceNumber: currentItem.referenceNumber || '',
        bankAccount: currentItem.bankAccount?.id || currentItem.bankAccountId || currentItem.bankAccount || '',
        cashAccount: currentItem.cashAccount?.id || currentItem.cashAccountId || currentItem.cashAccount || '',
        notes: currentItem.notes || '',
        allocations: currentItem.allocations?.length ? currentItem.allocations.map((a) => ({
          purchaseInvoiceId: a.purchaseInvoiceId || a.purchaseInvoice?.id || '',
          allocatedAmount: a.allocatedAmount || 0,
        })) : [],
      });
    }
  }, [currentItem, openForm, editId, reset]);

  useEffect(() => {
    if (selectedSupplierId && invoicesList?.length) {
      const supplierInvoices = invoicesList.filter(
        (inv) => String(inv.supplierId) === String(selectedSupplierId) && inv.status !== 'draft'
      );
      setFilteredInvoices(supplierInvoices);
    } else {
      setFilteredInvoices([]);
    }
  }, [selectedSupplierId, invoicesList]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    dispatch(clearCurrent());
    reset({
      supplierId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'BankTransfer',
      referenceNumber: '',
      bankAccount: '',
      cashAccount: '',
      notes: '',
      allocations: [],
    });
    setOpenForm(true);
  };

  const populateForm = (sp) => {
    reset({
      supplierId: sp.supplierId || '',
      paymentDate: sp.paymentDate?.split('T')[0] || '',
      amount: sp.amount || 0,
      paymentMethod: sp.paymentMethod || 'BankTransfer',
      referenceNumber: sp.referenceNumber || '',
      bankAccount: sp.bankAccount?.id || sp.bankAccountId || sp.bankAccount || '',
      cashAccount: sp.cashAccount?.id || sp.cashAccountId || sp.cashAccount || '',
      notes: sp.notes || '',
      allocations: sp.allocations?.length ? sp.allocations.map((a) => ({
        purchaseInvoiceId: a.purchaseInvoiceId || a.purchaseInvoice?.id || '',
        allocatedAmount: a.allocatedAmount || 0,
      })) : [],
    });
  };

  const handleEdit = (sp) => {
    if (sp.status === 'cancelled') {
      apiError('Cancelled payments cannot be edited');
      return;
    }
    setViewMode(false);
    setEditId(sp.id);
    populateForm(sp);
    dispatch(clearCurrent());
    dispatch(fetchSupplierPaymentById(sp.id));
    setOpenForm(true);
  };

  const handleView = (sp) => {
    setViewMode(true);
    setEditId(sp.id);
    populateForm(sp);
    dispatch(clearCurrent());
    dispatch(fetchSupplierPaymentById(sp.id));
    setOpenForm(true);
  };

  const handleDelete = (sp) => {
    setReasonDialog({ open: true, action: 'delete', target: sp.id, status: sp.status });
    setReasonText('');
  };

  const handleCancel = (sp) => {
    setReasonDialog({ open: true, action: 'cancel', target: sp.id });
    setReasonText('');
  };

  const handleReasonConfirm = async () => {
    const { action, target } = reasonDialog;
    setReasonDialog({ open: false, action: null, target: null });
    if (!target) return;
    if (action === 'delete') {
      await dispatch(deleteSupplierPayment({ id: target, reason: reasonText || null }));
    } else if (action === 'cancel') {
      await dispatch(cancelSupplierPayment({ id: target, reason: reasonText || null }));
    }
    setReasonText('');
    loadData();
  };

  const handleConfirm = async (sp) => {
    setConfirmingId(sp.id);
    try {
      const res = await supplierPaymentApi.getPostingPreview(sp.id);
      const preview = res.data?.data || res.data;
      setConfirmTarget(sp);
      setConfirmPreview(preview);
      setConfirmPreviewOpen(true);
    } catch (e) {
      apiError(e.response?.data?.message || 'Could not load posting preview');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleConfirmPost = async () => {
    if (!confirmTarget) return;
    const res = await dispatch(confirmSupplierPayment(confirmTarget.id));
    if (res.meta.requestStatus === 'fulfilled') {
      apiSuccess('Payment confirmed and posted');
      setConfirmPreviewOpen(false);
      setConfirmTarget(null);
      setConfirmPreview(null);
      handleClose();
      loadData();
    } else {
      apiError(res.payload || 'Payment could not be posted. No accounting changes were made.');
    }
  };

  const handleReverse = async (sp) => {
    const confirmed = await confirmDialog(`Reverse Payment #${sp.paymentNumber}? A reversal journal entry will be created.`);
    if (confirmed) {
      const res = await dispatch(reverseSupplierPayment(sp.id));
      if (res.meta.requestStatus === 'fulfilled') { apiSuccess('Payment reversed'); loadData(); }
      else { apiError(res.payload || 'Failed to reverse payment'); }
    }
  };

  const handlePostToJournal = async (sp) => {
    const result = await dispatch(fetchSupplierPaymentById(sp.id));
    const payment = result.payload;
    if (!payment) return;
    setPostTarget(payment);
    setPostAccounts({
      apAccountId: payment.supplier?.apAccountId || '',
      cashAccountId: payment.bankAccountId || '',
    });
    setPostDialogOpen(true);
  };

  const handlePost = async () => {
    if (!postTarget) return;
    const data = {};
    if (postAccounts.apAccountId) data.apAccountId = postAccounts.apAccountId;
    if (postAccounts.cashAccountId) data.cashAccountId = postAccounts.cashAccountId;

    const result = await dispatch(postToJournalSupplierPayment({ id: postTarget.id, data }));
    if (result.meta.requestStatus === 'fulfilled') {
      apiSuccess('Payment posted to journal');
      setPostDialogOpen(false);
      setPostTarget(null);
      handleClose();
      loadData();
    } else {
      apiError(result.payload || 'Failed to post payment to journal');
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      supplierId: data.supplierId,
      amount: parseFloat(data.amount),
      bankAccountId: data.bankAccount || null,
      cashAccountId: data.cashAccount || null,
      allocations: data.allocations?.map((a) => ({
        purchaseInvoiceId: a.purchaseInvoiceId || null,
        allocatedAmount: parseFloat(a.allocatedAmount) || 0,
      })) || [],
    };
    delete payload.bankAccount;
    delete payload.cashAccount;

    let result;
    if (editId) {
      result = await dispatch(updateSupplierPayment({ id: editId, data: payload }));
    } else {
      result = await dispatch(createSupplierPayment(payload));
    }

    if (result.error) {
      apiError(result.payload || 'Failed to save payment');
      return;
    }

    setOpenForm(false);
    setEditId(null);
    dispatch(clearCurrent());
    loadData();
  };

  const handleClose = () => {
    setOpenForm(false);
    setEditId(null);
    setViewMode(false);
    dispatch(clearCurrent());
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchSupplierPayments({ search, status: statusFilter, supplierId: supplierFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchSupplierPayments({ search, status: statusFilter, supplierId: supplierFilter, page: 1, limit: parseInt(e.target.value) }));
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Supplier Payments
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
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="posted">Posted</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                size="small"
                options={suppliersList || []}
                getOptionLabel={(o) => o.name || o.supplierName || ''}
                value={suppliersList?.find((c) => String(c.id) === supplierFilter) || null}
                onChange={(e, v) => setSupplierFilter(v ? String(v.id) : '')}
                renderInput={(params) => <TextField {...params} label="Supplier" />}
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
              <TableCell>Supplier</TableCell>
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
              items?.map((sp) => (
                <TableRow key={sp.id} hover>
                  <TableCell>{sp.paymentNumber}</TableCell>
                  <TableCell>{sp.paymentDate?.split('T')[0]}</TableCell>
                  <TableCell>{sp.supplier?.name || sp.supplier?.supplierName || '-'}</TableCell>
                  <TableCell>{sp.paymentMethod}</TableCell>
                  <TableCell align="right">{formatCurrency(sp.amount)}</TableCell>
                  <TableCell>
                    <Chip label={sp.status} color={statusColors[sp.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleView(sp)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {sp.status === 'draft' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(sp)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(sp)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="warning" onClick={() => handleCancel(sp)}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Confirm & Post">
                            <IconButton size="small" color="info" disabled={confirmingId === sp.id} onClick={() => handleConfirm(sp)}>
                              <ConfirmIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {sp.status === 'confirmed' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(sp)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(sp)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="warning" onClick={() => handleCancel(sp)}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Post to Journal">
                            <IconButton size="small" color="success" onClick={() => handlePostToJournal(sp)}>
                              <PostIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {sp.status === 'posted' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(sp)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(sp)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reverse">
                            <IconButton size="small" color="warning" onClick={() => handleReverse(sp)}>
                              <ReverseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {sp.status === 'cancelled' && (
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(sp)}>
                            <DeleteIcon fontSize="small" />
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
          count={total}
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
              {/* Supplier */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="supplierId"
                  control={control}
                  rules={{ required: 'Supplier is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      disabled={viewMode}
                      size="small"
                      options={suppliersList || []}
                      getOptionLabel={(o) => o.name || o.supplierName || ''}
                      value={suppliersList?.find((c) => String(c.id) === String(field.value)) || null}
                      onChange={(e, v) => field.onChange(v ? String(v.id) : '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Supplier"
                          error={!!errors.supplierId}
                          helperText={errors.supplierId?.message}
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
                <Controller
                  name="paymentMethod"
                  control={control}
                  rules={{ required: 'Method is required' }}
                  render={({ field }) => (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Payment Method"
                      disabled={viewMode}
                      {...field}
                      error={!!errors.paymentMethod}
                      helperText={errors.paymentMethod?.message}
                    >
                      {paymentMethods.map((m) => (
                        <MenuItem key={m.value} value={m.value}>
                          {m.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Reference */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reference #"
                  disabled={viewMode}
                  {...register('referenceNumber')}
                />
              </Grid>

              {/* Bank Account (shown for Bank Transfer / Cheque) */}
              {paymentMethod !== 'Cash' && (
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="bankAccount"
                    control={control}
                    rules={{ required: 'Bank Account is required' }}
                    render={({ field }) => (
                      <Autocomplete
                        disabled={viewMode}
                        size="small"
                        options={bankAccountsList || []}
                        getOptionLabel={(o) =>
                          o.bankName && o.accountName
                            ? `${o.bankName} - ${o.accountName}${o.accountNumber ? ' (' + o.accountNumber + ')' : ''}`
                            : o.accountName || o.bankName || ''
                        }
                        value={bankAccountsList?.find((b) => String(b.chartOfAccountId) === String(field.value)) || null}
                        onChange={(e, v) => field.onChange(v ? v.chartOfAccountId || v.id : '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Bank Account *"
                            error={!!errors.bankAccount}
                            helperText={errors.bankAccount?.message || 'Accounting account will be taken from the selected bank account.'}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Cash Account (shown only for Cash payments) */}
              {paymentMethod === 'Cash' && (
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="cashAccount"
                    control={control}
                    rules={{ required: 'Please select a Cash Account.' }}
                    render={({ field }) => (
                      <Autocomplete
                        disabled={viewMode}
                        size="small"
                        options={cashAccounts}
                        getOptionLabel={(o) => (o.code ? `${o.code} - ${o.name}` : o.name || '')}
                        value={cashAccounts.find((a) => String(a.id) === String(field.value)) || null}
                        onChange={(e, v) => field.onChange(v ? String(v.id) : '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Cash Account *"
                            error={!!errors.cashAccount}
                            helperText={errors.cashAccount?.message || 'Select the Cash-in-Hand account to be used for this payment.'}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
              )}

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

                {!viewMode && selectedSupplierId && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => append({ purchaseInvoiceId: '', allocatedAmount: 0 })}
                    sx={{ mb: 1 }}
                  >
                    Add Allocation
                  </Button>
                )}

                {fields.map((field, index) => (
                  <Grid container spacing={1} key={field.id} sx={{ mb: 1 }} alignItems="center">
                    <Grid item xs={12} sm={viewMode ? 10 : 5}>
                      <Controller
                        name={`allocations.${index}.purchaseInvoiceId`}
                        control={control}
                        render={({ field: f }) => (
                          <Autocomplete
                            disabled={viewMode}
                            size="small"
                            options={filteredInvoices}
                            getOptionLabel={(o) => `${o.invoiceNumber || ''} (${formatCurrency(o.totalAmount || o.total_amount || 0)} total)`}
                            value={filteredInvoices.find((inv) => String(inv.id) === String(f.value)) || null}
                            onChange={(e, v) => {
                              f.onChange(v ? String(v.id) : '');
                              setValue(`allocations.${index}.allocatedAmount`, v ? parseFloat(v.totalAmount || v.total_amount || 0) : 0);
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="Invoice" />
                            )}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={viewMode ? 2 : 4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Amount"
                        type="number"
                        disabled={viewMode}
                        inputProps={{ step: 0.01, min: 0 }}
                        {...register(`allocations.${index}.allocatedAmount`)}
                      />
                    </Grid>
                    {!viewMode && currentItem?.status !== 'approved' && (
                      <Grid item xs={12} sm={1}>
                        <IconButton color="error" onClick={() => remove(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    )}
                    {viewMode && (
                      <Grid item xs={12} sm={2} />
                    )}
                  </Grid>
                ))}

                {!viewMode && !selectedSupplierId && (
                  <Typography variant="body2" color="text.secondary">
                    Select a supplier to allocate invoices
                  </Typography>
                )}
                {!viewMode && selectedSupplierId && filteredInvoices.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No outstanding invoices found for this supplier.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            {viewMode && currentItem?.status === 'draft' && (
              <Button
                variant="contained"
                color="info"
                disabled={submitting}
                onClick={() => handleConfirm(currentItem)}
              >
                Confirm & Post
              </Button>
            )}
            {viewMode && currentItem?.status === 'confirmed' && (
              <Button
                variant="contained"
                color="success"
                disabled={submitting}
                onClick={() => handlePostToJournal(currentItem)}
              >
                Post to Journal
              </Button>
            )}
            {!viewMode && (
              <Button type="submit" variant="contained" disabled={submitting}>
                {editId ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Post to Journal Dialog (chart of accounts) */}
      <Dialog open={postDialogOpen} onClose={() => { setPostDialogOpen(false); setPostTarget(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Post Supplier Payment to Journal</DialogTitle>
        <DialogContent>
          {postTarget && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Payment: {postTarget.paymentNumber} — Amount: {formatCurrency(postTarget.amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select the Chart of Accounts for each entry line:
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">DEBIT — Accounts Payable (required)</Typography>
                  <Autocomplete
                    size="small"
                    options={liabilityAccounts}
                    getOptionLabel={(opt) => opt.code ? `${opt.code} - ${opt.name}` : opt.name || ''}
                    value={liabilityAccounts.find((a) => a.id === postAccounts.apAccountId) || null}
                    onChange={(e, v) => setPostAccounts({ ...postAccounts, apAccountId: v?.id || '' })}
                    renderInput={(params) => <TextField {...params} label="Accounts Payable Account" placeholder="Select AP account" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">CREDIT — Cash / Bank (required)</Typography>
                  <Autocomplete
                    size="small"
                    options={assetAccounts}
                    getOptionLabel={(opt) => opt.code ? `${opt.code} - ${opt.name}` : opt.name || ''}
                    value={assetAccounts.find((a) => a.id === postAccounts.cashAccountId) || null}
                    onChange={(e, v) => setPostAccounts({ ...postAccounts, cashAccountId: v?.id || '' })}
                    renderInput={(params) => <TextField {...params} label="Cash / Bank Account" placeholder="Select cash or bank account" />}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPostDialogOpen(false); setPostTarget(null); }}>Cancel</Button>
          <Button onClick={handlePost} variant="contained" color="primary" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm & Post preview dialog */}
      <Dialog open={confirmPreviewOpen} onClose={() => { setConfirmPreviewOpen(false); setConfirmTarget(null); setConfirmPreview(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm &amp; Post Supplier Payment</DialogTitle>
        <DialogContent>
          {confirmPreview && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Payment: {confirmPreview.paymentNumber} — Amount: {formatCurrency(confirmPreview.amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                This will create the following Journal Entry (posted automatically):
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Side</TableCell>
                      <TableCell>Account</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {confirmPreview.lines?.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Chip label={line.side} size="small" color={line.side === 'DEBIT' ? 'primary' : 'success'} />
                        </TableCell>
                        <TableCell>
                          {line.account?.code ? `${line.account.code} - ${line.account.name}` : line.account?.name || '-'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(line.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmPreviewOpen(false); setConfirmTarget(null); setConfirmPreview(null); }}>Cancel</Button>
          <Button onClick={handleConfirmPost} variant="contained" color="primary" disabled={submitting}>
            {submitting ? 'Posting...' : 'Confirm & Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reason Dialog for Delete/Cancel */}
      <Dialog open={reasonDialog.open} onClose={() => setReasonDialog({ open: false, action: null, target: null })} fullWidth maxWidth="sm">
        <DialogTitle>{reasonDialog.action === 'delete' ? 'Delete Supplier Payment' : 'Cancel Supplier Payment'}</DialogTitle>
        <DialogContent>
          {reasonDialog.status === 'posted' && (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              This will permanently delete the linked journal entry and change the related invoice(s) status back to &quot;posted&quot;.
            </Typography>
          )}
          {reasonDialog.status === 'cancelled' && (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              This will permanently delete the linked journal entries (original and reversal) from the journal.
            </Typography>
          )}
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Reason (optional)"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialog({ open: false, action: null, target: null })}>Back</Button>
          <Button variant="contained" color={reasonDialog.action === 'delete' ? 'error' : 'warning'} onClick={handleReasonConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierPayments;