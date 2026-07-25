import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Button,
  CircularProgress, Grid, MenuItem, Chip,
  InputAdornment,
} from '@mui/material';
import {
  Search, Refresh, ArrowDownward, ArrowUpward, SwapHoriz,
} from '@mui/icons-material';
import { fetchInventoryTransactions } from '../store/slices/inventorySlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchItems } from '../store/slices/itemSlice';

const TRANSACTION_COLORS = {
  Purchase: 'success',
  Sale: 'error',
  Adjustment: 'warning',
  'Transfer In': 'info',
  'Transfer Out': 'info',
  'Opening Balance': 'default',
  Return: 'secondary',
};

const InventoryTransactions = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const {
    transactions, loading,
  } = useSelector((state) => state.inventory);
  const { warehouses } = useSelector((state) => state.warehouses);
  const { items } = useSelector((state) => state.items);

  const loadData = useCallback(() => {
    dispatch(fetchInventoryTransactions({
      search,
      transactionType: typeFilter,
      warehouseId: warehouseFilter,
    }));
    dispatch(fetchWarehouses({}));
    dispatch(fetchItems({}));
  }, [dispatch, search, typeFilter, warehouseFilter]);

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

  const filtered = Array.isArray(transactions) ? transactions : [];

  const TRANSACTION_TYPES = [
    'Purchase', 'Sale', 'Adjustment', 'Transfer In', 'Transfer Out', 'Opening Balance', 'Return',
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Inventory Transactions</Typography>
          <Typography variant="body2" color="text.secondary">Complete inventory movement audit trail</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search /></InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Transaction Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {TRANSACTION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
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
          <Grid item xs={12} sm={3} sx={{ display: 'flex', gap: 1 }}>
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Item</strong></TableCell>
                <TableCell><strong>Warehouse</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Reference</strong></TableCell>
                <TableCell align="right"><strong>Qty In</strong></TableCell>
                <TableCell align="right"><strong>Qty Out</strong></TableCell>
                <TableCell align="right"><strong>Balance</strong></TableCell>
                <TableCell align="right"><strong>Unit Cost</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No transactions found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((txn) => (
                  <TableRow key={txn.id} hover>
                    <TableCell>
                      {txn.transactionDate ? new Date(txn.transactionDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{getItemName(txn.itemId)}</TableCell>
                    <TableCell>
                      <Chip label={getWarehouseName(txn.warehouseId)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={txn.transactionType}
                        color={TRANSACTION_COLORS[txn.transactionType] || 'default'}
                        size="small"
                        icon={
                          (txn.quantityIn > 0 && txn.quantityOut === 0) ? <ArrowDownward /> :
                          (txn.quantityOut > 0 && txn.quantityIn === 0) ? <ArrowUpward /> :
                          <SwapHoriz />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {txn.referenceType ? `${txn.referenceType} #${txn.referenceId}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {txn.quantityIn > 0 ? (
                        <Typography color="success.main" fontWeight={600}>
                          {parseFloat(txn.quantityIn).toLocaleString()}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {txn.quantityOut > 0 ? (
                        <Typography color="error.main" fontWeight={600}>
                          {parseFloat(txn.quantityOut).toLocaleString()}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>
                        {parseFloat(txn.runningBalance || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {txn.unitCost
                        ? parseFloat(txn.unitCost).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default InventoryTransactions;