import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Paper, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Alert, useTheme,
} from '@mui/material';
import {
  Inventory2, Warning, TrendingUp, TrendingDown, Assessment,
  Refresh, MoveUp, Category,
} from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import BIApi from '../../services/biApi';

const formatCurrency = (v) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(Number(v) || 0);
const formatNumber = (v) => new Intl.NumberFormat('en-AE').format(Number(v) || 0);
const PIE_COLORS = ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#f093fb', '#f5576c', '#fa709a', '#fee140'];

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

const InventoryDashboard = () => {
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
    try { const res = await BIApi.getInventoryDashboard(filters); if (res.success) setData(res.data); else setError('Failed'); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = data?.summary || {};
  const stockValuation = data?.stockValuation || [];
  const lowStock = data?.lowStock || [];
  const recentMovements = data?.recentMovements || [];

  const typeCounts = {};
  recentMovements.forEach(r => {
    const t = r.transaction_type || r.type || 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const movementPieData = Object.entries(typeCounts).map(([k, v], i) => ({
    id: i, value: v, label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const valuationPieData = stockValuation.slice(0, 6).map((r, i) => ({
    id: i, value: Number(r.stock_value || r.quantity_on_hand || 1),
    label: r.item_name || r.name || r.item_code || `Item ${i + 1}`,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>📦 Inventory BI Dashboard</Typography>
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
          <KpiCard title="Total Items" value={formatNumber(summary?.totalItems ?? summary?.total_products ?? stockValuation.length)} subtitle="In inventory" icon={<Inventory2 />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" onClick={() => navigate('/app/inventory/items')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Stock Value" value={formatCurrency(summary?.totalValue ?? summary?.total_value ?? stockValuation.reduce((s, r) => s + Number(r.stock_value || 0), 0))} subtitle="Total inventory value" icon={<Assessment />}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" onClick={() => navigate('/app/reports/stock-valuation')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Low Stock Items" value={lowStock.length} subtitle="Below min stock level" icon={<Warning />}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" onClick={() => navigate('/app/reports/low-stock')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Movements" value={formatNumber(recentMovements.length)} subtitle="In selected period" icon={<MoveUp />}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" onClick={() => navigate('/app/reports/stock-movement')} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}><Assessment sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Stock Distribution</Typography>
            {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            : valuationPieData.length > 0 ? (
              <PieChart series={[{ data: valuationPieData, innerRadius: 50, outerRadius: 100, paddingAngle: 2, cornerRadius: 4, cx: 120, cy: 110 }]} height={240} slotProps={{ legend: { hidden: true } }} />
            ) : <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
            {valuationPieData.slice(0, 5).map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                <Typography variant="caption" noWrap sx={{ flex: 1 }}>{item.label}</Typography>
                <Typography variant="caption" fontWeight={600}>{formatNumber(item.value)}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}><Category sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Movement Types</Typography>
            {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            : movementPieData.length > 0 ? (
              <PieChart series={[{ data: movementPieData, innerRadius: 20, outerRadius: 100, paddingAngle: 2, cx: 120, cy: 110 }]} height={240} slotProps={{ legend: { hidden: true } }} />
            ) : <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
            {movementPieData.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                <Typography variant="caption">{item.label}: {item.value}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} mb={1}>
              <Warning sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Low Stock Alerts
              {lowStock.length > 0 && <Chip label={`${lowStock.length}`} size="small" color="error" sx={{ ml: 1 }} />}
            </Typography>
            {loading ? <Skeleton variant="rectangular" height={240} />
            : lowStock.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">On Hand</TableCell><TableCell align="right">Min Level</TableCell></TableRow></TableHead>
                  <TableBody>
                    {lowStock.slice(0, 6).map((r, i) => (
                      <TableRow key={i} hover onClick={() => navigate('/app/inventory/items')} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Warning fontSize="small" color="error" />{r.item_name || r.name || r.item_code || '—'}
                          </Box>
                        </TableCell>
                        <TableCell align="right"><Typography color="error.main" fontWeight={600}>{formatNumber(r.quantity_on_hand || r.qty || 0)}</Typography></TableCell>
                        <TableCell align="right">{formatNumber(r.min_stock_level || r.reorder_level || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}><TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 1 }} /><Typography color="success.main" fontWeight={600}>All stocked up</Typography></Box>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}><Assessment sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Stock Valuation</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} />
            : stockValuation.length > 0 ? (
              <BarChart
                xAxis={[{ scaleType: 'band', data: stockValuation.slice(0, 8).map(r => r.item_name || r.name || r.item_code || '—'), tickLabelStyle: { angle: -45, fontSize: 10 } }]}
                series={[{ data: stockValuation.slice(0, 8).map(r => Number(r.stock_value || r.value || 0)), color: '#4facfe', label: 'Value' }]}
                height={250} borderRadius={6}
              />
            ) : <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No data</Typography></Box>}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}><MoveUp sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />Recent Stock Movements</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} />
            : recentMovements.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Item</TableCell><TableCell>Type</TableCell><TableCell align="right">In</TableCell><TableCell align="right">Out</TableCell></TableRow></TableHead>
                  <TableBody>
                    {recentMovements.slice(0, 6).map((r, i) => (
                      <TableRow key={i} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/app/reports/stock-movement')}>
                        <TableCell>{(r.transaction_date || r.date || '').substring(0, 10)}</TableCell>
                        <TableCell>{r.item_name || r.itemName || '—'}</TableCell>
                        <TableCell>
                          <Chip label={r.transaction_type || r.type || '—'} size="small"
                            color={['purchase','receipt','transfer_in'].includes(r.transaction_type) ? 'success' : ['sale','transfer_out'].includes(r.transaction_type) ? 'error' : 'default'} />
                        </TableCell>
                        <TableCell align="right">{formatNumber(r.quantity_in || 0)}</TableCell>
                        <TableCell align="right">{formatNumber(r.quantity_out || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">No movements</Typography></Box>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryDashboard;
