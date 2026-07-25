import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  TablePagination,
  Stack,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Autocomplete,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  fetchGeneralLedger,
  fetchLedgerAccounts,
  exportLedger,
  setFilters,
  resetFilters,
  setPage,
  setLimit,
  clearLedgerData,
  clearExportData,
} from '../store/slices/generalLedgerSlice';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);

// Account type options for dropdown
const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
];

// Format currency with 2 decimal places
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const GeneralLedger = () => {
  const dispatch = useDispatch();
  const printRef = useRef();

  // Redux state
  const {
    ledger: { openingBalance, totalDebit, totalCredit, closingBalance, transactions },
    accounts,
    loading,
    accountsLoading,
    exportLoading,
    exportData,
    error,
    pagination: { page, limit, total, totalPages },
    filters,
  } = useSelector((state) => state.generalLedger || {});

  // Local filter state for form controls (synced with Redux)
  const [accountInput, setAccountInput] = useState('');
  const [localAccountId, setLocalAccountId] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [accountType, setAccountType] = useState('');
  const [journalNumber, setJournalNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Load accounts on mount
  useEffect(() => {
    dispatch(fetchLedgerAccounts());
  }, [dispatch]);

  // Auto-load ledger data on mount (only once)
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (!hasAutoLoaded.current && !loading && accounts.length > 0) {
      hasAutoLoaded.current = true;
      const params = { page: 1, limit };
      dispatch(setFilters(params));
      dispatch(fetchGeneralLedger(params));
    }
  }, [dispatch, accounts.length, loading, limit]);

  // Reset form when Redux filters change
  useEffect(() => {
    if (!filters.accountId) setLocalAccountId(null);
    if (!filters.dateFrom) setDateFrom('');
    if (!filters.dateTo) setDateTo('');
    if (!filters.accountType) setAccountType('');
    if (!filters.journalNumber) setJournalNumber('');
    if (!filters.referenceNumber) setReferenceNumber('');
  }, [filters]);

  // Handle search
  const handleSearch = () => {
    const params = {
      accountId: localAccountId?.id || '',
      dateFrom,
      dateTo,
      accountType,
      journalNumber,
      referenceNumber,
      page: 1,
      limit,
    };
    dispatch(setFilters(params));
    dispatch(fetchGeneralLedger(params));
  };

  // Handle reset
  const handleReset = () => {
    setLocalAccountId(null);
    setAccountInput('');
    setDateFrom('');
    setDateTo('');
    setAccountType('');
    setJournalNumber('');
    setReferenceNumber('');
    dispatch(resetFilters());
    dispatch(clearLedgerData());
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    // Pages are 1-indexed in our API
    const nextPage = newPage + 1;
    dispatch(setPage(nextPage));
    const params = {
      ...filters,
      page: nextPage,
      limit,
    };
    dispatch(fetchGeneralLedger(params));
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    dispatch(setLimit(newLimit));
    const params = {
      ...filters,
      page: 1,
      limit: newLimit,
    };
    dispatch(fetchGeneralLedger(params));
  };

  // Handle export to Excel
  const handleExportExcel = useCallback(async () => {
    const params = {
      accountId: localAccountId?.id || '',
      dateFrom,
      dateTo,
      accountType,
      journalNumber,
      referenceNumber,
    };
    dispatch(exportLedger(params));
  }, [dispatch, localAccountId, dateFrom, dateTo, accountType, journalNumber, referenceNumber]);

  // Watch for export data and generate Excel
  useEffect(() => {
    if (exportData && exportData.transactions) {
      const { openingBalance: ob, totalDebit: td, totalCredit: tc, closingBalance: cb, transactions: txs } = exportData;

      const wsData = [
        ['General Ledger Report'],
        [],
        ['Opening Balance:', '', '', '', '', formatCurrency(ob)],
        [],
        ['Date', 'Journal #', 'Reference #', 'Description', 'Debit', 'Credit', 'Running Balance'],
      ];

      let runningBalance = ob;

      if (txs.length === 0) {
        wsData.push(['No transactions found', '', '', '', '', '', '']);
      } else {
        txs.forEach((tx) => {
          if (tx.isOpeningBalance) {
            wsData.push([
              formatDate(tx.transactionDate),
              '',
              '',
              'Opening Balance',
              '',
              '',
              formatCurrency(tx.runningBalance),
            ]);
            runningBalance = tx.runningBalance;
          } else {
            const debit = Number(tx.debit) || 0;
            const credit = Number(tx.credit) || 0;
            runningBalance = Number(tx.runningBalance);
            wsData.push([
              formatDate(tx.transactionDate),
              tx.journalNumber || '',
              tx.referenceNumber || '',
              tx.description || '',
              debit > 0 ? formatCurrency(debit) : '',
              credit > 0 ? formatCurrency(credit) : '',
              formatCurrency(runningBalance),
            ]);
          }
        });
      }

      wsData.push([]);
      wsData.push(['Totals:', '', '', '', formatCurrency(td), formatCurrency(tc), '']);
      wsData.push(['Closing Balance:', '', '', '', '', formatCurrency(cb)]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Column widths
      ws['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 },
        { wch: 18 }, { wch: 18 }, { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'General Ledger');
      XLSX.writeFile(wb, `GeneralLedger_${new Date().toISOString().split('T')[0]}.xlsx`);

      dispatch(clearExportData());
    }
  }, [exportData, dispatch]);

  // Handle export to PDF
  const handleExportPdf = useCallback(async () => {
    const params = {
      accountId: localAccountId?.id || '',
      dateFrom,
      dateTo,
      accountType,
      journalNumber,
      referenceNumber,
    };
    const result = await dispatch(exportLedger(params)).unwrap();
    if (result?.data) {
      const { openingBalance: ob, totalDebit: td, totalCredit: tc, closingBalance: cb, transactions: txs } = result.data;

      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text('General Ledger Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Opening Balance: ${formatCurrency(ob)}`, 14, 29);

      const tableColumn = ['Date', 'Journal #', 'Reference #', 'Description', 'Debit', 'Credit', 'Balance'];
      const tableRows = [];

      let runningBalance = ob;
      txs.forEach((tx) => {
        if (tx.isOpeningBalance) {
          tableRows.push([
            formatDate(tx.transactionDate), '-', '-', 'Opening Balance', '', '', formatCurrency(tx.runningBalance),
          ]);
          runningBalance = tx.runningBalance;
        } else {
          const debit = Number(tx.debit) || 0;
          const credit = Number(tx.credit) || 0;
          runningBalance = Number(tx.runningBalance);
          tableRows.push([
            formatDate(tx.transactionDate),
            tx.journalNumber || '',
            tx.referenceNumber || '',
            tx.description || '',
            debit > 0 ? formatCurrency(debit) : '',
            credit > 0 ? formatCurrency(credit) : '',
            formatCurrency(runningBalance),
          ]);
        }
      });

      // Summary rows
      tableRows.push(['', '', '', 'Totals', formatCurrency(td), formatCurrency(tc), '']);
      tableRows.push(['', '', '', 'Closing Balance', '', '', formatCurrency(cb)]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 33,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 22 },
          2: { cellWidth: 22 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 28 },
          5: { cellWidth: 28 },
          6: { cellWidth: 28 },
        },
      });

      doc.save(`GeneralLedger_${new Date().toISOString().split('T')[0]}.pdf`);
      dispatch(clearExportData());
    }
  }, [dispatch, localAccountId, dateFrom, dateTo, accountType, journalNumber, referenceNumber]);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          General Ledger
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Print Ledger">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to Excel">
            <IconButton onClick={handleExportExcel} color="success" disabled={exportLoading}>
              <ExcelIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to PDF">
            <IconButton onClick={handleExportPdf} color="error" disabled={exportLoading}>
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearLedgerData())}>
          {error}
        </Alert>
      )}

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          {/* Row 1: Account, Dates, Type, Buttons */}
          {/* Account Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              value={localAccountId}
              onChange={(event, newValue) => setLocalAccountId(newValue)}
              inputValue={accountInput}
              onInputChange={(event, newInputValue) => setAccountInput(newInputValue)}
              options={accounts || []}
              getOptionLabel={(option) =>
                `${option.code || ''} - ${option.name || ''}`}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              loading={accountsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Account"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {accountsLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const indent = option.hierarchyLevel ? option.hierarchyLevel * 20 : 0;
                return (
                  <Box component="li" {...props} key={option.id} sx={{ pl: 2 + indent / 8 }}>
                    <Typography variant="body2">
                      {option.hierarchyLevel > 0 && '— '.repeat(Math.min(option.hierarchyLevel, 4))}
                      {option.code} - {option.name}
                    </Typography>
                    {option.isParent && (
                      <Chip label="Parent" size="small" color="info" sx={{ ml: 1 }} />
                    )}
                  </Box>
                );
              }}
            />
          </Grid>

          {/* Date From */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Date From"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Date To */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Date To"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Account Type */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              label="Account Type"
              size="small"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {ACCOUNT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Search">
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  size="medium"
                  startIcon={<SearchIcon />}
                  sx={{ minWidth: 120 }}
                >
                  Search
                </Button>
              </Tooltip>
              <Tooltip title="Reset">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleReset}
                  size="medium"
                  startIcon={<ClearIcon />}
                >
                  Reset
                </Button>
              </Tooltip>
            </Stack>
          </Grid>

          {/* Row 2: Journal Number, Reference Number */}
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              label="Journal Number"
              size="small"
              value={journalNumber}
              onChange={(e) => setJournalNumber(e.target.value)}
              placeholder="e.g. JV-2024-001"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              label="Reference Number"
              size="small"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. INV-001"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Opening Balance
              </Typography>
              <Typography variant="h5">
                {formatCurrency(openingBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Total Debit
              </Typography>
              <Typography variant="h5">
                {formatCurrency(totalDebit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Total Credit
              </Typography>
              <Typography variant="h5">
                {formatCurrency(totalCredit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Closing Balance
              </Typography>
              <Typography variant="h5">
                {formatCurrency(closingBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ledger Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 520px)' }}>
          <Table stickyHeader size="small" id="ledger-table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 130 }}>Journal Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 130 }}>Reference Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 250 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 140 }} align="right">Debit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 140 }} align="right">Credit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 140 }} align="right">Running Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading ledger data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Opening Balance Row */}
                  <TableRow sx={{ bgcolor: 'action.hover', '& td': { fontWeight: 'bold' } }}>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>Opening Balance</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">{formatCurrency(openingBalance)}</TableCell>
                  </TableRow>

                  {/* Transaction Rows */}
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                      <TableRow
                        key={tx.id || index}
                        hover
                        sx={tx.isOpeningBalance ? { bgcolor: '#f5f5f5' } : {}}
                      >
                        <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                        <TableCell>{tx.journalNumber || '-'}</TableCell>
                        <TableCell>{tx.referenceNumber || '-'}</TableCell>
                        <TableCell>
                          {tx.description || tx.memo || '-'}
                          {tx.isOpeningBalance && (
                            <Chip label="OB" size="small" color="secondary" sx={{ ml: 1 }} variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {Number(tx.debit) > 0 ? formatCurrency(tx.debit) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {Number(tx.credit) > 0 ? formatCurrency(tx.credit) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                          {formatCurrency(tx.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No transactions found. Please apply filters and click Search.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Totals Row */}
                  {transactions && transactions.length > 0 && (
                    <TableRow sx={{ bgcolor: 'action.hover', '& td': { fontWeight: 'bold' } }}>
                      <TableCell colSpan={4}>Totals</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(totalCredit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(closingBalance)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total || 0}
          page={(page || 1) - 1}
          onPageChange={handlePageChange}
          rowsPerPage={limit || 50}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Paper>

      {/* Print-specific styles */}
      <style jsx="true">{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ledger-table, #ledger-table * {
            visibility: visible;
          }
          #ledger-table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Box>
  );
};

export default GeneralLedger;