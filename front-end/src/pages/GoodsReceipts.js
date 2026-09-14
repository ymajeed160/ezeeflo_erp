import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
  Tooltip, Stack, Divider,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  Search as SearchIcon, Refresh as RefreshIcon, CheckCircleOutline as ApproveIcon,
  Cancel as RejectIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchGoodsReceipts, fetchGoodsReceipt, createGoodsReceipt,
  updateGoodsReceipt, deleteGoodsReceipt, approveGoodsReceipt,
  cancelGoodsReceipt, clearCurrent,
} from '../store/slices/goodsReceiptSlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchPurchaseOrders, fetchPurchaseOrder } from '../store/slices/purchaseOrderSlice';
import { apiSuccess, apiError } from '../utils/toast';
import { generateGoodsReceiptPdf } from '../utils/pdfGoodsReceipt';
import PdfViewer from '../components/PdfViewer';
import goodsReceiptApi from '../services/goodsReceiptApi';
import QuickCreate from '../components/QuickCreate/QuickCreate';
import SearchableSelect from '../components/Common/SearchableSelect';

const statusColors = {
  draft: 'default',
  received: 'success',
  cancelled: 'error',
};

const GoodsReceipts = () => {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { list, current, loading, count, page, limit, totalPages } = useSelector((s) => s.goodsReceipts);
  const suppliersList = useSelector((s) => s.suppliers?.suppliers || []);
  const itemsList = useSelector((s) => s.items?.items || []);
  const warehouseList = useSelector((s) => s.warehouses?.warehouses || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);
  const [importing, setImporting] = useState(false);
  const [fromPO, setFromPO] = useState(false);
  const [loadingPO, setLoadingPO] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfGrnId, setPdfGrnId] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [reasonDialog, setReasonDialog] = useState({ open: false, action: null, target: null });
  const [reasonText, setReasonText] = useState('');
  const activeCompany = useSelector((s) => s.company?.activeCompany || null);
  const poList = useSelector((s) => s.purchaseOrders?.list || []);
  const poListRef = useRef(poList);
  poListRef.current = poList;

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      purchaseOrderId: '', supplierId: '', receiptDate: new Date().toISOString().split('T')[0], warehouseId: '',
      referenceNo: '', notes: '', items: [{ itemId: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0, taxPercentage: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const getItemType = (itemId) => itemsList.find((it) => it.id === itemId)?.itemType || 'product';

  const loadData = useCallback(() => {
    const params = { page: currentPage + 1, limit: rowsPerPage, search, status: statusFilter, supplierId: supplierFilter };
    dispatch(fetchGoodsReceipts(params));
  }, [dispatch, currentPage, rowsPerPage, search, statusFilter, supplierFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    dispatch(fetchSuppliers({ limit: 999 }));
    dispatch(fetchItems({ limit: 999 }));
    dispatch(fetchWarehouses({ limit: 999 }));
    dispatch(fetchPurchaseOrders({ status: 'approved', limit: 999 }));
  }, [dispatch]);

  // When route is /new or /new?poId=X, auto-open the create dialog
  const isNewRoute = location.pathname.endsWith('/new');
  useEffect(() => {
    if (!isNewRoute) return;
    const params = new URLSearchParams(window.location.search);
    const poId = params.get('poId');
    if (!poId) {
      handleCreate();
      return;
    }
    setFromPO(true);
    setIsEdit(false);
    setOpenForm(true);
    setLoadingPO(true);
    // Use setTimeout to allow form dialog to render before setting values
    setTimeout(async () => {
      try {
        const result = await dispatch(fetchPurchaseOrder(poId));
        const body = result.payload;
        const poData = body?.data || body;
        console.log('[GRN Debug] fetchPurchaseOrder response:', { body, poData });
        if (poData && poData.id) {
          // Get supplier/warehouse from poData first, fallback to poList
          const currentList = poListRef.current;
          const fromList = currentList.find((p) => String(p.id) === poId);
          const supplierIdVal = poData.supplier?.id || poData.supplierId || fromList?.supplier?.id || '';
          const warehouseIdVal = poData.warehouse?.id || poData.warehouseId || fromList?.warehouse?.id || '';
          console.log('[GRN Debug] Values to set:', { supplierIdVal, warehouseIdVal, detailsCount: poData.details?.length });

          // Reset form with basic fields first
          reset({
            purchaseOrderId: poData.id,
            supplierId: supplierIdVal,
            receiptDate: new Date().toISOString().split('T')[0],
            warehouseId: warehouseIdVal,
            referenceNo: '',
            notes: '',
            items: [{ itemId: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0 }],
          });

          // Load items using the working pattern (remove + append)
          if (poData.details && poData.details.length > 0) {
            remove();
            poData.details.forEach((d) => {
              append({
                itemId: d.item?.id || d.Item?.id || d.itemId || '',
                orderedQuantity: d.quantity || 0,
                receivedQuantity: d.quantity || 0,
                unitCost: d.unitPrice || 0,
                taxPercentage: d.taxPercentage || d.taxPercent || 0,
              });
            });
          }

          // Set supplier and warehouse LAST (after items are loaded)
          setValue('supplierId', supplierIdVal);
          setValue('warehouseId', warehouseIdVal);
          console.log('[GRN Debug] After setValue - supplierId:', supplierIdVal, 'warehouseId:', warehouseIdVal);
        } else {
          // Fallback: try to find PO in already-loaded poList
          const currentList = poListRef.current;
          const fromList = currentList.find((p) => String(p.id) === poId);
          console.log('[GRN Debug] Using fallback poList:', fromList);
          if (fromList) {
            reset({
              purchaseOrderId: fromList.id,
              supplierId: fromList.supplier?.id || fromList.supplierId || '',
              receiptDate: new Date().toISOString().split('T')[0],
              warehouseId: fromList.warehouse?.id || fromList.warehouseId || '',
              referenceNo: '',
              notes: '',
              items: [{ itemId: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0 }],
            });
            setValue('supplierId', fromList.supplier?.id || fromList.supplierId || '');
            setValue('warehouseId', fromList.warehouse?.id || fromList.warehouseId || '');
          }
        }
      } catch (err) {
        console.error('[GRN Debug] Error:', err);
        apiError('Failed to load purchase order data');
      } finally {
        setLoadingPO(false);
      }
    }, 100);
  }, [isNewRoute]);

  const handleSearch = () => { setCurrentPage(0); loadData(); };
  const handleRefresh = () => { setSearch(''); setStatusFilter(''); setSupplierFilter(''); setCurrentPage(0); dispatch(fetchGoodsReceipts({ page: 1, limit: rowsPerPage })); };

  const handleCreate = () => {
    setIsEdit(false); setFromPO(false);
    reset({ purchaseOrderId: '', supplierId: '', receiptDate: new Date().toISOString().split('T')[0], warehouseId: '', referenceNo: '', notes: '', items: [{ itemId: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0 }] }); setOpenForm(true);
  };

  const handleEdit = async (gr) => {
    setIsEdit(true);
    const result = await dispatch(fetchGoodsReceipt(gr.id));
    const d = result.payload.data;
    setValue('supplierId', d.Supplier?.id || d.supplierId || '');
    setValue('receiptDate', (d.receiptDate || '').split('T')[0]);
    setValue('warehouseId', d.Warehouse?.id || d.warehouseId || '');
    setValue('purchaseOrderId', d.purchaseOrderId || '');
    setValue('referenceNo', d.reference || d.referenceNo || '');
    setValue('notes', d.notes || '');
    remove();
    (d.details || d.GoodsReceiptDetails || d.items || []).forEach((item) => {
      append({ itemId: item.Item?.id || item.itemId || '', orderedQuantity: item.orderedQuantity || 0, receivedQuantity: item.receivedQuantity || 0, unitCost: item.unitPrice || item.unitCost || 0, taxPercentage: item.taxPercentage || 0 });
    });
    setOpenForm(true);
  };

  const handleView = (gr) => { dispatch(fetchGoodsReceipt(gr.id)); setOpenView(true); };

  const handleViewPdf = async (gr) => {
    try {
      const res = await goodsReceiptApi.getById(gr.id);
      const detail = res.data?.data || res.data || res;
      const companyInfo = {
        name: activeCompany?.name || 'EzeeFlo ERP', address: activeCompany?.address || '',
        phone: activeCompany?.phone || '', email: activeCompany?.email || '',
        logo: activeCompany?.logo || null, currencyCode: activeCompany?.currencyCode || 'AED',
        trnTin: activeCompany?.trnTin || '',
      };
      const { blobUrl, pdfBlob, filename } = await generateGoodsReceiptPdf(detail, companyInfo);
      setPdfBlobUrl(blobUrl); setPdfFilename(filename); setPdfGrnId(gr.id); setPdfPreviewOpen(true);
    } catch (error) { apiError(error.response?.data?.message || error.message || 'Failed to generate PDF'); }
  };

  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
    setPdfFilename(''); setPdfGrnId(null);
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
    if (!pdfBlobUrl || !pdfGrnId) { apiError('PDF not ready'); return; }
    setSendingEmail(true);
    try {
      const pdfBase64 = await blobUrlToBase64(pdfBlobUrl);
      const response = await goodsReceiptApi.sendEmail(pdfGrnId, {
        to: emailTo, subject: emailSubject || undefined, body: emailBody || undefined, pdfBase64,
      });
      if (response.data?.success || response.success) {
        apiSuccess('Goods Receipt sent successfully');
        setEmailDialogOpen(false); setEmailTo(''); setEmailSubject(''); setEmailBody('');
      }
    } catch (error) { apiError(error.response?.data?.message || error.message || 'Failed to send email'); }
    finally { setSendingEmail(false); }
  };

  const handleCloseForm = () => { setOpenForm(false); dispatch(clearCurrent()); };
  const handleCloseView = () => { setOpenView(false); dispatch(clearCurrent()); };

  const onSubmit = async (data) => {
    // Map form field names to backend expectations
    const payload = {
      ...data,
      details: data.items,
      reference: data.referenceNo,
    };
    delete payload.items;
    delete payload.referenceNo;
    // Map unitCost to unitPrice in each detail
    payload.details = payload.details.map((d) => ({
      ...d,
      unitPrice: d.unitCost,
      receivedQuantity: d.receivedQuantity || d.orderedQuantity || 0,
      taxPercentage: d.taxPercentage || 0,
    }));
    payload.details.forEach((d) => delete d.unitCost);

    // If no purchaseOrderId, remove it so backend treats as direct GRN
    if (!payload.purchaseOrderId) {
      delete payload.purchaseOrderId;
    }

    let result;
    if (isEdit) {
      result = await dispatch(updateGoodsReceipt({ id: current?.id || data.id, ...payload }));
    } else {
      result = await dispatch(createGoodsReceipt(payload));
    }

    if (result.meta.requestStatus === 'fulfilled') {
      apiSuccess(isEdit ? 'Goods Receipt updated successfully' : 'Goods Receipt created successfully');
      setOpenForm(false);
      loadData();
    } else {
      apiError(result.payload || 'Failed to save goods receipt');
    }
  };

  const askConfirm = (message, onConfirm) => {
    setConfirmState({ message, onConfirm });
  };

  const handleDelete = (id) => {
    setReasonDialog({ open: true, action: 'delete', target: id });
    setReasonText('');
  };

  const handleReasonConfirm = async () => {
    const { action, target } = reasonDialog;
    setReasonDialog({ open: false, action: null, target: null });
    if (!target) return;
    if (action === 'delete') {
      await dispatch(deleteGoodsReceipt({ id: target, reason: reasonText || null }));
    } else if (action === 'cancel') {
      await dispatch(cancelGoodsReceipt({ id: target, reason: reasonText || null }));
    }
    setReasonText('');
    loadData();
  };

  const handleApprove = (id) => {
    askConfirm('Approve this goods receipt? Inventory will be increased.', async () => {
      const result = await dispatch(approveGoodsReceipt(id));
      if (result.meta.requestStatus === 'fulfilled') {
        apiSuccess('Goods Receipt approved and inventory updated');
        loadData();
      } else {
        apiError(result.payload || 'Failed to approve goods receipt');
      }
    });
  };

  const handleCancel = (id) => {
    setReasonDialog({ open: true, action: 'cancel', target: id });
    setReasonText('');
  };

  const noItems = itemsList?.length === 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Goods Receipts</Typography>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField fullWidth size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{ startAdornment: <SearchIcon color="disabled" /> }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField select fullWidth size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <SearchableSelect
                fullWidth
                size="small"
                label="Supplier"
                value={supplierFilter}
                onChange={(v) => setSupplierFilter(v)}
                options={[
                  { value: '', label: 'All' },
                  ...(suppliersList?.map((s) => ({ value: s.id, label: s.supplierName || s.name || '' })) || []),
                ]}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleSearch}>Search</Button>
                <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>Refresh</Button>
                <Button variant="contained" color="primary" onClick={handleCreate} startIcon={<AddIcon />}>New Goods Receipt</Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Receipt Number</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total Qty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Converted To</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list?.map((gr) => (
              <TableRow key={gr.id} hover>
                <TableCell>{gr.grnNumber || gr.goodsReceiptNumber}</TableCell>
                <TableCell>{gr.receiptDate?.split('T')[0]}</TableCell>
                <TableCell>{gr.supplierName || '-'}</TableCell>
                <TableCell>{gr.warehouseName || '-'}</TableCell>
                <TableCell>{gr.details?.length || 0}</TableCell>
                <TableCell>{gr.totalQuantity || 0}</TableCell>
                <TableCell>
                  <Chip size="small" label={gr.status} color={statusColors[gr.status] || 'default'} />
                </TableCell>
                <TableCell>
                  {gr.convertedToInvoice ? (
                    <Chip size="small" color="info" label={`Invoice: ${gr.convertedInvoiceNumber}`} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="View"><IconButton size="small" onClick={() => handleView(gr)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="View as PDF"><IconButton size="small" color="primary" onClick={() => handleViewPdf(gr)}><PdfIcon fontSize="small" /></IconButton></Tooltip>
                    {gr.status === 'draft' && (
                      <>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(gr)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Approve/Receive"><IconButton size="small" color="success" onClick={() => handleApprove(gr.id)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(gr.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </>
                    )}
                    {gr.status === 'received' && (
                      <Tooltip title="Cancel"><IconButton size="small" color="warning" onClick={() => handleCancel(gr.id)}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {list?.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No goods receipts found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={count} page={currentPage} onPageChange={(e, p) => setCurrentPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setCurrentPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{isEdit ? 'Edit Goods Receipt' : 'New Goods Receipt'}</DialogTitle>
          <DialogContent>
            {!isEdit && (
              <Box sx={{ mb: 2, mt: 1 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={fromPO ? 'outlined' : 'contained'}
                    size="small"
                    onClick={() => {
                      setFromPO(false);
                      setValue('purchaseOrderId', '');
                      setValue('supplierId', '');
                      remove();
                      append({ itemId: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0 });
                    }}
                  >
                    Direct Receipt
                  </Button>
                  <Button
                    variant={fromPO ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setFromPO(true);
                      setValue('supplierId', '');
                    }}
                  >
                    From Purchase Order
                  </Button>
                </Stack>
              </Box>
            )}

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {fromPO && !isEdit && (
                <Grid item xs={12} md={6}>
                  <SearchableSelect
                    fullWidth
                    size="small"
                    label="Purchase Order"
                    value={watch('purchaseOrderId')}
                    onChange={async (v) => {
                      const poId = v;
                      setValue('purchaseOrderId', poId);
                      if (!poId) return;
                      setLoadingPO(true);
                      try {
                        const result = await dispatch(fetchPurchaseOrder(poId));
                        const body = result.payload;
                        const poData = body?.data || body;
                        console.log('[GRN Debug] Dropdown onChange response:', { body, poData });
                        if (poData && poData.id) {
                          const currentList = poListRef.current;
                          const fromList = currentList.find((p) => String(p.id) === poId);
                          const supplierIdVal = poData.supplier?.id || poData.supplierId || fromList?.supplier?.id || '';
                          const warehouseIdVal = poData.warehouse?.id || poData.warehouseId || fromList?.warehouse?.id || '';
                          console.log('[GRN Debug] Dropdown values:', { supplierIdVal, warehouseIdVal, detailsCount: poData.details?.length });
                          reset({
                            purchaseOrderId: poData.id,
                            supplierId: supplierIdVal,
                            receiptDate: new Date().toISOString().split('T')[0],
                            warehouseId: warehouseIdVal,
                            referenceNo: '',
                            notes: '',
                            items: [{ itemId: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0 }],
                          });
                          // Load items
                          if (poData.details && poData.details.length > 0) {
                            remove();
                            poData.details.forEach((d) => {
                              append({
                                itemId: d.item?.id || d.Item?.id || d.itemId || '',
                                orderedQuantity: d.quantity || 0,
                                receivedQuantity: d.quantity || 0,
                                unitCost: d.unitPrice || 0,
                                taxPercentage: d.taxPercentage || d.taxPercent || 0,
                              });
                            });
                          }
                          // Set supplier/warehouse LAST
                          setValue('supplierId', supplierIdVal);
                          setValue('warehouseId', warehouseIdVal);
                        }
                      } catch (err) {
                        console.error('[GRN Debug] Dropdown error:', err);
                        apiError('Failed to load purchase order');
                      } finally {
                        setLoadingPO(false);
                      }
                    }}
                    options={[
                      { value: '', label: '-- Select PO --' },
                      ...poList.map((po) => ({ value: po.id, label: `${po.orderNumber || po.poNumber} - ${po.supplier?.name || po.supplierName || ''}` })),
                    ]}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={fromPO && !isEdit ? 6 : 6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Controller
                    name="supplierId"
                    control={control}
                    rules={{ required: 'Supplier is required' }}
                    render={({ field }) => (
                      <SearchableSelect
                        fullWidth
                        size="small"
                        label="Supplier *"
                        value={field.value || ''}
                        onChange={(v) => field.onChange(v)}
                        error={!!errors.supplierId}
                        helperText={errors.supplierId?.message}
                        disabled={fromPO && !isEdit}
                        options={suppliersList?.map((s) => ({ value: s.id, label: s.supplierName || s.name || '' })) || []}
                      />
                    )}
                  />
                  <QuickCreate
                    entityKey="supplier"
                    disabled={fromPO && !isEdit}
                    onCreated={(s) => {
                      dispatch(fetchSuppliers({ limit: 999 }));
                      setValue('supplierId', s.id, { shouldValidate: true });
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth size="small" type="date" label="Receipt Date" {...register('receiptDate', { required: 'Date required' })} error={!!errors.receiptDate} helperText={errors.receiptDate?.message} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6} md={3}>
                <Controller
                  name="warehouseId"
                  control={control}
                  rules={{ required: 'Warehouse is required' }}
                  render={({ field }) => (
                    <SearchableSelect
                      fullWidth
                      size="small"
                      label="Warehouse *"
                      value={field.value || ''}
                      onChange={(v) => field.onChange(v)}
                      error={!!errors.warehouseId}
                      helperText={errors.warehouseId?.message}
                      options={warehouseList?.map((w) => ({ value: w.id, label: w.warehouseName || w.name || '' })) || []}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth size="small" label="Reference No" {...register('referenceNo')} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth size="small" label="Notes" {...register('notes')} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">Items</Typography>
              <Button size="small" onClick={() => append({ itemId: '', orderedQuantity: 0, receivedQuantity: 0, unitCost: 0, taxPercentage: 0 })} startIcon={<AddIcon />}>Add Item</Button>
            </Box>

            {fields.map((field, idx) => (
              <Grid container spacing={1} key={field.id} sx={{ mb: 1 }}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Controller
                      control={control} name={`items.${idx}.itemId`}
                      rules={{ required: 'Item is required' }}
                      render={({ field: f }) => (
                        <SearchableSelect
                          fullWidth
                          size="small"
                          label="Item *"
                          value={f.value || ''}
                          onChange={(v) => f.onChange(v)}
                          error={!!errors.items?.[idx]?.itemId}
                          helperText={errors.items?.[idx]?.itemId?.message}
                          options={itemsList?.map((it) => ({ value: it.id, label: it.name || it.itemName || '' })) || []}
                        />
                      )}
                    />
                    <QuickCreate
                      entityKey="item"
                      onCreated={(it) => {
                        dispatch(fetchItems({ limit: 999 }));
                        setValue(`items.${idx}.itemId`, it.id, { shouldValidate: true });
                        if (it.costPrice) setValue(`items.${idx}.unitCost`, Number(it.costPrice) || 0);
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4} md={2}>
                  <TextField fullWidth size="small" type="number" label="Ordered Qty" {...register(`items.${idx}.orderedQuantity`, { valueAsNumber: true, min: 0 })} />
                </Grid>
                <Grid item xs={4} md={2}>
                  <TextField fullWidth size="small" type="number" label={getItemType(watchedItems?.[idx]?.itemId) === 'service' ? 'Received Qty' : 'Received Qty *'} {...register(`items.${idx}.receivedQuantity`, getItemType(watchedItems?.[idx]?.itemId) === 'service' ? { valueAsNumber: true, min: 0 } : { required: 'Required for product', valueAsNumber: true, validate: (v) => v > 0 || 'Must be greater than 0' })} error={!!errors.items?.[idx]?.receivedQuantity} helperText={errors.items?.[idx]?.receivedQuantity?.message} />
                </Grid>
                <Grid item xs={4} md={2}>
                  <TextField fullWidth size="small" type="number" label="Unit Cost" {...register(`items.${idx}.unitCost`, { valueAsNumber: true, min: 0 })} />
                </Grid>
                <Grid item xs={4} md={1}>
                  <TextField fullWidth size="small" type="number" label="VAT %" {...register(`items.${idx}.taxPercentage`, { valueAsNumber: true, min: 0, max: 100 })} />
                </Grid>
                <Grid item xs={4} md={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Total"
                    value={(() => {
                      const qty = parseFloat(watchedItems?.[idx]?.receivedQuantity) || 0;
                      const cost = parseFloat(watchedItems?.[idx]?.unitCost) || 0;
                      const tax = parseFloat(watchedItems?.[idx]?.taxPercentage) || 0;
                      return (qty * cost * (1 + tax / 100)).toFixed(2);
                    })()}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  {idx > 0 && <IconButton size="small" color="error" onClick={() => remove(idx)}><DeleteIcon /></IconButton>}
                </Grid>
              </Grid>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>Grand Total:</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {(() => {
                  const total = (watchedItems || []).reduce((sum, it) => {
                    const qty = parseFloat(it.receivedQuantity) || 0;
                    const cost = parseFloat(it.unitCost) || 0;
                    const tax = parseFloat(it.taxPercentage) || 0;
                    return sum + qty * cost * (1 + tax / 100);
                  }, 0);
                  return total.toFixed(2);
                })()}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{isEdit ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openView} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle>Goods Receipt Details</DialogTitle>
        <DialogContent>
          {current && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}><Typography variant="subtitle2">Receipt Number</Typography><Typography>{current.grnNumber || current.goodsReceiptNumber}</Typography></Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Status</Typography><Chip size="small" label={current.status} color={statusColors[current.status] || 'default'} /></Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Date</Typography><Typography>{current.receiptDate?.split('T')[0]}</Typography></Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Supplier</Typography><Typography>{current.supplierName || '-'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Warehouse</Typography><Typography>{current.warehouseName || '-'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Reference</Typography><Typography>{current.reference || current.referenceNo || '-'}</Typography></Grid>
              <Grid item xs={12}><Typography variant="subtitle2">Notes</Typography><Typography>{current.notes || '-'}</Typography></Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Items</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Ordered Qty</TableCell>
                      <TableCell>Received Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(current.details || current.GoodsReceiptDetails || []).map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{d.itemName || d.Item?.itemName || '-'}</TableCell>
                        <TableCell>{d.orderedQuantity || 0}</TableCell>
                        <TableCell>{d.receivedQuantity || 0}</TableCell>
                        <TableCell align="right">{Number(d.unitPrice || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">{Number(d.lineTotal || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={handleCloseView}>Close</Button></DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onClose={handleClosePdfPreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">GRN Preview - {pdfFilename.replace('GoodsReceipt_', '').replace('.pdf', '')}</Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Send Email"><IconButton size="small" color="primary" onClick={handleOpenEmailDialog}><EmailIcon /></IconButton></Tooltip>
              <Tooltip title="Print"><IconButton size="small" color="secondary" onClick={handlePrintPdf}><PrintIcon /></IconButton></Tooltip>
              <Tooltip title="Download PDF"><IconButton size="small" color="primary" onClick={() => { if (pdfBlobUrl) { const a = document.createElement('a'); a.href = pdfBlobUrl; a.download = pdfFilename; a.click(); } }}><ExportIcon /></IconButton></Tooltip>
              <IconButton size="small" onClick={handleClosePdfPreview}><CancelIcon /></IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 0 }}>
          {pdfBlobUrl && <PdfViewer blobUrl={pdfBlobUrl} />}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle><Stack direction="row" alignItems="center" spacing={1}><EmailIcon color="primary" /><Typography variant="h6">Send GRN via Email</Typography></Stack></DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Recipient Email" type="email" required value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)} placeholder="supplier@example.com" size="small" />
            <TextField fullWidth label="Subject" value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)} placeholder={`GRN #${pdfFilename.replace('GoodsReceipt_', '').replace('.pdf', '')}`} size="small" />
            <TextField fullWidth label="Email Body" multiline rows={8} value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={`Dear Supplier,\n\nPlease find attached the goods receipt.\n\nBest regards,\n${activeCompany?.name || 'EzeeFlo ERP'}`} />
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

      {/* Confirm Dialog (replaces native window.confirm) */}
      <Dialog open={!!confirmState} onClose={() => setConfirmState(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{confirmState?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmState(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const onConfirm = confirmState?.onConfirm;
              setConfirmState(null);
              if (onConfirm) onConfirm();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reason Dialog for Delete/Cancel */}
      <Dialog open={reasonDialog.open} onClose={() => setReasonDialog({ open: false, action: null, target: null })} fullWidth maxWidth="sm">
        <DialogTitle>{reasonDialog.action === 'delete' ? 'Delete Goods Receipt' : 'Cancel Goods Receipt'}</DialogTitle>
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

export default GoodsReceipts;