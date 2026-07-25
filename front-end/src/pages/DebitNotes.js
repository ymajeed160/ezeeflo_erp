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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as ApproveIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchDebitNotes,
  fetchDebitNoteById,
  createDebitNote,
  updateDebitNote,
  deleteDebitNote,
  approveDebitNote,
  clearCurrent,
} from '../store/slices/debitNoteSlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { fetchPurchaseReturns } from '../store/slices/purchaseReturnSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';

const statusColors = {
  Draft: 'default',
  Approved: 'success',
};

const DebitNotes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, currentItem, loading, error, total, page, limit, currentLoading, submitting } = useSelector((s) => s.debitNotes);
  const suppliersList = useSelector((s) => s.suppliers?.suppliers || []);
  const purchaseReturnsList = useSelector((s) => s.purchaseReturns?.items || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [generateFromReturn, setGenerateFromReturn] = useState(false);
  const [filteredPurchaseReturns, setFilteredPurchaseReturns] = useState([]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      supplierId: '',
      purchaseReturnId: null,
      debitDate: new Date().toISOString().split('T')[0],
      amount: 0,
      reason: '',
      notes: '',
    },
  });

  const selectedSupplierId = watch('supplierId');
  const selectedPurchaseReturnId = watch('purchaseReturnId');

  const loadData = useCallback(() => {
    dispatch(fetchDebitNotes({ search, status: statusFilter, supplierId: supplierFilter, page, limit }));
  }, [dispatch, search, statusFilter, supplierFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchSuppliers({ limit: 999 }));
    dispatch(fetchPurchaseReturns({ limit: 999 }));
  }, [loadData, dispatch]);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchDebitNoteById(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (currentItem && openForm && editId) {
      reset({
        supplierId: currentItem.supplierId || '',
        purchaseReturnId: currentItem.purchaseReturnId || null,
        debitDate: currentItem.debitDate?.split('T')[0] || '',
        amount: currentItem.amount || 0,
        reason: currentItem.reason || '',
        notes: currentItem.notes || '',
      });
    }
  }, [currentItem, openForm, editId, reset]);

  // When generate from return mode, auto-populate
  useEffect(() => {
    if (generateFromReturn && selectedPurchaseReturnId && purchaseReturnsList?.length) {
      const pr = purchaseReturnsList.find((r) => String(r.id) === String(selectedPurchaseReturnId));
      if (pr) {
        setValue('supplierId', String(pr.supplierId || ''));
        setValue('amount', pr.totalAmount || 0);
      }
    }
  }, [selectedPurchaseReturnId, generateFromReturn, purchaseReturnsList, setValue]);

  // Filter purchase returns by supplier when in generate mode
  useEffect(() => {
    if (generateFromReturn && selectedSupplierId && purchaseReturnsList?.length) {
      const filtered = purchaseReturnsList.filter(
        (pr) => String(pr.supplierId) === String(selectedSupplierId) && pr.status === 'Approved'
      );
      setFilteredPurchaseReturns(filtered);
    } else {
      setFilteredPurchaseReturns([]);
    }
  }, [generateFromReturn, selectedSupplierId, purchaseReturnsList]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    dispatch(clearCurrent());
    setGenerateFromReturn(false);
    reset({
      supplierId: '',
      purchaseReturnId: null,
      debitDate: new Date().toISOString().split('T')[0],
      amount: 0,
      reason: '',
      notes: '',
    });
    setOpenForm(true);
  };

  const handleEdit = (dn) => {
    if (dn.status === 'Approved') {
      apiError('Approved debit notes cannot be edited');
      return;
    }
    setViewMode(false);
    setEditId(dn.id);
    setGenerateFromReturn(!!dn.purchaseReturnId);
    dispatch(fetchDebitNoteById(dn.id));
    setOpenForm(true);
  };

  const handleView = (dn) => {
    setViewMode(true);
    setEditId(dn.id);
    dispatch(fetchDebitNoteById(dn.id));
    setOpenForm(true);
  };

  const handleDelete = async (dn) => {
    if (dn.status === 'Approved') {
      apiError('Approved debit notes cannot be deleted');
      return;
    }
    const confirmed = await confirmDialog('Are you sure you want to delete this debit note?');
    if (confirmed) {
      dispatch(deleteDebitNote(dn.id)).then(() => loadData());
    }
  };

  const handleApprove = async (dn) => {
    const confirmed = await confirmDialog(
      `Approve Debit Note #${dn.debitNoteNumber}? This will create a journal entry (AP DR, Inventory/Expense CR).`
    );
    if (confirmed) {
      dispatch(approveDebitNote(dn.id)).then((res) => {
        if (res.payload) loadData();
      });
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      supplierId: parseInt(data.supplierId),
      purchaseReturnId: data.purchaseReturnId ? parseInt(data.purchaseReturnId) : null,
      debitDate: data.debitDate,
      amount: parseFloat(data.amount),
      reason: data.reason,
      notes: data.notes,
    };

    if (editId) {
      await dispatch(updateDebitNote({ id: editId, data: payload }));
    } else {
      await dispatch(createDebitNote(payload));
    }
    setOpenForm(false);
    setEditId(null);
    setGenerateFromReturn(false);
    dispatch(clearCurrent());
    loadData();
  };

  const handleClose = () => {
    setOpenForm(false);
    setEditId(null);
    setViewMode(false);
    setGenerateFromReturn(false);
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchDebitNotes({ search, status: statusFilter, supplierId: supplierFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchDebitNotes({ search, status: statusFilter, supplierId: supplierFilter, page: 1, limit: parseInt(e.target.value) }));
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Debit Notes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Debit Note
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search debit notes..."
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
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                size="small"
                options={suppliersList || []}
                getOptionLabel={(o) => o.supplierName || o.supplier_name || ''}
                value={suppliersList?.find((c) => String(c.id) === supplierFilter) || null}
                onChange={(e, v) => setSupplierFilter(v ? String(v.id) : '')}
                renderInput={(params) => <TextField {...params} label="Supplier" />}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="outlined" onClick={loadData} startIcon={<RefreshIcon />} fullWidth>
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
              <TableCell>Debit Note #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No debit notes found
                </TableCell>
              </TableRow>
            ) : (
              items?.map((dn) => (
                <TableRow key={dn.id} hover>
                  <TableCell>{dn.debitNoteNumber}</TableCell>
                  <TableCell>{dn.debitDate?.split('T')[0]}</TableCell>
                  <TableCell>{dn.supplier?.supplierName || dn.supplier?.supplier_name || '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(dn.amount)}</TableCell>
                  <TableCell>{dn.reason || '-'}</TableCell>
                  <TableCell>
                    <Chip label={dn.status} color={statusColors[dn.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleView(dn)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {dn.status === 'Draft' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(dn)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(dn)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => handleApprove(dn)}>
                              <ApproveIcon fontSize="small" />
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
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {viewMode ? 'View Debit Note' : editId ? 'Edit Debit Note' : 'New Debit Note'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              {/* Generate from Purchase Return toggle */}
              {!editId && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={generateFromReturn}
                        onChange={(e) => setGenerateFromReturn(e.target.checked)}
                        disabled={viewMode}
                      />
                    }
                    label="Generate from Purchase Return"
                  />
                </Grid>
              )}

              {/* Supplier */}
              <Grid item xs={12} sm={generateFromReturn ? 6 : 12}>
                <Controller
                  name="supplierId"
                  control={control}
                  rules={{ required: 'Supplier is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      disabled={viewMode || (generateFromReturn && selectedPurchaseReturnId)}
                      size="small"
                      options={suppliersList || []}
                      getOptionLabel={(o) => o.supplierName || o.supplier_name || ''}
                      value={suppliersList?.find((c) => String(c.id) === String(field.value)) || null}
                      onChange={(e, v) => field.onChange(v ? String(v.id) : '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Supplier"
                          error={!!errors.supplierId}
                          helperText={errors.supplierId?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Purchase Return (only in generate mode) */}
              {generateFromReturn && (
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="purchaseReturnId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        disabled={viewMode}
                        size="small"
                        options={filteredPurchaseReturns}
                        getOptionLabel={(o) => `${o.returnNumber || ''} (${formatCurrency(o.totalAmount || 0)})`}
                        value={filteredPurchaseReturns.find((r) => String(r.id) === String(field.value)) || null}
                        onChange={(e, v) => field.onChange(v ? String(v.id) : '')}
                        renderInput={(params) => (
                          <TextField {...params} label="Purchase Return" />
                        )}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Debit Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Debit Date"
                  type="date"
                  disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                  {...register('debitDate', { required: 'Date is required' })}
                  error={!!errors.debitDate}
                  helperText={errors.debitDate?.message}
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount"
                  type="number"
                  disabled={viewMode || generateFromReturn}
                  inputProps={{ step: 0.01, min: 0 }}
                  {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be > 0' } })}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              </Grid>

              {/* Reason */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reason"
                  disabled={viewMode}
                  {...register('reason', { required: 'Reason is required' })}
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes"
                  multiline
                  rows={3}
                  disabled={viewMode}
                  {...register('notes')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            {!viewMode && (
              <Button type="submit" variant="contained" disabled={submitting}>
                {editId ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DebitNotes;