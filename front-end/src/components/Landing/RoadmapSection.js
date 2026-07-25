import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Business,
  AccountBalance,
  PointOfSale,
  ShoppingCart,
  Inventory,
  AccountBalanceWallet,
  Engineering,
  Assessment,
  Security,
  History,
  Group,
  Campaign,
  AccountTree,
  Description,
  ThumbsUpDown,
  Language,
  Store,
  SmartToy,
  BarChart,
  PhoneAndroid,
  TrendingUp,
  Inventory2,
  DocumentScanner,
  Chat,
  Sync,
  Api,
  IntegrationInstructions,
  AutoAwesome,
  RecordVoiceOver,
  PictureAsPdf,
  Analytics,
  ShoppingCartCheckout,
  Build,
  SupportAgent,
  CheckCircle,
} from '@mui/icons-material';

const ROADMAP_CATEGORIES = [
  {
    title: 'Available Now',
    status: 'Released',
    statusColor: '#22c55e',
    statusBg: '#f0fdf4',
    icon: <CheckCircle sx={{ fontSize: 32, color: '#22c55e' }} />,
    description: 'Core ERP features already in production',
    estimated: 'Live',
    items: [
      'Multi-Company ERP',
      'Accounting & Finance',
      'Sales Management',
      'Purchase Management',
      'Inventory Management',
      'Banking',
      'Fixed Assets',
      'Reports & Analytics',
      'Role-Based Access Control',
      'Audit Trail',
    ],
  },
  {
    title: 'Coming Soon',
    status: 'In Progress',
    statusColor: '#2563eb',
    statusBg: '#eff6ff',
    icon: <Group />,
    description: 'Features currently in active development',
    estimated: 'Q3 2026',
    items: [
      'HR & Payroll',
      'CRM',
      'Budget Management',
      'Document Management',
      'Approval Workflows',
      'Customer Portal',
      'Supplier Portal',
    ],
  },
  {
    title: 'Future Releases',
    status: 'Planned',
    statusColor: '#f59e0b',
    statusBg: '#fffbeb',
    icon: <SmartToy />,
    description: 'Exciting features on the development roadmap',
    estimated: 'Q4 2026 – Q1 2027',
    items: [
      'AI Business Assistant',
      'Business Intelligence Dashboard',
      'Mobile Applications (Android & iOS)',
      'AI Financial Forecasting',
      'Predictive Inventory Management',
      'OCR Invoice Processing',
      'Chat-Based ERP Assistant',
      'Workflow Automation Engine',
      'API Marketplace',
      'Third-Party Integrations',
    ],
  },
  {
    title: 'Long-Term Vision',
    status: 'Vision',
    statusColor: '#7c3aed',
    statusBg: '#f5f3ff',
    icon: <AutoAwesome />,
    description: 'Next-generation innovations on the horizon',
    estimated: '2027+',
    items: [
      'AI Copilot for ERP',
      'Voice Commands',
      'AI Document Processing',
      'AI Sales Predictions',
      'AI Purchasing Suggestions',
      'AI Maintenance Predictions',
      'AI Chatbot for Customer Support',
    ],
  },
];

const CategoryIcon = ({ icon, color }) => (
  <Box
    sx={{
      width: 56,
      height: 56,
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: `${color}15`,
      color,
      mb: 1.5,
      transition: 'transform 0.3s ease',
    }}
  >
    {icon}
  </Box>
);

const FadeInSection = ({ children, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
        }
      },
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

const roadmapItemIcons = {
  'Multi-Company ERP': <Business sx={{ fontSize: 18 }} />,
  'Accounting & Finance': <AccountBalance sx={{ fontSize: 18 }} />,
  'Sales Management': <PointOfSale sx={{ fontSize: 18 }} />,
  'Purchase Management': <ShoppingCart sx={{ fontSize: 18 }} />,
  'Inventory Management': <Inventory sx={{ fontSize: 18 }} />,
  'Banking': <AccountBalanceWallet sx={{ fontSize: 18 }} />,
  'Fixed Assets': <Engineering sx={{ fontSize: 18 }} />,
  'Reports & Analytics': <Assessment sx={{ fontSize: 18 }} />,
  'Role-Based Access Control': <Security sx={{ fontSize: 18 }} />,
  'Audit Trail': <History sx={{ fontSize: 18 }} />,
  'HR & Payroll': <Group sx={{ fontSize: 18 }} />,
  'CRM': <Campaign sx={{ fontSize: 18 }} />,
  'Budget Management': <AccountTree sx={{ fontSize: 18 }} />,
  'Document Management': <Description sx={{ fontSize: 18 }} />,
  'Approval Workflows': <ThumbsUpDown sx={{ fontSize: 18 }} />,
  'Customer Portal': <Language sx={{ fontSize: 18 }} />,
  'Supplier Portal': <Store sx={{ fontSize: 18 }} />,
  'AI Business Assistant': <SmartToy sx={{ fontSize: 18 }} />,
  'Business Intelligence Dashboard': <BarChart sx={{ fontSize: 18 }} />,
  'Mobile Applications (Android & iOS)': <PhoneAndroid sx={{ fontSize: 18 }} />,
  'AI Financial Forecasting': <TrendingUp sx={{ fontSize: 18 }} />,
  'Predictive Inventory Management': <Inventory2 sx={{ fontSize: 18 }} />,
  'OCR Invoice Processing': <DocumentScanner sx={{ fontSize: 18 }} />,
  'Chat-Based ERP Assistant': <Chat sx={{ fontSize: 18 }} />,
  'Workflow Automation Engine': <Sync sx={{ fontSize: 18 }} />,
  'API Marketplace': <Api sx={{ fontSize: 18 }} />,
  'Third-Party Integrations': <IntegrationInstructions sx={{ fontSize: 18 }} />,
  'AI Copilot for ERP': <AutoAwesome sx={{ fontSize: 18 }} />,
  'Voice Commands': <RecordVoiceOver sx={{ fontSize: 18 }} />,
  'AI Document Processing': <PictureAsPdf sx={{ fontSize: 18 }} />,
  'AI Sales Predictions': <Analytics sx={{ fontSize: 18 }} />,
  'AI Purchasing Suggestions': <ShoppingCartCheckout sx={{ fontSize: 18 }} />,
  'AI Maintenance Predictions': <Build sx={{ fontSize: 18 }} />,
  'AI Chatbot for Customer Support': <SupportAgent sx={{ fontSize: 18 }} />,
};

const getItemIcon = (itemName) => {
  return roadmapItemIcons[itemName] || <AutoAwesome sx={{ fontSize: 18 }} />;
};

const RoadmapCard = ({ item, categoryColor, statusColor, statusBg, index, categoryTitle }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 50);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index]);

  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-15px)',
        '&:hover': {
          bgcolor: `${categoryColor}08`,
          transform: 'translateX(4px)',
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${categoryColor}12`,
          color: categoryColor,
          flexShrink: 0,
        }}
      >
        {getItemIcon(item)}
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: '#334155',
          fontWeight: 500,
          fontSize: '0.85rem',
          lineHeight: 1.3,
        }}
      >
        {item}
      </Typography>
    </Box>
  );
};

const RoadmapSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={sectionRef}
      id="roadmap"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc', overflow: 'hidden' }}
    >
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
              PRODUCT ROADMAP
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
              Our Product{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>Roadmap</Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#64748b',
                maxWidth: 650,
                mx: 'auto',
                fontSize: '1.05rem',
              }}
            >
              Discover the future of EzeeFlo ERP as we continue to build intelligent business solutions for organizations of every size.
            </Typography>
          </Box>
        </FadeInSection>

        {/* Horizontal Timeline (Desktop) */}
        {!isMobile && (
          <Box sx={{ position: 'relative', mb: 6 }}>
            {/* Timeline line */}
            <Box
              sx={{
                position: 'absolute',
                top: 40,
                left: '2%',
                right: '2%',
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(to right, #22c55e 0%, #22c55e 12%, #2563eb 30%, #2563eb 42%, #f59e0b 55%, #f59e0b 72%, #7c3aed 82%, #7c3aed 100%)`,
                opacity: 0.3,
              }}
            />

            <Grid container spacing={3} alignItems="flex-start">
              {ROADMAP_CATEGORIES.map((category, catIndex) => (
                <Grid item xs={12} md={3} key={category.title}>
                  <FadeInSection delay={catIndex * 150}>
                    <Box sx={{ textAlign: 'center', pt: 1 }}>
                      {/* Timeline dot */}
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: category.statusColor,
                          mx: 'auto',
                          mb: 3,
                          boxShadow: `0 0 0 4px ${category.statusColor}20, 0 4px 12px ${category.statusColor}30`,
                          position: 'relative',
                          zIndex: 2,
                          animation: visible ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                          '@keyframes pulse-dot': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.15)' },
                          },
                        }}
                      />

                      {/* Category Card */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          border: `1px solid ${category.statusColor}20`,
                          transition: 'all 0.3s ease',
                          height: '100%',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 40px ${category.statusColor}15`,
                            borderColor: category.statusColor,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <CategoryIcon icon={category.icon} color={category.statusColor} />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: '#1e293b',
                                fontSize: '1rem',
                                mb: 0.3,
                              }}
                            >
                              {category.title}
                            </Typography>
                            <Chip
                              label={category.status}
                              size="small"
                              sx={{
                                bgcolor: category.statusBg,
                                color: category.statusColor,
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                height: 22,
                              }}
                            />
                          </Box>
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{ color: '#94a3b8', display: 'block', mb: 1, fontSize: '0.7rem' }}
                        >
                          {category.description}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: category.statusColor,
                            fontWeight: 600,
                            display: 'inline-block',
                            mb: 1.5,
                            fontSize: '0.7rem',
                            bgcolor: category.statusBg,
                            px: 1.5,
                            py: 0.4,
                            borderRadius: 1,
                          }}
                        >
                          Est. {category.estimated}
                        </Typography>

                        <Box
                          sx={{
                            mt: 1,
                            borderTop: `1px solid ${category.statusColor}10`,
                            pt: 1.5,
                          }}
                        >
                          {category.items.map((item, idx) => (
                            <RoadmapCard
                              key={item}
                              item={item}
                              categoryColor={category.statusColor}
                              statusColor={category.statusColor}
                              statusBg={category.statusBg}
                              index={idx}
                              categoryTitle={category.title}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                  </FadeInSection>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Vertical Timeline (Mobile) */}
        {isMobile && (
          <Box sx={{ position: 'relative' }}>
            {/* Vertical timeline line */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 28,
                width: 3,
                background: `linear-gradient(to bottom, #22c55e, #2563eb, #f59e0b, #7c3aed)`,
                opacity: 0.2,
                borderRadius: 2,
              }}
            />

            {ROADMAP_CATEGORIES.map((category, catIndex) => (
              <FadeInSection key={category.title} delay={catIndex * 100}>
                <Box sx={{ position: 'relative', pl: 7, pb: 4 }}>
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 20,
                      top: 16,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: category.statusColor,
                      boxShadow: `0 0 0 4px ${category.statusColor}20`,
                      zIndex: 2,
                    }}
                  />

                  {/* Category Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: `1px solid #e2e8f0`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 30px ${category.statusColor}12`,
                        borderColor: category.statusColor,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <CategoryIcon icon={category.icon} color={category.statusColor} />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', mb: 0.3 }}
                        >
                          {category.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={category.status}
                            size="small"
                            sx={{
                              bgcolor: category.statusBg,
                              color: category.statusColor,
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 22,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: category.statusColor, fontWeight: 600, fontSize: '0.7rem' }}
                          >
                            Est. {category.estimated}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{ color: '#94a3b8', display: 'block', mb: 1.5, fontSize: '0.75rem' }}
                    >
                      {category.description}
                    </Typography>

                    <Box sx={{ borderTop: `1px solid #e2e8f0`, pt: 1 }}>
                      {category.items.map((item, idx) => (
                        <RoadmapCard
                          key={item}
                          item={item}
                          categoryColor={category.statusColor}
                          statusColor={category.statusColor}
                          statusBg={category.statusBg}
                          index={idx}
                          categoryTitle={category.title}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </FadeInSection>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default RoadmapSection;
