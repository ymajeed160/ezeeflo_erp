import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, CircularProgress, Tooltip, Card, Divider, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Autocomplete,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Visibility,
  CheckCircle, Cancel, Close, Undo, Print,
} from '@mui/icons-material';
import {
  fetchPurchaseReturns,
  fetchPurchaseReturn,
  createPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn,
  cancelPurchaseReturn,
  approvePurchaseReturn,
  rejectPurchaseReturn,
  reversePurchaseReturn,
  fetchReturnableLines,
} from '../store/slices/purchaseReturnSlice';
import purchaseInvoiceApi from '../services/purchaseInvoiceApi';
import supplierApi from '../services/supplierApi';

const statusColors = {
  draft: 'warning',
  approved: 'success',
  posted: 'info',
  rejected: 'error',
  reversed: 'secondary',
};

const PurchaseReturns = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { items, currentPage, pageSize, totalPages, loading, error } = useSelector(
    (state) => state.purchaseReturns
  );

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [formData, setFormData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    purchaseInvoiceId: '',
    notes: '',
    details: [],
  });
  const [invoices, setInvoices] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [confirmState, setConfirmState] = useState(null); // { title, message, action }
  const [reasonDialog, setReasonDialog] = useState({ open: false, action: null, target: null });
  const [reasonText, setReasonText] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const loadInvoices = useCallback(async () => {
    try {
      const res = await purchaseInvoiceApi.list({ status: 'posted', limit: 999 });
      const list = res.data?.data || res.data?.items || res.data || [];
      setInvoices(list);
    } catch (err) {
      console.error('Failed to load posted invoices', err);
    }
  }, []);

  useEffect(() => {
    const params = { page: currentPage, pageSize, status: statusFilter, search: searchTerm, supplierId: supplierFilter };
    dispatch(fetchPurchaseReturns(params));
  }, [dispatch, currentPage, pageSize, statusFilter, supplierFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    supplierApi.getAll({ limit: 999 })
      .then((res) => setSuppliers(res.data || []))
      .catch(() => {});
  }, []);

  // Deep-link support: /purchase-returns/new?invoiceId=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invoiceId = params.get('invoiceId');
    if (invoiceId) {
      handleOpenCreate(invoiceId);
    }
  }, [location.search]);

  const loadReturnable = async (invoiceId, currentDetails = []) => {
    if (!invoiceId) { setFormData(prev => ({ ...prev, details: [] })); return; }
    setLoadingLines(true);
    try {
      const res = await dispatch(fetchReturnableLines(invoiceId)).unwrap();
      if (currentDetails && currentDetails.length) {
        const merged = (res.lines || []).map((l) => {
          const existing = currentDetails.find(
            (d) => d.purchaseInvoiceLineId === l.purchaseInvoiceLineId || d.itemId === l.itemId
          );
          return {
            ...l,
            returnQty: existing ? parseFloat(existing.quantity || 0) : 0,
            maxQty: parseFloat(l.availableQty) + (existing ? parseFloat(existing.quantity || 0) : 0),
          };
        });
        setFormData((prev) => ({ ...prev, details: merged }));
      } else {
        const merged = (res.lines || []).map((l) => ({ ...l, returnQty: 0, maxQty: parseFloat(l.availableQty) }));
        setFormData((prev) => ({ ...prev, details: merged }));
      }
    } catch (err) {
      console.error('Failed to load returnable lines', err);
      setFormData((prev) => ({ ...prev, details: [] }));
    } finally {
      setLoadingLines(false);
    }
  };

  const handleOpenCreate = async (invoiceId) => {
    setEditMode(false);
    setFormData({
      returnDate: new Date().toISOString().split('T')[0],
      purchaseInvoiceId: invoiceId || '',
      notes: '',
      details: [],
    });
    setShowModal(true);
    if (invoiceId) await loadReturnable(invoiceId, []);
  };

  const handleSelectInvoice = (invoiceId) => {
    setFormData((prev) => ({ ...prev, purchaseInvoiceId: invoiceId }));
    loadReturnable(invoiceId, []);
  };

  const handleSearch = useCallback(() => {
    dispatch(fetchPurchaseReturns({ page: 1, pageSize, search: searchTerm, status: statusFilter, supplierId: supplierFilter }));
  }, [dispatch, pageSize, searchTerm, statusFilter, supplierFilter]);

  const handleOpenEdit = async (item) => {
    setEditMode(true);
    setFormData({
      id: item.id,
      returnNumber: item.returnNumber,
      returnDate: item.returnDate ? item.returnDate.split('T')[0] : '',
      purchaseInvoiceId: item.purchaseInvoiceId || '',
      notes: item.notes || '',
      details: [],
    });
    setShowModal(true);
    if (item.purchaseInvoiceId) {
      const currentDetails = (item.details || []).map((d) => ({
        purchaseInvoiceLineId: d.purchaseInvoiceLineId,
        itemId: d.itemId,
        quantity: d.quantity,
      }));
      await loadReturnable(item.purchaseInvoiceId, currentDetails);
    }
  };

  const handleOpenView = async (item) => {
    setShowViewModal(true);
    setViewData(null);
    setViewLoading(true);
    try {
      const full = await dispatch(fetchPurchaseReturn(item.id)).unwrap();
      setViewData(full);
    } catch (err) {
      console.error('Failed to load return details', err);
      setViewData(item);
    } finally {
      setViewLoading(false);
    }
  };
  const openConfirm = (title, message, action) => setConfirmState({ title, message, action });
  const closeConfirm = () => setConfirmState(null);
  const handleDelete = (id) => { setReasonDialog({ open: true, action: 'delete', target: id }); setReasonText(''); };
  const handleReject = (id) => { setReasonDialog({ open: true, action: 'cancel', target: id }); setReasonText(''); };
  const handleReasonConfirm = async () => {
    const { action, target } = reasonDialog;
    setReasonDialog({ open: false, action: null, target: null });
    if (!target) return;
    if (action === 'delete') {
      await dispatch(deletePurchaseReturn({ id: target, reason: reasonText || null }));
    } else if (action === 'cancel') {
      await dispatch(cancelPurchaseReturn({ id: target, reason: reasonText || null }));
    }
    setReasonText('');
    dispatch(fetchPurchaseReturns({ page: currentPage, pageSize, status: statusFilter, search: searchTerm, supplierId: supplierFilter }));
  };
  const handleApprove = (id) => openConfirm('Approve Purchase Return', 'Approve this purchase return? Inventory will be reduced and accounting entries posted.', () => dispatch(approvePurchaseReturn(id)));
  const handleReverse = (id) => openConfirm('Reverse Purchase Return', 'Reverse this purchase return? Inventory and accounting will be reversed.', () => dispatch(reversePurchaseReturn(id)));

  const exportExcel = () => {
    const header = ['Return #', 'Date', 'Supplier', 'Invoice #', 'Warehouse', 'Total', 'Status'];
    const rows = items.map((r) => [
      r.returnNumber, r.returnDate?.split('T')[0] || '', r.supplierName || '',
      r.purchaseInvoiceNumber || '', r.warehouseName || '', fmt(r.totalAmount), r.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'purchase_returns.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const buildPrintWindow = (title, headerHtml, rowsHtml) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(
      `<html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #333;padding:6px;font-size:12px}th{background:#f0f0f0}</style></head>` +
      `<body><h2>${title}</h2>${headerHtml}<table>${rowsHtml}</table><script>window.onload=()=>{window.print();}</script></body></html>`
    );
    printWin.document.close();
  };

  const exportPdf = () => {
    const rowsHtml = items.map((r) =>
      `<tr><td>${r.returnNumber || ''}</td><td>${r.returnDate?.split('T')[0] || ''}</td><td>${r.supplierName || ''}</td><td>${r.purchaseInvoiceNumber || ''}</td><td>${r.warehouseName || ''}</td><td>${fmt(r.totalAmount)}</td><td>${r.status || ''}</td></tr>`
    ).join('');
    buildPrintWindow(
      'Purchase Returns',
      '<table><thead><tr><th>Return #</th><th>Date</th><th>Supplier</th><th>Invoice #</th><th>Warehouse</th><th>Total</th><th>Status</th></tr></thead><tbody>',
      rowsHtml + '</tbody></table>'
    );
  };

  const printReturn = () => {
    if (!viewData) return;
    const linesHtml = (viewData.details || []).map((l) =>
      `<tr><td>${l.itemName || l.itemId || ''}</td><td>${l.quantity}</td><td>${fmt(l.unitCost)}</td><td>${l.taxRate}%</td><td>${fmt(l.lineTotal || (parseFloat(l.quantity || 0) * parseFloat(l.unitCost || 0) * (1 + parseFloat(l.taxRate || 0) / 100)))}</td></tr>`
    ).join('');
    buildPrintWindow(
      `Purchase Return ${viewData.returnNumber || ''}`,
      `<p><strong>Supplier:</strong> ${viewData.supplierName || '-'} &nbsp; <strong>Warehouse:</strong> ${viewData.warehouseName || '-'} &nbsp; <strong>Invoice:</strong> ${viewData.purchaseInvoiceNumber || '-'} &nbsp; <strong>Date:</strong> ${viewData.returnDate?.split('T')[0] || ''} &nbsp; <strong>Status:</strong> ${viewData.status || ''}</p><table><thead><tr><th>Item</th><th>Return Qty</th><th>Unit Cost</th><th>Tax %</th><th>Total</th></tr></thead><tbody>`,
      linesHtml + '</tbody></table>'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const details = formData.details
      .filter((d) => parseFloat(d.returnQty || 0) > 0)
      .map((d) => ({
        purchaseInvoiceLineId: d.purchaseInvoiceLineId,
        itemId: d.itemId,
        quantity: parseFloat(d.returnQty || 0),
      }));

    if (!formData.purchaseInvoiceId) { alert('Please select a Purchase Invoice'); return; }
    if (!details.length) { alert('Enter at least one return quantity'); return; }

    const payload = {
      returnDate: formData.returnDate,
      referenceType: 'purchase_invoice',
      purchaseInvoiceId: formData.purchaseInvoiceId,
      notes: formData.notes,
      details,
    };

    if (editMode && formData.id) await dispatch(updatePurchaseReturn({ id: formData.id, data: payload }));
    else await dispatch(createPurchaseReturn(payload));
    setShowModal(false);
  };

  const updateLineQty = (idx, value) => {
    const v = parseFloat(value) || 0;
    setFormData((prev) => {
      const details = [...prev.details];
      details[idx] = { ...details[idx], returnQty: Math.min(v, parseFloat(details[idx].maxQty || 0)) };
      return { ...prev, details };
    });
  };

  const lineTotal = (line) => {
    const q = parseFloat(line.returnQty || 0);
    const unitCost = parseFloat(line.unitCost || 0);
    const taxPercent = parseFloat(line.taxPercent || 0);
    const net = q * unitCost;
    return net + (net * taxPercent / 100);
  };
  const getTotal = () => formData.details.reduce((sum, line) => sum + lineTotal(line), 0);
  const fmt = (num) => parseFloat(num || 0).toFixed(2);

  const selectedInvoice = invoices.find((i) => i.id === formData.purchaseInvoiceId);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Purchase Returns</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenCreate('')}>New Purchase Return</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="end">
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Search" placeholder="Return #, Notes..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="posted">Posted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="reversed">Reversed</MenuItem>
              </Select></FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small"><InputLabel>Supplier</InputLabel>
              <Select value={supplierFilter} label="Supplier" onChange={(e) => setSupplierFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name || s.supplierName}</MenuItem>)}
              </Select></FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={() => { setSearchTerm(''); setStatusFilter(''); setSupplierFilter('');
                dispatch(fetchPurchaseReturns({ page: 1, pageSize })); }}>Clear</Button>
              <Button variant="outlined" color="success" onClick={exportExcel}>Excel</Button>
              <Button variant="outlined" color="error" onClick={exportPdf}>PDF</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Return #', 'Date', 'Supplier', 'Invoice #', 'Warehouse', 'Total', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}
                    align={h === 'Total' ? 'right' : h === 'Actions' ? 'center' : 'left'}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No purchase returns found</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600} color="primary.dark">{item.returnNumber}</Typography></TableCell>
                  <TableCell>{item.returnDate?.split('T')[0] || ''}</TableCell>
                  <TableCell>{item.supplierName || '-'}</TableCell>
                  <TableCell>{item.purchaseInvoiceNumber || '-'}</TableCell>
                  <TableCell>{item.warehouseName || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(item.totalAmount)}</TableCell>
                  <TableCell>
                    <Chip label={item.status} color={statusColors[item.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {item.status === 'draft' && <>
                        <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(item.id)}><CheckCircle fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleReject(item.id)}><Cancel fontSize="small" /></IconButton></Tooltip>
                      </>}
                      {(item.status === 'approved' || item.status === 'posted') && (
                        <Tooltip title="Reverse"><IconButton size="small" color="warning" onClick={() => handleReverse(item.id)}><Undo fontSize="small" /></IconButton></Tooltip>
                      )}
                      <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => handleOpenView(item)}><Visibility fontSize="small" /></IconButton></Tooltip>
                      {item.status === 'draft' && <>
                        <Tooltip title="Edit"><IconButton size="small" color="warning" onClick={() => handleOpenEdit(item)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </>}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && <><Divider /><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, p: 1.5 }}>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <Button key={p} size="small" variant={p === currentPage ? 'contained' : 'outlined'}
              onClick={() => dispatch(fetchPurchaseReturns({ page: p, pageSize, status: statusFilter, search: searchTerm, supplierId: supplierFilter }))}
              sx={{ minWidth: 36, height: 36 }}>{p}</Button>
          ))}
        </Box></>}
      </Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editMode ? 'Edit Purchase Return' : 'New Purchase Return (Invoice-based)'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="return-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {editMode && formData.returnNumber && <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Return Number" value={formData.returnNumber} disabled />
              </Grid>}
              <Grid item xs={12} sm={editMode ? 3 : 4}>
                <TextField fullWidth size="small" label="Return Date" type="date" required value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={editMode ? 6 : 8}>
                <Autocomplete
                  size="small"
                  options={invoices}
                  getOptionLabel={(o) => o.invoiceNumber || ''}
                  value={selectedInvoice || null}
                  onChange={(e, val) => handleSelectInvoice(val ? val.id : '')}
                  disabled={editMode}
                  renderInput={(params) => (
                    <TextField {...params} label="Purchase Invoice (posted)" required
                      helperText={selectedInvoice ? `Supplier: ${selectedInvoice.supplier?.name || ''} • Total: ${fmt(selectedInvoice.totalAmount)}` : 'Select a posted invoice'} />
                  )}
                />
              </Grid>
            </Grid>
            <TextField fullWidth size="small" label="Notes" multiline rows={2} sx={{ mb: 2 }}
              value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">Return Lines</Typography>
              {loadingLines && <CircularProgress size={18} />}
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Invoiced</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Returned</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Available</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Unit Cost</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tax %</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Return Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {formData.details.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                      {formData.purchaseInvoiceId ? 'No lines available' : 'Select a purchase invoice to load its lines'}
                    </TableCell></TableRow>
                  ) : formData.details.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{line.itemName || line.itemId}</Typography>
                        {line.description && <Typography variant="caption" color="text.secondary">{line.description}</Typography>}
                      </TableCell>
                      <TableCell align="right">{line.invoicedQty}</TableCell>
                      <TableCell align="right">{line.returnedQty ?? 0}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: parseFloat(line.availableQty) > 0 ? 'success.main' : 'text.disabled' }}>{line.availableQty}</TableCell>
                      <TableCell align="right">{fmt(line.unitCost)}</TableCell>
                      <TableCell align="right">{line.taxPercent}%</TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={line.returnQty || ''}
                          onChange={(e) => updateLineQty(idx, e.target.value)}
                          inputProps={{ min: 0, max: line.maxQty ?? line.availableQty, step: 'any', style: { textAlign: 'right' } }}
                          sx={{ width: 90 }} placeholder="0" />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(lineTotal(line))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ textAlign: 'right' }}>Grand Total: {fmt(getTotal())}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button type="submit" form="return-form" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : (editMode ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Purchase Return Details</DialogTitle>
        <DialogContent dividers>
          {viewLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}
          {!viewLoading && viewData && (<>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Return #:</Typography><Typography variant="body2">{viewData.returnNumber}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Date:</Typography><Typography variant="body2">{viewData.returnDate?.split('T')[0]}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Status:</Typography><Chip label={viewData.status} color={statusColors[viewData.status] || 'default'} size="small" /></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Supplier:</Typography><Typography variant="body2">{viewData.supplierName || '-'}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Warehouse:</Typography><Typography variant="body2">{viewData.warehouseName || '-'}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Invoice:</Typography><Typography variant="body2">{viewData.purchaseInvoiceNumber || '-'}</Typography></Grid>
            </Grid>
            {viewData.notes && <Typography variant="body2" sx={{ mb: 2 }}><strong>Notes:</strong> {viewData.notes}</Typography>}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small"><TableHead><TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Item</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Return Qty</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Unit Cost</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Tax %</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
              </TableRow></TableHead>
              <TableBody>{(viewData.details || []).length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>No items found</TableCell></TableRow>
              ) : (viewData.details || []).map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell>{line.itemName || line.itemId}</TableCell>
                  <TableCell align="right">{line.quantity}</TableCell>
                  <TableCell align="right">{fmt(line.unitCost)}</TableCell>
                  <TableCell align="right">{line.taxRate}%</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(line.lineTotal || (parseFloat(line.quantity || 0) * parseFloat(line.unitCost || 0) * (1 + parseFloat(line.taxRate || 0) / 100)))}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </TableContainer>
          </>)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewModal(false)} startIcon={<Close />}>Close</Button>
          {viewData && <Button onClick={printReturn} startIcon={<Print />}>Print</Button>}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmState)} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmState?.title || 'Confirm'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{confirmState?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => { const action = confirmState?.action; closeConfirm(); if (action) action(); }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reason Dialog for Delete/Cancel */}
      <Dialog open={reasonDialog.open} onClose={() => setReasonDialog({ open: false, action: null, target: null })} fullWidth maxWidth="sm">
        <DialogTitle>{reasonDialog.action === 'delete' ? 'Delete Purchase Return' : 'Reject Purchase Return'}</DialogTitle>
        <DialogContent>
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

export default PurchaseReturns;