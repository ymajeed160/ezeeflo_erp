import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Switch, FormControlLabel, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Stack, Button, Grid,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { getCompanies } from '../../services/superAdminCompanyService';
import { getCompanyModules, toggleModule } from '../../services/superAdminSubscriptionService';

const Modules = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const result = await getCompanies({ limit: 1000 });
        setCompanies(result.data || []);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCompany) { setModules([]); return; }
    (async () => {
      try { setLoading(true); setModules(await getCompanyModules(selectedCompany)); }
      catch (e) { setError('Failed to load modules'); }
      finally { setLoading(false); }
    })();
  }, [selectedCompany]);

  const handleToggle = async (moduleCode, isEnabled) => {
    try {
      setSaving(true);
      await toggleModule(selectedCompany, moduleCode, isEnabled);
      setModules(prev => prev.map(m => m.code === moduleCode ? { ...m, isEnabled } : m));
      setSuccess('Module updated');
    } catch { setError('Failed to update module'); }
    finally { setSaving(false); }
  };

  const modulesByGroup = {
    'Core HR': ['employees', 'attendance', 'leave', 'ess'],
    'Payroll & Finance': ['payroll', 'benefits'],
    'Talent Management': ['recruitment', 'training', 'performance'],
    'Administration': ['documents', 'reports', 'settings', 'master_data', 'security'],
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Module Management</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Select Company</InputLabel>
            <Select value={selectedCompany} label="Select Company" onChange={e => setSelectedCompany(e.target.value)}>
              <MenuItem value="">-- Select Company --</MenuItem>
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {selectedCompany && !loading && (
        <Grid container spacing={2}>
          {Object.entries(modulesByGroup).map(([group, codes]) => (
            <Grid item xs={12} md={6} key={group}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{group}</Typography>
                <Stack spacing={1}>
                  {codes.map(code => {
                    const mod = modules.find(m => m.code === code);
                    return (
                      <Box key={code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography>{mod?.name || code}</Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={mod?.isEnabled ?? true}
                              onChange={(e) => handleToggle(code, e.target.checked)}
                              disabled={saving}
                            />
                          }
                          label={mod?.isEnabled !== false ? 'Enabled' : 'Disabled'}
                          labelPlacement="start"
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Modules;
