import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Grow,
} from '@mui/material';
import {
  TrendingUp,
  PeopleAlt,
  Inventory2,
  Receipt,
  ShoppingCart,
  LocalShipping,
  AccountBalanceWallet,
  PersonAdd,
  Description,
  PointOfSale,
  AccountBalance,
  AddShoppingCart,
  ArrowForward,
  Warning,
  Error,
  Info,
  Refresh,
  CurrencyExchange,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import DashboardApi from '../services/dashboardApi';
import { getActiveCompanyId } from '../utils/auth';

// ─── Utility: format currency ───
const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ─── Summary Stat Card ───
const StatCard = ({ title, value, change, icon, gradient, index, onClick }) => {
  const theme = useTheme();
  const isPositive = change >= 0;

  return (
    <Grow in timeout={300 + index * 100}>
      <Card
        onClick={onClick}
        sx={{
          borderRadius: 2.5,
          background: gradient,
          color: '#fff',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.25s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -20,
            left: -20,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            '& .stat-icon': {
              transform: 'scale(1.1) rotate(-5deg)',
            },
          },
        }}
      >
        <CardContent sx={{ p: 1.8, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600, fontSize: '0.68rem', letterSpacing: '0.4px' }}>
              {title}
            </Typography>
            <Box
              className="stat-icon"
              sx={{
                p: 0.6,
                borderRadius: 1.5,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                transition: 'all 0.25s ease',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              {icon}
            </Box>
          </Box>
          <Typography fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
            {value}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Chip
              label={`${isPositive ? '+' : ''}${change}%`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.6rem',
                height: 18,
                background: isPositive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: 1,
              }}
            />
            <Typography variant="caption" sx={{ opacity: 0.8, ml: 0.3, fontSize: '0.6rem' }}>
              vs previous period
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

// ─── Section Header ───
const SectionHeader = ({ title, subtitle, action }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Box>
);

// ─── Recent Transaction Row ───
const TransactionRow = ({ t, onClick }) => {
  const theme = useTheme();
  const getTypeIcon = (type) => {
    if (type?.toLowerCase().includes('sales')) return <Receipt sx={{ fontSize: 18 }} />;
    if (type?.toLowerCase().includes('purchase')) return <ShoppingCart sx={{ fontSize: 18 }} />;
    if (type?.toLowerCase().includes('payment')) return <CurrencyExchange sx={{ fontSize: 18 }} />;
    if (type?.toLowerCase().includes('journal')) return <AccountBalance sx={{ fontSize: 18 }} />;
    return <Receipt sx={{ fontSize: 18 }} />;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      posted: 'success', paid: 'success', draft: 'default',
      cancelled: 'error', overdue: 'error', partially_paid: 'warning',
      confirmed: 'info', approved: 'info',
    };
    return colorMap[status] || 'default';
  };

  return (
    <TableRow
      hover
      onClick={() => onClick?.(t)}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        '&:last-child td': { border: 0 },
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          >
            {getTypeIcon(t.type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
              {t.reference}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t.type}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.party}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {t.date ? new Date(t.date).toLocaleDateString() : '—'}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
          {formatCurrency(t.amount)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={t.status?.replace(/_/g, ' ')}
          size="small"
          color={getStatusColor(t.status)}
          sx={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}
        />
      </TableCell>
    </TableRow>
  );
};

// ─── Main Dashboard Component ───
const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [summary, setSummary] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState('monthly');
  const [revenueData, setRevenueData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customerBalances, setCustomerBalances] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const activeCompanyId = useSelector((state) => state.company?.activeCompanyId);
  // Also read from URL to ensure we have the freshest company context
  const urlCompanyId = getActiveCompanyId();
  // Use URL companyId if available, fall back to Redux
  const effectiveCompanyId = urlCompanyId || activeCompanyId;

  // ── Fetch all dashboard data ──
  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [summaryRes, revenueRes, txRes, balancesRes, alertsRes] = await Promise.all([
        DashboardApi.getSummary(),
        DashboardApi.getRevenueOverview(revenuePeriod),
        DashboardApi.getRecentTransactions(5),
        DashboardApi.getCustomerBalances(5),
        DashboardApi.getInventoryAlerts(),
      ]);

      setSummary(summaryRes.data);
      setRevenueData(revenueRes.data || []);
      setTransactions(txRes.data || []);
      setCustomerBalances(balancesRes.data || []);
      setInventoryAlerts(alertsRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [revenuePeriod, effectiveCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle period toggle change
  const handlePeriodChange = (_, newPeriod) => {
    if (newPeriod) {
      setRevenuePeriod(newPeriod);
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={350} height={24} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3, mt: 3 }} />
      </Box>
    );
  }

  const summaryData = summary || {};

  return (
    <Fade in timeout={400}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' } }}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Welcome back! Here's your business overview.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={() => fetchData(true)}
                disabled={refreshing}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── Error Alert ── */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={
            <Button size="small" onClick={() => fetchData()}>Retry</Button>
          }>
            {error}
          </Alert>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* SECTION 1: Top Summary Cards                */}
        {/* ════════════════════════════════════════════ */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="TOTAL REVENUE"
              value={formatCurrency(summaryData.totalRevenue?.value || 0)}
              change={summaryData.totalRevenue?.change || 0}
              icon="💰"
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              index={0}
              onClick={() => navigate('/app/sales/invoices')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="ACTIVE CUSTOMERS"
              value={summaryData.activeCustomers?.value || 0}
              change={summaryData.activeCustomers?.change || 0}
              icon="👥"
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              index={1}
              onClick={() => navigate('/app/sales/customers')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="INVENTORY VALUE"
              value={formatCurrency(summaryData.inventoryValue?.value || 0)}
              change={summaryData.inventoryValue?.change || 0}
              icon="📦"
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              index={2}
              onClick={() => navigate('/app/inventory/balances')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="PENDING ORDERS"
              value={summaryData.pendingOrders?.value || 0}
              change={summaryData.pendingOrders?.change || 0}
              icon="⏳"
              gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              index={3}
              onClick={() => navigate('/app/sales/sales-orders')}
            />
          </Grid>
        </Grid>

        {/* ════════════════════════════════════════════ */}
        {/* SECTION 2: Revenue Overview Chart           */}
        {/* ════════════════════════════════════════════ */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                transition: 'box-shadow 0.3s',
                '&:hover': { boxShadow: theme.shadows[4] },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Revenue Overview</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {revenuePeriod === 'monthly' ? 'Monthly' : 'Yearly'} revenue from posted sales invoices
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  value={revenuePeriod}
                  exclusive
                  onChange={handlePeriodChange}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 2.5,
                      py: 0.5,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderRadius: 2,
                      border: 'none',
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      },
                    },
                  }}
                >
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                  <ToggleButton value="yearly">Yearly</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {revenueData.length > 0 ? (
                <Box sx={{ height: 300, width: '100%' }}>
                  <BarChart
                    dataset={revenueData}
                    xAxis={[{ 
                      scaleType: 'band', 
                      dataKey: 'period',
                      tickLabelStyle: { fontSize: 10, angle: revenuePeriod === 'monthly' ? -30 : 0 },
                    }]}
                    series={[
                      {
                        dataKey: 'revenue',
                        label: 'Revenue',
                        color: theme.palette.primary.main,
                        valueFormatter: (v) => formatCurrency(v),
                      },
                    ]}
                    borderRadius={6}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                    yAxis={[{
                      valueFormatter: (v) => formatCurrency(v),
                    }]}
                    margin={{ top: 10, right: 10, bottom: revenuePeriod === 'monthly' ? 60 : 40, left: 70 }}
                  />
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="text.secondary">No revenue data available yet</Typography>
                  <Typography variant="caption" color="text.disabled">
                    Post sales invoices to see revenue charts
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* ════════════════════════════════════════════ */}
        {/* SECTION 3: Customer Balances + Inventory   */}
        {/* ════════════════════════════════════════════ */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* ── Customer Balances ── */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
              <SectionHeader
                title="Customer Balances"
                subtitle="Outstanding balances by customer"
                action={
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PersonAdd />}
                    onClick={() => navigate('/app/sales/customers/new')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    Add Customer
                  </Button>
                }
              />

              {customerBalances.length > 0 ? (
                <Box>
                  {customerBalances.map((c, i) => (
                    <Box
                      key={c.id}
                      onClick={() => navigate(`/app/sales/customers/${c.id}/view`)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.5,
                        px: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        borderBottom: i < customerBalances.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          {c.name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.85rem' }}>
                            {c.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {c.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', ml: 1 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                          {formatCurrency(c.outstandingBalance)}
                        </Typography>
                        <Chip
                          label={c.status === 'warning' ? 'Over limit' : 'Active'}
                          size="small"
                          color={c.status === 'warning' ? 'warning' : 'success'}
                          sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.3, height: 20 }}
                        />
                      </Box>
                    </Box>
                  ))}
                  <Box sx={{ textAlign: 'center', mt: 1.5 }}>
                    <Button
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/app/sales/customers')}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      View All Customers
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1 }}>
                  <PeopleAlt sx={{ fontSize: 40, color: 'text.disabled' }} />
                  <Typography color="text.secondary" variant="body2">No customers yet</Typography>
                  <Button variant="outlined" size="small" startIcon={<PersonAdd />} onClick={() => navigate('/app/sales/customers/new')} sx={{ borderRadius: 2, textTransform: 'none', mt: 1 }}>
                    Add Your First Customer
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* ── Inventory Alerts ── */}
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
              <SectionHeader
                title="Inventory Alerts"
                subtitle="Items that need attention"
                action={
                  <Chip label={`${inventoryAlerts.length}`} size="small" color={inventoryAlerts.length > 0 ? 'warning' : 'default'} variant="outlined" />
                }
              />

              {inventoryAlerts.length > 0 ? (
                <Box>
                  {inventoryAlerts.slice(0, 6).map((item, i) => (
                    <Box
                      key={item.itemId}
                      onClick={() => navigate(`/app/inventory/items/${item.itemId}/edit`)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1.2,
                        px: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        borderBottom: i < Math.min(inventoryAlerts.length, 6) - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: item.severity === 'error' ? alpha(theme.palette.error.main, 0.1) :
                                   item.severity === 'warning' ? alpha(theme.palette.warning.main, 0.1) :
                                   alpha(theme.palette.info.main, 0.1),
                          color: item.severity === 'error' ? theme.palette.error.main :
                                 item.severity === 'warning' ? theme.palette.warning.main :
                                 theme.palette.info.main,
                        }}
                      >
                        {item.severity === 'error' ? <Error sx={{ fontSize: 18 }} /> :
                         item.severity === 'warning' ? <Warning sx={{ fontSize: 18 }} /> :
                         <Info sx={{ fontSize: 18 }} />}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem' }}>
                          {item.itemName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.type} — Qty: {item.currentQuantity} / Min: {item.minStockLevel}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.type}
                        size="small"
                        color={item.severity}
                        sx={{ fontSize: '0.6rem', fontWeight: 600, height: 20 }}
                      />
                    </Box>
                  ))}
                  {inventoryAlerts.length > 6 && (
                    <Box sx={{ textAlign: 'center', mt: 1.5 }}>
                      <Button
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/app/inventory/items')}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        View All ({inventoryAlerts.length - 6} more)
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1 }}>
                  <Inventory2 sx={{ fontSize: 40, color: 'text.disabled' }} />
                  <Typography color="text.secondary" variant="body2">All items are fully stocked</Typography>
                  <Typography variant="caption" color="text.disabled">
                    No inventory alerts at this time
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* ── Quick Actions ── */}
          <Grid item xs={12} md={12} lg={4}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
              <SectionHeader title="Quick Actions" subtitle="Common operations" />

              <Grid container spacing={1.5}>
                {[
                  { label: 'New Sale', icon: <AddShoppingCart />, color: '#667eea', path: '/app/sales/invoices/new' },
                  { label: 'New Purchase', icon: <LocalShipping />, color: '#4facfe', path: '/app/purchases/purchase-orders/new' },
                  { label: 'Add Customer', icon: <PersonAdd />, color: '#f093fb', path: '/app/sales/customers/new' },
                  { label: 'Journal Entry', icon: <AccountBalance />, color: '#764ba2', path: '/app/accounting/journal-entries/new' },
                  { label: 'Generate Report', icon: <Description />, color: '#fa709a', path: '/app/reports' },
                  { label: 'Open POS', icon: <PointOfSale />, color: '#00f2fe', path: '/app/sales/invoices/new' },
                ].map((action) => (
                  <Grid item xs={6} key={action.label}>
                    <Zoom in timeout={300}>
                      <Button
                        fullWidth
                        onClick={() => navigate(action.path)}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.8,
                          py: 2,
                          px: 1,
                          borderRadius: 3,
                          bgcolor: alpha(action.color, 0.06),
                          color: action.color,
                          border: `1px solid ${alpha(action.color, 0.12)}`,
                          textTransform: 'none',
                          transition: 'all 0.3s ease',
                          minHeight: 80,
                          '&:hover': {
                            bgcolor: alpha(action.color, 0.12),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(action.color, 0.2)}`,
                          },
                        }}
                      >
                        <Box sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{action.icon}</Box>
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                          {action.label}
                        </Typography>
                      </Button>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* ════════════════════════════════════════════ */}
        {/* SECTION 4: Recent Transactions              */}
        {/* ════════════════════════════════════════════ */}
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                transition: 'box-shadow 0.3s',
                '&:hover': { boxShadow: theme.shadows[4] },
              }}
            >
              <SectionHeader
                title="Recent Transactions"
                subtitle="Latest activity across all modules"
                action={
                  <Chip label={`${transactions.length}`} size="small" color="primary" variant="outlined" />
                }
              />

              {transactions.length > 0 ? (
                <TableContainer sx={{ maxHeight: 320, overflow: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 2 } }}>
                  <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reference</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Party</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((t, i) => (
                        <TransactionRow key={`${t.type}-${t.id}-${i}`} t={t} onClick={() => navigate(t.link || '#')} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1 }}>
                  <Receipt sx={{ fontSize: 40, color: 'text.disabled' }} />
                  <Typography color="text.secondary" variant="body2">No recent transactions</Typography>
                  <Typography variant="caption" color="text.disabled" textAlign="center">
                    Transactions will appear here when you create invoices, payments, or journal entries
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default Dashboard;