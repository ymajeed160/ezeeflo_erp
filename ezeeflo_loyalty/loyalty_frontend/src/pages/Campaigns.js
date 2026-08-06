import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, LinearProgress,
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow, Pause, Stop, Search } from '@mui/icons-material';
import { campaignApi } from '../services/phase4Api';
import { showSuccess, showError } from '../utils/toast';

const campaignTypeLabels = {
  points_multiplier:'Multiplier', bonus_points:'Bonus Points', birthday:'Birthday', welcome:'Welcome',
  referral:'Referral', festival:'Festival', weekend:'Weekend', spend_threshold:'Spend Threshold',
  product:'Product', category:'Category', store:'Store',
};

const statusColors = { draft:'default', active:'success', paused:'warning', ended:'info', canceled:'error' };

const defaultForm = { name:'', code:'', description:'', campaignType:'points_multiplier', status:'draft',
  startDate:'', endDate:'', rules:'', targetSegments:'', budget:'', priority:'0' };

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { const { data } = await campaignApi.getAll({ limit:100, search }); setCampaigns(data.data||[]); } catch{} finally{ setLoading(false); }
  }, [search]);
  useEffect(()=>{fetchData();},[fetchData]);

  const openCreate = ()=>{setEditing(null);setForm(defaultForm);setDialogOpen(true);};
  const openEdit = (c)=>{setEditing(c);setForm({...c,startDate:c.startDate?.substring(0,16),endDate:c.endDate?.substring(0,16),rules:typeof c.rules==='string'?c.rules:JSON.stringify(c.rules||{}),targetSegments:typeof c.targetSegments==='string'?c.targetSegments:JSON.stringify(c.targetSegments||[]),budget:c.budget||'',priority:String(c.priority||0)});setDialogOpen(true);};

  const handleSave = async ()=>{
    if(!form.name||!form.code){showError('Name and code required');return;}
    setSaving(true);
    try{
      let payload={...form,budget:form.budget?parseFloat(form.budget):null,priority:parseInt(form.priority)||0};
      try{payload.rules=JSON.parse(form.rules||'{}');}catch{payload.rules={};}
      try{payload.targetSegments=JSON.parse(form.targetSegments||'[]');}catch{payload.targetSegments=[];}
      if(editing){await campaignApi.update(editing.id,payload);showSuccess('Campaign updated');}
      else{await campaignApi.create(payload);showSuccess('Campaign created');}
      setDialogOpen(false);fetchData();
    }catch(err){showError(err.response?.data?.message||'Save failed');}finally{setSaving(false);}
  };

  const handleStatus = async (id, status)=>{
    try{await campaignApi.updateStatus(id,status);showSuccess(`Campaign ${status}`);fetchData();}catch(err){showError(err.response?.data?.message||'Action failed');}
  };

  const handleDelete = async (id)=>{
    try{await campaignApi.delete(id);showSuccess('Campaign deleted');fetchData();}catch(err){showError(err.response?.data?.message||'Delete failed');}
  };

  if(loading)return <Box sx={{display:'flex',justifyContent:'center',mt:8}}><CircularProgress/></Box>;

  return (
    <Box>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
        <Box><Typography variant="h5">Campaigns</Typography><Typography variant="body2" color="text.secondary">Marketing campaigns and promotions</Typography></Box>
        <Button variant="contained" startIcon={<Add/>} onClick={openCreate}>Create Campaign</Button>
      </Box>

      <TextField placeholder="Search campaigns..." size="small" value={search} onChange={(e)=>setSearch(e.target.value)}
        InputProps={{startAdornment:<Search sx={{mr:1,color:'text.secondary'}}/>}} sx={{mb:3,width:300}}/>

      <Grid container spacing={3}>
        {campaigns.map(c=>{
          const now=new Date();const isRunning=c.status==='active'&&new Date(c.startDate)<=now&&new Date(c.endDate)>=now;
          const progress=c.startDate&&c.endDate?Math.min(100,Math.max(0,((now-new Date(c.startDate))/(new Date(c.endDate)-new Date(c.startDate)))*100)):0;
          return(
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card sx={{height:'100%',display:'flex',flexDirection:'column',borderTop:`4px solid ${isRunning?'#10B981':c.status==='draft'?'#9CA3AF':c.status==='paused'?'#F59E0B':'#6B7280'}`}}>
                <CardContent sx={{flexGrow:1}}>
                  <Box sx={{display:'flex',justifyContent:'space-between',mb:1}}>
                    <Chip label={campaignTypeLabels[c.campaignType]||c.campaignType} size="small" variant="outlined"/>
                    <Chip label={c.status} size="small" color={statusColors[c.status]}/>
                  </Box>
                  <Typography variant="h6" fontWeight={600}>{c.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{display:'block',mb:1}}>{c.code}</Typography>
                  {c.description&&<Typography variant="body2" color="text.secondary" sx={{mb:1}}>{c.description}</Typography>}
                  <Box sx={{mb:1}}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {c.budget>0&&<Box sx={{mt:1}}>
                    <LinearProgress variant="determinate" value={c.budget>0?Math.min(100,(parseFloat(c.budgetSpent||0)/parseFloat(c.budget))*100):0} sx={{height:6,borderRadius:3}}/>
                    <Typography variant="caption">Budget: AED {parseFloat(c.budgetSpent||0).toLocaleString()} / {parseFloat(c.budget).toLocaleString()}</Typography>
                  </Box>}
                  {c.rules?.multiplier&&<Chip label={`${c.rules.multiplier}x`} size="small" color="primary" sx={{mt:1}}/>}
                </CardContent>
                <CardActions sx={{px:2,pb:2,justifyContent:'space-between'}}>
                  <Box>
                    {c.status==='draft'&&<Tooltip title="Activate"><IconButton size="small" color="success" onClick={()=>handleStatus(c.id,'active')}><PlayArrow fontSize="small"/></IconButton></Tooltip>}
                    {c.status==='active'&&<Tooltip title="Pause"><IconButton size="small" color="warning" onClick={()=>handleStatus(c.id,'paused')}><Pause fontSize="small"/></IconButton></Tooltip>}
                    {(c.status==='active'||c.status==='paused')&&<Tooltip title="End"><IconButton size="small" onClick={()=>handleStatus(c.id,'ended')}><Stop fontSize="small"/></IconButton></Tooltip>}
                  </Box>
                  <Box>
                    <Tooltip title="Edit"><IconButton size="small" onClick={()=>openEdit(c)}><Edit fontSize="small"/></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=>handleDelete(c.id)}><Delete fontSize="small"/></IconButton></Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={dialogOpen} onClose={()=>setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing?'Edit Campaign':'New Campaign'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Name *" size="small" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Code *" size="small" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} disabled={!!editing}/></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" size="small" multiline rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small"><InputLabel>Type *</InputLabel>
                <Select value={form.campaignType} onChange={e=>setForm({...form,campaignType:e.target.value})} label="Type *">
                  {Object.entries(campaignTypeLabels).map(([k,v])=><MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select></FormControl>
            </Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Start Date" type="datetime-local" size="small" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} InputLabelProps={{shrink:true}}/></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="End Date" type="datetime-local" size="small" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} InputLabelProps={{shrink:true}}/></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Budget" type="number" size="small" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} helperText="AED"/></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Priority" type="number" size="small" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}/></Grid>
            <Grid item xs={12}><TextField fullWidth label="Rules (JSON)" size="small" multiline rows={3} value={form.rules} onChange={e=>setForm({...form,rules:e.target.value})} helperText='e.g. {"multiplier": 2, "bonusPoints": 50}'/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={()=>setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} variant="contained" disabled={saving}>{saving?<CircularProgress size={20}/>:'Save'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Campaigns;
