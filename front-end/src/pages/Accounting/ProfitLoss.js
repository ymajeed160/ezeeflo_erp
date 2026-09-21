import React from 'react';
import { Box } from '@mui/material';
import ReportViewer from '../Reports/ReportViewer';

const ProfitLoss = () => {
  return (
    <Box>
      <ReportViewer reportName="profit-and-loss" />
    </Box>
  );
};

export default ProfitLoss;
