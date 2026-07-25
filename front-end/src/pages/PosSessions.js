import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress } from '@mui/material';
import { PlayArrow as OpenIcon, Stop as CloseIcon } from '@mui/icons-material';
import { getSessions, openSession, closeSession, getMyTerminals, getTerminals } from '../services/posApi';
import { formatCurrency } from '../utils/currency';

const PosSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [terminals, setTerminals] = useState([]);
  const [form, setForm] = useState({ terminalId: '', openingCash: '0', openingNotes: '' });
  const [closeForm, setCloseForm] = useState({ actualCash: '0', closingNotes: '' });

  const loadSessions = async () => {
    try {
      const res = await getSessions();
      setSessions(res.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadSessions();
    // Load all terminals for session opening (admins can open on any terminal)
    getTerminals().then(res => setTerminals(res.data?.data || [])).catch(() => {});
  }, []);

  const handleOpen = async () => {
    try {
      await openSession(form);
      setOpenDialog(false);
      setForm({ terminalId: '', openingCash: '0', openingNotes: '' });
      loadSessions();
    } catch (err) { console.error(err); }
  };

  const handleClose = async () => {
    try {
      await closeSession(selectedSession.id, closeForm);
      setCloseDialog(false);
      setCloseForm({ actualCash: '0', closingNotes: '' });
      loadSessions();
    } catch (err) { console.error(err); }
  };

  const openCloseDialog = (session) => {
    setSelectedSession(session);
    setCloseDialog(true);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">POS Sessions</Typography>
        <Button variant="contained" startIcon={<OpenIcon />} onClick={() => setOpenDialog(true)}>Open Session</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Session #</TableCell>
              <TableCell>Terminal</TableCell>
              <TableCell>Cashier</TableCell>
              <TableCell>Opening Cash</TableCell>
              <TableCell>Opened At</TableCell>
              <TableCell>Sales</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.sessionNumber}</TableCell>
                <TableCell>{s.terminal?.terminalName || '-'}</TableCell>
                <TableCell>{s.cashier?.name || '-'}</TableCell>
                <TableCell>{formatCurrency(parseFloat(s.openingCash))}</TableCell>
                <TableCell>{new Date(s.openingDate).toLocaleString()}</TableCell>
                <TableCell>{s.totalSalesCount || 0}</TableCell>
                <TableCell><Chip label={s.status} color={s.status === 'open' ? 'success' : s.status === 'closed' ? 'default' : 'warning'} size="small" /></TableCell>
                <TableCell align="right">
                  {s.status === 'open' && (
                    <Button size="small" color="error" startIcon={<CloseIcon />} onClick={() => openCloseDialog(s)}>Close</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Open Session Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Open POS Session</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Terminal" value={form.terminalId} onChange={(e) => setForm({ ...form, terminalId: e.target.value })} margin="normal" required>
            {terminals.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.terminalName} ({t.terminalCode})</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Opening Cash" type="number" value={form.openingCash} onChange={(e) => setForm({ ...form, openingCash: e.target.value })} margin="normal" />
          <TextField fullWidth label="Notes" multiline rows={2} value={form.openingNotes} onChange={(e) => setForm({ ...form, openingNotes: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleOpen}>Open Session</Button>
        </DialogActions>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={closeDialog} onClose={() => setCloseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Session</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>Session: {selectedSession?.sessionNumber}</Typography>
          <TextField fullWidth label="Actual Cash in Drawer" type="number" value={closeForm.actualCash} onChange={(e) => setCloseForm({ ...closeForm, actualCash: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Closing Notes" multiline rows={2} value={closeForm.closingNotes} onChange={(e) => setCloseForm({ ...closeForm, closingNotes: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleClose}>Close Session</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PosSessions;
