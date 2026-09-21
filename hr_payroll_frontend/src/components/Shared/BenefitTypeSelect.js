import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import hrApi from '../../services/hrApi';

let cache = [];
let lastFetch = 0;

export default function BenefitTypeSelect({ value, onChange, label = 'Benefit Type', required = false, size = 'small', fullWidth = true }) {
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
      const r = await hrApi.get('/benefit-types', { params: { limit: 200, search } });
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
      onChange={(_, item) => onChange(item ? item.id : '')}
      getOptionLabel={(i) => `${i.name || ''} (${i.code || 'N/A'})`}
      isOptionEqualToValue={(o, v) => o?.id === v?.id}
      renderInput={(p) => (
        <TextField {...p} label={label + (required ? ' *' : '')} required={required}
          InputProps={{ ...p.InputProps, endAdornment: <>{loading ? <CircularProgress color="inherit" size={16} /> : null}{p.InputProps.endAdornment}</> }} />
      )}
      renderOption={(p, o) => (<li {...p} key={o.id}><span style={{ fontWeight: 500 }}>{o.name}</span><span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>{o.code}</span>{o.benefitCategory && <span style={{ marginLeft: 8, color: '#1976d2', fontSize: 11 }}>({o.benefitCategory})</span>}</li>)}
    />
  );
}
