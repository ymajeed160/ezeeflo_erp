import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TablePagination, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  fetchAssets, createAsset, updateAsset, deleteAsset, clearError,
} from '../../store/slices/employeeAssetSlice';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';
import { showSuccess, showError } from '../../utils/toast';

const ASSET_TYPES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'mobile_phone', label: 'Mobile Phone' },
  { value: 'sim_card', label: 'SIM Card' },
  { value: 'access_card', label: 'Access Card' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS = {
  assigned: 'success',
  returned: 'default',
  lost: 'error',
  damaged: 'warning',
};

const INITIAL_FORM = {
  employeeId: '',
  assetName: '',
  assetType: 'other',
  assetCode: '',
  serialNumber: '',
  brand: '',
  model: '',
  assignedDate: new Date().toISOString().split('T')[0],
  returnDate: '',
  status: 'assigned',
  remarks: '',
};

const EmployeeAssets = () => {
  const dispatch = useDispatch();
  const { list, pagination, loading, saving, error } = useSelector((s) => s.employeeAssets || { list: [], pagination: null, loading: false, saving: false, error: null });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadData = useCallback(() => {
    dispatch(fetchAssets({
      page: page + 1,
      limit: rowsPerPage,
      search: search || undefined,
      assetType: typeFilter || undefined,
    }));
  }, [dispatch, page, rowsPerPage, search, typeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenCreate = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData(INITIAL_FORM);
    setOpenDialog(true);
  };

  const handleOpenEdit = (asset) => {
    setIsEdit(true);
    setEditId(asset.id);
    setFormData({
      employeeId: asset.employeeId || '',
      assetName: asset.assetName || '',
      assetType: asset.assetType || 'other',
      assetCode: asset.assetCode || '',
      serialNumber: asset.serialNumber || '',
      brand: asset.brand || '',
      model: asset.model || '',
      assignedDate: asset.assignedDate || '',
      returnDate: asset.returnDate || '',
      status: asset.status || 'assigned',
      remarks: asset.remarks || '',
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.employeeId || !formData.assetName) {
      showError('Please select an employee and enter asset name');
      return;
    }
    let result;
    if (isEdit) {
      result = await dispatch(updateAsset({ id: editId, data: formData }));
    } else {
      result = await dispatch(createAsset(formData));
    }
    if (createAsset.fulfilled.match(result) || updateAsset.fulfilled.match(result)) {
      showSuccess(isEdit ? 'Asset updated' : 'Asset assigned');
      setOpenDialog(false);
      loadData();
    } else {
      showError(result.payload || 'Operation failed');
    }
  };

  const handleDeleteConfirm = (id) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteAsset(deleteId));
    if (deleteAsset.fulfilled.match(result)) {
      showSuccess('Asset deleted');
      setDeleteConfirmOpen(false);
      setDeleteId(null);
    } else {
      showError(result.payload || 'Delete failed');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Employee Assets</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={loadData}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Assign Asset</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '8px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" placeholder="Search by asset name, code, serial..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Asset Type</InputLabel>
                <Select value={typeFilter} label="Asset Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
                  <MenuItem value="">All Types</MenuItem>
                  {ASSET_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Assigned Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>No assets assigned</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((asset) => (
                      <TableRow key={asset.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{asset.assetName}</Typography>
                          {asset.serialNumber && <Typography variant="caption" color="text.secondary">S/N: {asset.serialNumber}</Typography>}
                        </TableCell>
                        <TableCell>{asset.assetCode || '-'}</TableCell>
                        <TableCell>{ASSET_TYPES.find((t) => t.value === asset.assetType)?.label || asset.assetType}</TableCell>
                        <TableCell>{asset.employee?.name || '-'}</TableCell>
                        <TableCell>{asset.assignedDate || '-'}</TableCell>
                        <TableCell>
                          <Chip label={asset.status} size="small" color={STATUS_COLORS[asset.status] || 'default'} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(asset)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteConfirm(asset.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {pagination && (
              <TablePagination component="div" count={pagination.total || 0} page={page} rowsPerPage={rowsPerPage}
                onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
            )}
          </>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Asset' : 'Assign New Asset'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <EmployeeSelect value={formData.employeeId} onChange={(v) => setFormData({ ...formData, employeeId: v })} label="Employee *" required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Asset Name *" value={formData.assetName} onChange={(e) => setFormData({ ...formData, assetName: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Asset Type</InputLabel>
                <Select value={formData.assetType} label="Asset Type" onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}>
                  {ASSET_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Asset Code" value={formData.assetCode} onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })} helperText="Auto-generated if empty" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Serial Number" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Assigned Date" type="date" value={formData.assignedDate}
                onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Return Date" type="date" value={formData.returnDate || ''}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="returned">Returned</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                  <MenuItem value="damaged">Damaged</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Remarks" multiline rows={2} value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this asset? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeAssets;
