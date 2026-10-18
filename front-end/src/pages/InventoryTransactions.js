import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableFooter, Paper, TextField, Button,
  CircularProgress, Grid, MenuItem, Chip,
  InputAdornment,
} from '@mui/material';
import {
  Search, Refresh, ArrowDownward, ArrowUpward, SwapHoriz,
} from '@mui/icons-material';
import { fetchInventoryTransactions } from '../store/slices/inventorySlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchItems } from '../store/slices/itemSlice';
import PaginationBar from '../components/PaginationBar';

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
    transactions, loading, transactionsTotal: total,
  } = useSelector((state) => state.inventory);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const { warehouses } = useSelector((state) => state.warehouses);
  const { items } = useSelector((state) => state.items);

  const loadData = useCallback(() => {
    dispatch(fetchInventoryTransactions({
      search,
      transactionType: typeFilter,
      warehouseId: warehouseFilter,
      page,
      limit,
    }));
    dispatch(fetchWarehouses({}));
    dispatch(fetchItems({}));
  }, [dispatch, search, typeFilter, warehouseFilter, page, limit]);

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

  const getItemAttributesText = (txn) => {
    const attributes = txn?.variant?.attributes;
    if (!Array.isArray(attributes)) return '';
    return attributes
      .map((a) => (a ? a.value : null))
      .filter(Boolean)
      .join(' · ');
  };

  const filtered = Array.isArray(transactions) ? transactions : [];

  // Page totals (totals of the rows currently shown)
  const pageTotals = filtered.reduce((acc, txn) => {
    const qtyIn = parseFloat(txn.quantityIn) || 0;
    const qtyOut = parseFloat(txn.quantityOut) || 0;
    const unitCost = parseFloat(txn.unitCost) || 0;
    acc.qtyIn += qtyIn;
    acc.qtyOut += qtyOut;
    acc.balance += parseFloat(txn.runningBalance) || 0;
    acc.unitCost += unitCost;
    acc.totalCost += (qtyIn - qtyOut) * unitCost;
    acc.balanceCost += (parseFloat(txn.runningBalance) || 0) * unitCost;
    return acc;
  }, { qtyIn: 0, qtyOut: 0, balance: 0, unitCost: 0, totalCost: 0, balanceCost: 0 });

  const money = (value) => (parseFloat(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
                <TableCell align="right"><strong>Balance Cost</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No transactions found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((txn) => (
                  <TableRow key={txn.id} hover>
                    <TableCell>
                      {txn.transactionDate ? new Date(txn.transactionDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{getItemName(txn.itemId)}</Typography>
                      {getItemAttributesText(txn) !== '' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {getItemAttributesText(txn)}
                        </Typography>
                      )}
                    </TableCell>
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
                    <TableCell align="right">
                      <Typography fontWeight={600}>
                        {money((parseFloat(txn.runningBalance) || 0) * (parseFloat(txn.unitCost) || 0))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filtered.length > 0 && (
              <TableFooter>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={5}>
                    <Typography fontWeight={700}>
                      Page Totals ({filtered.length} transactions)
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color="success.main">
                      {pageTotals.qtyIn.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color="error.main">
                      {pageTotals.qtyOut.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>
                      {pageTotals.balance.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{money(pageTotals.unitCost)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{money(pageTotals.balanceCost)}</Typography>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </TableContainer>
      <PaginationBar
        page={page - 1}
        pageSize={limit}
        total={total}
        onPageChange={(newPage) => setPage(newPage + 1)}
        onPageSizeChange={(newSize) => { setLimit(newSize); setPage(1); }}
        loading={loading}
      />
    </Box>
  );
};

export default InventoryTransactions;