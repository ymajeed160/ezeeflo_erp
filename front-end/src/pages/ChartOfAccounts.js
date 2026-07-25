import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Switch, FormControlLabel, Alert, CircularProgress, Tooltip, Tabs, Tab,
  Autocomplete,
} from '@mui/material';
import {
  Add, Edit, Delete, Block, CheckCircle, AccountTree, ViewList,
  ExpandMore, ExpandLess,
} from '@mui/icons-material';
import {
  fetchAccounts, fetchAccountTree, createAccount, updateAccount,
  deleteAccount, toggleAccountStatus, clearError,
} from '../store/slices/accountSlice';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const typeColors = {
  asset: 'primary',
  liability: 'warning',
  equity: 'success',
  revenue: 'info',
  expense: 'error',
};

const ChartOfAccounts = () => {
  const dispatch = useDispatch();
  const { items: accounts, tree, loading, error } = useSelector((state) => state.accounts);
  const activeCompanyId = useSelector((state) => state.company?.activeCompanyId);

  const [tabValue, setTabValue] = useState(0); // 0 = list, 1 = tree
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '', code: '', type: 'asset', description: '', parentAccountId: '', isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // Expand/collapse state for tree view
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  // Build a flat lookup of descendant IDs for circular reference prevention
  const descendantIds = useMemo(() => {
    if (!editItem) return new Set();
    const ids = new Set();
    const walk = (node) => {
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          ids.add(child.id);
          walk(child);
        }
      }
    };
    // Find the node in the tree matching editItem
    const findAndWalk = (treeNodes) => {
      if (!treeNodes) return;
      const nodes = Array.isArray(treeNodes) ? treeNodes : [treeNodes];
      for (const node of nodes) {
        if (node.id === editItem.id) {
          walk(node);
          return;
        }
        findAndWalk(node.children);
      }
    };
    if (tree) findAndWalk(tree);
    return ids;
  }, [editItem, tree]);

  // Build parent account options from flat accounts list, excluding self and descendants
  const parentAccountOptions = useMemo(() => {
    const excludeIds = new Set(descendantIds);
    if (editItem) excludeIds.add(editItem.id);
    return [
      { id: '', label: 'None (Root Account)', code: '', name: '', type: '' },
      ...accounts
        .filter((a) => !excludeIds.has(a.id))
        .map((a) => ({
          id: a.id,
          label: `${a.code} - ${a.name} (${a.type.toUpperCase()})`,
          code: a.code,
          name: a.name,
          type: a.type,
        })),
    ];
  }, [accounts, descendantIds, editItem]);

  // Selected parent option for Autocomplete
  const parentValue = useMemo(() => {
    if (!form.parentAccountId) return parentAccountOptions[0];
    return parentAccountOptions.find((opt) => opt.id === form.parentAccountId) || parentAccountOptions[0];
  }, [form.parentAccountId, parentAccountOptions]);

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchAccountTree());
  }, [dispatch, activeCompanyId]);

  const handleOpen = useCallback((account = null) => {
    if (account) {
      setEditItem(account);
      setForm({
        name: account.name,
        code: account.code,
        type: account.type,
        description: account.description || '',
        parentAccountId: account.parentAccountId || '',
        isActive: account.isActive,
        openingBalance: account.openingBalance != null ? Number(account.openingBalance) : 0,
      });
    } else {
      setEditItem(null);
      setForm({ name: '', code: '', type: 'asset', description: '', parentAccountId: '', isActive: true, openingBalance: 0 });
    }
    setFormErrors({});
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Account name is required';
    if (!form.code.trim()) errors.code = 'Account code is required';
    if (!form.type) errors.type = 'Account type is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      type: form.type,
      description: form.description?.trim() || null,
      parentAccountId: form.parentAccountId || null,
      isActive: form.isActive,
      openingBalance: parseFloat(form.openingBalance) || 0,
    };
    if (editItem) {
      dispatch(updateAccount({ id: editItem.id, data: payload }));
    } else {
      dispatch(createAccount(payload));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this account? This may affect child accounts.')) {
      dispatch(deleteAccount(id));
    }
  };

  const handleToggleStatus = (id) => {
    dispatch(toggleAccountStatus(id));
  };

  const hasChildren = useCallback((node) => {
    return node.children && Array.isArray(node.children) && node.children.length > 0;
  }, []);

  const toggleExpand = useCallback((nodeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
        // When collapsing, also remove children from collapsed set so they reset
        setCollapsedIds((cPrev) => {
          const cNext = new Set(cPrev);
          cNext.delete(nodeId);
          return cNext;
        });
      } else {
        next.add(nodeId);
        setCollapsedIds((cPrev) => {
          const cNext = new Set(cPrev);
          cNext.delete(nodeId);
          return cNext;
        });
      }
      return next;
    });
  }, []);

  // Recursive tree rendering with expand/collapse
  const renderTreeRow = useCallback((node, level = 0) => {
    if (!node) return null;
    const canExpand = hasChildren(node);
    const isExpanded = expandedIds.has(node.id);
    const indentPx = level * 28;

    return (
      <React.Fragment key={node.id}>
        <TableRow
          hover
          sx={{
            '&:hover': { bgcolor: 'action.hover' },
            bgcolor: level === 0 ? 'action.hover' : 'transparent',
          }}
        >
          <TableCell sx={{ pl: `${indentPx + 16}px` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {canExpand ? (
                <IconButton
                  size="small"
                  onClick={() => toggleExpand(node.id)}
                  sx={{ p: 0, mr: 0.5 }}
                >
                  {isExpanded ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <ExpandMore fontSize="small" />
                  )}
                </IconButton>
              ) : (
                <Box sx={{ width: 28, flexShrink: 0 }} />
              )}
              <Typography fontWeight={level === 0 ? 700 : 500} sx={{ fontSize: level === 0 ? '0.925rem' : '0.875rem' }}>
                {node.name}
              </Typography>
            </Box>
          </TableCell>
          <TableCell>
            <Chip label={node.code} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </TableCell>
          <TableCell>
            <Chip
              label={node.type.toUpperCase()}
              size="small"
              color={typeColors[node.type] || 'default'}
              sx={{ fontWeight: 500, textTransform: 'capitalize' }}
            />
          </TableCell>
          <TableCell>{node.description || '-'}</TableCell>
          <TableCell>
            <Chip
              icon={node.isActive ? <CheckCircle /> : <Block />}
              label={node.isActive ? 'Active' : 'Inactive'}
              size="small"
              color={node.isActive ? 'success' : 'error'}
            />
          </TableCell>
          <TableCell align="center">
            <Tooltip title="Edit">
              <IconButton onClick={() => handleOpen(node)} size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Status">
              <IconButton onClick={() => handleToggleStatus(node.id)} size="small">
                {node.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(node.id)} size="small" color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
        {canExpand && isExpanded && node.children.map((child) => renderTreeRow(child, level + 1))}
      </React.Fragment>
    );
  }, [hasChildren, expandedIds, toggleExpand, handleOpen, handleToggleStatus, handleDelete]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Chart of Accounts</Typography>
          <Typography variant="body2" color="text.secondary">Manage your accounting chart of accounts</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ minHeight: 40 }}>
            <Tab icon={<ViewList />} label="List" iconPosition="start" sx={{ minHeight: 40, py: 0 }} />
            <Tab icon={<AccountTree />} label="Tree" iconPosition="start" sx={{ minHeight: 40, py: 0 }} />
          </Tabs>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen(null)}>
            Add Account
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Account Name</strong></TableCell>
              <TableCell><strong>Code</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center" sx={{ width: 140 }}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress sx={{ my: 3 }} />
                </TableCell>
              </TableRow>
            ) : tabValue === 0 ? (
              // List View
              accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No accounts found. Click "Add Account" to create one.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{account.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={account.code} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.type.toUpperCase()}
                        size="small"
                        color={typeColors[account.type] || 'default'}
                        sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{account.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={account.isActive ? <CheckCircle /> : <Block />}
                        label={account.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={account.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpen(account)} size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Toggle Status">
                        <IconButton onClick={() => handleToggleStatus(account.id)} size="small">
                          {account.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(account.id)} size="small" color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )
            ) : (
              // Tree View
              !tree || (Array.isArray(tree) && tree.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No account tree loaded. Click "Add Account" to create one.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(tree) ? tree : [tree]).map((rootNode) => renderTreeRow(rootNode))
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Account' : 'Add New Account'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Account Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
              />
              <TextField
                label="Account Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                error={!!formErrors.code}
                helperText={formErrors.code}
                fullWidth
              />
            </Box>
            <TextField
              select
              label="Account Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              error={!!formErrors.type}
              helperText={formErrors.type}
              fullWidth
            >
              {ACCOUNT_TYPES.map((t) => (
                <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                  {t.toUpperCase()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <Autocomplete
              options={parentAccountOptions}
              value={parentValue}
              onChange={(_, newValue) => {
                setForm({ ...form, parentAccountId: newValue?.id || '' });
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parent Account"
                  helperText="Select a parent account, or 'None' for a root account"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {option.id ? (
                      <>
                        <Chip label={option.code} size="small" variant="outlined" sx={{ fontWeight: 600, minWidth: 50 }} />
                        <Typography>{option.name}</Typography>
                        <Chip label={option.type} size="small" color={typeColors[option.type] || 'default'} sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }} />
                      </>
                    ) : (
                      <Typography fontStyle="italic" color="text.secondary">{option.label}</Typography>
                    )}
                  </Box>
                </li>
              )}
              disableClearable
              fullWidth
            />
            <TextField
              label="Opening Balance"
              type="number"
              value={form.openingBalance}
              onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
              inputProps={{ step: '0.01' }}
              helperText="Initial balance for this account"
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChartOfAccounts;