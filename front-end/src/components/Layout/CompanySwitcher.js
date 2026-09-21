import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Business,
  Check,
  Add,
  SwitchAccount,
} from '@mui/icons-material';
import { switchCompany, fetchCompanies } from '../../store/slices/companySlice';

const CompanySwitcher = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeCompany, companies, switching } = useSelector((state) => state.company);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // Refresh companies list
    dispatch(fetchCompanies());
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchCompany = async (company) => {
    if (company.id === activeCompany?.id) {
      handleClose();
      return;
    }
    try {
      await dispatch(switchCompany(company.id)).unwrap();
      // Directly update localStorage so the new company ID is available after page reload
      const persistedState = JSON.parse(localStorage.getItem('persist:root') || '{}');
      if (persistedState.company) {
        const companyState = JSON.parse(persistedState.company);
        companyState.activeCompanyId = company.id;
        companyState.activeCompany = company;
        persistedState.company = JSON.stringify(companyState);
        localStorage.setItem('persist:root', JSON.stringify(persistedState));
      }
      // Force a full page reload with companyId in URL to ensure the correct company context
      window.location.href = `/app/dashboard?companyId=${company.id}`;
    } catch {
      // Error handled by slice
    }
    handleClose();
  };

  const handleCreateCompany = () => {
    handleClose();
    navigate('/company/create');
  };

  if (!activeCompany) return null;

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={switching}
        sx={{
          textTransform: 'none',
          color: 'inherit',
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          '&:hover': { bgcolor: 'action.hover' },
          maxWidth: 240,
        }}
        startIcon={
          <Avatar
            src={activeCompany.logo ? `/${activeCompany.logo}` : undefined}
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'primary.main',
              fontSize: 14,
              fontWeight: 700,
              '& img': { objectFit: 'contain', width: '100%', height: '100%' },
            }}
          >
            {activeCompany.name?.charAt(0).toUpperCase() || <Business sx={{ fontSize: 16 }} />}
          </Avatar>
        }
        endIcon={<SwitchAccount sx={{ fontSize: 18, opacity: 0.6 }} />}
      >
        <Box sx={{ textAlign: 'left', minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ lineHeight: 1.2, fontSize: 13 }}
          >
            {activeCompany.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ lineHeight: 1.2, fontSize: 11 }}
          >
            {activeCompany.code} · {activeCompany.currency}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxWidth: 320,
            minWidth: 280,
            mt: 1,
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            Switch Company
          </Typography>
        </Box>
        <Divider />

        {switching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          companies.map((company) => (
            <MenuItem
              key={company.id}
              onClick={() => handleSwitchCompany(company)}
              selected={company.id === activeCompany?.id}
              sx={{ px: 2, py: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar
                  src={company.logo ? `/${company.logo}` : undefined}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor:
                      company.id === activeCompany?.id ? 'primary.main' : 'action.hover',
                    fontSize: 14,
                    fontWeight: 700,
                    color: company.id === activeCompany?.id ? 'white' : 'text.primary',
                    '& img': { objectFit: 'contain', width: '100%', height: '100%' },
                  }}
                >
                  {company.name?.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {company.name}
                    </Typography>
                    {company.isDefault && (
                      <Chip label="Default" size="small" color="success" sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {company.code} · {company.currency}
                  </Typography>
                }
              />
              {company.id === activeCompany?.id && (
                <Check fontSize="small" color="primary" />
              )}
            </MenuItem>
          ))
        )}

        <Divider />
        <MenuItem onClick={handleCreateCompany} sx={{ px: 2, py: 1.5 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight={500}>
                Create New Company
              </Typography>
            }
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default CompanySwitcher;
