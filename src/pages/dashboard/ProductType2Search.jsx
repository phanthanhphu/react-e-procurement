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

export default function ProductType2Search({
  type2NameValue,
  onType2NameChange,
  onSearch,
  onReset,
  disabled = false,
  autoSearchOnType = false, // ✅ nếu muốn gõ tới đâu search tới đó thì bật true
}) {
  const theme = useTheme();

  const [error, setError] = useState(null);
  const [type2NameSearch, setType2NameSearch] = useState(type2NameValue || '');

  useEffect(() => {
    // sync ngoài -> trong
    setType2NameSearch(type2NameValue || '');
  }, [type2NameValue]);

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
      onSearch?.({ name: type2NameSearch });
    } catch (e) {
      setError('Không thể thực hiện search. Vui lòng thử lại.');
    }
  }, [onSearch, type2NameSearch]);

  const handleReset = useCallback(() => {
    setType2NameSearch('');
    onType2NameChange?.('');
    onReset?.();
  }, [onReset, onType2NameChange]);

  const onEnterSearch = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleType2NameChange = (e) => {
    const value = e.target.value;
    setType2NameSearch(value);
    onType2NameChange?.(value);

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
          label="Product Type 2 Name"
          size="small"
          value={type2NameSearch}
          onChange={handleType2NameChange}
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

ProductType2Search.propTypes = {
  type2NameValue: PropTypes.string,
  onType2NameChange: PropTypes.func,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
  disabled: PropTypes.bool,
  autoSearchOnType: PropTypes.bool,
};
