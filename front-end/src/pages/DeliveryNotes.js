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
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LocalShipping as DeliverIcon,
  Cancel as CancelIcon,
  NoteAdd as GenerateIcon,
  ReceiptLong as InvoiceIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchDeliveryNotes,
  fetchDeliveryNoteById,
  createDeliveryNote,
  generateDeliveryFromSO,
  updateDeliveryNote,
  deleteDeliveryNote,
  updateDeliveryNoteStatus,
  clearSelectedDeliveryNote,
} from '../store/slices/deliveryNoteSlice';
import deliveryNoteApi from '../services/deliveryNoteApi';
import { fetchCustomers } from '../store/slices/customerSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchSalesOrders, fetchSalesOrder } from '../store/slices/salesOrderSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';

const statusColors = {
  draft: 'default',
  delivered: 'success',
  cancelled: 'error',
};

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DeliveryNotes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();

  const { items, pagination, selectedDeliveryNote, loading, createLoading, updateLoading } =
    useSelector((s) => s.deliveryNotes);
  const { customers: customersList } = useSelector((s) => s.customers);
  const { items: itemsList } = useSelector((s) => s.items);
  const { warehouses: warehouseList } = useSelector((s) => s.warehouses);
  const { list: salesOrdersList } = useSelector((s) => s.salesOrders);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [generateMode, setGenerateMode] = useState(false);
  const [selectedSO, setSelectedSO] = useState(null);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      salesOrderId: '',
      customerId: '',
      warehouseId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchDeliveryNotes({ search, status: statusFilter, page: pagination.page, limit: pagination.limit || 10 }));
  }, [dispatch, search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomers({ limit: 999 }));
    dispatch(fetchItems({ limit: 999 }));
    dispatch(fetchWarehouses({ limit: 999 }));
    dispatch(fetchSalesOrders({ limit: 999, status: 'approved,partially_delivered' }));
  }, [loadData, dispatch]);

  useEffect(() => {
    if (id) {
      if (id === 'new' || id === ':id') return;
      if (openForm) {
        dispatch(fetchDeliveryNoteById(id));
      }
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selectedDeliveryNote && openForm && editId) {
      reset({
        salesOrderId: selectedDeliveryNote.salesOrderId || '',
        customerId: selectedDeliveryNote.customerId || '',
        warehouseId: selectedDeliveryNote.warehouseId || '',
        deliveryDate: selectedDeliveryNote.deliveryDate?.split('T')[0] || '',
        reference: selectedDeliveryNote.reference || '',
        notes: selectedDeliveryNote.notes || '',
        details: selectedDeliveryNote.details?.length
          ? selectedDeliveryNote.details.map((d) => ({
              itemId: d.itemId || '',
              description: d.description || '',
              quantity: d.quantity || 0,
              unitPrice: d.unitPrice || 0,
              taxPercentage: d.taxPercentage || 0,
              discountPercentage: d.discountPercentage || 0,
              salesOrderDetailId: d.salesOrderDetailId || null,
            }))
          : [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
      });
    }
  }, [selectedDeliveryNote, openForm, editId, reset]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    setGenerateMode(false);
    setSelectedSO(null);
    dispatch(clearSelectedDeliveryNote());
    reset({
      salesOrderId: '',
      customerId: '',
      warehouseId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    });
    setOpenForm(true);
  };

  const handleGenerateFromSO = () => {
    setViewMode(false);
    setEditId(null);
    setGenerateMode(true);
    setSelectedSO(null);
    dispatch(clearSelectedDeliveryNote());
    reset({
      salesOrderId: '',
      customerId: '',
      warehouseId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
      details: [],
    });
    setOpenForm(true);
  };

  const handleEdit = (dn) => {
    setViewMode(false);
    setEditId(dn.id);
    setGenerateMode(false);
    setSelectedSO(null);
    dispatch(fetchDeliveryNoteById(dn.id));
    setOpenForm(true);
  };

  const handleView = (dn) => {
    setViewMode(true);
    setEditId(dn.id);
    setGenerateMode(false);
    dispatch(fetchDeliveryNoteById(dn.id));
    setOpenForm(true);
  };

  const handleDelete = async (dn) => {
    const confirmed = await confirmDialog('Are you sure you want to delete this delivery note?');
    if (confirmed) {
      dispatch(deleteDeliveryNote(dn.id)).then(() => loadData());
    }
  };

  const handleDeliver = (dn) => {
    dispatch(updateDeliveryNoteStatus({ id: dn.id, status: 'delivered' })).then(() => loadData());
  };

  const handleCancel = (dn) => {
    dispatch(updateDeliveryNoteStatus({ id: dn.id, status: 'cancelled' })).then(() => loadData());
  };

  const handleGenerateInvoice = async (dn) => {
    try {
      const result = await deliveryNoteApi.generateInvoice(dn.id);
      if (result.success) {
        apiSuccess(`Invoice ${result.data?.invoiceNumber || ''} generated successfully`);
        navigate('/app/sales/invoices');
      } else {
        apiError(result.message || 'Failed to generate invoice');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to generate invoice';
      apiError(msg);
    }
  };

  const handleSelectSalesOrder = (event, value) => {
    if (!value) {
      setSelectedSO(null);
      setValue('salesOrderId', '');
      setValue('customerId', '');
      setValue('warehouseId', '');
      setValue('details', []);
      return;
    }
    setSelectedSO(value);
    setValue('salesOrderId', value.id);
    setValue('customerId', value.customerId || '');
    setValue('warehouseId', value.warehouseId || '');
    setValue('reference', value.reference || '');

    // Fetch full sales order details to get line items
    dispatch(fetchSalesOrder(value.id)).then((result) => {
      const so = result.payload?.data || result.payload;
      if (so && so.details) {
        const lineItems = so.details.map((d) => ({
          itemId: d.itemId || '',
          salesOrderDetailId: d.id || null,
          description: d.description || '',
          quantity: d.quantity || 0,
          unitPrice: d.unitPrice || 0,
          taxPercentage: d.taxPercentage || 0,
          discountPercentage: d.discountPercentage || 0,
        }));
        setValue('details', lineItems.length > 0 ? lineItems : [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }]);
      }
    });
  };

  const onSubmit = async (data) => {
    if (generateMode) {
      await dispatch(generateDeliveryFromSO({
        salesOrderId: data.salesOrderId,
        warehouseId: data.warehouseId || null,
        deliveryDate: data.deliveryDate,
        reference: data.reference,
        notes: data.notes,
        details: data.details.map((d) => ({
          salesOrderDetailId: d.salesOrderDetailId,
          itemId: d.itemId,
          quantity: parseFloat(d.quantity) || 0,
        })),
      }));
    } else if (editId) {
      await dispatch(updateDeliveryNote({ id: editId, data }));
    } else {
      await dispatch(createDeliveryNote(data));
    }
    setOpenForm(false);
    setEditId(null);
    setGenerateMode(false);
    setSelectedSO(null);
    dispatch(clearSelectedDeliveryNote());
    loadData();
  };

  const handleCloseDialog = () => {
    setOpenForm(false);
    setEditId(null);
    setViewMode(false);
    setGenerateMode(false);
    setSelectedSO(null);
    dispatch(clearSelectedDeliveryNote());
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchDeliveryNotes({ search, status: statusFilter, page: newPage + 1, limit: pagination.limit || 10 }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchDeliveryNotes({ search, status: statusFilter, page: 1, limit: parseInt(e.target.value) }));
  };

  const details = watch('details');

  const calculateLineTotal = (line) => {
    if (!line) return '0.00';
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
        <Typography variant="h4" fontWeight={700}>Delivery Notes</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<GenerateIcon />} onClick={handleGenerateFromSO}>
            Generate from SO
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            New Delivery Note
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search delivery notes..."
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
          <Grid item xs={12} sm={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <IconButton onClick={loadData}>
              <RefreshIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Delivery #</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Warehouse</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No delivery notes found</TableCell>
              </TableRow>
            ) : (
              items.map((dn) => (
                <TableRow key={dn.id} hover>
                  <TableCell>{dn.deliveryNumber}</TableCell>
                  <TableCell>{dn.customerName || '-'}</TableCell>
                  <TableCell>{dn.deliveryDate?.split('T')[0] || '-'}</TableCell>
                  <TableCell>{dn.warehouseName || '-'}</TableCell>
                  <TableCell>{parseFloat(dn.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={(dn.status || 'draft').toUpperCase()}
                      color={statusColors[dn.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleView(dn)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(dn)}
                        disabled={dn.status !== 'draft'}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {dn.status === 'draft' && (
                      <Tooltip title="Mark as Delivered">
                        <IconButton size="small" color="success" onClick={() => handleDeliver(dn)}>
                          <DeliverIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {dn.status !== 'cancelled' && (
                      <Tooltip title="Cancel">
                        <IconButton size="small" color="warning" onClick={() => handleCancel(dn)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {dn.status === 'delivered' && !dn.hasInvoice && (
                      <Tooltip title="Generate Invoice">
                        <IconButton size="small" color="primary" onClick={() => handleGenerateInvoice(dn)}>
                          <InvoiceIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(dn)}
                        disabled={dn.status !== 'draft'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit || 10}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </TableContainer>

      {/* Create/Edit/View/Generate Dialog */}
      <Dialog open={openForm} onClose={handleCloseDialog} fullWidth maxWidth="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {viewMode
              ? 'View Delivery Note'
              : generateMode
              ? 'Generate Delivery from Sales Order'
              : editId
              ? 'Edit Delivery Note'
              : 'New Delivery Note'}
            {selectedDeliveryNote?.deliveryNumber && (
              <Chip label={selectedDeliveryNote.deliveryNumber} sx={{ ml: 2 }} />
            )}
          </DialogTitle>
          <DialogContent dividers>
            {generateMode && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Select a sales order to generate a delivery note. Only approved and partially delivered sales orders are shown.
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Sales Order selection for generate mode */}
              {generateMode && (
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={salesOrdersList}
                    getOptionLabel={(opt) => `${opt.orderNumber || ''} - ${opt.customerName || ''}`}
                    value={selectedSO}
                    onChange={handleSelectSalesOrder}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Sales Order"
                        required
                        error={!!errors.salesOrderId}
                        helperText={errors.salesOrderId?.message}
                        fullWidth
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Non-generate mode: optional sales order link */}
              {!generateMode && (
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="salesOrderId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={salesOrdersList}
                        getOptionLabel={(opt) => `${opt.orderNumber || ''} - ${opt.customerName || ''}`}
                        value={salesOrdersList.find((so) => so.id === field.value) || null}
                        onChange={(e, val) => field.onChange(val?.id || '')}
                        renderInput={(params) => (
                          <TextField {...params} label="Sales Order (Optional)" fullWidth />
                        )}
                        disabled={viewMode}
                      />
                    )}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={generateMode ? 6 : 4}>
                <Controller
                  name="customerId"
                  control={control}
                  rules={{ required: !generateMode ? 'Customer is required' : false }}
                  render={({ field }) => (
                    <Autocomplete
                      options={customersList}
                      getOptionLabel={(opt) => `${opt.code || ''} - ${opt.name || opt.customerName || ''}`}
                      value={customersList.find((c) => c.id === field.value) || null}
                      onChange={(e, val) => field.onChange(val?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          error={!!errors.customerId}
                          helperText={errors.customerId?.message}
                          fullWidth
                        />
                      )}
                      disabled={viewMode || generateMode}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Delivery Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register('deliveryDate', { required: 'Delivery date is required' })}
                  error={!!errors.deliveryDate}
                  helperText={errors.deliveryDate?.message}
                  disabled={viewMode}
                />
              </Grid>

              <Grid item xs={12} sm={generateMode ? 6 : 4}>
                <Controller
                  name="warehouseId"
                  control={control}
                  rules={{ required: false }}
                  render={({ field }) => (
                    <Autocomplete
                      options={warehouseList}
                      getOptionLabel={(opt) => opt.name || opt.warehouseName || ''}
                      value={warehouseList.find((w) => w.id === field.value) || null}
                      onChange={(e, val) => field.onChange(val?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Warehouse"
                          error={!!errors.warehouseId}
                          helperText={errors.warehouseId?.message}
                          fullWidth
                        />
                      )}
                      disabled={viewMode || generateMode}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Reference"
                  fullWidth
                  {...register('reference')}
                  disabled={viewMode}
                />
              </Grid>

              {/* Line Items */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Line Items
                </Typography>
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
                        {!viewMode && !generateMode && <TableCell width="5%"></TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={viewMode || generateMode ? 7 : 8} align="center">
                            No items added. {generateMode ? 'Select a sales order to load items.' : ''}
                          </TableCell>
                        </TableRow>
                      )}
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
                                  getOptionLabel={(opt) => `${opt.itemCode || opt.code || ''} - ${opt.name || opt.itemName || ''}`}
                                  value={itemsList.find((i) => i.id === f.value) || null}
                                  onChange={(e, val) => {
                                    f.onChange(val?.id || '');
                                    if (val) {
                                      setValue(`details.${index}.unitPrice`, Number(val.sellingPrice) || 0);
                                      setValue(`details.${index}.taxPercentage`, Number(val.taxPercentage) || 0);
                                    }
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      error={!!errors.details?.[index]?.itemId}
                                      helperText={errors.details?.[index]?.itemId?.message}
                                    />
                                  )}
                                  disabled={viewMode || generateMode}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              {...register(`details.${index}.description`)}
                              disabled={viewMode || generateMode}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              {...register(`details.${index}.quantity`, {
                                required: 'Qty is required',
                                valueAsNumber: true,
                              })}
                              disabled={viewMode}
                              inputProps={{ min: 0, step: 0.001 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              {...register(`details.${index}.unitPrice`, {
                                required: true,
                                valueAsNumber: true,
                              })}
                              disabled={viewMode || generateMode}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              {...register(`details.${index}.taxPercentage`, {
                                valueAsNumber: true,
                              })}
                              disabled={viewMode || generateMode}
                              inputProps={{ min: 0, max: 100, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              {...register(`details.${index}.discountPercentage`, {
                                valueAsNumber: true,
                              })}
                              disabled={viewMode || generateMode}
                              inputProps={{ min: 0, max: 100, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {calculateLineTotal(watch(`details.${index}`) || {})}
                            </Typography>
                          </TableCell>
                          {!viewMode && !generateMode && (
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {!viewMode && !generateMode && (
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() =>
                      append({
                        itemId: '',
                        description: '',
                        quantity: 1,
                        unitPrice: 0,
                        taxPercentage: 0,
                        discountPercentage: 0,
                      })
                    }
                  >
                    + Add Line
                  </Button>
                )}
              </Grid>

              {/* Totals */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Stack spacing={0.5} textAlign="right">
                    <Typography variant="body2">
                      Subtotal: <strong>{totals.subtotal}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Discount: <strong>{totals.discountAmount}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Tax: <strong>{totals.taxAmount}</strong>
                    </Typography>
                    <Typography variant="h6">
                      Total: <strong>{totals.total}</strong>
                    </Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  {...register('notes')}
                  disabled={viewMode}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            {!viewMode && (
              <Button type="submit" variant="contained" disabled={createLoading || updateLoading}>
                {createLoading || updateLoading ? 'Saving...' : editId ? 'Update' : generateMode ? 'Generate' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DeliveryNotes;