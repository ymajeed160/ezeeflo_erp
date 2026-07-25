import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Divider, Alert } from '@mui/material';
import { Add, Remove, Delete, Search, ShoppingCart, PointOfSale, Payment } from '@mui/icons-material';
import itemApi from '../services/itemApi';
import { completeSale, holdOrder, getActiveSession, getMyTerminals, getTerminals } from '../services/posApi';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

const PosRegister = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState({ id: 'walk-in', name: 'Walk-In Customer' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [session, setSession] = useState(null);
  const [activeTerminal, setActiveTerminal] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
    loadActiveSession();
  }, []);

  const loadActiveSession = async () => {
    try {
      // First try to find active session on user's assigned terminals
      const terminalsRes = await getMyTerminals();
      let terminals = terminalsRes.data?.data || [];

      // If user has no assigned terminals, fallback to all terminals
      if (terminals.length === 0) {
        const allTerminalsRes = await getTerminals({ isActive: true });
        terminals = allTerminalsRes.data?.data || [];
      }

      // Check each terminal for an active session, use the first one found
      for (const terminal of terminals) {
        const sessionRes = await getActiveSession(terminal.id);
        if (sessionRes.data?.data) {
          setSession(sessionRes.data.data);
          setActiveTerminal(terminal);
          return;
        }
      }
      // No active session found on any terminal — user will see the alert message below
    } catch (err) {
      console.error('Failed to load active session:', err);
    }
  };

  const loadItems = async () => {
    try {
      const res = await itemApi.getAll({ isActive: true, limit: 100 });
      setItems(res?.data || []);
    } catch (err) {
      console.error('Failed to load items:', err);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return item.name?.toLowerCase().includes(term) || 
           item.itemCode?.toLowerCase().includes(term) ||
           item.barcode?.toLowerCase().includes(term);
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(l => l.itemId === item.id);
      if (existing) {
        return prev.map(l => l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, {
        itemId: item.id,
        itemName: item.name,
        sku: item.itemCode,
        quantity: 1,
        unitPrice: parseFloat(item.sellingPrice) || 0,
        discountPercentage: 0,
        discountAmount: 0,
        taxPercentage: parseFloat(item.taxPercentage) || 0,
        taxAmount: 0,
        lineTotal: parseFloat(item.sellingPrice) || 0,
        isService: item.itemType === 'service',
      }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(l => {
      if (l.itemId === itemId) {
        const newQty = Math.max(0.01, l.quantity + delta);
        return { ...l, quantity: newQty };
      }
      return l;
    }).filter(l => l.quantity > 0));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(l => l.itemId !== itemId));
  };

  const calculateTotals = () => {
    const subTotal = cart.reduce((sum, l) => sum + (l.unitPrice * l.quantity), 0);
    const discountTotal = cart.reduce((sum, l) => sum + l.discountAmount, 0);
    const taxTotal = cart.reduce((sum, l) => {
      const lineBeforeTax = (l.unitPrice * l.quantity) - l.discountAmount;
      return sum + (lineBeforeTax * l.taxPercentage / 100);
    }, 0);
    const grandTotal = subTotal - discountTotal + taxTotal;
    return { subTotal, discountTotal, taxTotal, grandTotal: Math.max(0, grandTotal) };
  };

  const totals = calculateTotals();
  const change = paymentMethod === 'cash' ? Math.max(0, parseFloat(amountReceived || 0) - totals.grandTotal) : 0;

  const handleCompleteSale = async () => {
    if (!session) {
      alert('Please open a POS session first');
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    setLoading(true);
    try {
      const payments = [{
        paymentMethod,
        amount: totals.grandTotal,
        reference: paymentMethod === 'card' ? 'CARD' : null,
      }];
      if (paymentMethod === 'cash' && parseFloat(amountReceived) > totals.grandTotal) {
        payments[0].amount = parseFloat(amountReceived);
      }

      await completeSale({
        terminalId: activeTerminal?.id,
        sessionId: session.id,
        customerId: selectedCustomer.id === 'walk-in' ? null : selectedCustomer.id,
        warehouseId: session.warehouseId,
        lines: cart.map(l => ({
          itemId: l.itemId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercentage: l.discountPercentage,
          taxPercentage: l.taxPercentage,
        })),
        payments,
      });
      
      setCart([]);
      setPaymentDialog(false);
      setAmountReceived('');
      alert('Sale completed successfully!');
    } catch (err) {
      console.error('Sale failed:', err);
      alert(err.response?.data?.message || 'Sale failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>POS Register</Typography>
      
      {!session && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No active POS session found. Please <Button onClick={() => navigate('/app/pos/sessions')}>open a session</Button> first.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Left Panel - Products */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'gray' }} /> }}
                sx={{ mb: 2 }}
              />
              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Grid container spacing={1}>
                  {filteredItems.map(item => (
                    <Grid item xs={6} sm={4} key={item.id}>
                      <Card 
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        onClick={() => addToCart(item)}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" fontWeight="bold" noWrap>{item.name}</Typography>
                          <Typography variant="caption" color="textSecondary">{item.itemCode}</Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {formatCurrency(parseFloat(item.sellingPrice || 0))}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Cart */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Current Sale</Typography>
                <Chip 
                  icon={<ShoppingCart />} 
                  label={`${cart.length} items`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>

              <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {cart.map(line => (
                  <Box key={line.itemId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="bold">{line.itemName}</Typography>
                      <Typography variant="caption" color="textSecondary">{formatCurrency(line.unitPrice)}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <IconButton size="small" onClick={() => updateQuantity(line.itemId, -1)}><Remove fontSize="small" /></IconButton>
                      <Typography>{line.quantity}</Typography>
                      <IconButton size="small" onClick={() => updateQuantity(line.itemId, 1)}><Add fontSize="small" /></IconButton>
                    </Box>
                    <Typography fontWeight="bold">{formatCurrency(line.unitPrice * line.quantity)}</Typography>
                    <IconButton size="small" color="error" onClick={() => removeFromCart(line.itemId)}><Delete fontSize="small" /></IconButton>
                  </Box>
                ))}
                {cart.length === 0 && (
                  <Typography color="textSecondary" textAlign="center" py={4}>Cart is empty. Click items to add.</Typography>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />
              
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatCurrency(totals.subTotal)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography>Discount:</Typography>
                <Typography color="error">{'-' + formatCurrency(totals.discountTotal)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography>Tax:</Typography>
                <Typography>{formatCurrency(totals.taxTotal)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h5" fontWeight="bold">Total:</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">{formatCurrency(totals.grandTotal)}</Typography>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Payment />}
                    onClick={() => navigate('/app/pos/held-orders')}
                    disabled={cart.length === 0}
                  >
                    Hold
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    startIcon={<PointOfSale />}
                    onClick={() => setPaymentDialog(true)}
                    disabled={cart.length === 0 || !session}
                  >
                    Pay ({formatCurrency(totals.grandTotal)})
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent>
          <Typography variant="h3" textAlign="center" fontWeight="bold" color="primary" my={2}>
            {formatCurrency(totals.grandTotal)}
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method">
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
            </Select>
          </FormControl>

          {paymentMethod === 'cash' && (
            <TextField
              fullWidth
              label="Amount Received"
              type="text"
              inputMode="decimal"
              value={amountReceived}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                  setAmountReceived(val);
                }
              }}
              sx={{ mb: 2 }}
            />
          )}

          {change > 0 && (
            <Alert severity="success">Change due: {formatCurrency(change)}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCompleteSale} disabled={loading}>
            {loading ? 'Processing...' : 'Complete Sale'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PosRegister;
