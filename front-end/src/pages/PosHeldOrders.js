import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, IconButton } from '@mui/material';
import { Restore, Delete } from '@mui/icons-material';
import { listHeldOrders, retrieveHeldOrder } from '../services/posApi';
import { useNavigate } from 'react-router-dom';

const PosHeldOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await listHeldOrders({ limit: 50 });
      setOrders(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load held orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieve = async (id) => {
    try {
      const res = await retrieveHeldOrder(id);
      navigate('/app/pos/register', { state: { heldOrder: res.data?.data } });
    } catch (err) {
      console.error('Failed to retrieve order:', err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Held Orders</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hold #</TableCell>
              <TableCell>Date/Time</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell><Chip label={order.holdNumber} size="small" color="warning" /></TableCell>
                <TableCell>{new Date(order.heldAt).toLocaleString()}</TableCell>
                <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                <TableCell>{order.cartData?.items?.length || 0} items</TableCell>
                <TableCell>{order.notes || '-'}</TableCell>
                <TableCell>
                  <Button startIcon={<Restore />} size="small" onClick={() => handleRetrieve(order.id)}>Retrieve</Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} align="center">No held orders found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PosHeldOrders;
