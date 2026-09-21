import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, Typography, Box } from '@mui/material';
import hrApi from '../../services/hrApi';

export default function LoanSelect({ value, onChange, label = 'Loan', employeeId = null, onAmountChange = null, required = false, size = 'small', fullWidth = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!employeeId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const r = await hrApi.get('/employee-loans', { params: { limit: 200, employeeId } });
      const data = r.data?.data || r.data || [];
      // Filter Active/Approved only
      const active = (Array.isArray(data) ? data : []).filter(l => ['Active', 'Approved'].includes(l.status));
      setItems(active);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { fetch(); }, [fetch]);

  const sel = useMemo(() => {
    if (!value) return null;
    return items.find(i => i.id === value) || null;
  }, [value, items]);

  const handleChange = (_, v) => {
    if (v) {
      onChange(v.id);
      if (onAmountChange && v.monthlyInstallment) {
        onAmountChange(Number(v.monthlyInstallment));
      }
    } else {
      onChange('');
      if (onAmountChange) onAmountChange('');
    }
  };

  const noEmployee = !employeeId;

  return (
    <Box>
      <Autocomplete
        size={size}
        fullWidth={fullWidth}
        options={items}
        loading={loading}
        value={sel}
        filterOptions={(x) => x}
        disabled={noEmployee}
        getOptionLabel={(o) => o ? `${o.loanNumber} (${Number(o.remainingAmount).toLocaleString()} left)` : ''}
        isOptionEqualToValue={(o, v) => o?.id === v?.id}
        onChange={handleChange}
        renderOption={(props, o) => {
          const paid = o.paidInstallments || 0;
          const total = o.totalInstallments || 0;
          const nextInstallment = paid + 1;
          return (
            <li {...props} key={o.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="body2" fontWeight={600}>{o.loanNumber}</Typography>
                <Typography variant="caption" color="text.secondary">{o.loanType}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Installment {nextInstallment}/{total} — {Number(o.monthlyInstallment).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="primary">
                  {Number(o.remainingAmount).toLocaleString()} remaining
                </Typography>
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            placeholder={noEmployee ? 'Select an employee first' : 'Select a loan'}
            InputProps={{
              ...params.InputProps,
              endAdornment: (<>{loading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),
            }}
          />
        )}
      />
    </Box>
  );
}
