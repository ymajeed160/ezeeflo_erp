import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Switch, FormControlLabel, MenuItem, Alert,
  Grid, Divider, InputAdornment,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

export default function AttendanceSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await SettingsApi.getAttendance(); setForm(r.data?.data || r.data || {}); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      await SettingsApi.updateAttendance(form);
      setMsg('Settings saved');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Error: ' + e.message); }
  };

  if (!form) return <Typography>Loading...</Typography>;

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Attendance Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure overtime, deductions, geo-fencing & biometric rules</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
        </Box>
      </Box>
      {msg && <Alert severity={msg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>Overtime Policy</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12}><FormControlLabel control={<Switch checked={!!form.overtimeEnabled} onChange={e => set('overtimeEnabled', e.target.checked)} />} label="Enable Overtime" /></Grid>
        <Grid item xs={6}><TextField label="Daily Limit (min)" type="number" fullWidth size="small" value={form.overtimeDailyLimit || ''} onChange={e => set('overtimeDailyLimit', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={6}><TextField label="Weekly Limit (min)" type="number" fullWidth size="small" value={form.overtimeWeeklyLimit || ''} onChange={e => set('overtimeWeeklyLimit', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={4}><TextField label="Weekday Rate (x)" type="number" fullWidth size="small" value={form.overtimeRate || ''} onChange={e => set('overtimeRate', parseFloat(e.target.value) || 0)} inputProps={{ step: 0.1 }} /></Grid>
        <Grid item xs={4}><TextField label="Weekend Rate (x)" type="number" fullWidth size="small" value={form.weekendOvertimeRate || ''} onChange={e => set('weekendOvertimeRate', parseFloat(e.target.value) || 0)} inputProps={{ step: 0.1 }} /></Grid>
        <Grid item xs={4}><TextField label="Holiday Rate (x)" type="number" fullWidth size="small" value={form.overtimeHolidayRate || ''} onChange={e => set('overtimeHolidayRate', parseFloat(e.target.value) || 0)} inputProps={{ step: 0.1 }} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Deductions & Thresholds</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12}><FormControlLabel control={<Switch checked={!!form.autoDeductionEnabled} onChange={e => set('autoDeductionEnabled', e.target.checked)} />} label="Auto Deduction for Late Arrivals" /></Grid>
        <Grid item xs={4}><TextField select label="Deduction Type" fullWidth size="small" value={form.lateDeductionType || ''} onChange={e => set('lateDeductionType', e.target.value)}><MenuItem value="per_minute">Per Minute</MenuItem><MenuItem value="per_hour">Per Hour</MenuItem><MenuItem value="fixed">Fixed</MenuItem></TextField></Grid>
        <Grid item xs={4}><TextField label="Deduction Amount" type="number" fullWidth size="small" value={form.lateDeductionAmount || ''} onChange={e => set('lateDeductionAmount', parseFloat(e.target.value) || 0)} InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }} /></Grid>
        <Grid item xs={4}><TextField label="Half-Day Threshold (min)" type="number" fullWidth size="small" value={form.halfDayThreshold || ''} onChange={e => set('halfDayThreshold', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={6}><TextField label="Absent Threshold (min)" type="number" fullWidth size="small" value={form.absentThreshold || ''} onChange={e => set('absentThreshold', parseInt(e.target.value) || 0)} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Security & Tracking</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.biometricRequired} onChange={e => set('biometricRequired', e.target.checked)} />} label="Require Biometric" /></Grid>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.geoFencingEnabled} onChange={e => set('geoFencingEnabled', e.target.checked)} />} label="Geo-Fencing" /></Grid>
        <Grid item xs={6}><TextField label="Geo-Fence Radius (meters)" type="number" fullWidth size="small" value={form.geoFencingRadius || ''} onChange={e => set('geoFencingRadius', parseInt(e.target.value) || 0)} disabled={!form.geoFencingEnabled} /></Grid>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.ipRestrictionEnabled} onChange={e => set('ipRestrictionEnabled', e.target.checked)} />} label="IP Restriction" /></Grid>
        <Grid item xs={12}><TextField label="Allowed IPs (comma-separated)" fullWidth size="small" value={form.allowedIps || ''} onChange={e => set('allowedIps', e.target.value)} disabled={!form.ipRestrictionEnabled} /></Grid>
      </Grid>
    </Box>
  );
}
