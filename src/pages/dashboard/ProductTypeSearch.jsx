import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';

export default function ProductTypeSearch({
  type1NameValue,
  onType1NameChange,
  onSearch,
  onReset,
  disabled = false,
  autoSearchOnType = true, // ✅ giữ hành vi cũ: gõ tới đâu search tới đó
}) {
  const theme = useTheme();

  const [error, setError] = useState(null);
  const [type1NameSearch, setType1NameSearch] = useState(type1NameValue || '');

  useEffect(() => {
    setType1NameSearch(type1NameValue || '');
  }, [type1NameValue]);

  const closeError = () => setError(null);

  // ===== UI styles (same as SupplierSearch) =====
  const inputSx = useMemo(
    () => ({
      '& .MuiInputBase-root': {
        height: 34,
        borderRadius: 1.2,
        fontSize: '0.8rem',
        backgroundColor: disabled ? '#f9fafb' : '#fff',
      },
      '& .MuiInputLabel-root': { fontSize: '0.8rem' },
      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
      width: '100%',
    }),
    [disabled, theme.palette.primary.main]
  );

  const btnPrimarySx = useMemo(
    () => ({
      textTransform: 'none',
      fontWeight: 400,
      borderRadius: 1.2,
      height: 34,
      fontSize: '0.85rem',
      px: 2,
      backgroundColor: '#111827',
      '&:hover': { backgroundColor: '#0b1220' },
      whiteSpace: 'nowrap',
    }),
    []
  );

  const btnOutlineSx = useMemo(
    () => ({
      textTransform: 'none',
      fontWeight: 400,
      borderRadius: 1.2,
      height: 34,
      fontSize: '0.85rem',
      px: 2,
      color: '#111827',
      borderColor: '#e5e7eb',
      '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
      whiteSpace: 'nowrap',
    }),
    []
  );

  const busy = disabled;

  const handleSearch = useCallback(() => {
    try {
      onSearch?.({ name: type1NameSearch });
    } catch (e) {
      setError('Không thể thực hiện search. Vui lòng thử lại.');
    }
  }, [onSearch, type1NameSearch]);

  const handleReset = useCallback(() => {
    setType1NameSearch('');
    onType1NameChange?.('');
    onReset?.();
  }, [onReset, onType1NameChange]);

  const onEnterSearch = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleType1NameChange = (e) => {
    const value = e.target.value;
    setType1NameSearch(value);
    onType1NameChange?.(value);

    if (autoSearchOnType) {
      onSearch?.({ name: value });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        mb: 1,
        borderRadius: 1.5,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto',
      }}
    >
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={closeError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeError} severity="error" sx={{ width: '100%', fontSize: '0.85rem' }}>
          {error}
        </Alert>
      </Snackbar>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
          Filters
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 1fr) auto auto' },
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          label="Product Type 1 Name"
          size="small"
          value={type1NameSearch}
          onChange={handleType1NameChange}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
          placeholder="Type name…"
        />

        <Button variant="contained" onClick={handleSearch} disabled={busy} sx={btnPrimarySx}>
          Search
        </Button>

        <Button variant="outlined" onClick={handleReset} disabled={busy} sx={btnOutlineSx}>
          Reset
        </Button>
      </Box>
    </Paper>
  );
}

ProductTypeSearch.propTypes = {
  type1NameValue: PropTypes.string,
  onType1NameChange: PropTypes.func,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
  disabled: PropTypes.bool,
  autoSearchOnType: PropTypes.bool,
};
