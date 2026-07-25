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
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  CheckCircleOutline as ApproveIcon,
  Cancel as RejectIcon,
  Send as SendIcon,
  SwapHoriz as ConvertIcon,
  PictureAsPdf as PdfIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { alpha } from '@mui/material/styles';
import {
  fetchQuotations,
  fetchQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  approveQuotation,
  rejectQuotation,
  convertQuotationToSalesOrder,
  clearSelectedQuotation,
} from '../store/slices/quotationSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { confirmDialog, apiSuccess } from '../utils/toast';

const statusColors = {
  draft: 'default',
  sent: 'info',
  approved: 'success',
  rejected: 'error',
  converted: 'primary',
};

const Quotations = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { list, total, page, limit, selectedQuotation, loading, submitting } = useSelector((s) => s.quotations);
  const customersList = useSelector((s) => s.customers?.customers || []);
  const itemsList = useSelector((s) => s.items?.items || []);
  const warehouseList = useSelector((s) => s.warehouses?.warehouses || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [quotationToSend, setQuotationToSend] = useState(null);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      quotationDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      warehouseId: '',
      reference: '',
      notes: '',
      termsConditions: '',
      status: 'draft',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchQuotations({ search, status: statusFilter, customerId: customerFilter, page, limit }));
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
      dispatch(fetchQuotation(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selectedQuotation && openForm && editId) {
      reset({
        customerId: selectedQuotation.customerId || '',
        quotationDate: selectedQuotation.quotationDate?.split('T')[0] || '',
        expiryDate: selectedQuotation.expiryDate?.split('T')[0] || '',
        warehouseId: selectedQuotation.warehouseId || '',
        reference: selectedQuotation.reference || '',
        notes: selectedQuotation.notes || '',
        termsConditions: selectedQuotation.termsConditions || '',
        status: selectedQuotation.status || 'draft',
        details: selectedQuotation.details?.length ? selectedQuotation.details.map((d) => ({
          itemId: d.itemId || '',
          description: d.description || '',
          quantity: d.quantity || 0,
          unitPrice: d.unitPrice || 0,
          taxPercentage: d.taxPercentage || 0,
          discountPercentage: d.discountPercentage || 0,
        })) : [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
      });
    }
  }, [selectedQuotation, openForm, editId, reset]);

  const handleAdd = () => {
    setViewMode(false);
    setEditId(null);
    dispatch(clearSelectedQuotation());
    reset({
      customerId: '',
      quotationDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      warehouseId: '',
      reference: '',
      notes: '',
      termsConditions: '',
      status: 'draft',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0 }],
    });
    setOpenForm(true);
  };

  const handleEdit = (quotation) => {
    setViewMode(false);
    setEditId(quotation.id);
    dispatch(fetchQuotation(quotation.id));
    setOpenForm(true);
  };

  const handleView = (quotation) => {
    setViewMode(true);
    setEditId(quotation.id);
    dispatch(fetchQuotation(quotation.id));
    setOpenForm(true);
  };

  const handleDelete = async (quotation) => {
    const confirmed = await confirmDialog('Are you sure you want to delete this quotation?');
    if (confirmed) {
      dispatch(deleteQuotation(quotation.id)).then(() => loadData());
    }
  };

  const handleApprove = (quotation) => {
    dispatch(approveQuotation(quotation.id)).then(() => loadData());
  };

  const handleReject = (quotation) => {
    dispatch(rejectQuotation(quotation.id)).then(() => loadData());
  };

  const handleSend = (quotation) => {
    setQuotationToSend(quotation);
    setSendDialogOpen(true);
  };

  const buildQuotationText = (q) => {
    const items = q.details?.map(d =>
      `  ${d.quantity} x ${d.item?.itemCode || d.itemId} - ${d.description} @ ${d.unitPrice}`
    ).join('\n') || '';
    return `QUOTATION ${q.quotationNumber}
Customer: ${q.customer?.name || q.customerId}
Date: ${q.quotationDate?.split('T')[0] || ''}
Expiry: ${q.expiryDate?.split('T')[0] || ''}
${items}
Subtotal: ${q.subtotal}
Tax: ${q.taxAmount}
Total: ${q.totalAmount}`;
  };

  const handleSendEmail = (q) => {
    const subject = encodeURIComponent(`Quotation ${q.quotationNumber}`);
    const body = encodeURIComponent(buildQuotationText(q));
    const email = q.customer?.email || '';
    if (email) {
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }
    dispatch(updateQuotationStatus({ id: q.id, status: 'sent' })).then(() => loadData());
    setSendDialogOpen(false);
  };

  const handleSendWhatsApp = (q) => {
    const text = encodeURIComponent(buildQuotationText(q));
    const phone = q.customer?.mobile || q.customer?.phone || '';
    const number = phone.replace(/[^0-9]/g, '');
    if (number) {
      window.open(`https://wa.me/${number}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
    dispatch(updateQuotationStatus({ id: q.id, status: 'sent' })).then(() => loadData());
    setSendDialogOpen(false);
  };

  const handleMarkAsSent = (q) => {
    dispatch(updateQuotationStatus({ id: q.id, status: 'sent' })).then(() => loadData());
    setSendDialogOpen(false);
  };

  const handleConvertToSO = async (quotation) => {
    const confirmed = await confirmDialog('Convert this quotation to a Sales Order?');
    if (confirmed) {
      dispatch(convertQuotationToSalesOrder(quotation.id)).then(() => loadData());
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await dispatch(updateQuotation({ id: editId, data })).unwrap();
      } else {
        await dispatch(createQuotation(data)).unwrap();
      }
      setOpenForm(false);
      setEditId(null);
      dispatch(clearSelectedQuotation());
      loadData();
    } catch (err) {
      const msg = err?.message || err || 'Failed to save quotation';
      alert(msg);
    }
  };

  const handleClose = () => {
    setOpenForm(false);
    setEditId(null);
    setViewMode(false);
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchQuotations({ search, status: statusFilter, customerId: customerFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchQuotations({ search, status: statusFilter, customerId: customerFilter, page: 1, limit: parseInt(e.target.value) }));
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
        <Typography variant="h4" fontWeight={700}>Quotations</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          New Quotation
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search quotations..."
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
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="converted">Converted</MenuItem>
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
              <TableCell><strong>Quotation #</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Expiry</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow>
            ) : list.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No quotations found</TableCell></TableRow>
            ) : list.map((q) => (
              <TableRow key={q.id} hover>
                <TableCell>{q.quotationNumber}</TableCell>
                <TableCell>{q.customer?.name}</TableCell>
                <TableCell>{q.quotationDate?.split('T')[0]}</TableCell>
                <TableCell>{q.expiryDate?.split('T')[0]}</TableCell>
                <TableCell>{parseFloat(q.totalAmount).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip label={q.status?.toUpperCase()} color={statusColors[q.status] || 'default'} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="View"><IconButton size="small" onClick={() => handleView(q)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(q)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  {q.status === 'draft' && (
                    <Tooltip title="Send to Customer"><IconButton size="small" color="info" onClick={() => handleSend(q)}><SendIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {q.status === 'sent' && (
                    <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(q)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {q.status === 'sent' && (
                    <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleReject(q)}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {q.status === 'approved' && (
                    <Tooltip title="Convert to Sales Order"><IconButton size="small" color="primary" onClick={() => handleConvertToSO(q)}><ConvertIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(q)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
      <Dialog open={openForm} onClose={handleClose} fullWidth maxWidth="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {viewMode ? 'View Quotation' : editId ? 'Edit Quotation' : 'New Quotation'}
            {selectedQuotation?.quotationNumber && (
              <Chip label={selectedQuotation.quotationNumber} sx={{ ml: 2 }} />
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
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
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
                <TextField label="Quotation Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('quotationDate', { required: true })} disabled={viewMode} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Expiry Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('expiryDate', { required: true })} disabled={viewMode} />
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
              <Grid item xs={12}>
                <TextField label="Terms & Conditions" fullWidth multiline rows={2} {...register('termsConditions')} disabled={viewMode} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            {!viewMode && (
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Send to Customer Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Quotation {quotationToSend?.quotationNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customer: <strong>{quotationToSend?.customer?.name}</strong>
            {quotationToSend?.customer?.email && <> &lt;{quotationToSend.customer.email}&gt;</>}
            {quotationToSend?.customer?.mobile && <> &mdash; {quotationToSend.customer.mobile}</>}
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<EmailIcon />}
              onClick={() => handleSendEmail(quotationToSend)}
              fullWidth
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              Send via Email
              {quotationToSend?.customer?.email && (
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  ({quotationToSend.customer.email})
                </Typography>
              )}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<SendIcon />}
              color="success"
              onClick={() => handleSendWhatsApp(quotationToSend)}
              fullWidth
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              Send via WhatsApp
              {(quotationToSend?.customer?.mobile || quotationToSend?.customer?.phone) && (
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  ({quotationToSend.customer.mobile || quotationToSend.customer.phone})
                </Typography>
              )}
            </Button>
            <Divider />
            <Button
              variant="text"
              size="small"
              onClick={() => handleMarkAsSent(quotationToSend)}
              fullWidth
            >
              Just mark as Sent (no email/WhatsApp)
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Quotations;