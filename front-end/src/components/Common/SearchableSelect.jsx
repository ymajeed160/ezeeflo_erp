import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

/**
 * Reusable searchable dropdown for the ERP (thin wrapper over MUI Autocomplete).
 *
 * Usage:
 *   <SearchableSelect
 *     label="Cash Account"
 *     value={form.cashAccountId}                 // underlying id/string value
 *     onChange={(v) => setForm(f => ({ ...f, cashAccountId: v }))}
 *     options={cashAccounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
 *   />
 *
 * Features:
 *   - Case-insensitive, partial-text filtering while typing
 *   - Keyboard navigation (arrows + Enter), clearable selection
 *   - Works in forms, modals and dynamic rows
 *   - Stores the underlying id/value, not the display text
 */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  label,
  placeholder,
  size,
  fullWidth = true,
  required = false,
  error = false,
  helperText,
  getOptionLabel,
  renderOption,
  clearable = true,
  disabled = false,
  ...rest
}) => {
  // Normalize options to objects carrying a `value` key so the component
  // always compares/stores by the underlying value.
  const normalized = (options || []).map((opt) => {
    if (opt && typeof opt === 'object' && !Array.isArray(opt)) {
      const underlying = opt.value !== undefined ? opt.value : opt.id !== undefined ? opt.id : opt;
      return { ...opt, value: underlying };
    }
    return { value: opt, label: String(opt) };
  });

  const labelOf = getOptionLabel || ((opt) => opt?.label ?? opt?.name ?? String(opt?.value ?? opt ?? ''));

  const selected = normalized.find((o) => o.value === value) || null;

  const handleChange = (_event, newValue) => {
    if (!newValue) {
      onChange?.('');
      return;
    }
    onChange?.(newValue.value);
  };

  return (
    <Autocomplete
      options={normalized}
      value={selected}
      onChange={handleChange}
      getOptionLabel={(opt) => (opt ? labelOf(opt) : '')}
      isOptionEqualToValue={(opt, val) => opt?.value === val?.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={size}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
      renderOption={renderOption}
      disableClearable={!clearable}
      fullWidth={fullWidth}
      disabled={disabled}
      size={size}
      {...rest}
    />
  );
};

export default SearchableSelect;
