import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Menu, MenuItem,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  InputAdornment,
} from '@mui/material';
import { Add, MoreVert, Search, Edit, Delete, Block, CheckCircle, Business } from '@mui/icons-material';
import companyApi from '../services/companyApi';
import { showSuccess, showError } from '../utils/toast';

const statusColors = {
  active: 'success', inactive: 'default', suspended: 'warning',
  trial: 'info', deleted: 'error',
};

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState({ open: false, company: null, status: '' });
  const navigate = useNavigate();

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await companyApi.getAll({ page: page + 1, limit: 20, search });
      setCompanies(data.data || []);
      setTotalPages(data.meta?.pagination?.totalPages || 1);
    } catch (err) {
      showError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleDelete = async () => {
    try {
      await companyApi.delete(selectedCompany.id);
      showSuccess('Company deleted');
      setDeleteDialog(false);
      fetchCompanies();
    } catch (err) {
      showError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusChange = async () => {
    try {
      await companyApi.updateStatus(statusDialog.company.id, statusDialog.status);
      showSuccess(`Company status changed to ${statusDialog.status}`);
      setStatusDialog({ open: false, company: null, status: '' });
      fetchCompanies();
    } catch (err) {
      showError(err.response?.data?.message || 'Status change failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Companies</Typography>
          <Typography variant="body2" color="text.secondary">Manage all tenant companies</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/superadmin/companies/new')}>
          Add Company
        </Button>
      </Box>

      <TextField
        placeholder="Search companies..." size="small"
        value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        sx={{ mb: 3, width: 300 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business color="primary" fontSize="small" />
                      <Typography fontWeight={500}>{company.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{company.code}</TableCell>
                  <TableCell>{company.email || '-'}</TableCell>
                  <TableCell>{company.country || '-'}</TableCell>
                  <TableCell>
                    <Chip label={company.status} color={statusColors[company.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={company.subscriptionStatus || 'none'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => { setSelectedCompany(company); setAnchorEl(e.currentTarget); }}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No companies found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { navigate(`/superadmin/companies/${selectedCompany?.id}/edit`); setAnchorEl(null); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setStatusDialog({ open: true, company: selectedCompany, status: 'active' }); setAnchorEl(null); }}>
          <CheckCircle fontSize="small" sx={{ mr: 1 }} /> Activate
        </MenuItem>
        <MenuItem onClick={() => { setStatusDialog({ open: true, company: selectedCompany, status: 'suspended' }); setAnchorEl(null); }}>
          <Block fontSize="small" sx={{ mr: 1 }} /> Suspend
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedCompany?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, company: null, status: '' })}>
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Change "{statusDialog.company?.name}" status to "{statusDialog.status}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, company: null, status: '' })}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" color={statusDialog.status === 'suspended' ? 'warning' : 'primary'}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;
