import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Visibility, FactCheck as AuditIcon } from '@mui/icons-material';
import { fetchAudits, fetchAudit, createAudit, deleteAudit, fetchNextAuditNumber, clearSelected, clearError } from '../store/slices/assetAuditSlice';
import { fetchAssets } from '../store/slices/assetSlice';

const CONDITIONS = [{ value: 'new', label: 'New' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' }, { value: 'damaged', label: 'Damaged' }, { value: 'obsolete', label: 'Obsolete' }];
const INITIAL_FORM = { auditNumber: '', auditDate: new Date().toISOString().split('T')[0], assetId: '', verifiedLocation: '', verifiedCondition: '', verifiedCustodian: '', barcodeScanned: '', remarks: '', isVerified: true, isMissing: false };

const AssetAudits = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState(''); const [vFilter, setVFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM); const [fErrors, setFErrors] = useState({}); const [del, setDel] = useState(null);
  const { audits, selectedAudit, nextAuditNumber, loading, error } = useSelector((s) => s.audits);
  const { assets } = useSelector((s) => s.assets);

  const load = useCallback(() => { const p = { search }; if (vFilter === 'verified') p.isVerified = true; else if (vFilter === 'missing') p.isMissing = true; dispatch(fetchAudits(p)); }, [dispatch, search, vFilter]);
  useEffect(() => { load(); dispatch(fetchAssets({ limit: 999 })); }, [load]);
  useEffect(() => { if (dialogOpen) dispatch(fetchNextAuditNumber()); }, [dialogOpen, dispatch]);
  useEffect(() => { if (nextAuditNumber) setForm((p) => ({ ...p, auditNumber: nextAuditNumber })); }, [nextAuditNumber]);
  useEffect(() => { if (selectedAudit && !dialogOpen) setViewOpen(true); }, [selectedAudit, dialogOpen]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const handleSubmit = async () => { const e = {}; if (!form.assetId) e.assetId = 'Required'; setFErrors(e); if (Object.keys(e).length > 0) return;
    await dispatch(createAudit({ ...form, auditDate: form.auditDate || null, verifiedLocation: form.verifiedLocation || null, verifiedCondition: form.verifiedCondition || null, verifiedCustodian: form.verifiedCustodian || null, barcodeScanned: form.barcodeScanned || null, remarks: form.remarks || null }));
    setDialogOpen(false); };

  const gl = (a, v) => a?.find((x) => x.value === v)?.label || v;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AuditIcon color="primary" sx={{ fontSize: 32 }} /><Box><Typography variant="h5" fontWeight={700}>Asset Audits</Typography><Typography variant="body2" color="text.secondary">Physical verification with barcode/QR scanning</Typography></Box></Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>New Audit</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select value={vFilter} label="Status" onChange={(e) => setVFilter(e.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="verified">Verified</MenuItem><MenuItem value="missing">Missing</MenuItem></Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={load}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); setVFilter(''); dispatch(fetchAudits({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}><Table>
          <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Audit #</TableCell><TableCell sx={{ fontWeight: 600 }}>Date</TableCell><TableCell sx={{ fontWeight: 600 }}>Asset</TableCell><TableCell sx={{ fontWeight: 600 }}>Location</TableCell><TableCell sx={{ fontWeight: 600 }}>Condition</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>{audits.length === 0 ? (<TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No audits found.</Typography></TableCell></TableRow>) : audits.map((m) => (
            <TableRow key={m.id} hover><TableCell><Typography variant="body2" fontWeight={600}>{m.auditNumber}</Typography></TableCell><TableCell>{m.auditDate}</TableCell><TableCell>{m.asset?.assetName || '-'}</TableCell><TableCell>{m.verifiedLocation || '-'}</TableCell><TableCell>{m.verifiedCondition ? <Chip label={gl(CONDITIONS, m.verifiedCondition)} size="small" variant="outlined" /> : '-'}</TableCell>
            <TableCell>{m.isMissing ? <Chip label="Missing" color="error" size="small" /> : m.isVerified ? <Chip label="Verified" color="success" size="small" /> : <Chip label="Pending" size="small" />}</TableCell>
            <TableCell align="center"><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchAudit(m.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDel(m.id)}><Delete fontSize="small" /></IconButton></Tooltip>
            </Box></TableCell></TableRow>))}</TableBody>
        </Table></TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AuditIcon color="primary" /><Typography variant="h6">New Asset Audit</Typography></Box></DialogTitle>
        <DialogContent dividers><Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Audit #" value={form.auditNumber} onChange={(e) => setForm({ ...form, auditNumber: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Date" type="date" value={form.auditDate} onChange={(e) => setForm({ ...form, auditDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><FormControl fullWidth size="small" required error={!!fErrors.assetId}><InputLabel>Asset</InputLabel><Select value={form.assetId} label="Asset" onChange={(e) => setForm({ ...form, assetId: e.target.value })}><MenuItem value=""><em>Select</em></MenuItem>{assets?.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Verified Location" value={form.verifiedLocation} onChange={(e) => setForm({ ...form, verifiedLocation: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth size="small"><InputLabel>Condition</InputLabel><Select value={form.verifiedCondition} label="Condition" onChange={(e) => setForm({ ...form, verifiedCondition: e.target.value })}><MenuItem value=""><em>Not checked</em></MenuItem>{CONDITIONS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Verified Custodian" value={form.verifiedCustodian} onChange={(e) => setForm({ ...form, verifiedCustodian: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Barcode Scanned" value={form.barcodeScanned} onChange={(e) => setForm({ ...form, barcodeScanned: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Remarks" multiline rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSubmit}>Create Audit</Button></DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => { setViewOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AuditIcon color="primary" /><Typography variant="h6">Audit Details</Typography></Box></DialogTitle>
        <DialogContent dividers>{selectedAudit && (<Grid container spacing={2}>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Audit #</Typography><Typography variant="body1" fontWeight={600}>{selectedAudit.auditNumber}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{selectedAudit.auditDate}</Typography></Grid>
          <Grid item xs={12}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body1">{selectedAudit.asset?.assetName || selectedAudit.assetId}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{selectedAudit.verifiedLocation || '-'}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Condition</Typography><Typography variant="body1">{selectedAudit.verifiedCondition || '-'}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Custodian</Typography><Typography variant="body1">{selectedAudit.verifiedCustodian || '-'}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}>{selectedAudit.isMissing ? <Chip label="Missing" color="error" size="small" /> : selectedAudit.isVerified ? <Chip label="Verified" color="success" size="small" /> : <Chip label="Pending" size="small" />}</Box></Grid>
          {selectedAudit.remarks && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Remarks</Typography><Typography variant="body1">{selectedAudit.remarks}</Typography></Grid>}
        </Grid>)}</DialogContent>
        <DialogActions><Button onClick={() => { setViewOpen(false); }}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!del} onClose={() => setDel(null)}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography>Delete this audit record?</Typography></DialogContent><DialogActions><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="contained" color="error" onClick={async () => { if (del) { await dispatch(deleteAudit(del)); setDel(null); } }}>Delete</Button></DialogActions></Dialog>
    </Box>
  );
};
export default AssetAudits;
