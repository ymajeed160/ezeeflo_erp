import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, CircularProgress, Tooltip, Card, Divider, InputAdornment,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Visibility,
  CheckCircle, Cancel, Close,
} from '@mui/icons-material';
import {
  fetchPurchaseReturns,
  createPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn,
  approvePurchaseReturn,
  rejectPurchaseReturn,
} from '../store/slices/purchaseReturnSlice';
import SupplierApi from '../services/supplierApi';
import ItemApi from '../services/itemApi';
import WarehouseApi from '../services/warehouseApi';

const statusColors = {
  Draft: 'warning',
  Approved: 'success',
  Rejected: 'error',
};

const emptyDetail = () => ({ itemId: '', orderedQuantity: 0, returnQuantity: 0, unitPrice: 0, tax: 0, discount: 0 });

const PurchaseReturns = () => {
  const dispatch = useDispatch();
  const { items, currentPage, pageSize, totalPages, loading, error } = useSelector(
    (state) => state.purchaseReturns
  );

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [formData, setFormData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    warehouseId: '',
    notes: '',
    details: [emptyDetail()],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [itemList, setItemList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    dispatch(fetchPurchaseReturns({ page: currentPage, pageSize, status: statusFilter, search: searchTerm, supplierId: supplierFilter }));
  }, [dispatch, currentPage, pageSize, statusFilter, supplierFilter]);

  useEffect(() => {
    const loadDropdown = async () => {
      try {
        const [sr, ir, wr] = await Promise.all([
          SupplierApi.getAll({ pageSize: 500 }),
          ItemApi.getAll({ pageSize: 500 }),
          WarehouseApi.getAll({ pageSize: 100 }),
        ]);
        setSuppliers(sr.data?.items || sr.data?.data || []);
        setItemList(ir.data?.items || ir.data?.data || []);
        setWarehouses(wr.data?.items || wr.data?.data || []);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
      }
    };
    loadDropdown();
  }, []);

  const handleSearch = useCallback(() => {
    dispatch(fetchPurchaseReturns({ page: 1, pageSize, search: searchTerm, status: statusFilter, supplierId: supplierFilter }));
  }, [dispatch, pageSize, searchTerm, statusFilter, supplierFilter]);

  const handleOpenCreate = () => {
    setEditMode(false);
    setFormData({ returnDate: new Date().toISOString().split('T')[0], supplierId: '', warehouseId: '', notes: '', details: [emptyDetail()] });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setFormData({
      id: item.id, returnNumber: item.returnNumber,
      returnDate: item.returnDate ? item.returnDate.split('T')[0] : '',
      supplierId: item.supplierId || '', warehouseId: item.warehouseId || '', notes: item.notes || '',
      details: (item.details || []).map(d => ({
        itemId: d.itemId, orderedQuantity: d.orderedQuantity || 0, returnQuantity: d.returnQuantity || 0,
        unitPrice: d.unitPrice || 0, tax: d.tax || 0, discount: d.discount || 0,
      })),
    });
    setShowModal(true);
  };

  const handleOpenView = (item) => { setViewData(item); setShowViewModal(true); };
  const handleDelete = (id) => { if (window.confirm('Delete this purchase return?')) dispatch(deletePurchaseReturn(id)); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, details: formData.details.map(d => ({
      itemId: d.itemId, returnQuantity: parseFloat(d.returnQuantity) || 0, unitPrice: parseFloat(d.unitPrice) || 0,
      tax: parseFloat(d.tax) || 0, discount: parseFloat(d.discount) || 0,
    })) };
    if (editMode && formData.id) await dispatch(updatePurchaseReturn({ id: formData.id, data: payload }));
    else await dispatch(createPurchaseReturn(payload));
    setShowModal(false);
  };
  const handleApprove = (id) => { if (window.confirm('Approve this purchase return?')) dispatch(approvePurchaseReturn(id)); };
  const handleReject = (id) => { if (window.confirm('Reject this purchase return?')) dispatch(rejectPurchaseReturn(id)); };
  const addLine = () => setFormData(prev => ({ ...prev, details: [...prev.details, emptyDetail()] }));
  const removeLine = (i) => { if (formData.details.length > 1) setFormData(prev => ({ ...prev, details: prev.details.filter((_, idx) => idx !== i) })); };
  const updateLine = (i, f, v) => { const d = [...formData.details]; d[i] = { ...d[i], [f]: v }; setFormData(prev => ({ ...prev, details: d })); };
  const lineTotal = (line) => { const s = (parseFloat(line.returnQuantity || 0) * parseFloat(line.unitPrice || 0)) - parseFloat(line.discount || 0); return s + (s * (parseFloat(line.tax || 0) / 100)); };
  const getTotal = () => formData.details.reduce((sum, line) => sum + lineTotal(line), 0);
  const fmt = (num) => parseFloat(num || 0).toFixed(2);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Purchase Returns</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>New Purchase Return</Button>
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
                <MenuItem value="">All</MenuItem><MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem><MenuItem value="Rejected">Rejected</MenuItem>
              </Select></FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small"><InputLabel>Supplier</InputLabel>
              <Select value={supplierFilter} label="Supplier" onChange={(e) => setSupplierFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>{suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.supplierName}</MenuItem>)}
              </Select></FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={() => { setSearchTerm(''); setStatusFilter(''); setSupplierFilter('');
                dispatch(fetchPurchaseReturns({ page: 1, pageSize })); }}>Clear</Button>
              <Button variant="outlined" color="success">Excel</Button>
              <Button variant="outlined" color="error">PDF</Button>
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
                  <TableCell>{item.supplier?.supplierName || '-'}</TableCell>
                  <TableCell>{item.purchaseInvoice?.invoiceNumber || '-'}</TableCell>
                  <TableCell>{item.warehouse?.warehouseName || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(item.totalAmount)}</TableCell>
                  <TableCell><Chip label={item.status} color={statusColors[item.status] || 'default'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {item.status === 'Draft' && <>
                        <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(item.id)}><CheckCircle fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleReject(item.id)}><Cancel fontSize="small" /></IconButton></Tooltip>
                      </>}
                      <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => handleOpenView(item)}><Visibility fontSize="small" /></IconButton></Tooltip>
                      {item.status === 'Draft' && <>
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
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Purchase Return' : 'New Purchase Return'}</DialogTitle>
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
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" required><InputLabel>Supplier</InputLabel>
                  <Select value={formData.supplierId} label="Supplier" onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}>
                    <MenuItem value="">Select Supplier</MenuItem>{suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.supplierName}</MenuItem>)}
                  </Select></FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small"><InputLabel>Warehouse</InputLabel>
                  <Select value={formData.warehouseId} label="Warehouse" onChange={(e) => setFormData(prev => ({ ...prev, warehouseId: e.target.value }))}>
                    <MenuItem value="">Select</MenuItem>{warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.warehouseName}</MenuItem>)}
                  </Select></FormControl>
              </Grid>
            </Grid>
            <TextField fullWidth size="small" label="Notes" multiline rows={2} sx={{ mb: 2 }}
              value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">Return Lines</Typography>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={addLine}>Add Line</Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Item</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Ordered Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Return Qty</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tax %</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Discount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell><TableCell sx={{ width: 40 }}></TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {formData.details.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell><FormControl fullWidth size="small"><Select value={line.itemId} onChange={(e) => updateLine(idx, 'itemId', e.target.value)} displayEmpty>
                        <MenuItem value="">Select</MenuItem>{itemList.map(i => <MenuItem key={i.id} value={i.id}>{i.itemCode} - {i.name || i.itemName || ''}</MenuItem>)}
                      </Select></FormControl></TableCell>
                      <TableCell><TextField size="small" type="number" value={line.orderedQuantity} sx={{ width: 80 }} inputProps={{ style: { textAlign: 'right' } }} disabled /></TableCell>
                      <TableCell><TextField size="small" type="number" value={line.returnQuantity} onChange={(e) => updateLine(idx, 'returnQuantity', e.target.value)} sx={{ width: 80 }} inputProps={{ min: 0, step: 'any', style: { textAlign: 'right' } }} required /></TableCell>
                      <TableCell><TextField size="small" type="number" value={line.unitPrice} onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)} sx={{ width: 100 }} inputProps={{ min: 0, step: 'any', style: { textAlign: 'right' } }} /></TableCell>
                      <TableCell><TextField size="small" type="number" value={line.tax} onChange={(e) => updateLine(idx, 'tax', e.target.value)} sx={{ width: 70 }} inputProps={{ min: 0, step: 'any', style: { textAlign: 'right' } }} /></TableCell>
                      <TableCell><TextField size="small" type="number" value={line.discount} onChange={(e) => updateLine(idx, 'discount', e.target.value)} sx={{ width: 90 }} inputProps={{ min: 0, step: 'any', style: { textAlign: 'right' } }} /></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmt(lineTotal(line))}</Typography></TableCell>
                      <TableCell><IconButton size="small" color="error" onClick={() => removeLine(idx)} disabled={formData.details.length <= 1}><Delete fontSize="small" /></IconButton></TableCell>
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
          {viewData && (<>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Return #:</Typography><Typography variant="body2">{viewData.returnNumber}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Date:</Typography><Typography variant="body2">{viewData.returnDate?.split('T')[0]}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Status:</Typography><Chip label={viewData.status} color={statusColors[viewData.status] || 'default'} size="small" /></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Supplier:</Typography><Typography variant="body2">{viewData.supplier?.supplierName || '-'}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Warehouse:</Typography><Typography variant="body2">{viewData.warehouse?.warehouseName || '-'}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" fontWeight={600}>Invoice:</Typography><Typography variant="body2">{viewData.purchaseInvoice?.invoiceNumber || '-'}</Typography></Grid>
            </Grid>
            {viewData.notes && <Typography variant="body2" sx={{ mb: 2 }}><strong>Notes:</strong> {viewData.notes}</Typography>}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small"><TableHead><TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Item</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Return Qty</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Tax %</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Discount</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
              </TableRow></TableHead>
              <TableBody>{(viewData.details || []).map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell>{line.item?.name || line.item?.itemName || line.itemId}</TableCell>
                  <TableCell align="right">{line.returnQuantity}</TableCell>
                  <TableCell align="right">{fmt(line.unitPrice)}</TableCell>
                  <TableCell align="right">{line.tax}%</TableCell>
                  <TableCell align="right">{fmt(line.discount)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt((parseFloat(line.returnQuantity || 0) * parseFloat(line.unitPrice || 0) - parseFloat(line.discount || 0)) * (1 + parseFloat(line.tax || 0) / 100))}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </TableContainer>
          </>)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewModal(false)} startIcon={<Close />}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseReturns;