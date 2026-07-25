import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  CircularProgress, Grid, MenuItem, Chip,
  InputAdornment,
} from '@mui/material';
import {
  Search, Refresh, Inventory,
} from '@mui/icons-material';
import { fetchInventoryBalances } from '../store/slices/inventorySlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchItems } from '../store/slices/itemSlice';

const InventoryBalances = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const {
    balances, loading,
  } = useSelector((state) => state.inventory);
  const { warehouses } = useSelector((state) => state.warehouses);
  const { items } = useSelector((state) => state.items);

  const loadData = useCallback(() => {
    dispatch(fetchInventoryBalances({ search, warehouseId: warehouseFilter }));
    dispatch(fetchWarehouses({}));
    dispatch(fetchItems({}));
  }, [dispatch, search, warehouseFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getItemName = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    return item ? `${item.itemCode} - ${item.name}` : 'Unknown Item';
  };

  const getWarehouseName = (warehouseId) => {
    const w = warehouses.find((w) => w.id === warehouseId);
    return w ? w.name : 'Unknown Warehouse';
  };

  const filtered = Array.isArray(balances) ? balances.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      getItemName(b.itemId).toLowerCase().includes(s) ||
      getWarehouseName(b.warehouseId).toLowerCase().includes(s)
    );
  }) : [];

  // Calculate totals
  const totalItems = filtered.length;
  const totalQuantity = filtered.reduce((sum, b) => sum + (parseFloat(b.quantityOnHand) || 0), 0);
  const totalValue = filtered.reduce((sum, b) => sum + ((parseFloat(b.quantityOnHand) || 0) * (parseFloat(b.averageCost) || 0)), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Inventory Balances</Typography>
          <Typography variant="body2" color="text.secondary">Current stock levels by item and warehouse</Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} color="primary">{totalItems}</Typography>
            <Typography variant="body2" color="text.secondary">Stock Items</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {totalQuantity.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Quantity On Hand</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} color="primary">
              {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Inventory Value</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by item or warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search /></InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Warehouse"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <MenuItem value="">All Warehouses</MenuItem>
              {Array.isArray(warehouses) && warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </TextField>
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
                <TableCell><strong>Item</strong></TableCell>
                <TableCell><strong>Warehouse</strong></TableCell>
                <TableCell align="right"><strong>Quantity On Hand</strong></TableCell>
                <TableCell align="right"><strong>Average Cost</strong></TableCell>
                <TableCell align="right"><strong>Total Value</strong></TableCell>
                <TableCell><strong>Last Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Inventory sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No inventory balances found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((balance) => {
                  const value = (parseFloat(balance.quantityOnHand) || 0) * (parseFloat(balance.averageCost) || 0);
                  const isLow = balance.reorderLevel && parseFloat(balance.quantityOnHand) <= parseFloat(balance.reorderLevel);
                  return (
                    <TableRow key={balance.id} hover sx={isLow ? { bgcolor: 'warning.light' } : {}}>
                      <TableCell>{getItemName(balance.itemId)}</TableCell>
                      <TableCell>
                        <Chip label={getWarehouseName(balance.warehouseId)} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <Typography fontWeight={600}>
                            {parseFloat(balance.quantityOnHand || 0).toLocaleString()}
                          </Typography>
                          {isLow && (
                            <Chip label="Low" size="small" color="warning" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {parseFloat(balance.averageCost || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>
                          {value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {balance.lastUpdated ? new Date(balance.lastUpdated).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default InventoryBalances;