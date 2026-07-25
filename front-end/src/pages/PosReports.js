import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Assessment, TrendingUp, People, Store, Category, Payment, History, Money } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const reportTypes = [
  { title: 'Daily Sales', icon: <Assessment sx={{ fontSize: 40 }} />, color: '#1976d2', route: 'pos-daily-sales' },
  { title: 'Sales by Cashier', icon: <People sx={{ fontSize: 40 }} />, color: '#2e7d32', route: 'pos-sales-by-cashier' },
  { title: 'Sales by Terminal', icon: <Store sx={{ fontSize: 40 }} />, color: '#ed6c02', route: 'pos-sales-by-terminal' },
  { title: 'Sales by Item', icon: <TrendingUp sx={{ fontSize: 40 }} />, color: '#9c27b0', route: 'pos-sales-by-item' },
  { title: 'Sales by Category', icon: <Category sx={{ fontSize: 40 }} />, color: '#d32f2f', route: 'pos-sales-by-category' },
  { title: 'Payment Summary', icon: <Payment sx={{ fontSize: 40 }} />, color: '#00796b', route: 'pos-payment-summary' },
  { title: 'Hourly Sales', icon: <History sx={{ fontSize: 40 }} />, color: '#5c6bc0', route: 'pos-hourly-sales' },
  { title: 'Cash Variance', icon: <Money sx={{ fontSize: 40 }} />, color: '#e91e63', route: 'pos-cash-variance' },
  { title: 'Returns', icon: <Assessment sx={{ fontSize: 40 }} />, color: '#795548', route: 'pos-returns' },
  { title: 'Discounts', icon: <Assessment sx={{ fontSize: 40 }} />, color: '#607d8b', route: 'pos-discounts' },
  { title: 'Tax Report', icon: <Assessment sx={{ fontSize: 40 }} />, color: '#3e2723', route: 'pos-tax' },
  { title: 'Top Items', icon: <TrendingUp sx={{ fontSize: 40 }} />, color: '#1b5e20', route: 'pos-top-items' },
];

const PosReports = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const openReport = (route) => {
    const params = new URLSearchParams();
    if (dateRange.from) params.set('dateFrom', dateRange.from);
    if (dateRange.to) params.set('dateTo', dateRange.to);
    navigate(`/app/reports/${route}?${params.toString()}`);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>POS Reports</Typography>
      
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="From Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
        />
        <TextField
          label="To Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
        />
      </Box>

      <Grid container spacing={2}>
        {reportTypes.map(report => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={report.route}>
            <Card>
              <CardActionArea onClick={() => openReport(report.route)}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ color: report.color, mb: 1 }}>{report.icon}</Box>
                  <Typography variant="h6">{report.title}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PosReports;
