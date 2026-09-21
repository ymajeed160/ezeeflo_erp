import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, TextField, Button, Grid, Alert, Snackbar, IconButton, Paper, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Chip } from '@mui/material';
import { Add, Delete, Edit, Business } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

const types = [
  { value: 'branch', label: 'Branch' },
  { value: 'business_unit', label: 'Business Unit' },
  { value: 'location', label: 'Location' },
  { value: 'cost_center', label: 'Cost Center' },
];

const CompanyProfileSettings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ profileType: 'branch', name: '', code: '', address: '', phone: '', email: '' });
  const [msg, setMsg] = useState(null);
  const tenants = useSelector((state) => state.hrAuth?.tenants) || [];
  const activeCompanyId = useSelector((state) => state.hrAuth?.activeCompanyId);
  const activeTenant = tenants.find(t => t.id === activeCompanyId);

  const load = () => SettingsApi.getCompanyProfiles().then(r => setItems(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ profileType: 'branch', name: '', code: '', address: '', phone: '', email: '' });
  const handleEdit = (item) => { setEditing(item.id); setForm(item); };
  const handleCancel = () => { setEditing(null); resetForm(); };

  const handleSave = async () => {
    try {
      if (editing) {
        await SettingsApi.updateCompanyProfile(editing, form);
        setMsg({ type: 'success', text: 'Updated' });
      } else {
        await SettingsApi.createCompanyProfile(form);
        setMsg({ type: 'success', text: 'Created' });
      }
      handleCancel();
      load();
    } catch { setMsg({ type: 'error', text: 'Failed' }); }
  };

  const handleDelete = async (id) => {
    try { await SettingsApi.deleteCompanyProfile(id); load(); setMsg({ type: 'success', text: 'Deleted' }); }
    catch { setMsg({ type: 'error', text: 'Failed' }); }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Company Profile</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage company information, branches, business units, locations, and cost centers.
      </Typography>

      {/* Company Info Card */}
      {activeTenant && (
        <Card sx={{ mb: 3, borderLeft: '4px solid #1976d2' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Business color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{activeTenant.name || 'My Company'}</Typography>
              <Chip label="Active Company" size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Sub-profile Management */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Branches, Units & Locations</Typography>

      {/* Form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>{editing ? 'Edit' : 'Add New'} Entry</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select name="profileType" value={form.profileType} label="Type" onChange={e => setForm({ ...form, profileType: e.target.value })}>
                {types.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          {editing && <Button variant="outlined" size="small" onClick={handleCancel}>Cancel</Button>}
        </Box>
      </Paper>

      {/* List */}
      {items.length === 0 ? <Typography color="text.secondary">No entries yet. Add your first branch or business unit above.</Typography> : (
        items.map(item => (
          <Paper key={item.id} sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ minWidth: 100 }}><strong>{types.find(t => t.value === item.profileType)?.label}</strong></Box>
            <Box sx={{ flex: 1 }}>{item.name} {item.code ? `(${item.code})` : ''}</Box>
            <IconButton size="small" onClick={() => handleEdit(item)}><Edit fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete fontSize="small" /></IconButton>
          </Paper>
        ))
      )}
      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
        <Alert severity={msg?.type} onClose={() => setMsg(null)}>{msg?.text}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyProfileSettings;
