import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { getSessions, closeSession, getSessionSummary } from '../services/posApi';
import { formatCurrency } from '../utils/currency';

const PosEndOfDay = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [closeDialog, setCloseDialog] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const res = await getSessions({ status: 'open', limit: 50 });
      setSessions(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      await closeSession(selectedSession.id, { actualCash: parseFloat(actualCash) || 0, closingNotes: 'End of day closure' });
      setCloseDialog(false);
      loadSessions();
      alert('Session closed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close session');
    } finally {
      setLoading(false);
    }
  };

  const viewSummary = async (session) => {
    try {
      const res = await getSessionSummary(session.id);
      setSummary(res.data?.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>End of Day</Typography>

      {summary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Session Summary - {summary.sessionNumber}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Opening Cash</Typography>
                <Typography variant="h6">{formatCurrency(summary.openingCash)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Cash Sales</Typography>
                <Typography variant="h6">{formatCurrency(summary.summary?.cashSales)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Card Sales</Typography>
                <Typography variant="h6">{formatCurrency(summary.summary?.cardSales)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Total Sales</Typography>
                <Typography variant="h6">{formatCurrency(summary.summary?.totalSales)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Cash In</Typography>
                <Typography variant="h6">{formatCurrency(summary.summary?.cashIn)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Cash Out</Typography>
                <Typography variant="h6">{formatCurrency(summary.summary?.cashOut)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Refunds</Typography>
                <Typography variant="h6">{'-' + formatCurrency(summary.summary?.refunds)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Transactions</Typography>
                <Typography variant="h6">{summary.totalTransactions}</Typography>
              </Grid>
            </Grid>
            
            <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle1" fontWeight="bold">Expected Cash: {formatCurrency(summary.expectedCash)}</Typography>
              <Typography variant="subtitle1" fontWeight="bold">Actual Cash: {formatCurrency(summary.actualCash)}</Typography>
              <Typography variant="subtitle1" fontWeight="bold" color={summary.cashDifference >= 0 ? 'success.main' : 'error.main'}>
                Difference: {formatCurrency(summary.cashDifference)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Session #</TableCell>
              <TableCell>Terminal</TableCell>
              <TableCell>Cashier</TableCell>
              <TableCell>Opened</TableCell>
              <TableCell>Sales Count</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map(s => (
              <TableRow key={s.id}>
                <TableCell><Chip label={s.sessionNumber} size="small" /></TableCell>
                <TableCell>{s.terminal?.terminalName}</TableCell>
                <TableCell>{s.cashier?.name}</TableCell>
                <TableCell>{new Date(s.openingDate).toLocaleString()}</TableCell>
                <TableCell>{s.totalSalesCount}</TableCell>
                <TableCell><Chip label={s.status} color={s.status === 'open' ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell>
                  <Button size="small" onClick={() => viewSummary(s)}>Summary</Button>
                  <Button size="small" color="warning" onClick={() => { setSelectedSession(s); setCloseDialog(true); }}>Close</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={closeDialog} onClose={() => setCloseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Session</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Actual Cash Count" type="number" sx={{ mt: 1 }} value={actualCash} onChange={(e) => setActualCash(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleCloseSession} disabled={loading}>
            {loading ? 'Closing...' : 'Close Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PosEndOfDay;
