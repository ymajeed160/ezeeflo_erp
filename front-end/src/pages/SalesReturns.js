import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as PostIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchReturns,
  fetchReturn,
  createReturn,
  updateReturn,
  deleteReturn,
  rejectReturn,
  postReturn,
  clearSelected,
} from '../store/slices/salesReturnSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';
import SalesReturnApi from '../services/salesReturnApi';

const statusColors = {
  draft: 'default',
  approved: 'success',
  rejected: 'error',
  posted: 'success',
};

const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SalesReturns = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, selected, loading, error, count, page, limit, totalPages } = useSelector((s) => s.salesReturns);
  const customersList = useSelector((s) => s.customers?.customers || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [forReturnInvoices, setForReturnInvoices] = useState([]);
  const [returnableLines, setReturnableLines] = useState([]);
  const [invoiceInfo, setInvoiceInfo] = useState(null);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      returnDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      salesInvoiceId: null,
      notes: '',
      details: [{ salesInvoiceDetailId: null, itemId: '', description: '', quantity: 0, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0, lineTotal: 0 }],
    },
  });

  const { fields, replace } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchReturns({ search, status: statusFilter, customerId: customerFilter, page, limit }));
  }, [dispatch, search, statusFilter, customerFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomers({ limit: 999 }));
  }, [loadData, dispatch]);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchReturn(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selected && openForm && editId) {
      reset({
        customerId: selected.customerId || '',
        returnDate: selected.returnDate?.split('T')[0] || '',
        warehouseId: selected.warehouseId || '',
        salesInvoiceId: selected.salesInvoiceId || null,
        notes: selected.notes || '',
        details: selected.details?.length ? selected.details.map((d) => ({
          id: d.id,
          salesInvoiceDetailId: d.salesInvoiceDetailId || null,
          itemId: d.itemId || '',
          description: d.description || '',
          quantity: d.quantity || 0,
          unitPrice: d.unitPrice || 0,
          taxPercent: d.taxPercent || 0,
          discountPercent: d.discountPercent || 0,
          costPrice: d.costPrice || 0,
          lineTotal: d.lineTotal || 0,
        })) : [],
      });
    }
  }, [selected, openForm, editId, reset]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    setForReturnInvoices([]);
    setReturnableLines([]);
    setInvoiceInfo(null);
    dispatch(clearSelected());
    reset({
      customerId: '',
      returnDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      salesInvoiceId: null,
      notes: '',
      details: [],
    });
    setOpenForm(true);
  };

  const handleCustomerSelect = async (customerId) => {
    setValue('customerId', customerId);
    setValue('salesInvoiceId', null);
    setValue('warehouseId', '');
    setReturnableLines([]);
    setInvoiceInfo(null);
    replace([]);
    setForReturnInvoices([]);
    if (!customerId) return;
    try {
      const res = await SalesReturnApi.listInvoicesForReturn(customerId);
      setForReturnInvoices(res?.data || []);
    } catch (e) {
      setForReturnInvoices([]);
    }
  };

  const handleInvoiceSelect = async (invoiceId) => {
    setValue('salesInvoiceId', invoiceId || null);
    if (!invoiceId) {
      setReturnableLines([]);
      setInvoiceInfo(null);
      replace([]);
      return;
    }
    try {
      const res = await SalesReturnApi.getReturnableLines(invoiceId);
      setReturnableLines(res?.lines || []);
      setInvoiceInfo(res?.invoice || null);
      if (res?.invoice?.warehouseId) setValue('warehouseId', res.invoice.warehouseId);
      replace((res?.lines || []).map((l) => ({
        salesInvoiceDetailId: l.salesInvoiceDetailId,
        itemId: l.itemId,
        description: l.description || '',
        quantity: 0,
        unitPrice: l.unitPrice,
        taxPercent: l.taxPercent,
        discountPercent: l.discountPercent,
        costPrice: l.costPrice,
        lineTotal: 0,
      })));
    } catch (e) {
      setReturnableLines([]);
      replace([]);
      apiError(e.response?.data?.message || 'Failed to load invoice lines');
    }
  };

  const handleEdit = (returnItem) => {
    if (returnItem.status !== 'draft') {
      apiError('Only draft returns can be edited');
      return;
    }
    setViewMode(false);
    setEditId(returnItem.id);
    setReturnableLines([]);
    dispatch(fetchReturn(returnItem.id));
    setOpenForm(true);
  };

  const handleView = (returnItem) => {
    setViewMode(true);
    setEditId(returnItem.id);
    dispatch(fetchReturn(returnItem.id));
    setOpenForm(true);
  };

  const handleDelete = async (returnItem) => {
    if (returnItem.status !== 'draft') {
      apiError('Only draft returns can be deleted');
      return;
    }
    const confirmed = await confirmDialog('Are you sure you want to delete this sales return?');
    if (confirmed) {
      dispatch(deleteReturn(returnItem.id)).then(() => loadData());
    }
  };

  const handlePost = async (returnItem) => {
    setPostTarget(returnItem);
    setPostPreview(null);
    setOpenPostDialog(true);
    setPreviewLoading(true);
    try {
      const preview = await SalesReturnApi.getPostingPreview(returnItem.id);
      setPostPreview(preview);
    } catch (error) {
      apiError(error.response?.data?.message || error.message || 'Failed to load posting preview');
      setOpenPostDialog(false);
      setPostTarget(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!postTarget) return;
    try {
      const response = await dispatch(postReturn(postTarget.id)).unwrap();
      if (response) {
        apiSuccess('Return posted successfully - Journal entry created');
        setOpenPostDialog(false);
        setPostTarget(null);
        setPostPreview(null);
        loadData();
      }
    } catch (error) {
      apiError(error?.message || error || 'Failed to post return');
    }
  };

  const handleClosePost = () => {
    setOpenPostDialog(false);
    setPostTarget(null);
    setPostPreview(null);
  };

  const handleReject = async (returnItem) => {
    const confirmed = await confirmDialog(
      `Reject Return #${returnItem.returnNumber}? This will mark the return as rejected.`
    );
    if (confirmed) {
      dispatch(rejectReturn(returnItem.id)).then((res) => {
        if (res.payload) loadData();
      });
    }
  };

  const onSubmit = async (data) => {
    if (!data.salesInvoiceId) {
      apiError('Please select a Sales Invoice');
      return;
    }
    const lines = (data.details || []).filter((d) => d.itemId && parseFloat(d.quantity) > 0);
    if (!lines.length) {
      apiError('Enter at least one return quantity greater than 0');
      return;
    }

    // Frontend validation: return qty cannot exceed remaining returnable qty
    for (const d of data.details || []) {
      const qty = parseFloat(d.quantity) || 0;
      if (qty <= 0) continue;
      const line = returnableLines.find((l) => l.salesInvoiceDetailId === d.salesInvoiceDetailId)
        || returnableLines.find((l) => l.itemId === d.itemId);
      if (line && qty > parseFloat(line.remainingQty || 0)) {
        apiError(`Return quantity for "${line.itemName || 'item'}" cannot exceed the remaining returnable quantity (${line.remainingQty}).`);
        return;
      }
    }

    const payload = {
      customerId: data.customerId,
      salesInvoiceId: data.salesInvoiceId,
      warehouseId: data.warehouseId || null,
      returnDate: data.returnDate,
      notes: data.notes || '',
      isInventoryImpact: lines.some((d) => {
        const line = returnableLines.find((l) => l.salesInvoiceDetailId === d.salesInvoiceDetailId)
          || returnableLines.find((l) => l.itemId === d.itemId);
        return line ? line.itemType !== 'service' : false;
      }),
      details: lines.map((d) => {
        const qty = parseFloat(d.quantity) || 0;
        const unitPrice = parseFloat(d.unitPrice) || 0;
        const taxPercent = parseFloat(d.taxPercent) || 0;
        const discountPercent = parseFloat(d.discountPercent) || 0;
        const gross = qty * unitPrice;
        const discountAmount = gross * discountPercent / 100;
        const taxAmount = (gross - discountAmount) * taxPercent / 100;
        return {
          id: d.id || undefined,
          salesInvoiceDetailId: d.salesInvoiceDetailId || null,
          itemId: d.itemId,
          description: d.description || '',
          quantity: qty,
          unitPrice,
          taxPercent,
          discountPercent,
          lineTotal: parseFloat((gross - discountAmount + taxAmount).toFixed(2)),
          costPrice: parseFloat(d.costPrice) || 0,
        };
      }),
    };

    if (editId) {
      await dispatch(updateReturn({ id: editId, data: payload }));
    } else {
      await dispatch(createReturn(payload));
    }
    setOpenForm(false);
    setEditId(null);
    dispatch(clearSelected());
    loadData();
  };

  const handleClose = () => {
    setOpenForm(false);
    setEditId(null);
    setViewMode(false);
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchReturns({ search, status: statusFilter, customerId: customerFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchReturns({ search, status: statusFilter, customerId: customerFilter, page: 1, limit: parseInt(e.target.value) }));
  };

  const details = watch('details');

  const calculateLineTotal = (line) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    const tax = parseFloat(line.taxPercent) || 0;
    const disc = parseFloat(line.discountPercent) || 0;
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
      const taxPct = parseFloat(line.taxPercent) || 0;
      const discPct = parseFloat(line.discountPercent) || 0;
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

  const renderFormDialog = () => (
    <Dialog open={openForm} onClose={handleClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {viewMode ? 'View Sales Return' : editId ? 'Edit Sales Return' : 'New Sales Return'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Header Row 1 */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="customerId"
                control={control}
                rules={{ required: 'Customer is required' }}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode}
                    value={customersList.find((c) => c.id === field.value) || null}
                    onChange={(_, val) => {
                      const newId = val ? val.id : '';
                      field.onChange(newId);
                      if (!viewMode) handleCustomerSelect(newId);
                    }}
                    options={customersList}
                    getOptionLabel={(opt) => `${opt.code || ''} - ${opt.name || ''}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Customer" error={!!errors.customerId} helperText={errors.customerId?.message} />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Return Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled={viewMode}
                {...register('returnDate', { required: 'Return date is required' })}
                error={!!errors.returnDate}
                helperText={errors.returnDate?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Warehouse"
                disabled
                value={(viewMode || editId) ? (selected?.warehouseName || '') : (invoiceInfo?.warehouseName || '')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="salesInvoiceId"
                control={control}
                rules={{ required: 'Sales Invoice is required' }}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode || (!editId && !watch('customerId'))}
                    value={forReturnInvoices.find((inv) => inv.id === field.value) || null}
                    onChange={(_, val) => {
                      const invId = val ? val.id : null;
                      field.onChange(invId);
                      if (!viewMode) handleInvoiceSelect(invId);
                    }}
                    options={forReturnInvoices}
                    getOptionLabel={(opt) =>
                      `${opt.invoiceNumber || ''} | Total: ${formatCurrency(opt.grandTotal)} | Returnable: ${formatCurrency(opt.returnableTotal)}`
                    }
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Sales Invoice" error={!!errors.salesInvoiceId} helperText={errors.salesInvoiceId?.message} />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                disabled={viewMode}
                {...register('notes')}
              />
            </Grid>
          </Grid>

          {/* Accounting Information (view mode only — accounts are auto-resolved at posting) */}
          {viewMode && selected && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Accounting
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">Customer Account</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selected.customerAccount ? `${selected.customerAccount.code} - ${selected.customerAccount.name}` : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">Sales Revenue</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selected.revenueAccount ? `${selected.revenueAccount.code} - ${selected.revenueAccount.name}` : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">VAT Account</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selected.taxAccount ? `${selected.taxAccount.code} - ${selected.taxAccount.name}` : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">Journal Entry</Typography>
                    <Typography variant="body2" fontWeight={600}>{selected.journalEntryNumber || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'uppercase' }}>{selected.status}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}

          {/* Detail Lines */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Return Lines
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Description</TableCell>
                  <TableCell align="right">Invoiced Qty</TableCell>
                  <TableCell align="right">Returned Qty</TableCell>
                  <TableCell align="right">Return Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Line Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => {
                  const line = returnableLines.find((l) => l.salesInvoiceDetailId === details[index]?.salesInvoiceDetailId)
                    || returnableLines.find((l) => l.itemId === details[index]?.itemId);
                  const qty = parseFloat(details[index]?.quantity) || 0;
                  const maxQty = line ? parseFloat(line.remainingQty || 0) : 0;
                  const over = line && qty > maxQty;
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{line?.itemName || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          disabled={viewMode}
                          {...register(`details.${index}.description`)}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell align="right">{line ? line.invoicedQty : '-'}</TableCell>
                      <TableCell align="right">{line ? line.returnedQty : '-'}</TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          disabled={viewMode}
                          inputProps={{ step: 'any', min: 0, max: line ? line.remainingQty : 0 }}
                          error={over}
                          helperText={over ? 'Exceeds remaining qty' : ''}
                          {...register(`details.${index}.quantity`, {
                            min: 0,
                            validate: (v) => {
                              if (line && parseFloat(v || 0) > maxQty) return 'Exceeds remaining qty';
                              return true;
                            },
                          })}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(details[index]?.unitPrice)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">{calculateLineTotal(details[index])}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {!viewMode && !watch('salesInvoiceId') && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Select a customer and sales invoice to load returnable items.
            </Typography>
          )}

          {/* Totals */}
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block">Subtotal</Typography>
                <Typography variant="subtitle1" fontWeight="bold">{calculateTotals().subtotal}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block">Discount</Typography>
                <Typography variant="subtitle1" fontWeight="bold">{calculateTotals().discountAmount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block">Tax</Typography>
                <Typography variant="subtitle1" fontWeight="bold">{calculateTotals().taxAmount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.50', borderColor: 'primary.main' }}>
                <Typography variant="caption" color="text.secondary" display="block">Grand Total</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">{calculateTotals().total}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {!viewMode && (
            <Button type="submit" variant="contained" disabled={loading}>
              {editId ? 'Update' : 'Save'} Return
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap">
        <Typography variant="h4">Sales Returns</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            New Return
          </Button>
        </Stack>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search returns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="posted">Posted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                size="small"
                value={customersList.find((c) => c.id === customerFilter) || null}
                onChange={(_, val) => setCustomerFilter(val ? val.id : '')}
                options={customersList}
                getOptionLabel={(opt) => `${opt.customerCode} - ${opt.customerName}`}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => <TextField {...params} label="Customer" />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>
                  Refresh
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Return #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">Grand Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No sales returns found</TableCell>
                </TableRow>
              ) : (
                items.map((ret) => (
                  <TableRow key={ret.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{ret.returnNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ret.customerName || '-'}</Typography>
                    </TableCell>
                    <TableCell>{ret.returnDate}</TableCell>
                    <TableCell>{ret.warehouseName || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{parseFloat(ret.grandTotal || 0).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={ret.status?.replace('_', ' ').toUpperCase()} color={statusColors[ret.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(ret)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {ret.status === 'draft' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(ret)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Confirm & Post">
                              <IconButton size="small" color="success" onClick={() => handlePost(ret)}>
                                <PostIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" color="warning" onClick={() => handleReject(ret)}>
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(ret)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={count}
          page={page - 1}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Form Dialog */}
      {renderFormDialog()}

      {/* Post Confirmation Dialog */}
      <Dialog open={openPostDialog} onClose={handleClosePost} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Sales Return #{postTarget?.returnNumber || ''}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to confirm and post this Sales Return?
            A journal entry will be created and inventory updated (if applicable).
            The accounts below are resolved automatically.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            {previewLoading ? (
              <Typography variant="body2">Loading resolved accounts...</Typography>
            ) : postPreview ? (
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">Customer Account</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {postPreview.customerAccount
                      ? `${postPreview.customerAccount.code} - ${postPreview.customerAccount.name}`
                      : 'Not resolved'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">Sales Revenue Account</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {postPreview.revenueAccount
                      ? `${postPreview.revenueAccount.code} - ${postPreview.revenueAccount.name}`
                      : 'Not resolved'}
                  </Typography>
                </Grid>
                {parseFloat(postPreview.taxTotal) > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">VAT Account</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {postPreview.taxAccount
                        ? `${postPreview.taxAccount.code} - ${postPreview.taxAccount.name}`
                        : 'Not resolved'}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Return Amount: AED {formatCurrency(postPreview.subTotal - postPreview.discountTotal)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    VAT: AED {formatCurrency(postPreview.taxTotal)}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    Grand Total: AED {formatCurrency(postPreview.grandTotal)}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2">No preview available.</Typography>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePost}>Cancel</Button>
          <Button
            onClick={handlePostSubmit}
            variant="contained"
            color="primary"
            disabled={previewLoading || !postPreview}
          >
            Confirm & Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesReturns;