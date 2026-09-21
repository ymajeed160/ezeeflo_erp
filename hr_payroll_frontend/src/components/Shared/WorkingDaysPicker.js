import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Chip, Box, Typography, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';

const DAYS = [
  { key: 'Mon', label: 'Mon' },
  { key: 'Tue', label: 'Tue' },
  { key: 'Wed', label: 'Wed' },
  { key: 'Thu', label: 'Thu' },
  { key: 'Fri', label: 'Fri' },
  { key: 'Sat', label: 'Sat' },
  { key: 'Sun', label: 'Sun' },
];

export default function WorkingDaysPicker({ value = '', onChange, label = 'Working Days' }) {
  const [open, setOpen] = useState(false);
  
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  const handleToggle = useCallback((day) => {
    const newSelected = selected.includes(day)
      ? selected.filter(d => d !== day)
      : [...selected, day];
    // Keep week order
    const ordered = DAYS.map(d => d.key).filter(d => newSelected.includes(d));
    onChange(ordered.join(','));
  }, [selected, onChange]);

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        sx={{
          cursor: 'pointer', border: '1px solid', borderColor: 'grey.400',
          borderRadius: 1, p: 1.2, minHeight: 40, display: 'flex',
          alignItems: 'center', flexWrap: 'wrap', gap: 0.5,
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        <CalendarMonth sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
        {selected.length > 0 ? (
          selected.map(d => (
            <Chip key={d} label={d} size="small" color="primary" variant="outlined" />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">Select days...</Typography>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{label}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click days to select or deselect.
          </Typography>
          <ToggleButtonGroup orientation="vertical" fullWidth>
            {DAYS.map(day => (
              <ToggleButton
                key={day.key}
                value={day.key}
                selected={selected.includes(day.key)}
                onChange={() => handleToggle(day.key)}
                sx={{
                  justifyContent: 'flex-start', px: 2, py: 1,
                  '&.Mui-selected': { bgcolor: 'primary.light', color: 'white' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography>{day.label}</Typography>
                  <Chip
                    label={selected.includes(day.key) ? 'Working' : 'Off'}
                    size="small"
                    color={selected.includes(day.key) ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
