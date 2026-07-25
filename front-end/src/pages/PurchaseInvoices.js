import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, CircularProgress, Tooltip, TablePagination, Card,
  CardContent, Divider, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Autocomplete, Stack,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, Visibility,
  CheckCircle, Cancel, Send, Autorenew,
  PictureAsPdf as PdfIcon, Email as EmailIcon, FileDownload as DownloadIcon, Print as PrintIcon,
} from '@mui/icons-material';
import {
  fetchPurchaseInvoices,
  fetchPurchaseInvoice,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
  approvePurchaseInvoice,
  cancelPurchaseInvoice,
  generateInvoiceFromPO,
  generateInvoiceFromGoodsReceipt,
  confirmPurchaseInvoice,
  setPage,
  setLimit,
  clearSelected,
} from '../store/slices/purchaseInvoiceSlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchPurchaseOrders } from '../store/slices/purchaseOrderSlice';
import { fetchGoodsReceipts } from '../store/slices/goodsReceiptSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { apiSuccess, apiError } from '../utils/toast';
import accountApi from '../services/accountApi';
import purchaseInvoiceApi from '../services/purchaseInvoiceApi';
import { generatePurchaseInvoicePdf } from '../utils/pdfPurchaseInvoice';
import PdfViewer from '../components/PdfViewer';

const statusColors = {
  draft: { label: 'Draft', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'info' },
  posted: { label: 'Posted', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
  'partially_paid': { label: 'Partially Paid', color: 'info' },
  paid: { label: 'Paid', color: 'primary' },
};

const emptyDetail = () => ({ itemId: '', description: '', quantity: 1, unitCost: 0, taxRate: 0, discountAmount: 0 });

const PurchaseInvoices = () => {
  const dispatch = useDispatch();
  const { items, selectedItem, totalCount, page, limit, loading, error } = useSelector(
    (s) => s.purchaseInvoices
  );
  const suppliers = useSelector((s) => s.suppliers?.suppliers || []);
  const itemsList = useSelector((s) => s.items?.items || []);
  const pos = useSelector((s) => s.purchaseOrders?.list || []);
  const grns = useSelector((s) => s.goodsReceipts?.list || []);
  const warehouses = useSelector((s) => s.warehouses?.warehouses || []);

  const [showModal, setShowModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [form, setForm] = useState({
    supplierId: '',
    supplierInvoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    warehouseId: '',
    notes: '',
    details: [emptyDetail()],
  });
  const [search, setSearch] = useState('');
  const [generateMode, setGenerateMode] = useState('po');
  const [selectedGenerateId, setSelectedGenerateId] = useState('');
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [postAccounts, setPostAccounts] = useState({ assetAccountId: '', expenseAccountId: '', vatAccountId: '', apAccountId: '' });
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [liabilityAccounts, setLiabilityAccounts] = useState([]);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfInvoiceId, setPdfInvoiceId] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const activeCompany = useSelector((s) => s.company?.activeCompany || null);

  const loadData = useCallback(() => {
    const params = { page, limit };
    if (search) params.search = search;
    dispatch(fetchPurchaseInvoices(params));
  }, [dispatch, page, limit, search]);

  useEffect(() => {
    loadData();
    dispatch(fetchSuppliers({ limit: 9999 }));
    dispatch(fetchItems({ limit: 1000 }));
    dispatch(fetchPurchaseOrders({ limit: 1000 }));
    dispatch(fetchGoodsReceipts({ limit: 1000 }));
    dispatch(fetchWarehouses({ limit: 1000 }));
    // Load accounts for posting dialog
    const loadAccounts = async () => {
      try {
        const [assetRes, expenseRes, liabilityRes] = await Promise.all([
          accountApi.getByType('asset'),
          accountApi.getByType('expense'),
          accountApi.getByType('liability'),
        ]);
        setAssetAccounts(assetRes.data?.data || assetRes.data || []);
        setExpenseAccounts(expenseRes.data?.data || expenseRes.data || []);
        setLiabilityAccounts(liabilityRes.data?.data || liabilityRes.data || []);
      } catch (e) { /* ignore */ }
    };
    loadAccounts();
  }, [loadData, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setPage(1));
    loadData();
  };

  const handleNew = () => {
    setEditMode(false);
    setViewMode(false);
    dispatch(clearSelected());
    setForm({
      supplierId: '',
      supplierInvoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      warehouseId: '',
      notes: '',
      details: [emptyDetail()],
    });
    setShowModal(true);
  };

  const handleEdit = async (item) => {
    setEditMode(true);
    setViewMode(false);
    setShowModal(true);
    await dispatch(fetchPurchaseInvoice(item.id));
  };

  useEffect(() => {
    if ((editMode || viewMode) && selectedItem && showModal) {
      setForm({
        supplierId: selectedItem.supplierId || '',
        supplierInvoiceNumber: selectedItem.supplierInvoiceNumber || '',
        invoiceDate: selectedItem.invoiceDate ? selectedItem.invoiceDate.split('T')[0] : '',
        dueDate: selectedItem.dueDate ? selectedItem.dueDate.split('T')[0] : '',
        warehouseId: selectedItem.warehouseId || '',
        notes: selectedItem.notes || '',
        details: (selectedItem.details || selectedItem.PurchaseInvoiceDetails || []).length
          ? (selectedItem.details || selectedItem.PurchaseInvoiceDetails || []).map((d) => ({
              itemId: d.itemId || '',
              description: d.description || '',
              quantity: d.quantity || 1,
              unitCost: d.unitCost || 0,
              taxRate: d.taxPercent || d.taxRate || 0,
              discountAmount: d.discountAmount || 0,
            }))
          : [emptyDetail()],
      });
    }
  }, [editMode, viewMode, selectedItem, showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      items: form.details.map((d) => ({
        itemId: d.itemId,
        description: d.description,
        quantity: parseFloat(d.quantity),
        unitCost: parseFloat(d.unitCost),
        taxPercent: parseFloat(d.taxRate),
        discountPercent: parseFloat(d.discountAmount),
      })),
    };
    delete payload.details;
    if (editMode && selectedItem) {
      await dispatch(updatePurchaseInvoice({ id: selectedItem.id, ...payload }));
    } else {
      await dispatch(createPurchaseInvoice(payload));
    }
    setShowModal(false);
    loadData();
  };

  const handleView = async (inv) => {
    setViewMode(true);
    setEditMode(false);
    await dispatch(fetchPurchaseInvoice(inv.id));
    setShowModal(true);
  };

  const handleViewPdf = async (inv) => {
    try {
      const res = await purchaseInvoiceApi.getById(inv.id);
      const detail = res.data?.data || res.data || res;
      const companyInfo = {
        name: activeCompany?.name || 'EzeeFlo ERP', address: activeCompany?.address || '',
        phone: activeCompany?.phone || '', email: activeCompany?.email || '',
        logo: activeCompany?.logo || null, currencyCode: activeCompany?.currencyCode || 'AED',
        trnTin: activeCompany?.trnTin || '',
      };
      const { blobUrl, pdfBlob, filename } = await generatePurchaseInvoicePdf(detail, companyInfo);
      setPdfBlobUrl(blobUrl); setPdfFilename(filename); setPdfInvoiceId(inv.id); setPdfPreviewOpen(true);
    } catch (error) { apiError(error.response?.data?.message || error.message || 'Failed to generate PDF'); }
  };

  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
    setPdfFilename(''); setPdfInvoiceId(null);
  };

  const handlePrintPdf = () => {
    if (!pdfBlobUrl) return;
    const printWindow = window.open(pdfBlobUrl, '_blank');
    if (printWindow) printWindow.addEventListener('load', () => printWindow.print());
  };

  const blobUrlToBase64 = async (blobUrl) => {
    const resp = await fetch(blobUrl); const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject; reader.readAsDataURL(blob);
    });
  };

  const handleOpenEmailDialog = () => setEmailDialogOpen(true);

  const handleSendEmail = async () => {
    if (!emailTo) { apiError('Please enter recipient email'); return; }
    if (!pdfBlobUrl || !pdfInvoiceId) { apiError('PDF not ready'); return; }
    setSendingEmail(true);
    try {
      const pdfBase64 = await blobUrlToBase64(pdfBlobUrl);
      const response = await purchaseInvoiceApi.sendEmail(pdfInvoiceId, {
        to: emailTo, subject: emailSubject || undefined, body: emailBody || undefined, pdfBase64,
      });
      if (response.data?.success || response.success) {
        apiSuccess('Invoice sent successfully');
        setEmailDialogOpen(false); setEmailTo(''); setEmailSubject(''); setEmailBody('');
      }
    } catch (error) { apiError(error.response?.data?.message || error.message || 'Failed to send email'); }
    finally { setSendingEmail(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase invoice?')) {
      await dispatch(deletePurchaseInvoice(id));
      loadData();
    }
  };

  const handleApprove = async () => {
    if (!postTarget) return;
    const payload = {};
    if (postAccounts.assetAccountId) payload.assetAccountId = postAccounts.assetAccountId;
    if (postAccounts.expenseAccountId) payload.expenseAccountId = postAccounts.expenseAccountId;
    if (postAccounts.vatAccountId) payload.vatAccountId = postAccounts.vatAccountId;
    if (postAccounts.apAccountId) payload.apAccountId = postAccounts.apAccountId;

    const result = await dispatch(approvePurchaseInvoice({ id: postTarget.id, ...payload }));
    if (result.meta.requestStatus === 'fulfilled') {
      apiSuccess('Invoice posted to journal successfully');
      setPostDialogOpen(false);
      setPostTarget(null);
    } else {
      apiError(result.payload || 'Failed to post invoice');
    }
    loadData();
  };

  const handleOpenPostDialog = async (inv) => {
    // Fetch full invoice details to get item/supplier accounts
    const result = await dispatch(fetchPurchaseInvoice(inv.id));
    const invoice = result.payload?.data;
    if (!invoice) return;

    // Pre-populate account suggestions from item and supplier
    const details = invoice.details || invoice.PurchaseInvoiceDetails || [];
    const firstItem = details[0]?.item;
    const supplierVal = invoice.supplier;

    setPostTarget(invoice);
    setPostAccounts({
      assetAccountId: firstItem?.inventoryAccountId || '',
      expenseAccountId: firstItem?.expenseAccountId || '',
      vatAccountId: '',
      apAccountId: supplierVal?.apAccountId || '',
    });
    setPostDialogOpen(true);
  };

  const handleConfirm = async (id) => {
    if (window.confirm('Confirm this invoice?')) {
      const result = await dispatch(confirmPurchaseInvoice(id));
      if (result.meta.requestStatus === 'fulfilled') {
        apiSuccess('Invoice confirmed successfully');
      } else {
        apiError(result.payload || 'Failed to confirm invoice');
      }
      loadData();
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this invoice?')) {
      await dispatch(cancelPurchaseInvoice(id));
      loadData();
    }
  };

  const handleGenerateSubmit = async () => {
    if (!selectedGenerateId) return;
    let result;
    if (generateMode === 'po') {
      result = await dispatch(generateInvoiceFromPO(selectedGenerateId));
    } else {
      result = await dispatch(generateInvoiceFromGoodsReceipt(selectedGenerateId));
    }
    if (result.meta.requestStatus === 'fulfilled') {
      apiSuccess('Purchase Invoice generated successfully');
      setShowGenerateModal(false);
      setSelectedGenerateId('');
      loadData();
    } else {
      apiError(result.payload?.message || result.error?.message || 'Failed to generate invoice');
    }
  };

  const addDetailLine = () => {
    setForm({ ...form, details: [...form.details, emptyDetail()] });
  };

  const removeDetailLine = (index) => {
    if (form.details.length > 1) {
      setForm({ ...form, details: form.details.filter((_, i) => i !== index) });
    }
  };

  const updateDetail = (index, field, value) => {
    const updated = [...form.details];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, details: updated });
  };

  const calcLineTotal = (line) => {
    const gross = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitCost) || 0);
    const tax = gross * ((parseFloat(line.taxRate) || 0) / 100);
    return gross + tax - (parseFloat(line.discountAmount) || 0);
  };

  const calcGrandTotal = () => form.details.reduce((sum, d) => sum + calcLineTotal(d), 0);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Purchase Invoices</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Autorenew />}
            onClick={() => setShowGenerateModal(true)}
          >
            Generate Invoice
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNew}
          >
            New Invoice
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by invoice number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" color="primary">
            Search
          </Button>
        </Box>
      </Paper>

      {/* Generate Dialog */}
      <Dialog open={showGenerateModal} onClose={() => { setShowGenerateModal(false); setSelectedGenerateId(''); }} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Purchase Invoice</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Generate From</InputLabel>
            <Select
              value={generateMode}
              label="Generate From"
              onChange={(e) => { setGenerateMode(e.target.value); setSelectedGenerateId(''); }}
            >
              <MenuItem value="po">Purchase Order</MenuItem>
              <MenuItem value="grn">Goods Receipt</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{generateMode === 'po' ? 'Select Purchase Order' : 'Select Goods Receipt'}</InputLabel>
            <Select
              value={selectedGenerateId}
              label={generateMode === 'po' ? 'Select Purchase Order' : 'Select Goods Receipt'}
              onChange={(e) => setSelectedGenerateId(e.target.value)}
            >
              <MenuItem value="">-- Select --</MenuItem>
              {generateMode === 'po'
                ? pos.filter((p) => ['approved', 'partially_received', 'received'].includes(p.status)).map((po) => (
                    <MenuItem key={po.id} value={po.id}>
                      {po.orderNumber} - {po.supplier?.name || ''}
                    </MenuItem>
                  ))
                : grns.filter((g) => g.status === 'received').map((grn) => (
                    <MenuItem key={grn.id} value={grn.id}>
                      {grn.grnNumber || grn.goodsReceiptNumber} - {grn.supplierName || ''}
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowGenerateModal(false); setSelectedGenerateId(''); }}>Cancel</Button>
          <Button onClick={handleGenerateSubmit} variant="contained" color="secondary" disabled={!selectedGenerateId}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post to Journal Dialog */}
      <Dialog open={postDialogOpen} onClose={() => { setPostDialogOpen(false); setPostTarget(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Post to Journal</DialogTitle>
        <DialogContent>
          {postTarget && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Invoice: {postTarget.invoiceNumber} — Total: {parseFloat(postTarget.totalAmount || 0).toFixed(2)}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select the Chart of Accounts for each entry line:
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">DEBIT — Inventory Asset (for product items)</Typography>
                  <Autocomplete
                    size="small"
                    options={assetAccounts}
                    getOptionLabel={(opt) => opt.code ? `${opt.code} - ${opt.name}` : opt.name || ''}
                    value={assetAccounts.find((a) => a.id === postAccounts.assetAccountId) || null}
                    onChange={(e, v) => setPostAccounts({ ...postAccounts, assetAccountId: v?.id || '' })}
                    renderInput={(params) => <TextField {...params} label="Inventory Account" placeholder="Select asset account" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">DEBIT — Expense (for service items)</Typography>
                  <Autocomplete
                    size="small"
                    options={expenseAccounts}
                    getOptionLabel={(opt) => opt.code ? `${opt.code} - ${opt.name}` : opt.name || ''}
                    value={expenseAccounts.find((a) => a.id === postAccounts.expenseAccountId) || null}
                    onChange={(e, v) => setPostAccounts({ ...postAccounts, expenseAccountId: v?.id || '' })}
                    renderInput={(params) => <TextField {...params} label="Expense Account" placeholder="Select expense account" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">DEBIT — VAT Input / Input Tax</Typography>
                  <Autocomplete
                    size="small"
                    options={assetAccounts}
                    getOptionLabel={(opt) => opt.code ? `${opt.code} - ${opt.name}` : opt.name || ''}
                    value={assetAccounts.find((a) => a.id === postAccounts.vatAccountId) || null}
                    onChange={(e, v) => setPostAccounts({ ...postAccounts, vatAccountId: v?.id || '' })}
                    renderInput={(params) => <TextField {...params} label="VAT Input Account" placeholder="Select VAT input account" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">CREDIT — Accounts Payable</Typography>
                  <Autocomplete
                    size="small"
                    options={liabilityAccounts}
                    getOptionLabel={(opt) => opt.code ? `${opt.code} - ${opt.name}` : opt.name || ''}
                    value={liabilityAccounts.find((a) => a.id === postAccounts.apAccountId) || null}
                    onChange={(e, v) => setPostAccounts({ ...postAccounts, apAccountId: v?.id || '' })}
                    renderInput={(params) => <TextField {...params} label="Accounts Payable Account" placeholder="Select AP account" />}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPostDialogOpen(false); setPostTarget(null); }}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="primary">Post to Journal</Button>
        </DialogActions>
      </Dialog>

      {/* Main Form Dialog */}
      <Dialog open={showModal} onClose={() => { setShowModal(false); dispatch(clearSelected()); }} maxWidth="lg" fullWidth>
        <DialogTitle>
          {viewMode ? 'View Purchase Invoice' : editMode ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}
        </DialogTitle>
        <DialogContent dividers>
          {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
          <Box component="form" id="invoice-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={form.supplierId || ''}
                    label="Supplier"
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    disabled={viewMode}
                    renderValue={(val) => {
                      if (!val) return <em>Select Supplier</em>;
                      const s = suppliers.find((x) => String(x.id) === String(val));
                      const name = s ? (s.supplierName || s.name) : (selectedItem?.supplier?.name || '');
                      return name || val;
                    }}
                  >
                    <MenuItem value="">Select Supplier</MenuItem>
                    {suppliers.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.supplierName || s.name || ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Supplier Invoice #"
                  value={form.supplierInvoiceNumber}
                  onChange={(e) => setForm({ ...form, supplierInvoiceNumber: e.target.value })}
                  disabled={viewMode}
                  placeholder="Vendor ref"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Invoice Date"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                  required
                  disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Due Date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={form.warehouseId || ''}
                    label="Warehouse"
                    onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                    disabled={viewMode}
                    renderValue={(val) => {
                      if (!val) return <em>Select Warehouse</em>;
                      const w = warehouses.find((x) => String(x.id) === String(val));
                      const name = w ? (w.warehouseName || w.name) : (selectedItem?.warehouse?.name || '');
                      return name || val;
                    }}
                  >
                    <MenuItem value="">Select Warehouse</MenuItem>
                    {warehouses.map((w) => (
                      <MenuItem key={w.id} value={w.id}>{w.warehouseName || w.name || ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  disabled={viewMode}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">Invoice Lines</Typography>
              {!viewMode && (
                <Button size="small" variant="outlined" startIcon={<Add />} onClick={addDetailLine}>
                  Add Line
                </Button>
              )}
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Unit Cost</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Tax %</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Discount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                    {!viewMode && <TableCell sx={{ width: 50 }}></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.details.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {viewMode ? (
                          <Typography variant="body2">
                            {itemsList.find((i) => String(i.id) === String(line.itemId))?.name || itemsList.find((i) => String(i.id) === String(line.itemId))?.itemName || line.itemId}
                          </Typography>
                        ) : (
                          <FormControl fullWidth size="small">
                            <Select
                              value={line.itemId}
                              onChange={(e) => {
                                const item = itemsList.find((i) => String(i.id) === String(e.target.value));
                                updateDetail(idx, 'itemId', e.target.value);
                                if (item) updateDetail(idx, 'description', item.description || '');
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">Select</MenuItem>
                              {itemsList.map((it) => (
                                <MenuItem key={it.id} value={it.id}>{it.name || it.itemName || ''}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={line.description}
                          onChange={(e) => updateDetail(idx, 'description', e.target.value)}
                          disabled={viewMode}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateDetail(idx, 'quantity', e.target.value)}
                          inputProps={{ min: 1, style: { textAlign: 'right' } }}
                          disabled={viewMode}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.unitCost}
                          onChange={(e) => updateDetail(idx, 'unitCost', e.target.value)}
                          inputProps={{ step: 0.01, min: 0, style: { textAlign: 'right' } }}
                          disabled={viewMode}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.taxRate}
                          onChange={(e) => updateDetail(idx, 'taxRate', e.target.value)}
                          inputProps={{ step: 0.01, min: 0, style: { textAlign: 'right' } }}
                          disabled={viewMode}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.discountAmount}
                          onChange={(e) => updateDetail(idx, 'discountAmount', e.target.value)}
                          inputProps={{ step: 0.01, min: 0, style: { textAlign: 'right' } }}
                          disabled={viewMode}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {calcLineTotal(line).toFixed(2)}
                        </Typography>
                      </TableCell>
                      {!viewMode && (
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeDetailLine(idx)}
                            disabled={form.details.length <= 1}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                Grand Total: {calcGrandTotal().toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowModal(false); dispatch(clearSelected()); }}>
            {viewMode ? 'Close' : 'Cancel'}
          </Button>
          {!viewMode && (
            <Button type="submit" form="invoice-form" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : (editMode ? 'Update' : 'Create')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Data Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }} align="center">Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !showModal ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No purchase invoices found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((inv) => {
                  const st = statusColors[inv.status] || { label: inv.status, color: 'default' };
                  return (
                    <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary.dark">
                          {inv.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{inv.supplier?.name || inv.supplierName || ''}</TableCell>
                      <TableCell>{inv.invoiceDate ? inv.invoiceDate.split('T')[0] : ''}</TableCell>
                      <TableCell>{inv.dueDate ? inv.dueDate.split('T')[0] : ''}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {parseFloat(inv.totalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={st.label} color={st.color} size="small" variant="filled" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" color="primary" onClick={() => handleView(inv)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View as PDF">
                          <IconButton size="small" color="primary" onClick={() => handleViewPdf(inv)}>
                            <PdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {inv.status === 'draft' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" color="warning" onClick={() => handleEdit(inv)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Confirm">
                              <IconButton size="small" color="success" onClick={() => handleConfirm(inv.id)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(inv.id)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {inv.status === 'confirmed' && (
                          <>
                            <Tooltip title="Post to Journal">
                              <IconButton size="small" color="success" onClick={() => handleOpenPostDialog(inv)}>
                                <Send fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" color="error" onClick={() => handleCancel(inv.id)}>
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {inv.status === 'posted' && (
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="error" onClick={() => handleCancel(inv.id)}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Divider />
        )}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="small"
                  variant={p === page ? 'contained' : 'outlined'}
                  onClick={() => dispatch(setPage(p))}
                  sx={{ minWidth: 36, height: 36 }}
                >
                  {p}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </Card>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onClose={handleClosePdfPreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Invoice Preview - {pdfFilename.replace('PurchaseInvoice_', '').replace('.pdf', '')}</Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Send Email"><IconButton size="small" color="primary" onClick={handleOpenEmailDialog}><EmailIcon /></IconButton></Tooltip>
              <Tooltip title="Print"><IconButton size="small" color="secondary" onClick={handlePrintPdf}><PrintIcon /></IconButton></Tooltip>
              <Tooltip title="Download PDF"><IconButton size="small" color="primary" onClick={() => { if (pdfBlobUrl) { const a = document.createElement('a'); a.href = pdfBlobUrl; a.download = pdfFilename; a.click(); } }}><DownloadIcon /></IconButton></Tooltip>
              <IconButton size="small" onClick={handleClosePdfPreview}><Cancel /></IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 0 }}>
          {pdfBlobUrl && <PdfViewer blobUrl={pdfBlobUrl} />}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle><Stack direction="row" alignItems="center" spacing={1}><EmailIcon color="primary" /><Typography variant="h6">Send Invoice via Email</Typography></Stack></DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Recipient Email" type="email" required value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)} placeholder="supplier@example.com" size="small" />
            <TextField fullWidth label="Subject" value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={`Invoice #${pdfFilename.replace('PurchaseInvoice_', '').replace('.pdf', '')}`} size="small" />
            <TextField fullWidth label="Email Body" multiline rows={8} value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={`Dear Supplier,\n\nPlease find attached the invoice.\n\nBest regards,\n${activeCompany?.name || 'EzeeFlo ERP'}`} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={sendingEmail}>Cancel</Button>
          <Button onClick={handleSendEmail} variant="contained" color="primary"
            disabled={sendingEmail || !emailTo}
            startIcon={sendingEmail ? <CircularProgress size={16} /> : <EmailIcon />}>
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseInvoices;