import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as ApproveIcon,
  Cancel as RejectIcon,
  Inventory2 as ReceiveIcon,
  Cancel as CancelIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchPurchaseOrders,
  fetchPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  generateFromPR,
  clearSelectedOrder,
} from '../store/slices/purchaseOrderSlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchPurchaseRequests as fetchApprovedPurchaseRequests } from '../store/slices/purchaseRequestSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';
import { generatePurchaseOrderPdf } from '../utils/pdfPurchaseOrder';
import PdfViewer from '../components/PdfViewer';
import purchaseOrderApi from '../services/purchaseOrderApi';

const statusColors = {
  draft: 'default',
  approved: 'info',
  partially_received: 'warning',
  received: 'success',
  closed: 'secondary',
  cancelled: 'error',
};

const PurchaseOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list, total, page, limit, selectedOrder, loading, submitting } = useSelector((s) => s.purchaseOrders);
  const suppliersList = useSelector((s) => s.suppliers?.suppliers || []);
  const itemsList = useSelector((s) => s.items?.items || []);
  const warehouseList = useSelector((s) => s.warehouses?.warehouses || []);
  const approvedPRs = useSelector((s) => s.purchaseRequests?.list || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfOrderId, setPdfOrderId] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const activeCompany = useSelector((s) => s.company?.activeCompany || null);
  const [selectedPRs, setSelectedPRs] = useState([]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      warehouseId: '',
      notes: '',
      status: 'draft',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchPurchaseOrders({ search, status: statusFilter, supplierId: supplierFilter, page, limit }));
  }, [dispatch, search, statusFilter, supplierFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchSuppliers({ limit: 999 }));
    dispatch(fetchItems({ limit: 999 }));
    dispatch(fetchWarehouses({ limit: 999 }));
  }, [loadData, dispatch]);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selectedOrder && openForm && editId && selectedOrder.id === editId) {
      reset({
        supplierId: selectedOrder.supplierId || '',
        orderDate: selectedOrder.orderDate?.split('T')[0] || '',
        expectedDeliveryDate: selectedOrder.expectedDeliveryDate?.split('T')[0] || '',
        warehouseId: selectedOrder.warehouseId || '',
        notes: selectedOrder.notes || '',
        status: selectedOrder.status || 'draft',
        details: selectedOrder.details?.length ? selectedOrder.details.map((d) => ({
          itemId: d.itemId || '',
          description: d.description || '',
          quantity: d.quantity || 0,
          unitPrice: d.unitPrice || 0,
          taxPercentage: d.taxPercent ?? d.taxPercentage ?? 0,
          discountPercentage: d.discountPercent ?? d.discountPercentage ?? 0,
        })) : [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
      });
    }
  }, [selectedOrder, openForm, editId, reset]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    dispatch(clearSelectedOrder());
    reset({
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      warehouseId: '',
      notes: '',
      status: 'draft',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    });
    setOpenForm(true);
  };

  const handleEdit = (order) => {
    setViewMode(false);
    setEditId(order.id);
    dispatch(fetchPurchaseOrder(order.id));
    setOpenForm(true);
  };

  const handleView = (order) => {
    setViewMode(true);
    setEditId(order.id);
    dispatch(fetchPurchaseOrder(order.id));
    setOpenForm(true);
  };

  const handleCreateGRN = (order) => {
    navigate(`/app/purchases/goods-receipts/new?poId=${order.id}`);
  };

  const handleViewPdf = async (order) => {
    try {
      const res = await purchaseOrderApi.getById(order.id);
      const orderDetail = res.data?.data || res.data || res;
      const companyInfo = {
        name: activeCompany?.name || 'EzeeFlo ERP', address: activeCompany?.address || '',
        phone: activeCompany?.phone || '', email: activeCompany?.email || '',
        logo: activeCompany?.logo || null, currencyCode: activeCompany?.currencyCode || 'AED',
        trnTin: activeCompany?.trnTin || '',
      };
      const { blobUrl, pdfBlob, filename } = await generatePurchaseOrderPdf(orderDetail, companyInfo);
      setPdfBlobUrl(blobUrl); setPdfFilename(filename); setPdfOrderId(order.id); setPdfPreviewOpen(true);
    } catch (error) { apiError(error.response?.data?.message || error.message || 'Failed to generate PDF'); }
  };

  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
    setPdfFilename(''); setPdfOrderId(null);
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
    if (!emailTo) { apiError('Please enter recipient email address'); return; }
    if (!pdfBlobUrl || !pdfOrderId) { apiError('PDF not ready'); return; }
    setSendingEmail(true);
    try {
      const pdfBase64 = await blobUrlToBase64(pdfBlobUrl);
      const response = await purchaseOrderApi.sendEmail(pdfOrderId, {
        to: emailTo, subject: emailSubject || undefined, body: emailBody || undefined, pdfBase64,
      });
      if (response.data?.success || response.success) {
        apiSuccess('Purchase Order sent successfully');
        setEmailDialogOpen(false); setEmailTo(''); setEmailSubject(''); setEmailBody('');
      }
    } catch (error) { apiError(error.response?.data?.message || error.message || 'Failed to send email'); }
    finally { setSendingEmail(false); }
  };

  const handleDelete = async (order) => {
    const confirmed = await confirmDialog('Are you sure you want to delete this purchase order?');
    if (confirmed) {
      dispatch(deletePurchaseOrder(order.id)).then(() => loadData());
    }
  };

  const handleApprove = (order) => {
    dispatch(approvePurchaseOrder({ id: order.id, decision: 'approved' })).then(() => loadData());
  };

  const handleReject = (order) => {
    dispatch(approvePurchaseOrder({ id: order.id, decision: 'cancelled' })).then(() => loadData());
  };

  const handleOpenGenerate = () => {
    dispatch(fetchApprovedPurchaseRequests({ status: 'approved' }));
    setGenerateDialogOpen(true);
    setSelectedPRs([]);
  };

  const togglePRSelection = (prId) => {
    setSelectedPRs((prev) =>
      prev.includes(prId) ? prev.filter((id) => id !== prId) : [...prev, prId]
    );
  };

  const handleGenerateFromPRs = async () => {
    if (selectedPRs.length === 0) return;
    await dispatch(generateFromPR({ purchaseRequestIds: selectedPRs }));
    setGenerateDialogOpen(false);
    loadData();
  };

  const onSubmit = async (data) => {
    if (editId) {
      await dispatch(updatePurchaseOrder({ id: editId, data }));
    } else {
      await dispatch(createPurchaseOrder(data));
    }
    setOpenForm(false);
    setEditId(null);
    dispatch(clearSelectedOrder());
    loadData();
  };

  const handleCloseDialog = () => {
    setOpenForm(false);
    setEditId(null);
    setViewMode(false);
    dispatch(clearSelectedOrder());
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchPurchaseOrders({ search, status: statusFilter, supplierId: supplierFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchPurchaseOrders({ search, status: statusFilter, supplierId: supplierFilter, page: 1, limit: parseInt(e.target.value) }));
  };

  const details = watch('details');

  const calculateLineTotal = (line) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    const tax = parseFloat(line.taxPercentage) || 0;
    const disc = parseFloat(line.discountPercentage) || 0;
    const gross = qty * price;
    const discAmount = gross * (disc / 100);
    const taxAmount = (gross - discAmount) * (tax / 100);
    return (gross - discAmount + taxAmount).toFixed(2);
  };

  const calculateTotals = () => {
    if (!details) return { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 };
    let sub = 0, tax = 0, disc = 0;
    details.forEach((line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unitPrice) || 0;
      const taxPct = parseFloat(line.taxPercentage) || 0;
      const discPct = parseFloat(line.discountPercentage) || 0;
      const gross = qty * price;
      const discAmt = gross * (discPct / 100);
      const taxAmt = (gross - discAmt) * (taxPct / 100);
      sub += gross;
      disc += discAmt;
      tax += taxAmt;
    });
    return {
      subtotal: sub.toFixed(2),
      discountAmount: disc.toFixed(2),
      taxAmount: tax.toFixed(2),
      total: (sub - disc + tax).toFixed(2),
    };
  };

  const totals = calculateTotals();

  const getSupplierName = (id) => {
    const s = suppliersList.find((x) => x.id === id);
    return s ? s.supplierName || s.name : '';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Purchase Orders</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenGenerate}>
            Generate from PR
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            New Purchase Order
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search PO # or Supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select fullWidth size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="partially_received">Partially Received</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select fullWidth size="small" label="Supplier" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {suppliersList.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.supplierName || s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} fullWidth>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>PO Number</strong></TableCell>
              <TableCell><strong>Supplier</strong></TableCell>
              <TableCell><strong>Order Date</strong></TableCell>
              <TableCell><strong>Expected Delivery</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && !list.length ? (
              <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow>
            ) : list.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No purchase orders found</TableCell></TableRow>
            ) : (
              list.map((order) => (
                <TableRow key={order.id} hover>
                    <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.supplier?.name || getSupplierName(order.supplierId) || '-'}</TableCell>
                  <TableCell>{order.orderDate?.split('T')[0]}</TableCell>
                  <TableCell>{order.expectedDeliveryDate?.split('T')[0]}</TableCell>
                    <TableCell>{parseFloat(order.totalAmount ?? order.total ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={(order.status || 'draft').replace('_', ' ')} color={statusColors[order.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View"><IconButton size="small" onClick={() => handleView(order)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="View as PDF"><IconButton size="small" color="primary" onClick={() => handleViewPdf(order)}><PdfIcon fontSize="small" /></IconButton></Tooltip>
                    {order.status === 'draft' && (
                      <>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(order)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(order)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                        <Tooltip title="Approve"><IconButton size="small" onClick={() => handleApprove(order)}><ApproveIcon fontSize="small" color="success" /></IconButton></Tooltip>
                        <Tooltip title="Cancel"><IconButton size="small" onClick={() => handleReject(order)}><RejectIcon fontSize="small" color="error" /></IconButton></Tooltip>
                      </>
                    )}
                    {(order.status === 'approved' || order.status === 'partially_received') && (
                      <Tooltip title="Create Goods Receipt">
                        <IconButton size="small" color="primary" onClick={() => handleCreateGRN(order)}>
                          <ReceiveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {order.status === 'approved' && (
                      <Tooltip title="Cancel"><IconButton size="small" onClick={() => handleReject(order)}><RejectIcon fontSize="small" color="error" /></IconButton></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={(page || 1) - 1}
          rowsPerPage={limit || 20}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {viewMode ? 'View Purchase Order' : editId ? 'Edit Purchase Order' : 'New Purchase Order'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="poForm" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="PO Number" disabled
                  value={selectedOrder?.orderNumber || 'Auto-generated'}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Supplier *"
                  value={watch('supplierId')}
                  onChange={(e) => setValue('supplierId', e.target.value)}
                  disabled={viewMode}
                  error={!!errors.supplierId}
                  helperText={errors.supplierId?.message}
                >
                  {suppliersList.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.supplierName || s.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="date" label="Order Date *" disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                  {...register('orderDate', { required: 'Order date is required' })}
                  error={!!errors.orderDate}
                  helperText={errors.orderDate?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="date" label="Expected Delivery Date" disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                  {...register('expectedDeliveryDate')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Warehouse" disabled={viewMode}
                  value={watch('warehouseId')}
                  onChange={(e) => setValue('warehouseId', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {warehouseList.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{w.warehouseName || w.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Notes" disabled={viewMode} multiline rows={2} {...register('notes')} />
              </Grid>
            </Grid>

            <Typography variant="h6" mt={3} mb={1}>Line Items</Typography>
            <Divider sx={{ mb: 2 }} />

            {fields.map((field, index) => (
              <Grid container spacing={1} key={field.id} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={12} sm={3}>
                  <Controller
                    name={`details.${index}.itemId`}
                    control={control}
                    rules={{ required: 'Item is required' }}
                    render={({ field: f }) => (
                      <TextField select fullWidth size="small" label="Item *" value={f.value || ''}
                        onChange={(e) => {
                          f.onChange(e.target.value);
                          const item = itemsList.find((it) => it.id === e.target.value);
                          if (item) {
                            setValue(`details.${index}.description`, item.description || '');
                            setValue(`details.${index}.unitPrice`, item.purchasePrice || item.costPrice || 0);
                          }
                        }}
                        disabled={viewMode}
                        error={!!errors.details?.[index]?.itemId}
                        helperText={errors.details?.[index]?.itemId?.message}
                      >
                        {itemsList.map((item) => (
                          <MenuItem key={item.id} value={item.id}>{item.itemName || item.name}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField fullWidth size="small" label="Description" disabled={viewMode} {...register(`details.${index}.description`)} />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField fullWidth size="small" type="number" label="Qty *" disabled={viewMode}
                    {...register(`details.${index}.quantity`, { required: 'Required', min: { value: 0.01, message: 'Min 0.01' } })}
                    error={!!errors.details?.[index]?.quantity}
                    helperText={errors.details?.[index]?.quantity?.message}
                    inputProps={{ step: '0.01', min: '0.01' }}
                    onChange={(e) => {
                      setValue(`details.${index}.quantity`, parseFloat(e.target.value) || 0);
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField fullWidth size="small" type="number" label="Price *" disabled={viewMode}
                    {...register(`details.${index}.unitPrice`, { required: 'Required', min: 0 })}
                    error={!!errors.details?.[index]?.unitPrice}
                    helperText={errors.details?.[index]?.unitPrice?.message}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField fullWidth size="small" type="number" label="Tax %" disabled={viewMode}
                    {...register(`details.${index}.taxPercentage`, { min: 0, max: 100 })}
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField fullWidth size="small" type="number" label="Disc %" disabled={viewMode}
                    {...register(`details.${index}.discountPercentage`, { min: 0, max: 100 })}
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {calculateLineTotal(details[index] || {})}
                  </Typography>
                </Grid>
                {!viewMode && (
                  <Grid item xs={12} sm={1}>
                    <IconButton size="small" color="error" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            ))}

            {!viewMode && (
              <Button variant="outlined" size="small" onClick={() => append({ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 })} sx={{ mt: 1 }}>
                Add Line
              </Button>
            )}

            <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1}>
              <Grid container spacing={2}>
                <Grid item xs={3}><Typography variant="body2">Subtotal:</Typography><Typography variant="h6">{totals.subtotal}</Typography></Grid>
                <Grid item xs={3}><Typography variant="body2">Discount:</Typography><Typography variant="h6">{totals.discountAmount}</Typography></Grid>
                <Grid item xs={3}><Typography variant="body2">Tax:</Typography><Typography variant="h6">{totals.taxAmount}</Typography></Grid>
                <Grid item xs={3}><Typography variant="body2">Total:</Typography><Typography variant="h6" color="primary">{totals.total}</Typography></Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {!viewMode && (
            <Button type="submit" form="poForm" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Generate from PR Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Purchase Orders from Purchase Requests</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Select</TableCell>
                  <TableCell><strong>PR Number</strong></TableCell>
                  <TableCell><strong>Requested By</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvedPRs && approvedPRs.length > 0 ? approvedPRs.map((pr) => (
                  <TableRow key={pr.id} hover selected={selectedPRs.includes(pr.id)} onClick={() => togglePRSelection(pr.id)}>
                    <TableCell padding="checkbox">
                      <input type="checkbox" checked={selectedPRs.includes(pr.id)} readOnly />
                    </TableCell>
                    <TableCell>{pr.requestNumber}</TableCell>
                    <TableCell>{pr.requestor ? `${pr.requestor.firstName || ''} ${pr.requestor.lastName || ''}`.trim() || pr.requestor.username : pr.requestedBy}</TableCell>
                    <TableCell>{pr.requestDate?.split('T')[0]}</TableCell>
                    <TableCell><Chip label="Approved" color="info" size="small" /></TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} align="center">No approved purchase requests available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerateFromPRs} disabled={selectedPRs.length === 0 || submitting}>
            Generate PO{selectedPRs.length > 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onClose={handleClosePdfPreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">PO Preview - {pdfFilename.replace('PurchaseOrder_', '').replace('.pdf', '')}</Typography>
            <Stack direction="row" spacing={1}>
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
        <DialogTitle><Stack direction="row" alignItems="center" spacing={1}><EmailIcon color="primary" /><Typography variant="h6">Send PO via Email</Typography></Stack></DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Recipient Email" type="email" required value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)} placeholder="supplier@example.com" size="small" />
            <TextField fullWidth label="Subject" value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={`Purchase Order #${pdfFilename.replace('PurchaseOrder_', '').replace('.pdf', '')}`} size="small" />
            <TextField fullWidth label="Email Body" multiline rows={8} value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={`Dear Supplier,\n\nPlease find attached the purchase order.\n\nBest regards,\n${activeCompany?.name || 'EzeeFlo ERP'}`} />
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

export default PurchaseOrders;