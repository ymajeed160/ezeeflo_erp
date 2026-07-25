import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import {
  Apps,
  CheckCircle,
  Business,
  Cloud,
  Security,
} from '@mui/icons-material';

const AnimatedCounter = ({ end, suffix = '', label, icon, color }) => {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.floor(end / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [visible, end]);

  return (
    <Box ref={ref} sx={{ textAlign: 'center', p: 2 }}>
      <Box sx={{ color, mb: 1, fontSize: '2rem', display: 'flex', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '2rem', md: '2.5rem' },
          color: 'white',
          fontFeatureSettings: "'tnum'",
        }}
      >
        {count}{suffix}
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500, mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
};

const HowItWorks = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    { step: '01', title: 'Create Company', description: 'Set up your company profile with basic information, logo, and configuration preferences.' },
    { step: '02', title: 'Configure ERP', description: 'Customize your chart of accounts, tax rates, number series, and system settings.' },
    { step: '03', title: 'Manage Business', description: 'Run daily operations — sales, purchases, inventory, banking, and fixed assets.' },
    { step: '04', title: 'Generate Reports', description: 'Access comprehensive reports, analytics, and business intelligence dashboards.' },
  ];

  return (
    <Box id="about" ref={ref} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
          >
            HOW IT WORKS
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
            Get Started in{' '}
            <Box component="span" sx={{ color: '#7c3aed' }}>4 Simple Steps</Box>
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="center">
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={step.title}>
              <Box
                sx={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s ease ${index * 0.15}s`,
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 8px 30px rgba(124,58,237,0.3)',
                  }}
                >
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>
                    {step.step}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 220, mx: 'auto', lineHeight: 1.6 }}>
                  {step.description}
                </Typography>
                {index < 3 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 32,
                      right: '-20%',
                      display: { xs: 'none', md: 'block' },
                      color: '#cbd5e1',
                      fontSize: '1.5rem',
                    }}
                  >
                    →
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

const StatsSection = () => {
  return (
    <>
      {/* Statistics */}
      <Box sx={{ py: { xs: 8, md: 10 }, background: 'linear-gradient(135deg, #1e1b4b, #0f172a)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {[
              { end: 20, suffix: '+', label: 'Business Modules', icon: <Apps sx={{ fontSize: 36 }} />, color: '#a78bfa' },
              { end: 100, suffix: '+', label: 'ERP Features', icon: <CheckCircle sx={{ fontSize: 36 }} />, color: '#34d399' },
              { end: 100, suffix: '%', label: 'Multi Company Ready', icon: <Business sx={{ fontSize: 36 }} />, color: '#60a5fa' },
              { end: 99, suffix: '.9%', label: 'Cloud Uptime', icon: <Cloud sx={{ fontSize: 36 }} />, color: '#fbbf24' },
              { end: 256, suffix: '-bit', label: 'Enterprise Security', icon: <Security sx={{ fontSize: 36 }} />, color: '#f472b6' },
            ].map((stat) => (
              <Grid item xs={6} md={2.4} key={stat.label}>
                <AnimatedCounter {...stat} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <HowItWorks />
    </>
  );
};

export default StatsSection;
