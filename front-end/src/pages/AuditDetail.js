import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { fetchAuditLog, clearSelected } from '../store/slices/auditSlice';
import dayjs from 'dayjs';

const actionColors = {
  CREATE: 'success', UPDATE: 'info', DELETE: 'error',
  LOGIN: 'primary', LOGIN_FAILED: 'error', LOGOUT: 'warning',
  APPROVE: 'success', REJECT: 'error', POST: 'success', CANCEL: 'warning',
};

const AuditDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedLog: log, loading } = useSelector((state) => state.auditLogs);

  useEffect(() => {
    dispatch(fetchAuditLog(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading || !log) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  const changedFields = log.changedFields || [];
  const oldValues = log.oldValues || {};
  const newValues = log.newValues || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/app/audit')}>
          Back to Audit Trail
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Audit Log Detail
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Audit ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{log.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Date & Time</Typography>
            <Typography variant="body2">{dayjs(log.createdAt).format('DD/MM/YYYY hh:mm:ss A')}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Action</Typography>
            <Box><Chip label={log.action} size="small" color={actionColors[log.action] || 'default'} /></Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Source</Typography>
            <Typography variant="body2">{log.source || 'USER'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">User</Typography>
            <Typography variant="body2" fontWeight={500}>{log.username || 'System'}</Typography>
            {log.userEmail && <Typography variant="caption" color="text.secondary">{log.userEmail}</Typography>}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">User Role</Typography>
            <Typography variant="body2">{log.userRole || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Company ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{log.tenantId || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Chip label={log.status || 'success'} size="small"
              color={log.status === 'failure' ? 'error' : 'success'} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Module</Typography>
            <Typography variant="body2">{log.module || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Entity</Typography>
            <Typography variant="body2">{log.entity}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Entity ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{log.entityId || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Reference #</Typography>
            <Typography variant="body2">{log.entityReferenceNumber || '-'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" color="text.secondary">IP Address</Typography>
            <Typography variant="body2">{log.ipAddress || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" color="text.secondary">Request ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{log.requestId || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" color="text.secondary">Session ID</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{log.sessionId || '-'}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">User Agent</Typography>
            <Typography variant="body2" sx={{ fontSize: 12, wordBreak: 'break-all' }}>{log.userAgent || '-'}</Typography>
          </Grid>

          {log.errorMessage && (
            <Grid item xs={12}>
              <Typography variant="caption" color="error">Error Message</Typography>
              <Typography variant="body2" color="error">{log.errorMessage}</Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">Description</Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>{log.description || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Change Comparison - for UPDATE actions */}
      {changedFields.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Changes Made
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '30%' }}>Field</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '35%' }}>Previous Value</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '35%' }}>New Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {changedFields.map((field) => (
                  <TableRow key={field}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{field}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error.main" sx={{
                        bgcolor: 'error.light', px: 1, py: 0.5, borderRadius: 1,
                        display: 'inline-block', fontSize: 13,
                      }}>
                        {oldValues[field] !== undefined && oldValues[field] !== null
                          ? String(oldValues[field]) : <em style={{ color: '#999' }}>empty</em>}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main" sx={{
                        bgcolor: 'success.light', px: 1, py: 0.5, borderRadius: 1,
                        display: 'inline-block', fontSize: 13,
                      }}>
                        {newValues[field] !== undefined && newValues[field] !== null
                          ? String(newValues[field]) : <em style={{ color: '#999' }}>empty</em>}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default AuditDetail;
