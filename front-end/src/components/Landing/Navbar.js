import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Typography,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const NAV_ITEMS = [
  { label: 'Home', href: '#hero' },
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // Detect active section
      const sections = NAV_ITEMS.map(item => item.href.replace('#', ''));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setDrawerOpen(false);
    if (href.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const drawerContent = (
    <Box sx={{ width: 280, height: '100%', bgcolor: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/images/newlogo.png" alt="EzeeFlo" sx={{ height: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            EzeeFlo <span style={{ color: '#7c3aed' }}>ERP</span>
          </Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ px: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => handleNavClick(item.href)}
              sx={{
                borderRadius: 2,
                my: 0.5,
                color: activeSection === item.href.replace('#', '') ? '#7c3aed' : '#475569',
                bgcolor: activeSection === item.href.replace('#', '') ? '#f5f3ff' : 'transparent',
                '&:hover': { bgcolor: '#f5f3ff', color: '#7c3aed' },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => { setDrawerOpen(false); navigate('/login'); }}
          sx={{
            bgcolor: '#7c3aed',
            '&:hover': { bgcolor: '#6d28d9' },
            borderRadius: 2,
            py: 1.2,
          }}
        >
          Sign In
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => { setDrawerOpen(false); handleNavClick('#demo'); }}
          sx={{
            borderColor: '#7c3aed',
            color: '#7c3aed',
            '&:hover': { borderColor: '#6d28d9', bgcolor: '#f5f3ff' },
            borderRadius: 2,
            py: 1.2,
          }}
        >
          Book Demo
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 2 : 0}
        sx={{
          bgcolor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 0 } }}>
            {/* Logo */}
            <Box
              onClick={() => handleNavClick('#hero')}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            >
              <Box
                component="img"
                src="/images/newlogo.png"
                alt="EzeeFlo"
                sx={{ height: 36, width: 'auto' }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: scrolled ? '#1e293b' : 'white',
                  transition: 'color 0.3s ease',
                }}
              >
                EzeeFlo{' '}
                <Box component="span" sx={{ color: scrolled ? '#7c3aed' : '#a78bfa' }}>
                  ERP
                </Box>
              </Typography>
            </Box>

            {/* Desktop Menu */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    sx={{
                      color: scrolled ? '#475569' : 'rgba(255,255,255,0.9)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: activeSection === item.href.replace('#', '') ? '60%' : '0%',
                        height: 2,
                        borderRadius: 1,
                        bgcolor: scrolled ? '#7c3aed' : '#a78bfa',
                        transition: 'width 0.3s ease',
                      },
                      '&:hover': {
                        bgcolor: scrolled ? '#f5f3ff' : 'rgba(255,255,255,0.1)',
                        color: scrolled ? '#7c3aed' : 'white',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Right Side Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isMobile && (
                <>
                  <Button
                    variant="text"
                    onClick={() => navigate('/login')}
                    sx={{
                      color: scrolled ? '#475569' : 'rgba(255,255,255,0.9)',
                      fontWeight: 600,
                      '&:hover': { bgcolor: scrolled ? '#f5f3ff' : 'rgba(255,255,255,0.1)', color: scrolled ? '#7c3aed' : 'white' },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleNavClick('#demo')}
                    sx={{
                      bgcolor: '#2563eb',
                      '&:hover': { bgcolor: '#1d4ed8' },
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                    }}
                  >
                    Book Demo
                  </Button>
                </>
              )}
              {isMobile && (
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  sx={{ color: scrolled ? '#1e293b' : 'white' }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navbar;
