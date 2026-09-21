import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel, Alert,
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh } from '@mui/icons-material';
import MasterDataApi from '../../services/masterDataApi';

export default function CitiesList() {
  const [cities, setCities] = useState();
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false });
  const [form, setForm] = useState({ name: '', countryId: '', stateId: '', isActive: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cityRes, countryRes] = await Promise.all([
        MasterDataApi.getCities({ search }),
        MasterDataApi.getCountries(),
      ]);
      setCities(cityRes.data?.data || cityRes.data || []);
      setCountries(countryRes.data?.data || countryRes.data || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const loadStates = useCallback(async (countryId) => {
    if (!countryId) { setStates([]); return; }
    try { const r = await MasterDataApi.getStates({ countryId }); setStates(r.data?.data || r.data || []); } catch (_) {}
  }, []);

  const openDialog = (item) => {
    if (item) {
      setForm({ name: item.name || '', countryId: item.countryId || '', stateId: item.stateId || '', isActive: item.isActive ?? true });
      setDialog({ open: true, edit: true, id: item.id });
      loadStates(item.countryId);
    } else {
      setForm({ name: '', countryId: '', stateId: '', isActive: true });
      setDialog({ open: true, edit: false });
      setStates([]);
      setError('');
    }
  };

  const save = async () => {
    try {
      setError('');
      if (dialog.edit) await MasterDataApi.updateCity(dialog.id, form);
      else await MasterDataApi.createCity(form);
      setDialog({ open: false });
      load();
    } catch (e) { setError(e.response?.data?.message || e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this city?')) return;
    try { await MasterDataApi.deleteCity(id); load(); } catch (e) { setError(e.message); }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search cities..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} /> }}
          sx={{ minWidth: 300 }}
        />
        <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Refresh</Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => openDialog(null)}>Add City</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>City</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
            ) : !cities?.length ? (
              <TableRow><TableCell colSpan={5} align="center">No cities found</TableCell></TableRow>
            ) : cities.map(c => (
              <TableRow key={c.id} hover>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.state?.name || '—'}</TableCell>
                <TableCell>{c.country?.name || '—'}</TableCell>
                <TableCell>
                  <Chip label={c.isActive ? 'Active' : 'Inactive'} color={c.isActive ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDialog(c)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.edit ? 'Edit City' : 'Add City'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Country</InputLabel>
              <Select value={form.countryId} label="Country" onChange={async (e) => { setForm({ ...form, countryId: e.target.value, stateId: '' }); await loadStates(e.target.value); }}>
                {countries.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>State</InputLabel>
              <Select value={form.stateId} label="State" onChange={(e) => setForm({ ...form, stateId: e.target.value })}>
                {states.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="City Name" fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={form.isActive} label="Status" onChange={e => setForm({ ...form, isActive: e.target.value })}>
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false })}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={!form.name || !form.countryId}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
