import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  MenuItem,
  Checkbox,
  ListItemText,
  Select,
  OutlinedInput,
  Chip,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  useMediaQuery,
  useTheme,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle,
  Send,
  RestartAlt,
  Schedule,
  Security,
  Group,
  SupportAgent,
  LocationOn,
  Email,
  Phone,
  AccessTime,
} from '@mui/icons-material';

const COUNTRIES = [
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Bahrain',
  'Egypt', 'Jordan', 'Lebanon', 'Morocco', 'Tunisia', 'Algeria',
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia',
  'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal',
  'Nigeria', 'Kenya', 'South Africa', 'Ghana',
  'Other',
];

const INDUSTRIES = [
  'Healthcare / Medical', 'Retail / E-commerce', 'Distribution / Wholesale',
  'Manufacturing', 'Construction', 'Real Estate', 'Hospitality',
  'Education', 'Technology', 'Financial Services', 'Pharmaceutical',
  'Logistics / Transportation', 'Agriculture', 'Non-Profit', 'Government',
  'Consulting', 'Other',
];

const COMPANY_SIZES = [
  '1-10 Employees', '11-50 Employees', '51-200 Employees',
  '201-500 Employees', '501-1000 Employees', '1000+ Employees',
];

const MODULES = [
  'Accounting', 'Sales', 'Purchasing', 'Inventory',
  'Banking', 'Fixed Assets', 'Reports',
  'Healthcare', 'Manufacturing', 'Trading',
];

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const FEATURE_HIGHLIGHTS = [
  'Accounting', 'Sales', 'Purchasing', 'Inventory',
  'Banking', 'Fixed Assets', 'Reporting', 'Multi-Company', 'AI Ready',
];

const TRUST_INDICATORS = [
  { icon: <CheckCircle sx={{ fontSize: 18 }} />, label: 'Free Demo' },
  { icon: <Security sx={{ fontSize: 18 }} />, label: 'No Credit Card Required' },
  { icon: <Group sx={{ fontSize: 18 }} />, label: 'Personalized Session' },
  { icon: <SupportAgent sx={{ fontSize: 18 }} />, label: 'Product Specialist' },
];

const OFFICE_INFO = [
  { icon: <LocationOn sx={{ fontSize: 16 }} />, label: 'Dubai, UAE' },
  { icon: <Email sx={{ fontSize: 16 }} />, label: 'demo@ezeeflo.com' },
  { icon: <Phone sx={{ fontSize: 16 }} />, label: '+971 4 123 4567' },
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

const initialFormState = {
  fullName: '',
  companyName: '',
  businessEmail: '',
  phoneNumber: '',
  country: '',
  industry: '',
  companySize: '',
  interestedModules: [],
  preferredDate: '',
  preferredTime: '',
  message: '',
};

const validateForm = (form) => {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  if (!form.companyName.trim()) errors.companyName = 'Company name is required';
  if (!form.businessEmail.trim()) {
    errors.businessEmail = 'Business email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) {
    errors.businessEmail = 'Please enter a valid email address';
  }
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
  if (!form.country) errors.country = 'Please select your country';
  if (!form.industry) errors.industry = 'Please select your industry';
  if (!form.companySize) errors.companySize = 'Please select company size';
  if (form.interestedModules.length === 0) errors.interestedModules = 'Please select at least one module';
  if (!form.preferredDate) errors.preferredDate = 'Please select a preferred date';
  if (!form.preferredTime) errors.preferredTime = 'Please select a preferred time';
  return errors;
};

const DemoRequestSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (field) => (e) => {
    const value = e.target?.value ?? e;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleModulesChange = (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, interestedModules: value }));
    if (errors.interestedModules) setErrors((prev) => ({ ...prev, interestedModules: '' }));
  };

  const handleReset = () => {
    setForm(initialFormState);
    setErrors({});
    setSubmitted(false);
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError('');

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Box
      id="demo"
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      }}
    >
      <Container maxWidth="lg">
        <FadeInSection>
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="overline"
              sx={{ color: '#7c3aed', fontWeight: 600, letterSpacing: 2, fontSize: '0.75rem' }}
            >
              REQUEST A DEMO
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
              Request a{' '}
              <Box component="span" sx={{ color: '#7c3aed' }}>Personalized Demo</Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', maxWidth: 600, mx: 'auto', fontSize: '1.05rem' }}
            >
              See how EzeeFlo ERP can transform your business operations with an interactive product demonstration tailored to your organization.
            </Typography>
          </Box>
        </FadeInSection>

        <Grid container spacing={5} alignItems="flex-start">
          {/* Left Column — Info */}
          <Grid item xs={12} md={5}>
            <FadeInSection delay={200}>
              {/* Feature Highlights */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  mb: 3,
                  background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: '#1e293b', mb: 2.5, fontSize: '1rem' }}
                >
                  What You'll See
                </Typography>
                <Grid container spacing={1}>
                  {FEATURE_HIGHLIGHTS.map((feature) => (
                    <Grid item xs={6} sm={4} key={feature}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, py: 0.3 }}>
                        <CheckCircle sx={{ fontSize: 16, color: '#22c55e', flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, fontSize: '0.78rem' }}>
                          {feature}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Trust Indicators */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: '#1e293b', mb: 2, fontSize: '1rem' }}
                >
                  Why Request a Demo?
                </Typography>
                <Stack spacing={1.5}>
                  {TRUST_INDICATORS.map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ color: '#7c3aed', display: 'flex' }}>{item.icon}</Box>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Office Contact */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: 'white', mb: 2, fontSize: '1rem' }}
                >
                  Get In Touch
                </Typography>
                <Stack spacing={1.5}>
                  {OFFICE_INFO.map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ color: '#a78bfa', display: 'flex' }}>{item.icon}</Box>
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Animated illustration placeholder */}
              {!isMobile && (
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: 3,
                    border: '1px dashed #e2e8f0',
                    textAlign: 'center',
                    bgcolor: '#faf5ff',
                  }}
                >
                  <Box
                    sx={{
                      fontSize: '3rem',
                      mb: 1,
                      animation: 'gentle-float 3s ease-in-out infinite',
                      '@keyframes gentle-float': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-8px)' },
                      },
                    }}
                  >
                    🚀
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Schedule your personalized demo today
                  </Typography>
                </Box>
              )}
            </FadeInSection>
          </Grid>

          {/* Right Column — Form */}
          <Grid item xs={12} md={7}>
            <FadeInSection delay={300}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                }}
              >
                {submitted ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: '#f0fdf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 40, color: '#22c55e' }} />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}
                    >
                      Thank You!
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: '#64748b', mb: 3, maxWidth: 400, mx: 'auto', lineHeight: 1.7 }}
                    >
                      Thank you for your interest! Our team will contact you shortly to schedule your personalized demo.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      sx={{
                        borderColor: '#7c3aed',
                        color: '#7c3aed',
                        '&:hover': { borderColor: '#6d28d9', bgcolor: '#f5f3ff' },
                        borderRadius: 2,
                        px: 4,
                      }}
                    >
                      Submit Another Request
                    </Button>
                  </Box>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {submitError && (
                      <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>
                    )}

                    <Grid container spacing={2.5}>
                      {/* Full Name */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name *"
                          value={form.fullName}
                          onChange={handleChange('fullName')}
                          error={!!errors.fullName}
                          helperText={errors.fullName}
                          size="small"
                        />
                      </Grid>

                      {/* Company Name */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Company Name *"
                          value={form.companyName}
                          onChange={handleChange('companyName')}
                          error={!!errors.companyName}
                          helperText={errors.companyName}
                          size="small"
                        />
                      </Grid>

                      {/* Business Email */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Business Email *"
                          type="email"
                          value={form.businessEmail}
                          onChange={handleChange('businessEmail')}
                          error={!!errors.businessEmail}
                          helperText={errors.businessEmail}
                          size="small"
                        />
                      </Grid>

                      {/* Phone Number */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number *"
                          value={form.phoneNumber}
                          onChange={handleChange('phoneNumber')}
                          error={!!errors.phoneNumber}
                          helperText={errors.phoneNumber}
                          size="small"
                        />
                      </Grid>

                      {/* Country */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Country *"
                          value={form.country}
                          onChange={handleChange('country')}
                          error={!!errors.country}
                          helperText={errors.country}
                          size="small"
                        >
                          {COUNTRIES.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Industry */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Industry *"
                          value={form.industry}
                          onChange={handleChange('industry')}
                          error={!!errors.industry}
                          helperText={errors.industry}
                          size="small"
                        >
                          {INDUSTRIES.map((ind) => (
                            <MenuItem key={ind} value={ind}>{ind}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Company Size */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Company Size *"
                          value={form.companySize}
                          onChange={handleChange('companySize')}
                          error={!!errors.companySize}
                          helperText={errors.companySize}
                          size="small"
                        >
                          {COMPANY_SIZES.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Preferred Date */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Preferred Demo Date *"
                          type="date"
                          value={form.preferredDate}
                          onChange={handleChange('preferredDate')}
                          error={!!errors.preferredDate}
                          helperText={errors.preferredDate}
                          size="small"
                          InputProps={{
                            inputProps: { min: today },
                            startAdornment: (
                              <InputAdornment position="start">
                                <Schedule sx={{ fontSize: 18, color: '#94a3b8' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      {/* Preferred Time */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Preferred Time *"
                          value={form.preferredTime}
                          onChange={handleChange('preferredTime')}
                          error={!!errors.preferredTime}
                          helperText={errors.preferredTime}
                          size="small"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTime sx={{ fontSize: 18, color: '#94a3b8' }} />
                              </InputAdornment>
                            ),
                          }}
                        >
                          {TIME_SLOTS.map((t) => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Interested Modules (Multi Select) */}
                      <Grid item xs={12}>
                        <FormControl fullWidth size="small" error={!!errors.interestedModules}>
                          <InputLabel id="modules-label">Interested Modules *</InputLabel>
                          <Select
                            labelId="modules-label"
                            multiple
                            value={form.interestedModules}
                            onChange={handleModulesChange}
                            input={<OutlinedInput label="Interested Modules *" />}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                  <Chip
                                    key={value}
                                    label={value}
                                    size="small"
                                    sx={{
                                      bgcolor: '#f5f3ff',
                                      color: '#7c3aed',
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          >
                            {MODULES.map((mod) => (
                              <MenuItem key={mod} value={mod}>
                                <Checkbox checked={form.interestedModules.indexOf(mod) > -1} size="small" />
                                <ListItemText primary={mod} />
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.interestedModules && (
                            <FormHelperText>{errors.interestedModules}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Preferred Date + Time on mobile (combined row) */}
                      <Grid item xs={12} sm={6} sx={{ display: { xs: 'none', sm: 'none' } }} />

                      {/* Message */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Message (Optional)"
                          multiline
                          rows={3}
                          value={form.message}
                          onChange={handleChange('message')}
                          size="small"
                          placeholder="Tell us about your business requirements..."
                        />
                      </Grid>

                      {/* Buttons */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                            sx={{
                              bgcolor: '#7c3aed',
                              '&:hover': { bgcolor: '#6d28d9' },
                              px: 4,
                              py: 1.3,
                              borderRadius: 2,
                              fontWeight: 600,
                              minWidth: 180,
                            }}
                          >
                            {submitting ? 'Sending...' : 'Request Demo'}
                          </Button>
                          <Button
                            type="button"
                            variant="outlined"
                            size="large"
                            onClick={handleReset}
                            startIcon={<RestartAlt />}
                            sx={{
                              borderColor: '#e2e8f0',
                              color: '#64748b',
                              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                              px: 4,
                              py: 1.3,
                              borderRadius: 2,
                              fontWeight: 600,
                            }}
                          >
                            Reset
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </form>
                )}
              </Paper>
            </FadeInSection>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DemoRequestSection;
