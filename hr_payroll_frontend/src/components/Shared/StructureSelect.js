import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import hrApi from '../../services/hrApi';

let cachedStructures = [];
let lastFetch = 0;

export default function StructureSelect({ value, onChange, label = 'Salary Structure', required = false, size = 'small', fullWidth = true }) {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStructures = useCallback(async (search = '') => {
    const now = Date.now();
    if (cachedStructures.length > 0 && now - lastFetch < 60000) {
      const filtered = search
        ? cachedStructures.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase()))
        : [...cachedStructures];
      setStructures(filtered);
      return;
    }
    setLoading(true);
    try {
      const r = await hrApi.get('/salary-structures', { params: { limit: 200, search } });
      const data = r.data?.data?.data || r.data?.data || r.data || [];
      cachedStructures = data;
      lastFetch = now;
      setStructures([...data]);
    } catch (_) { setStructures([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStructures(); }, [fetchStructures]);

  const selectedValue = useMemo(() => {
    if (!value) return null;
    return structures.find(s => s.id === value) || cachedStructures.find(s => s.id === value) || null;
  }, [value, structures]);

  const options = useMemo(() => {
    if (selectedValue && !structures.find(s => s.id === selectedValue.id)) {
      return [selectedValue, ...structures];
    }
    return structures;
  }, [structures, selectedValue]);

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      options={options}
      loading={loading}
      value={selectedValue}
      filterOptions={(x) => x}
      onInputChange={(_, v, reason) => {
        if (reason === 'input' && v && v.length >= 2) fetchStructures(v);
        if (reason === 'reset') fetchStructures();
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
        </li>
      )}
    />
  );
}
