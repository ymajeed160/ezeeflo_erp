import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Alert, Snackbar, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import MasterDataApi from '../../services/masterDataApi';

const CountriesList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', nationality: '', phoneCode: '', currencyCode: '' });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await MasterDataApi.getCountries({ search, limit: 100 });
      setData(r.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', nationality: '', phoneCode: '', currencyCode: '' }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item.id); setForm(item); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await MasterDataApi.updateCountry(editing, form);
        setMsg({ type: 'success', text: 'Updated' });
      } else {
        await MasterDataApi.createCountry(form);
        setMsg({ type: 'success', text: 'Created' });
      }
      setDialogOpen(false);
      load();
    } catch { setMsg({ type: 'error', text: 'Failed' }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this country?')) return;
    try { await MasterDataApi.deleteCountry(id); load(); setMsg({ type: 'success', text: 'Deleted' }); }
    catch { setMsg({ type: 'error', text: 'Failed' }); }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Countries</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <IconButton onClick={load}><Refresh /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add</Button>
        </Box>
      </Box>

      {loading ? <CircularProgress /> : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell><TableCell>Name</TableCell>
                <TableCell>Nationality</TableCell><TableCell>Phone</TableCell><TableCell>Currency</TableCell>
                <TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.nationality}</TableCell>
                  <TableCell>{item.phoneCode}</TableCell>
                  <TableCell>{item.currencyCode}</TableCell>
                  <TableCell><Chip label={item.isActive ? 'Active' : 'Inactive'} size="small" color={item.isActive ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(item)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && <TableRow><TableCell colSpan={7} align="center">No countries found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editing ? 'Edit Country' : 'Add Country'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
            <TextField label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} size="small" required helperText="ISO code: AE, SA, etc." />
            <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} size="small" required />
            <TextField label="Nationality" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} size="small" />
            <TextField label="Phone Code" value={form.phoneCode} onChange={e => setForm({ ...form, phoneCode: e.target.value })} size="small" />
            <TextField label="Currency Code" value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value })} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
        <Alert severity={msg?.type} onClose={() => setMsg(null)}>{msg?.text}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default CountriesList;
