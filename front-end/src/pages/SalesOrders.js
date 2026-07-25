import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Autocomplete,
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
  DoNotDisturb as CloseIcon,
  FileDownload as ExportIcon,
  Cancel as CancelIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchSalesOrders,
  fetchSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  approveSalesOrder,
  closeSalesOrder,
  clearSelectedOrder,
} from '../store/slices/salesOrderSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';
import { generateSalesOrderPdf } from '../utils/pdfSalesOrder';
import salesOrderApi from '../services/salesOrderApi';
import PdfViewer from '../components/PdfViewer';

const statusColors = {
  draft: 'default',
  approved: 'info',
  partially_delivered: 'warning',
  delivered: 'success',
  closed: 'secondary',
};

const SalesOrders = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { list, total, page, limit, selectedOrder, loading, submitting } = useSelector((s) => s.salesOrders);
  const { customers: customersList } = useSelector((s) => s.customers);
  const { items: itemsList } = useSelector((s) => s.items);
  const { warehouses: warehouseList } = useSelector((s) => s.warehouses);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
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

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      orderDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      reference: '',
      notes: '',
      status: 'draft',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchSalesOrders({ search, status: statusFilter, customerId: customerFilter, page, limit }));
  }, [dispatch, search, statusFilter, customerFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomers({ limit: 999 }));
    dispatch(fetchItems({ limit: 999 }));
    dispatch(fetchWarehouses({ limit: 999 }));
  }, [loadData, dispatch]);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchSalesOrder(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selectedOrder && openForm && editId) {
      reset({
        customerId: selectedOrder.customerId || '',
        orderDate: selectedOrder.orderDate?.split('T')[0] || '',
        warehouseId: selectedOrder.warehouseId || '',
        reference: selectedOrder.reference || '',
        notes: selectedOrder.notes || '',
        status: selectedOrder.status || 'draft',
        details: selectedOrder.details?.length ? selectedOrder.details.map((d) => ({
          itemId: d.itemId || '',
          description: d.description || '',
          quantity: d.quantity || 0,
          unitPrice: d.unitPrice || 0,
          taxPercentage: d.taxPercentage || 0,
          discountPercentage: d.discountPercentage || 0,
        })) : [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
      });
    }
  }, [selectedOrder, openForm, editId, reset]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    dispatch(clearSelectedOrder());
    reset({
      customerId: '',
      orderDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      reference: '',
      notes: '',
      status: 'draft',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    });
    setOpenForm(true);
  };

  const handleEdit = (order) => {
    setViewMode(false);
    setEditId(order.id);
    dispatch(fetchSalesOrder(order.id));
    setOpenForm(true);
  };

  const handleView = (order) => {
    setViewMode(true);
    setEditId(order.id);
    dispatch(fetchSalesOrder(order.id));
    setOpenForm(true);
  };

  const handleViewPdf = async (order) => {
    try {
      const response = await salesOrderApi.getById(order.id);
      const orderDetail = response.data?.data || response.data || response;
      const companyInfo = {
        name: activeCompany?.name || 'EzeeFlo ERP',
        address: activeCompany?.address || '',
        phone: activeCompany?.phone || '',
        email: activeCompany?.email || '',
        logo: activeCompany?.logo || null,
        currencyCode: activeCompany?.currencyCode || 'AED',
        trnTin: activeCompany?.trnTin || '',
      };
      const { blobUrl, pdfBlob, filename } = await generateSalesOrderPdf(orderDetail, companyInfo);
      setPdfBlobUrl(blobUrl);
      setPdfFilename(filename);
      setPdfOrderId(order.id);
      setPdfPreviewOpen(true);
    } catch (error) {
      apiError(error.response?.data?.message || error.message || 'Failed to generate PDF');
    }
  };

  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfFilename('');
    setPdfOrderId(null);
  };

  const handlePrintPdf = () => {
    if (!pdfBlobUrl) return;
    const printWindow = window.open(pdfBlobUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => printWindow.print());
    }
  };

  const blobUrlToBase64 = async (blobUrl) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleOpenEmailDialog = () => {
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      apiError('Please enter recipient email address');
      return;
    }
    if (!pdfBlobUrl || !pdfOrderId) {
      apiError('PDF not ready. Please generate the PDF first.');
      return;
    }
    setSendingEmail(true);
    try {
      const pdfBase64 = await blobUrlToBase64(pdfBlobUrl);
      const response = await salesOrderApi.sendEmail(pdfOrderId, {
        to: emailTo,
        subject: emailSubject || undefined,
        body: emailBody || undefined,
        pdfBase64,
      });
      if (response.success) {
        apiSuccess('Sales Order sent successfully');
        setEmailDialogOpen(false);
        setEmailTo('');
        setEmailSubject('');
        setEmailBody('');
      }
    } catch (error) {
      apiError(error.response?.data?.message || error.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async (order) => {
    const confirmed = await confirmDialog('Are you sure you want to delete this sales order?');
    if (confirmed) {
      dispatch(deleteSalesOrder(order.id)).then(() => loadData());
    }
  };

  const handleApprove = (order) => {
    dispatch(approveSalesOrder(order.id)).then(() => loadData());
  };

  const handleClose = (order) => {
    dispatch(closeSalesOrder(order.id)).then(() => loadData());
  };

  const onSubmit = async (data) => {
    if (editId) {
      await dispatch(updateSalesOrder({ id: editId, data }));
    } else {
      await dispatch(createSalesOrder(data));
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
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchSalesOrders({ search, status: statusFilter, customerId: customerFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchSalesOrders({ search, status: statusFilter, customerId: customerFilter, page: 1, limit: parseInt(e.target.value) }));
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Sales Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          New Sales Order
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField select fullWidth size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="partially_delivered">Partially Delivered</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <IconButton onClick={loadData}><RefreshIcon /></IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Order #</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : list.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No sales orders found</TableCell></TableRow>
            ) : list.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.customer?.name}</TableCell>
                <TableCell>{order.orderDate?.split('T')[0]}</TableCell>
                <TableCell>{parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip label={(order.status || '').replace('_', ' ').toUpperCase()} color={statusColors[order.status] || 'default'} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="View"><IconButton size="small" onClick={() => handleView(order)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="View as PDF"><IconButton size="small" color="primary" onClick={() => handleViewPdf(order)}><PdfIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(order)} disabled={order.status !== 'draft'}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    {order.status === 'draft' && (
                      <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(order)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {['approved', 'partially_delivered'].includes(order.status) && (
                      <Tooltip title="Close"><IconButton size="small" color="warning" onClick={() => handleClose(order)}><CloseIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(order)} disabled={order.status !== 'draft'}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </TableContainer>

      {/* Create/Edit/View Dialog */}
      <Dialog open={openForm} onClose={handleCloseDialog} fullWidth maxWidth="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {viewMode ? 'View Sales Order' : editId ? 'Edit Sales Order' : 'New Sales Order'}
            {selectedOrder?.orderNumber && (
              <Chip label={selectedOrder.orderNumber} sx={{ ml: 2 }} />
            )}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customerId"
                  control={control}
                  rules={{ required: 'Customer is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      options={customersList}
                      getOptionLabel={(opt) => `${opt.itemCode || opt.code} - ${opt.name}`}
                      value={customersList.find((c) => c.id === field.value) || null}
                      onChange={(e, val) => field.onChange(val?.id || '')}
                      renderInput={(params) => (
                        <TextField {...params} label="Customer" error={!!errors.customerId} helperText={errors.customerId?.message} fullWidth disabled={viewMode} />
                      )}
                      disabled={viewMode}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Order Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('orderDate', { required: true })} disabled={viewMode} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller
                  name="warehouseId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={warehouseList}
                      getOptionLabel={(opt) => opt.name}
                      value={warehouseList.find((w) => w.id === field.value) || null}
                      onChange={(e, val) => field.onChange(val?.id || '')}
                      renderInput={(params) => <TextField {...params} label="Warehouse" fullWidth />}
                      disabled={viewMode}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Reference" fullWidth {...register('reference')} disabled={viewMode} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select label="Status" fullWidth {...register('status')} disabled={viewMode || !editId}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="partially_delivered">Partially Delivered</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Line Items</Typography>
              </Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="25%">Item</TableCell>
                        <TableCell width="20%">Description</TableCell>
                        <TableCell width="10%">Qty</TableCell>
                        <TableCell width="10%">Unit Price</TableCell>
                        <TableCell width="10%">Tax %</TableCell>
                        <TableCell width="10%">Disc %</TableCell>
                        <TableCell width="10%">Total</TableCell>
                        {!viewMode && <TableCell width="5%"></TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              name={`details.${index}.itemId`}
                              control={control}
                              rules={{ required: 'Item is required' }}
                              render={({ field: f }) => (
                                <Autocomplete
                                  size="small"
                                  options={itemsList}
                                  getOptionLabel={(opt) => `${opt.itemCode || opt.code} - ${opt.name}`}
                                  value={itemsList.find((i) => i.id === f.value) || null}
                                  onChange={(e, val) => {
                                    f.onChange(val?.id || '');
                                    if (val) {
                                      setValue(`details.${index}.unitPrice`, Number(val.sellingPrice) || 0);
                                      setValue(`details.${index}.taxPercentage`, Number(val.taxPercentage) || 0);
                                    }
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} error={!!errors.details?.[index]?.itemId} helperText={errors.details?.[index]?.itemId?.message} />
                                  )}
                                  disabled={viewMode}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth {...register(`details.${index}.description`)} disabled={viewMode} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" fullWidth {...register(`details.${index}.quantity`, { required: true, valueAsNumber: true })} disabled={viewMode} inputProps={{ min: 0, step: 1 }} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" fullWidth {...register(`details.${index}.unitPrice`, { required: true, valueAsNumber: true })} disabled={viewMode} inputProps={{ min: 0, step: 0.01 }} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" fullWidth {...register(`details.${index}.taxPercentage`, { valueAsNumber: true })} disabled={viewMode} inputProps={{ min: 0, max: 100, step: 0.01 }} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" fullWidth {...register(`details.${index}.discountPercentage`, { valueAsNumber: true })} disabled={viewMode} inputProps={{ min: 0, max: 100, step: 0.01 }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{calculateLineTotal(watch(`details.${index}`) || {})}</Typography>
                          </TableCell>
                          {!viewMode && (
                            <TableCell>
                              <IconButton size="small" color="error" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {!viewMode && (
                  <Button size="small" sx={{ mt: 1 }} onClick={() => append({ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 })}>
                    + Add Line
                  </Button>
                )}
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Stack spacing={0.5} textAlign="right">
                    <Typography variant="body2">Subtotal: <strong>{totals.subtotal}</strong></Typography>
                    <Typography variant="body2">Discount: <strong>{totals.discountAmount}</strong></Typography>
                    <Typography variant="body2">Tax: <strong>{totals.taxAmount}</strong></Typography>
                    <Typography variant="h6">Total: <strong>{totals.total}</strong></Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Notes" fullWidth multiline rows={2} {...register('notes')} disabled={viewMode} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            {!viewMode && (
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onClose={handleClosePdfPreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Sales Order Preview - {pdfFilename.replace('SalesOrder_', '').replace('.pdf', '')}</Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Send Email"><IconButton size="small" color="primary" onClick={handleOpenEmailDialog}><EmailIcon /></IconButton></Tooltip>
              <Tooltip title="Print"><IconButton size="small" color="secondary" onClick={handlePrintPdf}><PrintIcon /></IconButton></Tooltip>
              <Tooltip title="Download PDF"><IconButton size="small" color="primary" onClick={() => {
                if (pdfBlobUrl) { const a = document.createElement('a'); a.href = pdfBlobUrl; a.download = pdfFilename; a.click(); }
              }}>
                <ExportIcon />
              </IconButton></Tooltip>
              <IconButton size="small" onClick={handleClosePdfPreview}><CancelIcon /></IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 0, overflow: 'hidden' }}>
          {pdfBlobUrl && <PdfViewer blobUrl={pdfBlobUrl} />}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EmailIcon color="primary" />
            <Typography variant="h6">Send Sales Order via Email</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Recipient Email" type="email" required value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)} placeholder="customer@example.com" size="small" />
            <TextField fullWidth label="Subject" value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={`Sales Order #${pdfFilename.replace('SalesOrder_', '').replace('.pdf', '')}`} size="small" />
            <TextField fullWidth label="Email Body" multiline rows={8} value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={`Dear Customer,\n\nPlease find attached the sales order for your reference.\n\nBest regards,\n${activeCompany?.name || 'EzeeFlo ERP'}`} />
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

export default SalesOrders;