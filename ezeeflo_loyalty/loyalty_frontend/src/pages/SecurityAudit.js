import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, CircularProgress, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Alert, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Add, Delete, Block, ContentCopy, Search, History } from '@mui/icons-material';
import { integrationApi } from '../services/phase5Api';
import { showSuccess, showError } from '../utils/toast';

const SecurityAudit = () => {
  const [tab, setTab] = useState('keys');
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [entityTypes, setEntityTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyDialog, setKeyDialog] = useState(false);
  const [keyForm, setKeyForm] = useState({name:'',permissions:'read',rateLimit:'1000'});
  const [newKey, setNewKey] = useState(null);
  const [auditFilters, setAuditFilters] = useState({action:'',entityType:'',startDate:'',endDate:'',search:'',page:0});
  const [auditPages, setAuditPages] = useState(1);

  const fetchKeys = async ()=>{
    try{const {data}=await integrationApi.listKeys();setKeys(data.data||[]);}catch{}finally{setLoading(false);}
  };

  const fetchAudit = useCallback(async ()=>{
    setLoading(true);
    try{
      const [logRes, actRes, entRes] = await Promise.all([
        integrationApi.getAuditLogs({...auditFilters,page:auditFilters.page+1,limit:50}),
        integrationApi.getAuditActions(), integrationApi.getAuditEntityTypes(),
      ]);
      setLogs(logRes.data.data||[]); setAuditPages(logRes.data.meta?.pagination?.totalPages||1);
      setActions(actRes.data.data||[]); setEntityTypes(entRes.data.data||[]);
    }catch{}finally{setLoading(false);}
  },[auditFilters]);

  useEffect(()=>{if(tab==='keys')fetchKeys();else fetchAudit();},[tab,fetchAudit]);

  const handleCreateKey = async ()=>{
    try{
      const {data}=await integrationApi.createKey(keyForm);
      setNewKey(data.data.rawKey);
      showSuccess('API key created - copy it now!');
      setKeyDialog(false);fetchKeys();
    }catch(err){showError(err.response?.data?.message||'Failed');}
  };

  const handleRevoke = async (id)=>{try{await integrationApi.revokeKey(id);showSuccess('Key revoked');fetchKeys();}catch(err){showError('Revoke failed');}};
  const handleDeleteKey = async (id)=>{try{await integrationApi.deleteKey(id);showSuccess('Key deleted');fetchKeys();}catch(err){showError('Delete failed');}};

  const copyKey = (key)=>{navigator.clipboard.writeText(key);showSuccess('Copied');};

  if(loading&&tab==='keys')return <Box sx={{display:'flex',justifyContent:'center',mt:8}}><CircularProgress/></Box>;

  return (
    <Box>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
        <Box><Typography variant="h5">Security & Audit</Typography><Typography variant="body2" color="text.secondary">Manage API keys and view audit logs</Typography></Box>
        <Box sx={{display:'flex',gap:1}}>
          <Button variant={tab==='keys'?'contained':'outlined'} onClick={()=>setTab('keys')}>API Keys</Button>
          <Button variant={tab==='audit'?'contained':'outlined'} startIcon={<History/>} onClick={()=>setTab('audit')}>Audit Trail</Button>
        </Box>
      </Box>

      {newKey && <Alert severity="success" onClose={()=>setNewKey(null)} sx={{mb:2}}>
        <Typography variant="body2" fontWeight={600}>Your new API key (save it - won't be shown again):</Typography>
        <Typography variant="body2" sx={{fontFamily:'monospace',wordBreak:'break-all',my:1}}>{newKey}</Typography>
        <Button size="small" startIcon={<ContentCopy/>} onClick={()=>copyKey(newKey)}>Copy</Button>
      </Alert>}

      {tab === 'keys' ? (
        <>
          <Box sx={{mb:2}}><Button variant="contained" startIcon={<Add/>} onClick={()=>{setKeyDialog(true);setNewKey(null);}}>Create API Key</Button></Box>
          <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Prefix</TableCell><TableCell>Permissions</TableCell><TableCell>Rate Limit</TableCell><TableCell>Status</TableCell><TableCell>Last Used</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>
            {keys.map(k=><TableRow key={k.id}><TableCell>{k.name}</TableCell><TableCell><Typography sx={{fontFamily:'monospace',fontSize:12}}>{k.prefix}...</Typography></TableCell><TableCell>{(k.permissions||[]).join(', ')}</TableCell><TableCell>{k.rateLimit}/min</TableCell><TableCell><Chip label={k.isActive?'Active':'Revoked'} color={k.isActive?'success':'error'} size="small"/></TableCell><TableCell>{k.lastUsedAt?new Date(k.lastUsedAt).toLocaleString():'Never'}</TableCell><TableCell align="right">{k.isActive&&<Tooltip title="Revoke"><IconButton size="small" color="warning" onClick={()=>handleRevoke(k.id)}><Block fontSize="small"/></IconButton></Tooltip>}<Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=>handleDeleteKey(k.id)}><Delete fontSize="small"/></IconButton></Tooltip></TableCell></TableRow>)}
          </TableBody></Table></TableContainer>

          <Dialog open={keyDialog} onClose={()=>setKeyDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{mt:0.5}}>
                <Grid item xs={12}><TextField fullWidth size="small" label="Key Name" value={keyForm.name} onChange={e=>setKeyForm({...keyForm,name:e.target.value})}/></Grid>
                <Grid item xs={6}><TextField select fullWidth size="small" label="Permissions" value={keyForm.permissions} onChange={e=>setKeyForm({...keyForm,permissions:e.target.value})}>
                  <MenuItem value="read">Read</MenuItem><MenuItem value="read,write">Read & Write</MenuItem><MenuItem value="read,write,admin">Admin</MenuItem>
                </TextField></Grid>
                <Grid item xs={6}><TextField fullWidth size="small" label="Rate Limit (req/min)" type="number" value={keyForm.rateLimit} onChange={e=>setKeyForm({...keyForm,rateLimit:e.target.value})}/></Grid>
              </Grid>
            </DialogContent>
            <DialogActions><Button onClick={()=>setKeyDialog(false)}>Cancel</Button><Button onClick={handleCreateKey} variant="contained">Create</Button></DialogActions>
          </Dialog>
        </>
      ) : (
        <>
          <Box sx={{display:'flex',gap:1,mb:3,flexWrap:'wrap'}}>
            <TextField placeholder="Search..." size="small" value={auditFilters.search} onChange={e=>setAuditFilters({...auditFilters,search:e.target.value,page:0})} InputProps={{startAdornment:<Search sx={{mr:1,fontSize:18,color:'text.secondary'}}/>}} sx={{minWidth:200}}/>
            <FormControl size="small" sx={{minWidth:140}}><InputLabel>Action</InputLabel><Select value={auditFilters.action} onChange={e=>setAuditFilters({...auditFilters,action:e.target.value,page:0})} label="Action"><MenuItem value="">All</MenuItem>{actions.map(a=><MenuItem key={a} value={a}>{a}</MenuItem>)}</Select></FormControl>
            <FormControl size="small" sx={{minWidth:140}}><InputLabel>Entity</InputLabel><Select value={auditFilters.entityType} onChange={e=>setAuditFilters({...auditFilters,entityType:e.target.value,page:0})} label="Entity"><MenuItem value="">All</MenuItem>{entityTypes.map(e=><MenuItem key={e} value={e}>{e}</MenuItem>)}</Select></FormControl>
            <TextField type="date" size="small" label="From" value={auditFilters.startDate} onChange={e=>setAuditFilters({...auditFilters,startDate:e.target.value,page:0})} InputLabelProps={{shrink:true}}/>
            <TextField type="date" size="small" label="To" value={auditFilters.endDate} onChange={e=>setAuditFilters({...auditFilters,endDate:e.target.value,page:0})} InputLabelProps={{shrink:true}}/>
          </Box>

          <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Entity</TableCell><TableCell>IP</TableCell></TableRow></TableHead><TableBody>
            {logs.map(l=><TableRow key={l.id} hover><TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell><TableCell>{l.user?.username||'System'}</TableCell><TableCell><Chip label={l.action} size="small"/></TableCell><TableCell>{l.entityType}{l.entityId?`: ${l.entityId.substring(0,8)}...`:''}</TableCell><TableCell>{l.ipAddress||'-'}</TableCell></TableRow>)}
            {logs.length===0&&<TableRow><TableCell colSpan={5} align="center">No audit logs found</TableCell></TableRow>}
          </TableBody></Table></TableContainer>

          {auditPages>1&&<Box sx={{display:'flex',justifyContent:'center',mt:2,gap:1}}>
            <Button disabled={auditFilters.page===0} onClick={()=>setAuditFilters({...auditFilters,page:auditFilters.page-1})}>Prev</Button>
            <Typography sx={{py:1}}>Page {auditFilters.page+1} of {auditPages}</Typography>
            <Button disabled={auditFilters.page>=auditPages-1} onClick={()=>setAuditFilters({...auditFilters,page:auditFilters.page+1})}>Next</Button>
          </Box>}
        </>
      )}
    </Box>
  );
};

export default SecurityAudit;
