import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import {
  LinkedIn,
  Twitter,
  Facebook,
  Instagram,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const footerSections = [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home', onClick: () => scrollToSection('hero') },
        { label: 'Features', onClick: () => scrollToSection('features') },
        { label: 'Modules', onClick: () => scrollToSection('modules') },
        { label: 'Pricing', onClick: () => scrollToSection('pricing') },
        { label: 'About', onClick: () => scrollToSection('about') },
        { label: 'Contact', onClick: () => scrollToSection('contact') },
      ],
    },
    {
      title: 'Modules',
      links: [
        { label: 'Accounting', onClick: () => scrollToSection('modules') },
        { label: 'Sales', onClick: () => scrollToSection('modules') },
        { label: 'Purchasing', onClick: () => scrollToSection('modules') },
        { label: 'Inventory', onClick: () => scrollToSection('modules') },
        { label: 'Banking', onClick: () => scrollToSection('modules') },
        { label: 'Fixed Assets', onClick: () => scrollToSection('modules') },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Contact Us', onClick: () => scrollToSection('contact') },
      ],
    },
    {
      title: 'Contact',
      items: true,
      content: [
        { icon: <Email sx={{ fontSize: 16 }} />, text: 'info@ezeeflo.com' },
        { icon: <Phone sx={{ fontSize: 16 }} />, text: '+1 (555) 123-4567' },
        { icon: <LocationOn sx={{ fontSize: 16 }} />, text: 'Dubai, UAE' },
      ],
    },
  ];

  return (
    <Box sx={{ bgcolor: '#0f172a', color: 'white', pt: { xs: 6, md: 8 }, pb: 3 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo & Description */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box
                component="img"
                src="/images/newlogo.png"
                alt="EzeeFlo"
                sx={{ height: 36, width: 'auto' }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
                EzeeFlo <span style={{ color: '#a78bfa' }}>ERP</span>
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.8, mb: 2 }}>
              A comprehensive cloud-ready Enterprise Resource Planning solution designed to streamline your business operations. Accounting, Sales, Inventory, Banking, Fixed Assets, and more — all in one platform.
            </Typography>
            <Stack direction="row" spacing={0.5}>
              {[LinkedIn, Twitter, Facebook, Instagram].map((Icon, i) => (
                <IconButton
                  key={i}
                  size="small"
                  sx={{
                    color: '#64748b',
                    '&:hover': { color: '#a78bfa', bgcolor: 'rgba(124,58,237,0.1)' },
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <Grid item xs={6} md={2.67} key={section.title}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: '0.75rem',
                }}
              >
                {section.title}
              </Typography>
              {section.items
                ? section.content.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ color: '#a78bfa', display: 'flex' }}>{item.icon}</Box>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {item.text}
                      </Typography>
                    </Box>
                  ))
                : section.links.map((link, i) => (
                    <Link
                      key={i}
                      component="button"
                      onClick={link.onClick}
                      underline="none"
                      sx={{
                        color: '#64748b',
                        display: 'block',
                        mb: 1.2,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        '&:hover': { color: '#a78bfa' },
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.08)' }} />

        <Typography
          variant="body2"
          sx={{ color: '#475569', textAlign: 'center', fontSize: '0.8rem' }}
        >
          © {new Date().getFullYear()} EzeeFlo ERP. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
