import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Chip,
} from '@mui/material';
import {
  People, Loyalty, Redeem, TrendingUp, TrendingDown, Campaign,
  Star, AttachMoney,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from '../services/phase5Api';

const COLORS = ['#4F46E5','#F59E0B','#10B981','#EF4444','#8B5CF6','#06B6D4'];

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const fetchAll = async ()=>{
      try{
        const [dRes, tRes, cRes, gRes] = await Promise.all([
          analyticsApi.dashboard(), analyticsApi.monthlyTrends({months:12}),
          analyticsApi.topCampaigns({limit:5}), analyticsApi.customerGrowth({months:12}),
        ]);
        setDashboard(dRes.data.data); setTrends(tRes.data.data);
        setTopCampaigns(cRes.data.data); setGrowth(gRes.data.data);
      }catch{}finally{setLoading(false);}
    };
    fetchAll();
  },[]);

  if(loading)return <Box sx={{display:'flex',justifyContent:'center',mt:8}}><CircularProgress/></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{mb:1}}>Analytics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{mb:3}}>Advanced insights and performance metrics</Typography>

      {/* KPI Cards */}
      {dashboard && <Grid container spacing={2} sx={{mb:3}}>
        <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1.5,px:2}}><Typography variant="h5" fontWeight={700}>{dashboard.customers?.total}</Typography><Typography variant="caption" color="text.secondary">Total Customers</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1.5,px:2}}><Typography variant="h5" fontWeight={700} color="success.main">{dashboard.customers?.active}</Typography><Typography variant="caption" color="text.secondary">Active ({dashboard.customers?.activeRate}%)</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1.5,px:2}}><Typography variant="h5" fontWeight={700}>{dashboard.points?.thisMonth?.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Points This Month {dashboard.points?.growth>0?<TrendingUp sx={{fontSize:14,verticalAlign:'middle',color:'success.main'}}/>:<TrendingDown sx={{fontSize:14,verticalAlign:'middle',color:'error.main'}}/>} {dashboard.points?.growth}%</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent sx={{py:1.5,px:2}}><Typography variant="h5" fontWeight={700}>{dashboard.redemptions?.thisMonth?.toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Redeemed This Month</Typography></CardContent></Card></Grid>
      </Grid>}

      <Grid container spacing={3}>
        {/* Monthly Trends Chart */}
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Typography variant="h6" sx={{mb:2}}>Monthly Points Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
                <Tooltip/><Bar dataKey="earned" fill="#10B981" name="Earned" radius={[4,4,0,0]}/><Bar dataKey="redeemed" fill="#EF4444" name="Redeemed" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </Grid>

        {/* Tier Distribution */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" sx={{mb:2}}>Tier Distribution</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={dashboard?.tiers||[]} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,count})=>`${name}: ${count}`}>
                {(dashboard?.tiers||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </Grid>

        {/* Customer Growth Line Chart */}
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" sx={{mb:2}}>Customer Growth</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growth}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
                <Tooltip/><Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={2} dot={{r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </Grid>

        {/* Top Campaigns */}
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" sx={{mb:2}}>Top Campaigns</Typography>
            {topCampaigns.map((c,i)=>(
              <Box key={i} sx={{mb:1.5}}>
                <Box sx={{display:'flex',justifyContent:'space-between',mb:0.5}}>
                  <Typography variant="body2" fontWeight={500}>{c.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.pointsIssued?.toLocaleString()} pts</Typography>
                </Box>
                <Box sx={{display:'flex',gap:1}}>
                  <Chip label={c.type} size="small"/><Chip label={c.status} size="small" color={c.status==='active'?'success':'default'}/>
                  <Typography variant="caption" color="text.secondary" sx={{ml:'auto'}}>{c.transactions} txns</Typography>
                </Box>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
