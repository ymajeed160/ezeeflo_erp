import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
} from '@mui/material';
import {
  AccountBalance,
  PointOfSale,
  ShoppingCart,
  Inventory,
  Warehouse,
  AccountBalanceWallet,
  Engineering,
  Assessment,
  People,
  Groups,
  Dashboard,
  Analytics,
  Shield,
  Business,
  CurrencyExchange,
  Description,
  Settings,
  History,
  Security,
  Cloud,
} from '@mui/icons-material';

const FEATURES = [
  { icon: <AccountBalance sx={{ fontSize: 28 }} />, title: 'Accounting', description: 'Full financial management with Chart of Accounts, Journal Entries, General Ledger, and financial reporting.' },
  { icon: <PointOfSale sx={{ fontSize: 28 }} />, title: 'Sales', description: 'End-to-end sales cycle from quotations and orders to invoices, deliveries, returns, and payment tracking.' },
  { icon: <ShoppingCart sx={{ fontSize: 28 }} />, title: 'Purchasing', description: 'Streamlined procurement with purchase requests, orders, goods receipt, invoices, and supplier payments.' },
  { icon: <Inventory sx={{ fontSize: 28 }} />, title: 'Inventory', description: 'Real-time inventory tracking with items, warehouses, stock transfers, adjustments, and valuation.' },
  { icon: <Warehouse sx={{ fontSize: 28 }} />, title: 'Warehouses', description: 'Multi-warehouse management with location tracking, stock movements, and inventory balances.' },
  { icon: <AccountBalanceWallet sx={{ fontSize: 28 }} />, title: 'Banking', description: 'Bank account management, payment receipts & vouchers, transaction tracking, and reconciliation.' },
  { icon: <Engineering sx={{ fontSize: 28 }} />, title: 'Fixed Assets', description: 'Complete asset lifecycle from acquisition, depreciation, maintenance, disposal, audits, and revaluation.' },
  { icon: <Assessment sx={{ fontSize: 28 }} />, title: 'Reports', description: 'Comprehensive financial, sales, purchase, inventory, banking, and fixed asset reports with BI analytics.' },
  { icon: <People sx={{ fontSize: 28 }} />, title: 'Customer Management', description: '360-degree customer view with contact management, sales history, payments, and communication.' },
  { icon: <Groups sx={{ fontSize: 28 }} />, title: 'Supplier Management', description: 'Complete supplier lifecycle with purchase history, payments, returns, and performance tracking.' },
  { icon: <Dashboard sx={{ fontSize: 28 }} />, title: 'Dashboard', description: 'Interactive dashboards with real-time KPIs, charts, and business intelligence for informed decisions.' },
  { icon: <Analytics sx={{ fontSize: 28 }} />, title: 'Analytics', description: 'Advanced analytics with sales, purchase, inventory, and financial dashboards for data-driven insights.' },
  { icon: <Shield sx={{ fontSize: 28 }} />, title: 'Role Based Security', description: 'Granular role-based access control with comprehensive permission management for every module.' },
  { icon: <Business sx={{ fontSize: 28 }} />, title: 'Multi Company', description: 'Manage multiple companies from a single installation with complete data isolation and segregation.' },
  { icon: <CurrencyExchange sx={{ fontSize: 28 }} />, title: 'Multi Currency', description: 'Support for multiple currencies with exchange rate management and multi-currency transactions.' },
  { icon: <Description sx={{ fontSize: 28 }} />, title: 'Document Management', description: 'Attach and manage documents, invoices, receipts, and files across all business transactions.' },
  { icon: <Settings sx={{ fontSize: 28 }} />, title: 'Workflow Automation', description: 'Automate business processes, approvals, notifications, and repetitive tasks for increased efficiency.' },
  { icon: <History sx={{ fontSize: 28 }} />, title: 'Audit Trail', description: 'Complete audit logging with user activity tracking, change history, and compliance reporting.' },
];

const WHY_CHOOSE = [
  { icon: <Shield />, title: 'Enterprise Ready', description: 'Built for businesses of all sizes with enterprise-grade security and scalability.' },
  { icon: <AccountBalance />, title: 'Modern Architecture', description: 'Cloud-native architecture with modern tech stack for optimal performance.' },
  { icon: <Business />, title: 'Multi Company', description: 'Manage unlimited companies under one installation with full data isolation.' },
  { icon: <Groups />, title: 'Multi Tenant', description: 'Tenant-aware architecture ensuring complete data separation and security.' },
  { icon: <Security />, title: 'Secure', description: 'Bank-grade encryption, role-based access, and comprehensive audit trails.' },
  { icon: <Dashboard />, title: 'Fast', description: 'Optimized queries and efficient architecture for lightning-fast performance.' },
  { icon: <Inventory />, title: 'Scalable', description: 'Horizontally scalable architecture that grows with your business.' },
  { icon: <Cloud />, title: 'Cloud Ready', description: 'Deploy on any cloud platform or on-premises with flexible hosting options.' },
  { icon: <Analytics />, title: 'AI Ready', description: 'API-first design ready for AI integration, automation, and intelligent insights.' },
  { icon: <Engineering />, title: 'Healthcare Ready', description: 'Compliant with healthcare industry standards with specialized modules available.' },
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

const FeaturesSection = () => {
  return (
    <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="overline"
              sx={{
                color: '#7c3aed',
                fontWeight: 600,
                letterSpacing: 2,
                fontSize: '0.75rem',
              }}
            >
              POWERFUL FEATURES
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
              Everything You Need to{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>Run Your Business</Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', maxWidth: 600, mx: 'auto', fontSize: '1.05rem' }}
            >
              Comprehensive ERP modules designed to streamline every aspect of your business operations.
            </Typography>
          </Box>
        </FadeInSection>

        {/* Features Grid */}
        <Grid container spacing={2.5}>
          {FEATURES.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={feature.title}>
              <FadeInSection delay={index * 50}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(124,58,237,0.1)',
                      borderColor: '#7c3aed',
                      '& .feature-icon': {
                        bgcolor: '#7c3aed',
                        color: 'white',
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                >
                  <Avatar
                    className="feature-icon"
                    sx={{
                      bgcolor: '#f5f3ff',
                      color: '#7c3aed',
                      width: 48,
                      height: 48,
                      mb: 2,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, fontSize: '1rem' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </FadeInSection>
            </Grid>
          ))}
        </Grid>

        {/* Why Choose Us Section */}
        <Box id="solutions" sx={{ mt: { xs: 10, md: 14 } }}>
          <FadeInSection>
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
              <Typography
                variant="overline"
                sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
              >
                WHY EZEEFLO
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  color: '#1e293b',
                  mt: 1,
                }}
              >
                Why Businesses Choose{' '}
                <Box component="span" sx={{ color: '#7c3aed' }}>EzeeFlo ERP</Box>
              </Typography>
            </Box>
          </FadeInSection>

          <Grid container spacing={3}>
            {WHY_CHOOSE.map((item, index) => (
              <Grid item xs={6} sm={4} md={2.4} key={item.title}>
                <FadeInSection delay={index * 80}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(124,58,237,0.1)',
                        borderColor: '#7c3aed',
                        '& .why-icon': { color: '#7c3aed', transform: 'scale(1.2)' },
                      },
                    }}
                  >
                    <Box
                      className="why-icon"
                      sx={{
                        color: '#94a3b8',
                        fontSize: '2rem',
                        mb: 1.5,
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5, fontSize: '0.85rem' }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: '#94a3b8', lineHeight: 1.4, display: 'block', fontSize: '0.7rem' }}
                    >
                      {item.description}
                    </Typography>
                  </Paper>
                </FadeInSection>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
