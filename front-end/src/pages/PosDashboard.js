import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  PointOfSale, ShoppingCart, Receipt, AccountBalanceWallet,
  Store, PlayArrow, ReceiptLong, Assessment, ArrowForward,
} from '@mui/icons-material';
import { getSales, getSessions, getTerminals } from '../services/posApi';
import { formatCurrency } from '../utils/currency';

const StatCard = ({ icon, label, value, sub, color, gradient }) => (
  <Card sx={{
    height: '100%', borderRadius: 3,
    background: gradient,
    color: '#fff',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0px 8px 30px rgba(0,0,0,0.15)' },
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box flex={1}>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1, fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, letterSpacing: -1 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {sub}
            </Typography>
          )}
        </Box>
        <Box sx={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 28, color: '#fff' } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const PosDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ todaySales: 0, todayCount: 0, activeSessions: 0, openTerminals: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [salesRes, sessionsRes, terminalsRes] = await Promise.all([
          getSales({ startDate: today, endDate: today, limit: 20 }),
          getSessions(),
          getTerminals(),
        ]);

        const sales = salesRes.data?.data || [];
        const total = sales.reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);
        const sessions = sessionsRes.data?.data || [];
        const terminals = terminalsRes.data?.data || [];

        setStats({
          todaySales: total,
          todayCount: sales.length,
          activeSessions: sessions.filter(s => s.status === 'open').length,
          openTerminals: terminals.filter(t => t.status === 'active').length,
        });
        setRecentSales(sales.slice(0, 5));
      } catch (err) {
        console.error('Failed to load POS stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const quickActions = [
    { label: 'POS Register', icon: <PointOfSale />, path: '/app/pos/register', color: '#6366f1' },
    { label: 'Sessions', icon: <PlayArrow />, path: '/app/pos/sessions', color: '#059669' },
    { label: 'Held Orders', icon: <ReceiptLong />, path: '/app/pos/held-orders', color: '#d97706' },
    { label: 'Reports', icon: <Assessment />, path: '/app/pos/reports', color: '#0891b2' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
          POS Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your Point of Sale operations
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PointOfSale />}
            label="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            sub={`${stats.todayCount} transactions`}
            gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ShoppingCart />}
            label="Transactions"
            value={stats.todayCount}
            sub="completed today"
            gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Receipt />}
            label="Open Sessions"
            value={stats.activeSessions}
            sub="currently active"
            gradient="linear-gradient(135deg, #d97706 0%, #b45309 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AccountBalanceWallet />}
            label="Active Terminals"
            value={stats.openTerminals}
            sub="ready for use"
            gradient="linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)"
          />
        </Grid>
      </Grid>

      {/* Quick Actions & Recent Sales */}
      <Grid container spacing={2.5}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={1.5}>
                {quickActions.map(action => (
                  <Grid item xs={6} key={action.label}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate(action.path)}
                      sx={{
                        py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: '0.85rem',
                        borderColor: 'divider', color: 'text.primary',
                        justifyContent: 'flex-start', gap: 1, textTransform: 'none',
                        '&:hover': { borderColor: action.color, bgcolor: `${action.color}08` },
                      }}
                    >
                      <Box sx={{ color: action.color, display: 'flex' }}>{action.icon}</Box>
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sales */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Recent Sales</Typography>
                <Chip label="Today" size="small" color="primary" variant="soft" />
              </Box>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sale #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" py={3}>
                            No sales recorded today
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentSales.map(sale => (
                        <TableRow key={sale.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{sale.saleNumber || sale.invoiceNumber || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(sale.createdAt).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{sale.lines?.length || sale.totalItems || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(sale.payments?.[0]?.paymentMethod || 'cash').replace('_', ' ')}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {formatCurrency(parseFloat(sale.grandTotal || 0))}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PosDashboard;
