import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  PointOfSale,
  Inventory,
  Assessment,
  Engineering,
} from '@mui/icons-material';

const SCREENSHOTS = [
  { icon: <Dashboard sx={{ fontSize: 48 }} />, label: 'Dashboard', screenshot: '/images/screenshots/dashboard.png', color: '#7c3aed', bgColor: '#f5f3ff', description: 'Interactive dashboard with real-time KPIs and charts' },
  { icon: <AccountBalance sx={{ fontSize: 48 }} />, label: 'Accounting', screenshot: '/images/screenshots/accounting.png', color: '#2563eb', bgColor: '#eff6ff', description: 'Chart of Accounts, Journal Entries, and Financial Reports' },
  { icon: <PointOfSale sx={{ fontSize: 48 }} />, label: 'Sales', screenshot: '/images/screenshots/sales.png', color: '#059669', bgColor: '#ecfdf5', description: 'Quotations, Orders, Invoices, and Customer Management' },
  { icon: <Inventory sx={{ fontSize: 48 }} />, label: 'Inventory', screenshot: '/images/screenshots/inventory.png', color: '#d97706', bgColor: '#fffbeb', description: 'Items, Warehouses, Stock Transfers, and Adjustments' },
  { icon: <Assessment sx={{ fontSize: 48 }} />, label: 'Reports', screenshot: '/images/screenshots/reports.png', color: '#dc2626', bgColor: '#fef2f2', description: 'Comprehensive reports and BI analytics dashboards' },
  { icon: <Engineering sx={{ fontSize: 48 }} />, label: 'Fixed Assets', screenshot: '/images/screenshots/fixed-assets.png', color: '#0891b2', bgColor: '#ecfeff', description: 'Asset lifecycle management from acquisition to disposal' },
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

const ScreenshotsSection = () => {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              SCREENSHOTS
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
              See EzeeFlo{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>In Action</Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', maxWidth: 600, mx: 'auto', fontSize: '1.05rem' }}
            >
              Explore our intuitive interface designed for maximum productivity.
            </Typography>
          </Box>
        </FadeInSection>

        <Grid container spacing={3}>
          {SCREENSHOTS.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={item.label}>
              <FadeInSection delay={index * 100}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  {/* Screenshot */}
                  <Box
                    sx={{
                      height: 200,
                      overflow: 'hidden',
                      bgcolor: item.bgColor,
                    }}
                  >
                    <Box
                      component="img"
                      src={item.screenshot}
                      alt={item.label}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        transition: 'transform 0.4s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5, fontSize: '1rem' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {item.description}
                    </Typography>
                  </Box>
                </Paper>
              </FadeInSection>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default ScreenshotsSection;
