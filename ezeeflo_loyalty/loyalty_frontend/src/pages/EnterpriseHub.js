import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Tabs, Tab, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add, Refresh, Edit, Delete, Store, Security, Link, EmojiEvents,
  Warning, Timeline, GroupWork,
} from '@mui/icons-material';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';

const EnterpriseHub = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [segments, setSegments] = useState([]);
  const [badges, setBadges] = useState([]);
  const [dialog, setDialog] = useState({ open: false, type: '', mode: 'create', data: null });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [storesRes, fraudRes, webhooksRes, segmentsRes, badgesRes] = await Promise.all([
        api.get('/enterprise/stores', { params: { limit: 200 } }),
        api.get('/enterprise/fraud/alerts', { params: { limit: 50 } }),
        api.get('/enterprise/webhooks'),
        api.get('/enterprise/segments'),
        api.get('/enterprise/badges'),
      ]);
      setStores(storesRes.data.data || []);
      setFraudAlerts(fraudRes.data.data || []);
      setWebhooks(webhooksRes.data.data || []);
      setSegments(segmentsRes.data.data || []);
      setBadges(badgesRes.data.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openDialog = (type, mode, data = null) => {
    const defaults = {
      store: { name: '', code: '', storeType: 'branch', region: '', city: '', country: 'UAE', address: '', phone: '', isActive: true },
      webhook: { name: '', url: '', events: [], isActive: true },
      segment: { name: '', code: '', description: '', segmentType: 'dynamic', filters: [{ field: 'lifetimeValue', operator: 'greater_than', value: '0' }] },
      badge: { name: '', code: '', description: '', badgeType: 'achievement', criteria: { type: 'purchase_count', value: 10 }, pointsReward: 0, isActive: true },
    };
    setForm(data ? { ...defaults[type], ...data } : defaults[type]);
    setDialog({ open: true, type, mode, data });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoints = { store: '/enterprise/stores', webhook: '/enterprise/webhooks', segment: '/enterprise/segments', badge: '/enterprise/badges' };
      const url = endpoints[dialog.type];
      if (dialog.mode === 'create') {
        await api.post(url, form);
        showSuccess(`${dialog.type} created`);
      } else {
        await api.put(`${url}/${dialog.data.id}`, form);
        showSuccess(`${dialog.type} updated`);
      }
      setDialog({ open: false, type: '', mode: 'create', data: null });
      fetchAll();
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      const endpoints = { store: `/enterprise/stores/${id}`, webhook: `/enterprise/webhooks/${id}`, segment: `/enterprise/segments/${id}`, badge: `/enterprise/badges/${id}` };
      await api.delete(endpoints[type]);
      showSuccess(`${type} deleted`);
      fetchAll();
    } catch (err) { showError(err.response?.data?.message || 'Delete failed'); }
  };

  const handleResolveAlert = async (alertId, status) => {
    try { await api.patch(`/enterprise/fraud/alerts/${alertId}/resolve`, { status }); showSuccess('Alert resolved'); fetchAll(); }
    catch (err) { showError(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Enterprise Hub</Typography>
        <Typography variant="body2" color="text.secondary">Store Management · Fraud Detection · Webhooks · Segmentation · Gamification</Typography>
      </Box>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<Store />} label="Stores" iconPosition="start" />
        <Tab icon={<Warning />} label={`Fraud (${fraudAlerts.length})`} iconPosition="start" />
        <Tab icon={<Link />} label="Webhooks" iconPosition="start" />
        <Tab icon={<GroupWork />} label="Segments" iconPosition="start" />
        <Tab icon={<EmojiEvents />} label="Gamification" iconPosition="start" />
      </Tabs>

      {/* Stores Tab */}
      {tab === 0 && (
        <>
          <Box sx={{ mb: 2 }}><Button variant="contained" startIcon={<Add />} onClick={() => openDialog('store', 'create')}>Add Store</Button></Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow><TableCell>Store</TableCell><TableCell>Type</TableCell><TableCell>Region</TableCell><TableCell>City</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>{stores.map(s => (
              <TableRow key={s.id}><TableCell><Typography fontWeight={600}>{s.name}</Typography><Typography variant="caption">{s.code}</Typography></TableCell>
                <TableCell><Chip label={s.storeType} size="small" /></TableCell><TableCell>{s.region || '-'}</TableCell><TableCell>{s.city || '-'}</TableCell>
                <TableCell><Chip label={s.isActive ? 'Active' : 'Inactive'} size="small" color={s.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell align="right"><IconButton size="small" onClick={() => openDialog('store', 'edit', s)}><Edit fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => handleDelete('store', s.id)}><Delete fontSize="small" /></IconButton></TableCell>
              </TableRow>))}
              {stores.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No stores</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </>
      )}

      {/* Fraud Tab */}
      {tab === 1 && (
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow><TableCell>Alert</TableCell><TableCell>Customer</TableCell><TableCell>Severity</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>{fraudAlerts.map(a => (
            <TableRow key={a.id}><TableCell><Typography fontWeight={600}>{a.title}</Typography><Typography variant="caption">{a.rule?.name}</Typography></TableCell>
              <TableCell>{a.customer?.firstName} {a.customer?.lastName}</TableCell>
              <TableCell><Chip label={a.severity} size="small" color={a.severity === 'critical' ? 'error' : a.severity === 'high' ? 'warning' : 'default'} /></TableCell>
              <TableCell><Chip label={a.status} size="small" /></TableCell>
              <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                {a.status === 'open' && <><Button size="small" onClick={() => handleResolveAlert(a.id, 'resolved')}>Resolve</Button><Button size="small" color="warning" onClick={() => handleResolveAlert(a.id, 'dismissed')}>Dismiss</Button></>}
              </TableCell>
            </TableRow>))}
            {fraudAlerts.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No fraud alerts</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer>
      )}

      {/* Webhooks Tab */}
      {tab === 2 && (
        <>
          <Box sx={{ mb: 2 }}><Button variant="contained" startIcon={<Add />} onClick={() => openDialog('webhook', 'create')}>Add Webhook</Button></Box>
          <Grid container spacing={2}>{webhooks.map(w => (
            <Grid item xs={12} sm={6} md={4} key={w.id}><Card>
              <CardContent><Typography variant="h6">{w.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{w.url}</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{(w.events || []).map(e => <Chip key={e} label={e} size="small" variant="outlined" />)}</Box>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">✓ {w.successCount} | ✗ {w.failureCount}</Typography>
                  <Box><IconButton size="small" onClick={() => openDialog('webhook', 'edit', w)}><Edit fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => handleDelete('webhook', w.id)}><Delete fontSize="small" /></IconButton></Box>
                </Box>
              </CardContent>
            </Card></Grid>
          ))}</Grid>
        </>
      )}

      {/* Segments Tab */}
      {tab === 3 && (
        <>
          <Box sx={{ mb: 2 }}><Button variant="contained" startIcon={<Add />} onClick={() => openDialog('segment', 'create')}>Add Segment</Button></Box>
          <Grid container spacing={2}>{segments.map(s => (
            <Grid item xs={12} sm={6} md={4} key={s.id}><Card>
              <CardContent><Typography variant="h6">{s.name}</Typography><Chip label={s.segmentType} size="small" sx={{ mb: 1 }} />
                <Typography variant="body2">{s.description}</Typography>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{s.customerCount}</Typography>
                  <Box><IconButton size="small" onClick={() => openDialog('segment', 'edit', s)}><Edit fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => handleDelete('segment', s.id)}><Delete fontSize="small" /></IconButton></Box>
                </Box>
              </CardContent>
            </Card></Grid>
          ))}</Grid>
        </>
      )}

      {/* Gamification Tab */}
      {tab === 4 && (
        <>
          <Box sx={{ mb: 2 }}><Button variant="contained" startIcon={<Add />} onClick={() => openDialog('badge', 'create')}>Add Badge</Button></Box>
          <Grid container spacing={2}>{badges.map(b => (
            <Grid item xs={12} sm={6} md={4} key={b.id}><Card sx={{ borderTop: `4px solid ${b.color || '#6B7280'}` }}>
              <CardContent><Typography variant="h6">{b.icon ? b.icon + ' ' : ''}{b.name}</Typography>
                <Chip label={b.badgeType} size="small" sx={{ mb: 1 }} />
                <Typography variant="body2">{b.description}</Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>+{b.pointsReward} pts</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => openDialog('badge', 'edit', b)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete('badge', b.id)}><Delete fontSize="small" /></IconButton>
                </Box>
              </CardContent>
            </Card></Grid>
          ))}</Grid>
        </>
      )}

      {/* Generic Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Add' : 'Edit'} {dialog.type}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {dialog.type === 'store' && (<>
              <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} /></Grid>
              <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select value={form.storeType || 'branch'} label="Type" onChange={e => setForm({ ...form, storeType: e.target.value })}><MenuItem value="main">Main</MenuItem><MenuItem value="branch">Branch</MenuItem><MenuItem value="franchise">Franchise</MenuItem><MenuItem value="kiosk">Kiosk</MenuItem></Select></FormControl></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Region" value={form.region || ''} onChange={e => setForm({ ...form, region: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="City" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Country" value={form.country || 'UAE'} onChange={e => setForm({ ...form, country: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={form.isActive !== false} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Active" /></Grid>
            </>)}
            {dialog.type === 'webhook' && (<>
              <Grid item xs={12}><TextField fullWidth size="small" label="Name *" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="URL *" value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Events (comma-separated)" value={(form.events || []).join(', ')} onChange={e => setForm({ ...form, events: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} helperText="customer.created, points.earned, reward.redeemed" /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={form.isActive !== false} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Active" /></Grid>
            </>)}
            {dialog.type === 'segment' && (<>
              <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
              <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select value={form.segmentType || 'dynamic'} label="Type" onChange={e => setForm({ ...form, segmentType: e.target.value })}><MenuItem value="dynamic">Dynamic</MenuItem><MenuItem value="static">Static</MenuItem></Select></FormControl></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Refresh (minutes)" type="number" value={form.refreshInterval || 1440} onChange={e => setForm({ ...form, refreshInterval: parseInt(e.target.value) })} /></Grid>
            </>)}
            {dialog.type === 'badge' && (<>
              <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
              <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select value={form.badgeType || 'achievement'} label="Type" onChange={e => setForm({ ...form, badgeType: e.target.value })}><MenuItem value="achievement">Achievement</MenuItem><MenuItem value="streak">Streak</MenuItem><MenuItem value="challenge">Challenge</MenuItem><MenuItem value="milestone">Milestone</MenuItem></Select></FormControl></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Points Reward" type="number" value={form.pointsReward || 0} onChange={e => setForm({ ...form, pointsReward: parseInt(e.target.value) })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Icon (emoji)" value={form.icon || ''} onChange={e => setForm({ ...form, icon: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Color" value={form.color || ''} onChange={e => setForm({ ...form, color: e.target.value })} /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={form.isActive !== false} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Active" /></Grid>
            </>)}
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button><Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnterpriseHub;
