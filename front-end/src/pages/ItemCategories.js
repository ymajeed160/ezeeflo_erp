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
  fetchItemCategories, fetchItemCategoryTree, createItemCategory, updateItemCategory,
  deleteItemCategory, toggleItemCategoryStatus, clearError,
} from '../store/slices/itemCategorySlice';

const ItemCategories = () => {
  const dispatch = useDispatch();
  const { items: categories, tree, loading, error } = useSelector((state) => state.itemCategories);

  const [tabValue, setTabValue] = useState(0); // 0 = list, 1 = tree
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', parentCategoryId: '', isActive: true,
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

  // Build parent category options from flat categories list, excluding self and descendants
  const parentCategoryOptions = useMemo(() => {
    const excludeIds = new Set(descendantIds);
    if (editItem) excludeIds.add(editItem.id);
    return [
      { id: '', label: 'None (Root Category)', name: '' },
      ...categories
        .filter((c) => !excludeIds.has(c.id))
        .map((c) => ({
          id: c.id,
          label: c.name,
          name: c.name,
        })),
    ];
  }, [categories, descendantIds, editItem]);

  const parentValue = useMemo(() => {
    if (!form.parentCategoryId) return parentCategoryOptions[0];
    return parentCategoryOptions.find((opt) => opt.id === form.parentCategoryId) || parentCategoryOptions[0];
  }, [form.parentCategoryId, parentCategoryOptions]);

  useEffect(() => {
    dispatch(fetchItemCategories());
    dispatch(fetchItemCategoryTree());
  }, [dispatch]);

  const handleOpen = useCallback((category = null) => {
    if (category) {
      setEditItem(category);
      setForm({
        name: category.name,
        description: category.description || '',
        parentCategoryId: category.parentCategoryId || '',
        isActive: category.isActive,
      });
    } else {
      setEditItem(null);
      setForm({ name: '', description: '', parentCategoryId: '', isActive: true });
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
    if (!form.name.trim()) errors.name = 'Category name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      parentCategoryId: form.parentCategoryId || null,
      isActive: form.isActive,
    };
    if (editItem) {
      dispatch(updateItemCategory({ id: editItem.id, data: payload }));
    } else {
      dispatch(createItemCategory(payload));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category? This may affect child categories.')) {
      dispatch(deleteItemCategory(id));
    }
  };

  const handleToggleStatus = (id) => {
    dispatch(toggleItemCategoryStatus(id));
  };

  const hasChildren = useCallback((node) => {
    return node.children && Array.isArray(node.children) && node.children.length > 0;
  }, []);

  const toggleExpand = useCallback((nodeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
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

  // Recursive tree rendering
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
          <Typography variant="h4" fontWeight={700}>Item Categories</Typography>
          <Typography variant="body2" color="text.secondary">Manage item categories with unlimited hierarchy levels</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ minHeight: 40 }}>
            <Tab icon={<ViewList />} label="List" iconPosition="start" sx={{ minHeight: 40, py: 0 }} />
            <Tab icon={<AccountTree />} label="Tree" iconPosition="start" sx={{ minHeight: 40, py: 0 }} />
          </Tabs>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen(null)}>
            Add Category
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
              <TableCell><strong>Category Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center" sx={{ width: 140 }}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress sx={{ my: 3 }} />
                </TableCell>
              </TableRow>
            ) : tabValue === 0 ? (
              // List View
              categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No categories found. Click "Add Category" to create one.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{category.name}</Typography>
                    </TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={category.isActive ? <CheckCircle /> : <Block />}
                        label={category.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={category.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpen(category)} size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Toggle Status">
                        <IconButton onClick={() => handleToggleStatus(category.id)} size="small">
                          {category.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(category.id)} size="small" color="error">
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
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No category tree loaded. Click "Add Category" to create one.</Typography>
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
        <DialogTitle>{editItem ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Category Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <Autocomplete
              options={parentCategoryOptions}
              value={parentValue}
              onChange={(_, newValue) => {
                setForm({ ...form, parentCategoryId: newValue?.id || '' });
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parent Category"
                  helperText="Select a parent category, or 'None' for a root category"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.id ? (
                    <Typography>{option.name}</Typography>
                  ) : (
                    <Typography fontStyle="italic" color="text.secondary">{option.label}</Typography>
                  )}
                </li>
              )}
              disableClearable
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

export default ItemCategories;