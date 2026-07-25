import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getTerminals, createTerminal, updateTerminal, deleteTerminal } from '../services/posApi';

const PosTerminals = () => {
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ terminalName: '', terminalCode: '', status: 'active' });

  const loadTerminals = useCallback(async () => {
    try {
      const res = await getTerminals();
      setTerminals(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load terminals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTerminals(); }, [loadTerminals]);

  const handleSave = async () => {
    try {
      if (editItem) {
        await updateTerminal(editItem.id, form);
      } else {
        await createTerminal(form);
      }
      setDialogOpen(false);
      setEditItem(null);
      setForm({ terminalName: '', terminalCode: '', status: 'active' });
      loadTerminals();
    } catch (err) {
      console.error('Failed to save terminal:', err);
    }
  };

  const handleEdit = (terminal) => {
    setEditItem(terminal);
    setForm({ terminalName: terminal.terminalName, terminalCode: terminal.terminalCode, status: terminal.status });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this terminal?')) {
      try {
        await deleteTerminal(id);
        loadTerminals();
      } catch (err) { console.error('Failed to delete:', err); }
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">POS Terminals</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setForm({ terminalName: '', terminalCode: '', status: 'active' }); setDialogOpen(true); }}>
          Add Terminal
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Cash Account</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terminals.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.terminalName}</TableCell>
                <TableCell>{t.terminalCode}</TableCell>
                <TableCell>{t.warehouse?.name || '-'}</TableCell>
                <TableCell>{t.cashAccount?.name || '-'}</TableCell>
                <TableCell><Chip label={t.status} color={t.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(t)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(t.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Terminal' : 'Add Terminal'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Terminal Name" value={form.terminalName} onChange={(e) => setForm({ ...form, terminalName: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Terminal Code" value={form.terminalCode} onChange={(e) => setForm({ ...form, terminalCode: e.target.value.toUpperCase() })} margin="normal" required />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} label="Status">
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PosTerminals;
