import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  TextField,
  Button,
  Box,
  useTheme,
  Autocomplete,
  Snackbar,
  Alert,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function RequisitionSearch({ searchValues, onSearchChange, onSearch, onReset, disabled = false }) {
  const theme = useTheme();

  const [productType1Options, setProductType1Options] = useState([]);
  const [productType2Options, setProductType2Options] = useState([]);

  const [selectedPT1, setSelectedPT1] = useState(null);
  const [selectedPT2, setSelectedPT2] = useState(null);

  const [loadingPT1, setLoadingPT1] = useState(false);
  const [loadingPT2, setLoadingPT2] = useState(false);

  const [error, setError] = useState(null);

  // Clean admin sizing
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
    [theme.palette.primary.main, disabled]
  );

  const btnPrimarySx = useMemo(
    () => ({
      textTransform: 'none',
      fontWeight: 400,
      height: 34,
      borderRadius: 1.2,
      fontSize: '0.85rem',
      px: 2,
      backgroundColor: '#111827',
      '&:hover': { backgroundColor: '#0b1220' },
    }),
    []
  );

  const btnOutlineSx = useMemo(
    () => ({
      textTransform: 'none',
      fontWeight: 400,
      height: 34,
      borderRadius: 1.2,
      fontSize: '0.85rem',
      px: 2,
      color: '#111827',
      borderColor: '#e5e7eb',
      '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
    }),
    []
  );

  /* =========================
     Fetch product type lists
     ========================= */
  useEffect(() => {
    let alive = true;

    const fetchPT1 = async () => {
      setLoadingPT1(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/product-type-1/search`, {
          params: { page: 0, size: 200 },
        });
        if (!alive) return;
        setProductType1Options(res.data?.content || []);
      } catch (e) {
        console.error('PT1 fetch error:', e.response?.data || e.message);
        if (!alive) return;
        setError('Failed to load product-type-1 list.');
      } finally {
        if (alive) setLoadingPT1(false);
      }
    };

    fetchPT1();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const fetchPT2 = async () => {
      setLoadingPT2(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/product-type-2/search`, {
          params: {
            productType1Id: selectedPT1?.id || undefined,
            page: 0,
            size: 200,
          },
        });
        if (!alive) return;
        setProductType2Options(res.data?.content || []);
      } catch (e) {
        console.error('PT2 fetch error:', e.response?.data || e.message);
        if (!alive) return;
        setError('Failed to load product-type-2 list.');
        setProductType2Options([]);
      } finally {
        if (alive) setLoadingPT2(false);
      }
    };

    // nếu muốn bắt buộc chọn PT1 mới load PT2, thay bằng:
    // if (!selectedPT1?.id) { setProductType2Options([]); return; }
    fetchPT2();

    return () => {
      alive = false;
    };
  }, [selectedPT1?.id]);

  // Sync selected when parent clears names
  useEffect(() => {
    if (!searchValues?.productType1Name) setSelectedPT1(null);
    if (!searchValues?.productType2Name) setSelectedPT2(null);
  }, [searchValues?.productType1Name, searchValues?.productType2Name]);

  /* =========================
     Handlers
     ========================= */
  const handleInputChange = (field) => (e) => {
    onSearchChange({ ...searchValues, [field]: e.target.value });
  };

  const handleSearch = () => {
    onSearch({
      ...searchValues,
      productType1Id: selectedPT1?.id || null,
      productType2Id: selectedPT2?.id || null,
    });
  };

  const handleReset = () => {
    setSelectedPT1(null);
    setSelectedPT2(null);
    setProductType2Options([]);

    onSearchChange({
      productType1Name: '',
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSapCode: '',
      hanaSapCode: '',
      supplierName: '',
      departmentName: '',
    });

    onReset?.();
  };

  const busy = disabled || loadingPT1 || loadingPT2;

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
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', fontSize: '0.85rem' }}>
          {error}
        </Alert>
      </Snackbar>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>
          Search filters
        </Typography>
      </Stack>

      {/* ===== Row 1: 4 inputs + Search ===== */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
          gap: 1,
          mb: 1,
          alignItems: 'center',
        }}
      >
        <Autocomplete
          options={productType1Options}
          loading={loadingPT1}
          value={selectedPT1}
          onChange={(_, opt) => {
            setSelectedPT1(opt || null);
            setSelectedPT2(null); // reset PT2 when PT1 changes

            onSearchChange({
              ...searchValues,
              productType1Name: opt?.name || '',
              productType2Name: '',
            });
          }}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          disabled={disabled}
          loadingText="Loading…"
          renderInput={(params) => <TextField {...params} label="Product Type 1" size="small" sx={inputSx} />}
        />

        <Autocomplete
          options={productType2Options}
          loading={loadingPT2}
          value={selectedPT2}
          onChange={(_, opt) => {
            setSelectedPT2(opt || null);
            onSearchChange({ ...searchValues, productType2Name: opt?.name || '' });
          }}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || '')}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          disabled={disabled || !selectedPT1} // chọn PT1 trước rồi mới chọn PT2
          loadingText="Loading…"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Product Type 2"
              size="small"
              sx={inputSx}
              placeholder={selectedPT1 ? 'Select…' : 'Select Product Type 1 first'}
            />
          )}
        />

        <TextField
          label="Item (EN)"
          size="small"
          value={searchValues.englishName || ''}
          onChange={handleInputChange('englishName')}
          disabled={disabled}
          sx={inputSx}
        />

        <TextField
          label="Item (VN)"
          size="small"
          value={searchValues.vietnameseName || ''}
          onChange={handleInputChange('vietnameseName')}
          disabled={disabled}
          sx={inputSx}
        />

        <Button variant="contained" onClick={handleSearch} disabled={busy} sx={btnPrimarySx}>
          Search
        </Button>
      </Box>

      {/* ===== Row 2: 4 inputs + Reset ===== */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          label="Old SAP"
          size="small"
          value={searchValues.oldSapCode || ''}
          onChange={handleInputChange('oldSapCode')}
          disabled={disabled}
          sx={inputSx}
        />

        <TextField
          label="Hana SAP"
          size="small"
          value={searchValues.hanaSapCode || ''}
          onChange={handleInputChange('hanaSapCode')}
          disabled={disabled}
          sx={inputSx}
        />

        <TextField
          label="Supplier"
          size="small"
          value={searchValues.supplierName || ''}
          onChange={handleInputChange('supplierName')}
          disabled={disabled}
          sx={inputSx}
        />

        <TextField
          label="Department"
          size="small"
          value={searchValues.departmentName || ''}
          onChange={handleInputChange('departmentName')}
          disabled={disabled}
          sx={inputSx}
        />

        <Button variant="outlined" onClick={handleReset} disabled={busy} sx={btnOutlineSx}>
          Reset
        </Button>
      </Box>
    </Paper>
  );
}

RequisitionSearch.propTypes = {
  searchValues: PropTypes.object.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  disabled: PropTypes.bool,
};
