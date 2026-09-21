import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Loyalty,
  Stars,
  Redeem,
  Groups,
  Campaign,
  LocalOffer,
  CardGiftcard,
  Share,
  Analytics,
  Notifications,
  Api,
  Shield,
  CheckCircle,
} from '@mui/icons-material';

const LOYALTY_MODULES = [
  {
    icon: <Loyalty sx={{ fontSize: 32 }} />,
    title: 'Points Engine',
    color: '#e11d48',
    bgColor: '#fff1f2',
    items: ['Earn & Burn Rules', 'Points Accrual', 'Points Expiry', 'Transaction Ledger', 'Manual Adjustments', 'Multi-Currency Points'],
  },
  {
    icon: <Stars sx={{ fontSize: 32 }} />,
    title: 'Membership Tiers',
    color: '#d97706',
    bgColor: '#fffbeb',
    items: ['Tier Levels (Bronze→Gold)', 'Tier Thresholds', 'Auto Upgrades', 'Tier Benefits', 'Downgrade Rules', 'Member Status'],
  },
  {
    icon: <Groups sx={{ fontSize: 32 }} />,
    title: 'Customers & Segments',
    color: '#2563eb',
    bgColor: '#eff6ff',
    items: ['Customer Profiles', 'Loyalty Accounts', 'Smart Segments', 'Demographics', 'Purchase History', 'Bulk Import'],
  },
  {
    icon: <Redeem sx={{ fontSize: 32 }} />,
    title: 'Rewards Catalog',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    items: ['Product & Voucher Rewards', 'Points Pricing', 'Stock Management', 'Redemption Workflow', 'Fulfilment Tracking', 'Reward Visibility'],
  },
  {
    icon: <Campaign sx={{ fontSize: 32 }} />,
    title: 'Campaigns',
    color: '#0891b2',
    bgColor: '#ecfeff',
    items: ['Targeted Promotions', 'Bonus Points Campaigns', 'Scheduling', 'Audience Rules', 'Performance Tracking', 'A/B Testing'],
  },
  {
    icon: <LocalOffer sx={{ fontSize: 32 }} />,
    title: 'Coupons & Vouchers',
    color: '#059669',
    bgColor: '#ecfdf5',
    items: ['Coupon Codes', 'Discount Rules', 'Usage Limits', 'Validity Windows', 'Single/Multi-Use', 'Redemption Analytics'],
  },
  {
    icon: <CardGiftcard sx={{ fontSize: 32 }} />,
    title: 'Gift Cards',
    color: '#dc2626',
    bgColor: '#fef2f2',
    items: ['Digital & Physical Cards', 'Card Balances', 'Top-Up & Reload', 'Issue & Revoke', 'Expiry Management', 'Balance Reports'],
  },
  {
    icon: <Share sx={{ fontSize: 32 }} />,
    title: 'Referrals',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    items: ['Referral Programs', 'Shareable Links', 'Referrer Rewards', 'Friend Incentives', 'Fraud Prevention', 'Referral Tracking'],
  },
  {
    icon: <Analytics sx={{ fontSize: 32 }} />,
    title: 'Analytics & Reports',
    color: '#9333ea',
    bgColor: '#faf5ff',
    items: ['Points Summary', 'Redemption Reports', 'Member Growth', 'Campaign ROI', 'Tier Distribution', 'Export (PDF/Excel)'],
  },
  {
    icon: <Notifications sx={{ fontSize: 32 }} />,
    title: 'Notifications',
    color: '#ea580c',
    bgColor: '#fff7ed',
    items: ['Email Templates', 'SMS / Push Notifications', 'Points Alerts', 'Campaign Broadcasts', 'Birthday Rewards', 'Custom Triggers'],
  },
  {
    icon: <Api sx={{ fontSize: 32 }} />,
    title: 'API Integrations',
    color: '#2563eb',
    bgColor: '#eff6ff',
    items: ['REST API', 'Webhooks', 'POS / ERP Sync', 'E-commerce Plugins', 'API Keys', 'Developer Docs'],
  },
  {
    icon: <Shield sx={{ fontSize: 32 }} />,
    title: 'Security & RBAC',
    color: '#6b7280',
    bgColor: '#f9fafb',
    items: ['Role-Based Access', 'Audit Trail', 'JWT Authentication', 'Rate Limiting', 'Data Encryption', 'Compliance Logs'],
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

const LoyaltyFeaturesSection = () => {
  return (
    <Box id="rewards" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#e11d48', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              REWARDS
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
              EzeeFlo{' '}
              <Box component="span" sx={{ color: '#e11d48' }}>Rewards</Box>{' '}
              Platform
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', maxWidth: 700, mx: 'auto', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              A complete enterprise rewards & loyalty management platform. Drive repeat business with a flexible
              points engine, membership tiers, rewards catalog, campaigns, coupons, gift cards, referrals,
              and deep analytics — all in one place.
            </Typography>
          </Box>
        </FadeInSection>

        <Grid container spacing={2.5}>
          {LOYALTY_MODULES.map((module, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={module.title}>
              <FadeInSection delay={index * 50}>
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
                      boxShadow: `0 12px 40px ${module.color}18`,
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

        {/* Bottom CTA */}
        <FadeInSection delay={200}>
          <Box sx={{ textAlign: 'center', mt: { xs: 6, md: 8 } }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}
            >
              Ready to turn customers into loyal advocates?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', mb: 1, fontSize: '1rem' }}
            >
              Book a demo and see how EzeeFlo Rewards can grow repeat business and customer lifetime value.
            </Typography>
          </Box>
        </FadeInSection>
      </Container>
    </Box>
  );
};

export default LoyaltyFeaturesSection;
