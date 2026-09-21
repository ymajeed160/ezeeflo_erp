import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, Alert, Tooltip, IconButton, Stack, Chip,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon, Print as PrintIcon,
  FileDownload as ExcelIcon, PictureAsPdf as PdfIcon, ArrowBack as BackIcon,
} from '@mui/icons-material';
import reportApi from '../../services/reportApi';
import { apiError } from '../../utils/toast';

const reportMeta = {
  'general-ledger': { title: 'General Ledger', summaryKeys: ['openingBalance','totalDebit','totalCredit','closingBalance'] },
  'accounts-receivable': { title: 'Accounts Receivable', summaryKeys: ['totalOutstanding','totalCustomers','totalInvoices'] },
  'accounts-payable': { title: 'Accounts Payable', summaryKeys: ['totalOutstanding','totalSuppliers','totalInvoices'] },
  'sales-analytics': { title: 'Sales Analytics', summaryKeys: ['totalGross','totalNet','totalTax','totalInvoices','totalQuantity'] },
  'purchase-analytics': { title: 'Purchase Analytics', summaryKeys: ['totalGross','totalNet','totalTax','totalInvoices','totalQuantity'] },
  'stock-summary': { title: 'Stock Summary', summaryKeys: [] },
  'trial-balance': { title: 'Trial Balance', summaryKeys: [] },
  'profit-and-loss': { title: 'Profit & Loss', summaryKeys: ['total_revenue','total_expense','net_profit'] },
  'balance-sheet': { title: 'Balance Sheet', summaryKeys: [] },
};

const summaryLabels = {
  openingBalance: 'Opening Balance', totalDebit: 'Total Debit', totalCredit: 'Total Credit',
  closingBalance: 'Closing Balance', totalOutstanding: 'Total Outstanding',
  totalCustomers: 'Customers', totalSuppliers: 'Suppliers', totalInvoices: 'Invoices',
  totalGross: 'Gross Total', totalNet: 'Net Total', totalTax: 'Total Tax',
  totalQuantity: 'Total Qty',
  total_revenue: 'Total Revenue', total_expense: 'Total Expense', net_profit: 'Net Profit',
};

const ReportViewer = ({ reportName: propReportName }) => {
  const { reportName: paramReportName } = useParams();
  const reportName = propReportName || paramReportName;
  const navigate = useNavigate();
  const meta = reportMeta[reportName] || { title: reportName, summaryKeys: [] };

  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState({});
  const [dateError, setDateError] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, page: page + 1, pageSize: rowsPerPage };
      Object.keys(params).forEach((k) => { if (!params[k] && params[k] !== 0) delete params[k]; });
      const { data: res } = await reportApi.execute(reportName, params);
      setData(res.data || []);
      setSummary(res.summary);
      setPagination(res.pagination || { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [reportName, filters, page, rowsPerPage]);

  const handleSearch = () => {
    if (!filters.dateFrom || !filters.dateTo) {
      setDateError('Both Date From and Date To are required');
      return;
    }
    if (filters.dateFrom > filters.dateTo) {
      setDateError('Date From cannot be after Date To');
      return;
    }
    setDateError('');
    setHasRun(true);
    setPage(0);
    loadReport();
  };

  const handleReset = () => { setFilters({}); setDateError(''); setHasRun(false); setPage(0); setData([]); setSummary(null); };

  const updateFilter = (field, value) => {
    setDateError('');
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => window.print();
  const handleExportExcel = () => {
    try {
      const XLSX = require('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, meta.title);
      XLSX.writeFile(wb, `${reportName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { apiError('Excel export failed'); }
  };

  const handleExportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.text(meta.title, 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const body = data.map((r) => headers.map((h) => {
        const v = r[h];
        return typeof v === 'number' ? v.toFixed(2) : (v ?? '');
      }));
      autoTable(doc, { startY: 28, head: [headers], body, styles: { fontSize: 7 }, headStyles: { fillColor: [25, 118, 210] } });
      doc.save(`${reportName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) { apiError('PDF export failed'); }
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/app/reports')}><BackIcon /></IconButton>
        <Typography variant="h4" fontWeight={700}>{meta.title}</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {dateError && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setDateError('')}>{dateError}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" type="date" label="Date From *" required
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: filters.dateTo || undefined }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" type="date" label="Date To *" required
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: filters.dateFrom || undefined }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" onClick={handleSearch}
                disabled={!filters.dateFrom || !filters.dateTo || filters.dateFrom > filters.dateTo}
                startIcon={<SearchIcon />}>Run Report</Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={handleReset} startIcon={<RefreshIcon />}>Reset</Button>
                <Button size="small" color="info" onClick={handlePrint} startIcon={<PrintIcon />}>Print</Button>
                <Button size="small" color="success" onClick={handleExportExcel} startIcon={<ExcelIcon />}>Excel</Button>
                <Button size="small" color="error" onClick={handleExportPdf} startIcon={<PdfIcon />}>PDF</Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {Object.entries(summary).filter(([k]) => meta.summaryKeys.includes(k)).map(([key, val]) => (
            <Grid item xs={6} sm={3} key={key}>
              <Card>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{summaryLabels[key] || key}</Typography>
                  <Typography variant="h6" fontWeight={700}>{typeof val === 'number' ? val.toFixed(2) : (val ?? '-')}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!hasRun && !loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            Select a date range and click <strong>Run Report</strong> to view data.
          </Typography>
        </Box>
      )}

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {hasRun && !loading && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col} align={typeof data[0]?.[col] === 'number' ? 'right' : 'left'}>
                    <strong>{col.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={columns.length || 1} align="center" sx={{ py: 4 }}>No data found.</TableCell></TableRow>
              ) : (
                data.map((row, i) => (
                  <TableRow key={i} hover>
                    {columns.map((col) => (
                      <TableCell key={col} align={typeof row[col] === 'number' ? 'right' : 'left'}>
                        {typeof row[col] === 'number' ? row[col].toFixed(2) : (row[col] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div" count={pagination.totalRecords || 0} page={page}
            onPageChange={(e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default ReportViewer;
