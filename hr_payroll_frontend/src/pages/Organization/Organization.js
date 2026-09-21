import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button, TextField,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, CircularProgress, InputAdornment, FormControlLabel,
  Checkbox, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Refresh as RefreshIcon,
  Business as DeptIcon, Badge as DesigIcon, LocationCity as BranchIcon,
  AccountBalance as CCIcon,
} from '@mui/icons-material';
import {
  fetchDepartments, createDepartment, updateDepartment, deleteDepartment,
  fetchDesignations, createDesignation, updateDesignation, deleteDesignation,
  fetchBranches, createBranch, updateBranch, deleteBranch,
  fetchCostCenters, createCostCenter, updateCostCenter, deleteCostCenter,
} from '../../store/slices/orgSlices';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { showSuccess, showError } from '../../utils/toast';

// ── Country list ──
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambodia', 'Cameroon', 'Canada', 'Chad', 'Chile', 'China', 'Colombia', 'Congo', 'Costa Rica', "Côte d'Ivoire",
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway',
  'Oman',
  'Pakistan', 'Palestine', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia',
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'UAE', 'Uganda', 'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
];

// ── Grade list ──
const GRADES = [
  'Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior',
  'Lead', 'Principal', 'Supervisor', 'Assistant Manager',
  'Manager', 'Senior Manager', 'Head of Department',
  'Associate Director', 'Director', 'Senior Director',
  'Vice President', 'Senior VP', 'C-Level',
];

// ── Configuration for each tab ──
const ENTITY_CONFIG = {
  departments: {
    label: 'Departments', icon: <DeptIcon />,
    thunks: { fetch: fetchDepartments, create: createDepartment, update: updateDepartment, remove: deleteDepartment },
    columns: ['Code', 'Name', 'Parent Dept', 'Branch', 'Manager', 'Status', 'Actions'],
    fields: (item) => [
      item.code, item.name,
      item.parent?.name || '—',
      item.branch?.name || '—',
      item.manager?.name || '—',
    ],
    formFields: [
      { name: 'code', label: 'Code *', type: 'text', required: true },
      { name: 'name', label: 'Name *', type: 'text', required: true },
      { name: 'nameAr', label: 'Arabic Name', type: 'text' },
      { name: 'parentId', label: 'Parent Department', type: 'select', optionsKey: 'departments' },
      { name: 'branchId', label: 'Branch', type: 'select', optionsKey: 'branches' },
      { name: 'managerId', label: 'Manager', type: 'select', optionsKey: 'employees' },
      { name: 'description', label: 'Description', type: 'multiline' },
      { name: 'sortOrder', label: 'Sort Order', type: 'number' },
    ],
  },
  designations: {
    label: 'Designations', icon: <DesigIcon />,
    thunks: { fetch: fetchDesignations, create: createDesignation, update: updateDesignation, remove: deleteDesignation },
    columns: ['Code', 'Name', 'Department', 'Grade', 'Status', 'Actions'],
    fields: (item) => [
      item.code, item.name,
      item.department?.name || '—',
      item.grade || '—',
    ],
    formFields: [
      { name: 'code', label: 'Code *', type: 'text', required: true },
      { name: 'name', label: 'Name *', type: 'text', required: true },
      { name: 'nameAr', label: 'Arabic Name', type: 'text' },
      { name: 'departmentId', label: 'Department', type: 'select', optionsKey: 'departments' },
      { name: 'grade', label: 'Grade', type: 'select', options: GRADES },
      { name: 'description', label: 'Description', type: 'multiline' },
      { name: 'sortOrder', label: 'Sort Order', type: 'number' },
    ],
  },
  branches: {
    label: 'Branches', icon: <BranchIcon />,
    thunks: { fetch: fetchBranches, create: createBranch, update: updateBranch, remove: deleteBranch },
    columns: ['Code', 'Name', 'City', 'Country', 'Phone', 'Head Office', 'Status', 'Actions'],
    fields: (item) => [
      item.code, item.name,
      item.city || '—',
      item.country || '—',
      item.phone || '—',
    ],
    formFields: [
      { name: 'code', label: 'Code *', type: 'text', required: true },
      { name: 'name', label: 'Name *', type: 'text', required: true },
      { name: 'nameAr', label: 'Arabic Name', type: 'text' },
      { name: 'address', label: 'Address', type: 'multiline' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'country', label: 'Country', type: 'select', options: COUNTRIES },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'isHeadOffice', label: 'Head Office', type: 'checkbox' },
    ],
  },
  costCenters: {
    label: 'Cost Centers', icon: <CCIcon />,
    thunks: { fetch: fetchCostCenters, create: createCostCenter, update: updateCostCenter, remove: deleteCostCenter },
    columns: ['Code', 'Name', 'Department', 'Status', 'Actions'],
    fields: (item) => [
      item.code, item.name,
      item.department?.name || '—',
    ],
    formFields: [
      { name: 'code', label: 'Code *', type: 'text', required: true },
      { name: 'name', label: 'Name *', type: 'text', required: true },
      { name: 'nameAr', label: 'Arabic Name', type: 'text' },
      { name: 'departmentId', label: 'Department', type: 'select', optionsKey: 'departments' },
      { name: 'description', label: 'Description', type: 'multiline' },
    ],
  },
};

const Organization = () => {
  const dispatch = useDispatch();
  const [tabKey, setTabKey] = useState('departments');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});

  const getSliceState = (key) => {
    const map = {
      departments: (s) => s.departments,
      designations: (s) => s.designations,
      branches: (s) => s.branches,
      costCenters: (s) => s.costCenters,
      employees: (s) => s.employees,
    };
    return useSelector(map[key]) || { list: [], loading: false, saving: false };
  };

  const sliceState = getSliceState(tabKey);
  const config = ENTITY_CONFIG[tabKey];

  // Fetch branches and employees for dropdown options
  const branchesState = useSelector((s) => s.branches) || { list: [] };
  const employeesState = useSelector((s) => s.employees) || { list: [] };
  const departmentsState = useSelector((s) => s.departments) || { list: [] };

  useEffect(() => {
    dispatch(fetchBranches({ limit: 1000 }));
    dispatch(fetchEmployees({ limit: 1000 }));
    dispatch(fetchDepartments({ limit: 1000 }));
  }, [dispatch]);

  const loadData = useCallback(() => {
    dispatch(config.thunks.fetch({ page: page + 1, limit: rowsPerPage, search: search || undefined }));
  }, [dispatch, tabKey, page, rowsPerPage, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTabChange = (e, val) => {
    setTabKey(val); setPage(0); setSearch('');
  };

  const handleCreate = () => {
    setFormData({ isActive: true });
    setEditMode(false);
    setSelectedId(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setFormData({ ...item });
    setEditMode(true);
    setSelectedId(item.id);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = (id) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    const r = await dispatch(config.thunks.remove(selectedId));
    if (config.thunks.remove.fulfilled.match(r)) {
      showSuccess('Deleted successfully');
      setDeleteOpen(false);
      loadData();
    } else {
      showError(r.payload || 'Failed to delete');
    }
  };

  const handleSubmit = async () => {
    const data = { ...formData };
    if (!data.isActive) data.isActive = true;

    if (editMode) {
      const r = await dispatch(config.thunks.update({ id: selectedId, data }));
      if (config.thunks.update.fulfilled.match(r)) {
        showSuccess('Updated successfully');
        setDialogOpen(false);
        loadData();
      } else {
        showError(r.payload || 'Failed to update');
      }
    } else {
      const r = await dispatch(config.thunks.create(data));
      if (config.thunks.create.fulfilled.match(r)) {
        showSuccess('Created successfully');
        setDialogOpen(false);
        loadData();
      } else {
        showError(r.payload || 'Failed to create');
      }
    }
  };

  const { list = [], loading, saving } = sliceState;
  const pagination = sliceState.pagination || { total: 0 };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Organization Structure</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage departments, designations, branches, and cost centers
      </Typography>

      {/* Tabs */}
      <Tabs value={tabKey} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => (
          <Tab key={key} value={key} icon={cfg.icon} label={cfg.label} iconPosition="start" />
        ))}
      </Tabs>

      {/* Toolbar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '8px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField fullWidth size="small" placeholder={`Search ${config.label.toLowerCase()}...`} value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button>
            </Grid>
            <Grid item xs={6} md={2}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Add</Button>
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
                    {config.columns.map(col => (
                      <TableCell key={col} sx={{ fontWeight: 600 }}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow><TableCell colSpan={config.columns.length} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No {config.label.toLowerCase()} found</Typography>
                    </TableCell></TableRow>
                  ) : (
                    list.map((item) => (
                      <TableRow key={item.id} hover>
                        {config.fields(item).map((val, i) => (
                          <TableCell key={i}><Typography variant="body2">{val}</Typography></TableCell>
                        ))}
                        {tabKey === 'branches' && (
                          <TableCell align="center">
                            {item.isHeadOffice ? (
                              <Chip label="Yes" size="small" color="primary" variant="outlined" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip label={item.isActive ? 'Active' : 'Inactive'} size="small"
                            color={item.isActive ? 'success' : 'default'} variant="filled" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(item)}>
                              <EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(item.id)}>
                              <DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={pagination.total || 0} page={page}
              onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]} />
          </>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? `Edit ${config.label.slice(0, -1)}` : `Add ${config.label.slice(0, -1)}`}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {config.formFields.map((field) => {
              const optionsMap = {
                branches: branchesState.list,
                employees: employeesState.list,
                departments: departmentsState.list,
              };
              return (
              <Grid item xs={12} sm={field.type === 'multiline' ? 12 : 6} key={field.name}>
                {field.type === 'checkbox' ? (
                  <FormControlLabel
                    control={<Checkbox checked={!!formData[field.name]} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })} />}
                    label={field.label}
                  />
                ) : field.type === 'select' ? (
                  <TextField
                    select
                    fullWidth size="small"
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.required}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {field.options
                      ? field.options.map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))
                      : (optionsMap[field.optionsKey] || []).map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.name || opt.fullName || opt.code || opt.id}
                          </MenuItem>
                        ))}
                  </TextField>
                ) : (
                  <TextField
                    fullWidth size="small"
                    label={field.label}
                    type={field.type === 'number' ? 'number' : 'text'}
                    multiline={field.type === 'multiline'}
                    rows={field.type === 'multiline' ? 3 : 1}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.required}
                  />
                )}
              </Grid>
            )})}
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={formData.isActive !== false} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : (editMode ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure? This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Organization;
