import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getReturns, processReturn } from '../services/posApi';
import { formatCurrency } from '../utils/currency';

const PosReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [returnDialog, setReturnDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ originalSaleId: '', items: [{ originalSaleLineId: '', quantity: 1 }], refundMethod: 'cash', reason: '' });

  useEffect(() => { loadReturns(); }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturns({ limit: 50 });
      setReturns(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReturn = async () => {
    try {
      await processReturn(form);
      setReturnDialog(false);
      loadReturns();
      alert('Return processed successfully');
    } catch (err) {
      console.error('Return failed:', err);
      alert(err.response?.data?.message || 'Return failed');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Returns</Typography>
        <Button variant="contained" onClick={() => setReturnDialog(true)}>New Return</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Return #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Original Invoice</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Refund Method</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returns.map(ret => (
              <TableRow key={ret.id}>
                <TableCell><Chip label={ret.returnNumber} size="small" /></TableCell>
                <TableCell>{ret.returnDate}</TableCell>
                <TableCell>{ret.originalInvoiceNumber}</TableCell>
                <TableCell>{ret.customer?.name}</TableCell>
                <TableCell>{formatCurrency(parseFloat(ret.grandTotal || 0))}</TableCell>
                <TableCell><Chip label={ret.refundMethod} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={ret.status} color={ret.status === 'completed' ? 'success' : 'default'} size="small" /></TableCell>
              </TableRow>
            ))}
            {returns.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7} align="center">No returns found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={returnDialog} onClose={() => setReturnDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Return</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Original Invoice Number" sx={{ mb: 2, mt: 1 }} onChange={(e) => setForm({ ...form, originalSaleId: e.target.value })} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Refund Method</InputLabel>
            <Select value={form.refundMethod} onChange={(e) => setForm({ ...form, refundMethod: e.target.value })} label="Refund Method">
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="account_credit">Account Credit</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label="Reason" multiline rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitReturn}>Process Return</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PosReturnsPage;
