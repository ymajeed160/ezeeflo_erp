import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Paper, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Alert, useTheme, Divider,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, TrendingDown, Assessment,
  Refresh, AccountBalanceWallet, Money,
} from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import BIApi from '../../services/biApi';

const formatCurrency = (v) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(Number(v) || 0);

const KpiCard = ({ title, value, subtitle, icon, gradient, onClick }) => (
  <Card onClick={onClick} sx={{ borderRadius: 2.5, background: gradient, color: '#fff', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease', '&:hover': onClick ? { transform: 'translateY(-3px)', boxShadow: 6 } : {}, position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' } }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>{title}</Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>{value || '—'}</Typography>
          {subtitle && <Typography variant="caption" sx={{ opacity: 0.75, mt: 0.5, display: 'block' }}>{subtitle}</Typography>}
        </Box>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.2)' }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await BIApi.getFinancialDashboard(filters); if (res.success) setData(res.data); else setError('Failed'); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pnl = data?.pnl || {};
  const pnlData = data?.pnlData || [];
  const balanceSheet = data?.balanceSheet || {};
  const balanceSheetData = data?.balanceSheetData || [];
  const trialBalance = data?.trialBalance || [];
  const cashFlow = data?.cashFlow || [];
  const grossProfit = data?.grossProfit || {};

  // P&L uses: total_revenue, total_expense, net_profit (from summary)
  const totalRevenue = pnl?.total_revenue ?? pnl?.totalRevenue ?? 0;
  const totalExpense = pnl?.total_expense ?? pnl?.totalExpenses ?? 0;
  const netIncome = pnl?.net_profit ?? (totalRevenue - totalExpense);

  // Balance Sheet summary uses: total_debit, total_credit
  // We need to derive assets/liabilities/equity from balanceSheetData (which has type field)
  let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;
  balanceSheetData.forEach(r => {
    const closingDebit = Number(r.closing_debit || 0);
    const closingCredit = Number(r.closing_credit || 0);
    const balance = closingDebit - closingCredit;
    if (r.type === 'asset') totalAssets += Math.abs(balance);
    else if (r.type === 'liability') totalLiabilities += Math.abs(balance);
    else if (r.type === 'equity') totalEquity += Math.abs(balance);
  });
  // Fallback to summary values
  if (totalAssets === 0 && totalLiabilities === 0 && totalEquity === 0) {
    totalAssets = Number(balanceSheet?.totalAssets || balanceSheet?.total_assets || 0);
    totalLiabilities = Number(balanceSheet?.totalLiabilities || balanceSheet?.total_liabilities || 0);
    totalEquity = Number(balanceSheet?.totalEquity || balanceSheet?.total_equity || 0);
  }

  const grossProfitVal = grossProfit?.gross_profit ?? grossProfit?.totalGrossProfit ?? grossProfit?.total_gross_profit ?? 0;

  // P&L Pie
  const pnlPieData = [
    { id: 0, value: Number(totalRevenue) || 1, label: 'Revenue', color: '#43e97b' },
    { id: 1, value: Number(totalExpense) || 1, label: 'Expenses', color: '#f5576c' },
  ];

  // Balance Sheet Pie
  const bsPieData = [
    { id: 0, value: Math.abs(totalAssets) || 1, label: 'Assets', color: '#667eea' },
    { id: 1, value: Math.abs(totalLiabilities) || 1, label: 'Liabilities', color: '#f093fb' },
    { id: 2, value: Math.abs(totalEquity) || 1, label: 'Equity', color: '#43e97b' },
  ];

  // Trial balance uses: code, name, type, closing_debit, closing_credit
  const tbPieData = trialBalance.slice(0, 6).map((r, i) => ({
    id: i, value: Number(r.closing_debit || r.closing_credit || 1),
    label: r.name || r.account_name || `A${i + 1}`,
    color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#fa709a', '#fee140'][i],
  }));

  // Cash Flow uses: entry_number, entry_date, description, total_debit, total_credit
  const cfLabels = cashFlow.map(r => r.description ? r.description.substring(0, 20) : r.entry_number || '');
  const cfValues = cashFlow.map(r => Number(r.total_debit || r.total_credit || 0));

  // P&L data uses: code, name, type, revenue_amount, expense_amount
  const pnlAccountData = pnlData.map(r => ({
    name: r.name || r.account_name || '—',
    revenue: r.revenue_amount || 0,
    expense: r.expense_amount || 0,
  }));

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>💰 Financial BI Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
            style={{ padding: '6px 10px', border: `1px solid ${theme.palette.divider}`, borderRadius: 6, fontSize: '0.85rem', background: theme.palette.background.paper, color: theme.palette.text.primary }} />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters(p => ({ ...p, dateTo: e.target.value }))}
            style={{ padding: '6px 10px', border: `1px solid ${theme.palette.divider}`, borderRadius: 6, fontSize: '0.85rem', background: theme.palette.background.paper, color: theme.palette.text.primary }} />
          <Button variant="contained" size="small" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Net Income" value={formatCurrency(netIncome)} subtitle={netIncome >= 0 ? 'Profit' : 'Loss'}
            icon={netIncome >= 0 ? <TrendingUp /> : <TrendingDown />}
            gradient={netIncome >= 0 ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}
            onClick={() => navigate('/app/reports/profit-and-loss')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Total Revenue" value={formatCurrency(totalRevenue)} subtitle="Current period" icon={<TrendingUp />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" onClick={() => navigate('/app/reports/profit-and-loss')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Total Expenses" value={formatCurrency(totalExpense)} subtitle="Current period" icon={<TrendingDown />}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" onClick={() => navigate('/app/reports/profit-and-loss')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Gross Profit" value={formatCurrency(grossProfitVal)} subtitle="Current period" icon={<Money />}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" onClick={() => navigate('/app/reports/gross-profit')} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* P&L Donut */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}><Assessment sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Revenue vs Expenses</Typography>
            {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            : (
              <PieChart series={[{ data: pnlPieData, innerRadius: 60, outerRadius: 100, paddingAngle: 4, cornerRadius: 6, cx: 120, cy: 110 }]} height={240} slotProps={{ legend: { hidden: true } }} />
            )}
            {pnlPieData.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{item.label}</Typography>
                <Typography variant="body2">{formatCurrency(item.value)}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Balance Sheet Donut */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}><AccountBalanceWallet sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Balance Sheet</Typography>
            {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            : (
              <PieChart series={[{ data: bsPieData, innerRadius: 50, outerRadius: 100, paddingAngle: 2, cornerRadius: 4, cx: 120, cy: 110 }]} height={240} slotProps={{ legend: { hidden: true } }} />
            )}
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="caption" color="text.secondary">Assets</Typography><Typography variant="caption" fontWeight={600}>{formatCurrency(totalAssets)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="caption" color="text.secondary">Liabilities</Typography><Typography variant="caption" fontWeight={600}>{formatCurrency(totalLiabilities)}</Typography></Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="caption" fontWeight={700} color="primary.main">Equity</Typography><Typography variant="caption" fontWeight={700} color="primary.main">{formatCurrency(totalEquity)}</Typography></Box>
            </Box>
          </Paper>
        </Grid>

        {/* Trial Balance Donut */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}><AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Account Balances</Typography>
            {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            : tbPieData.length > 0 ? (
              <PieChart series={[{ data: tbPieData, innerRadius: 20, outerRadius: 100, paddingAngle: 1, cx: 120, cy: 110 }]} height={240} slotProps={{ legend: { hidden: true } }} />
            ) : <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
            {tbPieData.slice(0, 4).map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                <Typography variant="caption" noWrap sx={{ flex: 1 }}>{item.label}</Typography>
                <Typography variant="caption" fontWeight={600}>{formatCurrency(item.value)}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Cash Flow Bar */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}><Money sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Cash Flow</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} />
            : cashFlow.length > 0 ? (
              <BarChart
                xAxis={[{ scaleType: 'band', data: cfLabels, tickLabelStyle: { angle: -35, fontSize: 10 } }]}
                series={[{ data: cfValues, color: '#667eea', label: 'Amount' }]}
                height={250} borderRadius={6}
              />
            ) : <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
          </Paper>
        </Grid>

        {/* Trial Balance Table */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}><AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Trial Balance</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} />
            : trialBalance.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Account</TableCell><TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell></TableRow></TableHead>
                  <TableBody>
                    {trialBalance.map((r, i) => (
                      <TableRow key={i} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/app/reports/trial-balance')}>
                        <TableCell>{r.name || r.account_name || '—'}</TableCell>
                        <TableCell align="right">{formatCurrency(r.closing_debit || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(r.closing_credit || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
          </Paper>
        </Grid>

        {/* P&L by Account */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}><Assessment sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Profit & Loss by Account</Typography>
            {loading ? <Skeleton variant="rectangular" height={200} />
            : pnlAccountData.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Account</TableCell><TableCell align="right">Revenue</TableCell><TableCell align="right">Expense</TableCell></TableRow></TableHead>
                  <TableBody>
                    {pnlAccountData.map((r, i) => (
                      <TableRow key={i} hover onClick={() => navigate('/app/reports/profit-and-loss')} sx={{ cursor: 'pointer' }}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell align="right"><Typography color="success.main" fontWeight={600}>{formatCurrency(r.revenue)}</Typography></TableCell>
                        <TableCell align="right"><Typography color="error.main" fontWeight={600}>{formatCurrency(r.expense)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No P&L data</Typography></Box>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialDashboard;
