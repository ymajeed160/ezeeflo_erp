import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Alert, Snackbar, CircularProgress, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import MasterDataApi from '../../services/masterDataApi';

const StatesList = () => {
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ countryId: '', code: '', name: '' });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        MasterDataApi.getStates({ limit: 200 }),
        MasterDataApi.getCountries({ limit: 100 }),
      ]);
      setData(s.data.data || []);
      setCountries(c.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ countryId: countries[0]?.id || '', code: '', name: '' }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item.id); setForm({ countryId: item.countryId, code: item.code, name: item.name }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await MasterDataApi.updateState(editing, form); setMsg({ type: 'success', text: 'Updated' }); }
      else { await MasterDataApi.createState(form); setMsg({ type: 'success', text: 'Created' }); }
      setDialogOpen(false); load();
    } catch { setMsg({ type: 'error', text: 'Failed' }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this state?')) return;
    try { await MasterDataApi.deleteState(id); load(); setMsg({ type: 'success', text: 'Deleted' }); }
    catch { setMsg({ type: 'error', text: 'Failed' }); }
  };

  const getCountryName = (countryId) => countries.find(c => c.id === countryId)?.name || '';

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">States / Provinces</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={load}><Refresh /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add</Button>
        </Box>
      </Box>
      {loading ? <CircularProgress /> : (
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Country</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {data.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell><TableCell>{item.name}</TableCell>
                  <TableCell>{item.country?.name || getCountryName(item.countryId)}</TableCell>
                  <TableCell><Chip label={item.isActive ? 'Active' : 'Inactive'} size="small" color={item.isActive ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(item)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && <TableRow><TableCell colSpan={5} align="center">No states found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editing ? 'Edit State' : 'Add State'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
            <FormControl fullWidth size="small"><InputLabel>Country</InputLabel>
              <Select value={form.countryId} label="Country" onChange={e => setForm({ ...form, countryId: e.target.value })}>
                {countries.map(c => <MenuItem key={c.id} value={c.id}>{c.flagEmoji} {c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} size="small" />
            <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} size="small" required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}><Alert severity={msg?.type}>{msg?.text}</Alert></Snackbar>
    </Paper>
  );
};

export default StatesList;
