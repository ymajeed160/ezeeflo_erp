import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import hrApi from '../../services/hrApi';

let cachedTypes = [];
let lastFetch = 0;

export default function LeaveTypeSelect({ value, onChange, label = 'Leave Type', required = false, size = 'small', fullWidth = true }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTypes = useCallback(async (search = '') => {
    const now = Date.now();
    if (cachedTypes.length > 0 && now - lastFetch < 60000) {
      const filtered = search
        ? cachedTypes.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()) || t.code?.toLowerCase().includes(search.toLowerCase()))
        : [...cachedTypes];
      setTypes(filtered);
      return;
    }
    setLoading(true);
    try {
      const r = await hrApi.get('/leave-types', { params: { limit: 200, search } });
      const data = r.data?.data?.data || r.data?.data || r.data || [];
      cachedTypes = data;
      lastFetch = now;
      setTypes([...data]);
    } catch (_) { setTypes([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const selectedValue = useMemo(() => {
    if (!value) return null;
    return types.find(t => t.id === value) || cachedTypes.find(t => t.id === value) || null;
  }, [value, types]);

  const options = useMemo(() => {
    if (selectedValue && !types.find(t => t.id === selectedValue.id)) {
      return [selectedValue, ...types];
    }
    return types;
  }, [types, selectedValue]);

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      options={options}
      loading={loading}
      value={selectedValue}
      filterOptions={(x) => x}
      onInputChange={(_, v, reason) => {
        if (reason === 'input' && v && v.length >= 2) fetchTypes(v);
        if (reason === 'reset') fetchTypes();
      }}
      onChange={(_, item) => onChange(item ? item.id : '')}
      getOptionLabel={(t) => `${t.name || ''} (${t.code || 'N/A'})`}
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
          {option.leaveCategory && <span style={{ marginLeft: 8, color: '#1976d2', fontSize: 11 }}>({option.leaveCategory})</span>}
        </li>
      )}
    />
  );
}
