import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, IconButton, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid,
  TablePagination,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = '/api/superadmin';
const getToken = () => { try { return JSON.parse(localStorage.getItem('persist:sa_auth')).accessToken; } catch { return null; } };
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const Announcements = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState({ title: '', content: '', type: 'general', priority: 'normal', isPublished: false });

  const fetch = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/announcements`, { ...auth(), params: { page: page + 1, limit: rowsPerPage } });
      setItems(data.data || []);
      setTotal(data.meta?.pagination?.total || 0);
    } catch (e) { setError('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page, rowsPerPage]);

  const openDialog = (item = null) => {
    if (item) setForm({ title: item.title, content: item.content, type: item.type, priority: item.priority, isPublished: item.isPublished });
    else setForm({ title: '', content: '', type: 'general', priority: 'normal', isPublished: false });
    setDialog({ open: true, item });
  };

  const save = async () => {
    try {
      dialog.item
        ? await axios.put(`${API_BASE}/announcements/${dialog.item.id}`, form, auth())
        : await axios.post(`${API_BASE}/announcements`, form, auth());
      setDialog({ open: false, item: null }); fetch();
    } catch { setError('Save failed'); }
  };

  const remove = async (id) => { try { await axios.delete(`${API_BASE}/announcements/${id}`, auth()); fetch(); } catch { setError('Delete failed'); } };

  const typeColor = t => ({ general: 'primary', maintenance: 'warning', feature: 'success', downtime: 'error', security: 'error', urgent: 'error' }[t] || 'default');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Announcements</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => openDialog()}>Create</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              : items.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>No announcements</TableCell></TableRow>
                : items.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell><Typography fontWeight={600}>{a.title}</Typography></TableCell>
                    <TableCell><Chip label={a.type} size="small" color={typeColor(a.type)} /></TableCell>
                    <TableCell><Chip label={a.priority} size="small" color={a.priority === 'critical' ? 'error' : a.priority === 'high' ? 'warning' : 'default'} /></TableCell>
                    <TableCell><Chip label={a.isPublished ? 'Published' : 'Draft'} color={a.isPublished ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell><Typography variant="caption">{new Date(a.createdAt).toLocaleDateString()}</Typography></TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(a)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(a.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} />
      </TableContainer>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.item ? 'Edit' : 'Create'} Announcement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} multiline rows={4} /></Grid>
            <Grid item xs={6}><TextField select fullWidth label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{['general','maintenance','feature','downtime','security','urgent'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField select fullWidth label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{['low','normal','high','critical'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField select fullWidth label="Status" value={form.isPublished ? 'published' : 'draft'} onChange={e => setForm({ ...form, isPublished: e.target.value === 'published' })}><MenuItem value="draft">Draft</MenuItem><MenuItem value="published">Published</MenuItem></TextField></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog({ open: false, item: null })}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Announcements;
