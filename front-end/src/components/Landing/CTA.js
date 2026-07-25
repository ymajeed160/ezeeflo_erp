import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
} from '@mui/material';

const CTA = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        py: { xs: 10, md: 14 },
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
      </Box>

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Box
          sx={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              color: 'white',
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            Ready to Transform{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Your Business?
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#94a3b8',
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              mb: 5,
              maxWidth: 550,
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            Join thousands of businesses that trust EzeeFlo ERP for their daily operations. Get started today and experience the power of modern enterprise management.
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
                px: 5,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 8px 30px rgba(124,58,237,0.35)',
              }}
            >
              Request Demo
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                px: 5,
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
              Contact Sales
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{
                color: '#94a3b8',
                px: 3,
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': { color: 'white', bgcolor: 'transparent' },
              }}
            >
              Sign In →
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default CTA;
