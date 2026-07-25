import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, Alert, Tooltip, IconButton, Stack,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon, Print as PrintIcon,
  FileDownload as ExcelIcon, PictureAsPdf as PdfIcon, ArrowBack as BackIcon,
} from '@mui/icons-material';
import { fetchGeneralLedgerReport, clearGLReport } from '../../store/slices/reportSlice';
import { fetchAccounts } from '../../store/slices/accountSlice';
import { apiError } from '../../utils/toast';

const GeneralLedgerReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { glData, glSummary, glPagination, glLoading, glError } = useSelector((s) => s.reports);
  const accountsList = useSelector((s) => s.accounts?.items || []);

  const [filters, setFilters] = useState({
    accountId: '',
    dateFrom: '',
    dateTo: '',
    journalNumber: '',
    referenceNumber: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    dispatch(fetchAccounts({ limit: 999 }));
  }, [dispatch]);

  const loadReport = useCallback(() => {
    const params = {
      page: page + 1,
      pageSize: rowsPerPage,
    };
    if (filters.accountId) params.accountId = filters.accountId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.journalNumber) params.journalNumber = filters.journalNumber;
    if (filters.referenceNumber) params.referenceNumber = filters.referenceNumber;
    dispatch(fetchGeneralLedgerReport(params));
  }, [dispatch, page, rowsPerPage, filters]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const handleSearch = () => { setPage(0); loadReport(); };
  const handleReset = () => {
    setFilters({ accountId: '', dateFrom: '', dateTo: '', journalNumber: '', referenceNumber: '' });
    setPage(0);
    dispatch(clearGLReport());
  };

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    try {
      const XLSX = require('xlsx');
      const ws = XLSX.utils.json_to_sheet(
        (glData || []).map((r) => ({
          Date: r.transactionDate,
          'Journal #': r.journalNumber,
          Reference: r.referenceNumber,
          Description: r.description,
          Debit: r.debit,
          Credit: r.credit,
          'Running Balance': r.runningBalance,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'General Ledger');
      XLSX.writeFile(wb, `General_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      apiError('Excel export failed');
    }
  };

  const handleExportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.text('General Ledger Report', 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
      if (filters.dateFrom) doc.text(`Period: ${filters.dateFrom} to ${filters.dateTo || 'Present'}`, 14, 28);
      autoTable(doc, {
        startY: 32,
        head: [['Date', 'Journal #', 'Reference', 'Description', 'Debit', 'Credit', 'Running Balance']],
        body: (glData || []).map((r) => [
          r.transactionDate, r.journalNumber, r.referenceNumber, r.description,
          r.debit?.toFixed(2), r.credit?.toFixed(2), r.runningBalance?.toFixed(2),
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [25, 118, 210] },
      });
      doc.save(`General_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      apiError('PDF export failed');
    }
  };

  const formatNum = (val) => parseFloat(val || 0).toFixed(2);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/app/reports')}><BackIcon /></IconButton>
        <Typography variant="h4" fontWeight={700}>General Ledger</Typography>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Account"
                value={filters.accountId} onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}>
                <MenuItem value="">All Accounts</MenuItem>
                {accountsList.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.code} - {a.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" type="date" label="Date From"
                value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" type="date" label="Date To"
                value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="Journal #" value={filters.journalNumber}
                onChange={(e) => setFilters({ ...filters, journalNumber: e.target.value })} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="Reference" value={filters.referenceNumber}
                onChange={(e) => setFilters({ ...filters, referenceNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button variant="contained" size="small" onClick={handleSearch} startIcon={<SearchIcon />}>Run</Button>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" variant="outlined" onClick={handleReset} startIcon={<RefreshIcon />}>Reset</Button>
            <Button size="small" color="info" onClick={handlePrint} startIcon={<PrintIcon />}>Print</Button>
            <Button size="small" color="success" onClick={handleExportExcel} startIcon={<ExcelIcon />}>Excel</Button>
            <Button size="small" color="error" onClick={handleExportPdf} startIcon={<PdfIcon />}>PDF</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {glSummary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Opening Balance</Typography>
                <Typography variant="h6" fontWeight={700}>{formatNum(glSummary.openingBalance)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#e8f5e9' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Total Debit</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">{formatNum(glSummary.totalDebit)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#fce4ec' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Total Credit</Typography>
                <Typography variant="h6" fontWeight={700} color="error.main">{formatNum(glSummary.totalCredit)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#f3e5f5' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Closing Balance</Typography>
                <Typography variant="h6" fontWeight={700} color="secondary.main">{formatNum(glSummary.closingBalance)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error */}
      {glError && <Alert severity="error" sx={{ mb: 2 }}>{glError}</Alert>}

      {/* Loading */}
      {glLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {/* Table */}
      {!glLoading && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Journal #</strong></TableCell>
                <TableCell><strong>Reference</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="right"><strong>Debit</strong></TableCell>
                <TableCell align="right"><strong>Credit</strong></TableCell>
                <TableCell align="right"><strong>Running Balance</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {glData.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No data found for the selected filters.</TableCell></TableRow>
              ) : (
                glData.map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{row.transactionDate}</TableCell>
                    <TableCell>{row.journalNumber}</TableCell>
                    <TableCell>{row.referenceNumber}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell align="right">{row.debit > 0 ? row.debit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right">{row.credit > 0 ? row.credit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right">{row.runningBalance?.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div" count={glPagination.totalRecords || 0} page={page}
            onPageChange={(e, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default GeneralLedgerReport;
