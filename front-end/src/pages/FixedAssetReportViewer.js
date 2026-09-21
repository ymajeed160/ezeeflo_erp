import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, Alert, Tooltip, IconButton, Stack, Chip, Divider,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon, Print as PrintIcon,
  FileDownload as ExcelIcon, PictureAsPdf as PdfIcon, ArrowBack as BackIcon, Description as CsvIcon,
} from '@mui/icons-material';
import fixedAssetReportApi from '../services/fixedAssetReportApi';
import { apiError, apiSuccess } from '../utils/toast';

const REPORT_META = {
  'asset-register': {
    title: 'Asset Register', filters: ['categoryId', 'assetId', 'status', 'location', 'department', 'custodian', 'purchaseDateFrom', 'purchaseDateTo'],
    summaryKeys: ['totalAssets', 'totalCost', 'totalAccumDepr', 'totalBookValue'],
  },
  'depreciation-schedule': {
    title: 'Depreciation Schedule', filters: ['categoryId', 'assetId', 'depreciationMethod', 'fromDate', 'toDate'],
    summaryKeys: ['totalEntries', 'totalDepreciation'],
  },
  'movements': {
    title: 'Asset Movement Report', filters: ['fromLocation', 'toLocation', 'custodian', 'fromDate', 'toDate'],
    summaryKeys: ['totalTransfers'],
  },
  'disposals': {
    title: 'Asset Disposal Report', filters: ['disposalType', 'categoryId', 'assetId', 'fromDate', 'toDate'],
    summaryKeys: ['totalDisposals', 'totalGain', 'totalLoss', 'totalSaleAmount'],
  },
  'revaluations': {
    title: 'Asset Revaluation Report', filters: ['assetId', 'fromDate', 'toDate'],
    summaryKeys: ['totalRevaluations', 'totalIncrease', 'totalDecrease'],
  },
  'maintenance': {
    title: 'Asset Maintenance Report', filters: ['assetId', 'status', 'serviceProvider', 'fromDate', 'toDate'],
    summaryKeys: ['totalRecords', 'totalCost', 'preventive', 'corrective'],
  },
  'insurance': {
    title: 'Insurance Report', filters: ['insuranceCompany', 'status', 'expiringDays'],
    summaryKeys: ['totalPolicies', 'totalPremium', 'totalCoverage'],
  },
  'warranty-expiry': {
    title: 'Warranty Expiry Report', filters: ['expiringDays', 'categoryId', 'location'],
    summaryKeys: ['totalExpiring'],
  },
  'audits': {
    title: 'Asset Audit Report', filters: ['auditStatus', 'verifiedLocation', 'fromDate', 'toDate'],
    summaryKeys: ['totalAudits', 'verified', 'missing'],
  },
  'ledger': {
    title: 'Fixed Asset Ledger', filters: ['assetId', 'categoryId', 'status'],
    summaryKeys: ['totalEntries', 'totalDebit', 'totalCredit'],
  },
};

const SUMMARY_LABELS = {
  totalAssets: 'Total Assets', totalCost: 'Total Cost', totalAccumDepr: 'Accum. Depreciation', totalBookValue: 'Book Value',
  totalEntries: 'Total Entries', totalDepreciation: 'Total Depreciation', totalTransfers: 'Total Transfers',
  totalDisposals: 'Total Disposals', totalGain: 'Total Gain', totalLoss: 'Total Loss', totalSaleAmount: 'Sale Amount',
  totalRevaluations: 'Total Revaluations', totalIncrease: 'Total Increase', totalDecrease: 'Total Decrease',
  totalRecords: 'Total Records', totalPremium: 'Total Premium', totalCoverage: 'Total Coverage', totalPolicies: 'Policies',
  totalExpiring: 'Expiring Soon', verified: 'Verified', missing: 'Missing',
  totalDebit: 'Total Debit', totalCredit: 'Total Credit', preventive: 'Preventive', corrective: 'Corrective',
};

const DEPR_METHODS = ['straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'];
const DISPOSAL_TYPES = ['sale', 'scrap', 'donation', 'write_off', 'lost'];
const ASSET_STATUSES = ['draft', 'active', 'disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'];
const MAINT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const INS_STATUSES = ['active', 'expired', 'cancelled'];

const FixedAssetReportViewer = () => {
  const { reportName } = useParams();
  const navigate = useNavigate();
  const meta = REPORT_META[reportName] || { title: reportName, filters: [], summaryKeys: [] };
  const tableRef = useRef(null);

  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [hasRun, setHasRun] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Load categories/assets for filter dropdowns
  const [categories, setCategories] = useState([]);
  const [assetList, setAssetList] = useState([]);

  useEffect(() => {
    // Load reference data for dropdowns
    const loadRefs = async () => {
      try {
        const axios = (await import('../services/axiosInstance')).default;
        const [catRes, assetRes] = await Promise.all([
          axios.get('/asset-categories/active'),
          axios.get('/assets/active'),
        ]);
        setCategories(catRes.data?.data || []);
        setAssetList(assetRes.data?.data || []);
      } catch (e) { /* silent fail for dropdowns */ }
    };
    loadRefs();
  }, []);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasRun(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => { if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]; });
      const response = await fixedAssetReportApi.execute(reportName, params);
      const reportData = response.data || {};
      setData(reportData.rows || []);
      setSummary(reportData.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate report');
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [reportName, filters]);

  const handleReset = () => {
    setFilters({});
    setHasRun(false);
    setData([]);
    setSummary(null);
    setError(null);
    setPage(0);
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const rows = data.map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('');
    const summaryHtml = summary ? Object.keys(summary).map((k) => `<div><strong>${SUMMARY_LABELS[k] || k}:</strong> ${typeof summary[k] === 'number' ? summary[k].toLocaleString() : summary[k]}</div>`).join('') : '';
    printWindow.document.write(`
      <html><head><title>${meta.title}</title>
      <style>body { font-family: Arial; padding: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; } th { background: #1976d2; color: white; } .summary { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; } .summary > div { background: #f5f5f5; padding: 8px 16px; border-radius: 4px; } h2 { color: #1976d2; } .meta { font-size: 12px; color: #666; margin-bottom: 16px; } @media print { @page { size: landscape; } }</style>
      </head><body>
      <h2>${meta.title}</h2>
      <div class="meta">Generated: ${new Date().toLocaleString()} | Filters: ${JSON.stringify(filters)}</div>
      ${summaryHtml ? `<div class="summary">${summaryHtml}</div>` : ''}
      <table><thead><tr>${headers.map((h) => `<th>${h.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
      <script>window.print(); window.close();</script>
      </body></html>`);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    try {
      const XLSX = require('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, meta.title.substring(0, 31));
      XLSX.writeFile(wb, `${reportName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      apiSuccess('Excel exported successfully');
    } catch (e) { apiError('Excel export failed'); }
  };

  const handleExportCsv = () => {
    try {
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const csvRows = [headers.join(','), ...data.map((r) => headers.map((h) => {
        const v = r[h]; const s = String(v ?? ''); return s.includes(',') ? `"${s}"` : s;
      }).join(','))];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${reportName}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      apiSuccess('CSV exported successfully');
    } catch (e) { apiError('CSV export failed'); }
  };

  const handleExportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(14); doc.text(meta.title, 14, 15);
      doc.setFontSize(8); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const body = data.map((r) => headers.map((h) => { const v = r[h]; return typeof v === 'number' ? v.toFixed(2) : (v ?? ''); }));
      autoTable(doc, { startY: 28, head: [headers], body, styles: { fontSize: 6 }, headStyles: { fillColor: [25, 118, 210] } });
      doc.save(`${reportName}_${new Date().toISOString().split('T')[0]}.pdf`);
      apiSuccess('PDF exported successfully');
    } catch (e) { apiError('PDF export failed'); }
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const renderFilter = (filterKey) => {
    const label = filterKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    const value = filters[filterKey] || '';

    if (filterKey === 'categoryId') return (
      <TextField key={filterKey} select fullWidth size="small" label="Asset Category" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)}>
        <MenuItem value=""><em>All</em></MenuItem>
        {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.categoryCode} - {c.categoryName}</MenuItem>)}
      </TextField>
    );
    if (filterKey === 'assetId') return (
      <TextField key={filterKey} select fullWidth size="small" label="Asset" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)}>
        <MenuItem value=""><em>All</em></MenuItem>
        {assetList.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName}</MenuItem>)}
      </TextField>
    );
    if (filterKey === 'status') return (
      <TextField key={filterKey} select fullWidth size="small" label="Asset Status" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)}>
        <MenuItem value=""><em>All</em></MenuItem>
        {ASSET_STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</MenuItem>)}
      </TextField>
    );
    if (filterKey === 'disposalType') return (
      <TextField key={filterKey} select fullWidth size="small" label="Disposal Method" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)}>
        <MenuItem value=""><em>All</em></MenuItem>
        {DISPOSAL_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</MenuItem>)}
      </TextField>
    );
    if (filterKey === 'depreciationMethod') return (
      <TextField key={filterKey} select fullWidth size="small" label="Depreciation Method" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)}>
        <MenuItem value=""><em>All</em></MenuItem>
        {DEPR_METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</MenuItem>)}
      </TextField>
    );
    if (filterKey === 'auditStatus') return (
      <TextField key={filterKey} select fullWidth size="small" label="Audit Status" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)}>
        <MenuItem value=""><em>All</em></MenuItem>
        <MenuItem value="verified">Verified</MenuItem>
        <MenuItem value="missing">Missing</MenuItem>
      </TextField>
    );
    if (filterKey === 'expiringDays') return (
      <TextField key={filterKey} fullWidth size="small" label="Expiring Within (Days)" type="number" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)} inputProps={{ min: 1 }} />
    );
    if (filterKey === 'fromDate' || filterKey === 'toDate' || filterKey === 'purchaseDateFrom' || filterKey === 'purchaseDateTo') {
      const lbl = filterKey === 'fromDate' || filterKey === 'purchaseDateFrom' ? 'From Date' : 'To Date';
      return <TextField key={filterKey} fullWidth size="small" label={lbl} type="date" value={value} onChange={(e) => updateFilter(filterKey, e.target.value)} InputLabelProps={{ shrink: true }} />;
    }
    if (filterKey === 'serviceProvider' || filterKey === 'insuranceCompany' || filterKey === 'verifiedLocation' || filterKey === 'location' || filterKey === 'department' || filterKey === 'custodian' || filterKey === 'fromLocation' || filterKey === 'toLocation') {
      return <TextField key={filterKey} fullWidth size="small" label={label} value={value} onChange={(e) => updateFilter(filterKey, e.target.value)} />;
    }
    return <TextField key={filterKey} fullWidth size="small" label={label} value={value} onChange={(e) => updateFilter(filterKey, e.target.value)} />;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/app/fixed-assets/reports')}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>{meta.title}</Typography>
        </Box>
      </Box>

      {/* Filter Panel */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Filters</Typography>
        <Grid container spacing={2}>
          {meta.filters.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f}>
              {renderFilter(f)}
            </Grid>
          ))}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<SearchIcon />} onClick={generateReport} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Generate Report'}
              </Button>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset}>Reset Filters</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      {summary && Object.keys(summary).length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {Object.entries(summary).map(([key, val]) => (
            <Grid item xs={6} sm={4} md={2} key={key}>
              <Card variant="outlined" sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val}
                </Typography>
                <Typography variant="caption" color="text.secondary">{SUMMARY_LABELS[key] || key}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Toolbar */}
      {hasRun && !loading && (
        <Paper sx={{ p: 1, mb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={data.length === 0}>Print</Button>
            <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPdf} disabled={data.length === 0}>PDF</Button>
            <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportExcel} disabled={data.length === 0}>Excel</Button>
            <Button size="small" variant="outlined" startIcon={<CsvIcon />} onClick={handleExportCsv} disabled={data.length === 0}>CSV</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {data.length} record(s)
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* Loading */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}

      {/* Report Data */}
      {hasRun && !loading && (
        <TableContainer component={Paper} ref={tableRef}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col} sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {col.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={columns.length || 1} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No records found.</Typography></TableCell></TableRow>
              ) : paginatedData.map((row, i) => (
                <TableRow key={i} hover>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ fontSize: '0.75rem' }}>
                      {typeof row[col] === 'number' ? row[col].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row[col] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={data.length}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100, 500]}
          />
        </TableContainer>
      )}

      {/* No report generated yet */}
      {!hasRun && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>Select Filters & Generate Report</Typography>
          <Typography variant="body2" color="text.secondary">Choose filter criteria above and click "Generate Report" to view data.</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FixedAssetReportViewer;
