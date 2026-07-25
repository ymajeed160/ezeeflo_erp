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
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchCreditNotes,
  fetchCreditNote,
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
  postCreditNote,
  cancelCreditNote,
  clearSelected,
} from '../store/slices/creditNoteSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchReturns } from '../store/slices/salesReturnSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';

const statusColors = {
  draft: 'default',
  posted: 'success',
  cancelled: 'error',
};

const CreditNotes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, selected, loading, error, count, page, limit, totalPages } = useSelector((s) => s.creditNotes);
  const customersList = useSelector((s) => s.customers?.customers || []);
  const itemsList = useSelector((s) => s.items?.items || []);
  const warehouseList = useSelector((s) => s.warehouses?.warehouses || []);
  const returnsList = useSelector((s) => s.salesReturns?.items || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      creditDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      returnId: null,
      notes: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchCreditNotes({ search, status: statusFilter, customerId: customerFilter, page, limit }));
  }, [dispatch, search, statusFilter, customerFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomers({ limit: 999 }));
    dispatch(fetchItems({ limit: 999 }));
    dispatch(fetchWarehouses({ limit: 999 }));
    dispatch(fetchReturns({ limit: 999 }));
  }, [loadData, dispatch]);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchCreditNote(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selected && openForm && editId) {
      reset({
        customerId: selected.customerId || '',
        creditDate: selected.creditDate?.split('T')[0] || '',
        warehouseId: selected.warehouseId || '',
        returnId: selected.returnId || null,
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
      creditDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      returnId: null,
      notes: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
    });
    setOpenForm(true);
  };

  const handleEdit = (cn) => {
    if (cn.status !== 'draft') {
      apiError('Only draft credit notes can be edited');
      return;
    }
    setViewMode(false);
    setEditId(cn.id);
    dispatch(fetchCreditNote(cn.id));
    setOpenForm(true);
  };

  const handleView = (cn) => {
    setViewMode(true);
    setEditId(cn.id);
    dispatch(fetchCreditNote(cn.id));
    setOpenForm(true);
  };

  const handleDelete = async (cn) => {
    if (cn.status !== 'draft') {
      apiError('Only draft credit notes can be deleted');
      return;
    }
    const confirmed = await confirmDialog('Are you sure you want to delete this credit note?');
    if (confirmed) {
      dispatch(deleteCreditNote(cn.id)).then(() => loadData());
    }
  };

  const handlePost = async (cn) => {
    const confirmed = await confirmDialog(
      `Post Credit Note #${cn.creditNumber}? This will create a journal entry and update inventory.`
    );
    if (confirmed) {
      dispatch(postCreditNote(cn.id)).then((res) => {
        if (res.payload) loadData();
      });
    }
  };

  const handleCancel = async (cn) => {
    const confirmed = await confirmDialog(
      `Cancel Credit Note #${cn.creditNumber}? This will mark the credit note as cancelled.`
    );
    if (confirmed) {
      dispatch(cancelCreditNote(cn.id)).then((res) => {
        if (res.payload) loadData();
      });
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      customerId: parseInt(data.customerId),
      warehouseId: parseInt(data.warehouseId) || null,
      returnId: data.returnId ? parseInt(data.returnId) : null,
      details: data.details.map((d) => ({
        id: d.id || undefined,
        itemId: parseInt(d.itemId) || null,
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
      await dispatch(updateCreditNote({ id: editId, data: payload }));
    } else {
      await dispatch(createCreditNote(payload));
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
    dispatch(fetchCreditNotes({ search, status: statusFilter, customerId: customerFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchCreditNotes({ search, status: statusFilter, customerId: customerFilter, page: 1, limit: parseInt(e.target.value) }));
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
  };

  const renderFormDialog = () => (
    <Dialog open={openForm} onClose={handleClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {viewMode ? 'View Credit Note' : editId ? 'Edit Credit Note' : 'New Credit Note'}
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
                    onChange={(_, val) => field.onChange(val ? val.id : '')}
                    options={customersList}
                    getOptionLabel={(opt) => `${opt.customerCode} - ${opt.customerName}`}
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
                label="Credit Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled={viewMode}
                {...register('creditDate', { required: 'Credit date is required' })}
                error={!!errors.creditDate}
                helperText={errors.creditDate?.message}
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

            {/* Return Reference */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="returnId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    disabled={viewMode}
                    value={returnsList.find((r) => r.id === field.value) || null}
                    onChange={(_, val) => field.onChange(val ? val.id : null)}
                    options={returnsList}
                    getOptionLabel={(opt) => `${opt.returnNumber} - ${opt.customer?.customerCode || ''}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField {...params} label="Sales Return (Optional)" />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12} sm={8}>
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

          {/* Detail Lines */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Credit Note Lines
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
          <Grid container spacing={1} sx={{ mt: 2 }} justifyContent="flex-end">
            <Grid item xs={12} sm={3}>
              <Typography variant="body2">Subtotal: <strong>{calculateTotals().subtotal}</strong></Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2">Discount: <strong>{calculateTotals().discountAmount}</strong></Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2">Tax: <strong>{calculateTotals().taxAmount}</strong></Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h6" color="primary">
                Grand Total: {calculateTotals().total}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {!viewMode && (
            <Button type="submit" variant="contained" disabled={loading}>
              {editId ? 'Update' : 'Save'} Credit Note
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
        <Typography variant="h4">Credit Notes</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            New Credit Note
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
                placeholder="Search credit notes..."
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
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                size="small"
                value={customersList.find((c) => c.id === customerFilter) || null}
                onChange={(_, val) => setCustomerFilter(val ? val.id : '')}
                options={customersList}
                getOptionLabel={(opt) => `${opt.code || ''} - ${opt.name || ''}`}
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
                <TableCell>Credit #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Return Ref</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">Grand Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No credit notes found</TableCell>
                </TableRow>
              ) : (
                items.map((cn) => (
                  <TableRow key={cn.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{cn.creditNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{cn.customer ? `${cn.customer.code || ''} - ${cn.customer.name || ''}` : '-'}</Typography>
                    </TableCell>
                    <TableCell>{cn.creditDate}</TableCell>
                    <TableCell>{cn.return ? cn.return.returnNumber : '-'}</TableCell>
                    <TableCell>{cn.warehouse ? (cn.warehouse.name || cn.warehouse.warehouseName || '-') : '-'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{parseFloat(cn.grandTotal || 0).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={cn.status?.replace('_', ' ').toUpperCase()} color={statusColors[cn.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(cn)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {cn.status === 'draft' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(cn)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Post (Journal Entry + Inventory)">
                              <IconButton size="small" color="success" onClick={() => handlePost(cn)}>
                                <PostIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" color="warning" onClick={() => handleCancel(cn)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(cn)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {cn.status === 'posted' && (
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="warning" onClick={() => handleCancel(cn)}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
    </Box>
  );
};

export default CreditNotes;