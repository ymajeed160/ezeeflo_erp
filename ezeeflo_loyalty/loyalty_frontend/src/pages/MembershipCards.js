import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, CircularProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
} from '@mui/material';
import { QrCode, CreditCard, Refresh, Add, Visibility, Delete } from '@mui/icons-material';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';

const MembershipCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, card: null });

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/enterprise/membership-cards', { params: { limit: 200 } });
      setCards(data.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const viewCard = async (customerId) => {
    try {
      const { data } = await api.get(`/enterprise/membership-card/${customerId}`);
      setDialog({ open: true, card: data.data });
    } catch (err) { showError('Failed to load card'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Digital Membership Cards</Typography>
          <Typography variant="body2" color="text.secondary">QR code & barcode membership cards — Apple/Google Wallet ready</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCards}>Refresh</Button>
      </Box>

      <Grid container spacing={2}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} key={card.memberId || idx}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">{card.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{card.memberId}</Typography>
                    <Chip label={card.tier} size="small" sx={{ mt: 1, display: 'block' }} />
                  </Box>
                  <IconButton size="small" onClick={() => viewCard(null)}><Visibility fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{card.points?.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">Points</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip icon={<QrCode />} label="QR Ready" size="small" color="primary" variant="outlined" />
                    <Chip icon={<CreditCard />} label="Wallet Ready" size="small" sx={{ ml: 0.5 }} variant="outlined" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {cards.length === 0 && (
          <Grid item xs={12}><Typography align="center" sx={{ py: 4 }} color="text.secondary">No membership cards found. Enroll customers to generate cards.</Typography></Grid>
        )}
      </Grid>

      {/* Card Preview Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, card: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Digital Membership Card</DialogTitle>
        {dialog.card && (
          <DialogContent>
            <Card sx={{ background: `linear-gradient(135deg, ${dialog.card.tier?.color || '#4F46E5'}20, ${dialog.card.tier?.color || '#7C3AED'}10)`, border: `2px solid ${dialog.card.tier?.color || '#4F46E5'}`, borderRadius: 3, p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight={700}>{dialog.card.company?.name || 'EzeeFlo Loyalty'}</Typography>
                <Chip label={dialog.card.tier?.name || 'Member'} size="small" sx={{ bgcolor: dialog.card.tier?.color || '#4F46E5', color: 'white' }} />
              </Box>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h3" fontWeight={800}>{dialog.card.points?.available?.toLocaleString()}</Typography>
                <Typography variant="caption">Available Points</Typography>
              </Box>

              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2"><strong>Member:</strong> {dialog.card.customer?.name}</Typography>
                <Typography variant="body2"><strong>ID:</strong> {dialog.card.memberId}</Typography>
                <Typography variant="body2"><strong>Card Token:</strong> {dialog.card.cardId}</Typography>
                <Typography variant="body2"><strong>Multiplier:</strong> {dialog.card.tier?.pointMultiplier}x</Typography>
              </Box>

              <Box sx={{ textAlign: 'center', bgcolor: 'white', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Scan QR Code</Typography>
                <Box sx={{ width: 120, height: 120, border: '2px dashed #ccc', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                  <QrCode sx={{ fontSize: 80, color: '#666' }} />
                </Box>
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontFamily: 'monospace' }}>{dialog.card.barcodeData}</Typography>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                {dialog.card.appleWalletReady && <Chip label=" Apple Wallet" size="small" color="default" />}
                {dialog.card.googleWalletReady && <Chip label="Google Wallet" size="small" color="default" />}
              </Box>
            </Card>
          </DialogContent>
        )}
        <DialogActions><Button onClick={() => setDialog({ open: false, card: null })}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default MembershipCards;
