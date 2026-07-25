import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid, Card, CardContent,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add, Delete, Search, Refresh, ArrowBack, Balance as BalanceIcon,
  CheckCircle, Undo, Link as MatchIcon, LinkOff as UnmatchIcon,
} from '@mui/icons-material';
import {
  fetchReconciliations, fetchReconciliation, createReconciliation,
  importStatementLines, manualMatch, unmatchLine,
  completeReconciliation, overrideCompleteReconciliation,
  reverseReconciliation, deleteReconciliation, clearError, clearSelected,
} from '../store/slices/bankReconciliationSlice';
import { fetchActiveBankAccounts } from '../store/slices/bankAccountSlice';

const getStatusColor = (s) => { switch (s) { case 'Reconciled': return 'success'; case 'Draft': return 'warning'; case 'InProgress': return 'info'; case 'Reversed': return 'error'; case 'Closed': return 'default'; default: return 'default'; } };

const formatAmount = (a) => parseFloat(a || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BankReconciliation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filters, setFilters] = useState({ bankAccountId: '', status: '' });
  const [createForm, setCreateForm] = useState({
    bankAccountId: '', statementDateFrom: '', statementDateTo: '',
    statementOpeningBalance: '', statementClosingBalance: '', notes: '',
  });
  const [createFormErrors, setCreateFormErrors] = useState({});
  const [importText, setImportText] = useState('');

  const { reconciliations, selectedReconciliation, loading, error } = useSelector((s) => s.bankReconciliations);
  const { activeBankAccounts } = useSelector((s) => s.bankAccounts);

  const isView = location.pathname.includes('/view') || location.pathname.includes('/edit');

  const loadData = useCallback(() => {
    const params = { search };
    if (filters.bankAccountId) params.bankAccountId = filters.bankAccountId;
    if (filters.status) params.status = filters.status;
    dispatch(fetchReconciliations(params));
  }, [dispatch, search, filters]);

  useEffect(() => { dispatch(fetchActiveBankAccounts()); }, [dispatch]);
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (id && (isView || workspaceOpen)) {
      dispatch(fetchReconciliation(id));
    }
  }, [id, isView, workspaceOpen, dispatch]);

  useEffect(() => {
    if (id && selectedReconciliation && (isView || workspaceOpen)) {
      setWorkspaceOpen(true);
    }
  }, [id, selectedReconciliation, isView, workspaceOpen]);

  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const validateCreate = () => {
    const e = {};
    if (!createForm.bankAccountId) e.bankAccountId = 'Required';
    if (!createForm.statementDateFrom) e.statementDateFrom = 'Required';
    if (!createForm.statementDateTo) e.statementDateTo = 'Required';
    if (!createForm.statementOpeningBalance && createForm.statementOpeningBalance !== 0) e.statementOpeningBalance = 'Required';
    if (!createForm.statementClosingBalance && createForm.statementClosingBalance !== 0) e.statementClosingBalance = 'Required';
    setCreateFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    const r = await dispatch(createReconciliation({
      ...createForm,
      statementOpeningBalance: parseFloat(createForm.statementOpeningBalance || 0),
      statementClosingBalance: parseFloat(createForm.statementClosingBalance || 0),
    }));
    setCreateDialogOpen(false);
    if (r.payload?.data?.id) {
      navigate(`/app/banks/reconciliation/${r.payload.data.id}/view`);
    }
  };

  const handleImportLines = async () => {
    if (!importText.trim() || !id) return;
    const lines = importText.trim().split('\n')
      .filter((l) => l.trim())
      .map((l) => {
        const parts = l.split('\t');
        if (parts.length < 3) return null;
        return {
          statementTransactionDate: parts[0]?.trim() || null,
          statementReference: parts[1]?.trim() || null,
          statementDescription: parts[2]?.trim() || null,
          statementDebitAmount: parseFloat(parts[3]?.trim() || 0),
          statementCreditAmount: parseFloat(parts[4]?.trim() || 0),
        };
      })
      .filter((l) => l !== null);

    if (lines.length === 0) return;
    await dispatch(importStatementLines({ id, data: { lines } }));
    setImportDialogOpen(false);
    setImportText('');
  };

  const handleManualMatch = async (lineId, bankTransactionId) => {
    await dispatch(manualMatch({ id, lineId, bankTransactionId }));
  };

  const handleUnmatch = async (lineId) => {
    await dispatch(unmatchLine({ id, lineId }));
  };

  const handleComplete = async () => {
    await dispatch(completeReconciliation(id));
  };

  const handleOverrideComplete = async () => {
    await dispatch(overrideCompleteReconciliation(id));
  };

  const handleReverse = async () => {
    await dispatch(reverseReconciliation(id));
  };

  const handleDelete = async () => {
    if (deleteConfirm) { await dispatch(deleteReconciliation(deleteConfirm)); setDeleteConfirm(null); }
  };

  const rec = selectedReconciliation;
  const systemTransactions = rec?.lines?.filter((l) => l.bankTransaction)?.map((l) => l.bankTransaction) || [];
  const statementLines = rec?.lines || [];
  const matchedLines = statementLines.filter((l) => l.matchStatus === 'Matched');
  const unmatchedLines = statementLines.filter((l) => l.matchStatus === 'Unmatched');

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BalanceIcon color="primary" sx={{ fontSize: 32 }} />
          <Box><Typography variant="h5" fontWeight={700}>Bank Reconciliation</Typography><Typography variant="body2" color="text.secondary">Match bank transactions with statements</Typography></Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {workspaceOpen && <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => { setWorkspaceOpen(false); navigate('/app/banks/reconciliation'); }}>Back to List</Button>}
          {!workspaceOpen && <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>New Reconciliation</Button>}
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      {/* Workspace View */}
      {workspaceOpen && rec ? (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent><Typography variant="caption" color="text.secondary">Statement Opening Balance</Typography><Typography variant="h6" fontWeight={700}>{formatAmount(rec.statementOpeningBalance)}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent><Typography variant="caption" color="text.secondary">Statement Closing Balance</Typography><Typography variant="h6" fontWeight={700}>{formatAmount(rec.statementClosingBalance)}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card><CardContent><Typography variant="caption" color="text.secondary">System Balance</Typography><Typography variant="h6" fontWeight={700}>{formatAmount(rec.systemClosingBalance)}</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: Math.abs(rec.differenceAmount) > 0.01 ? 'error.light' : 'success.light' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Difference</Typography>
                  <Typography variant="h6" fontWeight={700} color={Math.abs(rec.differenceAmount) > 0.01 ? 'error' : 'success'}>
                    {formatAmount(rec.differenceAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Info + Actions */}
          <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2">{rec.reconciliationNumber}</Typography>
              <Typography variant="caption" color="text.secondary">
                {rec.bankAccount?.accountName} | {rec.statementDateFrom} to {rec.statementDateTo} | Status: <Chip size="small" label={rec.status} color={getStatusColor(rec.status)} />
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(rec.status === 'Draft' || rec.status === 'InProgress') && (
                <>
                  <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => setImportDialogOpen(true)}>Import Lines</Button>
                  <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={handleComplete}>Complete</Button>
                  <Button size="small" variant="contained" color="warning" onClick={handleOverrideComplete}>Override Complete</Button>
                </>
              )}
              {rec.status === 'Reconciled' && (
                <Button size="small" variant="outlined" color="error" startIcon={<Undo />} onClick={handleReverse}>Reverse</Button>
              )}
            </Box>
          </Paper>

          <Grid container spacing={2}>
            {/* Statement Lines */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Statement Lines ({statementLines.length})</Typography>
              <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Debit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Credit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Match</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {statementLines.map((l) => {
                      const isMatched = l.matchStatus === 'Matched';
                      const unmatchedTxns = systemTransactions.filter((t) => !t.isReconciled || t.id === l.bankTransactionId);
                      return (
                        <TableRow key={l.id} sx={{ bgcolor: isMatched ? 'action.selected' : 'inherit' }}>
                          <TableCell>{l.statementTransactionDate || '-'}</TableCell>
                          <TableCell>{l.statementReference || '-'}</TableCell>
                          <TableCell>{l.statementDescription || '-'}</TableCell>
                          <TableCell align="right">{l.statementDebitAmount > 0 ? formatAmount(l.statementDebitAmount) : '-'}</TableCell>
                          <TableCell align="right">{l.statementCreditAmount > 0 ? formatAmount(l.statementCreditAmount) : '-'}</TableCell>
                          <TableCell>
                            <Chip size="small" label={l.matchStatus} color={isMatched ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell align="center">
                            {rec.status !== 'Reconciled' && rec.status !== 'Closed' && (
                              <>
                                {!isMatched ? (
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <Select
                                      value=""
                                      displayEmpty
                                      onChange={(e) => { if (e.target.value) handleManualMatch(l.id, e.target.value); }}
                                    >
                                      <MenuItem value="" disabled>Match...</MenuItem>
                                      {unmatchedTxns.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>
                                          {t.transactionNumber} ({formatAmount(t.debitAmount || t.creditAmount)})
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Tooltip title="Unmatch">
                                    <IconButton size="small" color="warning" onClick={() => handleUnmatch(l.id)}>
                                      <UnmatchIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {statementLines.length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary">No statement lines imported yet.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* System Transactions */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>System Transactions ({systemTransactions.length})</Typography>
              <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Txn #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reconciled</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {Array.from(new Map(systemTransactions.map((t) => [t.id, t])).values()).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.transactionNumber}</TableCell>
                        <TableCell>{t.transactionDate}</TableCell>
                        <TableCell><Chip size="small" label={t.transactionType} variant="outlined" /></TableCell>
                        <TableCell>{t.description || '-'}</TableCell>
                        <TableCell align="right">{formatAmount(t.debitAmount || t.creditAmount)}</TableCell>
                        <TableCell>
                          <Chip size="small" label={t.isReconciled ? 'Yes' : 'No'} color={t.isReconciled ? 'info' : 'default'} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {systemTransactions.length === 0 && (
                      <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary">No system transactions in this period.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        /* List View */
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} /></Grid>
              <Grid item xs={12} sm={6} md={2}><FormControl fullWidth size="small"><InputLabel>Bank Account</InputLabel><Select name="bankAccountId" value={filters.bankAccountId} onChange={(e) => setFilters((p) => ({ ...p, bankAccountId: e.target.value }))} label="Bank Account"><MenuItem value="">All</MenuItem>{activeBankAccounts.map((ba) => <MenuItem key={ba.id} value={ba.id}>{ba.accountName}</MenuItem>)}</Select></FormControl></Grid>
              <Grid item xs={6} sm={3} md={1.5}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select name="status" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} label="Status"><MenuItem value="">All</MenuItem><MenuItem value="Draft">Draft</MenuItem><MenuItem value="InProgress">In Progress</MenuItem><MenuItem value="Reconciled">Reconciled</MenuItem><MenuItem value="Reversed">Reversed</MenuItem></Select></FormControl></Grid>
              <Grid item xs={6} sm={3} md={1}><Button variant="outlined" startIcon={<Search />} onClick={loadData} fullWidth size="small">Search</Button></Grid>
            </Grid>
          </Paper>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead><TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Recon #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Bank Account</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Statement Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">System Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Difference</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                  : reconciliations.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No reconciliations found.</Typography></TableCell></TableRow>
                  : reconciliations.map((r) => (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/app/banks/reconciliation/${r.id}/view`)}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{r.reconciliationNumber}</Typography></TableCell>
                      <TableCell>{r.bankAccount?.accountName || '-'}</TableCell>
                      <TableCell>{r.statementDateFrom} to {r.statementDateTo}</TableCell>
                      <TableCell align="right">{formatAmount(r.statementClosingBalance)}</TableCell>
                      <TableCell align="right">{formatAmount(r.systemClosingBalance)}</TableCell>
                      <TableCell align="right">
                        <Typography color={Math.abs(r.differenceAmount) > 0.01 ? 'error' : 'success'} fontWeight={600}>
                          {formatAmount(r.differenceAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell><Chip size="small" label={r.status} color={getStatusColor(r.status)} /></TableCell>
                      <TableCell align="center">
                        {r.status === 'Draft' && (
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Bank Reconciliation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><FormControl fullWidth><InputLabel>Bank Account *</InputLabel><Select name="bankAccountId" value={createForm.bankAccountId} onChange={(e) => setCreateForm((p) => ({ ...p, bankAccountId: e.target.value }))} label="Bank Account *">{activeBankAccounts.map((ba) => <MenuItem key={ba.id} value={ba.id}>{ba.accountName} ({ba.accountNumber || ba.accountCode})</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Statement Date From *" type="date" name="statementDateFrom" value={createForm.statementDateFrom} onChange={(e) => setCreateForm((p) => ({ ...p, statementDateFrom: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Statement Date To *" type="date" name="statementDateTo" value={createForm.statementDateTo} onChange={(e) => setCreateForm((p) => ({ ...p, statementDateTo: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Opening Balance *" type="number" name="statementOpeningBalance" value={createForm.statementOpeningBalance} onChange={(e) => setCreateForm((p) => ({ ...p, statementOpeningBalance: e.target.value }))} InputProps={{ inputProps: { step: 0.01 } }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Closing Balance *" type="number" name="statementClosingBalance" value={createForm.statementClosingBalance} onChange={(e) => setCreateForm((p) => ({ ...p, statementClosingBalance: e.target.value }))} InputProps={{ inputProps: { step: 0.01 } }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" name="notes" value={createForm.notes} onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))} multiline rows={2} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Import Lines Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Statement Lines</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste tab-separated lines. Format per line: <code>Date(TAB)Reference(TAB)Description(TAB)Debit(TAB)Credit</code>
          </Typography>
          <TextField
            fullWidth multiline rows={10}
            placeholder={`2026-06-01\tREF001\tDeposit\t\t1000.00\n2026-06-02\tREF002\tBank Charge\t25.00\t`}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleImportLines} variant="contained" disabled={!importText.trim()}>Import</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure? This cannot be undone.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setDeleteConfirm(null)} color="inherit">Cancel</Button><Button onClick={handleDelete} color="error" variant="contained">Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankReconciliation;
