import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Grid, Card, CardContent,
  IconButton, Tooltip,
} from '@mui/material';
import { Add, ContentCopy, Delete, Search, CheckCircle, Redeem } from '@mui/icons-material';
import { couponApi } from '../services/phase4Api';
import { showSuccess, showError } from '../utils/toast';

const statusColors = { active:'success', inactive:'error' };

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genDialog, setGenDialog] = useState(false);
  const [genForm, setGenForm] = useState({ count:'1',prefix:'CPN',discountType:'percentage',discountValue:'10',minPurchase:'0',maxDiscount:'',usageLimit:'-1',perCustomerLimit:'1',startDate:'',endDate:''});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { const { data } = await couponApi.getAll({ limit:200, search }); setCoupons(data.data||[]); } catch{} finally{ setLoading(false); }
  }, [search]);
  useEffect(()=>{fetchData();},[fetchData]);

  const handleGenerate = async ()=>{
    setSaving(true);
    try{
      const payload={...genForm,count:parseInt(genForm.count)||1,minPurchase:parseFloat(genForm.minPurchase)||0,maxDiscount:genForm.maxDiscount?parseFloat(genForm.maxDiscount):null,usageLimit:parseInt(genForm.usageLimit),perCustomerLimit:parseInt(genForm.perCustomerLimit)};
      if(!payload.startDate)payload.startDate=new Date().toISOString();
      if(!payload.endDate)payload.endDate=new Date(Date.now()+30*24*60*60*1000).toISOString();
      const { data } = await couponApi.generate(payload);
      showSuccess(data.message);
      setGenDialog(false);fetchData();
    }catch(err){showError(err.response?.data?.message||'Generation failed');}finally{setSaving(false);}
  };

  const handleToggle = async (id)=>{
    try{await couponApi.toggleStatus(id);showSuccess('Status toggled');fetchData();}catch(err){showError('Action failed');}
  };
  const handleDelete = async (id)=>{
    try{await couponApi.delete(id);showSuccess('Coupon deleted');fetchData();}catch(err){showError(err.response?.data?.message||'Delete failed');}
  };

  const copyCode = (code)=>{navigator.clipboard.writeText(code);showSuccess('Code copied');};

  if(loading)return <Box sx={{display:'flex',justifyContent:'center',mt:8}}><CircularProgress/></Box>;

  return (
    <Box>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
        <Box><Typography variant="h5">Coupons</Typography><Typography variant="body2" color="text.secondary">Generate and manage discount coupons</Typography></Box>
        <Button variant="contained" startIcon={<Add/>} onClick={()=>setGenDialog(true)}>Generate Coupons</Button>
      </Box>

      <TextField placeholder="Search codes..." size="small" value={search} onChange={(e)=>setSearch(e.target.value)}
        InputProps={{startAdornment:<Search sx={{mr:1,color:'text.secondary'}}/>}} sx={{mb:3,width:300}}/>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell><TableCell>Type</TableCell><TableCell>Discount</TableCell>
              <TableCell>Usage</TableCell><TableCell>Validity</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map(c=>(
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} sx={{fontFamily:'monospace'}}>{c.code}</Typography>
                  <IconButton size="small" onClick={()=>copyCode(c.code)}><ContentCopy sx={{fontSize:12}}/></IconButton>
                </TableCell>
                <TableCell><Chip label={c.couponType} size="small" variant="outlined"/></TableCell>
                <TableCell>
                  {c.discountType==='percentage'?`${c.discountValue}%`:c.discountType==='fixed_amount'?`AED ${c.discountValue}`:`${c.discountValue} pts`}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{c.usageCount}{c.usageLimit>0?` / ${c.usageLimit}`:' / ∞'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}</Typography>
                </TableCell>
                <TableCell><Chip label={c.isActive?'Active':'Inactive'} color={c.isActive?'success':'default'} size="small"/></TableCell>
                <TableCell align="right">
                  <Tooltip title="Toggle"><IconButton size="small" onClick={()=>handleToggle(c.id)}><CheckCircle fontSize="small"/></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=>handleDelete(c.id)}><Delete fontSize="small"/></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length===0&&<TableRow><TableCell colSpan={7} align="center" sx={{py:4}}>No coupons found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={genDialog} onClose={()=>setGenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Coupons</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={6}><TextField fullWidth label="Count" type="number" size="small" value={genForm.count} onChange={e=>setGenForm({...genForm,count:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Prefix" size="small" value={genForm.prefix} onChange={e=>setGenForm({...genForm,prefix:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small"><InputLabel>Discount Type</InputLabel>
                <Select value={genForm.discountType} onChange={e=>setGenForm({...genForm,discountType:e.target.value})} label="Discount Type">
                  <MenuItem value="percentage">Percentage (%)</MenuItem><MenuItem value="fixed_amount">Fixed Amount (AED)</MenuItem><MenuItem value="points">Points</MenuItem>
                </Select></FormControl>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Discount Value" type="number" size="small" value={genForm.discountValue} onChange={e=>setGenForm({...genForm,discountValue:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Min Purchase (AED)" type="number" size="small" value={genForm.minPurchase} onChange={e=>setGenForm({...genForm,minPurchase:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Max Discount (AED)" type="number" size="small" value={genForm.maxDiscount} onChange={e=>setGenForm({...genForm,maxDiscount:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Usage Limit" type="number" size="small" value={genForm.usageLimit} onChange={e=>setGenForm({...genForm,usageLimit:e.target.value})} helperText="-1 = unlimited"/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Per Customer Limit" type="number" size="small" value={genForm.perCustomerLimit} onChange={e=>setGenForm({...genForm,perCustomerLimit:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Start Date" type="datetime-local" size="small" value={genForm.startDate} onChange={e=>setGenForm({...genForm,startDate:e.target.value})} InputLabelProps={{shrink:true}}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="End Date" type="datetime-local" size="small" value={genForm.endDate} onChange={e=>setGenForm({...genForm,endDate:e.target.value})} InputLabelProps={{shrink:true}}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={()=>setGenDialog(false)}>Cancel</Button><Button onClick={handleGenerate} variant="contained" disabled={saving}>{saving?<CircularProgress size={20}/>:'Generate'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Coupons;
