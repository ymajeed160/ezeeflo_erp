import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountBalance,
  PointOfSale,
  ShoppingCart,
  Inventory,
  AccountBalanceWallet,
  Engineering,
  Assessment,
  CheckCircle,
} from '@mui/icons-material';

const MODULES = [
  {
    icon: <AccountBalance sx={{ fontSize: 32 }} />,
    title: 'Accounting',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    items: ['Chart of Accounts', 'Journal Entries', 'General Ledger', 'Trial Balance', 'Profit & Loss', 'Balance Sheet'],
  },
  {
    icon: <PointOfSale sx={{ fontSize: 32 }} />,
    title: 'Sales',
    color: '#2563eb',
    bgColor: '#eff6ff',
    items: ['Customers', 'Quotations', 'Orders', 'Invoices', 'Payments', 'Returns & Credits'],
  },
  {
    icon: <ShoppingCart sx={{ fontSize: 32 }} />,
    title: 'Purchasing',
    color: '#059669',
    bgColor: '#ecfdf5',
    items: ['Suppliers', 'Purchase Orders', 'Goods Receipts', 'Invoices', 'Payments', 'Returns & Debits'],
  },
  {
    icon: <Inventory sx={{ fontSize: 32 }} />,
    title: 'Inventory',
    color: '#d97706',
    bgColor: '#fffbeb',
    items: ['Items', 'Warehouses', 'Transfers', 'Stock Adjustment', 'Stock Valuation', 'Inventory Reports'],
  },
  {
    icon: <AccountBalanceWallet sx={{ fontSize: 32 }} />,
    title: 'Banking',
    color: '#dc2626',
    bgColor: '#fef2f2',
    items: ['Bank Accounts', 'Payment Receipts', 'Payment Vouchers', 'Reconciliation', 'Transactions', 'Bank Reports'],
  },
  {
    icon: <Engineering sx={{ fontSize: 32 }} />,
    title: 'Fixed Assets',
    color: '#0891b2',
    bgColor: '#ecfeff',
    items: ['Asset Register', 'Depreciation', 'Maintenance', 'Disposal', 'Revaluation', 'Asset Reports'],
  },
  {
    icon: <Assessment sx={{ fontSize: 32 }} />,
    title: 'Reports & BI',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    items: ['Financial Reports', 'Sales Analytics', 'Purchase Reports', 'Inventory Reports', 'Banking Reports', 'Fixed Asset Reports'],
  },
  {
    icon: <AccountBalance sx={{ fontSize: 32 }} />,
    title: 'System',
    color: '#6b7280',
    bgColor: '#f9fafb',
    items: ['User Management', 'Roles & Permissions', 'Company Setup', 'System Config', 'Audit Logs', 'Email Settings'],
  },
];

const FadeInSection = ({ children, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s ease',
      }}
    >
      {children}
    </Box>
  );
};

const ModulesSection = () => {
  return (
    <Box id="modules" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              ERP MODULES
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                color: '#1e293b',
                mt: 1,
                mb: 2,
              }}
            >
              Complete Business{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>Module Suite</Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', maxWidth: 600, mx: 'auto', fontSize: '1.05rem' }}
            >
              20+ integrated modules covering every aspect of your business operations.
            </Typography>
          </Box>
        </FadeInSection>

        <Grid container spacing={3}>
          {MODULES.map((module, index) => (
            <Grid item xs={12} sm={6} md={3} key={module.title}>
              <FadeInSection delay={index * 100}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${module.color}15`,
                      borderColor: module.color,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: module.bgColor,
                      color: module.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'scale(1.1) rotate(-5deg)' },
                    }}
                  >
                    {module.icon}
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, fontSize: '1.05rem' }}>
                    {module.title}
                  </Typography>

                  <List dense disablePadding>
                    {module.items.map((item) => (
                      <ListItem key={item} disablePadding sx={{ py: 0.3 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckCircle sx={{ fontSize: 14, color: module.color }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: { color: '#475569', fontSize: '0.8rem' },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </FadeInSection>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default ModulesSection;
