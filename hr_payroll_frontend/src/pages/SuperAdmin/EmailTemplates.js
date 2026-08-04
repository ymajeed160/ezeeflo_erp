import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, CircularProgress, Alert, Grid, Card, CardContent, Chip } from '@mui/material';
import { Save } from '@mui/icons-material';
import axios from 'axios';

const API = 'http://localhost:5001/api/superadmin';
const tk = () => { try { return JSON.parse(localStorage.getItem('persist:sa_auth')).accessToken; } catch { return null; } };
const h = () => ({ headers: { Authorization: `Bearer ${tk()}` } });

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get(`${API}/email-templates`, h()); setTemplates(data.data); }
      catch { setError('Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    try {
      await axios.put(`${API}/email-templates/${selected.code}`, selected, h());
      setSuccess('Template updated');
    } catch { setError('Save failed'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Email Templates</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ borderRadius: 2 }}>
            {templates.map(t => (
              <Box key={t.code} sx={{ p: 2, cursor: 'pointer', bgcolor: selected?.code === t.code ? 'primary.light' : 'transparent', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => setSelected({ ...t })}>
                <Typography fontWeight={600}>{t.name}</Typography>
                <Chip label={t.code} size="small" sx={{ mt: 0.5 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          {selected ? (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>{selected.name}</Typography>
                <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
              </Box>
              <TextField fullWidth label="Subject" value={selected.subject} sx={{ mb: 2 }}
                onChange={e => setSelected({ ...selected, subject: e.target.value })} />
              <TextField fullWidth label="Body (HTML)" value={selected.body} multiline rows={12}
                onChange={e => setSelected({ ...selected, body: e.target.value })} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Available variables: {'{{name}}'} {'{{username}}'} {'{{password}}'} {'{{company}}'} {'{{expiryDate}}'}
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}><Typography color="text.secondary">Select a template to edit</Typography></Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailTemplates;
