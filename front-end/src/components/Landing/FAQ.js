import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

const FAQS = [
  {
    q: 'What is EzeeFlo ERP?',
    a: 'EzeeFlo ERP is a comprehensive cloud-ready Enterprise Resource Planning solution designed to streamline business operations including Accounting, Sales, Purchasing, Inventory, Banking, Fixed Assets, Reporting, and more. It features multi-company, multi-tenant architecture with role-based security.',
  },
  {
    q: 'Who can use it?',
    a: 'EzeeFlo ERP is designed for businesses of all sizes — from small startups to large enterprises. It is particularly well-suited for companies in healthcare, retail, distribution, manufacturing, and professional services industries.',
  },
  {
    q: 'Does it support multiple companies?',
    a: 'Yes! EzeeFlo ERP has robust multi-company support. You can manage unlimited companies under a single installation with complete data isolation, separate configurations, and consolidated reporting across all entities.',
  },
  {
    q: 'Can it run on cloud?',
    a: 'Absolutely. EzeeFlo ERP is cloud-ready and can be deployed on any cloud platform including AWS, Azure, Google Cloud, or any hosting provider. It also supports on-premises deployment for organizations with specific data sovereignty requirements.',
  },
  {
    q: 'Does it support healthcare?',
    a: 'Yes, EzeeFlo ERP is healthcare-ready with specialized features for medical facilities, clinics, and hospitals. The architecture supports compliance with healthcare industry standards and can be customized for specific healthcare workflows.',
  },
  {
    q: 'Can I customize it?',
    a: 'Yes! EzeeFlo ERP is built with customization in mind. You can configure modules, create custom fields, set up workflows, define roles and permissions, and extend functionality through our API-first architecture.',
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

const FAQ = () => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box id="contact" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
      <Container maxWidth="md">
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              FAQ
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
              Frequently Asked{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>Questions</Box>
            </Typography>
          </Box>
        </FadeInSection>

        <FadeInSection delay={200}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            {FAQS.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === index}
                onChange={handleChange(index)}
                elevation={0}
                sx={{
                  borderBottom: index < FAQS.length - 1 ? '1px solid #e2e8f0' : 'none',
                  '&:before': { display: 'none' },
                  bgcolor: expanded === index ? '#faf5ff' : 'transparent',
                  transition: 'background-color 0.3s ease',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: expanded === index ? '#7c3aed' : '#94a3b8' }} />}
                  sx={{
                    px: 3,
                    py: 1,
                    '&:hover': { bgcolor: '#faf5ff' },
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: expanded === index ? '#7c3aed' : '#1e293b',
                      fontSize: '0.95rem',
                    }}
                  >
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </FadeInSection>
      </Container>
    </Box>
  );
};

export default FAQ;
