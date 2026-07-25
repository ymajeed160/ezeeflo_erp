import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, CircularProgress, Tooltip, TablePagination, Card,
  CardContent, Divider, InputAdornment, Autocomplete, MenuItem,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, Visibility,
  Send, ThumbUp, ThumbDown, Clear, ArrowBack, Receipt,
} from '@mui/icons-material';
import {
  fetchPurchaseRequests, fetchPurchaseRequestById, createPurchaseRequest, updatePurchaseRequest,
  deletePurchaseRequest, submitPurchaseRequest, approvePurchaseRequest,
  rejectPurchaseRequest, clearError, clearSelected,
} from '../store/slices/purchaseRequestSlice';
import { fetchItems } from '../store/slices/itemSlice';

const INITIAL_FORM = {
  requestDate: new Date().toISOString().split('T')[0],
  requestedBy: '',
  department: '',
  notes: '',
  details: [],
};

const STATUS_COLORS = {
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  converted: 'info',
};

const PurchaseRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isView = location.pathname.includes('/view');
  const isEdit = location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isForm = isNew || isEdit || isView;

  const {
    list, total, page, limit, selected, loading, error,
  } = useSelector((state) => state.purchaseRequests);
  const items = useSelector((state) => state.items?.items || []);
  const currentUser = useSelector((state) => state.auth?.user);

  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);

  const loadData = useCallback((query = {}) => {
    dispatch(fetchPurchaseRequests({
      page: query.page || currentPage + 1,
      limit: query.limit || rowsPerPage,
      search: query.search !== undefined ? query.search : searchTerm,
      status: query.status !== undefined ? query.status : statusFilter,
    }));
  }, [dispatch, currentPage, rowsPerPage, searchTerm, statusFilter]);

  useEffect(() => {
    if (!isForm) {
      loadData();
      dispatch(fetchItems({ limit: 10000 }));
    }
  }, [dispatch, isForm, loadData, fetchItems]);

  useEffect(() => {
    if (isForm && id) {
      const existing = list.find((r) => r.id === id);
      if (existing && existing.details) {
        setForm({
          requestDate: existing.requestDate ? existing.requestDate.split('T')[0] : '',
          requestedBy: existing.requestedBy || '',
          department: existing.department || '',
          notes: existing.notes || '',
          details: existing.details.map((d) => ({
            id: d.id,
            itemId: d.itemId || '',
            item: d.item || null,
            description: d.description || '',
            quantity: d.quantity || 0,
            requiredDate: d.requiredDate ? d.requiredDate.split('T')[0] : '',
            sortOrder: d.sortOrder || 0,
          })),
        });
      }
    } else if (isNew) {
      setForm({ ...INITIAL_FORM, requestedBy: currentUser?.id || '' });
    }
  }, [id, isForm, isNew, list, currentUser]);

  // Fetch the full record when entering view/edit mode
  useEffect(() => {
    if (isForm && id && !isNew) {
      dispatch(fetchPurchaseRequestById(id));
    }
  }, [dispatch, isForm, id, isNew]);

  // Populate form when selected data arrives from fetchPurchaseRequestById
  useEffect(() => {
    if (selected && isForm && id && !form.details.length) {
      if (selected.details) {
        setForm({
          requestDate: selected.requestDate ? selected.requestDate.split('T')[0] : '',
          requestedBy: selected.requestedBy || '',
          department: selected.department || '',
          notes: selected.notes || '',
          details: selected.details.map((d) => ({
            id: d.id,
            itemId: d.itemId || '',
            item: d.item || null,
            description: d.description || '',
            quantity: d.quantity || 0,
            requiredDate: d.requiredDate ? d.requiredDate.split('T')[0] : '',
            sortOrder: d.sortOrder || 0,
          })),
        });
      }
    }
  }, [selected, isForm, id, form.details.length]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSelected());
    };
  }, [dispatch]);

  const handleSearch = () => {
    setCurrentPage(0);
    loadData({ page: 1, search: searchTerm, status: statusFilter });
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(0);
    dispatch(fetchPurchaseRequests({ page: 1, limit: rowsPerPage }));
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    loadData({ page: newPage + 1 });
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setCurrentPage(0);
    loadData({ page: 1, limit: newLimit });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.requestDate) errors.requestDate = 'Request date is required';
    if (!form.details || form.details.length === 0) {
      errors.details = 'At least one detail line is required';
    } else {
      form.details.forEach((d, i) => {
        if (!d.itemId) errors[`detail_${i}_item`] = 'Item is required';
        if (!d.quantity || parseFloat(d.quantity) <= 0)
          errors[`detail_${i}_qty`] = 'Quantity > 0 required';
      });
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const payload = {
      ...form,
      requestedBy: currentUser?.id || form.requestedBy,
      details: form.details.map((d) => ({
        itemId: d.itemId,
        description: d.description,
        quantity: parseFloat(d.quantity),
        requiredDate: d.requiredDate || null,
        sortOrder: d.sortOrder,
      })),
    };
    let result;
    if (isEdit && id) {
      result = await dispatch(updatePurchaseRequest({ id, data: payload }));
    } else {
      result = await dispatch(createPurchaseRequest(payload));
    }
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/app/purchases/purchase-requests');
    }
  };

  const handleDelete = (record) => {
    setDeleteTarget(record);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await dispatch(deletePurchaseRequest(deleteTarget.id));
    }
    setDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleAddLine = () => {
    setForm((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          itemId: '',
          item: null,
          description: '',
          quantity: 1,
          requiredDate: '',
          sortOrder: prev.details.length,
        },
      ],
    }));
  };

  const handleRemoveLine = (index) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const handleLineChange = (index, field, value) => {
    setForm((prev) => {
      const details = [...prev.details];
      if (field === 'item') {
        details[index] = {
          ...details[index],
          itemId: value ? value.id : '',
          item: value,
          description: value ? value.name : '',
        };
      } else {
        details[index] = { ...details[index], [field]: value };
      }
      return { ...prev, details };
    });
  };

  const handleSubmit = (reqId) => {
    dispatch(submitPurchaseRequest(reqId));
  };

  const handleApprove = (reqId) => {
    dispatch(approvePurchaseRequest(reqId));
  };

  const handleReject = (reqId) => {
    dispatch(rejectPurchaseRequest(reqId));
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading && isForm && id && !selected) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isForm) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/purchases/purchase-requests')}
          >
            Back
          </Button>
          <Typography variant="h5" fontWeight={600}>
            {isNew ? 'New Purchase Request' : isEdit ? 'Edit Purchase Request' : 'View Purchase Request'}
          </Typography>
          {selected && (
            <Chip
              label={selected.status?.toUpperCase()}
              color={STATUS_COLORS[selected.status] || 'default'}
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {typeof error === 'string' ? error : error.message || 'An error occurred'}
            {error.errors && error.errors.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {error.errors.map((e, i) => (
                  <Typography key={i} variant="body2">• {typeof e === 'string' ? e : e.message || JSON.stringify(e)}</Typography>
                ))}
              </Box>
            )}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Header Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Request Number"
                  value={selected?.requestNumber || 'Auto-generated'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Request Date"
                  type="date"
                  value={form.requestDate}
                  onChange={(e) => setForm({ ...form, requestDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled={isView}
                  error={!!formErrors.requestDate}
                  helperText={formErrors.requestDate}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Requested By"
                  value={isNew ? (currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || '' : form.requestedBy) : (selected?.requestor ? `${selected.requestor.firstName || ''} ${selected.requestor.lastName || ''}`.trim() || selected.requestor.username : form.requestedBy)}
                  fullWidth
                  disabled
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  fullWidth
                  disabled={isView}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={isView}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Detail Lines
              </Typography>
              {!isView && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddLine}
                  size="small"
                >
                  Add Line
                </Button>
              )}
            </Box>
            {formErrors.details && (
              <Alert severity="error" sx={{ mb: 2 }}>{formErrors.details}</Alert>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Required Date</TableCell>
                    {!isView && <TableCell align="center">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isView ? 5 : 6} align="center">
                        No detail lines added.
                      </TableCell>
                    </TableRow>
                  ) : (
                    form.details.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          {isView ? (
                            line.item?.name || line.itemId
                          ) : (
                            <Autocomplete
                              size="small"
                              options={items}
                              getOptionLabel={(opt) => opt.name || ''}
                              value={line.item || null}
                              onChange={(e, val) => handleLineChange(index, 'item', val)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  error={!!formErrors[`detail_${index}_item`]}
                                  helperText={formErrors[`detail_${index}_item`]}
                                />
                              )}
                              disabled={isView}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                            fullWidth
                            disabled={isView}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                            fullWidth
                            disabled={isView}
                            error={!!formErrors[`detail_${index}_qty`]}
                            helperText={formErrors[`detail_${index}_qty`]}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 160 }}>
                          <TextField
                            size="small"
                            type="date"
                            value={line.requiredDate}
                            onChange={(e) => handleLineChange(index, 'requiredDate', e.target.value)}
                            fullWidth
                            disabled={isView}
                            InputLabelProps={{ shrink: true }}
                          />
                        </TableCell>
                        {!isView && (
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveLine(index)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/app/purchases/purchase-requests')}
          >
            {isView ? 'Back to List' : 'Cancel'}
          </Button>
          {!isView && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : null}
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Purchase Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/purchases/purchase-requests/new')}
        >
          New Request
        </Button>
      </Box>

      {/* Search & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleSearch}>
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Status"
                select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                  loadData({ page: 1, status: e.target.value });
                }}
                fullWidth
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="converted">Converted</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                fullWidth
                size="small"
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {typeof error === 'string' ? error : error.message || 'An error occurred'}
          {error.errors && error.errors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {error.errors.map((e, i) => (
                <Typography key={i} variant="body2">• {typeof e === 'string' ? e : e.message || JSON.stringify(e)}</Typography>
              ))}
            </Box>
          )}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Request #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Line Items</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No purchase requests found.
                </TableCell>
              </TableRow>
            ) : (
              list.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.requestNumber}</TableCell>
                  <TableCell>{formatDate(row.requestDate)}</TableCell>
                  <TableCell>{row.requestor ? `${row.requestor.firstName} ${row.requestor.lastName}`.trim() : row.requestedBy}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status?.toUpperCase()}
                      color={STATUS_COLORS[row.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.details?.length || 0}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/app/purchases/purchase-requests/${row.id}/view`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {row.status === 'draft' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/app/purchases/purchase-requests/${row.id}/edit`)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Submit">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleSubmit(row.id)}
                            >
                              <Send fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(row)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {row.status === 'submitted' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(row.id)}
                            >
                              <ThumbUp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleReject(row.id)}
                            >
                              <ThumbDown fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {row.status === 'approved' && (
                        <Tooltip title="Convert to Purchase Order">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => navigate(`/app/purchases/orders/new?fromRequest=${row.id}`)}
                          >
                            <Receipt fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={currentPage}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete Purchase Request{' '}
          <strong>{deleteTarget?.requestNumber}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseRequests;