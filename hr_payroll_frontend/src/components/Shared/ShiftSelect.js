import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import hrApi from '../../services/hrApi';

let cachedShifts = [];
let lastFetch = 0;

export default function ShiftSelect({ value, onChange, label = 'Shift', required = false, size = 'small', fullWidth = true }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchShifts = useCallback(async (search = '') => {
    const now = Date.now();
    if (cachedShifts.length > 0 && now - lastFetch < 60000) {
      const filtered = search
        ? cachedShifts.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase()))
        : [...cachedShifts];
      setShifts(filtered);
      return;
    }
    setLoading(true);
    try {
      const r = await hrApi.get('/shifts', { params: { limit: 200, search } });
      const data = r.data?.data?.data || r.data?.data || r.data || [];
      cachedShifts = data;
      lastFetch = now;
      setShifts([...data]);
    } catch (_) { setShifts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const selectedValue = useMemo(() => {
    if (!value) return null;
    return shifts.find(s => s.id === value) || cachedShifts.find(s => s.id === value) || null;
  }, [value, shifts]);

  const options = useMemo(() => {
    if (selectedValue && !shifts.find(s => s.id === selectedValue.id)) {
      return [selectedValue, ...shifts];
    }
    return shifts;
  }, [shifts, selectedValue]);

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      options={options}
      loading={loading}
      value={selectedValue}
      filterOptions={(x) => x}
      onInputChange={(_, v, reason) => {
        if (reason === 'input' && v && v.length >= 2) fetchShifts(v);
        if (reason === 'reset') fetchShifts();
      }}
      onChange={(_, item) => onChange(item ? item.id : '')}
      getOptionLabel={(s) => `${s.name || ''} (${s.code || 'N/A'})`}
      isOptionEqualToValue={(o, v) => o?.id === v?.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label + (required ? ' *' : '')}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <span style={{ fontWeight: 500 }}>{option.name}</span>
          <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>{option.code}</span>
          {option.shiftType && <span style={{ marginLeft: 8, color: '#1976d2', fontSize: 11 }}>({option.shiftType})</span>}
        </li>
      )}
    />
  );
}
