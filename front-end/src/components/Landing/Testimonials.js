import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  Rating,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FormatQuote } from '@mui/icons-material';

const TESTIMONIALS = [
  {
    name: 'Ahmed Al Maktoum',
    role: 'CFO',
    company: 'Dubai Healthcare Group',
    avatar: 'AH',
    rating: 5,
    text: 'EzeeFlo ERP transformed our financial operations. The multi-company feature alone saved us countless hours of manual consolidation. Highly recommended for growing enterprises.',
  },
  {
    name: 'Sarah Johnson',
    role: 'Operations Director',
    company: 'TechVentures LLC',
    avatar: 'SJ',
    rating: 5,
    text: 'We evaluated several ERP solutions before choosing EzeeFlo. The fixed assets module and comprehensive reporting capabilities sealed the deal. Exceptional value for money.',
  },
  {
    name: 'Dr. Khalid Al Hashimi',
    role: 'CEO',
    company: 'Al Noor Medical Center',
    avatar: 'KH',
    rating: 5,
    text: 'As a healthcare provider, we needed an ERP that understood our compliance requirements. EzeeFlo delivered beyond expectations with its healthcare-ready architecture.',
  },
  {
    name: 'Maria Garcia',
    role: 'Finance Manager',
    company: 'Global Trade Solutions',
    avatar: 'MG',
    rating: 4,
    text: 'The accounting module is incredibly thorough. From journal entries to financial reports, everything flows seamlessly. The audit trail gives us complete confidence in our data.',
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

const Testimonials = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              TESTIMONIALS
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
              Trusted by Business{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>Leaders</Box>
            </Typography>
          </Box>
        </FadeInSection>

        <Grid container spacing={3}>
          {TESTIMONIALS.map((testimonial, index) => (
            <Grid item xs={12} sm={6} md={3} key={testimonial.name}>
              <FadeInSection delay={index * 100}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(124,58,237,0.08)',
                      borderColor: '#7c3aed',
                    },
                  }}
                >
                  <Box sx={{ color: '#7c3aed', opacity: 0.15, mb: 1 }}>
                    <FormatQuote sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#475569',
                      lineHeight: 1.7,
                      flex: 1,
                      mb: 2,
                      fontStyle: 'italic',
                      fontSize: '0.85rem',
                    }}
                  >
                    "{testimonial.text}"
                  </Typography>
                  <Rating value={testimonial.rating} readOnly size="small" sx={{ mb: 2, color: '#f59e0b' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: '#7c3aed',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        {testimonial.role}, {testimonial.company}
                      </Typography>
                    </Box>
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

export default Testimonials;
