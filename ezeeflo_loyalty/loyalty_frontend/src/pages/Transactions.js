import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, CircularProgress, TextField, Button, Grid, Card, CardContent,
  MenuItem, FormControl, Select, InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import { Search, FilterList, Visibility, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import pointsApi from '../services/pointsApi';

const typeColors = {
  earn: 'success', redeem: 'error', reverse: 'warning', adjust: 'info',
  expire: 'default', transfer_in: 'success', transfer_out: 'error',
  bonus: 'success', welcome: 'success', referral: 'info',
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [transType, setTransType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txnRes, summaryRes] = await Promise.all([
        pointsApi.getTransactions({ page: page + 1, limit: 20, search, transactionType: transType, startDate, endDate }),
        pointsApi.getTransactionSummary({ startDate, endDate }),
      ]);
      setTransactions(txnRes.data.data || []);
      setTotalPages(txnRes.data.meta?.pagination?.totalPages || 1);
      setTotalCount(txnRes.data.meta?.pagination?.total || 0);
      setSummary(summaryRes.data.data);
    } catch (err) { /* silent */ } finally { setLoading(false); }
  }, [page, search, transType, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Point Transactions</Typography>
          <Typography variant="body2" color="text.secondary">{totalCount} transactions recorded</Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/loyalty')}>Points Operations</Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ py: '12px !important', px: 2 }}><Typography variant="h6" color="success.main" fontWeight={700}>+{summary.totalEarned?.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Points Earned</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ py: '12px !important', px: 2 }}><Typography variant="h6" color="error.main" fontWeight={700}>-{summary.totalRedeemed?.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Points Redeemed</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ py: '12px !important', px: 2 }}><Typography variant="h6" color="warning.main" fontWeight={700}>-{summary.totalExpired?.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Points Expired</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ py: '12px !important', px: 2 }}><Typography variant="h6" fontWeight={700} color={summary.netPoints >= 0 ? 'primary.main' : 'error.main'}>{summary.netPoints?.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Net Points</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField placeholder="Search..." size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ minWidth: 220 }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select value={transType} onChange={(e) => { setTransType(e.target.value); setPage(0); }} displayEmpty>
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="earn">Earn</MenuItem><MenuItem value="redeem">Redeem</MenuItem>
            <MenuItem value="reverse">Reverse</MenuItem><MenuItem value="adjust">Adjust</MenuItem>
            <MenuItem value="expire">Expire</MenuItem><MenuItem value="transfer_in">Transfer In</MenuItem>
            <MenuItem value="transfer_out">Transfer Out</MenuItem>
            <MenuItem value="bonus">Bonus</MenuItem><MenuItem value="welcome">Welcome</MenuItem>
          </Select>
        </FormControl>
        <TextField type="date" size="small" label="From" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} />
        <TextField type="date" size="small" label="To" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} />
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
      </Box>

      {/* Table */}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Type</TableCell>
                <TableCell align="right">Points</TableCell><TableCell align="right">Balance After</TableCell>
                <TableCell>Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${txn.customerId}`)}>
                  <TableCell>{new Date(txn.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{txn.customer?.firstName} {txn.customer?.lastName || ''}</Typography>
                    <Typography variant="caption" color="text.secondary">{txn.customer?.code}</Typography>
                  </TableCell>
                  <TableCell><Chip label={txn.transactionType} size="small" color={typeColors[txn.transactionType] || 'default'} /></TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600} color={txn.points > 0 ? 'success.main' : 'error.main'}>
                      {txn.points > 0 ? '+' : ''}{txn.points?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{txn.balanceAfter?.toLocaleString()}</TableCell>
                  <TableCell>{txn.source || '-'}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No transactions found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <Typography sx={{ py: 1 }}>Page {page + 1} of {totalPages}</Typography>
          <Button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        </Box>
      )}
    </Box>
  );
};

export default Transactions;
