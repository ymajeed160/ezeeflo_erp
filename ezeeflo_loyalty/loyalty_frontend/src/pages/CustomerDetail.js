import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Divider, LinearProgress, Select, MenuItem, FormControl,
} from '@mui/material';
import {
  ArrowBack, Edit, Delete, AccountBalanceWallet, Loyalty,
  SwapHoriz, History, Star, Redeem,
} from '@mui/icons-material';
import customerApi from '../services/customerApi';
import membershipApi from '../services/membershipApi';
import { showSuccess, showError } from '../utils/toast';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [tierStats, setTierStats] = useState([]);
  const [assignDialog, setAssignDialog] = useState({ open: false, tiers: [] });
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, histRes, statsRes] = await Promise.all([
          customerApi.getById(id),
          membershipApi.getCustomerHistory(id),
          membershipApi.getTierStats(),
        ]);
        setCustomer(custRes.data.data);
        setMembershipHistory(histRes.data.data || []);
        setTierStats(statsRes.data.data || []);
      } catch (err) {
        showError('Failed to load customer');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleEvaluateTier = async () => {
    try {
      const { data } = await membershipApi.evaluateTier(id);
      if (data.data.changed) {
        showSuccess(`Tier ${data.data.action} to ${data.data.to}`);
      } else {
        showSuccess(data.data.reason || 'No tier change needed');
      }
      // Refresh
      const [custRes, histRes] = await Promise.all([customerApi.getById(id), membershipApi.getCustomerHistory(id)]);
      setCustomer(custRes.data.data);
      setMembershipHistory(histRes.data.data || []);
    } catch (err) { showError(err.response?.data?.message || 'Evaluation failed'); }
  };

  const handleAssignTier = async () => {
    try {
      await membershipApi.assignTier(id, { tierId: selectedTier, notes: 'Manually assigned' });
      showSuccess('Tier assigned');
      setAssignDialog({ open: false, tiers: [] });
      const [custRes, histRes] = await Promise.all([customerApi.getById(id), membershipApi.getCustomerHistory(id)]);
      setCustomer(custRes.data.data);
      setMembershipHistory(histRes.data.data || []);
    } catch (err) { showError(err.response?.data?.message || 'Assignment failed'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (!customer) return <Typography>Customer not found</Typography>;

  const account = customer.loyaltyAccount;
  const totalPoints = (account?.availablePoints || 0) + (account?.pendingPoints || 0);
  const redemptionRate = account?.lifetimeEarned > 0 ? ((account?.lifetimeRedeemed || 0) / account.lifetimeEarned * 100).toFixed(1) : 0;

  const tierColor = account?.membership?.color || '#6B7280';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')}><ArrowBack /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5">{customer.firstName} {customer.lastName || ''}</Typography>
          <Typography variant="body2" color="text.secondary">{customer.code} • {customer.email || customer.phone}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/customers/${id}/edit`)}>Edit</Button>
        <Button variant="contained" startIcon={<SwapHoriz />} onClick={handleEvaluateTier}>Evaluate Tier</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Loyalty Account Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: `${tierColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 32, color: tierColor }} />
              </Box>
              <Chip
                label={account?.membership?.name || 'Standard'}
                sx={{ bgcolor: tierColor, color: 'white', fontWeight: 700, mb: 2, px: 2 }}
              />
              <Typography variant="body2" color="text.secondary">Account • {account?.accountNumber}</Typography>
              <Typography variant="h3" fontWeight={700} sx={{ my: 2, color: tierColor }}>
                {account?.availablePoints?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Available Points</Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Pending</Typography><Typography fontWeight={600}>{account?.pendingPoints || 0}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Redeemed</Typography><Typography fontWeight={600}>{account?.redeemedPoints || 0}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Expired</Typography><Typography fontWeight={600}>{account?.expiredPoints || 0}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Tier Points</Typography><Typography fontWeight={600}>{account?.currentTierPoints || 0}</Typography></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Points Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Points Overview</Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h5" fontWeight={700}>{account?.lifetimeEarned?.toLocaleString() || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Lifetime Earned</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h5" fontWeight={700}>{account?.lifetimeRedeemed?.toLocaleString() || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Lifetime Redeemed</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h5" fontWeight={700}>{redemptionRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">Redemption Rate</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h5" fontWeight={700}>AED {parseFloat(customer.lifetimeValue || 0).toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Lifetime Value</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Status</Typography><Chip label={customer.isActive ? 'Active' : 'Inactive'} color={customer.isActive ? 'success' : 'error'} size="small" /></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Segment</Typography><Typography>{customer.segment || '-'}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Source</Typography><Typography>{customer.source || '-'}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Registered</Typography><Typography>{customer.registrationDate ? new Date(customer.registrationDate).toLocaleDateString() : '-'}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Visits</Typography><Typography>{customer.totalVisits || 0}</Typography></Grid>
                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Last Visit</Typography><Typography>{customer.lastVisitDate ? new Date(customer.lastVisitDate).toLocaleDateString() : '-'}</Typography></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Tags</Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(Array.isArray(customer.tags) ? customer.tags : []).map((tag, i) => <Chip key={i} label={tag} size="small" variant="outlined" />)}
                    {(!customer.tags || (Array.isArray(customer.tags) && customer.tags.length === 0)) && <Typography variant="body2" color="text.secondary">No tags</Typography>}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tier Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Tier Progress</Typography>
              {tierStats.map((tier, idx) => {
                const progress = tier.maxPoints
                  ? Math.min(100, Math.max(0, ((account?.currentTierPoints || 0) - tier.minPoints) / (tier.maxPoints - tier.minPoints) * 100))
                  : (account?.currentTierPoints || 0) >= tier.minPoints ? 100 : Math.min(100, ((account?.currentTierPoints || 0) / tier.minPoints) * 100);
                return (
                  <Box key={tier.id} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tier.color || '#6B7280' }} />
                        <Typography variant="body2" fontWeight={account?.membershipId === tier.id ? 700 : 400}>{tier.name}</Typography>
                        {account?.membershipId === tier.id && <Chip label="Current" size="small" sx={{ height: 18, fontSize: '0.6rem' }} />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{tier.minPoints.toLocaleString()} pts {tier.customerCount ? `• ${tier.customerCount} members` : ''}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: tier.color || '#6B7280' } }} />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Membership History */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6"><History sx={{ mr: 1, verticalAlign: 'middle' }} />Membership History</Typography>
                <Button variant="outlined" size="small" onClick={() => { membershipApi.getTiers().then(({ data }) => setAssignDialog({ open: true, tiers: data.data || [] })); }}>
                  Assign Tier
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Tier</TableCell>
                      <TableCell>Previous Tier</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {membershipHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{new Date(h.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: h.tier?.color || '#6B7280' }} />
                            {h.tier?.name || '-'}
                          </Box>
                        </TableCell>
                        <TableCell>{h.previousTier?.name || '-'}</TableCell>
                        <TableCell><Chip label={h.status} size="small" variant="outlined" /></TableCell>
                        <TableCell>{h.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {membershipHistory.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center">No membership history</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Point Transactions</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Balance After</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(customer.pointTransactions || []).map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={txn.transactionType}
                            size="small"
                            color={['earn', 'bonus', 'welcome', 'referral', 'transfer_in'].includes(txn.transactionType) ? 'success' : ['redeem', 'transfer_out'].includes(txn.transactionType) ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600} color={txn.points > 0 ? 'success.main' : 'error.main'}>
                            {txn.points > 0 ? '+' : ''}{txn.points}
                          </Typography>
                        </TableCell>
                        <TableCell>{txn.balanceAfter}</TableCell>
                        <TableCell>{txn.source || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!customer.pointTransactions || customer.pointTransactions.length === 0) && (
                      <TableRow><TableCell colSpan={5} align="center">No transactions yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assign Tier Dialog */}
      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, tiers: [] })} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Membership Tier</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Manually assign a membership tier to this customer.</DialogContentText>
          <FormControl fullWidth size="small">
            <Select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)} displayEmpty>
              <MenuItem value="">Select Tier</MenuItem>
              {assignDialog.tiers.filter(t => t.isActive).map(t => (
                <MenuItem key={t.id} value={t.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: t.color || '#6B7280' }} />
                    {t.name} ({t.minPoints.toLocaleString()}+ pts)
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false, tiers: [] })}>Cancel</Button>
          <Button onClick={handleAssignTier} variant="contained" disabled={!selectedTier}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetail;
