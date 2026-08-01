import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import hrApi from '../../services/hrApi';

let cachedEmployees = [];
let lastFetch = 0;

export default function EmployeeSelect({ value, onChange, label = 'Employee', required = false, size = 'small', fullWidth = true }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async (search = '') => {
    const now = Date.now();
    if (cachedEmployees.length > 0 && now - lastFetch < 60000) {
      const filtered = search
        ? cachedEmployees.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) || e.employeeCode?.toLowerCase().includes(search.toLowerCase()))
        : [...cachedEmployees];
      setEmployees(filtered);
      return;
    }
    setLoading(true);
    try {
      const r = await hrApi.get('/employees', { params: { limit: 500, search } });
      const data = r.data?.data?.data || r.data?.data || r.data || [];
      cachedEmployees = data;
      lastFetch = now;
      setEmployees([...data]);
    } catch (_) { setEmployees([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const selectedValue = useMemo(() => {
    if (!value) return null;
    // Search in employees first, then fall back to full cache
    return employees.find(e => e.id === value) || cachedEmployees.find(e => e.id === value) || null;
  }, [value, employees]);

  const options = useMemo(() => {
    // Always ensure the selected option is in the list
    if (selectedValue && !employees.find(e => e.id === selectedValue.id)) {
      return [selectedValue, ...employees];
    }
    return employees;
  }, [employees, selectedValue]);

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      options={options}
      loading={loading}
      value={selectedValue}
      filterOptions={(x) => x}
      onInputChange={(_, v, reason) => {
        if (reason === 'input' && v && v.length >= 2) fetchEmployees(v);
        if (reason === 'reset') fetchEmployees();
      }}
      onChange={(_, item) => onChange(item ? item.id : '')}
      getOptionLabel={(e) => `${e.firstName || ''} ${e.lastName || ''} (${e.employeeCode || 'N/A'})`}
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
          <span style={{ fontWeight: 500 }}>{option.firstName} {option.lastName}</span>
          <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>{option.employeeCode}</span>
        </li>
      )}
    />
  );
}
