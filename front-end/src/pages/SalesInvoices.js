import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import SystemConfigApi from '../services/systemConfigApi';
import SalesInvoiceApi from '../services/salesInvoiceApi';
import salesOrderApi from '../services/salesOrderApi';
import { generateSalesInvoicePdf } from '../utils/pdfInvoice';
import QuickCreate from '../components/QuickCreate/QuickCreate';
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
  const location = useLocation();
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
  const [configRevenueAccountId, setConfigRevenueAccountId] = useState('');
  const [configVatPayableId, setConfigVatPayableId] = useState('');
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfInvoiceId, setPdfInvoiceId] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [reasonDialog, setReasonDialog] = useState({ open: false, action: null, target: null });
  const [reasonText, setReasonText] = useState('');
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
    const params = { search, status: statusFilter, customerId: customerFilter, page, limit };
    dispatch(fetchInvoices(params));
  }, [dispatch, search, statusFilter, customerFilter, page, limit]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomers({ limit: 999 }));
    dispatch(fetchItems({ limit: 999 }));
    dispatch(fetchWarehouses({ limit: 999 }));
  }, [loadData, dispatch]);

  // Fetch accounts for Accounting Information section + system config defaults
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

    const loadConfigDefaults = async () => {
      try {
        const cfgRes = await SystemConfigApi.getAll();
        const configMap = cfgRes.data?.configs || cfgRes.configs || cfgRes.data || {};
        const accounting = configMap.accounting || {};
        if (accounting.revenue_account) setConfigRevenueAccountId(accounting.revenue_account);
        if (accounting.vat_payable) setConfigVatPayableId(accounting.vat_payable);
      } catch (err) {
        console.error('Failed to load accounting system config:', err);
      }
    };

    loadAccounts();
    loadConfigDefaults();
  }, []);

  // Auto-resolve Sales Revenue + VAT Payable from System Config (accounting tab)
  useEffect(() => {
    if (configRevenueAccountId && !watch('revenueAccountId')) {
      setValue('revenueAccountId', configRevenueAccountId);
    }
  }, [configRevenueAccountId, watch, setValue]);

  useEffect(() => {
    if (configVatPayableId && !watch('taxAccountId')) {
      setValue('taxAccountId', configVatPayableId);
    }
  }, [configVatPayableId, watch, setValue]);

  // Prefill a new invoice from a sales order (navigate ?salesOrderId=X)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const salesOrderId = params.get('salesOrderId');
    if (!salesOrderId) return;
    (async () => {
      try {
        const res = await salesOrderApi.getInvoiceableLines(salesOrderId);
        const data = res.data?.data || res.data;
        const lines = (data.lines || []).filter((l) => l.remainingQuantity > 0);
        setViewMode(false);
        setEditId(null);
        setGenerateFromSO(false);
        setGenerateFromDN(false);
        reset({
          customerId: data.customerId || '',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          warehouseId: data.warehouseId || '',
          salesOrderId: data.id || null,
          deliveryNoteId: null,
          notes: data.orderNumber ? `Invoice for Sales Order ${data.orderNumber}` : '',
          termsConditions: '',
          isInventoryImpact: false,
          customerAccountId: '',
          revenueAccountId: configRevenueAccountId,
          taxAccountId: configVatPayableId,
          details: lines.length > 0 ? lines.map((l) => ({
            salesOrderDetailId: l.salesOrderDetailId,
            itemId: l.itemId,
            description: l.description || '',
            quantity: l.remainingQuantity,
            unitPrice: l.unitPrice,
            taxPercent: l.taxPercentage,
            discountPercent: l.discountPercentage,
            costPrice: 0,
          })) : [{ itemId: '', description: '', quantity: 1, unitPrice: 0, taxPercent: 0, discountPercent: 0, costPrice: 0 }],
        });
        setOpenForm(true);
      } catch (e) {
        apiError('Could not load sales order for invoicing');
      }
    })();
  }, [location.search]);

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
        revenueAccountId: selected.revenueAccountId || configRevenueAccountId,
        taxAccountId: selected.taxAccountId || configVatPayableId,
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
      revenueAccountId: configRevenueAccountId,
      taxAccountId: configVatPayableId,
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
    setReasonDialog({ open: true, action: 'delete', target: invoice.id });
    setReasonText('');
  };

  const handleReasonConfirm = async () => {
    const { action, target } = reasonDialog;
    setReasonDialog({ open: false, action: null, target: null });
    if (!target) return;
    if (action === 'delete') {
      const result = await dispatch(deleteInvoice({ id: target, reason: reasonText || null }));
      if (result.meta.requestStatus === 'fulfilled') {
        apiSuccess('Invoice deleted successfully');
      } else {
        apiError(result.payload || 'Failed to delete invoice');
      }
    } else if (action === 'cancel') {
      const result = await dispatch(cancelInvoice({ id: target, reason: reasonText || null }));
      if (result.meta.requestStatus === 'fulfilled') {
        apiSuccess('Invoice cancelled successfully');
      } else {
        apiError(result.payload || 'Failed to cancel invoice');
      }
    }
    setReasonText('');
    loadData();
  };

  const handlePost = async (invoice) => {
    setPostTarget(invoice);
    setPostPreview(null);
    setOpenPostDialog(true);
    try {
      const res = await SalesInvoiceApi.getPostingPreview(invoice.id);
      const preview = res.data?.data || res.data || res;
      setPostPreview(preview);
    } catch (e) {
      apiError(e.response?.data?.message || 'Could not load posting accounts');
      setOpenPostDialog(false);
      setPostTarget(null);
    }
  };

  const handlePostSubmit = async () => {
    if (!postTarget) return;
    try {
      // Backend resolves accounts from Customer profile + System Config automatically
      const response = await SalesInvoiceApi.post(postTarget.id, {});
      if (response) {
        apiSuccess('Invoice posted successfully - Journal entry created');
        setOpenPostDialog(false);
        setPostTarget(null);
        setPostPreview(null);
        loadData();
      }
    } catch (error) {
      apiError(error.response?.data?.message || error.message || 'Failed to post invoice');
    }
  };

  const handleClosePost = () => {
    setOpenPostDialog(false);
    setPostTarget(null);
    setPostPreview(null);
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
    setReasonDialog({ open: true, action: 'cancel', target: invoice.id });
    setReasonText('');
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
        salesOrderDetailId: d.salesOrderDetailId || null,
        deliveryNoteDetailId: d.deliveryNoteDetailId || null,
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
    // Sales Revenue + VAT Payable are resolved from System Config (accounting tab) —
    // do NOT override them from the item.
  };

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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                      sx={{ flex: 1 }}
                    />
                  )}
                />
                <QuickCreate
                  entityKey="customer"
                  disabled={viewMode}
                  onCreated={(c) => {
                    dispatch(fetchCustomers({ limit: 999 }));
                    setValue('customerId', c.id, { shouldValidate: true });
                    if (c.arAccountId) setValue('customerAccountId', c.arAccountId);
                  }}
                />
              </Box>
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
                      disabled
                      value={arAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={arAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Customer Account (A/R)" size="small" helperText="Auto from customer profile" />
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
                      disabled
                      value={revenueAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={revenueAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Sales Revenue Account" size="small" helperText="Auto from Settings → Accounting" />
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
                      disabled
                      value={taxAccounts.find((a) => a.id === field.value) || null}
                      onChange={(_, val) => field.onChange(val ? val.id : '')}
                      options={taxAccounts}
                      getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Tax Account (VAT Payable)" size="small" helperText="Auto from Settings → Accounting" />
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Autocomplete
                          disabled={viewMode}
                          size="small"
                          value={itemsList.find((it) => it.id === details[index]?.itemId) || null}
                          onChange={(_, val) => handleItemSelect(index, val)}
                          options={itemsList}
                          getOptionLabel={(opt) => `${opt.itemCode} - ${opt.name || opt.itemName || ''}`}
                          isOptionEqualToValue={(opt, val) => opt.id === val.id}
                          renderInput={(params) => <TextField {...params} placeholder="Select Item" />}
                          sx={{ flex: 1 }}
                        />
                        <QuickCreate
                          entityKey="item"
                          disabled={viewMode}
                          onCreated={(it) => {
                            dispatch(fetchItems({ limit: 999 }));
                            handleItemSelect(index, it);
                          }}
                        />
                      </Box>
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
              <Stack direction="row" spacing={1} alignItems="center">
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
            The Chart of Accounts below were resolved automatically:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Customer Account (A/R)</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {postPreview?.customerAccount
                    ? `${postPreview.customerAccount.code} - ${postPreview.customerAccount.name}`
                    : 'Not configured'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Sales Revenue Account</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {postPreview?.revenueAccount
                    ? `${postPreview.revenueAccount.code} - ${postPreview.revenueAccount.name}`
                    : 'Not configured'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Tax Account (VAT Payable)</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {postPreview?.taxAccount
                    ? `${postPreview.taxAccount.code} - ${postPreview.taxAccount.name}`
                    : 'No tax'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="body2">
                  Customer: <strong>{postPreview?.customer?.name || '-'}</strong>
                  &nbsp;|&nbsp; Grand Total: <strong>{Number(postPreview?.grandTotal || postTarget?.grandTotal || 0).toFixed(2)}</strong>
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePost}>Cancel</Button>
          <Button onClick={handlePostSubmit} variant="contained" color="primary" disabled={!postPreview}>
            Post Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete / Cancel reason dialog */}
      <Dialog open={reasonDialog.open} onClose={() => setReasonDialog({ open: false, action: null, target: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reasonDialog.action === 'delete' ? 'Delete Invoice' : 'Cancel Invoice'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {reasonDialog.action === 'delete'
              ? 'This invoice will be deleted. If it has a journal entry, delete the journal entry first.'
              : 'Cancelling a posted invoice reverses its journal entry and inventory.'}
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Reason (optional)"
            multiline
            rows={2}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialog({ open: false, action: null, target: null })}>Back</Button>
          <Button
            onClick={handleReasonConfirm}
            variant="contained"
            color={reasonDialog.action === 'delete' ? 'error' : 'warning'}
          >
            {reasonDialog.action === 'delete' ? 'Delete' : 'Cancel Invoice'}
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