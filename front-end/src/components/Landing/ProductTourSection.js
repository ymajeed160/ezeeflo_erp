import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
  Avatar,
  Slide,
} from '@mui/material';
import {
  Close,
  ArrowForward,
  Dashboard,
  AccountBalance,
  PointOfSale,
  ShoppingCart,
  Inventory,
  AccountBalanceWallet,
  Engineering,
  Assessment,
  CheckCircle,
  Business,
  Cloud,
  Security,
  AutoAwesome,
  PhoneAndroid,
  Speed,
  Analytics,
  Visibility,
} from '@mui/icons-material';

const FEATURE_BADGES = [
  { icon: <Business sx={{ fontSize: 14 }} />, label: 'Multi Company', color: '#7c3aed' },
  { icon: <Cloud sx={{ fontSize: 14 }} />, label: 'Cloud Ready', color: '#2563eb' },
  { icon: <Security sx={{ fontSize: 14 }} />, label: 'Secure', color: '#059669' },
  { icon: <AutoAwesome sx={{ fontSize: 14 }} />, label: 'AI Ready', color: '#d97706' },
  { icon: <PhoneAndroid sx={{ fontSize: 14 }} />, label: 'Mobile Ready', color: '#dc2626' },
  { icon: <Business sx={{ fontSize: 14 }} />, label: 'Enterprise Grade', color: '#7c3aed' },
  { icon: <Speed sx={{ fontSize: 14 }} />, label: 'Fast Performance', color: '#0891b2' },
  { icon: <Analytics sx={{ fontSize: 14 }} />, label: 'Real-Time Analytics', color: '#7c3aed' },
];

const MODULES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: <Dashboard sx={{ fontSize: 40 }} />,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    screenshot: '/images/screenshots/dashboard.png',
    description: 'Real-time KPIs, charts, and business insights at a glance.',
    capabilities: ['Revenue Overview', 'Active Customers', 'Inventory Value', 'Pending Orders', 'Recent Transactions', 'Quick Actions'],
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  },
  {
    id: 'accounting',
    name: 'Accounting',
    icon: <AccountBalance sx={{ fontSize: 40 }} />,
    color: '#2563eb',
    bgColor: '#eff6ff',
    screenshot: '/images/screenshots/accounting.png',
    description: 'Complete financial management from journal entries to financial statements.',
    capabilities: ['Chart of Accounts', 'Journal Entries', 'General Ledger', 'Trial Balance', 'Profit & Loss', 'Balance Sheet'],
    gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: <PointOfSale sx={{ fontSize: 40 }} />,
    color: '#059669',
    bgColor: '#ecfdf5',
    screenshot: '/images/screenshots/sales.png',
    description: 'End-to-end sales cycle from quotations to payments.',
    capabilities: ['Quotations', 'Sales Orders', 'Invoices', 'Payments', 'Returns & Credits', 'Customer Management'],
    gradient: 'linear-gradient(135deg, #059669, #047857)',
  },
  {
    id: 'purchasing',
    name: 'Purchasing',
    icon: <ShoppingCart sx={{ fontSize: 40 }} />,
    color: '#d97706',
    bgColor: '#fffbeb',
    screenshot: '/images/screenshots/purchasing.png',
    description: 'Streamlined procurement with supplier management and purchase orders.',
    capabilities: ['Purchase Orders', 'Supplier Management', 'Goods Receipt', 'Purchase Invoices', 'Returns & Debits', 'Supplier Payments'],
    gradient: 'linear-gradient(135deg, #d97706, #b45309)',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: <Inventory sx={{ fontSize: 40 }} />,
    color: '#dc2626',
    bgColor: '#fef2f2',
    screenshot: '/images/screenshots/inventory.png',
    description: 'Real-time inventory tracking with multi-warehouse support.',
    capabilities: ['Items', 'Warehouses', 'Stock Transfers', 'Stock Adjustments', 'Stock Valuation', 'Inventory Reports'],
    gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  },
  {
    id: 'banking',
    name: 'Banking',
    icon: <AccountBalanceWallet sx={{ fontSize: 40 }} />,
    color: '#0891b2',
    bgColor: '#ecfeff',
    screenshot: '/images/screenshots/banking.png',
    description: 'Bank account management with payment tracking and reconciliation.',
    capabilities: ['Bank Accounts', 'Receipts', 'Payments', 'Reconciliation', 'Transactions', 'Bank Reports'],
    gradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
  },
  {
    id: 'fixed-assets',
    name: 'Fixed Assets',
    icon: <Engineering sx={{ fontSize: 40 }} />,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    screenshot: '/images/screenshots/fixed-assets.png',
    description: 'Complete asset lifecycle management from acquisition to disposal.',
    capabilities: ['Asset Register', 'Depreciation', 'Maintenance', 'Transfers', 'Disposal', 'Asset Reports'],
    gradient: 'linear-gradient(135deg, #7c3aed, #6d21b0)',
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: <Assessment sx={{ fontSize: 40 }} />,
    color: '#6b7280',
    bgColor: '#f9fafb',
    screenshot: '/images/screenshots/reports.png',
    description: 'Comprehensive reports and analytics for data-driven decisions.',
    capabilities: ['Financial Reports', 'Sales Reports', 'Inventory Reports', 'Bank Reports', 'Fixed Asset Reports', 'BI Analytics'],
    gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
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

const FeatureBadge = ({ icon, label, color }) => (
  <Chip
    icon={icon}
    label={label}
    size="small"
    sx={{
      bgcolor: `${color}10`,
      color,
      fontWeight: 600,
      fontSize: '0.7rem',
      height: 26,
      '& .MuiChip-icon': { color, fontSize: 14, ml: 0.5 },
      '&:hover': { bgcolor: `${color}20` },
      transition: 'all 0.2s ease',
    }}
  />
);

const ScreenshotCard = ({ module, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <Box
      onClick={() => onClick(module)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        height: 180,
        bgcolor: module.bgColor,
        cursor: 'pointer',
        border: '2px solid',
        borderColor: hovered ? module.color : 'transparent',
        transition: 'all 0.3s ease',
        '&:hover .overlay': { opacity: 1 },
      }}
    >
      {/* Real Screenshot */}
      {!imgError ? (
        <Box
          component="img"
          src={module.screenshot}
          alt={module.name}
          onError={() => setImgError(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top left',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
      ) : (
        /* Fallback when image fails to load */
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ color: module.color, opacity: 0.6, mb: 1, fontSize: '2rem' }}>
            {module.icon}
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {module.name} Screenshot
          </Typography>
        </Box>
      )}

      {/* Hover overlay */}
      <Box
        className="overlay"
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<Visibility />}
          sx={{
            bgcolor: 'white',
            color: '#1e293b',
            '&:hover': { bgcolor: '#f1f5f9' },
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Preview
        </Button>
      </Box>
    </Box>
  );
};

const ModuleCard = ({ module, index, onPreview }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <FadeInSection delay={index * 80}>
      <Paper
        elevation={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease',
          height: '100%',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: `0 16px 48px ${module.color}15`,
            borderColor: module.color,
          },
        }}
      >
        {/* Screenshot */}
        <ScreenshotCard module={module} onClick={onPreview} />

        {/* Info */}
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: module.bgColor,
                color: module.color,
                width: 40,
                height: 40,
                transition: 'transform 0.3s ease',
                transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
              }}
            >
              {module.icon}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
              {module.name}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.85rem', lineHeight: 1.6 }}>
            {module.description}
          </Typography>

          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
            {module.capabilities.slice(0, 3).map((cap) => (
              <Chip
                key={cap}
                label={cap}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  fontSize: '0.65rem',
                  height: 24,
                  '&:hover': { borderColor: module.color, color: module.color },
                }}
              />
            ))}
          </Stack>

          <Button
            variant="text"
            onClick={() => onPreview(module)}
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              color: module.color,
              mt: 1.5,
              p: 0,
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { bgcolor: 'transparent', gap: 0.5 },
            }}
          >
            Learn More
          </Button>
        </Box>
      </Paper>
    </FadeInSection>
  );
};

const PreviewModal = ({ module, open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  if (!module) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            background: module.gradient,
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                width: 48,
                height: 48,
              }}
            >
              {module.icon}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                {module.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.3 }}>
                {module.description}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white' } }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {/* Screenshot */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3,
            border: '1px solid #e2e8f0',
          }}
        >
          <Box
            component="img"
            src={module.screenshot}
            alt={module.name}
            sx={{
              width: '100%',
              height: { xs: 180, md: 280 },
              objectFit: 'cover',
              objectPosition: 'top',
              display: 'block',
            }}
          />
        </Paper>

        {/* Key Capabilities */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, fontSize: '1rem' }}>
          Key Capabilities
        </Typography>
        <Grid container spacing={1} sx={{ mb: 3 }}>
          {module.capabilities.map((cap) => (
            <Grid item xs={12} sm={6} key={cap}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#22c55e', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                  {cap}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Feature badges */}
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, display: 'block', mb: 1 }}>
          AVAILABLE IN THIS MODULE
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
          {FEATURE_BADGES.slice(0, 4).map((badge) => (
            <FeatureBadge key={badge.label} {...badge} />
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

const ProductTourSection = () => {
  const navigate = useNavigate();
  const [previewModule, setPreviewModule] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = useCallback((module) => {
    setPreviewModule(module);
    setPreviewOpen(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
    setTimeout(() => setPreviewModule(null), 300);
  }, []);

  return (
    <Box id="product-tour" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              PRODUCT TOUR
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
              Take a Tour of{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>EzeeFlo ERP</Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', maxWidth: 650, mx: 'auto', fontSize: '1.05rem' }}
            >
              Explore the intuitive interface and powerful business modules that help organizations manage their entire business from one platform.
            </Typography>
          </Box>
        </FadeInSection>

        {/* Feature Badges Row */}
        <FadeInSection delay={100}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1,
              mb: { xs: 5, md: 6 },
            }}
          >
            {FEATURE_BADGES.map((badge) => (
              <FeatureBadge key={badge.label} {...badge} />
            ))}
          </Box>
        </FadeInSection>

        {/* Module Cards Grid */}
        <Grid container spacing={3}>
          {MODULES.map((module, index) => (
            <Grid item xs={12} sm={6} md={3} key={module.id}>
              <ModuleCard module={module} index={index} onPreview={handlePreview} />
            </Grid>
          ))}
        </Grid>

        {/* Bottom CTA */}
        <FadeInSection delay={300}>
          <Box
            sx={{
              textAlign: 'center',
              mt: { xs: 6, md: 8 },
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '50%',
                height: '50%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: 'white',
                  fontSize: { xs: '1.3rem', md: '1.75rem' },
                  mb: 3,
                }}
              >
                Ready to Experience EzeeFlo ERP?
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    if (window.location.pathname !== '/') {
                      window.location.href = '/#demo';
                    } else {
                      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  sx={{
                    bgcolor: '#7c3aed',
                    '&:hover': { bgcolor: '#6d28d9' },
                    px: 4,
                    py: 1.3,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: '0 8px 30px rgba(124,58,237,0.35)',
                  }}
                >
                  Request Demo
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    px: 4,
                    py: 1.3,
                    borderRadius: 2,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.4)',
                      bgcolor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </Box>
          </Box>
        </FadeInSection>
      </Container>

      {/* Preview Modal */}
      <PreviewModal module={previewModule} open={previewOpen} onClose={handleClosePreview} />
    </Box>
  );
};

export default ProductTourSection;
