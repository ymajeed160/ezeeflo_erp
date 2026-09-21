import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Tabs, Tab, Avatar, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, CircularProgress, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  Refresh as RefreshIcon, Visibility as ViewIcon, FilterList as FilterIcon,
} from '@mui/icons-material';
import { fetchEmployees, fetchEmployee, createEmployee, updateEmployee, deleteEmployee, clearSelectedEmployee } from '../../store/slices/employeeSlice';
import EmployeeForm from './EmployeeForm';
import EmployeeDetail from './EmployeeDetail';
import EmployeeAssets from './EmployeeAssets';
import { showSuccess, showError } from '../../utils/toast';

const STATUS_COLORS = {
  'Active': 'success', 'Inactive': 'default', 'On Leave': 'warning',
  'Suspended': 'error', 'Terminated': 'error', 'Resigned': 'info', 'Retired': 'info',
};

const Employees = () => {
  const dispatch = useDispatch();
  const { list, pagination, loading, saving } = useSelector((state) => state.employees);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const loadData = useCallback(() => {
    dispatch(fetchEmployees({ page: page + 1, limit: rowsPerPage, search, status: statusFilter || undefined }));
  }, [dispatch, page, rowsPerPage, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(0); };
  const handleCreate = () => { setCreateOpen(true); };
  const handleEdit = (id) => { setSelectedId(id); dispatch(fetchEmployee(id)); setEditOpen(true); };
  const handleViewDetail = (id) => { setSelectedId(id); dispatch(fetchEmployee(id)); setDetailOpen(true); };
  const handleDeleteConfirm = (id) => { setSelectedId(id); setDeleteConfirmOpen(true); };

  const handleDelete = async () => {
    const r = await dispatch(deleteEmployee(selectedId));
    if (deleteEmployee.fulfilled.match(r)) { showSuccess('Deleted'); setDeleteConfirmOpen(false); setSelectedId(null); loadData(); }
    else { showError(r.payload || 'Failed'); }
  };

  const handleCreateSubmit = async (data) => {
    const r = await dispatch(createEmployee(data));
    if (createEmployee.fulfilled.match(r)) { showSuccess('Created'); setCreateOpen(false); loadData(); return true; }
    else { showError(r.payload || 'Failed'); return false; }
  };

  const handleEditSubmit = async (data) => {
    const r = await dispatch(updateEmployee({ id: selectedId, data }));
    if (updateEmployee.fulfilled.match(r)) { showSuccess('Updated'); setEditOpen(false); setSelectedId(null); dispatch(clearSelectedEmployee()); loadData(); return true; }
    else { showError(r.payload || 'Failed'); return false; }
  };

  const handleDialogClose = () => {
    setCreateOpen(false); setEditOpen(false); setDetailOpen(false);
    setDeleteConfirmOpen(false); setSelectedId(null); dispatch(clearSelectedEmployee());
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">Employees</Typography>
          <Typography variant="body1" color="text.secondary">Manage employee profiles, contracts, documents, and assets</Typography>
        </Box>
        {tabValue === 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh"><IconButton onClick={loadData}><RefreshIcon /></IconButton></Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Add Employee</Button>
          </Box>
        )}
      </Box>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Employees" />
        <Tab label="Assets" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ pb: '8px !important' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField fullWidth size="small" placeholder="Search by name, code, email..." value={search}
                    onChange={handleSearchChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="On Leave">On Leave</MenuItem><MenuItem value="Suspended">Suspended</MenuItem>
                      <MenuItem value="Terminated">Terminated</MenuItem><MenuItem value="Resigned">Resigned</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Button fullWidth variant="outlined" startIcon={<FilterIcon />} onClick={loadData}>Apply Filters</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell><TableCell>Code</TableCell><TableCell>Department</TableCell>
                        <TableCell>Designation</TableCell><TableCell>Nationality</TableCell><TableCell>Status</TableCell>
                        <TableCell>Joining Date</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {list.length === 0 ? (
                        <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No employees found</Typography></TableCell></TableRow>
                      ) : (
                        list.map((emp) => (
                          <TableRow key={emp.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(emp.id)}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: 14 }}>
                                  {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>{emp.fullName}</Typography>
                                  <Typography variant="caption" color="text.secondary">{emp.workEmail || emp.personalEmail}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell><Chip label={emp.employeeCode} size="small" variant="outlined" /></TableCell>
                            <TableCell><Typography variant="body2">{emp.department?.name || '—'}</Typography></TableCell>
                            <TableCell><Typography variant="body2">{emp.designation?.name || '—'}</Typography></TableCell>
                            <TableCell>
                              <Typography variant="body2">{emp.nationality || '—'}</Typography>
                            </TableCell>
                            <TableCell><Chip label={emp.status} size="small" color={STATUS_COLORS[emp.status] || 'default'} /></TableCell>
                            <TableCell><Typography variant="body2">{emp.joiningDate || '—'}</Typography></TableCell>
                            <TableCell align="right">
                              <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title="View"><IconButton size="small" onClick={() => handleViewDetail(emp.id)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(emp.id)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(emp.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {pagination && (
                  <TablePagination component="div" count={pagination.total || 0} page={page}
                    onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[5, 10, 25, 50]} />
                )}
              </>
            )}
          </Card>
        </Box>
      )}

      {tabValue === 1 && <EmployeeAssets />}

      <Dialog open={createOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent dividers><EmployeeForm onSubmit={handleCreateSubmit} saving={saving} /></DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={saving}>Cancel</Button>
          <Button variant="contained" type="submit" form="employee-form" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent dividers>
          <EmployeeForm onSubmit={handleEditSubmit} saving={saving}
            initialData={useSelector((state) => state.employees.selectedEmployee)} isEdit />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={saving}>Cancel</Button>
          <Button variant="contained" type="submit" form="employee-form" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Employee Details</DialogTitle>
        <DialogContent dividers>
          <EmployeeDetail employee={useSelector((state) => state.employees.selectedEmployee)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
          <Button variant="contained" onClick={() => { handleDialogClose(); handleEdit(selectedId); }}>Edit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleDialogClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
