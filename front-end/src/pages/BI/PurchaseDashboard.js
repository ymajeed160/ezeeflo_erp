import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Paper, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Alert, useTheme,
} from '@mui/material';
import {
  TrendingUp, PeopleAlt, Assessment, Refresh, PointOfSale, Receipt,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import BIApi from '../../services/biApi';

const formatCurrency = (v) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(Number(v) || 0);
const PIE_COLORS = ['#fa709a', '#fee140', '#a18cd1', '#fbc2eb', '#fccb90', '#d57eeb', '#89f7fe', '#66a6ff', '#43e97b', '#38f9d7'];

const KpiCard = ({ title, value, subtitle, icon, gradient, onClick }) => (
  <Card onClick={onClick} sx={{ borderRadius: 2.5, background: gradient, color: '#fff', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease', '&:hover': onClick ? { transform: 'translateY(-3px)', boxShadow: 6 } : {}, position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' } }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>{title}</Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>{typeof value === 'number' ? formatCurrency(value) : value || '—'}</Typography>
          {subtitle && <Typography variant="caption" sx={{ opacity: 0.75, mt: 0.5, display: 'block' }}>{subtitle}</Typography>}
        </Box>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.2)' }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const PurchaseDashboard = () => {
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
    try { const res = await BIApi.getPurchaseDashboard(filters); if (res.success) setData(res.data); else setError('Failed'); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = data?.summary || {};
  const orderAnalysis = data?.orderAnalysis || [];
  const invoiceTrends = data?.invoiceTrends || [];
  const suppliers = data?.suppliers || [];

  const chartData = invoiceTrends.length > 0
    ? { months: invoiceTrends.map(r => r.month || r.period || ''), values: invoiceTrends.map(r => Number(r.total_amount || r.total || r.grand_total || 0)) }
    : { months: [], values: [] };

  const supplierTotals = {};
  suppliers.forEach(s => {
    const name = s.supplier_name || s.name || 'Unknown';
    supplierTotals[name] = (supplierTotals[name] || 0) + Number(s.amount || s.total_amount || 0);
  });
  const supplierPieData = Object.entries(supplierTotals).slice(0, 6).map(([name, val], i) => ({
    id: i, value: val || 1, label: name,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const statusCounts = {};
  orderAnalysis.forEach(r => { const s = r.status || 'unknown'; statusCounts[s] = (statusCounts[s] || 0) + 1; });
  const statusPieData = Object.entries(statusCounts).map(([k, v], i) => ({
    id: i, value: v, label: k.charAt(0).toUpperCase() + k.slice(1), color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>📦 Purchase BI Dashboard</Typography>
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
          <KpiCard title="Total Purchases" value={summary?.totalPurchase ?? summary?.total_amount ?? summary?.total_gross ?? 0} subtitle="Current period" icon={<TrendingUp />}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" onClick={() => navigate('/app/reports/purchase-analytics')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Purchase Orders" value={orderAnalysis.length} subtitle="Orders in period" icon={<Receipt />}
            gradient="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" onClick={() => navigate('/app/reports/purchase-order-analysis')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Supplier Transactions" value={suppliers.length} subtitle="In period" icon={<PeopleAlt />}
            gradient="linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)" onClick={() => navigate('/app/purchases/suppliers')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Avg PO Value" value={orderAnalysis.length > 0 ? orderAnalysis.reduce((s, r) => s + Number(r.total_amount || r.grand_total || 0), 0) / orderAnalysis.length : 0}
            subtitle="Per order" icon={<Assessment />} gradient="linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}><TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Purchase Trend</Typography>
            {loading ? <Skeleton variant="rectangular" height={280} />
            : chartData.months.length > 0 ? (
              <LineChart xAxis={[{ scaleType: 'point', data: chartData.months, tickLabelStyle: { angle: -45, fontSize: 10 } }]}
                series={[{ data: chartData.values, color: '#fa709a', area: true, showMark: true, label: 'Purchases' }]} height={280} />
            ) : <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}><PeopleAlt sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />By Supplier</Typography>
            {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            : supplierPieData.length > 0 ? (
              <PieChart series={[{ data: supplierPieData, innerRadius: 50, outerRadius: 100, paddingAngle: 2, cornerRadius: 4, cx: 120, cy: 110 }]} height={240} slotProps={{ legend: { hidden: true } }} />
            ) : <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
            {supplierPieData.slice(0, 4).map((item, i) => (
              <Chip key={i} size="small" label={`${item.label}: ${formatCurrency(item.value)}`} sx={{ bgcolor: item.color, color: '#fff', fontSize: 10, m: 0.3 }} />
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}><Assessment sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Order Status</Typography>
            {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            : statusPieData.length > 0 ? (
              <PieChart series={[{ data: statusPieData, innerRadius: 20, outerRadius: 100, paddingAngle: 2, cx: 120, cy: 110 }]} height={240} slotProps={{ legend: { hidden: true } }} />
            ) : <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No orders</Typography></Box>}
            {statusPieData.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                <Typography variant="caption">{item.label}: {item.value}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}><PointOfSale sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Monthly Purchases</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} />
            : chartData.months.length > 0 ? (
              <BarChart xAxis={[{ scaleType: 'band', data: chartData.months, tickLabelStyle: { angle: -45, fontSize: 10 } }]}
                series={[{ data: chartData.values, color: '#a18cd1', label: 'Purchases' }]} height={250} borderRadius={6} />
            ) : <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}>Supplier Transactions</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} />
            : suppliers.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Supplier</TableCell><TableCell>Ref #</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                  <TableBody>
                    {suppliers.slice(0, 6).map((s, i) => (
                      <TableRow key={i} hover onClick={() => navigate('/app/purchases/suppliers')} sx={{ cursor: 'pointer' }}>
                        <TableCell>{s.supplier_name || s.name || '—'}</TableCell>
                        <TableCell><Typography variant="caption">{s.ref_number || s.invoice_number || '—'}</Typography></TableCell>
                        <TableCell align="right"><Typography fontWeight={600}>{formatCurrency(s.amount || s.total_amount || 0)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}>Purchase Orders</Typography>
            {loading ? <Skeleton variant="rectangular" height={200} />
            : orderAnalysis.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>PO #</TableCell><TableCell>Supplier</TableCell><TableCell>Date</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                  <TableBody>
                    {orderAnalysis.map((r, i) => (
                      <TableRow key={i} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/app/reports/purchase-order-analysis')}>
                        <TableCell>{r.order_number || `#${i + 1}`}</TableCell>
                        <TableCell>{r.supplier_name || '—'}</TableCell>
                        <TableCell>{(r.order_date || '').substring(0, 10)}</TableCell>
                        <TableCell align="right">{formatCurrency(r.total_amount || r.grand_total || 0)}</TableCell>
                        <TableCell><Chip label={r.status || '—'} size="small" color={['received', 'completed', 'posted'].includes(r.status) ? 'success' : r.status === 'pending' ? 'warning' : 'default'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No orders found</Typography></Box>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchaseDashboard;
