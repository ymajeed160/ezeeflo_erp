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
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
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
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  FileDownload as ExportIcon,
  CheckCircleOutline as PostIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  postInvoice,
  cancelInvoice,
  generateFromSalesOrder,
  generateFromDeliveryNote,
  clearSelected,
  setFilters,
} from '../store/slices/salesInvoiceSlice';
import { fetchCustomers } from '../store/slices/customerSlice';
import { fetchItems } from '../store/slices/itemSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { confirmDialog, apiSuccess, apiError } from '../utils/toast';
import accountApi from '../services/accountApi';
import itemApi from '../services/itemApi';
import SalesInvoiceApi from '../services/salesInvoiceApi';
import { generateSalesInvoicePdf } from '../utils/pdfInvoice';
import PdfViewer from '../components/PdfViewer';
import {
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

const statusColors = {
  draft: 'default',
  posted: 'success',
  partially_paid: 'info',
  paid: 'primary',
  overdue: 'warning',
  cancelled: 'error',
};

const SalesInvoices = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items, selected, loading, error, count, page, limit, totalPages } = useSelector((s) => s.salesInvoices);
  const customersList = useSelector((s) => s.customers?.customers || []);
  const itemsList = useSelector((s) => s.items?.items || []);
  const warehouseList = useSelector((s) => s.warehouses?.warehouses || []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [generateFromSO, setGenerateFromSO] = useState(false);
  const [generateFromDN, setGenerateFromDN] = useState(false);
  const [arAccounts, setArAccounts] = useState([]);
  const [revenueAccounts, setRevenueAccounts] = useState([]);
  const [taxAccounts, setTaxAccounts] = useState([]);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
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

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      warehouseId: '',
      salesOrderId: null,
      deliveryNoteId: null,
      notes: '',
      termsConditions: '',
      isInventoryImpact: false,
      customerAccountId: '',
      revenueAccountId: '',
      taxAccountId: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  const loadData = useCallback(() => {
    dispatch(fetchInvoices({ search, status: statusFilter, customerId: customerFilter, page, limit }));
  }, [dispatch, search, statusFilter, customerFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomers({ limit: 999 }));
    dispatch(fetchItems({ limit: 999 }));
    dispatch(fetchWarehouses({ limit: 999 }));
  }, [loadData, dispatch]);

  // Fetch accounts for Accounting Information section
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const [arRes, revRes, taxRes] = await Promise.all([
          accountApi.getByType('asset'),
          accountApi.getByType('revenue'),
          accountApi.getByType('liability'),
        ]);
        // API returns { success: true, data: [...] }
        setArAccounts(arRes.data || []);
        setRevenueAccounts(revRes.data || []);
        // Filter liability accounts to ones likely for VAT/Tax
        const allLiabilities = taxRes.data || [];
        setTaxAccounts(allLiabilities);
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
    };
    loadAccounts();
  }, []);

  // Populate account fields in post dialog when invoice data is loaded
  useEffect(() => {
    if (selected && openPostDialog && postTarget) {
      setValue('customerAccountId', selected.customerAccountId || '');
      setValue('revenueAccountId', selected.revenueAccountId || '');
      setValue('taxAccountId', selected.taxAccountId || '');
    }
  }, [selected, openPostDialog, postTarget, setValue]);

  useEffect(() => {
    if (id && (id === 'new' || id === ':id')) return;
    if (id && openForm) {
      dispatch(fetchInvoice(id));
    }
  }, [id, openForm, dispatch]);

  useEffect(() => {
    if (selected && openForm && editId) {
      reset({
        customerId: selected.customerId || '',
        invoiceDate: selected.invoiceDate?.split('T')[0] || '',
        dueDate: selected.dueDate?.split('T')[0] || '',
        warehouseId: selected.warehouseId || '',
        salesOrderId: selected.salesOrderId || null,
        deliveryNoteId: selected.deliveryNoteId || null,
        notes: selected.notes || '',
        termsConditions: selected.termsConditions || '',
        isInventoryImpact: selected.isInventoryImpact || false,
        customerAccountId: selected.customerAccountId || '',
        revenueAccountId: selected.revenueAccountId || '',
        taxAccountId: selected.taxAccountId || '',
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
    setGenerateFromSO(false);
    setGenerateFromDN(false);
    dispatch(clearSelected());
    reset({
      customerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      warehouseId: '',
      salesOrderId: null,
      deliveryNoteId: null,
      notes: '',
      termsConditions: '',
      isInventoryImpact: false,
      customerAccountId: '',
      revenueAccountId: '',
      taxAccountId: '',
      details: [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
    });
    setOpenForm(true);
  };

  const handleEdit = (invoice) => {
    if (invoice.status !== 'draft') {
      apiError('Only draft invoices can be edited');
      return;
    }
    setViewMode(false);
    setEditId(invoice.id);
    dispatch(fetchInvoice(invoice.id));
    setOpenForm(true);
  };

  const handleView = (invoice) => {
    setViewMode(true);
    setEditId(invoice.id);
    dispatch(fetchInvoice(invoice.id));
    setOpenForm(true);
  };

  const handleDelete = async (invoice) => {
    if (invoice.status !== 'draft') {
      apiError('Only draft invoices can be deleted');
      return;
    }
    const confirmed = await confirmDialog('Are you sure you want to delete this invoice?');
    if (confirmed) {
      dispatch(deleteInvoice(invoice.id)).then(() => loadData());
    }
  };

  const handlePost = async (invoice) => {
    // Fetch full invoice details to get current accounts
    dispatch(fetchInvoice(invoice.id));
    setPostTarget(invoice);
    setOpenPostDialog(true);
  };

  const handlePostSubmit = async () => {
    if (!postTarget) return;
    const customerAccountId = watch('customerAccountId');
    const revenueAccountId = watch('revenueAccountId');
    const taxAccountId = watch('taxAccountId');
    const payload = { customerAccountId, revenueAccountId, taxAccountId };
    // Only include non-empty values
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
    try {
      const response = await SalesInvoiceApi.post(postTarget.id, payload);
      if (response) {
        apiSuccess('Invoice posted successfully - Journal entry created');
        setOpenPostDialog(false);
        setPostTarget(null);
        loadData();
      }
    } catch (error) {
      apiError(error.response?.data?.message || error.message || 'Failed to post invoice');
    }
  };

  const handleClosePost = () => {
    setOpenPostDialog(false);
    setPostTarget(null);
  };

  const handleViewPdf = async (invoice) => {
    try {
      const response = await SalesInvoiceApi.getById(invoice.id);
      const invoiceDetail = response.data || response;
      const companyInfo = {
        name: activeCompany?.name || 'EzeeFlo ERP',
        address: activeCompany?.address || '',
        phone: activeCompany?.phone || '',
        email: activeCompany?.email || '',
        logo: activeCompany?.logo || null,
        currencyCode: activeCompany?.currencyCode || 'AED',
        trnTin: activeCompany?.trnTin || '',
      };
      const { blobUrl, pdfBlob, filename } = await generateSalesInvoicePdf(invoiceDetail, companyInfo);
      setPdfBlobUrl(blobUrl); setPdfFilename(filename); setPdfInvoiceId(invoice.id);
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
    setPdfInvoiceId(null);
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
    if (!pdfBlobUrl || !pdfInvoiceId) {
      apiError('PDF not ready. Please generate the invoice PDF first.');
      return;
    }
    setSendingEmail(true);
    try {
      const pdfBase64 = await blobUrlToBase64(pdfBlobUrl);
      const response = await SalesInvoiceApi.sendEmail(pdfInvoiceId, {
        to: emailTo,
        subject: emailSubject || undefined,
        body: emailBody || undefined,
        pdfBase64,
      });
      if (response.success) {
        apiSuccess(response.message || 'Invoice sent successfully');
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

  const handleCancel = async (invoice) => {
    const confirmed = await confirmDialog(
      `Cancel Invoice #${invoice.invoiceNumber}? This will reverse inventory impact.`
    );
    if (confirmed) {
      dispatch(cancelInvoice(invoice.id)).then((res) => {
        if (res.payload) loadData();
      });
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      customerId: data.customerId,
      warehouseId: data.warehouseId || null,
      customerAccountId: data.customerAccountId || null,
      revenueAccountId: data.revenueAccountId || null,
      taxAccountId: data.taxAccountId || null,
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
      await dispatch(updateInvoice({ id: editId, data: payload }));
    } else {
      await dispatch(createInvoice(payload));
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
    setGenerateFromSO(false);
    setGenerateFromDN(false);
  };

  const handlePageChange = (e, newPage) => {
    dispatch(fetchInvoices({ search, status: statusFilter, customerId: customerFilter, page: newPage + 1, limit }));
  };

  const handleRowsPerPageChange = (e) => {
    dispatch(fetchInvoices({ search, status: statusFilter, customerId: customerFilter, page: 1, limit: parseInt(e.target.value) }));
  };

  const details = watch('details');
  const isInventoryImpact = watch('isInventoryImpact');

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

  const handleItemSelect = async (index, item) => {
    if (!item) return;
    setValue(`details.${index}.itemId`, item.id);
    setValue(`details.${index}.description`, item.itemName || item.name || '');
    setValue(`details.${index}.unitPrice`, item.sellingPrice || 0);
    setValue(`details.${index}.costPrice`, item.costPrice || 0);
    setValue(`details.${index}.taxPercent`, item.taxPercent || item.taxPercentage || 0);

    // Auto-populate revenue account from item's income account
    const incomeAccountId = item.incomeAccountId;
    if (incomeAccountId) {
      setValue('revenueAccountId', incomeAccountId);
    } else {
      // Try fetching full item details if incomeAccountId not in list
      try {
        const res = await itemApi.getById(item.id);
        const fullItem = res.data || res;
        if (fullItem.incomeAccountId) {
          setValue('revenueAccountId', fullItem.incomeAccountId);
        }
      } catch (e) {
        // ignore - revenue account field stays empty
      }
    }
  };

  // Auto-populate tax account when any invoice line has tax > 0
  const hasTax = (details || []).some((line) => parseFloat(line?.taxPercent || 0) > 0);
  useEffect(() => {
    if (hasTax && taxAccounts.length > 0) {
      const currentTaxId = watch('taxAccountId');
      if (!currentTaxId) {
        // Pick first tax/liability account as default
        setValue('taxAccountId', taxAccounts[0].id);
      }
    }
  }, [hasTax, taxAccounts, watch, setValue]);

  const renderFormDialog = () => (
    <Dialog open={openForm} onClose={handleClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {viewMode ? 'View Sales Invoice' : editId ? 'Edit Sales Invoice' : 'New Sales Invoice'}
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
                      // Auto-populate customer account from Customer's AR account
                      if (val && val.arAccountId) {
                        setValue('customerAccountId', val.arAccountId);
                      } else if (!val) {
                        setValue('customerAccountId', '');
                      }
                    }}
                    options={customersList}
                    getOptionLabel={(opt) => `${opt.code || ''} - ${opt.name || opt.customerName || ''}`}
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
                label="Invoice Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled={viewMode}
                {...register('invoiceDate', { required: 'Invoice date is required' })}
                error={!!errors.invoiceDate}
                helperText={errors.invoiceDate?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled={viewMode}
                {...register('dueDate', { required: 'Due date is required' })}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
              />
            </Grid>

            {/* Header Row 2 */}
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
                      <TextField {...params} label="Warehouse (for inventory)" />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!isInventoryImpact}
                    onChange={(e) => setValue('isInventoryImpact', e.target.checked)}
                    disabled={viewMode}
                  />
                }
                label="Inventory Impact (reduce stock on posting)"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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

          {/* Accounting Information Section */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />
            Accounting Information
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
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
                        <TextField {...params} label="Customer Account (A/R)" size="small" placeholder="Select Accounts Receivable account" />
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
                        <TextField {...params} label="Sales Revenue Account" size="small" placeholder="Select Revenue account" />
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
                        <TextField {...params} label="Tax Account (VAT Payable)" size="small" placeholder="Select Tax/VAT account" />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Detail Lines */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Invoice Lines
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
                        getOptionLabel={(opt) => `${opt.itemCode} - ${opt.name || opt.itemName || ''}`}
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
              {editId ? 'Update' : 'Save'} Invoice
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
        <Typography variant="h4">Sales Invoices</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            New Invoice
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
                placeholder="Search invoices..."
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
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
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
                getOptionLabel={(opt) => `${opt.code || opt.customerCode || ''} - ${opt.name || opt.customerName || ''}`}
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
                <TableCell sx={{ minWidth: 140 }}>Invoice #</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Customer</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Date</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Due Date</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Warehouse</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>Grand Total</TableCell>
                <TableCell sx={{ minWidth: 90 }}>Status</TableCell>
                <TableCell sx={{ minWidth: 70 }}>Inventory</TableCell>
                <TableCell align="center" sx={{ minWidth: 200 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No sales invoices found</TableCell>
                </TableRow>
              ) : (
                items.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{inv.invoiceNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{inv.customerName || '-'}</Typography>
                    </TableCell>
                    <TableCell>{inv.invoiceDate?.split('T')[0] || inv.invoiceDate}</TableCell>
                    <TableCell>{inv.dueDate?.split('T')[0] || inv.dueDate}</TableCell>
                    <TableCell>{inv.warehouseName || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{parseFloat(inv.grandTotal || 0).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inv.status?.replace('_', ' ').toUpperCase()} color={statusColors[inv.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      {inv.isInventoryImpact ? <Chip label="Yes" color="success" size="small" /> : <Chip label="No" size="small" />}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(inv)}>
                            <ViewIcon fontSize="small" />
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
                              <IconButton size="small" onClick={() => handleEdit(inv)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Post (Journal Entry + Inventory)">
                              <IconButton size="small" color="success" onClick={() => handlePost(inv)}>
                                <PostIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(inv)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {['posted', 'partially_paid', 'overdue'].includes(inv.status) && (
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="warning" onClick={() => handleCancel(inv)}>
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

      {/* Post Confirmation Dialog */}
      <Dialog open={openPostDialog} onClose={handleClosePost} maxWidth="sm" fullWidth>
        <DialogTitle>Post Invoice #{postTarget?.invoiceNumber || ''}</DialogTitle>
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
                        <TextField {...params} label="Sales Revenue Account" size="small" fullWidth />
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
            Post Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onClose={handleClosePdfPreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Invoice Preview - {pdfFilename.replace('Invoice_', '').replace('.pdf', '')}</Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Send Email"><IconButton size="small" color="primary" onClick={handleOpenEmailDialog}><EmailIcon /></IconButton></Tooltip>
              <Tooltip title="Print"><IconButton size="small" color="secondary" onClick={handlePrintPdf}><PrintIcon /></IconButton></Tooltip>
              <Tooltip title="Download PDF"><IconButton size="small" color="primary" onClick={() => {
                  if (pdfBlobUrl) {
                    const a = document.createElement('a');
                    a.href = pdfBlobUrl;
                    a.download = pdfFilename;
                    a.click();
                  }
                }}>
                <ExportIcon />
              </IconButton></Tooltip>
              <IconButton size="small" onClick={handleClosePdfPreview}>
                <CancelIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 0 }}>
          {pdfBlobUrl && <PdfViewer blobUrl={pdfBlobUrl} />}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EmailIcon color="primary" />
            <Typography variant="h6">Send Invoice via Email</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Recipient Email"
              type="email"
              required
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="customer@example.com"
              size="small"
            />
            <TextField
              fullWidth
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={`Invoice #${pdfFilename.replace('Invoice_', '').replace('.pdf', '')}`}
              size="small"
            />
            <TextField
              fullWidth
              label="Email Body"
              multiline
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={`Dear Customer,\n\nPlease find attached invoice for your reference.\n\nBest regards,\n${activeCompany?.name || 'EzeeFlo ERP'}`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={sendingEmail}>Cancel</Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            color="primary"
            disabled={sendingEmail || !emailTo}
            startIcon={sendingEmail ? <CircularProgress size={16} /> : <EmailIcon />}
          >
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesInvoices;