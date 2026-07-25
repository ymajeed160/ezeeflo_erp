import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, CircularProgress, Tooltip, TablePagination, Stack,
  Autocomplete, Grid, InputAdornment,
} from '@mui/material';
import {
  Add, Edit, Delete, PostAdd, Undo, Search as SearchIcon,
  Clear as ClearIcon, AccountBalance as AccountIcon,
} from '@mui/icons-material';
import {
  fetchJournalEntries, createJournalEntry, updateJournalEntry,
  deleteJournalEntry, postJournalEntry, reverseJournalEntry, clearError,
} from '../store/slices/journalEntrySlice';
import { fetchAccounts, createAccount } from '../store/slices/accountSlice';
import journalEntryApi from '../services/journalEntryApi';

const STATUS_COLORS = {
  draft: 'warning',
  posted: 'success',
  reversed: 'error',
};

const JournalEntries = () => {
  const dispatch = useDispatch();
  const { items: entries, loading, error, total, page, limit } = useSelector(
    (state) => state.journalEntries || {}
  );
  const { items: accounts } = useSelector((state) => state.accounts || {});

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '', search: '' });
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { accountId: '', description: '', debit: '', credit: '' },
      { accountId: '', description: '', debit: '', credit: '' },
    ],
  });
  const [formErrors, setFormErrors] = useState({});

  // New Account dialog state
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [newAccountTargetLine, setNewAccountTargetLine] = useState(null); // which line index to select after creation
  const [newAccountForm, setNewAccountForm] = useState({
    code: '', name: '', type: 'asset', description: '',
  });
  const [newAccountSaving, setNewAccountSaving] = useState(false);
  const [newAccountError, setNewAccountError] = useState('');

  useEffect(() => {
    dispatch(fetchJournalEntries({ page, limit, ...filters }));
    dispatch(fetchAccounts());
  }, [dispatch, page, limit]);

  const [fetchingReference, setFetchingReference] = useState(false);

  const handleOpen = useCallback(
    async (entry = null) => {
      if (entry) {
        setEditItem(entry);
        setForm({
          entryDate: entry.entryDate ? entry.entryDate.split('T')[0] : '',
          reference: entry.reference || '',
          description: entry.description || '',
          lines: entry.lines?.length
            ? entry.lines.map((l) => ({
                id: l.id,
                accountId: l.accountId || '',
                description: l.description || '',
                debit: l.debit ? String(l.debit) : '',
                credit: l.credit ? String(l.credit) : '',
              }))
            : [
                { accountId: '', description: '', debit: '', credit: '' },
                { accountId: '', description: '', debit: '', credit: '' },
              ],
        });
        setFormErrors({});
        setOpen(true);
      } else {
        setEditItem(null);
        setOpen(true);
        setFormErrors({});
        // Reset form with blank reference while fetching
        setForm({
          entryDate: new Date().toISOString().split('T')[0],
          reference: '',
          description: '',
          lines: [
            { accountId: '', description: '', debit: '', credit: '' },
            { accountId: '', description: '', debit: '', credit: '' },
          ],
        });
        // Auto-populate the Reference field with the next sequential number
        setFetchingReference(true);
        try {
          const response = await journalEntryApi.getNextReference();
          const nextRef = response?.data?.reference || response?.reference || '';
          if (nextRef) {
            setForm((prev) => ({ ...prev, reference: nextRef }));
          }
        } catch {
          // If the endpoint fails, leave reference blank (user can type manually)
        } finally {
          setFetchingReference(false);
        }
      }
    },
    []
  );

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
  };

  const handleAddLine = () => {
    setForm({
      ...form,
      lines: [...form.lines, { accountId: '', description: '', debit: '', credit: '' }],
    });
  };

  const handleRemoveLine = (index) => {
    if (form.lines.length <= 2) return;
    setForm({
      ...form,
      lines: form.lines.filter((_, i) => i !== index),
    });
  };

  // --- New Account quick-create ---
  const handleOpenNewAccount = (lineIndex) => {
    setNewAccountTargetLine(lineIndex);
    setNewAccountForm({ code: '', name: '', type: 'asset', description: '' });
    setNewAccountError('');
    setNewAccountOpen(true);
  };

  const handleCloseNewAccount = () => {
    setNewAccountOpen(false);
    setNewAccountTargetLine(null);
  };

  const handleNewAccountChange = (field, value) => {
    setNewAccountForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async () => {
    if (!newAccountForm.code || !newAccountForm.name) {
      setNewAccountError('Account code and name are required');
      return;
    }
    setNewAccountSaving(true);
    setNewAccountError('');
    try {
      const result = await dispatch(createAccount(newAccountForm)).unwrap();
      // API returns { data: account, message }, so account is in result.data
      const newAccount = result?.data || result;
      const targetLine = newAccountTargetLine;
      // Close the dialog immediately
      handleCloseNewAccount();
      // Refresh accounts list
      await dispatch(fetchAccounts());
      // Auto-select after state updates
      if (targetLine !== null && newAccount?.id) {
        // Use setTimeout to ensure React processes the state updates from fetchAccounts first
        setTimeout(() => {
          handleLineChange(targetLine, 'accountId', newAccount.id);
        }, 0);
      }
    } catch (err) {
      setNewAccountError(typeof err === 'string' ? err : (err?.message || 'Failed to create account'));
    } finally {
      setNewAccountSaving(false);
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...form.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setForm({ ...form, lines: newLines });
  };

  const validate = () => {
    const errors = {};
    if (!form.entryDate) errors.entryDate = 'Entry date is required';

    const lineErrors = [];
    let hasError = false;
    form.lines.forEach((line, i) => {
      const le = {};
      const debitVal = parseFloat(line.debit) || 0;
      const creditVal = parseFloat(line.credit) || 0;
      if (!line.accountId) {
        le.accountId = 'Account is required';
        hasError = true;
      }
      if (debitVal === 0 && creditVal === 0) {
        le.amount = 'Debit or credit is required';
        hasError = true;
      }
      if (debitVal > 0 && creditVal > 0) {
        le.amount = 'Cannot have both debit and credit';
        hasError = true;
      }
      lineErrors[i] = le;
    });

    if (hasError) {
      errors.lines = lineErrors;
    }

    const totalDebit = form.lines.reduce(
      (sum, l) => sum + (parseFloat(l.debit) || 0),
      0
    );
    const totalCredit = form.lines.reduce(
      (sum, l) => sum + (parseFloat(l.credit) || 0),
      0
    );
    if (totalDebit > 0 && totalCredit > 0 && Math.abs(totalDebit - totalCredit) > 0.001) {
      errors.balance = `Debits (${totalDebit.toFixed(2)}) and credits (${totalCredit.toFixed(2)}) must be equal`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      entryDate: form.entryDate,
      reference: form.reference?.trim() || null,
      description: form.description?.trim() || null,
      lines: form.lines.map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        accountId: l.accountId,
        description: l.description?.trim() || null,
        debit: l.debit?.trim() ? parseFloat(l.debit) : 0,
        credit: l.credit?.trim() ? parseFloat(l.credit) : 0,
      })),
    };
    if (editItem) {
      dispatch(updateJournalEntry({ id: editItem.id, data: payload }));
    } else {
      dispatch(createJournalEntry(payload));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      dispatch(deleteJournalEntry(id));
    }
  };

  const handlePost = (id) => {
    if (window.confirm('Post this journal entry? This action cannot be undone.')) {
      dispatch(postJournalEntry(id));
    }
  };

  const handleReverse = (id) => {
    if (window.confirm('Reverse this journal entry? A new reversing entry will be created.')) {
      dispatch(reverseJournalEntry(id));
    }
  };

  const handleSearch = () => {
    dispatch(fetchJournalEntries({ page: 1, limit, ...filters }));
  };

  const handleClearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', search: '' });
    dispatch(fetchJournalEntries({ page: 1, limit }));
  };

  const handlePageChange = (_, newPage) => {
    dispatch(fetchJournalEntries({ page: newPage + 1, limit, ...filters }));
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    dispatch(fetchJournalEntries({ page: 1, limit: newLimit, ...filters }));
  };

  // Account lookup map
  const accountMap = React.useMemo(() => {
    const map = {};
    accounts.forEach((a) => {
      map[a.id] = `${a.code} - ${a.name}`;
    });
    return map;
  }, [accounts]);

  // Build Autocomplete options from chart of accounts
  const accountOptions = React.useMemo(
    () =>
      accounts.map((a) => ({
        id: a.id,
        label: `${a.code} - ${a.name}`,
        type: a.type,
      })),
    [accounts]
  );

  const getAccountLabel = (accountId) => accountMap[accountId] || accountId;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Journal Entries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your general journal entries
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen(null)}>
          New Journal Entry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="posted">Posted</MenuItem>
            <MenuItem value="reversed">Reversed</MenuItem>
          </TextField>
          <TextField
            label="From Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Search"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            size="small"
            placeholder="Entry # or Reference"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outlined" onClick={handleSearch} size="small">
            Search
          </Button>
          <Button
            variant="text"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            size="small"
          >
            Clear
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Entry #</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Reference</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Total Debit</strong></TableCell>
              <TableCell align="right"><strong>Total Credit</strong></TableCell>
              <TableCell align="center" sx={{ width: 200 }}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress sx={{ my: 3 }} />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No journal entries found. Click "New Journal Entry" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Typography fontWeight={600} variant="body2">
                      {entry.entryNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.entryDate
                      ? new Date(entry.entryDate).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>{entry.reference || '-'}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(entry.status || 'draft').toUpperCase()}
                      size="small"
                      color={STATUS_COLORS[entry.status] || 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {(entry.totalDebit || 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {(entry.totalCredit || 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <span>
                        <IconButton
                          onClick={() => handleOpen(entry)}
                          size="small"
                          disabled={entry.status === 'posted'}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {entry.status === 'draft' && (
                      <Tooltip title="Post Entry">
                        <IconButton
                          onClick={() => handlePost(entry.id)}
                          size="small"
                          color="success"
                        >
                          <PostAdd fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {entry.status === 'posted' && (
                      <Tooltip title="Reverse Entry">
                        <IconButton
                          onClick={() => handleReverse(entry.id)}
                          size="small"
                          color="warning"
                        >
                          <Undo fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <span>
                        <IconButton
                          onClick={() => handleDelete(entry.id)}
                          size="small"
                          color="error"
                          disabled={entry.status === 'posted'}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {total > 0 && (
          <TablePagination
            component="div"
            count={total}
            page={(page || 1) - 1}
            rowsPerPage={limit || 20}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        )}
      </TableContainer>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editItem ? 'Edit Journal Entry' : 'New Journal Entry'}
          {editItem?.entryNumber && (
            <Chip
              label={`#${editItem.entryNumber}`}
              size="small"
              sx={{ ml: 1, fontWeight: 600 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'grid', gap: 2 }}>
            {/* Header fields */}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label="Entry Date"
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                  error={!!formErrors.entryDate}
                  helperText={formErrors.entryDate}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Reference"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  fullWidth
                  size="small"
                  placeholder="e.g. INV-001"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  fullWidth
                  size="small"
                  placeholder="Brief description"
                />
              </Grid>
            </Grid>

            {formErrors.balance && (
              <Alert severity="error" sx={{ mb: 0 }}>
                {formErrors.balance}
              </Alert>
            )}

            {/* Lines header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '2fr 40px 2fr 1fr 1fr 60px',
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Account
              </Typography>
              <Box />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Line Description
              </Typography>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Debit
              </Typography>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Credit
              </Typography>
              <Box />
            </Box>

            {/* Lines */}
            {form.lines.map((line, i) => {
              const lineErr = formErrors.lines?.[i] || {};
              const selectedAccount = accountOptions.find((a) => a.id === line.accountId) || null;
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 40px 2fr 1fr 1fr 60px',
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <Autocomplete
                    options={accountOptions}
                    value={selectedAccount}
                    onChange={(_, newValue) =>
                      handleLineChange(i, 'accountId', newValue?.id || '')
                    }
                    getOptionLabel={(option) => option.label || ''}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        error={!!lineErr.accountId}
                        helperText={lineErr.accountId}
                        placeholder="Select account"
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="body2">{option.label}</Typography>
                          <Chip
                            label={option.type}
                            size="small"
                            sx={{ textTransform: 'capitalize', fontSize: '0.65rem' }}
                          />
                        </Box>
                      </li>
                    )}
                    size="small"
                    fullWidth
                  />
                  <Tooltip title="Add new account">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenNewAccount(i)}
                      sx={{ justifySelf: 'center' }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <TextField
                    size="small"
                    value={line.description}
                    onChange={(e) => handleLineChange(i, 'description', e.target.value)}
                    placeholder="Line description"
                    fullWidth
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={line.debit}
                    onChange={(e) => handleLineChange(i, 'debit', e.target.value)}
                    error={!!lineErr.amount}
                    inputProps={{ min: 0, step: '0.01' }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={line.credit}
                    onChange={(e) => handleLineChange(i, 'credit', e.target.value)}
                    error={!!lineErr.amount}
                    inputProps={{ min: 0, step: '0.01' }}
                    fullWidth
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveLine(i)}
                    disabled={form.lines.length <= 2}
                    sx={{ justifySelf: 'center' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}

            {/* Add Line */}
            <Button variant="outlined" size="small" onClick={handleAddLine} sx={{ alignSelf: 'start' }}>
              + Add Line
            </Button>

            {/* Totals */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Total Debit:{' '}
                <strong>
                  {form.lines
                    .reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0)
                    .toFixed(2)}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Credit:{' '}
                <strong>
                  {form.lines
                    .reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
                    .toFixed(2)}
                </strong>
              </Typography>
              <Typography
                variant="body2"
                color={
                  Math.abs(
                    form.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0) -
                      form.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
                  ) < 0.001
                    ? 'success.main'
                    : 'error.main'
                }
              >
                Difference:{' '}
                <strong>
                  {Math.abs(
                    form.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0) -
                      form.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
                  ).toFixed(2)}
                </strong>
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Account Quick-Create Dialog */}
      <Dialog open={newAccountOpen} onClose={handleCloseNewAccount} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountIcon color="primary" />
          New Chart of Account
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {newAccountError && <Alert severity="error" sx={{ mb: 1 }}>{newAccountError}</Alert>}
            <TextField
              label="Account Code"
              value={newAccountForm.code}
              onChange={(e) => handleNewAccountChange('code', e.target.value)}
              required
              size="small"
              fullWidth
              placeholder="e.g., 1001"
            />
            <TextField
              label="Account Name"
              value={newAccountForm.name}
              onChange={(e) => handleNewAccountChange('name', e.target.value)}
              required
              size="small"
              fullWidth
              placeholder="e.g., Cash Account"
            />
            <TextField
              select
              label="Account Type"
              value={newAccountForm.type}
              onChange={(e) => handleNewAccountChange('type', e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="asset">Asset</MenuItem>
              <MenuItem value="liability">Liability</MenuItem>
              <MenuItem value="equity">Equity</MenuItem>
              <MenuItem value="revenue">Revenue</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </TextField>
            <TextField
              label="Description"
              value={newAccountForm.description}
              onChange={(e) => handleNewAccountChange('description', e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="Optional description"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewAccount} disabled={newAccountSaving}>Cancel</Button>
          <Button
            onClick={handleCreateAccount}
            variant="contained"
            disabled={newAccountSaving}
            startIcon={newAccountSaving ? <CircularProgress size={16} /> : <Add />}
          >
            {newAccountSaving ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JournalEntries;