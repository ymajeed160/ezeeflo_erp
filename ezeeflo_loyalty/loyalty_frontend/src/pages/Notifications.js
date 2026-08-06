import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, CircularProgress, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Send, Search } from '@mui/icons-material';
import { notificationApi } from '../services/phase5Api';
import customerApi from '../services/customerApi';
import { showSuccess, showError } from '../utils/toast';

const channelIcons = { email:'📧', sms:'📱', push:'🔔', whatsapp:'💬' };

const Notifications = () => {
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [sendDialog, setSendDialog] = useState({open:false});
  const [templateDialog, setTemplateDialog] = useState({open:false,editing:null});
  const [sendForm, setSendForm] = useState({customerId:'',channel:'email',subject:'',body:'',templateCode:''});
  const [templateForm, setTemplateForm] = useState({name:'',code:'',channel:'email',subject:'',body:''});
  const [saving, setSaving] = useState(false);

  const fetchData = async ()=>{
    try{
      const [hRes, tRes] = await Promise.all([notificationApi.getHistory({limit:100}), notificationApi.getTemplates()]);
      setHistory(hRes.data.data||[]); setTemplates(tRes.data.data||[]);
    }catch{}finally{setLoading(false);}
  };
  useEffect(()=>{fetchData(); customerApi.getAll({limit:200}).then(({data})=>setCustomers(data.data||[])).catch(()=>{});},[]);

  const handleSend = async ()=>{
    if(!sendForm.customerId){showError('Select customer');return;}
    setSaving(true);
    try{await notificationApi.send(sendForm);showSuccess('Notification sent');setSendDialog({open:false});fetchData();}
    catch(err){showError(err.response?.data?.message||'Send failed');}finally{setSaving(false);}
  };

  const handleSaveTemplate = async ()=>{
    setSaving(true);
    try{
      if(templateDialog.editing){await notificationApi.updateTemplate(templateDialog.editing.id,templateForm);showSuccess('Template updated');}
      else{await notificationApi.createTemplate(templateForm);showSuccess('Template created');}
      setTemplateDialog({open:false,editing:null});fetchData();
    }catch(err){showError(err.response?.data?.message||'Save failed');}finally{setSaving(false);}
  };

  const handleDeleteTemplate = async (id)=>{try{await notificationApi.deleteTemplate(id);showSuccess('Deleted');fetchData();}catch(err){showError('Delete failed');}};

  if(loading)return <Box sx={{display:'flex',justifyContent:'center',mt:8}}><CircularProgress/></Box>;

  return (
    <Box>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
        <Box><Typography variant="h5">Notifications</Typography><Typography variant="body2" color="text.secondary">Send and manage customer notifications</Typography></Box>
        <Box sx={{display:'flex',gap:1}}>
          <Button variant="outlined" startIcon={<Add/>} onClick={()=>{setTemplateDialog({open:true,editing:null});setTemplateForm({name:'',code:'',channel:'email',subject:'',body:''});}}>Add Template</Button>
          <Button variant="contained" startIcon={<Send/>} onClick={()=>setSendDialog({open:true})}>Send Notification</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Templates */}
        <Grid item xs={12} md={5}>
          <Card><CardContent>
            <Typography variant="h6" sx={{mb:2}}>Templates</Typography>
            {templates.map(t=>(
              <Box key={t.id} sx={{mb:1.5,p:2,bgcolor:'grey.50',borderRadius:2}}>
                <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <Typography variant="body2" fontWeight={600}>{channelIcons[t.channel]} {t.name}</Typography>
                  <Box><Chip label={t.code} size="small" variant="outlined"/></Box>
                </Box>
                <Typography variant="caption" color="text.secondary">{t.subject}</Typography>
                <Box sx={{mt:0.5,display:'flex',gap:0.5}}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={()=>{setTemplateDialog({open:true,editing:t});setTemplateForm({name:t.name,code:t.code,channel:t.channel,subject:t.subject||'',body:t.body});}}><Edit fontSize="small"/></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=>handleDeleteTemplate(t.id)}><Delete fontSize="small"/></IconButton></Tooltip>
                </Box>
              </Box>
            ))}
            {templates.length===0&&<Typography color="text.secondary" variant="body2">No templates yet</Typography>}
          </CardContent></Card>
        </Grid>

        {/* History */}
        <Grid item xs={12} md={7}>
          <Card><CardContent>
            <Typography variant="h6" sx={{mb:2}}>Sent History</Typography>
            <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Recipient</TableCell><TableCell>Channel</TableCell><TableCell>Subject</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
              {history.map(h=><TableRow key={h.id}><TableCell>{new Date(h.createdAt).toLocaleString()}</TableCell><TableCell>{h.customer?.firstName||'System'} {h.customer?.lastName||''}</TableCell><TableCell>{channelIcons[h.channel]} {h.channel}</TableCell><TableCell>{h.subject}</TableCell><TableCell><Chip label={h.status} size="small" color={h.status==='sent'?'success':h.status==='failed'?'error':'default'}/></TableCell></TableRow>)}
            </TableBody></Table></TableContainer>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Send Dialog */}
      <Dialog open={sendDialog.open} onClose={()=>setSendDialog({open:false})} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={12}>
              <TextField select fullWidth size="small" label="Customer" value={sendForm.customerId} onChange={e=>setSendForm({...sendForm,customerId:e.target.value})}>
                {customers.map(c=><MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName||''} ({c.email||c.phone||'no contact'})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" label="Channel" value={sendForm.channel} onChange={e=>setSendForm({...sendForm,channel:e.target.value})}>
                <MenuItem value="email">Email</MenuItem><MenuItem value="sms">SMS</MenuItem><MenuItem value="push">Push</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" label="Template (optional)" value={sendForm.templateCode} onChange={e=>setSendForm({...sendForm,templateCode:e.target.value})}>
                <MenuItem value="">None</MenuItem>
                {templates.map(t=><MenuItem key={t.id} value={t.code}>{t.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Subject" value={sendForm.subject} onChange={e=>setSendForm({...sendForm,subject:e.target.value})}/></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Body" multiline rows={4} value={sendForm.body} onChange={e=>setSendForm({...sendForm,body:e.target.value})}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={()=>setSendDialog({open:false})}>Cancel</Button><Button onClick={handleSend} variant="contained" disabled={saving} startIcon={<Send/>}>Send</Button></DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialog.open} onClose={()=>setTemplateDialog({open:false,editing:null})} maxWidth="sm" fullWidth>
        <DialogTitle>{templateDialog.editing?'Edit Template':'New Template'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={6}><TextField fullWidth size="small" label="Name" value={templateForm.name} onChange={e=>setTemplateForm({...templateForm,name:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Code" value={templateForm.code} onChange={e=>setTemplateForm({...templateForm,code:e.target.value})} disabled={!!templateDialog.editing}/></Grid>
            <Grid item xs={6}><TextField select fullWidth size="small" label="Channel" value={templateForm.channel} onChange={e=>setTemplateForm({...templateForm,channel:e.target.value})}><MenuItem value="email">Email</MenuItem><MenuItem value="sms">SMS</MenuItem><MenuItem value="push">Push</MenuItem></TextField></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Subject" value={templateForm.subject} onChange={e=>setTemplateForm({...templateForm,subject:e.target.value})}/></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Body" multiline rows={4} value={templateForm.body} onChange={e=>setTemplateForm({...templateForm,body:e.target.value})} helperText="Use {{variable}} for placeholders"/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={()=>setTemplateDialog({open:false,editing:null})}>Cancel</Button><Button onClick={handleSaveTemplate} variant="contained" disabled={saving}>Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;
