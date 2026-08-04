import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CircularProgress, Alert,
  MenuItem, TextField, Stack, Chip,
} from '@mui/material';
import { Assessment, People, Business, Subscriptions } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/superadmin';
const getToken = () => { try { return JSON.parse(localStorage.getItem('persist:sa_auth')).accessToken; } catch { return null; } };
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const Reports = () => {
  const [type, setType] = useState('companies');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try { setLoading(true); const { data: res } = await axios.get(`${API_BASE}/reports`, { ...auth(), params: { type } }); setData(res.data); }
      catch (e) { setError('Failed to load report'); }
      finally { setLoading(false); }
    })();
  }, [type]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Reports</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField select label="Report Type" value={type} onChange={e => setType(e.target.value)} sx={{ minWidth: 250 }}>
          <MenuItem value="companies">Companies Report</MenuItem>
          <MenuItem value="admins">Company Administrators</MenuItem>
          <MenuItem value="usage">Usage Statistics</MenuItem>
          <MenuItem value="subscriptions">Subscription Summary</MenuItem>
          <MenuItem value="login_history">Login History</MenuItem>
        </TextField>
      </Paper>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {data && !loading && (
        <>
          {type === 'companies' && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}><Card><CardContent><Typography color="text.secondary">Total</Typography><Typography variant="h4">{data.summary?.total || 0}</Typography></CardContent></Card></Grid>
                {Object.entries(data.summary?.byStatus || {}).map(([k, v]) => (
                  <Grid item xs={6} sm={3} key={k}><Card><CardContent><Typography color="text.secondary" textTransform="capitalize">{k.replace(/_/g, ' ')}</Typography><Typography variant="h4">{v}</Typography></CardContent></Card></Grid>
                ))}
              </Grid>
              <Typography variant="h6" gutterBottom>By Plan</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(data.summary?.byPlan || {}).map(([k, v]) => (
                  <Chip key={k} label={`${k}: ${v}`} color="primary" variant="outlined" />
                ))}
              </Stack>
            </>
          )}
          {type === 'admins' && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Card><CardContent><People /><Typography variant="h4">{data.summary?.total || 0}</Typography><Typography color="text.secondary">Total Admins</Typography></CardContent></Card></Grid>
              <Grid item xs={6}><Card><CardContent><People color="success" /><Typography variant="h4">{data.summary?.active || 0}</Typography><Typography color="text.secondary">Active Admins</Typography></CardContent></Card></Grid>
            </Grid>
          )}
          {type === 'usage' && (
            <Grid container spacing={2}>
              {[{ label: 'Total Companies', value: data.totalCompanies, icon: <Business /> }, { label: 'Active Companies', value: data.activeCompanies, icon: <Business color="success" /> }, { label: 'Total Users', value: data.totalUsers, icon: <People /> }, { label: 'Total Employees', value: data.totalEmployees, icon: <People color="info" /> }].map(m => (
                <Grid item xs={6} sm={3} key={m.label}><Card><CardContent>{m.icon}<Typography variant="h4">{m.value}</Typography><Typography color="text.secondary">{m.label}</Typography></CardContent></Card></Grid>
              ))}
            </Grid>
          )}
          {type === 'subscriptions' && (
            <Grid container spacing={2}>
              {(data.byPlan || []).map(p => (
                <Grid item xs={6} sm={3} key={p.subscriptionPlan}><Card><CardContent><Subscriptions /><Typography variant="h4">{p.count}</Typography><Typography color="text.secondary">{p.subscriptionPlan}</Typography></CardContent></Card></Grid>
              ))}
            </Grid>
          )}
          {type === 'login_history' && (
            <Typography color="text.secondary">{data?.length || 0} login records available.</Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default Reports;
