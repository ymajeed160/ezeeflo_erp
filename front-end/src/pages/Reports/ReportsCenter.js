import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Chip, Divider,
} from '@mui/material';
import {
  AccountBalance as GlIcon,
  Receipt as ArIcon,
  Payment as ApIcon,
  TrendingUp as SalesIcon,
  ShoppingCart as PurchaseIcon,
  Inventory as StockIcon,
} from '@mui/icons-material';

const featuredReports = [
  { id: 'general-ledger', title: 'General Ledger', icon: <GlIcon sx={{ fontSize: 40 }} />, color: '#1976d2', desc: 'View all posted journal entries with running balances' },
  { id: 'accounts-receivable', title: 'Accounts Receivable', icon: <ArIcon sx={{ fontSize: 40 }} />, color: '#2e7d32', desc: 'Customer outstanding invoices and aging analysis' },
  { id: 'accounts-payable', title: 'Accounts Payable', icon: <ApIcon sx={{ fontSize: 40 }} />, color: '#ed6c02', desc: 'Supplier outstanding invoices and aging analysis' },
  { id: 'sales-analytics', title: 'Sales Analytics', icon: <SalesIcon sx={{ fontSize: 40 }} />, color: '#9c27b0', desc: 'Sales performance, trends, and breakdowns' },
  { id: 'purchase-analytics', title: 'Purchase Analytics', icon: <PurchaseIcon sx={{ fontSize: 40 }} />, color: '#00796b', desc: 'Purchase performance, trends, and breakdowns' },
  { id: 'stock-summary', title: 'Stock Summary', icon: <StockIcon sx={{ fontSize: 40 }} />, color: '#d32f2f', desc: 'Current stock levels, valuations, and status' },
];

const categories = [
  {
    title: 'Sales Reports',
    reports: [
      { id: 'sales-analytics', title: 'Sales Analytics' },
      { id: 'sales-order-analysis', title: 'Sales Order Analysis' },
      { id: 'sales-invoice-trends', title: 'Sales Invoice Trends' },
      { id: 'delivery-note-trends', title: 'Delivery Note Trends' },
      { id: 'customer-ledger', title: 'Customer Ledger' },
    ],
  },
  {
    title: 'Purchase Reports',
    reports: [
      { id: 'purchase-analytics', title: 'Purchase Analytics' },
      { id: 'purchase-order-analysis', title: 'Purchase Order Analysis' },
      { id: 'purchase-invoice-trends', title: 'Purchase Invoice Trends' },
      { id: 'supplier-ledger', title: 'Supplier Ledger' },
    ],
  },
  {
    title: 'Financial Reports',
    reports: [
      { id: 'general-ledger', title: 'General Ledger' },
      { id: 'trial-balance', title: 'Trial Balance' },
      { id: 'profit-and-loss', title: 'Profit & Loss' },
      { id: 'balance-sheet', title: 'Balance Sheet' },
      { id: 'accounts-receivable', title: 'Accounts Receivable' },
      { id: 'accounts-payable', title: 'Accounts Payable' },
    ],
  },
  {
    title: 'Inventory Reports',
    reports: [
      { id: 'stock-summary', title: 'Stock Summary' },
      { id: 'stock-movement', title: 'Stock Movement' },
      { id: 'stock-valuation', title: 'Stock Valuation' },
      { id: 'low-stock', title: 'Low Stock Report' },
      { id: 'item-ledger', title: 'Item Ledger' },
    ],
  },
  {
    title: 'Banking Reports',
    reports: [
      { id: 'bank-ledger', title: 'Bank Account Ledger' },
      { id: 'payment-receipt-summary', title: 'Payment Receipt Summary' },
      { id: 'payment-voucher-summary', title: 'Payment Voucher Summary' },
      { id: 'reconciliation-summary', title: 'Reconciliation Summary' },
    ],
  },
];

const ReportsCenter = () => {
  const navigate = useNavigate();

  const handleOpenReport = (reportId) => {
    navigate(`/app/reports/${reportId}`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>Reports Center</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Select a report to view business insights and analytics.
      </Typography>

      {/* Featured Reports */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Featured Reports</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {featuredReports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card elevation={2} sx={{ borderRadius: 2, transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
              <CardActionArea onClick={() => handleOpenReport(report.id)} sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ color: report.color }}>{report.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>{report.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{report.desc}</Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Report Categories */}
      <Typography variant="h6" gutterBottom>All Reports by Category</Typography>
      <Grid container spacing={3}>
        {categories.map((cat) => (
          <Grid item xs={12} sm={6} md={4} key={cat.title}>
            <Card elevation={1} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{cat.title}</Typography>
                <Divider sx={{ mb: 1.5 }} />
                {cat.reports.map((r) => (
                  <Box
                    key={r.id}
                    sx={{ display: 'flex', alignItems: 'center', py: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => handleOpenReport(r.id)}
                  >
                    <Typography variant="body2">{r.title}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReportsCenter;
