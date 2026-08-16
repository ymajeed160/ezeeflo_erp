import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid,
  CircularProgress, Tooltip, Alert,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Undo, Cancel, PostAdd } from '@mui/icons-material';
import crvApi from '../services/crvApi';
import accountApi from '../services/accountApi';
import { formatCurrency } from '../utils/currency';

const CASH_ACCOUNT_TYPES = ['Cash', 'Bank', 'cash', 'bank'];

const emptyLine = () => ({ accountId: '', description: '', amount: '', taxRate: '0', taxAmount: '0' });

const CashReceiptVouchers = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    voucherDate: new Date().toISOString().split('T')[0],
    cashAccountId: '',
    payerType: 'other',
    payerName: '',
    referenceNumber: '',
    description: '',
    paymentMethod: 'cash',
    lines: [emptyLine()],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [defaultCashAccountId, setDefaultCashAccountId] = useState('');

  const makeEmptyForm = () => ({
    voucherDate: new Date().toISOString().split('T')[0],
    cashAccountId: defaultCashAccountId || '',
    payerType: 'other',
    payerName: '',
    referenceNumber: '',
    description: '',
    paymentMethod: 'cash',
    lines: [emptyLine()],
  });

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crvApi.list({ limit: 50 });
      setVouchers(res.data || []);
      setTotal(res.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await accountApi.getAll({ limit: 500 });
      const all = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      // For CRV credit lines, allow income, receivable, liability, equity accounts
      const creditAccounts = all.filter(a => {
        const type = (a.type || a.accountType || '').toLowerCase();
        return type === 'income' || type === 'revenue' || type === 'other income'
          || type === 'accounts receivable' || type === 'accounts_receivable'
          || type === 'liability' || type === 'equity' || type === 'other'
          || type === 'customer advance' || type === 'customer_advance';
      });
      setAccounts(creditAccounts);
      const cashAccs = all.filter(a => {
        const type = (a.type || a.accountType || '').toLowerCase();
        const name = (a.name || '').toLowerCase();
        return type === 'cash' || type === 'bank' || name.includes('cash') || name.includes('petty');
      });
      setCashAccounts(cashAccs);

      // Load default cash account from system config
      try {
        const cfgRes = await axiosInstance.get('/settings');
        const configMap = cfgRes.data?.data?.configs || cfgRes.data?.configs || cfgRes.data || {};
        const purchaseCfg = configMap.purchase || {};
        const defaultCashId = purchaseCfg.default_cash_account;
        console.log('Default cash account from config:', defaultCashId, 'available cash accounts:', cashAccs.length);
        if (defaultCashId && cashAccs.some(a => a.id === defaultCashId)) {
          setDefaultCashAccountId(defaultCashId);
        }
      } catch { /* ignore */ }
    } catch (err) { console.error('Failed to load accounts:', err); }
  }, []);

  useEffect(() => { loadVouchers(); loadAccounts(); }, [loadVouchers, loadAccounts]);

  const openCreate = () => {
    setSelected(null);
    setForm(makeEmptyForm());
    setError(null);
    setDialog(true);
  };

  const openEdit = async (v) => {
    try {
      const res = await crvApi.getById(v.id);
      const d = res.data;
      setSelected(d);
      setForm({
        voucherDate: d.voucherDate?.split('T')[0] || '',
        cashAccountId: d.cashAccountId || '',
        payerType: d.payerType || 'other',
        payerName: d.payerName || '',
        referenceNumber: d.referenceNumber || '',
        description: d.description || '',
        paymentMethod: d.paymentMethod || 'cash',
        lines: (d.lines || []).map(l => ({
          accountId: l.accountId || '',
          description: l.description || '',
          amount: l.amount?.toString() || '',
          taxRate: l.taxRate?.toString() || '0',
          taxAmount: l.taxAmount?.toString() || '0',
        })),
      });
      if (d.lines?.length === 0) setForm(f => ({ ...f, lines: [emptyLine()] }));
      setError(null);
      setDialog(true);
    } catch (err) { console.error(err); }
  };

  const openView = async (v) => {
    try {
      const res = await crvApi.getById(v.id);
      setSelected(res.data);
      setViewDialog(true);
    } catch (err) { console.error(err); }
  };

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = (idx) => {
    if (form.lines.length <= 1) return;
    setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  };
  const updateLine = (idx, field, value) => {
    setForm(f => {
      const lines = [...f.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      if (field === 'amount' || field === 'taxRate') {
        const amt = parseFloat(lines[idx].amount || 0);
        const rate = parseFloat(lines[idx].taxRate || 0);
        lines[idx].taxAmount = ((amt * rate) / 100).toFixed(2);
      }
      return { ...f, lines };
    });
  };

  const calcTotals = () => {
    const subtotal = form.lines.reduce((s, l) => s + parseFloat(l.amount || 0), 0);
    const taxAmt = form.lines.reduce((s, l) => s + parseFloat(l.taxAmount || 0), 0);
    return { subtotal, taxAmt, total: subtotal + taxAmt };
  };

  const handleSave = async () => {
    if (!form.cashAccountId) { setError('Please select a cash account'); return; }
    if (form.lines.some(l => !l.accountId || parseFloat(l.amount) <= 0)) {
      setError('Please fill all lines with account and amount'); return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        lines: form.lines.map(l => ({
          accountId: l.accountId,
          description: l.description,
          amount: parseFloat(l.amount),
          taxRate: parseFloat(l.taxRate || 0),
          taxAmount: parseFloat(l.taxAmount || 0),
        })),
      };
      if (selected) {
        await crvApi.update(selected.id, payload);
      } else {
        await crvApi.create(payload);
      }
      setDialog(false);
      loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePost = async (id) => {
    try { await crvApi.post(id); loadVouchers(); }
    catch (err) { alert(err.response?.data?.message || 'Post failed'); }
  };

  const handleReverse = async (id) => {
    if (!window.confirm('Reverse this CRV? This creates an opposite journal entry.')) return;
    try { await crvApi.reverse(id); loadVouchers(); }
    catch (err) { alert(err.response?.data?.message || 'Reverse failed'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this CRV?')) return;
    try { await crvApi.cancel(id); loadVouchers(); }
    catch (err) { alert(err.response?.data?.message || 'Cancel failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this CRV?')) return;
    try { await crvApi.delete(id); loadVouchers(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const statusColor = (s) => {
    switch (s) { case 'posted': return 'success'; case 'draft': return 'default'; case 'cancelled': return 'error'; case 'reversed': return 'warning'; case 'approved': return 'info'; default: return 'default'; }
  };

  const t = calcTotals();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Cash Receipt Vouchers</Typography>
          <Typography variant="body1" color="text.secondary">Record cash receipts from customers and other sources</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ fontWeight: 600 }}>
          New CRV
        </Button>
      </Box>

      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CRV #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Received From</TableCell>
                <TableCell>Cash Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vouchers.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">No CRVs found</TableCell></TableRow>
              )}
              {vouchers.map(v => (
                <TableRow key={v.id} hover>
                  <TableCell><Typography fontWeight={600}>{v.voucherNumber}</Typography></TableCell>
                  <TableCell>{v.voucherDate}</TableCell>
                  <TableCell>{v.payerName || '-'}</TableCell>
                  <TableCell>{v.cashAccountName || '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(v.totalAmount)}</TableCell>
                  <TableCell><Chip label={v.status} color={statusColor(v.status)} size="small" /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="View"><IconButton size="small" onClick={() => openView(v)}><Visibility /></IconButton></Tooltip>
                    {v.status === 'draft' && (
                      <>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(v)}><Edit /></IconButton></Tooltip>
                        <Tooltip title="Post"><IconButton size="small" color="success" onClick={() => handlePost(v.id)}><PostAdd /></IconButton></Tooltip>
                        <Tooltip title="Cancel"><IconButton size="small" color="error" onClick={() => handleCancel(v.id)}><Cancel /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(v.id)}><Delete /></IconButton></Tooltip>
                      </>
                    )}
                    {v.status === 'posted' && (
                      <Tooltip title="Reverse"><IconButton size="small" color="warning" onClick={() => handleReverse(v.id)}><Undo /></IconButton></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selected ? 'Edit CRV' : 'New Cash Receipt Voucher'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6} sm={3}>
              <TextField label="Voucher Date" type="date" fullWidth InputLabelProps={{ shrink: true }}
                value={form.voucherDate} onChange={e => setForm(f => ({ ...f, voucherDate: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select label="Cash Account" fullWidth value={form.cashAccountId}
                onChange={e => setForm(f => ({ ...f, cashAccountId: e.target.value }))}>
                {cashAccounts.map(a => <MenuItem key={a.id} value={a.id}>{a.code} - {a.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select label="Payer Type" fullWidth value={form.payerType}
                onChange={e => setForm(f => ({ ...f, payerType: e.target.value }))}>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Received From" fullWidth value={form.payerName}
                onChange={e => setForm(f => ({ ...f, payerName: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Reference #" fullWidth value={form.referenceNumber}
                onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Description / Narration" fullWidth multiline rows={2}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Grid>
          </Grid>

          {/* Lines */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Income Lines</Typography>
          {form.lines.map((line, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mb: 1 }} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField select label="Account" fullWidth size="small" value={line.accountId}
                  onChange={e => updateLine(idx, 'accountId', e.target.value)}>
                  {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.code} - {a.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Description" fullWidth size="small" value={line.description}
                  onChange={e => updateLine(idx, 'description', e.target.value)} />
              </Grid>
              <Grid item xs={4} sm={2}>
                <TextField label="Amount" type="number" fullWidth size="small" value={line.amount}
                  onChange={e => updateLine(idx, 'amount', e.target.value)} />
              </Grid>
              <Grid item xs={3} sm={1.5}>
                <TextField label="Tax %" type="number" fullWidth size="small" value={line.taxRate}
                  onChange={e => updateLine(idx, 'taxRate', e.target.value)} />
              </Grid>
              <Grid item xs={3} sm={1.5}>
                <TextField label="Tax Amt" type="number" fullWidth size="small" value={line.taxAmount}
                  InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={2} sm={1}>
                <IconButton size="small" color="error" onClick={() => removeLine(idx)}><Delete /></IconButton>
              </Grid>
            </Grid>
          ))}
          <Button size="small" startIcon={<Add />} onClick={addLine} sx={{ mt: 1 }}>Add Line</Button>

          {/* Totals */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between"><Typography>Subtotal:</Typography><Typography fontWeight={600}>{formatCurrency(t.subtotal)}</Typography></Box>
            <Box display="flex" justifyContent="space-between"><Typography>Tax:</Typography><Typography fontWeight={600}>{formatCurrency(t.taxAmt)}</Typography></Box>
            <Box display="flex" justifyContent="space-between" mt={1} pt={1} borderTop="1px solid" borderColor="divider">
              <Typography fontWeight={700}>Total Receipt:</Typography>
              <Typography fontWeight={700} color="success.main" fontSize="1.1rem">{formatCurrency(t.total)}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : selected ? 'Update' : 'Save CRV'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>CRV Details - {selected?.voucherNumber}</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><Typography variant="caption">Voucher #</Typography><Typography fontWeight={600}>{selected.voucherNumber}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption">Date</Typography><Typography>{selected.voucherDate}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption">Status</Typography><Chip label={selected.status} color={statusColor(selected.status)} size="small" /></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption">Cash Account</Typography><Typography>{selected.cashAccount?.code} - {selected.cashAccount?.name}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption">Received From</Typography><Typography>{selected.payerName || '-'} ({selected.payerType})</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption">Reference</Typography><Typography>{selected.referenceNumber || '-'}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption">Description</Typography><Typography>{selected.description || '-'}</Typography></Grid>
              {selected.journalEntry && (
                <Grid item xs={12}><Typography variant="caption">Journal Entry</Typography><Typography>{selected.journalEntry.entryNumber}</Typography></Grid>
              )}
            </Grid>
          )}
          {selected?.lines?.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight={600}>Lines</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>#</TableCell><TableCell>Account</TableCell><TableCell>Description</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Tax</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
                  <TableBody>
                    {selected.lines.map((l, i) => (
                      <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell>{l.accountCode} - {l.accountName}</TableCell><TableCell>{l.description}</TableCell>
                        <TableCell align="right">{formatCurrency(l.amount)}</TableCell>
                        <TableCell align="right">{formatCurrency(l.taxAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(l.totalAmount)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          <Box mt={2} display="flex" justifyContent="space-between">
            <Typography>Total:</Typography>
            <Typography fontWeight={700}>{formatCurrency(selected?.totalAmount || 0)}</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CashReceiptVouchers;
