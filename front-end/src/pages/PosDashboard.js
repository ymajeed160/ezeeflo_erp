import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { PointOfSale, ShoppingCart, Receipt, AccountBalanceWallet } from '@mui/icons-material';
import { getSales } from '../services/posApi';
import { formatCurrency } from '../utils/currency';

const StatCard = ({ icon, label, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="textSecondary">{label}</Typography>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
        </Box>
        <Box sx={{ backgroundColor: `${color}15`, borderRadius: 2, p: 1 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const PosDashboard = () => {
  const [stats, setStats] = useState({ todaySales: 0, todayCount: 0, activeSessions: 0, openTerminals: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await getSales({ startDate: today, endDate: today, limit: 1000 });
        const sales = res.data?.data || [];
        const total = sales.reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);
        setStats(prev => ({ ...prev, todaySales: total, todayCount: sales.length }));
      } catch (err) {
        console.error('Failed to load POS stats:', err);
      }
    };
    loadStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>POS Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PointOfSale sx={{ fontSize: 40, color: '#1976d2' }} />} label="Today's Sales" value={formatCurrency(stats.todaySales)} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<ShoppingCart sx={{ fontSize: 40, color: '#2e7d32' }} />} label="Transactions" value={stats.todayCount} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Receipt sx={{ fontSize: 40, color: '#ed6c02' }} />} label="Open Sessions" value={stats.activeSessions} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<AccountBalanceWallet sx={{ fontSize: 40, color: '#9c27b0' }} />} label="Active Terminals" value={stats.openTerminals} color="#9c27b0" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PosDashboard;
