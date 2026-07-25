import React from 'react';
import { Box } from '@mui/material';
import ReportViewer from '../Reports/ReportViewer';

const TrialBalance = () => {
  return (
    <Box>
      <ReportViewer reportName="trial-balance" />
    </Box>
  );
};

export default TrialBalance;
