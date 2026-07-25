import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid, Switch, FormControlLabel,
  InputAdornment,
} from '@mui/material';
import {
  Add, Edit, Delete, Block, CheckCircle, Search, Refresh,
  ArrowBack, Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import {
  fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse,
  toggleWarehouseStatus, clearError, clearSelected,
} from '../store/slices/warehouseSlice';

const INITIAL_FORM = {
  code: '',
  name: '',
  description: '',
  location: '',
  managerName: '',
  contactNumber: '',
  isActive: true,
};

const Warehouses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const {
    warehouses,
    selectedWarehouse,
    loading,
    error,
  } = useSelector((state) => state.warehouses);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');

  const loadData = useCallback(() => {
    dispatch(fetchWarehouses({ search }));
  }, [dispatch, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if ((isEditing || isNew) && id) {
      const warehouse = warehouses.find((w) => w.id === id);
      if (warehouse) {
        setForm({
          code: warehouse.code || '',
          name: warehouse.name || '',
          description: warehouse.description || '',
          location: warehouse.location || '',
          managerName: warehouse.managerName || '',
          contactNumber: warehouse.contactNumber || '',
          isActive: warehouse.isActive !== false,
        });
        setDialogOpen(true);
      }
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, warehouses]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSelected());
    };
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.code.trim()) errors.code = 'Code is required';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (form.contactNumber && !/^[+]?[\d\s-()]+$/.test(form.contactNumber)) {
      errors.contactNumber = 'Invalid contact number format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isEditing && id) {
      await dispatch(updateWarehouse({ id, data: form }));
    } else {
      await dispatch(createWarehouse(form));
    }
    handleClose();
  };

  const handleClose = () => {
    setDialogOpen(false);
    setForm(INITIAL_FORM);
    setFormErrors({});
    dispatch(clearError());
    if (isEditing || isNew) navigate('/app/inventory/warehouses');
  };

  const handleDelete = async (warehouseId) => {
    await dispatch(deleteWarehouse(warehouseId));
    setDeleteConfirm(null);
    loadData();
  };

  const handleToggleStatus = async (warehouseId, currentStatus) => {
    await dispatch(toggleWarehouseStatus(warehouseId));
    loadData();
  };

  const filtered = warehouses.filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.code?.toLowerCase().includes(s) ||
      w.name?.toLowerCase().includes(s) ||
      w.location?.toLowerCase().includes(s)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Warehouses</Typography>
          <Typography variant="body2" color="text.secondary">Manage warehouse locations</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/inventory/warehouses/new')}
        >
          Add Warehouse
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search warehouses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search /></InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={8} sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Refresh />} onClick={loadData} size="small">Refresh</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Manager</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No warehouses found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((warehouse) => (
                  <TableRow key={warehouse.id} hover>
                    <TableCell>{warehouse.code}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarehouseIcon fontSize="small" color="action" />
                        {warehouse.name}
                      </Box>
                    </TableCell>
                    <TableCell>{warehouse.location || '-'}</TableCell>
                    <TableCell>{warehouse.managerName || '-'}</TableCell>
                    <TableCell>{warehouse.contactNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={warehouse.isActive ? 'Active' : 'Inactive'}
                        color={warehouse.isActive ? 'success' : 'default'}
                        size="small"
                        icon={warehouse.isActive ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/app/inventory/warehouses/${warehouse.id}/edit`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={warehouse.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          color={warehouse.isActive ? 'warning' : 'success'}
                          onClick={() => handleToggleStatus(warehouse.id, warehouse.isActive)}
                        >
                          {warehouse.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteConfirm(warehouse.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Warehouse' : 'New Warehouse'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                error={!!formErrors.code}
                helperText={formErrors.code}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Manager Name"
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                error={!!formErrors.contactNumber}
                helperText={formErrors.contactNumber}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Warehouse</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this warehouse? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Warehouses;