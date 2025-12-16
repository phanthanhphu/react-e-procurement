import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import { Alert, Autocomplete, Box, Button, Paper, Snackbar, Stack, TextField, Typography, useTheme } from '@mui/material';

import { API_BASE_URL } from '../../config';

export default function RequisitionMonthlySearch({ searchValues, onSearchChange, onSearch, onReset, disabled = false }) {
  const theme = useTheme();

  const [productType1Options, setProductType1Options] = useState([]);
  const [productType2Options, setProductType2Options] = useState([]);

  const [selectedProductType1, setSelectedProductType1] = useState(null);
  const [selectedProductType2, setSelectedProductType2] = useState(null);

  const [error, setError] = useState(null);
  const [loadingPT1, setLoadingPT1] = useState(false);
  const [loadingPT2, setLoadingPT2] = useState(false);

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
    }),
    []
  );

  /* =========================
     Fetch Product Type 1
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
        console.error('Error fetching product type 1:', e.response?.data || e.message);
        if (!alive) return;
        setError('Không thể tải danh sách product-type-1. Vui lòng thử lại.');
      } finally {
        if (alive) setLoadingPT1(false);
      }
    };

    fetchPT1();
    return () => {
      alive = false;
    };
  }, []);

  /* =========================
     Sync selected PT1 from searchValues (optional)
     ========================= */
  useEffect(() => {
    if (!productType1Options.length) return;

    const foundPT1 = productType1Options.find((x) => x?.name === searchValues.productType1Name) || null;
    setSelectedProductType1(foundPT1);
  }, [productType1Options, searchValues.productType1Name]);

  /* =========================
     Fetch Product Type 2 when PT1 changes
     ========================= */
  useEffect(() => {
    let alive = true;

    const fetchPT2 = async () => {
      setLoadingPT2(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/product-type-2/search`, {
          params: {
            productType1Id: selectedProductType1?.id || undefined,
            page: 0,
            size: 200,
          },
        });

        if (!alive) return;
        setProductType2Options(res.data?.content || []);
      } catch (e) {
        console.error('Error fetching product type 2:', e.response?.data || e.message);
        if (!alive) return;
        setError('Không thể tải danh sách product-type-2. Vui lòng thử lại.');
        setProductType2Options([]);
      } finally {
        if (alive) setLoadingPT2(false);
      }
    };

    // Nếu backend cho phép load all PT2 khi chưa chọn PT1 thì vẫn ok,
    // còn nếu muốn bắt buộc PT1 thì thay bằng:
    // if (!selectedProductType1?.id) { setProductType2Options([]); setSelectedProductType2(null); return; }
    fetchPT2();

    return () => {
      alive = false;
    };
  }, [selectedProductType1?.id]);

  /* =========================
     Sync selected PT2 from searchValues (optional)
     ========================= */
  useEffect(() => {
    if (!productType2Options.length) return;

    const foundPT2 = productType2Options.find((x) => x?.name === searchValues.productType2Name) || null;
    setSelectedProductType2(foundPT2);
  }, [productType2Options, searchValues.productType2Name]);

  /* =========================
     Handlers
     ========================= */
  const handleInputChange = (field) => (e) => {
    onSearchChange({ ...searchValues, [field]: e.target.value });
  };

  const handleProductType1Select = (_, value) => {
    setSelectedProductType1(value || null);

    // reset PT2 đúng chuẩn
    setSelectedProductType2(null);
    setProductType2Options([]);

    onSearchChange({
      ...searchValues,
      productType1Name: value?.name || '',
      productType2Name: '',
    });
  };

  const handleProductType2Select = (_, value) => {
    setSelectedProductType2(value || null);
    onSearchChange({ ...searchValues, productType2Name: value?.name || '' });
  };

  const busy = disabled || loadingPT1 || loadingPT2;

  const handleSearchClick = () => {
    onSearch({
      ...searchValues,
      productType1Id: selectedProductType1?.id || null,
      productType2Id: selectedProductType2?.id || null,
    });
  };

  const handleResetClick = () => {
    setSelectedProductType1(null);
    setSelectedProductType2(null);
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
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', fontSize: '0.85rem' }}>
          {error}
        </Alert>
      </Snackbar>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>Filters</Typography>
      </Stack>

      {/* ===== Row 1: 4 input + Search ===== */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(160px, 1fr))' },
          gap: 1,
          mb: 1,
          alignItems: 'center',
        }}
      >
        <Autocomplete
          options={productType1Options}
          loading={loadingPT1}
          value={selectedProductType1}
          onChange={handleProductType1Select}
          getOptionLabel={(o) => (typeof o === 'string' ? o : o?.name || '')}
          isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
          disabled={disabled}
          renderInput={(params) => <TextField {...params} label="Product Type 1" placeholder="Select…" size="small" sx={inputSx} />}
        />

        <Autocomplete
          options={productType2Options}
          loading={loadingPT2}
          value={selectedProductType2}
          onChange={handleProductType2Select}
          getOptionLabel={(o) => (typeof o === 'string' ? o : o?.name || '')}
          isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
          disabled={disabled || !selectedProductType1}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Product Type 2"
              placeholder={selectedProductType1 ? 'Select…' : 'Select Product Type 1 first'}
              size="small"
              sx={inputSx}
            />
          )}
        />

        <TextField
          label="Item Description (EN)"
          size="small"
          value={searchValues.englishName || ''}
          onChange={handleInputChange('englishName')}
          disabled={disabled}
          sx={inputSx}
        />

        <TextField
          label="Item Description (VN)"
          size="small"
          value={searchValues.vietnameseName || ''}
          onChange={handleInputChange('vietnameseName')}
          disabled={disabled}
          sx={inputSx}
        />

        <Button variant="contained" onClick={handleSearchClick} disabled={busy} sx={btnPrimarySx}>
          Search
        </Button>
      </Box>

      {/* ===== Row 2: 4 input + Reset ===== */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(160px, 1fr))' },
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          label="Old SAP Code"
          size="small"
          value={searchValues.oldSapCode || ''}
          onChange={handleInputChange('oldSapCode')}
          disabled={disabled}
          sx={inputSx}
        />

        <TextField
          label="Hana SAP Code"
          size="small"
          value={searchValues.hanaSapCode || ''}
          onChange={handleInputChange('hanaSapCode')}
          disabled={disabled}
          sx={inputSx}
        />

        <TextField
          label="Supplier Description"
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

        <Button variant="outlined" onClick={handleResetClick} disabled={busy} sx={btnOutlineSx}>
          Reset
        </Button>
      </Box>
    </Paper>
  );
}

RequisitionMonthlySearch.propTypes = {
  searchValues: PropTypes.object.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  disabled: PropTypes.bool,
};
