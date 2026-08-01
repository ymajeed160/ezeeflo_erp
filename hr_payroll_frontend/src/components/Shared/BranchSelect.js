import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import hrApi from '../../services/hrApi';

let cache = [];
let lastFetch = 0;

export default function BranchSelect({ value, onChange, label = 'Branch', required = false, size = 'small', fullWidth = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (search = '') => {
    const now = Date.now();
    if (cache.length > 0 && now - lastFetch < 60000) {
      const filtered = search
        ? cache.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase()))
        : [...cache];
      setItems(filtered);
      return;
    }
    setLoading(true);
    try {
      const r = await hrApi.get('/branches', { params: { limit: 200, search } });
      const data = r.data?.data?.data || r.data?.data || r.data || [];
      cache = data;
      lastFetch = now;
      setItems([...data]);
    } catch (_) { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const sel = useMemo(() => {
    if (!value) return null;
    return items.find(i => i.id === value) || cache.find(i => i.id === value) || null;
  }, [value, items]);

  const opts = useMemo(() => {
    if (sel && !items.find(i => i.id === sel.id)) return [sel, ...items];
    return items;
  }, [items, sel]);

  return (
    <Autocomplete size={size} fullWidth={fullWidth} options={opts} loading={loading} value={sel} filterOptions={(x) => x}
      onInputChange={(_, v, reason) => { if (reason === 'input' && v && v.length >= 2) fetch(v); if (reason === 'reset') fetch(); }}
      getOptionLabel={(o) => o?.name || o?.code || ''}
      isOptionEqualToValue={(o, v) => o?.id === v?.id}
      onChange={(_, v) => onChange(v?.id || '')}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required}
          InputProps={{ ...params.InputProps, endAdornment: (<>{loading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>) }}
        />
      )}
    />
  );
}
