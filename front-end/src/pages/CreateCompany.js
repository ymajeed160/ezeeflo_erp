import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  MenuItem,
  Container,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Business,
  ArrowBack,
  ArrowForward,
  Check,
  Apartment,
  Info,
  Settings,
  Assignment,
} from '@mui/icons-material';
import companyApi from '../services/companyApi';
import { fetchCompanies, setActiveCompany } from '../store/slices/companySlice';

const steps = ['Company Information', 'Business Information', 'ERP Configuration'];

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD'];
const COUNTRIES = [
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Bahrain',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Other',
];
const TIMEZONES = [
  '+04:00', '+03:00', '+05:00', '+05:30', '+06:00',
  '-05:00', '-08:00', '+00:00', '+01:00', '+02:00',
];
const INDUSTRIES = [
  'Trading', 'Manufacturing', 'Retail', 'Wholesale', 'Healthcare',
  'Construction', 'Technology', 'Services', 'Education', 'Hospitality',
  'Real Estate', 'Transportation', 'Other',
];

const CreateCompany = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Company Information
    name: '',
    subdomain: '',
    email: '',
    phone: '',
    website: '',
    taxRegistrationNumber: '',
    currency: 'AED',
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
    country: 'United Arab Emirates',
    timezone: '+04:00',

    // Step 2: Business Information
    industry: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',

    // Step 3: ERP Configuration
    baseCurrency: 'AED',
    decimalPrecision: '2',
    taxEnabled: true,
    inventoryEnabled: true,
    multiWarehouseEnabled: false,
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 0) {
      if (!formData.name.trim()) errors.name = 'Company name is required';
      if (!formData.subdomain.trim()) errors.subdomain = 'Company code is required';
      else if (!/^[a-z0-9_]+$/.test(formData.subdomain))
        errors.subdomain = 'Only lowercase letters, numbers, and underscores';
      if (!formData.email.trim()) errors.email = 'Email is required';
    } else if (step === 1) {
      if (!formData.address.trim()) errors.address = 'Address is required';
      if (!formData.city.trim()) errors.city = 'City is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        subdomain: formData.subdomain,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        currency: formData.currency,
        timezone: formData.timezone,
        fiscalYearStart: formData.fiscalYearStart,
        fiscalYearEnd: formData.fiscalYearEnd,
      };

      const response = await companyApi.createCompany(payload);
      const newCompany = response.data;

      setSuccess(true);

      // Refresh companies list and select the new company
      await dispatch(fetchCompanies());
      await dispatch(setActiveCompany(newCompany));

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step) => {
    const icons = [<Info />, <Assignment />, <Settings />];
    return icons[step] || <Info />;
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center', p: 4 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Check sx={{ fontSize: 40, color: 'success.main' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Company Created!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {formData.name} has been set up successfully with all default configurations.
          </Typography>
          <CircularProgress size={20} sx={{ mt: 2 }} />
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Redirecting to dashboard...
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Apartment sx={{ fontSize: 36, color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            Create New Company
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up a new company with default configurations
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel StepIconComponent={() => (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: index <= activeStep ? 'primary.main' : 'action.disabledBackground',
                    color: index <= activeStep ? 'white' : 'text.disabled',
                    fontSize: 18,
                  }}
                >
                  {getStepIcon(index)}
                </Box>
              )}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Step 1: Company Information */}
            {activeStep === 0 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Company Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter the basic details of your company.
                  </Typography>
                  <Divider />
                </Grid>

                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Company Name *"
                    value={formData.name}
                    onChange={handleChange('name')}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Company Code *"
                    value={formData.subdomain}
                    onChange={handleChange('subdomain')}
                    error={!!validationErrors.subdomain}
                    helperText={validationErrors.subdomain || 'e.g., abc_trading'}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={!!validationErrors.email}
                    helperText={validationErrors.email}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={handleChange('website')}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax Registration Number"
                    value={formData.taxRegistrationNumber}
                    onChange={handleChange('taxRegistrationNumber')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Base Currency"
                    value={formData.currency}
                    onChange={handleChange('currency')}
                    select
                    disabled={loading}
                  >
                    {CURRENCIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.country}
                    onChange={handleChange('country')}
                    select
                    disabled={loading}
                  >
                    {COUNTRIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Time Zone"
                    value={formData.timezone}
                    onChange={handleChange('timezone')}
                    select
                    disabled={loading}
                  >
                    {TIMEZONES.map((tz) => (
                      <MenuItem key={tz} value={tz}>UTC{tz}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fiscal Year Start (MM-DD)"
                    value={formData.fiscalYearStart}
                    onChange={handleChange('fiscalYearStart')}
                    placeholder="01-01"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fiscal Year End (MM-DD)"
                    value={formData.fiscalYearEnd}
                    onChange={handleChange('fiscalYearEnd')}
                    placeholder="12-31"
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            )}

            {/* Step 2: Business Information */}
            {activeStep === 1 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Business Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Provide your business address and industry details.
                  </Typography>
                  <Divider />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Industry"
                    value={formData.industry}
                    onChange={handleChange('industry')}
                    select
                    disabled={loading}
                  >
                    {INDUSTRIES.map((ind) => (
                      <MenuItem key={ind} value={ind}>{ind}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State / Province"
                    value={formData.state}
                    onChange={handleChange('state')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address *"
                    value={formData.address}
                    onChange={handleChange('address')}
                    multiline
                    rows={2}
                    error={!!validationErrors.address}
                    helperText={validationErrors.address}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City *"
                    value={formData.city}
                    onChange={handleChange('city')}
                    error={!!validationErrors.city}
                    helperText={validationErrors.city}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={formData.postalCode}
                    onChange={handleChange('postalCode')}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            )}

            {/* Step 3: ERP Configuration */}
            {activeStep === 2 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    ERP Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure the ERP modules and preferences for this company.
                  </Typography>
                  <Divider />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Base Currency"
                    value={formData.baseCurrency}
                    onChange={handleChange('baseCurrency')}
                    select
                    disabled={loading}
                  >
                    {CURRENCIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Decimal Precision"
                    value={formData.decimalPrecision}
                    onChange={handleChange('decimalPrecision')}
                    select
                    disabled={loading}
                  >
                    {[0, 1, 2, 3, 4].map((d) => (
                      <MenuItem key={d} value={String(d)}>{d} decimal places</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Module Preferences
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.taxEnabled}
                        onChange={handleChange('taxEnabled')}
                        disabled={loading}
                      />
                    }
                    label="Tax Enabled"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.inventoryEnabled}
                        onChange={handleChange('inventoryEnabled')}
                        disabled={loading}
                      />
                    }
                    label="Inventory Enabled"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.multiWarehouseEnabled}
                        onChange={handleChange('multiWarehouseEnabled')}
                        disabled={loading}
                      />
                    }
                    label="Multi-Warehouse"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    The following will be automatically created for this company:
                    Chart of Accounts, Roles & Permissions, Number Series,
                    Tax Rates, Default Warehouse, and System Settings.
                  </Alert>
                </Grid>
              </Grid>
            )}

          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? () => navigate('/select-company') : handleBack}
            startIcon={<ArrowBack />}
            disabled={loading}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Box>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} /> : <Check />}
                size="large"
              >
                {loading ? 'Creating...' : 'Create Company'}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateCompany;
