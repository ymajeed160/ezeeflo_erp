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
  ArrowBack, Payment as PaymentIcon, PostAdd, Undo,
} from '@mui/icons-material';
import {
  fetchPaymentVouchers, createPaymentVoucher, updatePaymentVoucher,
  postPaymentVoucher, reversePaymentVoucher, deletePaymentVoucher,
  fetchInvoicesForVoucherAllocation, clearError, clearSelected,
} from '../store/slices/paymentVoucherSlice';
import { fetchActiveBankAccounts } from '../store/slices/bankAccountSlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { fetchAccounts } from '../store/slices/accountSlice';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'];
const PAYMENT_PURPOSES = ['Supplier Payment', 'Direct Expense', 'Advance Payment', 'Other'];

const getStatusColor = (s) => { switch (s) { case 'Posted': return 'success'; case 'Draft': return 'warning'; case 'Reversed': return 'error'; default: return 'default'; } };

const INITIAL_FORM = {
  voucherDate: new Date().toISOString().split('T')[0],
  supplierId: '', bankAccountId: '', paymentMethod: 'Bank Transfer',
  referenceNumber: '', amount: '', currencyCode: 'USD',
  paidTo: '', paymentPurpose: 'Supplier Payment', notes: '',
};

const PaymentVouchers = () => {
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
  const [viewVoucher, setViewVoucher] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [expenseLines, setExpenseLines] = useState([]);
  const [filters, setFilters] = useState({ supplierId: '', bankAccountId: '', status: '', paymentPurpose: '', startDate: '', endDate: '' });

  const { vouchers, selectedVoucher, invoicesForAllocation, loading, error } = useSelector((s) => s.paymentVouchers);
  const { activeBankAccounts } = useSelector((s) => s.bankAccounts);
  const { suppliers } = useSelector((s) => s.suppliers);
  const { items: accounts } = useSelector((s) => s.accounts);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isView = location.pathname.includes('/view');

  const loadData = useCallback(() => {
    const params = { search };
    if (filters.supplierId) params.supplierId = filters.supplierId;
    if (filters.bankAccountId) params.bankAccountId = filters.bankAccountId;
    if (filters.status) params.status = filters.status;
    if (filters.paymentPurpose) params.paymentPurpose = filters.paymentPurpose;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    dispatch(fetchPaymentVouchers(params));
  }, [dispatch, search, filters]);

  useEffect(() => { dispatch(fetchActiveBankAccounts()); dispatch(fetchSuppliers({ limit: 999 })); dispatch(fetchAccounts({ limit: 999 })); }, [dispatch]);
  useEffect(() => { loadData(); }, [loadData]);

  // Load invoices when supplier changes
  useEffect(() => {
    if (form.supplierId && (isNew || isEditing) && form.paymentPurpose === 'Supplier Payment') {
      dispatch(fetchInvoicesForVoucherAllocation({ supplierId: form.supplierId, excludeVoucherId: isEditing ? id : undefined }));
    }
  }, [form.supplierId, form.paymentPurpose, isNew, isEditing, id, dispatch]);

  useEffect(() => {
    if (isEditing && id) {
      const v = vouchers.find((v) => v.id === id);
      if (v) {
        setForm({ voucherDate: v.voucherDate || '', supplierId: v.supplierId || '', bankAccountId: v.bankAccountId || '', paymentMethod: v.paymentMethod || 'Bank Transfer', referenceNumber: v.referenceNumber || '', amount: v.amount || '', currencyCode: v.currencyCode || 'USD', paidTo: v.paidTo || '', paymentPurpose: v.paymentPurpose || 'Supplier Payment', notes: v.notes || '' });
        setAllocations(v.allocations?.map((a) => ({ purchaseInvoiceId: a.purchaseInvoiceId, allocatedAmount: a.allocatedAmount, invoiceNumber: a.invoice?.invoiceNumber || '' })) || []);
        setExpenseLines(v.lines?.map((l) => ({ accountId: l.accountId, description: l.description || '', amount: l.amount, taxPercentage: l.taxPercentage || 0, taxAccountId: l.taxAccountId || '' })) || []);
        setDialogOpen(true);
      }
    } else if (isNew) { setForm(INITIAL_FORM); setAllocations([]); setExpenseLines([]); setDialogOpen(true); }
  }, [isEditing, isNew, id, vouchers]);

  useEffect(() => { if (isView && id && selectedVoucher) { setViewVoucher(selectedVoucher); setViewDialogOpen(true); } }, [isView, id, selectedVoucher]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.voucherDate) errors.voucherDate = 'Voucher date is required';
    if (!form.bankAccountId) errors.bankAccountId = 'Bank account is required';
    if (!form.amount || parseFloat(form.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    if (form.paymentPurpose === 'Direct Expense' && expenseLines.length === 0) errors.expenseLines = 'At least one expense line is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = { ...form, amount: parseFloat(form.amount), allocations: allocations.filter((a) => a.purchaseInvoiceId && parseFloat(a.allocatedAmount) > 0), lines: expenseLines.filter((l) => l.accountId && parseFloat(l.amount) > 0) };
    if (isEditing && id) { await dispatch(updatePaymentVoucher({ id, data })); } else { await dispatch(createPaymentVoucher(data)); }
    setDialogOpen(false); navigate('/app/banks/vouchers');
  };

  const handlePost = async (vid) => { await dispatch(postPaymentVoucher(vid)); };
  const handleReverse = async (vid) => { await dispatch(reversePaymentVoucher(vid)); };
  const handleDelete = async () => { if (deleteConfirm) { await dispatch(deletePaymentVoucher(deleteConfirm)); setDeleteConfirm(null); } };
  const handleCloseDialog = () => { setDialogOpen(false); setFormErrors({}); navigate('/app/banks/vouchers'); };
  const handleCloseView = () => { setViewDialogOpen(false); setViewVoucher(null); navigate('/app/banks/vouchers'); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    // Clear allocations when switching purpose
    if (name === 'paymentPurpose' && value !== 'Supplier Payment') setAllocations([]);
    if (name === 'paymentPurpose' && value !== 'Direct Expense') setExpenseLines([]);
  };

  const handleFilterChange = (e) => { const { name, value } = e.target; setFilters((prev) => ({ ...prev, [name]: value })); };

  const addAllocation = () => setAllocations([...allocations, { purchaseInvoiceId: '', allocatedAmount: '', invoiceNumber: '' }]);
  const removeAllocation = (idx) => setAllocations(allocations.filter((_, i) => i !== idx));
  const handleAllocChange = (idx, field, value) => { const u = [...allocations]; u[idx] = { ...u[idx], [field]: value }; setAllocations(u); };

  const addExpenseLine = () => setExpenseLines([...expenseLines, { accountId: '', description: '', amount: '', taxPercentage: 0, taxAccountId: '' }]);
  const removeExpenseLine = (idx) => setExpenseLines(expenseLines.filter((_, i) => i !== idx));
  const handleExpenseChange = (idx, field, value) => { const u = [...expenseLines]; u[idx] = { ...u[idx], [field]: value }; setExpenseLines(u); };

  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
  const totalExpenseLines = expenseLines.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  const remainingAmount = Math.max(parseFloat(form.amount || 0) - totalAllocated, 0);

  const formatAmount = (a) => parseFloat(a || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" sx={{ fontSize: 32 }} />
          <Box><Typography variant="h5" fontWeight={700}>Payment Vouchers</Typography><Typography variant="body2" color="text.secondary">Pay suppliers and record expenses</Typography></Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/banks/vouchers/new')}>New Voucher</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} /></Grid>
          <Grid item xs={12} sm={6} md={2}><FormControl fullWidth size="small"><InputLabel>Supplier</InputLabel><Select name="supplierId" value={filters.supplierId} onChange={handleFilterChange} label="Supplier"><MenuItem value="">All</MenuItem>{suppliers?.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={1.5}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select name="status" value={filters.status} onChange={handleFilterChange} label="Status"><MenuItem value="">All</MenuItem><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Posted">Posted</MenuItem><MenuItem value="Reversed">Reversed</MenuItem></Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={1.5}><FormControl fullWidth size="small"><InputLabel>Purpose</InputLabel><Select name="paymentPurpose" value={filters.paymentPurpose} onChange={handleFilterChange} label="Purpose"><MenuItem value="">All</MenuItem>{PAYMENT_PURPOSES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={1}><TextField fullWidth size="small" label="From" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={3} md={1}><TextField fullWidth size="small" label="To" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} md={1}><Button variant="outlined" startIcon={<Search />} onClick={loadData} fullWidth size="small">Search</Button></Grid>
        </Grid>
      </Paper>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Voucher #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Paid To</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              : vouchers.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No vouchers found.</Typography></TableCell></TableRow>
              : vouchers.map((v) => (
                <TableRow key={v.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setViewVoucher(v); setViewDialogOpen(true); }}>
                  <TableCell><Typography variant="body2" fontWeight={600}>{v.voucherNumber}</Typography></TableCell>
                  <TableCell>{v.voucherDate}</TableCell>
                  <TableCell>{v.supplier?.name || v.paidTo || '-'}</TableCell>
                  <TableCell><Chip size="small" label={v.paymentPurpose} variant="outlined" /></TableCell>
                  <TableCell><Chip size="small" label={v.paymentMethod} variant="outlined" /></TableCell>
                  <TableCell align="right">{formatAmount(v.amount)}</TableCell>
                  <TableCell><Chip size="small" label={v.status} color={getStatusColor(v.status)} /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {v.status === 'Draft' && (
                        <><Tooltip title="Edit"><IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/app/banks/vouchers/${v.id}/edit`); }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Post"><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handlePost(v.id); }}><PostAdd fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v.id); }}><Delete fontSize="small" /></IconButton></Tooltip></>
                      )}
                      {v.status === 'Posted' && <Tooltip title="Reverse"><IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); handleReverse(v.id); }}><Undo fontSize="small" /></IconButton></Tooltip>}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ArrowBack onClick={handleCloseDialog} sx={{ cursor: 'pointer', color: 'text.secondary' }} /><PaymentIcon color="primary" />{isEditing ? 'Edit Voucher' : 'New Payment Voucher'}</Box></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Voucher Date *" type="date" name="voucherDate" value={form.voucherDate} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!formErrors.voucherDate} helperText={formErrors.voucherDate} /></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Bank Account *</InputLabel><Select name="bankAccountId" value={form.bankAccountId} onChange={handleChange} label="Bank Account *">{activeBankAccounts.map((ba) => <MenuItem key={ba.id} value={ba.id}>{ba.accountName} ({ba.accountNumber || ba.accountCode})</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Payment Purpose</InputLabel><Select name="paymentPurpose" value={form.paymentPurpose} onChange={handleChange} label="Payment Purpose">{PAYMENT_PURPOSES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Payment Method</InputLabel><Select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} label="Payment Method">{PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Supplier</InputLabel><Select name="supplierId" value={form.supplierId} onChange={handleChange} label="Supplier"><MenuItem value="">-- None --</MenuItem>{suppliers?.map((s) => <MenuItem key={s.id} value={s.id}>{s.code} - {s.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Paid To" name="paidTo" value={form.paidTo} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Amount *" type="number" name="amount" value={form.amount} onChange={handleChange} error={!!formErrors.amount} helperText={formErrors.amount} InputProps={{ inputProps: { min: 0.01, step: 0.01 } }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Reference Number" name="referenceNumber" value={form.referenceNumber} onChange={handleChange} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" name="notes" value={form.notes} onChange={handleChange} multiline rows={2} /></Grid>

            {/* Invoice Allocations - only for Supplier Payment */}
            {form.paymentPurpose === 'Supplier Payment' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Invoice Allocations</Typography>
                <Typography variant="caption" color="text.secondary">Remaining: {formatAmount(remainingAmount)} | Allocated: {formatAmount(totalAllocated)}</Typography>
                {!form.supplierId && <Alert severity="info" sx={{ mt: 1 }}>Select a supplier to view outstanding invoices.</Alert>}
                <TableContainer sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Allocation</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell></TableRow></TableHead>
                    <TableBody>
                      {allocations.map((alloc, idx) => {
                        const inv = invoicesForAllocation?.find((i) => i.id === alloc.purchaseInvoiceId);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select value={alloc.purchaseInvoiceId} onChange={(e) => handleAllocChange(idx, 'purchaseInvoiceId', e.target.value)} displayEmpty>
                                  <MenuItem value="">-- Select --</MenuItem>
                                  {invoicesForAllocation?.filter((i) => i.id === alloc.purchaseInvoiceId || !allocations.some((a) => a.purchaseInvoiceId === i.id)).map((i) => (
                                    <MenuItem key={i.id} value={i.id}>{i.invoiceNumber} - {formatAmount(i.grandTotal)}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="right">{inv ? formatAmount(inv.outstandingBalance) : '-'}</TableCell>
                            <TableCell align="right">
                              <TextField size="small" type="number" value={alloc.allocatedAmount} onChange={(e) => handleAllocChange(idx, 'allocatedAmount', e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: 0.01 } }} sx={{ width: 150 }}
                                error={parseFloat(alloc.allocatedAmount || 0) > (inv?.outstandingBalance || 0)}
                                helperText={parseFloat(alloc.allocatedAmount || 0) > (inv?.outstandingBalance || 0) ? 'Exceeds balance' : ''} />
                            </TableCell>
                            <TableCell align="center"><Button size="small" color="error" onClick={() => removeAllocation(idx)}>Remove</Button></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button size="small" onClick={addAllocation} sx={{ mt: 1 }} disabled={!form.supplierId}>+ Add Allocation</Button>
              </Grid>
            )}

            {/* Expense Lines - only for Direct Expense */}
            {form.paymentPurpose === 'Direct Expense' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Expense Distribution</Typography>
                <Typography variant="caption" color="text.secondary">Total: {formatAmount(totalExpenseLines)} | Voucher Amount: {formatAmount(form.amount)}</Typography>
                {formErrors.expenseLines && <Typography variant="caption" color="error">{formErrors.expenseLines}</Typography>}
                <TableContainer sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Account</TableCell><TableCell sx={{ fontWeight: 600 }}>Description</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Tax %</TableCell><TableCell sx={{ fontWeight: 600 }}>Tax Account</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell></TableRow></TableHead>
                    <TableBody>
                      {expenseLines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select value={line.accountId} onChange={(e) => handleExpenseChange(idx, 'accountId', e.target.value)} displayEmpty>
                                <MenuItem value="">-- Select --</MenuItem>
                                {accounts?.filter((a) => a.type === 'expense').map((a) => <MenuItem key={a.id} value={a.id}>{a.code} - {a.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell><TextField size="small" value={line.description} onChange={(e) => handleExpenseChange(idx, 'description', e.target.value)} /></TableCell>
                          <TableCell align="right"><TextField size="small" type="number" value={line.amount} onChange={(e) => handleExpenseChange(idx, 'amount', e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.01 } }} sx={{ width: 120 }} /></TableCell>
                          <TableCell align="right"><TextField size="small" type="number" value={line.taxPercentage} onChange={(e) => handleExpenseChange(idx, 'taxPercentage', e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.01 } }} sx={{ width: 80 }} /></TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select value={line.taxAccountId} onChange={(e) => handleExpenseChange(idx, 'taxAccountId', e.target.value)} displayEmpty>
                                <MenuItem value="">-- None --</MenuItem>
                                {accounts?.filter((a) => a.type === 'liability' || a.type === 'expense').map((a) => <MenuItem key={a.id} value={a.id}>{a.code} - {a.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="center"><Button size="small" color="error" onClick={() => removeExpenseLine(idx)}>Remove</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button size="small" onClick={addExpenseLine} sx={{ mt: 1 }}>+ Add Expense Line</Button>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>{loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}{isEditing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ArrowBack onClick={handleCloseView} sx={{ cursor: 'pointer', color: 'text.secondary' }} /><PaymentIcon color="primary" /> Voucher Details</Box></DialogTitle>
        <DialogContent dividers>
          {viewVoucher && <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Voucher Number</Typography><Typography variant="body1" fontWeight={600}>{viewVoucher.voucherNumber}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Status</Typography><Box><Chip size="small" label={viewVoucher.status} color={getStatusColor(viewVoucher.status)} /></Box></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{viewVoucher.voucherDate}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body1" fontWeight={600}>{formatAmount(viewVoucher.amount)} {viewVoucher.currencyCode}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Paid To</Typography><Typography variant="body1">{viewVoucher.supplier?.name || viewVoucher.paidTo || '-'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Purpose</Typography><Chip size="small" label={viewVoucher.paymentPurpose} /></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Payment Method</Typography><Typography variant="body1">{viewVoucher.paymentMethod}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Reference</Typography><Typography variant="body1">{viewVoucher.referenceNumber || '-'}</Typography></Grid>
            {viewVoucher.allocations?.length > 0 && <Grid item xs={12}><Typography variant="subtitle2">Allocations</Typography><Table size="small"><TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Allocated</TableCell></TableRow></TableHead><TableBody>{viewVoucher.allocations.map((a) => <TableRow key={a.id}><TableCell>{a.invoice?.invoiceNumber || a.purchaseInvoiceId}</TableCell><TableCell align="right">{formatAmount(a.allocatedAmount)}</TableCell></TableRow>)}</TableBody></Table></Grid>}
            {viewVoucher.lines?.length > 0 && <Grid item xs={12}><Typography variant="subtitle2">Expense Lines</Typography><Table size="small"><TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Account</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell></TableRow></TableHead><TableBody>{viewVoucher.lines.map((l) => <TableRow key={l.id}><TableCell>{l.account?.name || l.accountId}</TableCell><TableCell align="right">{formatAmount(l.amount)}</TableCell></TableRow>)}</TableBody></Table></Grid>}
          </Grid>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {viewVoucher?.status === 'Draft' && <Button variant="outlined" startIcon={<Edit />} onClick={() => { handleCloseView(); if (viewVoucher) navigate(`/app/banks/vouchers/${viewVoucher.id}/edit`); }}>Edit</Button>}
          <Button onClick={handleCloseView} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure? This action cannot be undone.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setDeleteConfirm(null)} color="inherit">Cancel</Button><Button onClick={handleDelete} color="error" variant="contained">Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentVouchers;
