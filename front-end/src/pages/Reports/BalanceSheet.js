import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Alert, Stack, IconButton, Divider, Chip,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon, Print as PrintIcon,
  FileDownload as ExcelIcon, PictureAsPdf as PdfIcon, ArrowBack as BackIcon,
  AccountBalance as AssetIcon,
} from '@mui/icons-material';
import reportApi from '../../services/reportApi';
import { apiError } from '../../utils/toast';

const SECTION_LABELS = {
  CURRENT_ASSETS: 'Current Assets',
  NON_CURRENT_ASSETS: 'Non-Current Assets',
  CURRENT_LIABILITIES: 'Current Liabilities',
  NON_CURRENT_LIABILITIES: 'Non-Current Liabilities',
  EQUITY: 'Equity',
};

const BalanceSheet = () => {
  const navigate = useNavigate();
  const activeCompany = useSelector((state) => state.company?.activeCompany);
  const companyName = activeCompany?.name || '';

  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [liabilitiesEquity, setLiabilitiesEquity] = useState([]);
  const [hasRun, setHasRun] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { asOfDate };
      const { data: res } = await reportApi.execute('balance-sheet', params);
      setSummary(res.summary);
      setAssets(res.assets || []);
      setLiabilitiesEquity(res.liabilitiesEquity || []);
      setHasRun(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Balance Sheet');
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  const handleSearch = () => { setHasRun(true); loadReport(); };
  const handleReset = () => { setAsOfDate(new Date().toISOString().split('T')[0]); setHasRun(false); setSummary(null); setAssets([]); setLiabilitiesEquity([]); };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Group data by section_group
  const groupBySection = (data) => {
    const groups = {};
    for (const row of data) {
      const grp = row.section_group;
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(row);
    }
    return groups;
  };

  const assetGroups = groupBySection(assets);
  const leGroups = groupBySection(liabilitiesEquity);

  const handlePrint = () => window.print();
  const handleExportExcel = () => {
    try {
      const XLSX = require('xlsx');
      const rows = [
        ['BALANCE SHEET', '', '', ''],
        [`As of: ${asOfDate}`, '', '', ''],
        ['', '', '', ''],
        ['ASSETS', '', 'LIABILITIES & EQUITY', ''],
        ['', '', '', ''],
      ];
      const maxLen = Math.max(assets.length, liabilitiesEquity.length);
      for (let i = 0; i < maxLen; i++) {
        const a = assets[i];
        const l = liabilitiesEquity[i];
        rows.push([
          a ? `${a.account_code} ${a.account_name}` : '',
          a ? formatCurrency(a.balance) : '',
          l ? `${l.account_code} ${l.account_name}` : '',
          l ? formatCurrency(l.balance) : '',
        ]);
      }
      if (summary) {
        rows.push(['', '', '', '']);
        rows.push(['TOTAL ASSETS', formatCurrency(summary.total_assets), 'TOTAL LIAB. + EQUITY', formatCurrency(summary.total_liabilities_equity)]);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
      XLSX.writeFile(wb, `balance_sheet_${asOfDate}.xlsx`);
    } catch (e) { apiError('Excel export failed'); }
  };

  const handleExportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(14);
      doc.text('BALANCE SHEET', 148, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(companyName ? `Company: ${companyName}` : '', 14, 25);
      doc.text(`As of: ${asOfDate}`, 14, 31);

      const leftBody = assets.map((r) => [`${r.account_code} ${r.account_name}`, formatCurrency(r.balance)]);
      const rightBody = liabilitiesEquity.map((r) => [`${r.account_code} ${r.account_name}`, formatCurrency(r.balance)]);

      autoTable(doc, { startY: 38, head: [['ASSETS', 'Balance']], body: leftBody, styles: { fontSize: 7 }, headStyles: { fillColor: [25, 118, 210] }, margin: { left: 10 } });
      autoTable(doc, { startY: 38, head: [['LIABILITIES & EQUITY', 'Balance']], body: rightBody, styles: { fontSize: 7 }, headStyles: { fillColor: [25, 118, 210] }, margin: { left: 160 } });

      doc.save(`balance_sheet_${asOfDate}.pdf`);
    } catch (e) { apiError('PDF export failed'); }
  };

  const renderSection = (groups, side) => {
    if (!groups || Object.keys(groups).length === 0) return null;
    const order = side === 'assets'
      ? ['CURRENT_ASSETS', 'NON_CURRENT_ASSETS']
      : ['CURRENT_LIABILITIES', 'NON_CURRENT_LIABILITIES', 'EQUITY'];

    return order.map((grpKey) => {
      const items = groups[grpKey];
      if (!items || items.length === 0) return null;
      // Filter out parent rows and zero-balance accounts, show only leaf accounts with values
      const leafItems = items.filter((r) => !r.is_parent && Number(r.balance) !== 0);
      // Hide section if no non-zero leaf accounts
      if (leafItems.length === 0) return null;
      // Sum for group total
      const groupTotal = leafItems.reduce((sum, r) => sum + (Number(r.balance) || 0), 0);

      return (
        <Box key={grpKey} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem', mb: 0.5 }}>
            {SECTION_LABELS[grpKey] || grpKey}
          </Typography>
          {leafItems.map((row, idx) => (
            <Stack key={idx} direction="row" justifyContent="space-between" sx={{ py: 0.3, pl: 1, borderBottom: '1px solid #f0f0f0' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                <Box component="span" sx={{ color: 'text.secondary', mr: 1, fontFamily: 'monospace' }}>{row.account_code}</Box>
                {row.account_name}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {formatCurrency(row.balance)}
              </Typography>
            </Stack>
          ))}
          <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5, pl: 1, borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
              Total {SECTION_LABELS[grpKey] || grpKey}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {formatCurrency(groupTotal)}
            </Typography>
          </Stack>
        </Box>
      );
    });
  };

  return (
    <Box className="balance-sheet-report">
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/app/reports')}><BackIcon /></IconButton>
        <Typography variant="h4" fontWeight={700}>Balance Sheet</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" type="date" label="As Of Date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>
                Run Report
              </Button>
            </Grid>
            <Grid item xs={12} md={8}>
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

      {!hasRun && !loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            Select an <strong>As Of Date</strong> and click <strong>Run Report</strong> to view the Balance Sheet.
          </Typography>
        </Box>
      )}

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {hasRun && !loading && (
        <>
          {/* Summary Cards */}
          {summary && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={2}>
                <Card><CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Total Assets</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">{formatCurrency(summary.total_assets)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card><CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Total Liabilities</Typography>
                  <Typography variant="h6" fontWeight={700} color="warning.main">{formatCurrency(summary.total_liabilities)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card><CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Total Equity</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">{formatCurrency(summary.total_equity)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card><CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Net Profit/Loss</Typography>
                  <Typography variant="h6" fontWeight={700} color={summary.net_profit_loss >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(summary.net_profit_loss)}
                  </Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card><CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Liab. + Equity</Typography>
                  <Typography variant="h6" fontWeight={700} color="secondary.main">{formatCurrency(summary.total_liabilities_equity)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card sx={{ bgcolor: summary.is_balanced ? 'success.dark' : 'error.dark' }}>
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" color="white">Balance Check</Typography>
                    <Typography variant="h6" fontWeight={700} color="white">
                      {summary.is_balanced ? '✓ Balanced' : `✗ ${formatCurrency(summary.difference)}`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Two-Column Balance Sheet */}
          <Grid container spacing={2}>
            {/* LEFT: ASSETS */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main', textAlign: 'center' }}>
                  ASSETS
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                {assets.length > 0 ? renderSection(assetGroups, 'assets') : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No asset accounts found</Typography>
                )}
                <Divider sx={{ mt: 1, mb: 1 }} />
                <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5, px: 1, bgcolor: 'primary.dark', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white' }}>TOTAL ASSETS</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
                    {formatCurrency(summary?.total_assets)}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* RIGHT: LIABILITIES & EQUITY */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'warning.main', textAlign: 'center' }}>
                  LIABILITIES & EQUITY
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                {liabilitiesEquity.length > 0 ? renderSection(leGroups, 'liabilities') : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No liability/equity accounts found</Typography>
                )}

                {/* Net Profit/Loss line within Equity */}
                {summary && summary.net_profit_loss !== 0 && (
                  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.3, pl: 1, borderBottom: '1px solid #f0f0f0', mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Current Year Profit/Loss
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace', color: summary.net_profit_loss >= 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(summary.net_profit_loss)}
                    </Typography>
                  </Stack>
                )}

                <Divider sx={{ mt: 1, mb: 1 }} />
                <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5, px: 1, bgcolor: 'warning.dark', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white' }}>TOTAL LIAB. + EQUITY</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
                    {formatCurrency(summary?.total_liabilities_equity)}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Balance Validation */}
          {summary && !summary.is_balanced && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Balance Sheet is not balanced!</strong> Difference: {formatCurrency(Math.abs(summary.difference))}.
              This may indicate missing journal entries or incorrect account setup.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default BalanceSheet;
