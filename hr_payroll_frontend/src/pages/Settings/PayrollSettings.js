import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Switch, FormControlLabel, MenuItem, Alert, Grid, Divider, InputAdornment,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

export default function PayrollSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await SettingsApi.getPayroll(); setForm(r.data?.data || r.data || {}); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try { await SettingsApi.updatePayroll(form); setMsg('Saved'); setTimeout(() => setMsg(''), 3000); } catch (e) { setMsg('Error: ' + e.message); }
  };

  if (!form) return <Typography>Loading...</Typography>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Payroll Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure payroll cycle, WPS, salary structure & gratuity rules</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
        </Box>
      </Box>
      {msg && <Alert severity={msg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{msg}</Alert>}

      <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>Payroll Cycle</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={4}><TextField select label="Payroll Frequency" fullWidth size="small" value={form.payrollFrequency || ''} onChange={e => set('payrollFrequency', e.target.value)}><MenuItem value="monthly">Monthly</MenuItem><MenuItem value="bi-weekly">Bi-Weekly</MenuItem><MenuItem value="weekly">Weekly</MenuItem></TextField></Grid>
        <Grid item xs={4}><TextField label="Pay Day" type="number" fullWidth size="small" value={form.payDay || ''} onChange={e => set('payDay', parseInt(e.target.value) || 0)} helperText="Day of month" /></Grid>
        <Grid item xs={4}><TextField label="Salary Cutoff Day" type="number" fullWidth size="small" value={form.salaryCutoffDay || ''} onChange={e => set('salaryCutoffDay', parseInt(e.target.value) || 0)} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>WPS & Bank</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.wpsEnabled} onChange={e => set('wpsEnabled', e.target.checked)} />} label="WPS Enabled" /></Grid>
        <Grid item xs={6}><TextField label="WPS Agent Code" fullWidth size="small" value={form.wpsAgentCode || ''} onChange={e => set('wpsAgentCode', e.target.value)} disabled={!form.wpsEnabled} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Salary Structure (%)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {[
          ['basicSalaryPercentage', 'Basic'],
          ['housingAllowancePercentage', 'Housing'],
          ['transportAllowancePercentage', 'Transport'],
          ['otherAllowancePercentage', 'Other'],
        ].map(([key, label]) => (
          <Grid item xs={3} key={key}>
            <TextField label={label + ' %'} type="number" fullWidth size="small" value={form[key] || ''} onChange={e => set(key, parseFloat(e.target.value) || 0)} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} inputProps={{ min: 0, max: 100 }} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Calculations & Gratuity</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><TextField select label="Overtime Calculation" fullWidth size="small" value={form.overtimeCalculation || ''} onChange={e => set('overtimeCalculation', e.target.value)}><MenuItem value="basic_only">Basic Salary Only</MenuItem><MenuItem value="gross_salary">Gross Salary</MenuItem></TextField></Grid>
        <Grid item xs={6}><TextField select label="Deduction Calculation" fullWidth size="small" value={form.deductionCalculation || ''} onChange={e => set('deductionCalculation', e.target.value)}><MenuItem value="gross">Gross</MenuItem><MenuItem value="basic">Basic Only</MenuItem></TextField></Grid>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.gratuityEnabled} onChange={e => set('gratuityEnabled', e.target.checked)} />} label="End of Service Gratuity" /></Grid>
        <Grid item xs={6}><TextField select label="Gratuity Basis" fullWidth size="small" value={form.gratuityCalculation || ''} onChange={e => set('gratuityCalculation', e.target.value)} disabled={!form.gratuityEnabled}><MenuItem value="basic_salary">Basic Salary</MenuItem><MenuItem value="gross_salary">Gross Salary</MenuItem></TextField></Grid>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.taxEnabled} onChange={e => set('taxEnabled', e.target.checked)} />} label="Income Tax" /></Grid>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.socialSecurityEnabled} onChange={e => set('socialSecurityEnabled', e.target.checked)} />} label="Social Security" /></Grid>
        <Grid item xs={4}><TextField label="SS Rate %" type="number" fullWidth size="small" value={form.socialSecurityRate || ''} onChange={e => set('socialSecurityRate', parseFloat(e.target.value) || 0)} disabled={!form.socialSecurityEnabled} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} /></Grid>
        <Grid item xs={6}><TextField select label="Payslip Language" fullWidth size="small" value={form.payslipLanguage || ''} onChange={e => set('payslipLanguage', e.target.value)}><MenuItem value="en">English</MenuItem><MenuItem value="ar">Arabic</MenuItem><MenuItem value="both">Bilingual</MenuItem></TextField></Grid>
        <Grid item xs={6}><TextField select label="Payslip Format" fullWidth size="small" value={form.payslipFormat || ''} onChange={e => set('payslipFormat', e.target.value)}><MenuItem value="pdf">PDF</MenuItem><MenuItem value="excel">Excel</MenuItem></TextField></Grid>
      </Grid>
    </Box>
  );
}
