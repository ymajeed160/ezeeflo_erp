import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select,
  MenuItem, Tooltip, IconButton,
} from '@mui/material';
import { Add, Share, CardGiftcard, EmojiEvents, Search, ContentCopy } from '@mui/icons-material';
import { referralApi } from '../services/phase4Api';
import customerApi from '../services/customerApi';
import { showSuccess, showError } from '../utils/toast';

const statusColors = { pending:'warning', registered:'info', rewarded:'success', expired:'default', canceled:'error' };

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [genDialog, setGenDialog] = useState({ open:false, customerId:'' });
  const [regDialog, setRegDialog] = useState({ open:false });
  const [regForm, setRegForm] = useState({ referralCode:'', firstName:'', lastName:'', phone:'', email:'' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try{
      const [refRes, statsRes] = await Promise.all([
        referralApi.getAll({ limit:100, search }),
        referralApi.getStats(),
      ]);
      setReferrals(refRes.data.data||[]);setStats(statsRes.data.data);
    }catch{}finally{setLoading(false);}
  }, [search]);
  useEffect(()=>{fetchData();},[fetchData]);
  useEffect(()=>{customerApi.getAll({limit:200}).then(({data})=>setCustomers(data.data||[])).catch(()=>{});},[]);

  const handleGenerate = async ()=>{
    if(!genDialog.customerId){showError('Select a customer');return;}
    setSaving(true);
    try{const {data}=await referralApi.generateCode({customerId:genDialog.customerId});showSuccess('Referral code generated');setGenDialog({open:false,customerId:''});fetchData();}
    catch(err){showError(err.response?.data?.message||'Failed');}finally{setSaving(false);}
  };

  const handleRegister = async ()=>{
    if(!regForm.referralCode||!regForm.firstName||!regForm.phone){showError('Required fields missing');return;}
    setSaving(true);
    try{await referralApi.register(regForm);showSuccess('Referral registered');setRegDialog({open:false});fetchData();}
    catch(err){showError(err.response?.data?.message||'Registration failed');}finally{setSaving(false);}
  };

  const handleGrantRewards = async (id)=>{
    try{await referralApi.grantRewards(id);showSuccess('Rewards granted');fetchData();}
    catch(err){showError(err.response?.data?.message||'Failed');}
  };

  const copyCode = (code)=>{navigator.clipboard.writeText(code);showSuccess('Code copied');};

  if(loading)return <Box sx={{display:'flex',justifyContent:'center',mt:8}}><CircularProgress/></Box>;

  return (
    <Box>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
        <Box><Typography variant="h5">Referrals</Typography><Typography variant="body2" color="text.secondary">Customer referral program</Typography></Box>
        <Box sx={{display:'flex',gap:1}}>
          <Button variant="outlined" startIcon={<Add/>} onClick={()=>setRegDialog({open:true})}>Register Referral</Button>
          <Button variant="contained" startIcon={<Share/>} onClick={()=>setGenDialog({open:true,customerId:''})}>Generate Code</Button>
        </Box>
      </Box>

      {/* Stats */}
      {stats&&(
        <Grid container spacing={2} sx={{mb:3}}>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{py:'12px!important',px:2}}><Typography variant="h6" fontWeight={700}>{stats.totalReferrals}</Typography><Typography variant="caption" color="text.secondary">Total Referrals</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{py:'12px!important',px:2}}><Typography variant="h6" fontWeight={700} color="warning.main">{stats.pendingReferrals}</Typography><Typography variant="caption" color="text.secondary">Pending</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{py:'12px!important',px:2}}><Typography variant="h6" fontWeight={700} color="success.main">{stats.rewardedReferrals}</Typography><Typography variant="caption" color="text.secondary">Rewarded</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{py:'12px!important',px:2}}><Typography variant="h6" fontWeight={700}>{stats.conversionRate}%</Typography><Typography variant="caption" color="text.secondary">Conversion Rate</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      <TextField placeholder="Search..." size="small" value={search} onChange={(e)=>setSearch(e.target.value)}
        InputProps={{startAdornment:<Search sx={{mr:1,color:'text.secondary'}}/>}} sx={{mb:3,width:280}}/>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Referrer</TableCell><TableCell>Referred</TableCell><TableCell>Code</TableCell>
              <TableCell>Status</TableCell><TableCell>Reward</TableCell><TableCell>Date</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {referrals.map(r=>(
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{r.referrer?.firstName} {r.referrer?.lastName||''}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.referrer?.code}</Typography>
                </TableCell>
                <TableCell>
                  {r.referred?<><Typography variant="body2">{r.referred.firstName} {r.referred.lastName||''}</Typography><Typography variant="caption" color="text.secondary">{r.referred.code}</Typography></>:<Typography variant="caption" color="text.secondary">{r.referredEmail||r.referredPhone||'Pending'}</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{fontFamily:'monospace'}}>{r.referralCode}</Typography>
                  <IconButton size="small" onClick={()=>copyCode(r.referralCode)}><ContentCopy sx={{fontSize:12}}/></IconButton>
                </TableCell>
                <TableCell><Chip label={r.status} size="small" color={statusColors[r.status]}/></TableCell>
                <TableCell>{r.rewardValue} {r.rewardType}</TableCell>
                <TableCell><Typography variant="caption">{new Date(r.createdAt).toLocaleDateString()}</Typography></TableCell>
                <TableCell align="right">
                  {r.status==='registered'&&<Tooltip title="Grant Rewards"><IconButton size="small" color="success" onClick={()=>handleGrantRewards(r.id)}><EmojiEvents fontSize="small"/></IconButton></Tooltip>}
                </TableCell>
              </TableRow>
            ))}
            {referrals.length===0&&<TableRow><TableCell colSpan={7} align="center" sx={{py:4}}>No referrals found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Generate Code Dialog */}
      <Dialog open={genDialog.open} onClose={()=>setGenDialog({open:false,customerId:''})} maxWidth="xs" fullWidth>
        <DialogTitle>Generate Referral Code</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{mt:1}}><InputLabel>Customer</InputLabel>
            <Select value={genDialog.customerId} onChange={e=>setGenDialog({...genDialog,customerId:e.target.value})} label="Customer">
              {customers.map(c=><MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName||''} ({c.code})</MenuItem>)}
            </Select></FormControl>
        </DialogContent>
        <DialogActions><Button onClick={()=>setGenDialog({open:false,customerId:''})}>Cancel</Button><Button onClick={handleGenerate} variant="contained" disabled={saving}>Generate</Button></DialogActions>
      </Dialog>

      {/* Register Referral Dialog */}
      <Dialog open={regDialog.open} onClose={()=>setRegDialog({open:false})} maxWidth="sm" fullWidth>
        <DialogTitle>Register Referral</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={12}><TextField fullWidth label="Referral Code *" size="small" value={regForm.referralCode} onChange={e=>setRegForm({...regForm,referralCode:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="First Name *" size="small" value={regForm.firstName} onChange={e=>setRegForm({...regForm,firstName:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Last Name" size="small" value={regForm.lastName} onChange={e=>setRegForm({...regForm,lastName:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Phone *" size="small" value={regForm.phone} onChange={e=>setRegForm({...regForm,phone:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Email" size="small" value={regForm.email} onChange={e=>setRegForm({...regForm,email:e.target.value})}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={()=>setRegDialog({open:false})}>Cancel</Button><Button onClick={handleRegister} variant="contained" disabled={saving}>Register</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Referrals;
