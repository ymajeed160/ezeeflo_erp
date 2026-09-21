import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import {
  Assessment as ReportIcon, ViewList, DateRange, SwapHoriz, DeleteForever,
  TrendingUp, Build, Shield, Warning, FactCheck, AccountBalance,
} from '@mui/icons-material';

const REPORTS = [
  { key: 'asset-register', label: 'Asset Register', icon: <ViewList sx={{ fontSize: 36 }} />, color: '#1976d2', desc: 'Complete list of all assets with current values and status' },
  { key: 'depreciation-schedule', label: 'Depreciation Schedule', icon: <DateRange sx={{ fontSize: 36 }} />, color: '#2e7d32', desc: 'Posted depreciation history with calculated amounts' },
  { key: 'movements', label: 'Asset Movement Report', icon: <SwapHoriz sx={{ fontSize: 36 }} />, color: '#ed6c02', desc: 'Transfer history across locations and departments' },
  { key: 'disposals', label: 'Disposal Report', icon: <DeleteForever sx={{ fontSize: 36 }} />, color: '#d32f2f', desc: 'Asset disposals with gain/loss details' },
  { key: 'revaluations', label: 'Revaluation Report', icon: <TrendingUp sx={{ fontSize: 36 }} />, color: '#9c27b0', desc: 'Asset revaluation increase/decrease history' },
  { key: 'maintenance', label: 'Maintenance Report', icon: <Build sx={{ fontSize: 36 }} />, color: '#00796b', desc: 'Preventive and corrective maintenance records' },
  { key: 'insurance', label: 'Insurance Report', icon: <Shield sx={{ fontSize: 36 }} />, color: '#1565c0', desc: 'Insurance policies, premiums, and coverage' },
  { key: 'warranty-expiry', label: 'Warranty Expiry Report', icon: <Warning sx={{ fontSize: 36 }} />, color: '#e65100', desc: 'Assets with warranties expiring soon' },
  { key: 'audits', label: 'Audit Report', icon: <FactCheck sx={{ fontSize: 36 }} />, color: '#4a148c', desc: 'Physical verification and audit history' },
  { key: 'ledger', label: 'Fixed Asset Ledger', icon: <AccountBalance sx={{ fontSize: 36 }} />, color: '#004d40', desc: 'Complete ledger: acquisitions, depreciation, revaluations, disposals' },
];

const AssetReports = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ReportIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Fixed Asset Reports</Typography>
          <Typography variant="body2" color="text.secondary">Select a report to generate — apply filters, view on screen, then print or export</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {REPORTS.map((report) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={report.key}>
            <Paper
              sx={{
                p: 2.5, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column',
                '&:hover': { boxShadow: 6, borderColor: report.color, transform: 'translateY(-2px)' },
                border: '1px solid', borderColor: 'divider', transition: 'all 0.2s',
              }}
              onClick={() => navigate(`/app/fixed-assets/reports/${report.key}`)}
            >
              <Box sx={{ color: report.color, mb: 1 }}>{report.icon}</Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>{report.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, flex: 1 }}>{report.desc}</Typography>
              <Button size="small" variant="outlined" fullWidth sx={{ borderColor: report.color, color: report.color }}>
                Generate Report
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AssetReports;
