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
  CheckCircleOutline as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchReturns,
  fetchReturn,
  createReturn,
  updateReturn,
  deleteReturn,
  approveReturn,
  rejectReturn,
  clearSelected,
} from '../store/slices/salesReturnSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';
import SalesReturnApi from '../services/salesReturnApi';
import accountApi from '../services/accountApi';
import salesInvoiceApi from '../services/salesInvoiceApi';

const statusColors = {
  draft: 'default',
  approved: 'success',
  rejected: 'error',
  posted: 'success',
};

const SalesReturns = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, selected, loading, error, count, page, limit, totalPages } = useSelector((s) => s.salesReturns);
  const customersList = useSelector((s) => s.customers?.customers || []);
  const itemsList = useSelector((s) => s.items?.items || []);
  const warehouseList = useSelector((s) => s.warehouses?.warehouses || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [arAccounts, setArAccounts] = useState([]);
  const [revenueAccounts, setRevenueAccounts] = useState([]);
  const [taxAccounts, setTaxAccounts] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      returnDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      salesInvoiceId: null,
      customerAccountId: '',
      revenueAccountId: '',
      taxAccountId: '',
      notes: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchReturns({ search, status: statusFilter, customerId: customerFilter, page, limit }));
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
      dispatch(fetchReturn(id));
    }
  }, [id, openForm, dispatch]);

  // Fetch invoices for the invoice selector
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const result = await salesInvoiceApi.list({ limit: 100 });
        setInvoicesList(result.data || []);
      } catch (e) {
        // Silently fail
      }
    };
    fetchInvoices();
  }, []);

  // Fetch accounts for post dialog
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const [ar, rev, tax] = await Promise.all([
          accountApi.getByType('asset'),
          accountApi.getByType('revenue'),
          accountApi.getByType('liability'),
        ]);
        setArAccounts(ar?.data || ar || []);
        setRevenueAccounts(rev?.data || rev || []);
        setTaxAccounts(tax?.data || tax || []);
      } catch (e) {
        // Silently fail
      }
    };
    fetchAccounts();
  }, []);

  // Populate account fields in post dialog when return data is loaded
  useEffect(() => {
    if (selected && openPostDialog && postTarget) {
      setValue('customerAccountId', selected.customerAccountId || selected.customer?.arAccountId || '');
      setValue('revenueAccountId', selected.revenueAccountId || '');
      setValue('taxAccountId', selected.taxAccountId || '');
    }
  }, [selected, openPostDialog, postTarget, setValue]);

  useEffect(() => {
    if (selected && openForm && editId) {
      reset({
        customerId: selected.customerId || '',
        returnDate: selected.returnDate?.split('T')[0] || '',
        warehouseId: selected.warehouseId || '',
        salesInvoiceId: selected.salesInvoiceId || null,
        customerAccountId: selected.customerAccountId || '',
        revenueAccountId: selected.revenueAccountId || '',
        taxAccountId: selected.taxAccountId || '',
        notes: selected.notes || '',
        details: selected.details?.length ? selected.details.map((d) => ({
          id: d.id,
          itemId: d.itemId || '',
          description: d.description || '',
          quantity: d.quantity || 0,
          unitPrice: d.unitPrice || 0,
          taxPercent: d.taxPercent || 0,
          discountPercent: d.discountPercent || 0,
          costPrice: d.costPrice || 0,
        })) : [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
      });
    }
  }, [selected, openForm, editId, reset]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    dispatch(clearSelected());
    reset({
      customerId: '',
      returnDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      salesInvoiceId: null,
      customerAccountId: '',
      revenueAccountId: '',
      taxAccountId: '',
      notes: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
    });
    setOpenForm(true);
  };

  const handleEdit = (returnItem) => {
    if (returnItem.status !== 'draft') {
      apiError('Only draft returns can be edited');
      return;
    }
    setViewMode(false);
    setEditId(returnItem.id);
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
    // Fetch full return details to get current accounts
    dispatch(fetchReturn(returnItem.id));
    setPostTarget(returnItem);
    setOpenPostDialog(true);
  };

  const handlePostSubmit = async () => {
    if (!postTarget) return;
    const customerAccountId = watch('customerAccountId');
    const revenueAccountId = watch('revenueAccountId');
    const taxAccountId = watch('taxAccountId');
    const payload = { customerAccountId, revenueAccountId, taxAccountId };
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
    try {
      const response = await SalesReturnApi.post(postTarget.id, payload);
      if (response) {
        apiSuccess('Return posted successfully - Journal entry created');
        setOpenPostDialog(false);
        setPostTarget(null);
        loadData();
      }
    } catch (error) {
      apiError(error.response?.data?.message || error.message || 'Failed to post return');
    }
  };

  const handleClosePost = () => {
    setOpenPostDialog(false);
    setPostTarget(null);
  };

  const handleApprove = async (returnItem) => {
    const confirmed = await confirmDialog(
      `Approve Return #${returnItem.returnNumber}? This will change the status to approved. Use Post to create journal entries.`
    );
    if (confirmed) {
      dispatch(approveReturn(returnItem.id)).then((res) => {
        if (res.payload) {
          apiSuccess('Return approved successfully');
          loadData();
        }
      });
    }
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
    const payload = {
      ...data,
      customerId: data.customerId,
      warehouseId: data.warehouseId || null,
      details: data.details.map((d) => ({
        id: d.id || undefined,
        itemId: d.itemId,
        description: d.description || '',
        quantity: parseFloat(d.quantity) || 0,
        unitPrice: parseFloat(d.unitPrice) || 0,
        taxPercent: parseFloat(d.taxPercent) || 0,
        discountPercent: parseFloat(d.discountPercent) || 0,
        lineTotal: (parseFloat(d.quantity) || 0) * (parseFloat(d.unitPrice) || 0),
        costPrice: parseFloat(d.costPrice) || 0,
      })),
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

  const handleItemSelect = (index, item) => {
    if (!item) return;
    setValue(`details.${index}.itemId`, item.id);
    setValue(`details.${index}.description`, item.name || item.itemName || '');
    setValue(`details.${index}.unitPrice`, item.sellingPrice || 0);
    setValue(`details.${index}.costPrice`, item.costPrice || 0);
    setValue(`details.${index}.taxPercent`, item.taxPercent || item.taxPercentage || 0);
    // Auto-populate revenue account from item's income account if not already set
    if (item.incomeAccountId) {
      const currentRev = watch('revenueAccountId');
      if (!currentRev) {
        setValue('revenueAccountId', item.incomeAccountId);
      }
    }
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
                      field.onChange(val ? val.id : '');
                      if (val && val.arAccountId) {
                        setValue('customerAccountId', val.arAccountId);
                      }
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
              <Controller
                name="warehouseId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode}
                    value={warehouseList.find((w) => w.id === field.value) || null}
                    onChange={(_, val) => field.onChange(val ? val.id : '')}
                    options={warehouseList}
                    getOptionLabel={(opt) => opt.name || opt.warehouseName || ''}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Warehouse" />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="salesInvoiceId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode}
                    value={invoicesList.find((inv) => inv.id === field.value) || null}
                    onChange={(_, val) => field.onChange(val ? val.id : null)}
                    options={invoicesList}
                    getOptionLabel={(opt) => `${opt.invoiceNumber || ''} - ${opt.customerName || ''}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Sales Invoice (optional)" />
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

          {/* Accounting Information */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Accounting Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="customerAccountId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode}
                    value={arAccounts.find((a) => a.id === field.value) || null}
                    onChange={(_, val) => field.onChange(val ? val.id : '')}
                    options={arAccounts}
                    getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Customer Account (A/R)" size="small" fullWidth />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="revenueAccountId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode}
                    value={revenueAccounts.find((a) => a.id === field.value) || null}
                    onChange={(_, val) => field.onChange(val ? val.id : '')}
                    options={revenueAccounts}
                    getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Sales Return/Revenue Account" size="small" fullWidth />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="taxAccountId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode}
                    value={taxAccounts.find((a) => a.id === field.value) || null}
                    onChange={(_, val) => field.onChange(val ? val.id : '')}
                    options={taxAccounts}
                    getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Tax Account (VAT Payable)" size="small" fullWidth />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Detail Lines */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Return Lines
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200 }}>Item</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Description</TableCell>
                  <TableCell sx={{ minWidth: 90 }}>Qty</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Unit Price</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Tax %</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Disc %</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Cost Price</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Line Total</TableCell>
                  {!viewMode && <TableCell width={50}></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Autocomplete
                        disabled={viewMode}
                        size="small"
                        value={itemsList.find((it) => it.id === details[index]?.itemId) || null}
                        onChange={(_, val) => handleItemSelect(index, val)}
                        options={itemsList}
                        getOptionLabel={(opt) => `${opt.itemCode || opt.code || ''} - ${opt.name || opt.itemName || ''}`}
                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                        renderInput={(params) => <TextField {...params} placeholder="Select Item" />}
                      />
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
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={viewMode}
                        {...register(`details.${index}.quantity`, { min: 0 })}
                        inputProps={{ step: 'any', min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={viewMode}
                        {...register(`details.${index}.unitPrice`, { min: 0 })}
                        inputProps={{ step: 'any', min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={viewMode}
                        {...register(`details.${index}.taxPercent`, { min: 0, max: 100 })}
                        inputProps={{ step: 'any', min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={viewMode}
                        {...register(`details.${index}.discountPercent`, { min: 0, max: 100 })}
                        inputProps={{ step: 'any', min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={viewMode}
                        {...register(`details.${index}.costPrice`, { min: 0 })}
                        inputProps={{ step: 'any', min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {calculateLineTotal(details[index])}
                      </Typography>
                    </TableCell>
                    {!viewMode && (
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => remove(index)} disabled={fields.length === 1}>
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => append({ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 })}
              sx={{ mt: 1 }}
            >
              Add Line
            </Button>
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
                  <MenuItem value="approved">Approved</MenuItem>
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
                            <Tooltip title="Approve (Status Only - No Accounting)">
                              <IconButton size="small" onClick={() => handleApprove(ret)}>
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" color="error" onClick={() => handleReject(ret)}>
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
                        {ret.status === 'approved' && (
                          <>
                            {!ret.journalEntryId && (
                              <Tooltip title="Post (Create Journal Entry with Account Selection)">
                                <IconButton size="small" color="success" onClick={() => handlePost(ret)}>
                                  <PostIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Reject">
                              <IconButton size="small" color="warning" onClick={() => handleReject(ret)}>
                                <RejectIcon fontSize="small" />
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
        <DialogTitle>Post Return #{postTarget?.returnNumber || ''}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will create a journal entry and update inventory (if configured).
            Please review the accounts below before posting.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="customerAccountId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      value={arAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={arAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Customer Account (A/R)" size="small" fullWidth />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="revenueAccountId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      value={revenueAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={revenueAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Sales Return/Revenue Account" size="small" fullWidth />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="taxAccountId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      value={taxAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={taxAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Tax Account (VAT Payable)" size="small" fullWidth />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePost}>Cancel</Button>
          <Button onClick={handlePostSubmit} variant="contained" color="primary">
            Post Return
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesReturns;