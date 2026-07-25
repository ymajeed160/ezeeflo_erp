import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Paper, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Tabs, Tab, Divider, Alert, Snackbar, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  RadioGroup, Radio, Slider, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Save, Refresh, Email, Security, Backup, Print, Dashboard as DashboardIcon,
  PointOfSale, ShoppingCart, Inventory2, AccountBalance, Settings,
  Description, Report, IntegrationInstructions, Notifications,
  Discount, RestartAlt, Send, AccountBalanceWallet,
  AddCircleOutline, Delete, Edit,
} from '@mui/icons-material';
import SystemConfigApi from '../services/systemConfigApi';

// ─── Tab Configuration ───
const TABS = [
  { label: 'Sales', icon: <ShoppingCart />, key: 'sales' },
  { label: 'Purchase', icon: <PointOfSale />, key: 'purchase' },
  { label: 'Inventory', icon: <Inventory2 />, key: 'inventory' },
  { label: 'Accounting', icon: <AccountBalance />, key: 'accounting' },
  { label: 'Number Series', icon: <Description />, key: 'number-series' },
  { label: 'Tax', icon: <Discount />, key: 'tax' },
  { label: 'VAT Codes', icon: <Description />, key: 'vat-codes' },
  { label: 'Email', icon: <Email />, key: 'email' },
  { label: 'Notifications', icon: <Notifications />, key: 'notifications' },
  { label: 'Security', icon: <Security />, key: 'security' },
  { label: 'Backup', icon: <Backup />, key: 'backup' },
  { label: 'Printing', icon: <Print />, key: 'printing' },
  { label: 'Dashboard', icon: <DashboardIcon />, key: 'dashboard' },
  { label: 'POS', icon: <PointOfSale />, key: 'pos' },
  { label: 'User Prefs', icon: <Settings />, key: 'user-preferences' },
  { label: 'Documents', icon: <Description />, key: 'documents' },
  { label: 'Audit', icon: <Security />, key: 'audit' },
  { label: 'Reporting', icon: <Report />, key: 'reporting' },
  { label: 'Integration', icon: <IntegrationInstructions />, key: 'integration' },
];

const ConfigSelect = ({ label, value, options, onChange, fullWidth = true, disabled = false }) => (
  <FormControl fullWidth={fullWidth} size="small" sx={{ mt: 1 }}>
    <InputLabel>{label}</InputLabel>
    <Select value={value || ''} label={label} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <MenuItem value=""><em>None</em></MenuItem>
      {options.map((opt, i) => (
        <MenuItem key={i} value={opt.value || opt.id || opt}>{opt.label || opt.name || opt}</MenuItem>
      ))}
    </Select>
  </FormControl>
);

const ConfigSwitch = ({ label, checked, onChange, description }) => (
  <FormControlLabel
    control={<Switch checked={!!checked} onChange={(e) => onChange(e.target.checked)} />}
    label={<Box><Typography variant="body2">{label}</Typography>{description && <Typography variant="caption" color="text.secondary">{description}</Typography>}</Box>}
    sx={{ mt: 1, alignItems: 'flex-start' }}
  />
);

const ConfigTextField = ({ label, value, onChange, type = 'text', disabled = false, placeholder = '', multiline = false }) => (
  <TextField
    fullWidth size="small" label={label} value={value || ''}
    onChange={(e) => onChange(e.target.value)} type={type}
    disabled={disabled} placeholder={placeholder} multiline={multiline}
    sx={{ mt: 1 }}
  />
);

const SectionCard = ({ title, icon, children }) => (
  <Card sx={{ mb: 2, borderRadius: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
        <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

const SystemConfigPage = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [configs, setConfigs] = useState({});
  const [emailSettings, setEmailSettings] = useState({});
  const [numberSeries, setNumberSeries] = useState([]);
  const [refData, setRefData] = useState({ accounts: [], warehouses: [], customers: [], suppliers: [], taxRates: [] });
  const [vatCodes, setVatCodes] = useState([]);
  const [vatCodeDialog, setVatCodeDialog] = useState({ open: false, editItem: null });
  const [vatCodeForm, setVatCodeForm] = useState({ code: '', name: '', description: '' });

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SystemConfigApi.getAll();
      if (res.success) {
        setConfigs(res.data.configs || {});
        setEmailSettings(res.data.emailSettings || {});
        setNumberSeries(res.data.numberSeries || []);
        setRefData(res.data.referenceData || { accounts: [], warehouses: [], customers: [], suppliers: [], taxRates: [] });
      }
    } catch (err) {
      showMsg('Error loading settings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await SystemConfigApi.saveConfigs(configs);
      showMsg('All settings saved successfully');
    } catch (err) {
      showMsg('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      await SystemConfigApi.saveEmailSettings(emailSettings);
      showMsg('Email settings saved');
    } catch (err) {
      showMsg('Error saving email settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNumberSeries = async () => {
    setSaving(true);
    try {
      await SystemConfigApi.saveNumberSeries(numberSeries);
      showMsg('Number series saved');
    } catch (err) {
      showMsg('Error saving number series', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const recipient = emailSettings.senderEmail;
      if (!recipient) {
        showMsg('Please enter a Sender Email first', 'warning');
        return;
      }
      const res = await SystemConfigApi.testEmail(recipient);
      showMsg(res.message || 'Test email sent successfully');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error sending test email';
      showMsg(msg, 'error');
    }
  };

  const handleReset = async (category) => {
    try {
      await SystemConfigApi.resetToDefaults(category);
      showMsg(`${category} settings reset to defaults`);
      fetchData();
    } catch (err) {
      showMsg('Error resetting settings', 'error');
    }
  };

  const updateConfig = (category, key, value) => {
    setConfigs(prev => ({
      ...prev,
      [category]: { ...(prev[category] || {}), [key]: value },
    }));
  };

  const updateSeries = (index, field, value) => {
    setNumberSeries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ─── VAT Category Codes ───
  const loadVatCodes = useCallback(async () => {
    try {
      const res = await SystemConfigApi.getVatCategoryCodes();
      if (res.success) setVatCodes(res.data || []);
    } catch (err) {
      showMsg('Error loading VAT codes', 'error');
    }
  }, []);

  const handleOpenVatDialog = (item = null) => {
    setVatCodeForm(item ? { code: item.code, name: item.name, description: item.description || '' } : { code: '', name: '', description: '' });
    setVatCodeDialog({ open: true, editItem: item });
  };

  const handleCloseVatDialog = () => {
    setVatCodeDialog({ open: false, editItem: null });
    setVatCodeForm({ code: '', name: '', description: '' });
  };

  const handleSaveVatCode = async () => {
    if (!vatCodeForm.code.trim() || !vatCodeForm.name.trim()) {
      showMsg('Code and Name are required', 'warning');
      return;
    }
    try {
      const payload = {
        ...(vatCodeDialog.editItem?.id && { id: vatCodeDialog.editItem.id }),
        code: vatCodeForm.code.trim(),
        name: vatCodeForm.name.trim(),
        description: vatCodeForm.description.trim(),
      };
      await SystemConfigApi.saveVatCategoryCode(payload);
      showMsg(vatCodeDialog.editItem ? 'VAT code updated' : 'VAT code created');
      handleCloseVatDialog();
      await loadVatCodes();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error saving VAT code', 'error');
    }
  };

  const handleDeleteVatCode = async (id) => {
    try {
      await SystemConfigApi.deleteVatCategoryCode(id);
      showMsg('VAT code deleted');
      await loadVatCodes();
    } catch (err) {
      showMsg('Error deleting VAT code', 'error');
    }
  };

  // Load VAT codes when switching to VAT Codes tab
  useEffect(() => {
    if (tab === 6) loadVatCodes();
  }, [tab, loadVatCodes]);

  const { accounts, warehouses, customers, suppliers, taxRates } = refData;
  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }));
  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const taxOptions = taxRates.map(t => ({ value: t.id, label: `${t.name} (${t.rate}%)` }));
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

  const getCfg = (cat, key, defaultVal = '') => configs[cat]?.[key] ?? defaultVal;

  if (loading) return <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2 }} /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>⚙️ System Configuration</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Reload</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, mb: 2 }}>
        <Tabs
          value={tab} onChange={(e, v) => setTab(v)}
          variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 500 } }}
        >
          {TABS.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {/* ═══ 1. SALES ═══ */}
        {tab === 0 && (
          <SectionCard title="Sales Settings" icon={<ShoppingCart />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Auto Generate Invoice #" checked={getCfg('sales', 'auto_invoice_number') === 'true'}
                  onChange={(v) => updateConfig('sales', 'auto_invoice_number', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Invoice Prefix" value={getCfg('sales', 'invoice_prefix', 'INV-')}
                  onChange={(v) => updateConfig('sales', 'invoice_prefix', v)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Quotation Prefix" value={getCfg('sales', 'quotation_prefix', 'QTN-')}
                  onChange={(v) => updateConfig('sales', 'quotation_prefix', v)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Sales Order Prefix" value={getCfg('sales', 'so_prefix', 'SO-')}
                  onChange={(v) => updateConfig('sales', 'so_prefix', v)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Sales Tax" value={getCfg('sales', 'default_tax')}
                  onChange={(v) => updateConfig('sales', 'default_tax', v)} options={taxOptions} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Warehouse" value={getCfg('sales', 'default_warehouse')}
                  onChange={(v) => updateConfig('sales', 'default_warehouse', v)} options={warehouseOptions} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Price List" value={getCfg('sales', 'default_price_list')}
                  onChange={(v) => updateConfig('sales', 'default_price_list', v)} options={['Standard', 'Wholesale', 'Retail', 'Promotional']} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Allow Negative Stock" checked={getCfg('sales', 'allow_negative_stock') === 'true'}
                  onChange={(v) => updateConfig('sales', 'allow_negative_stock', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Default Invoice Due Days" value={getCfg('sales', 'due_days', '30')}
                  onChange={(v) => updateConfig('sales', 'due_days', v)} type="number" />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 3. PURCHASE ═══ */}
        {tab === 1 && (
          <SectionCard title="Purchase Settings" icon={<PointOfSale />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Auto Generate Purchase Invoice #" checked={getCfg('purchase', 'auto_invoice_number') === 'true'}
                  onChange={(v) => updateConfig('purchase', 'auto_invoice_number', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Invoice Prefix" value={getCfg('purchase', 'invoice_prefix', 'PI-')}
                  onChange={(v) => updateConfig('purchase', 'invoice_prefix', v)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="PO Prefix" value={getCfg('purchase', 'po_prefix', 'PO-')}
                  onChange={(v) => updateConfig('purchase', 'po_prefix', v)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Purchase Tax" value={getCfg('purchase', 'default_tax')}
                  onChange={(v) => updateConfig('purchase', 'default_tax', v)} options={taxOptions} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Warehouse" value={getCfg('purchase', 'default_warehouse')}
                  onChange={(v) => updateConfig('purchase', 'default_warehouse', v)} options={warehouseOptions} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Payment Terms" value={getCfg('purchase', 'default_payment_terms')}
                  onChange={(v) => updateConfig('purchase', 'default_payment_terms', v)}
                  options={['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60']} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Supplier" value={getCfg('purchase', 'default_supplier')}
                  onChange={(v) => updateConfig('purchase', 'default_supplier', v)} options={supplierOptions} />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 4. INVENTORY ═══ */}
        {tab === 2 && (
          <SectionCard title="Inventory Settings" icon={<Inventory2 />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Stock Valuation Method" value={getCfg('inventory', 'valuation_method')}
                  onChange={(v) => updateConfig('inventory', 'valuation_method', v)}
                  options={['FIFO', 'LIFO', 'Weighted Average']} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Enable Batch Tracking" checked={getCfg('inventory', 'batch_tracking') === 'true'}
                  onChange={(v) => updateConfig('inventory', 'batch_tracking', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Enable Serial Number Tracking" checked={getCfg('inventory', 'serial_tracking') === 'true'}
                  onChange={(v) => updateConfig('inventory', 'serial_tracking', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Enable Barcode" checked={getCfg('inventory', 'enable_barcode') === 'true'}
                  onChange={(v) => updateConfig('inventory', 'enable_barcode', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Allow Negative Stock" checked={getCfg('inventory', 'allow_negative_stock') === 'true'}
                  onChange={(v) => updateConfig('inventory', 'allow_negative_stock', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Default Reorder Level" value={getCfg('inventory', 'default_reorder_level', '10')}
                  onChange={(v) => updateConfig('inventory', 'default_reorder_level', v)} type="number" />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Low Stock Alert" checked={getCfg('inventory', 'low_stock_alert') === 'true'}
                  onChange={(v) => updateConfig('inventory', 'low_stock_alert', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Warehouse" value={getCfg('inventory', 'default_warehouse')}
                  onChange={(v) => updateConfig('inventory', 'default_warehouse', v)} options={warehouseOptions} />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 5. ACCOUNTING ═══ */}
        {tab === 3 && (
          <SectionCard title="Accounting Settings" icon={<AccountBalance />}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Select accounts from your Chart of Accounts</Typography>
            <Grid container spacing={2}>
              {[
                { key: 'default_cash_account', label: 'Default Cash Account' },
                { key: 'default_bank_account', label: 'Default Bank Account' },
                { key: 'accounts_receivable', label: 'Accounts Receivable' },
                { key: 'accounts_payable', label: 'Accounts Payable' },
                { key: 'revenue_account', label: 'Revenue Account' },
                { key: 'expense_account', label: 'Expense Account' },
                { key: 'inventory_account', label: 'Inventory Account' },
                { key: 'cogs_account', label: 'Cost of Goods Sold' },
                { key: 'vat_payable', label: 'VAT Payable' },
                { key: 'vat_receivable', label: 'VAT Receivable' },
                { key: 'retained_earnings', label: 'Retained Earnings' },
                { key: 'round_off_account', label: 'Round Off Account' },
              ].map(({ key, label }) => (
                <Grid item xs={12} md={4} key={key}>
                  <ConfigSelect label={label} value={getCfg('accounting', key)}
                    onChange={(v) => updateConfig('accounting', key, v)} options={accountOptions} />
                </Grid>
              ))}
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 6. NUMBER SERIES ═══ */}
        {tab === 5 && (
          <SectionCard title="Document Number Series" icon={<Description />}>
            <Button variant="contained" size="small" onClick={handleSaveNumberSeries} disabled={saving} sx={{ mb: 2 }}>
              {saving ? 'Saving...' : 'Save Number Series'}
            </Button>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Prefix</TableCell>
                    <TableCell>Suffix</TableCell>
                    <TableCell align="right">Next #</TableCell>
                    <TableCell align="right">Length</TableCell>
                    <TableCell align="center">Pad Zero</TableCell>
                    <TableCell>Reset</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {numberSeries.map((s, i) => (
                    <TableRow key={s.seriesName || i}>
                      <TableCell><Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{s.seriesName?.replace(/_/g, ' ')}</Typography></TableCell>
                      <TableCell><TextField size="small" value={s.prefix || ''} onChange={(e) => updateSeries(i, 'prefix', e.target.value)} sx={{ width: 100 }} /></TableCell>
                      <TableCell><TextField size="small" value={s.suffix || ''} onChange={(e) => updateSeries(i, 'suffix', e.target.value)} sx={{ width: 100 }} /></TableCell>
                      <TableCell><TextField size="small" type="number" value={s.nextNumber || 1} onChange={(e) => updateSeries(i, 'nextNumber', parseInt(e.target.value) || 1)} sx={{ width: 80 }} /></TableCell>
                      <TableCell><TextField size="small" type="number" value={s.numberLength || 5} onChange={(e) => updateSeries(i, 'numberLength', parseInt(e.target.value) || 5)} sx={{ width: 80 }} inputProps={{ min: 1, max: 10 }} /></TableCell>
                      <TableCell align="center"><Switch checked={!!s.padZero} onChange={(e) => updateSeries(i, 'padZero', e.target.checked)} size="small" /></TableCell>
                      <TableCell>
                        <Select size="small" value={s.resetPeriod || 'none'} onChange={(e) => updateSeries(i, 'resetPeriod', e.target.value)} sx={{ width: 100 }}>
                          <MenuItem value="none">None</MenuItem>
                          <MenuItem value="yearly">Yearly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                          <MenuItem value="daily">Daily</MenuItem>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        )}

        {/* ═══ 7. TAX ═══ */}
        {tab === 5 && (
          <SectionCard title="Tax Settings" icon={<Discount />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Sales Tax" value={getCfg('tax', 'default_sales_tax')}
                  onChange={(v) => updateConfig('tax', 'default_sales_tax', v)} options={taxOptions} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Default Purchase Tax" value={getCfg('tax', 'default_purchase_tax')}
                  onChange={(v) => updateConfig('tax', 'default_purchase_tax', v)} options={taxOptions} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSelect label="Tax Inclusive/Exclusive" value={getCfg('tax', 'tax_inclusive')}
                  onChange={(v) => updateConfig('tax', 'tax_inclusive', v)} options={['Exclusive', 'Inclusive']} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigSwitch label="Multiple Tax Support" checked={getCfg('tax', 'multiple_tax') === 'true'}
                  onChange={(v) => updateConfig('tax', 'multiple_tax', String(v))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Tax Decimal Precision" value={getCfg('tax', 'tax_decimals', '2')}
                  onChange={(v) => updateConfig('tax', 'tax_decimals', v)} type="number" />
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 8. VAT CATEGORY CODES ═══ */}
        {tab === 7 && (
          <SectionCard title="VAT Category Code List" icon={<Description />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Manage VAT category codes used for tax reporting and e-invoicing
              </Typography>
              <Button variant="contained" size="small" startIcon={<AddCircleOutline />}
                onClick={() => handleOpenVatDialog()}>
                Add Code
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={100}><strong>Code</strong></TableCell>
                    <TableCell><strong>Name / Description</strong></TableCell>
                    <TableCell align="center" width={100}><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vatCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No VAT category codes defined. Click "Add Code" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    vatCodes.map((vc) => (
                      <TableRow key={vc.id}>
                        <TableCell>
                          <Chip label={vc.code} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{vc.name}</Typography>
                          {vc.description && (
                            <Typography variant="caption" color="text.secondary">{vc.description}</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenVatDialog(vc)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteVatCode(vc.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        )}

        {/* ═══ 9. EMAIL ═══ */}
        {tab === 7 && (
          <SectionCard title="Email Settings" icon={<Email />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="SMTP Server" value={emailSettings.smtpHost || ''}
                  onChange={(v) => setEmailSettings(p => ({ ...p, smtpHost: v }))} />
              </Grid>
              <Grid item xs={12} md={2}>
                <ConfigTextField label="SMTP Port" value={emailSettings.smtpPort || 587}
                  onChange={(v) => setEmailSettings(p => ({ ...p, smtpPort: parseInt(v) || 587 }))} type="number" />
              </Grid>
              <Grid item xs={12} md={3}>
                <ConfigTextField label="Sender Email" value={emailSettings.senderEmail || ''}
                  onChange={(v) => setEmailSettings(p => ({ ...p, senderEmail: v }))} />
              </Grid>
              <Grid item xs={12} md={3}>
                <ConfigTextField label="Sender Name" value={emailSettings.senderName || ''}
                  onChange={(v) => setEmailSettings(p => ({ ...p, senderName: v }))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Username" value={emailSettings.username || ''}
                  onChange={(v) => setEmailSettings(p => ({ ...p, username: v }))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ConfigTextField label="Password" value={emailSettings.password || ''}
                  onChange={(v) => setEmailSettings(p => ({ ...p, password: v }))} type="password" />
              </Grid>
              <Grid item xs={12} md={2}>
                <ConfigSwitch label="SSL" checked={emailSettings.useSsl} onChange={(v) => setEmailSettings(p => ({ ...p, useSsl: v }))} />
              </Grid>
              <Grid item xs={12} md={2}>
                <ConfigSwitch label="TLS" checked={emailSettings.useTls ?? true} onChange={(v) => setEmailSettings(p => ({ ...p, useTls: v }))} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveEmail}>Save Email Settings</Button>
                  <Button variant="outlined" startIcon={<Send />} onClick={handleTestEmail}>Test Email</Button>
                </Box>
              </Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 10. NOTIFICATIONS ═══ */}
        {tab === 8 && (
          <SectionCard title="Notification Settings" icon={<Notifications />}>
            <Grid container spacing={2}>
              {[
                { key: 'low_stock', label: 'Low Stock Notifications' },
                { key: 'sales', label: 'Sales Notifications' },
                { key: 'purchase', label: 'Purchase Notifications' },
                { key: 'payment_due', label: 'Payment Due Notifications' },
                { key: 'customer_outstanding', label: 'Customer Outstanding Alerts' },
                { key: 'supplier_outstanding', label: 'Supplier Outstanding Alerts' },
                { key: 'email', label: 'Email Notifications' },
                { key: 'sms', label: 'SMS Notifications' },
              ].map(({ key, label }) => (
                <Grid item xs={12} md={3} key={key}>
                  <ConfigSwitch label={label} checked={getCfg('notifications', key) === 'true'}
                    onChange={(v) => updateConfig('notifications', key, String(v))} />
                </Grid>
              ))}
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 11. SECURITY ═══ */}
        {tab === 9 && (
          <SectionCard title="Security Settings" icon={<Security />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><ConfigTextField label="Password Min Length" value={getCfg('security', 'password_min_length', '8')} onChange={(v) => updateConfig('security', 'password_min_length', v)} type="number" /></Grid>
              <Grid item xs={12} md={3}><ConfigSelect label="Password Complexity" value={getCfg('security', 'password_complexity')} onChange={(v) => updateConfig('security', 'password_complexity', v)} options={['Low', 'Medium', 'High']} /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Password Expiry Days" value={getCfg('security', 'password_expiry_days', '90')} onChange={(v) => updateConfig('security', 'password_expiry_days', v)} type="number" /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Session Timeout (min)" value={getCfg('security', 'session_timeout', '60')} onChange={(v) => updateConfig('security', 'session_timeout', v)} type="number" /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Max Login Attempts" value={getCfg('security', 'max_login_attempts', '5')} onChange={(v) => updateConfig('security', 'max_login_attempts', v)} type="number" /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Lock Duration (min)" value={getCfg('security', 'lock_duration', '30')} onChange={(v) => updateConfig('security', 'lock_duration', v)} type="number" /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Two-Factor Auth" checked={getCfg('security', 'two_factor') === 'true'} onChange={(v) => updateConfig('security', 'two_factor', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Audit Logs" checked={getCfg('security', 'audit_logs') === 'true'} onChange={(v) => updateConfig('security', 'audit_logs', String(v))} /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 12. BACKUP ═══ */}
        {tab === 11 && (
          <SectionCard title="Backup Settings" icon={<Backup />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><ConfigSwitch label="Auto Backup" checked={getCfg('backup', 'auto_backup') === 'true'} onChange={(v) => updateConfig('backup', 'auto_backup', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSelect label="Backup Frequency" value={getCfg('backup', 'frequency')} onChange={(v) => updateConfig('backup', 'frequency', v)} options={['Daily', 'Weekly', 'Monthly']} /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Backup Time (HH:mm)" value={getCfg('backup', 'backup_time', '02:00')} onChange={(v) => updateConfig('backup', 'backup_time', v)} /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Backup Location" value={getCfg('backup', 'backup_location', '/backups')} onChange={(v) => updateConfig('backup', 'backup_location', v)} /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Retention (days)" value={getCfg('backup', 'retention_days', '30')} onChange={(v) => updateConfig('backup', 'retention_days', v)} type="number" /></Grid>
              <Grid item xs={12}><Box sx={{ display: 'flex', gap: 1 }}><Button variant="contained">Backup Now</Button><Button variant="outlined">Restore</Button></Box></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 13. PRINTING ═══ */}
        {tab === 12 && (
          <SectionCard title="Printing Settings" icon={<Print />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><ConfigSelect label="Paper Size" value={getCfg('printing', 'paper_size')} onChange={(v) => updateConfig('printing', 'paper_size', v)} options={['A4', 'Letter', 'Legal', 'A5']} /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="Orientation" value={getCfg('printing', 'orientation')} onChange={(v) => updateConfig('printing', 'orientation', v)} options={['Portrait', 'Landscape']} /></Grid>
              <Grid item xs={12} md={4}><ConfigTextField label="Margins (mm)" value={getCfg('printing', 'margins', '10')} onChange={(v) => updateConfig('printing', 'margins', v)} type="number" /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Print Logo" checked={getCfg('printing', 'print_logo') === 'true'} onChange={(v) => updateConfig('printing', 'print_logo', String(v))} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Print Watermark" checked={getCfg('printing', 'print_watermark') === 'true'} onChange={(v) => updateConfig('printing', 'print_watermark', String(v))} /></Grid>
              <Grid item xs={12} md={4}><ConfigTextField label="Header Text" value={getCfg('printing', 'header_text', '')} onChange={(v) => updateConfig('printing', 'header_text', v)} /></Grid>
              <Grid item xs={12} md={4}><ConfigTextField label="Footer Text" value={getCfg('printing', 'footer_text', '')} onChange={(v) => updateConfig('printing', 'footer_text', v)} /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 14. DASHBOARD ═══ */}
        {tab === 12 && (
          <SectionCard title="Dashboard Settings" icon={<DashboardIcon />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><ConfigSelect label="Default View" value={getCfg('dashboard', 'default_view')} onChange={(v) => updateConfig('dashboard', 'default_view', v)} options={['Sales', 'Purchase', 'Inventory', 'Financial']} /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="Default Date Range" value={getCfg('dashboard', 'default_date_range')} onChange={(v) => updateConfig('dashboard', 'default_date_range', v)} options={['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom']} /></Grid>
              <Grid item xs={12} md={4}><ConfigTextField label="Refresh Interval (sec)" value={getCfg('dashboard', 'refresh_interval', '30')} onChange={(v) => updateConfig('dashboard', 'refresh_interval', v)} type="number" /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="Landing Page" value={getCfg('dashboard', 'landing_page')} onChange={(v) => updateConfig('dashboard', 'landing_page', v)} options={['Dashboard', 'Sales', 'Reports', 'BI Dashboard']} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Show KPI Cards" checked={getCfg('dashboard', 'show_kpis') !== 'false'} onChange={(v) => updateConfig('dashboard', 'show_kpis', String(v))} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Show Charts" checked={getCfg('dashboard', 'show_charts') !== 'false'} onChange={(v) => updateConfig('dashboard', 'show_charts', String(v))} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Show Recent Transactions" checked={getCfg('dashboard', 'show_transactions') !== 'false'} onChange={(v) => updateConfig('dashboard', 'show_transactions', String(v))} /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 15. POS ═══ */}
        {tab === 13 && (
          <SectionCard title="POS Settings" icon={<PointOfSale />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><ConfigSelect label="Default Warehouse" value={getCfg('pos', 'default_warehouse')} onChange={(v) => updateConfig('pos', 'default_warehouse', v)} options={warehouseOptions} /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="Default Cash Account" value={getCfg('pos', 'default_cash_account')} onChange={(v) => updateConfig('pos', 'default_cash_account', v)} options={accountOptions} /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="Default Customer" value={getCfg('pos', 'default_customer')} onChange={(v) => updateConfig('pos', 'default_customer', v)} options={customerOptions} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Enable Barcode Scanner" checked={getCfg('pos', 'barcode_scanner') === 'true'} onChange={(v) => updateConfig('pos', 'barcode_scanner', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Receipt Printing" checked={getCfg('pos', 'receipt_printing') === 'true'} onChange={(v) => updateConfig('pos', 'receipt_printing', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Cash Rounding" checked={getCfg('pos', 'cash_rounding') === 'true'} onChange={(v) => updateConfig('pos', 'cash_rounding', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Discount Approval" checked={getCfg('pos', 'discount_approval') === 'true'} onChange={(v) => updateConfig('pos', 'discount_approval', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Offline Mode" checked={getCfg('pos', 'offline_mode') === 'true'} onChange={(v) => updateConfig('pos', 'offline_mode', String(v))} /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 16. USER PREFERENCES ═══ */}
        {tab === 14 && (
          <SectionCard title="User Preferences" icon={<Settings />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><ConfigSelect label="Default Theme" value={getCfg('user-preferences', 'theme')} onChange={(v) => updateConfig('user-preferences', 'theme', v)} options={['Light', 'Dark', 'System']} /></Grid>
              <Grid item xs={12} md={3}><ConfigSelect label="Default Language" value={getCfg('user-preferences', 'language')} onChange={(v) => updateConfig('user-preferences', 'language', v)} options={['English', 'Arabic', 'French']} /></Grid>
              <Grid item xs={12} md={3}><ConfigSelect label="Time Format" value={getCfg('user-preferences', 'time_format')} onChange={(v) => updateConfig('user-preferences', 'time_format', v)} options={['12h', '24h']} /></Grid>
              <Grid item xs={12} md={3}><ConfigSelect label="Date Format" value={getCfg('user-preferences', 'date_format')} onChange={(v) => updateConfig('user-preferences', 'date_format', v)} options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Default Page Size" value={getCfg('user-preferences', 'page_size', '25')} onChange={(v) => updateConfig('user-preferences', 'page_size', v)} type="number" /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 17. DOCUMENTS ═══ */}
        {tab === 15 && (
          <SectionCard title="Document Settings" icon={<Description />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><ConfigSwitch label="Enable Attachments" checked={getCfg('documents', 'enable_attachments') === 'true'} onChange={(v) => updateConfig('documents', 'enable_attachments', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSelect label="Allowed File Types" value={getCfg('documents', 'allowed_types')} onChange={(v) => updateConfig('documents', 'allowed_types', v)} options={['PDF, Images', 'PDF, Images, Docs', 'All Files']} /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Max File Size (MB)" value={getCfg('documents', 'max_file_size', '10')} onChange={(v) => updateConfig('documents', 'max_file_size', v)} type="number" /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Digital Signature" checked={getCfg('documents', 'digital_signature') === 'true'} onChange={(v) => updateConfig('documents', 'digital_signature', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Watermark" checked={getCfg('documents', 'watermark') === 'true'} onChange={(v) => updateConfig('documents', 'watermark', String(v))} /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 18. AUDIT ═══ */}
        {tab === 17 && (
          <SectionCard title="Audit Settings" icon={<Security />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><ConfigSwitch label="Enable Audit Trail" checked={getCfg('audit', 'audit_trail') === 'true'} onChange={(v) => updateConfig('audit', 'audit_trail', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Log Login History" checked={getCfg('audit', 'log_login') === 'true'} onChange={(v) => updateConfig('audit', 'log_login', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Log Data Changes" checked={getCfg('audit', 'log_data_changes') === 'true'} onChange={(v) => updateConfig('audit', 'log_data_changes', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigSwitch label="Log User Activities" checked={getCfg('audit', 'log_activities') === 'true'} onChange={(v) => updateConfig('audit', 'log_activities', String(v))} /></Grid>
              <Grid item xs={12} md={3}><ConfigTextField label="Audit Retention (days)" value={getCfg('audit', 'retention_days', '365')} onChange={(v) => updateConfig('audit', 'retention_days', v)} type="number" /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 19. REPORTING ═══ */}
        {tab === 17 && (
          <SectionCard title="Reporting Settings" icon={<Report />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><ConfigSelect label="Default Report Period" value={getCfg('reporting', 'default_period')} onChange={(v) => updateConfig('reporting', 'default_period', v)} options={['This Month', 'This Quarter', 'This Year', 'Last Month', 'Last Quarter', 'Last Year']} /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="Default Export Format" value={getCfg('reporting', 'export_format')} onChange={(v) => updateConfig('reporting', 'export_format', v)} options={['PDF', 'Excel', 'CSV']} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Include Company Logo" checked={getCfg('reporting', 'include_logo') !== 'false'} onChange={(v) => updateConfig('reporting', 'include_logo', String(v))} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Include Footer Notes" checked={getCfg('reporting', 'include_footer') !== 'false'} onChange={(v) => updateConfig('reporting', 'include_footer', String(v))} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Enable BI Dashboard" checked={getCfg('reporting', 'enable_bi') !== 'false'} onChange={(v) => updateConfig('reporting', 'enable_bi', String(v))} /></Grid>
            </Grid>
          </SectionCard>
        )}

        {/* ═══ 20. INTEGRATION ═══ */}
        {tab === 18 && (
          <SectionCard title="Integration Settings" icon={<IntegrationInstructions />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><ConfigSelect label="Payment Gateway" value={getCfg('integration', 'payment_gateway')} onChange={(v) => updateConfig('integration', 'payment_gateway', v)} options={['Stripe', 'PayPal', 'Moyasar', 'Tap', 'None']} /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="Email Service" value={getCfg('integration', 'email_service')} onChange={(v) => updateConfig('integration', 'email_service', v)} options={['SMTP', 'SendGrid', 'Mailgun', 'None']} /></Grid>
              <Grid item xs={12} md={4}><ConfigSelect label="SMS Provider" value={getCfg('integration', 'sms_provider')} onChange={(v) => updateConfig('integration', 'sms_provider', v)} options={['Twilio', 'Nexmo', 'None']} /></Grid>
              <Grid item xs={12} md={4}><ConfigTextField label="API Key" value={getCfg('integration', 'api_key')} onChange={(v) => updateConfig('integration', 'api_key', v)} type="password" /></Grid>
              <Grid item xs={12} md={4}><ConfigTextField label="Webhook URL" value={getCfg('integration', 'webhook_url')} onChange={(v) => updateConfig('integration', 'webhook_url', v)} /></Grid>
              <Grid item xs={12} md={4}><ConfigSwitch label="Enable QuickBooks" checked={getCfg('integration', 'quickbooks') === 'true'} onChange={(v) => updateConfig('integration', 'quickbooks', String(v))} /></Grid>
            </Grid>
          </SectionCard>
        )}
      </Box>

      {/* VAT Category Code Dialog */}
      <Dialog open={vatCodeDialog.open} onClose={handleCloseVatDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{vatCodeDialog.editItem ? 'Edit VAT Category Code' : 'Add VAT Category Code'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Code *"
                value={vatCodeForm.code}
                onChange={(e) => setVatCodeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. S, E, Z"
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth size="small" label="Name / Description *"
                value={vatCodeForm.name}
                onChange={(e) => setVatCodeForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Standard rate"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Detailed Description"
                value={vatCodeForm.description}
                onChange={(e) => setVatCodeForm(p => ({ ...p, description: e.target.value }))}
                multiline rows={2}
                placeholder="Optional detailed description of this VAT category code"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVatDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVatCode}>
            {vatCodeDialog.editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemConfigPage;
