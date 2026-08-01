import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { Public, Place, LocationCity } from '@mui/icons-material';
import CountriesList from './CountriesList';
import StatesList from './StatesList';
import CitiesList from './CitiesList';

const sections = [
  { key: 'countries', label: 'Countries', icon: <Public />, component: <CountriesList /> },
  { key: 'states', label: 'States / Provinces', icon: <Place />, component: <StatesList /> },
  { key: 'cities', label: 'Cities', icon: <LocationCity />, component: <CitiesList /> },
];

const MasterDataPage = () => {
  const [tab, setTab] = useState('countries');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Master Data</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage all lookup and reference data used across the HR & Payroll system.
      </Typography>

      <Paper sx={{ display: 'flex', minHeight: '60vh' }}>
        <Tabs
          orientation="vertical"
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            borderRight: 1, borderColor: 'divider', minWidth: 220,
            '& .MuiTab-root': { alignItems: 'flex-start', textTransform: 'none', fontSize: 13, minHeight: 44, py: 1 },
          }}
        >
          {sections.map((s) => (
            <Tab
              key={s.key}
              value={s.key}
              label={s.label}
              icon={s.icon}
              iconPosition="start"
              disabled={s.disabled}
              sx={{ justifyContent: 'flex-start', pl: 2 }}
            />
          ))}
        </Tabs>

        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {sections.find(s => s.key === tab)?.component}
          {sections.find(s => s.key === tab)?.disabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" color="text.secondary">Coming Soon</Typography>
              <Typography variant="body2" color="text.disabled">This master data section will be available in the next update.</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MasterDataPage;
