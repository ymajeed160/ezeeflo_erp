import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Autocomplete,
} from '@mui/material';
import { Add, Search, Payment, AddCard, Block } from '@mui/icons-material';
import { giftCardApi } from '../services/phase4Api';
import customerApi from '../services/customerApi';
import { showSuccess, showError } from '../utils/toast';

const statusColors = { active:'success', redeemed:'info', expired:'warning', canceled:'error', suspended:'default' };

const GiftCards = () => {
  const [cards, setCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [redeemDialog, setRedeemDialog] = useState({ open:false, card:null });
  const [rechargeDialog, setRechargeDialog] = useState({ open:false, card:null });
  const [purchForm, setPurchForm] = useState({ initialBalance:'', purchaserCustomerId:'', recipientEmail:'', recipientPhone:'', message:'', expiryDate:'' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { const { data } = await giftCardApi.getAll({ limit:200, search }); setCards(data.data||[]); } catch{} finally{ setLoading(false); }
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    try { const { data } = await customerApi.getAll({ limit:500 }); setCustomers(data.data||[]); } catch{}
  }, []);

  useEffect(()=>{fetchData();fetchCustomers();},[fetchData, fetchCustomers]);

  const handlePurchase = async ()=>{
    if(!purchForm.initialBalance){showError('Balance required');return;}
    setSaving(true);
    try{await giftCardApi.purchase({...purchForm,initialBalance:parseFloat(purchForm.initialBalance)});showSuccess('Gift card purchased');setPurchaseDialog(false);fetchData();}
    catch(err){showError(err.response?.data?.message||'Purchase failed');}finally{setSaving(false);}
  };

  const handleRedeem = async ()=>{
    if(!amount){showError('Amount required');return;}
    setSaving(true);
    try{const res=await giftCardApi.redeem({cardNumber:redeemDialog.card.cardNumber,amount:parseFloat(amount)});showSuccess(res.data.message);setRedeemDialog({open:false,card:null});fetchData();}
    catch(err){showError(err.response?.data?.message||'Redemption failed');}finally{setSaving(false);}
  };

  const handleRecharge = async ()=>{
    if(!amount){showError('Amount required');return;}
    setSaving(true);
    try{await giftCardApi.recharge({cardNumber:rechargeDialog.card.cardNumber,amount:parseFloat(amount)});showSuccess('Gift card recharged');setRechargeDialog({open:false,card:null});fetchData();}
    catch(err){showError(err.response?.data?.message||'Recharge failed');}finally{setSaving(false);}
  };

  const handleCancel = async (cardNumber)=>{
    try{await giftCardApi.cancel({cardNumber});showSuccess('Gift card canceled');fetchData();}
    catch(err){showError(err.response?.data?.message||'Cancel failed');}
  };

  if(loading)return <Box sx={{display:'flex',justifyContent:'center',mt:8}}><CircularProgress/></Box>;

  return (
    <Box>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
        <Box><Typography variant="h5">Gift Cards</Typography><Typography variant="body2" color="text.secondary">Purchase, redeem, and manage gift cards</Typography></Box>
        <Button variant="contained" startIcon={<AddCard/>} onClick={()=>setPurchaseDialog(true)}>Purchase Gift Card</Button>
      </Box>

      <TextField placeholder="Search by card number, email, phone..." size="small" value={search} onChange={(e)=>setSearch(e.target.value)}
        InputProps={{startAdornment:<Search sx={{mr:1,color:'text.secondary'}}/>}} sx={{mb:3,width:350}}/>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Card Number</TableCell><TableCell>PIN</TableCell><TableCell align="right">Balance</TableCell>
              <TableCell>Recipient</TableCell><TableCell>Status</TableCell><TableCell>Expiry</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cards.map(c=>(
              <TableRow key={c.id} hover>
                <TableCell><Typography variant="body2" fontWeight={600} sx={{fontFamily:'monospace'}}>{c.cardNumber}</Typography></TableCell>
                <TableCell>{c.pin}</TableCell>
                <TableCell align="right"><Typography fontWeight={600}>AED {parseFloat(c.currentBalance).toFixed(2)}</Typography><Typography variant="caption" color="text.secondary">of {parseFloat(c.initialBalance).toFixed(2)}</Typography></TableCell>
                <TableCell>{c.recipientEmail||c.recipientPhone||c.recipient?.firstName||'-'}</TableCell>
                <TableCell><Chip label={c.status} size="small" color={statusColors[c.status]}/></TableCell>
                <TableCell><Typography variant="caption">{c.expiryDate?new Date(c.expiryDate).toLocaleDateString():'-'}</Typography></TableCell>
                <TableCell align="right">
                  {c.status==='active'&&<>
                    <Button size="small" startIcon={<Payment/>} onClick={()=>{setRedeemDialog({open:true,card:c});setAmount('');}}>Redeem</Button>
                    <Button size="small" startIcon={<AddCard/>} onClick={()=>{setRechargeDialog({open:true,card:c});setAmount('');}}>Recharge</Button>
                  </>}
                  {!['redeemed','canceled'].includes(c.status)&&<Button size="small" color="error" startIcon={<Block/>} onClick={()=>handleCancel(c.cardNumber)}>Cancel</Button>}
                </TableCell>
              </TableRow>
            ))}
            {cards.length===0&&<TableRow><TableCell colSpan={7} align="center" sx={{py:4}}>No gift cards found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog} onClose={()=>setPurchaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Purchase Gift Card</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{mt:0.5}}>
            <Grid item xs={12}><TextField fullWidth label="Initial Balance (AED) *" type="number" size="small" value={purchForm.initialBalance} onChange={e=>setPurchForm({...purchForm,initialBalance:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                size="small"
                options={customers}
                getOptionLabel={(opt) => `[${opt.code}] ${opt.firstName} ${opt.lastName || ''}`}
                value={selectedCustomer}
                onChange={(e, newVal) => {
                  setSelectedCustomer(newVal);
                  setPurchForm({ ...purchForm, purchaserCustomerId: newVal?.id || '' });
                }}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => <TextField {...params} label="Purchaser Customer *" />}
              />
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Recipient Email" size="small" value={purchForm.recipientEmail} onChange={e=>setPurchForm({...purchForm,recipientEmail:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Recipient Phone" size="small" value={purchForm.recipientPhone} onChange={e=>setPurchForm({...purchForm,recipientPhone:e.target.value})}/></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Expiry Date" type="date" size="small" value={purchForm.expiryDate} onChange={e=>setPurchForm({...purchForm,expiryDate:e.target.value})} InputLabelProps={{shrink:true}}/></Grid>
            <Grid item xs={12}><TextField fullWidth label="Message" size="small" multiline rows={2} value={purchForm.message} onChange={e=>setPurchForm({...purchForm,message:e.target.value})}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={()=>setPurchaseDialog(false)}>Cancel</Button><Button onClick={handlePurchase} variant="contained" disabled={saving}>{saving?<CircularProgress size={20}/>:'Purchase'}</Button></DialogActions>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={redeemDialog.open} onClose={()=>setRedeemDialog({open:false,card:null})} maxWidth="xs" fullWidth>
        <DialogTitle>Redeem Gift Card</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{mb:2}}>Card: {redeemDialog.card?.cardNumber} | Balance: AED {parseFloat(redeemDialog.card?.currentBalance||0).toFixed(2)}</Typography>
          <TextField fullWidth label="Amount (AED)" type="number" size="small" value={amount} onChange={e=>setAmount(e.target.value)}/>
        </DialogContent>
        <DialogActions><Button onClick={()=>setRedeemDialog({open:false,card:null})}>Cancel</Button><Button onClick={handleRedeem} variant="contained" color="primary" disabled={saving}>Redeem</Button></DialogActions>
      </Dialog>

      {/* Recharge Dialog */}
      <Dialog open={rechargeDialog.open} onClose={()=>setRechargeDialog({open:false,card:null})} maxWidth="xs" fullWidth>
        <DialogTitle>Recharge Gift Card</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{mb:2}}>Card: {rechargeDialog.card?.cardNumber} | Current Balance: AED {parseFloat(rechargeDialog.card?.currentBalance||0).toFixed(2)}</Typography>
          <TextField fullWidth label="Amount (AED)" type="number" size="small" value={amount} onChange={e=>setAmount(e.target.value)}/>
        </DialogContent>
        <DialogActions><Button onClick={()=>setRechargeDialog({open:false,card:null})}>Cancel</Button><Button onClick={handleRecharge} variant="contained" color="success" disabled={saving}>Recharge</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default GiftCards;
