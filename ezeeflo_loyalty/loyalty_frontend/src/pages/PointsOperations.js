import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, Button, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Chip, Alert, Divider, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Send, Undo, SwapHoriz, Tune, Redeem, CardGiftcard, Calculate } from '@mui/icons-material';
import pointsApi from '../services/pointsApi';
import customerApi from '../services/customerApi';
import { showSuccess, showError } from '../utils/toast';

const PointsOperations = () => {
  const [mode, setMode] = useState('earn');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [result, setResult] = useState(null);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [points, setPoints] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [fromCustomerId, setFromCustomerId] = useState('');
  const [toCustomerId, setToCustomerId] = useState('');
  const [originalTransactionId, setOriginalTransactionId] = useState('');
  const [bonusPoints, setBonusPoints] = useState('100');

  // Calculate
  const [calcCustomerId, setCalcCustomerId] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    customerApi.getAll({ limit: 200, isActive: true }).then(({ data }) => setCustomers(data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      let res;
      switch (mode) {
        case 'earn': res = await pointsApi.earn({ customerId, points: parseInt(points), source, notes }); break;
        case 'redeem': res = await pointsApi.redeem({ customerId, points: parseInt(points), source, notes }); break;
        case 'reverse': res = await pointsApi.reverse({ originalTransactionId, notes }); break;
        case 'adjust': res = await pointsApi.adjust({ customerId, points: parseInt(points), notes }); break;
        case 'transfer': res = await pointsApi.transfer({ fromCustomerId, toCustomerId, points: parseInt(points), notes }); break;
        case 'welcome': res = await pointsApi.welcomeBonus({ customerId, bonusPoints: parseInt(bonusPoints) }); break;
        case 'birthday': res = await pointsApi.birthdayBonus({ customerId, bonusPoints: parseInt(bonusPoints) }); break;
        default: return;
      }
      setResult(res.data.data);
      showSuccess(res.data.message);
    } catch (err) { showError(err.response?.data?.message || 'Operation failed'); }
    finally { setLoading(false); }
  };

  const handleCalculate = async () => {
    try {
      const { data } = await pointsApi.calculate({ customerId: calcCustomerId, purchaseAmount: parseFloat(purchaseAmount) });
      setCalcResult(data.data);
    } catch (err) { showError('Calculation failed'); }
  };

  const ops = [
    { value: 'earn', label: 'Earn Points', icon: <Send />, color: 'success.main' },
    { value: 'redeem', label: 'Redeem Points', icon: <Redeem />, color: 'error.main' },
    { value: 'reverse', label: 'Reverse Transaction', icon: <Undo />, color: 'warning.main' },
    { value: 'adjust', label: 'Adjust Points', icon: <Tune />, color: 'info.main' },
    { value: 'transfer', label: 'Transfer Points', icon: <SwapHoriz />, color: 'secondary.main' },
    { value: 'welcome', label: 'Welcome Bonus', icon: <CardGiftcard />, color: 'primary.main' },
    { value: 'birthday', label: 'Birthday Bonus', icon: <CardGiftcard />, color: '#EC4899' },
  ];

  const currentOp = ops.find(o => o.value === mode);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>Points Engine</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage loyalty points: earn, redeem, reverse, adjust, and transfer
      </Typography>

      <Grid container spacing={3}>
        {/* Operation Form */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {ops.map(op => (
                  <Chip
                    key={op.value} label={op.label} icon={op.icon}
                    onClick={() => { setMode(op.value); setResult(null); }}
                    color={mode === op.value ? 'primary' : 'default'}
                    variant={mode === op.value ? 'filled' : 'outlined'}
                    sx={{ fontWeight: mode === op.value ? 600 : 400 }}
                  />
                ))}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Customer select (earn, redeem, adjust, welcome, birthday) */}
                  {['earn', 'redeem', 'adjust', 'welcome', 'birthday'].includes(mode) && (
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Customer</InputLabel>
                        <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required label="Customer">
                          {customers.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName || ''} ({c.code}) - {c.loyaltyAccount?.availablePoints || 0} pts</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Transfer customer selects */}
                  {mode === 'transfer' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>From Customer</InputLabel>
                          <Select value={fromCustomerId} onChange={(e) => setFromCustomerId(e.target.value)} required label="From Customer">
                            {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName || ''} ({c.code})</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>To Customer</InputLabel>
                          <Select value={toCustomerId} onChange={(e) => setToCustomerId(e.target.value)} required label="To Customer">
                            {customers.filter(c => c.id !== fromCustomerId).map(c => <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName || ''} ({c.code})</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  )}

                  {/* Points / Bonus */}
                  {['earn', 'redeem', 'adjust', 'transfer'].includes(mode) && (
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label={mode === 'adjust' ? 'Points (+/-)' : 'Points'} type="number" size="small"
                        value={points} onChange={(e) => setPoints(e.target.value)} required />
                    </Grid>
                  )}
                  {['welcome', 'birthday'].includes(mode) && (
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Bonus Points" type="number" size="small"
                        value={bonusPoints} onChange={(e) => setBonusPoints(e.target.value)} />
                    </Grid>
                  )}

                  {/* Reverse */}
                  {mode === 'reverse' && (
                    <Grid item xs={12}>
                      <TextField fullWidth label="Original Transaction ID" size="small"
                        value={originalTransactionId} onChange={(e) => setOriginalTransactionId(e.target.value)} required />
                    </Grid>
                  )}

                  {/* Source */}
                  {['earn', 'redeem'].includes(mode) && (
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Source" size="small" placeholder="e.g. POS Purchase, Online Order"
                        value={source} onChange={(e) => setSource(e.target.value)} />
                    </Grid>
                  )}

                  {/* Notes */}
                  <Grid item xs={12}>
                    <TextField fullWidth label="Notes" size="small" multiline rows={2}
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      required={mode === 'adjust'} />
                  </Grid>

                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" size="large" disabled={loading}
                      startIcon={currentOp?.icon} sx={{ px: 4 }}>
                      {loading ? <CircularProgress size={20} /> : currentOp?.label}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              {/* Result */}
              {result && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {result.transaction ? `${result.transaction.points > 0 ? '+' : ''}${result.transaction.points} points` : 'Operation completed'}
                  </Typography>
                  <Typography variant="caption">
                    {result.account ? `Available: ${result.account.availablePoints} pts | Lifetime Earned: ${result.account.lifetimeEarned} pts` : ''}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Points Calculator */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calculate /> Points Calculator
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Estimate how many points a customer will earn from a purchase.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Customer</InputLabel>
                    <Select value={calcCustomerId} onChange={(e) => setCalcCustomerId(e.target.value)} label="Customer">
                      {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName || ''} ({c.code})</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Purchase Amount (AED)" type="number" size="small"
                    value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="outlined" fullWidth onClick={handleCalculate} startIcon={<Calculate />}>Calculate</Button>
                </Grid>
              </Grid>

              {calcResult && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">Base Points</Typography><Typography fontWeight={600}>{calcResult.basePoints}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">Multiplier</Typography><Typography fontWeight={600}>{calcResult.membershipMultiplier}x</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">Campaign Bonus</Typography><Typography fontWeight={600}>{calcResult.campaignBonus}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">Tier</Typography><Chip label={calcResult.tier} size="small" /></Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }} />
                      <Typography variant="h6" color="primary.main" fontWeight={700}>Total: {calcResult.totalPoints} points</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PointsOperations;
