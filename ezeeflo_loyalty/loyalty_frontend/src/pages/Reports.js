import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, CircularProgress, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Download, Assessment, People, Loyalty, Redeem, Campaign, TrendingUp, Warning, Star, AttachMoney } from '@mui/icons-material';
import { reportsApi } from '../services/phase5Api';
import { showError } from '../utils/toast';

const reportTypes = [
  { key:'customerLedger', label:'Customer Ledger', icon:<People/>, desc:'All point transactions' },
  { key:'pointsExpiry', label:'Points Expiry', icon:<Warning/>, desc:'Points expiring soon' },
  { key:'redeemedRewards', label:'Redeemed Rewards', icon:<Redeem/>, desc:'Reward redemption history' },
  { key:'campaignPerformance', label:'Campaign Performance', icon:<Campaign/>, desc:'Campaign ROI analysis' },
  { key:'topCustomers', label:'Top Customers', icon:<Star/>, desc:'Highest point earners' },
  { key:'inactiveCustomers', label:'Inactive Customers', icon:<People/>, desc:'Dormant customer accounts' },
  { key:'membershipReport', label:'Membership Report', icon:<Loyalty/>, desc:'Tier distribution' },
  { key:'revenueImpact', label:'Revenue Impact', icon:<AttachMoney/>, desc:'Points to revenue correlation' },
];

const Reports = () => {
  const [reportType, setReportType] = useState('customerLedger');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState('30');

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      const params = { startDate, endDate, days };
      switch (reportType) {
        case 'customerLedger': res = await reportsApi.customerLedger(params); break;
        case 'pointsExpiry': res = await reportsApi.pointsExpiry(params); break;
        case 'redeemedRewards': res = await reportsApi.redeemedRewards(params); break;
        case 'campaignPerformance': res = await reportsApi.campaignPerformance(params); break;
        case 'topCustomers': res = await reportsApi.topCustomers({ limit:20 }); break;
        case 'inactiveCustomers': res = await reportsApi.inactiveCustomers(params); break;
        case 'membershipReport': res = await reportsApi.membershipReport(); break;
        case 'revenueImpact': res = await reportsApi.revenueImpact(params); break;
        default: return;
      }
      setData(res.data.data);
    } catch (err) { showError('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => { setData(null); fetchReport(); }, [reportType]); // eslint-disable-line

  const currentReport = reportTypes.find(r => r.key === reportType);

  const toArray = (d) => Array.isArray(d) ? d : (d?.data || d?.rows || d?.campaigns || d?.customers || d?.tiers || []);

  const renderContent = () => {
    if (!data) return null;

    switch (reportType) {
      case 'customerLedger':
        return (
          <>
            {data.summary && (
              <Grid container spacing={2} sx={{ mb:3 }}>
                <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1,px:2}}><Typography variant="h6" color="success.main">+{data.summary.totalEarned?.toLocaleString()}</Typography><Typography variant="caption">Earned</Typography></CardContent></Card></Grid>
                <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1,px:2}}><Typography variant="h6" color="error.main">-{data.summary.totalRedeemed?.toLocaleString()}</Typography><Typography variant="caption">Redeemed</Typography></CardContent></Card></Grid>
                <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1,px:2}}><Typography variant="h6">{data.summary.totalExpired?.toLocaleString()}</Typography><Typography variant="caption">Expired</Typography></CardContent></Card></Grid>
                <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1,px:2}}><Typography variant="h6">{data.summary.totalAdjustments}</Typography><Typography variant="caption">Adjusted</Typography></CardContent></Card></Grid>
              </Grid>
            )}
            <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Type</TableCell><TableCell align="right">Points</TableCell><TableCell>Source</TableCell></TableRow></TableHead><TableBody>
              {(data.transactions||[]).map(t=><TableRow key={t.id}><TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell><TableCell>{t.customer?.firstName} {t.customer?.lastName||''}</TableCell><TableCell><Chip label={t.transactionType} size="small"/></TableCell><TableCell align="right"><Typography fontWeight={600} color={t.points>0?'success.main':'error.main'}>{t.points>0?'+':''}{t.points}</Typography></TableCell><TableCell>{t.source||'-'}</TableCell></TableRow>)}
            </TableBody></Table></TableContainer>
          </>
        );
      case 'pointsExpiry':
        return <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Customer</TableCell><TableCell align="right">Expiring Points</TableCell><TableCell>Expiry Date</TableCell></TableRow></TableHead><TableBody>
          {(data.expiring||[]).map(e=><TableRow key={e.id}><TableCell>{e.customer?.firstName} {e.customer?.lastName||''}</TableCell><TableCell align="right"><Typography color="warning.main" fontWeight={600}>{e.points}</Typography></TableCell><TableCell>{e.expiresAt?new Date(e.expiresAt).toLocaleDateString():'-'}</TableCell></TableRow>)}
        </TableBody></Table></TableContainer>;
      case 'redeemedRewards':
        return <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Reward</TableCell><TableCell align="right">Points</TableCell></TableRow></TableHead><TableBody>
          {(data.redemptions||[]).map(r=><TableRow key={r.id}><TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell><TableCell>{r.customer?.firstName} {r.customer?.lastName||''}</TableCell><TableCell>{r.reward?.name||'-'}</TableCell><TableCell align="right">{r.pointsRedeemed}</TableCell></TableRow>)}
        </TableBody></Table></TableContainer>;
      case 'campaignPerformance':
        return <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Campaign</TableCell><TableCell>Status</TableCell><TableCell align="right">Points Issued</TableCell><TableCell align="right">Transactions</TableCell><TableCell align="right">Budget</TableCell><TableCell>ROI</TableCell></TableRow></TableHead><TableBody>
          {toArray(data).map(c=><TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell><Chip label={c.status} size="small"/></TableCell><TableCell align="right">{c.pointsIssued?.toLocaleString()}</TableCell><TableCell align="right">{c.transactionCount}</TableCell><TableCell align="right">AED {c.budget}</TableCell><TableCell>{c.roi}</TableCell></TableRow>)}
        </TableBody></Table></TableContainer>;
      case 'topCustomers':
        return <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>#</TableCell><TableCell>Customer</TableCell><TableCell>Membership</TableCell><TableCell align="right">Available Points</TableCell><TableCell align="right">Lifetime Value</TableCell></TableRow></TableHead><TableBody>
          {toArray(data).map((c,i)=><TableRow key={c.id}><TableCell>{i+1}</TableCell><TableCell>{c.firstName} {c.lastName||''} ({c.code})</TableCell><TableCell><Chip label={c.loyaltyAccount?.membership?.name||'Standard'} size="small"/></TableCell><TableCell align="right">{c.loyaltyAccount?.availablePoints?.toLocaleString()}</TableCell><TableCell align="right">AED {parseFloat(c.lifetimeValue||0).toLocaleString()}</TableCell></TableRow>)}
        </TableBody></Table></TableContainer>;
      case 'inactiveCustomers':
        return <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Customer</TableCell><TableCell>Last Visit</TableCell><TableCell align="right">Available Points</TableCell></TableRow></TableHead><TableBody>
          {toArray(data).map(c=><TableRow key={c.id}><TableCell>{c.firstName} {c.lastName||''} ({c.code})</TableCell><TableCell>{c.lastVisitDate?new Date(c.lastVisitDate).toLocaleDateString():'Never'}</TableCell><TableCell align="right">{c.loyaltyAccount?.availablePoints||0}</TableCell></TableRow>)}
        </TableBody></Table></TableContainer>;
      case 'membershipReport':
        return <Grid container spacing={2}>{toArray(data).map(t=><Grid item xs={12} sm={6} md={4} key={t.code}><Card sx={{borderTop:`4px solid ${t.color||'#6B7280'}`}}><CardContent><Typography variant="h6">{t.name}</Typography><Typography variant="h4" fontWeight={700}>{t.customerCount}</Typography><Typography variant="caption" color="text.secondary">Members</Typography><Box sx={{mt:1}}><Typography variant="body2">Avg: {t.avgPoints?.toLocaleString()} pts</Typography><Typography variant="body2">Earned: {t.totalEarned?.toLocaleString()}</Typography><Typography variant="body2">Redeemed: {t.totalRedeemed?.toLocaleString()}</Typography></Box></CardContent></Card></Grid>)}</Grid>;
      case 'revenueImpact':
        return <Grid container spacing={2}>
          <Grid item xs={6} sm={4}><Card><CardContent><Typography variant="h5">AED {data?.estimatedRevenue?.toLocaleString()}</Typography><Typography variant="caption">Est. Revenue</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={4}><Card><CardContent><Typography variant="h5">{data?.totalPointsEarned?.toLocaleString()}</Typography><Typography variant="caption">Points Earned</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={4}><Card><CardContent><Typography variant="h5">{data?.totalPointsRedeemed?.toLocaleString()}</Typography><Typography variant="caption">Points Redeemed</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={4}><Card><CardContent><Typography variant="h5">{data?.redemptionRate}%</Typography><Typography variant="caption">Redemption Rate</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={4}><Card><CardContent><Typography variant="h5">{data?.activeCustomers}</Typography><Typography variant="caption">Active Customers</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={4}><Card><CardContent><Typography variant="h5">{data?.activeRate}</Typography><Typography variant="caption">Active Rate</Typography></CardContent></Card></Grid>
        </Grid>;
      default: return null;
    }
  };

  return (
    <Box>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
        <Box><Typography variant="h5">Reports</Typography><Typography variant="body2" color="text.secondary">Generate and view business reports</Typography></Box>
        <Button variant="outlined" startIcon={<Download/>}>Export</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="subtitle2" sx={{mb:1}}>Report Type</Typography>
            {reportTypes.map(r=>(
              <Button key={r.key} fullWidth variant={reportType===r.key?'contained':'text'} startIcon={r.icon}
                onClick={()=>setReportType(r.key)} sx={{justifyContent:'flex-start',mb:0.5,textTransform:'none'}} size="small">
                {r.label}
              </Button>
            ))}
          </CardContent></Card>

          <Card sx={{mt:2}}><CardContent>
            <Typography variant="subtitle2" sx={{mb:1}}>Filters</Typography>
            <TextField type="date" size="small" fullWidth label="Start Date" value={startDate} onChange={e=>setStartDate(e.target.value)} InputLabelProps={{shrink:true}} sx={{mb:1}}/>
            <TextField type="date" size="small" fullWidth label="End Date" value={endDate} onChange={e=>setEndDate(e.target.value)} InputLabelProps={{shrink:true}} sx={{mb:1}}/>
            <TextField size="small" fullWidth label="Days" type="number" value={days} onChange={e=>setDays(e.target.value)} sx={{mb:1}}/>
            <Button variant="contained" fullWidth onClick={fetchReport} disabled={loading}>{loading?<CircularProgress size={20}/>:'Run Report'}</Button>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card><CardContent>
            <Box sx={{display:'flex',alignItems:'center',gap:2,mb:3}}>
              {currentReport?.icon}
              <Box><Typography variant="h6">{currentReport?.label}</Typography><Typography variant="body2" color="text.secondary">{currentReport?.desc}</Typography></Box>
            </Box>
            {renderContent()}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
