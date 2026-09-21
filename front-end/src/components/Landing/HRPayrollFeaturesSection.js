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
  People,
  AccountTree,
  AccessTime,
  EventNote,
  Payments,
  CardGiftcard,
  AccountBalance,
  Description,
  TrendingUp,
  School,
  Work,
  Assignment,
  PhoneAndroid,
  Notifications,
  Assessment,
  Shield,
  CheckCircle,
} from '@mui/icons-material';

const HR_MODULES = [
  {
    icon: <People sx={{ fontSize: 32 }} />,
    title: 'Employee Management',
    color: '#4f46e5',
    bgColor: '#eef2ff',
    items: ['70+ Field Profiles', 'Emergency Contacts', 'Dependents & Education', 'Work Experience', 'Document Uploads', 'Bulk CSV Import'],
  },
  {
    icon: <AccountTree sx={{ fontSize: 32 }} />,
    title: 'Organization Structure',
    color: '#0891b2',
    bgColor: '#ecfeff',
    items: ['Departments (Hierarchy)', 'Designations / Job Titles', 'Branches (Multi-Location)', 'Cost Centers', 'Reporting Lines', 'Manager Assignments'],
  },
  {
    icon: <AccessTime sx={{ fontSize: 32 }} />,
    title: 'Attendance & Shifts',
    color: '#d97706',
    bgColor: '#fffbeb',
    items: ['Shift Definitions', 'Roster Generation', 'Check-In / Check-Out', 'Late & Overtime Tracking', 'Attendance Corrections', 'Biometric/GPS Logs'],
  },
  {
    icon: <EventNote sx={{ fontSize: 32 }} />,
    title: 'Leave Management',
    color: '#059669',
    bgColor: '#ecfdf5',
    items: ['Configurable Leave Types', 'Accrual Policies', 'Leave Balance Tracking', 'Multi-Level Approvals', 'Holiday Calendar', 'Carry-Forward Rules'],
  },
  {
    icon: <Payments sx={{ fontSize: 32 }} />,
    title: 'Payroll Processing',
    color: '#2563eb',
    bgColor: '#eff6ff',
    items: ['Salary Structures', 'Component Templates', 'Payroll Periods & Runs', 'Gross-to-Net Calculation', 'Bulk Payslip Generation', 'Approval & Lock'],
  },
  {
    icon: <CardGiftcard sx={{ fontSize: 32 }} />,
    title: 'Allowances & Deductions',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    items: ['Allowance Types (Fixed/%)', 'Deduction Types', 'Employee Assignments', 'Effective Date Control', 'Category Grouping', 'Payroll Integration'],
  },
  {
    icon: <AccountBalance sx={{ fontSize: 32 }} />,
    title: 'Loans, Benefits & EOSB',
    color: '#dc2626',
    bgColor: '#fef2f2',
    items: ['Employee Loans', 'Auto Repayment Schedule', 'Benefit Assignments', 'EOSB Calculations', 'EOSB Settlements', 'Early Settlement'],
  },
  {
    icon: <Description sx={{ fontSize: 32 }} />,
    title: 'WPS / SIF Export',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    items: ['UAE/MENA Compliant', 'WPS Configuration', 'SIF File Export', 'Bank Format Mapping', 'Batch Processing', 'Export History'],
  },
  {
    icon: <TrendingUp sx={{ fontSize: 32 }} />,
    title: 'Performance Management',
    color: '#9333ea',
    bgColor: '#faf5ff',
    items: ['Goals & Objectives', 'KPI Definitions', 'Performance Appraisals', 'Rating Scales', '360-Degree Reviews', 'Review History'],
  },
  {
    icon: <School sx={{ fontSize: 32 }} />,
    title: 'Training & Recruitment',
    color: '#ea580c',
    bgColor: '#fff7ed',
    items: ['Course Catalog', 'Training Sessions', 'Certificates', 'Job Positions', 'Applicant Tracking', 'Offer Letters'],
  },
  {
    icon: <Assignment sx={{ fontSize: 32 }} />,
    title: 'Onboarding & Offboarding',
    color: '#2563eb',
    bgColor: '#eff6ff',
    items: ['Onboarding Checklists', 'Progress Tracking', 'Offboarding Tasks', 'Exit Interviews', 'Task Templates', 'Compliance'],
  },
  {
    icon: <PhoneAndroid sx={{ fontSize: 32 }} />,
    title: 'Employee Self-Service',
    color: '#059669',
    bgColor: '#ecfdf5',
    items: ['Mobile App (iOS/Android)', 'Leave Application', 'Check-In/Out Mobile', 'Payslip Self-View', 'My Assets', 'Dashboard Widgets'],
  },
  {
    icon: <Notifications sx={{ fontSize: 32 }} />,
    title: 'Notifications System',
    color: '#d97706',
    bgColor: '#fffbeb',
    items: ['In-App Bell Icon', 'Real-Time Polling', 'Leave Workflow Alerts', 'Smart User Matching', 'Click-to-Navigate', 'Unread Badge Count'],
  },
  {
    icon: <Assessment sx={{ fontSize: 32 }} />,
    title: 'Reports & Analytics',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    items: ['HR Dashboard Stats', 'Attendance Reports', 'Leave Summary', 'Payroll Reports', 'Loan Statements', 'Export (PDF/Excel)'],
  },
  {
    icon: <Shield sx={{ fontSize: 32 }} />,
    title: 'Role-Based Access Control',
    color: '#6b7280',
    bgColor: '#f9fafb',
    items: ['Granular Permissions', 'Role Definitions', 'Module-Level Access', 'HR Admin Roles', 'Manager Roles', 'Employee Roles'],
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

const HRPayrollFeaturesSection = () => {
  return (
    <Box id="hr-payroll" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#4f46e5', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              HR & PAYROLL
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
              Complete{' '}
              <Box component="span" sx={{ color: '#4f46e5' }}>HR & Payroll</Box>{' '}
              Solution
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', maxWidth: 700, mx: 'auto', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              From hire to retire — manage your entire workforce with 15 integrated HR modules.
              Employee records, attendance, leave, payroll, loans, EOSB, WPS export, performance,
              training, recruitment, and mobile self-service — all in one platform.
            </Typography>
          </Box>
        </FadeInSection>

        <Grid container spacing={2.5}>
          {HR_MODULES.map((module, index) => (
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
              Ready to streamline your HR & Payroll?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', mb: 1, fontSize: '1rem' }}
            >
              Book a demo and see how EzeeFlo HR & Payroll can transform your workforce management.
            </Typography>
          </Box>
        </FadeInSection>
      </Container>
    </Box>
  );
};

export default HRPayrollFeaturesSection;
