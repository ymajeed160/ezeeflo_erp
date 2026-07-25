import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Container,
} from '@mui/material';
import {
  Business,
  ArrowForward,
  Add,
  Apartment,
} from '@mui/icons-material';
import { fetchCompanies, selectCompany, clearCompanyError } from '../store/slices/companySlice';

const CompanySelection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { companies, loading, switching, error } = useSelector((state) => state.company);
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchCompanies());
    return () => dispatch(clearCompanyError());
  }, [dispatch]);

  // Auto-select company from URL param if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const companyIdFromUrl = params.get('companyId');
    if (companyIdFromUrl && companies.length > 0 && !switching) {
      const matchingCompany = companies.find(c => c.id === companyIdFromUrl);
      if (matchingCompany) {
        dispatch(selectCompany(matchingCompany.id)).unwrap().then(() => {
          navigate(`/app/dashboard?companyId=${matchingCompany.id}`, { replace: true });
        });
      }
    }
  }, [companies, location.search]);

  const handleSelectCompany = async (company) => {
    try {
      await dispatch(selectCompany(company.id)).unwrap();
      navigate(`/app/dashboard?companyId=${company.id}`, { replace: true });
    } catch {
      // Error is handled by the slice
    }
  };

  const handleCreateCompany = () => {
    navigate('/company/create');
  };

  if (loading) {
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Apartment sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            Select a Company
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose a company to work with, or create a new one.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearCompanyError())}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} sm={6} key={company.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '2px solid transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => theme.shadows[8],
                  },
                  opacity: switching ? 0.7 : 1,
                  position: 'relative',
                }}
                onClick={() => !switching && handleSelectCompany(company)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      src={company.logo ? `/${company.logo}` : undefined}
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        fontSize: 24,
                        fontWeight: 700,
                      }}
                    >
                      {company.name?.charAt(0).toUpperCase() || <Business />}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {company.name}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={company.code}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 12 }}
                        />
                        <Chip
                          label={company.currency}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: 12 }}
                        />
                      </Box>

                      {company.email && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {company.email}
                        </Typography>
                      )}

                      {company.isDefault && (
                        <Chip
                          label="Default"
                          size="small"
                          color="success"
                          sx={{ mt: 1, fontSize: 11 }}
                        />
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'action.hover',
                        color: 'primary.main',
                      }}
                    >
                      <ArrowForward fontSize="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {companies.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Business sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No companies found
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              You don't have any companies yet. Create one to get started.
            </Typography>
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Add />}
            onClick={handleCreateCompany}
            sx={{ px: 4, py: 1.5 }}
          >
            Create New Company
          </Button>
        </Box>

        {switching && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.3)',
              zIndex: 9999,
            }}
          >
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Loading company...</Typography>
            </Card>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CompanySelection;
