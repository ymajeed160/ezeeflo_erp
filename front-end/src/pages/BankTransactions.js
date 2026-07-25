import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid, Switch, FormControlLabel,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh,
  ArrowBack, AccountBalance as BankIcon, PostAdd, Undo,
} from '@mui/icons-material';
import {
  fetchBankTransactions, createBankTransaction, updateBankTransaction,
  postBankTransaction, reverseBankTransaction, deleteBankTransaction,
  clearError, clearSelected,
} from '../store/slices/bankTransactionSlice';
import { fetchActiveBankAccounts } from '../store/slices/bankAccountSlice';
import { fetchAccounts } from '../store/slices/accountSlice';

const TRANSACTION_TYPES = [
  'Deposit', 'Withdrawal', 'Transfer In', 'Transfer Out',
  'Bank Charge', 'Interest Income', 'Interest Expense',
  'Cheque Deposit', 'Cheque Payment', 'Direct Debit', 'Direct Credit',
  'Adjustment', 'Opening Balance', 'Imported Statement',
];

const INFLOW_TYPES = [
  'Deposit', 'Transfer In', 'Interest Income', 'Cheque Deposit',
  'Direct Credit', 'Opening Balance',
];

const INITIAL_FORM = {
  bankAccountId: '',
  transactionDate: new Date().toISOString().split('T')[0],
  valueDate: '',
  transactionType: 'Deposit',
  amount: '',
  referenceNumber: '',
  externalReference: '',
  description: '',
  offsetAccountId: '',
  notes: '',
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Posted': return 'success';
    case 'Draft': return 'warning';
    case 'Reversed': return 'error';
    case 'Cancelled': return 'default';
    default: return 'default';
  }
};

const BankTransactions = () => {
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
  const [viewTxn, setViewTxn] = useState(null);
  const [filters, setFilters] = useState({
    bankAccountId: '',
    status: '',
    transactionType: '',
    startDate: '',
    endDate: '',
  });

  const {
    transactions,
    selectedTransaction,
    loading,
    error,
  } = useSelector((state) => state.bankTransactions);

  const { activeBankAccounts } = useSelector((state) => state.bankAccounts);
  const { items: accounts } = useSelector((state) => state.accounts);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isView = location.pathname.includes('/view');

  const loadData = useCallback(() => {
    const params = { search };
    if (filters.bankAccountId) params.bankAccountId = filters.bankAccountId;
    if (filters.status) params.status = filters.status;
    if (filters.transactionType) params.transactionType = filters.transactionType;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    dispatch(fetchBankTransactions(params));
  }, [dispatch, search, filters]);

  useEffect(() => {
    dispatch(fetchActiveBankAccounts());
    dispatch(fetchAccounts({ limit: 999 }));
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isEditing && id) {
      const txn = transactions.find((t) => t.id === id);
      if (txn) {
        setForm({
          bankAccountId: txn.bankAccountId || '',
          transactionDate: txn.transactionDate || '',
          valueDate: txn.valueDate || '',
          transactionType: txn.transactionType || 'Deposit',
          amount: txn.debitAmount > 0 ? txn.debitAmount : txn.creditAmount,
          referenceNumber: txn.referenceNumber || '',
          externalReference: txn.externalReference || '',
          description: txn.description || '',
          offsetAccountId: txn.offsetAccountId || '',
          notes: txn.notes || '',
        });
        setDialogOpen(true);
      }
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, transactions]);

  useEffect(() => {
    if (isView && id && selectedTransaction) {
      setViewTxn(selectedTransaction);
      setViewDialogOpen(true);
    }
  }, [isView, id, selectedTransaction]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSelected());
    };
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.bankAccountId) errors.bankAccountId = 'Bank account is required';
    if (!form.transactionDate) errors.transactionDate = 'Transaction date is required';
    if (!form.transactionType) errors.transactionType = 'Transaction type is required';
    if (!form.amount || parseFloat(form.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isInflow = (type) => INFLOW_TYPES.includes(type);

  const handleSubmit = async () => {
    if (!validate()) return;

    const direction = isInflow(form.transactionType) ? 'In' : 'Out';

    const data = {
      ...form,
      amount: parseFloat(form.amount),
      direction,
      valueDate: form.valueDate || null,
    };

    if (isEditing && id) {
      await dispatch(updateBankTransaction({ id, data }));
    } else {
      await dispatch(createBankTransaction(data));
    }

    setDialogOpen(false);
    navigate('/app/banks/transactions');
  };

  const handlePost = async (txnId) => {
    await dispatch(postBankTransaction(txnId));
  };

  const handleReverse = async (txnId) => {
    await dispatch(reverseBankTransaction(txnId));
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await dispatch(deleteBankTransaction(deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const handleView = (txn) => {
    setViewTxn(txn);
    setViewDialogOpen(true);
  };

  const handleEdit = (txnId) => {
    navigate(`/app/banks/transactions/${txnId}/edit`);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormErrors({});
    navigate('/app/banks/transactions');
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewTxn(null);
    navigate('/app/banks/transactions');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get direction from transaction type for the form
  const formDirection = isInflow(form.transactionType) ? 'In' : 'Out';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BankIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Bank Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage bank transactions
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/banks/transactions/new')}
        >
          New Transaction
        </Button>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by number, reference, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search color="action" /></InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Bank Account</InputLabel>
              <Select name="bankAccountId" value={filters.bankAccountId} onChange={handleFilterChange} label="Bank Account">
                <MenuItem value="">All</MenuItem>
                {activeBankAccounts.map((ba) => (
                  <MenuItem key={ba.id} value={ba.id}>{ba.accountName} ({ba.accountNumber})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select name="status" value={filters.status} onChange={handleFilterChange} label="Status">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Posted">Posted</MenuItem>
                <MenuItem value="Reversed">Reversed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select name="transactionType" value={filters.transactionType} onChange={handleFilterChange} label="Type">
                <MenuItem value="">All</MenuItem>
                {TRANSACTION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="From Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="To Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button variant="outlined" startIcon={<Search />} onClick={loadData} fullWidth size="small">
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Txn #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bank Account</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Direction</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Debit</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Credit</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reconciled</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No transactions found. Click "New Transaction" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => (
                  <TableRow
                    key={txn.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleView(txn)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {txn.transactionNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{txn.transactionDate}</TableCell>
                    <TableCell>
                      {txn.bankAccount?.accountName || txn.bankAccountId?.slice(0, 8) || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={txn.transactionType} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={txn.direction}
                        color={txn.direction === 'In' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {txn.debitAmount > 0 ? formatAmount(txn.debitAmount) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {txn.creditAmount > 0 ? formatAmount(txn.creditAmount) : '-'}
                    </TableCell>
                    <TableCell align="right">{formatAmount(txn.runningBalance)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={txn.status} color={getStatusColor(txn.status)} />
                    </TableCell>
                    <TableCell>
                      {txn.isReconciled ? (
                        <Chip size="small" label="Yes" color="info" />
                      ) : (
                        <Chip size="small" label="No" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {txn.status === 'Draft' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => { e.stopPropagation(); handleEdit(txn.id); }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Post">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => { e.stopPropagation(); handlePost(txn.id); }}
                              >
                                <PostAdd fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(txn.id); }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {txn.status === 'Posted' && !txn.isReconciled && (
                          <Tooltip title="Reverse">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={(e) => { e.stopPropagation(); handleReverse(txn.id); }}
                            >
                              <Undo fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
            <BankIcon color="primary" />
            {isEditing ? 'Edit Transaction' : 'New Bank Transaction'}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Bank Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.bankAccountId}>
                <InputLabel>Bank Account *</InputLabel>
                <Select
                  name="bankAccountId"
                  value={form.bankAccountId}
                  onChange={handleChange}
                  label="Bank Account *"
                >
                  {activeBankAccounts.map((ba) => (
                    <MenuItem key={ba.id} value={ba.id}>
                      {ba.accountName} ({ba.accountNumber || ba.accountCode})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.bankAccountId && (
                  <Typography variant="caption" color="error">{formErrors.bankAccountId}</Typography>
                )}
              </FormControl>
            </Grid>

            {/* Transaction Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.transactionType}>
                <InputLabel>Transaction Type *</InputLabel>
                <Select
                  name="transactionType"
                  value={form.transactionType}
                  onChange={handleChange}
                  label="Transaction Type *"
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Transaction Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transaction Date *"
                type="date"
                name="transactionDate"
                value={form.transactionDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.transactionDate}
                helperText={formErrors.transactionDate}
              />
            </Grid>

            {/* Value Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Value Date"
                type="date"
                name="valueDate"
                value={form.valueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount *"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
              />
            </Grid>

            {/* Direction (read-only, derived from type) */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Direction</InputLabel>
                <Select value={formDirection} label="Direction" disabled>
                  <MenuItem value="In">In (Money Received)</MenuItem>
                  <MenuItem value="Out">Out (Money Paid)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Offset Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Offset Account</InputLabel>
                <Select
                  name="offsetAccountId"
                  value={form.offsetAccountId}
                  onChange={handleChange}
                  label="Offset Account"
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Reference Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                name="referenceNumber"
                value={form.referenceNumber}
                onChange={handleChange}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                multiline
                rows={2}
              />
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
            <BankIcon color="primary" />
            Transaction Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewTxn && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Transaction Number</Typography>
                <Typography variant="body1" fontWeight={600}>{viewTxn.transactionNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box><Chip size="small" label={viewTxn.status} color={getStatusColor(viewTxn.status)} /></Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body1">{viewTxn.transactionDate}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Value Date</Typography>
                <Typography variant="body1">{viewTxn.valueDate || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Bank Account</Typography>
                <Typography variant="body1">{viewTxn.bankAccount?.accountName || viewTxn.bankAccountId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body1">{viewTxn.transactionType}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Direction</Typography>
                <Chip size="small" label={viewTxn.direction} color={viewTxn.direction === 'In' ? 'success' : 'error'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {viewTxn.direction === 'In'
                    ? formatAmount(viewTxn.creditAmount)
                    : formatAmount(viewTxn.debitAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Running Balance</Typography>
                <Typography variant="body1" fontWeight={600}>{formatAmount(viewTxn.runningBalance)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Reconciled</Typography>
                <Chip size="small" label={viewTxn.isReconciled ? 'Yes' : 'No'} color={viewTxn.isReconciled ? 'info' : 'default'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Reference</Typography>
                <Typography variant="body1">{viewTxn.referenceNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body1">{viewTxn.description || '-'}</Typography>
              </Grid>
              {viewTxn.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{viewTxn.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {viewTxn?.status === 'Draft' && (
            <Button variant="outlined" startIcon={<Edit />} onClick={() => { handleCloseViewDialog(); if (viewTxn) handleEdit(viewTxn.id); }}>
              Edit
            </Button>
          )}
          <Button onClick={handleCloseViewDialog} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this transaction? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankTransactions;
