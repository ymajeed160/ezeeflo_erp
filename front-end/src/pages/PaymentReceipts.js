import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh,
  ArrowBack, Receipt as ReceiptIcon, PostAdd, Undo,
} from '@mui/icons-material';
import {
  fetchPaymentReceipts, createPaymentReceipt, updatePaymentReceipt,
  postPaymentReceipt, reversePaymentReceipt, deletePaymentReceipt,
  fetchInvoicesForReceiptAllocation, clearError, clearSelected,
} from '../store/slices/paymentReceiptSlice';
import { fetchActiveBankAccounts } from '../store/slices/bankAccountSlice';
import { fetchCustomers } from '../store/slices/customerSlice';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'];

const getStatusColor = (status) => {
  switch (status) {
    case 'Posted': return 'success';
    case 'Draft': return 'warning';
    case 'Reversed': return 'error';
    case 'Cancelled': return 'default';
    default: return 'default';
  }
};

const INITIAL_FORM = {
  receiptDate: new Date().toISOString().split('T')[0],
  customerId: '',
  bankAccountId: '',
  paymentMethod: 'Bank Transfer',
  referenceNumber: '',
  amount: '',
  currencyCode: 'USD',
  receivedFrom: '',
  depositReference: '',
  notes: '',
};

const PaymentReceipts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [filters, setFilters] = useState({ customerId: '', bankAccountId: '', status: '', startDate: '', endDate: '' });

  const { receipts, selectedReceipt, invoicesForAllocation, loading, error } = useSelector((s) => s.paymentReceipts);
  const { activeBankAccounts } = useSelector((s) => s.bankAccounts);
  const { customers } = useSelector((s) => s.customers);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isView = location.pathname.includes('/view');

  const loadData = useCallback(() => {
    const params = { search };
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.bankAccountId) params.bankAccountId = filters.bankAccountId;
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    dispatch(fetchPaymentReceipts(params));
  }, [dispatch, search, filters]);

  useEffect(() => {
    dispatch(fetchActiveBankAccounts());
    dispatch(fetchCustomers({ limit: 999 }));
  }, [dispatch]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load invoices when customer changes in form
  useEffect(() => {
    if (form.customerId && (isNew || isEditing)) {
      dispatch(fetchInvoicesForReceiptAllocation({ customerId: form.customerId, excludeReceiptId: isEditing ? id : undefined }));
    }
  }, [form.customerId, isNew, isEditing, id, dispatch]);

  useEffect(() => {
    if (isEditing && id) {
      const r = receipts.find((r) => r.id === id);
      if (r) {
        setForm({
          receiptDate: r.receiptDate || '',
          customerId: r.customerId || '',
          bankAccountId: r.bankAccountId || '',
          paymentMethod: r.paymentMethod || 'Bank Transfer',
          referenceNumber: r.referenceNumber || '',
          amount: r.amount || '',
          currencyCode: r.currencyCode || 'USD',
          receivedFrom: r.receivedFrom || '',
          depositReference: r.depositReference || '',
          notes: r.notes || '',
        });
        setAllocations(r.allocations?.map((a) => ({ salesInvoiceId: a.salesInvoiceId, allocatedAmount: a.allocatedAmount, invoiceNumber: a.invoice?.invoiceNumber || '' })) || []);
        setDialogOpen(true);
      }
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setAllocations([]);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, receipts]);

  useEffect(() => {
    if (isView && id && selectedReceipt) {
      setViewReceipt(selectedReceipt);
      setViewDialogOpen(true);
    }
  }, [isView, id, selectedReceipt]);

  useEffect(() => {
    return () => { dispatch(clearError()); dispatch(clearSelected()); };
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.receiptDate) errors.receiptDate = 'Receipt date is required';
    if (!form.bankAccountId) errors.bankAccountId = 'Bank account is required';
    if (!form.amount || parseFloat(form.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = {
      ...form,
      amount: parseFloat(form.amount),
      allocations: allocations.filter((a) => a.salesInvoiceId && parseFloat(a.allocatedAmount) > 0),
    };
    if (isEditing && id) {
      await dispatch(updatePaymentReceipt({ id, data }));
    } else {
      await dispatch(createPaymentReceipt(data));
    }
    setDialogOpen(false);
    navigate('/app/banks/receipts');
  };

  const handlePost = async (receiptId) => { await dispatch(postPaymentReceipt(receiptId)); };
  const handleReverse = async (receiptId) => { await dispatch(reversePaymentReceipt(receiptId)); };

  const handleDelete = async () => {
    if (deleteConfirm) { await dispatch(deletePaymentReceipt(deleteConfirm)); setDeleteConfirm(null); }
  };

  const handleCloseDialog = () => { setDialogOpen(false); setFormErrors({}); navigate('/app/banks/receipts'); };
  const handleCloseViewDialog = () => { setViewDialogOpen(false); setViewReceipt(null); navigate('/app/banks/receipts'); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAllocationChange = (index, field, value) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const addAllocation = () => {
    setAllocations([...allocations, { salesInvoiceId: '', allocatedAmount: '', invoiceNumber: '' }]);
  };

  const removeAllocation = (index) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
  const remainingAmount = Math.max(parseFloat(form.amount || 0) - totalAllocated, 0);

  // Available invoices (not yet allocated in this form)
  const availableInvoices = invoicesForAllocation?.filter((inv) => {
    return !allocations.some((a) => a.salesInvoiceId === inv.id);
  }) || [];

  const formatAmount = (amt) => parseFloat(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Payment Receipts</Typography>
            <Typography variant="body2" color="text.secondary">Receive money from customers</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/banks/receipts/new')}>New Receipt</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small"><InputLabel>Customer</InputLabel><Select name="customerId" value={filters.customerId} onChange={handleFilterChange} label="Customer"><MenuItem value="">All</MenuItem>{customers?.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select name="status" value={filters.status} onChange={handleFilterChange} label="Status"><MenuItem value="">All</MenuItem><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Posted">Posted</MenuItem><MenuItem value="Reversed">Reversed</MenuItem></Select></FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField fullWidth size="small" label="From" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField fullWidth size="small" label="To" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3} md={1}>
            <Button variant="outlined" startIcon={<Search />} onClick={loadData} fullWidth size="small">Search</Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Receipt #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bank Account</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : receipts.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No receipts found. Click "New Receipt" to create one.</Typography></TableCell></TableRow>
              ) : (
                receipts.map((r) => (
                  <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setViewReceipt(r); setViewDialogOpen(true); }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{r.receiptNumber}</Typography></TableCell>
                    <TableCell>{r.receiptDate}</TableCell>
                    <TableCell>{r.customer?.name || r.receivedFrom || '-'}</TableCell>
                    <TableCell>{r.bankAccount?.accountName || '-'}</TableCell>
                    <TableCell><Chip size="small" label={r.paymentMethod} variant="outlined" /></TableCell>
                    <TableCell align="right">{formatAmount(r.amount)}</TableCell>
                    <TableCell><Chip size="small" label={r.status} color={getStatusColor(r.status)} /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {r.status === 'Draft' && (
                          <>
                            <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/app/banks/receipts/${r.id}/edit`); }}><Edit fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Post"><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handlePost(r.id); }}><PostAdd fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                        {r.status === 'Posted' && (
                          <Tooltip title="Reverse"><IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); handleReverse(r.id); }}><Undo fontSize="small" /></IconButton></Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArrowBack onClick={handleCloseDialog} sx={{ cursor: 'pointer', color: 'text.secondary' }} />
            <ReceiptIcon color="primary" />
            {isEditing ? 'Edit Receipt' : 'New Payment Receipt'}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Receipt Date *" type="date" name="receiptDate" value={form.receiptDate} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!formErrors.receiptDate} helperText={formErrors.receiptDate} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Bank Account *</InputLabel>
                <Select name="bankAccountId" value={form.bankAccountId} onChange={handleChange} label="Bank Account *" error={!!formErrors.bankAccountId}>
                  {activeBankAccounts.map((ba) => <MenuItem key={ba.id} value={ba.id}>{ba.accountName} ({ba.accountNumber || ba.accountCode})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Customer</InputLabel>
                <Select name="customerId" value={form.customerId} onChange={handleChange} label="Customer">
                  <MenuItem value="">-- None (Walk-in) --</MenuItem>
                  {customers?.map((c) => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Payment Method</InputLabel>
                <Select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} label="Payment Method">
                  {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Amount *" type="number" name="amount" value={form.amount} onChange={handleChange} error={!!formErrors.amount} helperText={formErrors.amount} InputProps={{ inputProps: { min: 0.01, step: 0.01 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Reference Number" name="referenceNumber" value={form.referenceNumber} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Received From" name="receivedFrom" value={form.receivedFrom} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Deposit Reference" name="depositReference" value={form.depositReference} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" name="notes" value={form.notes} onChange={handleChange} multiline rows={2} />
            </Grid>

            {/* Invoice Allocations */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Invoice Allocations</Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining to allocate: {formatAmount(remainingAmount)} &nbsp;|&nbsp; Total allocated: {formatAmount(totalAllocated)}
              </Typography>
              {invoicesForAllocation.length === 0 && form.customerId && (
                <Alert severity="info" sx={{ mt: 1 }}>No outstanding invoices found for this customer.</Alert>
              )}
              {!form.customerId && (
                <Alert severity="info" sx={{ mt: 1 }}>Select a customer to view outstanding invoices for allocation.</Alert>
              )}
              <TableContainer sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Allocation</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allocations.map((alloc, idx) => {
                      const inv = invoicesForAllocation?.find((i) => i.id === alloc.salesInvoiceId);
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={alloc.salesInvoiceId}
                                onChange={(e) => handleAllocationChange(idx, 'salesInvoiceId', e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value="">-- Select --</MenuItem>
                                {invoicesForAllocation?.filter((i) => i.id === alloc.salesInvoiceId || !allocations.some((a) => a.salesInvoiceId === i.id)).map((i) => (
                                  <MenuItem key={i.id} value={i.id}>{i.invoiceNumber} - {formatAmount(i.grandTotal)}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right">{inv ? formatAmount(inv.outstandingBalance) : '-'}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={alloc.allocatedAmount}
                              onChange={(e) => handleAllocationChange(idx, 'allocatedAmount', e.target.value)}
                              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                              sx={{ width: 150 }}
                              error={parseFloat(alloc.allocatedAmount || 0) > (inv?.outstandingBalance || 0)}
                              helperText={parseFloat(alloc.allocatedAmount || 0) > (inv?.outstandingBalance || 0) ? 'Exceeds balance' : ''}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button size="small" color="error" onClick={() => removeAllocation(idx)}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button size="small" onClick={addAllocation} sx={{ mt: 1 }} disabled={!form.customerId}>+ Add Invoice Allocation</Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArrowBack onClick={handleCloseViewDialog} sx={{ cursor: 'pointer', color: 'text.secondary' }} />
            <ReceiptIcon color="primary" /> Receipt Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewReceipt && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Receipt Number</Typography>
                <Typography variant="body1" fontWeight={600}>{viewReceipt.receiptNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box><Chip size="small" label={viewReceipt.status} color={getStatusColor(viewReceipt.status)} /></Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body1">{viewReceipt.receiptDate}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight={600}>{formatAmount(viewReceipt.amount)} {viewReceipt.currencyCode}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body1">{viewReceipt.customer?.name || viewReceipt.receivedFrom || 'Walk-in'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Bank Account</Typography>
                <Typography variant="body1">{viewReceipt.bankAccount?.accountName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                <Typography variant="body1">{viewReceipt.paymentMethod}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Reference</Typography>
                <Typography variant="body1">{viewReceipt.referenceNumber || '-'}</Typography>
              </Grid>
              {viewReceipt.allocations?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Allocations</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Allocated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewReceipt.allocations.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.invoice?.invoiceNumber || a.salesInvoiceId}</TableCell>
                          <TableCell align="right">{formatAmount(a.allocatedAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {viewReceipt?.status === 'Draft' && (
            <Button variant="outlined" startIcon={<Edit />} onClick={() => { handleCloseViewDialog(); if (viewReceipt) navigate(`/banks/receipts/${viewReceipt.id}/edit`); }}>Edit</Button>
          )}
          <Button onClick={handleCloseViewDialog} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure? This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentReceipts;
