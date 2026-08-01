import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Grid, Alert, Snackbar, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Switch } from '@mui/material';
import SettingsApi from '../../services/settingsApi';
import WorkingDaysPicker from '../../components/Shared/WorkingDaysPicker';

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const policyOptions = [
  { value: 'deduct_leave', label: 'Deduct Leave' },
  { value: 'deduct_salary', label: 'Deduct Salary' },
  { value: 'warning', label: 'Warning Only' },
  { value: 'flexible', label: 'Flexible' },
];
const deductionOptions = [
  { value: 'per_minute', label: 'Per Minute' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'full_day', label: 'Full Day' },
];

const WorkingHoursSettings = () => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    SettingsApi.getWorkingHours().then(r => setForm(r.data.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async () => {
    setSaving(true);
    try { await SettingsApi.updateWorkingHours(form); setMsg({ type: 'success', text: 'Working hours saved' }); }
    catch { setMsg({ type: 'error', text: 'Failed' }); }
    setSaving(false);
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Working Hours</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure working days, hours, breaks, grace periods, and attendance policies.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>Working Days</Typography>
          <WorkingDaysPicker
            value={form.workingDays || 'Mon,Tue,Wed,Thu,Fri'}
            onChange={(v) => setForm({ ...form, workingDays: v })}
            label="Select Working Days"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>Weekend Days</Typography>
          <WorkingDaysPicker
            value={form.weekendDays || 'Sat,Sun'}
            onChange={(v) => setForm({ ...form, weekendDays: v })}
            label="Select Weekend Days"
          />
        </Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Work Start Time" name="workStartTime" value={form.workStartTime || '09:00:00'} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Work End Time" name="workEndTime" value={form.workEndTime || '18:00:00'} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Grace Period (min)" name="gracePeriodMinutes" value={form.gracePeriodMinutes || 15} onChange={handleChange} type="number" /></Grid>

        <Grid item xs={12} md={4}><TextField fullWidth label="Lunch Start Time" name="lunchStartTime" value={form.lunchStartTime || ''} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Lunch Duration (min)" name="lunchDurationMinutes" value={form.lunchDurationMinutes || 60} onChange={handleChange} type="number" /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Break Duration (min)" name="breakDurationMinutes" value={form.breakDurationMinutes || 0} onChange={handleChange} type="number" /></Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth><InputLabel>Late Arrival Policy</InputLabel>
            <Select name="lateArrivalPolicy" value={form.lateArrivalPolicy || 'warning'} label="Late Arrival Policy" onChange={handleChange}>
              {policyOptions.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select></FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth><InputLabel>Early Departure Policy</InputLabel>
            <Select name="earlyDeparturePolicy" value={form.earlyDeparturePolicy || 'warning'} label="Early Departure Policy" onChange={handleChange}>
              {policyOptions.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select></FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth><InputLabel>Late Deduction Type</InputLabel>
            <Select name="lateDeductionType" value={form.lateDeductionType || ''} label="Late Deduction Type" onChange={handleChange}>
              <MenuItem value="">None</MenuItem>
              {deductionOptions.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </Select></FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={form.flexibleHoursEnabled || false} onChange={e => setForm({ ...form, flexibleHoursEnabled: e.target.checked })} />}
            label="Enable Flexible Hours"
          />
        </Grid>
        {form.flexibleHoursEnabled && (
          <>
            <Grid item xs={12} md={6}><TextField fullWidth label="Flexible Start Time" name="flexibleStartTime" value={form.flexibleStartTime || ''} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Flexible End Time" name="flexibleEndTime" value={form.flexibleEndTime || ''} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
          </>
        )}
        <Grid item xs={12} md={6}><TextField fullWidth label="Night Shift Start" name="nightShiftStart" value={form.nightShiftStart || ''} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Night Shift End" name="nightShiftEnd" value={form.nightShiftEnd || ''} onChange={handleChange} type="time" InputLabelProps={{ shrink: true }} /></Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        <Button variant="outlined" onClick={() => SettingsApi.getWorkingHours().then(r => setForm(r.data.data || {}))}>Reset</Button>
      </Box>
      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
        <Alert severity={msg?.type} onClose={() => setMsg(null)}>{msg?.text}</Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkingHoursSettings;
