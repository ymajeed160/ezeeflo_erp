import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  useMediaQuery,
  useTheme,
  Paper,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Inventory,
  Assessment,
  ShoppingCart,
  Speed,
  Security,
  Cloud,
} from '@mui/icons-material';

const FloatingCard = ({ icon, label, value, color, delay, top, left, right, bottom }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Paper
      ref={ref}
      elevation={4}
      sx={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        p: 1.5,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease',
        bgcolor: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        animation: visible ? 'float 3s ease-in-out infinite' : 'none',
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: `translateY(-${Math.random() * 8 + 4}px)` },
        },
      }}
    >
      <Avatar sx={{ bgcolor: `${color}15`, color, width: 36, height: 36 }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3, fontSize: '0.8rem' }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      id="hero"
      ref={ref}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        overflow: 'hidden',
        pt: { xs: 10, md: 0 },
      }}
    >
      {/* Animated background elements */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
            '@keyframes pulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.2)' } },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
            animation: 'pulse 5s ease-in-out infinite',
            '@keyframes pulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.3)' } },
          }}
        />
        {/* Grid pattern overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-40px)',
                transition: 'all 0.8s ease 0.2s',
              }}
            >
              {/* Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 10,
                  px: 2,
                  py: 0.6,
                  mb: 3,
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 2s infinite' }} />
                <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 500, fontSize: '0.75rem' }}>
                  Enterprise-Grade ERP Suite
                </Typography>
              </Box>

              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.5rem' },
                  lineHeight: 1.15,
                  color: 'white',
                  mb: 2,
                }}
              >
                Manage Your Entire Business{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  From One Powerful ERP Platform
                </Box>
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#94a3b8',
                  fontSize: { xs: '0.95rem', md: '1.1rem' },
                  fontWeight: 400,
                  lineHeight: 1.7,
                  mb: 4,
                  maxWidth: 540,
                }}
              >
                EzeeFlo ERP simplifies Accounting, Sales, Purchases, Inventory, Banking, Fixed Assets, Reporting and Business Operations through one intelligent cloud-ready platform.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    bgcolor: '#7c3aed',
                    '&:hover': { bgcolor: '#6d28d9' },
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: '0 8px 30px rgba(124,58,237,0.35)',
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    if (window.location.pathname !== '/') {
                      window.location.href = '/#demo';
                    } else {
                      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.4)',
                      bgcolor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  Book Demo
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: '#94a3b8',
                    px: 2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': { color: 'white', bgcolor: 'transparent' },
                  }}
                >
                  Sign In →
                </Button>
              </Stack>

              {/* Trust indicators */}
              <Stack direction="row" spacing={3} sx={{ mt: 5, opacity: 0.6 }}>
                {[
                  { icon: <Security sx={{ fontSize: 20 }} />, label: 'Enterprise Security' },
                  { icon: <Speed sx={{ fontSize: 20 }} />, label: 'High Performance' },
                  { icon: <Cloud sx={{ fontSize: 20 }} />, label: 'Cloud Ready' },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ color: '#a78bfa' }}>{item.icon}</Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Right Side - Illustration */}
          {!isMobile && (
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: { md: 500, lg: 550 },
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(40px)',
                  transition: 'all 0.8s ease 0.4s',
                }}
              >
                {/* Main Dashboard Mockup */}
                <Paper
                  elevation={8}
                  sx={{
                    position: 'absolute',
                    top: '8%',
                    left: '5%',
                    width: '85%',
                    height: '70%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Mockup Header */}
                  <Box sx={{ bgcolor: '#0f172a', px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {['#ef4444', '#eab308', '#22c55e'].map((c) => (
                        <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
                      ))}
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                      {['Dashboard', 'Sales', 'Inventory', 'Reports'].map((t) => (
                        <Typography key={t} variant="caption" sx={{ color: '#475569', fontSize: '0.65rem', px: 1, py: 0.3, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                          {t}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                  {/* Mockup Content */}
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {[60, 40].map((w, i) => (
                        <Box key={i} sx={{ flex: w, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ height: 8, bgcolor: 'rgba(124,58,237,0.2)', borderRadius: 1, width: '60%' }} />
                          <Box sx={{ height: 60, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1.5 }} />
                        </Box>
                      ))}
                    </Box>
                    {/* Chart area */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {[40, 25, 50, 35, 55, 30, 45].map((h, i) => (
                        <Box
                          key={i}
                          sx={{
                            flex: 1,
                            height: h,
                            bgcolor: `rgba(124,58,237,${0.2 + i * 0.05})`,
                            borderRadius: 1,
                            transition: 'height 0.3s',
                            animation: 'rise 1.5s ease infinite',
                            '@keyframes rise': {
                              '0%,100%': { height: h },
                              '50%': { height: h + 10 },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Paper>

                {/* Floating Cards */}
                <FloatingCard
                  icon={<AccountBalance sx={{ fontSize: 16 }} />}
                  label="Revenue"
                  value="$2.4M"
                  color="#22c55e"
                  delay={600}
                  top="5%"
                  right="2%"
                />
                <FloatingCard
                  icon={<Assessment sx={{ fontSize: 16 }} />}
                  label="Profit Margin"
                  value="32.5%"
                  color="#7c3aed"
                  delay={900}
                  top="40%"
                  right="-3%"
                />
                <FloatingCard
                  icon={<TrendingUp sx={{ fontSize: 16 }} />}
                  label="Growth"
                  value="+18.2%"
                  color="#2563eb"
                  delay={1200}
                  bottom="18%"
                  right="5%"
                />
                <FloatingCard
                  icon={<Inventory sx={{ fontSize: 16 }} />}
                  label="Stock Value"
                  value="$890K"
                  color="#f59e0b"
                  delay={800}
                  bottom="35%"
                  left="-2%"
                />
                <FloatingCard
                  icon={<ShoppingCart sx={{ fontSize: 16 }} />}
                  label="Orders"
                  value="1,247"
                  color="#ec4899"
                  delay={1000}
                  top="60%"
                  left="0%"
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Scroll indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          opacity: 0.4,
          animation: 'bounce 2s infinite',
          '@keyframes bounce': {
            '0%,100%': { transform: 'translateX(-50%) translateY(0)' },
            '50%': { transform: 'translateX(-50%) translateY(8px)' },
          },
        }}
      >
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase' }}>
          Scroll
        </Typography>
        <Box sx={{ width: 1, height: 20, bgcolor: '#475569', borderRadius: 1 }} />
      </Box>
    </Box>
  );
};

export default HeroSection;
