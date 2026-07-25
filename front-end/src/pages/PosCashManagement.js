import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getCashMovements, recordCashMovement } from '../services/posApi';
import { formatCurrency } from '../utils/currency';

const PosCashManagement = () => {
  const [movements, setMovements] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ terminalId: '', sessionId: '', movementType: 'cash_in', amount: '', reason: '' });

  useEffect(() => { loadMovements(); }, []);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const res = await getCashMovements({ limit: 50 });
      setMovements(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await recordCashMovement(form);
      setDialog(false);
      loadMovements();
      alert('Cash movement recorded');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Cash Management</Typography>
        <Button variant="contained" onClick={() => setDialog(true)}>Record Movement</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Date/Time</TableCell>
              <TableCell>Cashier</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map(m => (
              <TableRow key={m.id}>
                <TableCell>
                  <Chip label={m.movementType} color={m.movementType === 'cash_in' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell>{formatCurrency(parseFloat(m.amount || 0))}</TableCell>
                <TableCell>{m.reason}</TableCell>
                <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                <TableCell>{m.cashier?.name}</TableCell>
              </TableRow>
            ))}
            {movements.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} align="center">No cash movements yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Cash Movement</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Movement Type</InputLabel>
            <Select value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })} label="Movement Type">
              <MenuItem value="cash_in">Cash In</MenuItem>
              <MenuItem value="cash_out">Cash Out</MenuItem>
              <MenuItem value="adjustment">Adjustment</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label="Amount" type="number" sx={{ mb: 2 }} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <TextField fullWidth label="Reason" multiline rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PosCashManagement;
