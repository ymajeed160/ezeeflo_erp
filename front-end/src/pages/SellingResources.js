import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress,
  Tooltip, Grid, InputAdornment, TablePagination, Tabs, Tab, FormControlLabel, Switch,
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Visibility, Clear } from '@mui/icons-material';
import {
  fetchSellingResources, createSellingResource, updateSellingResource,
  deleteSellingResource, toggleSellingResourceStatus, clearSellingResourceError,
  fetchResourceTypes, createResourceType, updateResourceType, deleteResourceType,
} from '../store/slices/sellingResourceSlice';
import { apiSuccess } from '../utils/toast';

const INITIAL_FORM = { resourceCode: '', resourceName: '', resourceTypeId: '', description: '', isActive: true };
const INITIAL_TYPE_FORM = { typeCode: '', typeName: '', description: '', isActive: true };

const SellingResources = () => {
  const dispatch = useDispatch();
  const {
    resources, resourceTypes, pagination, loading, error, saving, deleting,
  } = useSelector((state) => state.sellingResources);

  const [tab, setTab] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Resource dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);

  // Type dialog state
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [deleteTypeDialog, setDeleteTypeDialog] = useState(false);
  const [typeForm, setTypeForm] = useState(INITIAL_TYPE_FORM);
  const [editingTypeId, setEditingTypeId] = useState(null);

  const loadData = useCallback(() => {
    dispatch(fetchSellingResources({
      page: page + 1,
      limit: rowsPerPage,
      search: searchText || undefined,
    }));
  }, [dispatch, page, rowsPerPage, searchText]);

  const loadTypes = useCallback(() => {
    dispatch(fetchResourceTypes({ page: 1, limit: 200 }));
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const handleSave = async () => {
    if (!form.resourceName.trim()) return;
    const payload = { ...form };
    if (!payload.resourceCode) delete payload.resourceCode;
    if (!payload.resourceTypeId) payload.resourceTypeId = null;
    if (editingId) {
      await dispatch(updateSellingResource({ id: editingId, data: payload })).unwrap();
      apiSuccess('Selling resource updated');
    } else {
      await dispatch(createSellingResource(payload)).unwrap();
      apiSuccess('Selling resource created');
    }
    setOpenDialog(false);
    setForm(INITIAL_FORM);
    setEditingId(null);
    loadData();
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      resourceCode: row.resourceCode,
      resourceName: row.resourceName,
      resourceTypeId: row.resourceTypeId || '',
      description: row.description || '',
      isActive: row.isActive,
    });
    setOpenDialog(true);
  };

  const handleView = (row) => {
    setViewing(row);
    setViewDialog(true);
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteSellingResource(deleteTarget.id)).unwrap();
    apiSuccess('Selling resource deleted');
    setDeleteDialog(false);
    setDeleteTarget(null);
    loadData();
  };

  const handleToggle = async (row) => {
    await dispatch(toggleSellingResourceStatus(row.id)).unwrap();
    loadData();
  };

  const handleSaveType = async () => {
    if (!typeForm.typeName.trim()) return;
    if (editingTypeId) {
      await dispatch(updateResourceType({ id: editingTypeId, data: typeForm })).unwrap();
      apiSuccess('Resource type updated');
    } else {
      await dispatch(createResourceType(typeForm)).unwrap();
      apiSuccess('Resource type created');
    }
    setOpenTypeDialog(false);
    setTypeForm(INITIAL_TYPE_FORM);
    setEditingTypeId(null);
    loadTypes();
  };

  const handleDeleteType = async (row) => {
    await dispatch(deleteResourceType(row.id)).unwrap();
    apiSuccess('Resource type deleted');
    loadTypes();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>Selling Resources</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(INITIAL_FORM); setEditingId(null); setOpenDialog(true); }}>
          Add Resource
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearSellingResourceError())}>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Selling Resources" />
        <Tab label="Resource Types" />
      </Tabs>

      {tab === 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth size="small" label="Search" value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
                InputProps={{
                  endAdornment: <InputAdornment position="end"><Search /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
                ) : resources.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No selling resources found.</TableCell></TableRow>
                ) : (
                  resources.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.resourceCode}</TableCell>
                      <TableCell>{row.resourceName}</TableCell>
                      <TableCell>{row.resourceTypeName || '-'}</TableCell>
                      <TableCell>{row.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small" label={row.isActive ? 'Active' : 'Inactive'}
                          color={row.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View"><IconButton size="small" onClick={() => handleView(row)}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleToggle(row)}><Refresh fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => confirmDelete(row)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div" count={pagination.total || 0} page={page}
              onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </TableContainer>
        </>
      )}

      {tab === 1 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Button variant="outlined" startIcon={<Add />} onClick={() => { setTypeForm(INITIAL_TYPE_FORM); setEditingTypeId(null); setOpenTypeDialog(true); }}>
              Add Type
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resourceTypes.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center">No resource types found.</TableCell></TableRow>
                ) : (
                  resourceTypes.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.typeCode}</TableCell>
                      <TableCell>{row.typeName}</TableCell>
                      <TableCell>{row.description || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditingTypeId(row.id); setTypeForm({ typeCode: row.typeCode, typeName: row.typeName, description: row.description || '', isActive: row.isActive }); setOpenTypeDialog(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteType(row)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Resource create/edit dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Selling Resource' : 'Add Selling Resource'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Resource Code" value={form.resourceCode}
                helperText="Leave blank to auto-generate"
                onChange={(e) => setForm({ ...form, resourceCode: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Resource Type" value={form.resourceTypeId}
                onChange={(e) => setForm({ ...form, resourceTypeId: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {resourceTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.typeName}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth required label="Resource Name" value={form.resourceName}
                onChange={(e) => setForm({ ...form, resourceName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={saving || !form.resourceName.trim()} onClick={handleSave}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Resource Details</DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption">Code</Typography><Typography fontWeight={600}>{viewing.resourceCode}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption">Name</Typography><Typography fontWeight={600}>{viewing.resourceName}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption">Type</Typography><Typography>{viewing.resourceTypeName || '-'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption">Status</Typography><Typography>{viewing.isActive ? 'Active' : 'Inactive'}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption">Description</Typography><Typography>{viewing.description || '-'}</Typography></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)} startIcon={<Clear />}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Selling Resource</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteTarget ? `${deleteTarget.resourceCode} - ${deleteTarget.resourceName}` : ''}?
            This is a soft delete and can be restored by an administrator.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={deleting} onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Type create/edit dialog */}
      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTypeId ? 'Edit Resource Type' : 'Add Resource Type'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Type Code" value={typeForm.typeCode}
                helperText="Leave blank to auto-generate"
                onChange={(e) => setTypeForm({ ...typeForm, typeCode: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth required label="Type Name" value={typeForm.typeName}
                onChange={(e) => setTypeForm({ ...typeForm, typeName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Description" value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={typeForm.isActive} onChange={(e) => setTypeForm({ ...typeForm, isActive: e.target.checked })} />}
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTypeDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={saving || !typeForm.typeName.trim()} onClick={handleSaveType}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellingResources;
