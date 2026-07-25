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
  Add, Edit, Delete, Block, CheckCircle, Search, Refresh,
  ArrowBack, AccountBalance as BankIcon, Star, StarBorder,
} from '@mui/icons-material';
import {
  fetchBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount,
  toggleBankAccountStatus, setDefaultBankAccount, clearError, clearSelected,
} from '../store/slices/bankAccountSlice';
import { fetchAccounts } from '../store/slices/accountSlice';

const INITIAL_FORM = {
  accountCode: '',
  accountName: '',
  bankName: '',
  branchName: '',
  accountNumber: '',
  iban: '',
  swiftCode: '',
  currencyCode: 'USD',
  openingBalance: '',
  openingBalanceDate: '',
  chartOfAccountId: '',
  isDefault: false,
  isActive: true,
  notes: '',
};

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'PKR', label: 'PKR - Pakistani Rupee' },
  { value: 'INR', label: 'INR - Indian Rupee' },
];

const BankAccounts = () => {
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
  const [viewAccount, setViewAccount] = useState(null);

  const {
    bankAccounts,
    selectedBankAccount,
    loading,
    error,
  } = useSelector((state) => state.bankAccounts);

  const { items: accounts } = useSelector((state) => state.accounts);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isView = location.pathname.includes('/view');

  const loadData = useCallback(() => {
    dispatch(fetchBankAccounts({ search }));
  }, [dispatch, search]);

  const loadAccounts = useCallback(() => {
    dispatch(fetchAccounts({ limit: 999 }));
  }, [dispatch]);

  useEffect(() => {
    loadData();
    loadAccounts();
  }, [loadData, loadAccounts]);

  useEffect(() => {
    if (isEditing && id) {
      const account = bankAccounts.find((a) => a.id === id);
      if (account) {
        setForm({
          accountCode: account.accountCode || '',
          accountName: account.accountName || '',
          bankName: account.bankName || '',
          branchName: account.branchName || '',
          accountNumber: account.accountNumber || '',
          iban: account.iban || '',
          swiftCode: account.swiftCode || '',
          currencyCode: account.currencyCode || 'USD',
          openingBalance: account.openingBalance ?? '',
          openingBalanceDate: account.openingBalanceDate || '',
          chartOfAccountId: account.chartOfAccountId || '',
          isDefault: account.isDefault || false,
          isActive: account.isActive !== false,
          notes: account.notes || '',
        });
        setDialogOpen(true);
      }
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, bankAccounts]);

  useEffect(() => {
    if (isView && id && selectedBankAccount) {
      setViewAccount(selectedBankAccount);
      setViewDialogOpen(true);
    } else if (isView && id && !selectedBankAccount) {
      dispatch(fetchBankAccounts({ search }));
    }
  }, [isView, id, selectedBankAccount, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSelected());
    };
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.accountCode.trim()) errors.accountCode = 'Account code is required';
    if (!form.accountName.trim()) errors.accountName = 'Account name is required';
    if (!form.currencyCode.trim()) errors.currencyCode = 'Currency code is required';
    if (!form.chartOfAccountId) errors.chartOfAccountId = 'Chart of account is required';
    if (form.accountNumber && form.accountNumber.length > 100) {
      errors.accountNumber = 'Account number must not exceed 100 characters';
    }
    if (form.swiftCode && !/^[A-Za-z0-9]{8,20}$/.test(form.swiftCode)) {
      errors.swiftCode = 'Invalid SWIFT code format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data = {
      ...form,
      openingBalance: form.openingBalance === '' ? 0 : parseFloat(form.openingBalance),
      openingBalanceDate: form.openingBalanceDate || null,
      isDefault: form.isDefault,
      isActive: form.isActive,
    };

    if (isEditing && id) {
      await dispatch(updateBankAccount({ id, data }));
    } else {
      await dispatch(createBankAccount(data));
    }

    setDialogOpen(false);
    navigate('/app/banks/accounts');
  };

  const handleToggleStatus = async (accountId) => {
    await dispatch(toggleBankAccountStatus(accountId));
  };

  const handleSetDefault = async (accountId) => {
    await dispatch(setDefaultBankAccount(accountId));
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await dispatch(deleteBankAccount(deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const handleView = async (account) => {
    setViewAccount(account);
    setViewDialogOpen(true);
  };

  const handleEdit = (accountId) => {
    navigate(`/app/banks/accounts/${accountId}/edit`);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      loadData();
    }
  };

  const handleRefresh = () => {
    setSearch('');
    dispatch(fetchBankAccounts({}));
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormErrors({});
    navigate('/app/banks/accounts');
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewAccount(null);
    navigate('/app/banks/accounts');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Filter accounts to only show asset type
  const assetAccounts = accounts?.filter((acc) => acc.type === 'asset') || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BankIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Bank Accounts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage company bank accounts
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/banks/accounts/new')}
        >
          New Bank Account
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
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by code, name, bank, account number..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={loadData}
              sx={{ mr: 1 }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Refresh
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
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Account Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bank Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Account Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Opening Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Default</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : bankAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No bank accounts found. Click "New Bank Account" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bankAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleView(account)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {account.accountCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>{account.bankName || '-'}</TableCell>
                    <TableCell>{account.accountNumber || '-'}</TableCell>
                    <TableCell>{account.currencyCode}</TableCell>
                    <TableCell>
                      {parseFloat(account.openingBalance || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={account.isActive ? 'Active' : 'Inactive'}
                        color={account.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {account.isDefault ? (
                        <Star color="warning" fontSize="small" />
                      ) : (
                        <StarBorder color="disabled" fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => { e.stopPropagation(); handleEdit(account.id); }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={account.isDefault ? 'Default Account' : 'Set as Default'}>
                          <span>
                            <IconButton
                              size="small"
                              color={account.isDefault ? 'warning' : 'default'}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!account.isDefault) handleSetDefault(account.id);
                              }}
                              disabled={account.isDefault}
                            >
                              {account.isDefault ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={account.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            color={account.isActive ? 'error' : 'success'}
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(account.id); }}
                          >
                            {account.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(account.id);
                              }}
                              disabled={account.isDefault}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
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
            <ArrowBack
              onClick={handleCloseDialog}
              sx={{ cursor: 'pointer', color: 'text.secondary' }}
            />
            <BankIcon color="primary" />
            {isEditing ? 'Edit Bank Account' : 'New Bank Account'}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Account Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Code *"
                name="accountCode"
                value={form.accountCode}
                onChange={handleChange}
                error={!!formErrors.accountCode}
                helperText={formErrors.accountCode}
                required
              />
            </Grid>

            {/* Account Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Name *"
                name="accountName"
                value={form.accountName}
                onChange={handleChange}
                error={!!formErrors.accountName}
                helperText={formErrors.accountName}
                required
              />
            </Grid>

            {/* Bank Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bank Name"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
              />
            </Grid>

            {/* Branch Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Branch Name"
                name="branchName"
                value={form.branchName}
                onChange={handleChange}
              />
            </Grid>

            {/* Account Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Number"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                error={!!formErrors.accountNumber}
                helperText={formErrors.accountNumber}
              />
            </Grid>

            {/* IBAN */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IBAN"
                name="iban"
                value={form.iban}
                onChange={handleChange}
              />
            </Grid>

            {/* SWIFT Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SWIFT Code"
                name="swiftCode"
                value={form.swiftCode}
                onChange={handleChange}
                error={!!formErrors.swiftCode}
                helperText={formErrors.swiftCode}
              />
            </Grid>

            {/* Currency */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Currency *</InputLabel>
                <Select
                  name="currencyCode"
                  value={form.currencyCode}
                  onChange={handleChange}
                  label="Currency *"
                  error={!!formErrors.currencyCode}
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Opening Balance */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Opening Balance"
                name="openingBalance"
                type="number"
                value={form.openingBalance}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>

            {/* Opening Balance Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Opening Balance Date"
                name="openingBalanceDate"
                type="date"
                value={form.openingBalanceDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Chart of Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.chartOfAccountId}>
                <InputLabel>Linked Account *</InputLabel>
                <Select
                  name="chartOfAccountId"
                  value={form.chartOfAccountId}
                  onChange={handleChange}
                  label="Linked Account *"
                >
                  {assetAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.chartOfAccountId && (
                  <Typography variant="caption" color="error">
                    {formErrors.chartOfAccountId}
                  </Typography>
                )}
              </FormControl>
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
                rows={3}
              />
            </Grid>

            {/* Switches */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isDefault}
                    onChange={handleChange}
                    name="isDefault"
                    color="primary"
                  />
                }
                label="Set as Default Account"
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={handleChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
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
            <ArrowBack
              onClick={handleCloseViewDialog}
              sx={{ cursor: 'pointer', color: 'text.secondary' }}
            />
            <BankIcon color="primary" />
            Bank Account Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewAccount && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Account Code</Typography>
                <Typography variant="body1" fontWeight={600}>{viewAccount.accountCode}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Account Name</Typography>
                <Typography variant="body1" fontWeight={600}>{viewAccount.accountName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Bank Name</Typography>
                <Typography variant="body1">{viewAccount.bankName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Branch Name</Typography>
                <Typography variant="body1">{viewAccount.branchName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Account Number</Typography>
                <Typography variant="body1">{viewAccount.accountNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">IBAN</Typography>
                <Typography variant="body1">{viewAccount.iban || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">SWIFT Code</Typography>
                <Typography variant="body1">{viewAccount.swiftCode || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Currency</Typography>
                <Typography variant="body1">{viewAccount.currencyCode}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Opening Balance</Typography>
                <Typography variant="body1">
                  {parseFloat(viewAccount.openingBalance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Opening Balance Date</Typography>
                <Typography variant="body1">{viewAccount.openingBalanceDate || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Linked Account</Typography>
                <Typography variant="body1">
                  {viewAccount.chartOfAccount
                    ? `${viewAccount.chartOfAccount.code} - ${viewAccount.chartOfAccount.name}`
                    : viewAccount.chartOfAccountId || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>
                  <Chip
                    size="small"
                    label={viewAccount.isActive ? 'Active' : 'Inactive'}
                    color={viewAccount.isActive ? 'success' : 'default'}
                  />
                  {viewAccount.isDefault && (
                    <Chip
                      size="small"
                      label="Default"
                      color="warning"
                      icon={<Star fontSize="small" />}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Grid>
              {viewAccount.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{viewAccount.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => {
              handleCloseViewDialog();
              if (viewAccount) handleEdit(viewAccount.id);
            }}
          >
            Edit
          </Button>
          <Button onClick={handleCloseViewDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this bank account? This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Bank accounts with transactions cannot be deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankAccounts;
