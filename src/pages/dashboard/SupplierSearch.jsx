import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function SupplierSearch({
  searchSupplierCode,
  setSearchSupplierCode,
  searchSupplierName,
  setSearchSupplierName,
  searchSapCode,
  setSearchSapCode,
  searchHanaSapCode,
  setSearchHanaSapCode,
  searchItemDescriptionEN,
  setSearchItemDescriptionEN,
  searchItemDescriptionVN,
  setSearchItemDescriptionVN,
  searchMaterialGroupFullDescription,
  setSearchMaterialGroupFullDescription,
  searchProductType1Id,
  setSearchProductType1Id,
  searchProductType2Id,
  setSearchProductType2Id,
  searchCurrency,
  setSearchCurrency,
  searchGoodType,
  setSearchGoodType,
  setPage,
  onSearch,
  onReset,
  disabled = false,
}) {
  const theme = useTheme();

  const [error, setError] = useState(null);

  const [productType1Options, setProductType1Options] = useState([]);
  const [productType2Options, setProductType2Options] = useState([]);

  const [selectedPT1, setSelectedPT1] = useState(null);
  const [selectedPT2, setSelectedPT2] = useState(null);

  const [loadingPT1, setLoadingPT1] = useState(false);
  const [loadingPT2, setLoadingPT2] = useState(false);

  const closeError = () => setError(null);

  // ===== UI styles (same as ComparisonSearch) =====
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

  const busy = disabled || loadingPT1 || loadingPT2;

  const setPage0 = () => setPage?.(0);

  const onEnterSearch = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

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
        console.error('Error fetching PT1:', e.response?.data || e.message);
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
     Sync selected PT1 from searchProductType1Id
     ========================= */
  useEffect(() => {
    if (!productType1Options.length) return;
    const found = productType1Options.find((x) => x?.id === searchProductType1Id) || null;
    setSelectedPT1(found);
  }, [productType1Options, searchProductType1Id]);

  /* =========================
     Fetch Product Type 2 when PT1 changes
     ========================= */
  useEffect(() => {
    let alive = true;

    const fetchPT2 = async () => {
      // giống UX ComparisonSearch: chưa chọn PT1 -> khóa PT2 + không load
      if (!selectedPT1?.id) {
        setProductType2Options([]);
        setSelectedPT2(null);
        return;
      }

      setLoadingPT2(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/product-type-2/search`, {
          params: { productType1Id: selectedPT1.id, page: 0, size: 200 },
        });
        if (!alive) return;
        setProductType2Options(res.data?.content || []);
      } catch (e) {
        console.error('Error fetching PT2:', e.response?.data || e.message);
        if (!alive) return;
        setError('Không thể tải danh sách product-type-2. Vui lòng thử lại.');
        setProductType2Options([]);
      } finally {
        if (alive) setLoadingPT2(false);
      }
    };

    fetchPT2();
    return () => {
      alive = false;
    };
  }, [selectedPT1?.id]);

  /* =========================
     Sync selected PT2 from searchProductType2Id
     ========================= */
  useEffect(() => {
    if (!productType2Options.length) return;
    const found = productType2Options.find((x) => x?.id === searchProductType2Id) || null;
    setSelectedPT2(found);
  }, [productType2Options, searchProductType2Id]);

  const handlePT1Select = (_, value) => {
    const id = value?.id || '';
    setSelectedPT1(value || null);

    // reset PT2 chuẩn
    setSelectedPT2(null);
    setProductType2Options([]);

    setPage0();
    setSearchProductType1Id(id);
    setSearchProductType2Id('');
  };

  const handlePT2Select = (_, value) => {
    const id = value?.id || '';
    setSelectedPT2(value || null);
    setPage0();
    setSearchProductType2Id(id);
  };

  const handleCurrencyChange = (event) => {
    setPage0();
    setSearchCurrency(event.target.value);
  };

  const handleGoodTypeChange = (event) => {
    setPage0();
    setSearchGoodType(event.target.value);
  };

  const handleReset = useCallback(() => {
    setPage0();

    setSelectedPT1(null);
    setSelectedPT2(null);
    setProductType2Options([]);

    setSearchProductType1Id('');
    setSearchProductType2Id('');

    setSearchSupplierCode('');
    setSearchSupplierName('');
    setSearchSapCode('');
    setSearchHanaSapCode('');
    setSearchItemDescriptionEN('');
    setSearchItemDescriptionVN('');
    setSearchMaterialGroupFullDescription('');
    setSearchCurrency('');
    setSearchGoodType('');

    onReset?.();
  }, [
    onReset,
    setPage,
    setSearchCurrency,
    setSearchGoodType,
    setSearchHanaSapCode,
    setSearchItemDescriptionEN,
    setSearchItemDescriptionVN,
    setSearchMaterialGroupFullDescription,
    setSearchProductType1Id,
    setSearchProductType2Id,
    setSearchSapCode,
    setSearchSupplierCode,
    setSearchSupplierName,
  ]);

  const handleSearch = useCallback(() => {
    setPage0();
    onSearch?.();
  }, [onSearch, setPage]);

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
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>Filters</Typography>
      </Stack>

      {/* Row 1 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(6, minmax(160px, 1fr))' },
          gap: 1,
          mb: 1,
          alignItems: 'center',
        }}
      >
        <Autocomplete
          options={productType1Options}
          loading={loadingPT1}
          value={selectedPT1}
          onChange={handlePT1Select}
          getOptionLabel={(o) => (typeof o === 'string' ? o : o?.name || '')}
          isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
          disabled={disabled}
          renderInput={(params) => (
            <TextField {...params} label="Product Type 1" placeholder="Select…" size="small" sx={inputSx} />
          )}
        />

        <Autocomplete
          options={productType2Options}
          loading={loadingPT2}
          value={selectedPT2}
          onChange={handlePT2Select}
          getOptionLabel={(o) => (typeof o === 'string' ? o : o?.name || '')}
          isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
          disabled={disabled || !selectedPT1}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Product Type 2"
              placeholder={selectedPT1 ? 'Select…' : 'Select Product Type 1 first'}
              size="small"
              sx={inputSx}
            />
          )}
        />

        <TextField
          label="Supplier Code"
          size="small"
          value={searchSupplierCode}
          onChange={(e) => {
            setPage0();
            setSearchSupplierCode(e.target.value);
          }}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
        />

        <TextField
          label="Supplier Description"
          size="small"
          value={searchSupplierName}
          onChange={(e) => {
            setPage0();
            setSearchSupplierName(e.target.value);
          }}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
        />

        <FormControl fullWidth size="small" sx={inputSx}>
          <InputLabel sx={{ fontSize: '0.8rem' }}>Currency</InputLabel>
          <Select value={searchCurrency || ''} label="Currency" onChange={handleCurrencyChange} disabled={disabled}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="VND">VND</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EURO">EURO</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSearch} disabled={busy} sx={btnPrimarySx}>
          Search
        </Button>
      </Box>

      {/* Row 2 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(6, minmax(160px, 1fr))' },
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          label="SAP Code"
          size="small"
          value={searchSapCode}
          onChange={(e) => {
            setPage0();
            setSearchSapCode(e.target.value);
          }}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
        />

        <TextField
          label="Hana SAP Code"
          size="small"
          value={searchHanaSapCode}
          onChange={(e) => {
            setPage0();
            setSearchHanaSapCode(e.target.value);
          }}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
        />

        <TextField
          label="Item Description (EN)"
          size="small"
          value={searchItemDescriptionEN}
          onChange={(e) => {
            setPage0();
            setSearchItemDescriptionEN(e.target.value);
          }}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
        />

        <TextField
          label="Item Description (VN)"
          size="small"
          value={searchItemDescriptionVN}
          onChange={(e) => {
            setPage0();
            setSearchItemDescriptionVN(e.target.value);
          }}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
        />

        <TextField
          label="Material Group Full Description"
          size="small"
          value={searchMaterialGroupFullDescription}
          onChange={(e) => {
            setPage0();
            setSearchMaterialGroupFullDescription(e.target.value);
          }}
          disabled={disabled}
          sx={inputSx}
          onKeyDown={onEnterSearch}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Good Type</InputLabel>
            <Select value={searchGoodType || ''} label="Good Type" onChange={handleGoodTypeChange} disabled={disabled}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Common">Common</MenuItem>
              <MenuItem value="Special">Special</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handleReset} disabled={busy} sx={btnOutlineSx}>
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

SupplierSearch.propTypes = {
  searchSupplierCode: PropTypes.string,
  setSearchSupplierCode: PropTypes.func.isRequired,
  searchSupplierName: PropTypes.string,
  setSearchSupplierName: PropTypes.func.isRequired,
  searchSapCode: PropTypes.string,
  setSearchSapCode: PropTypes.func.isRequired,
  searchHanaSapCode: PropTypes.string,
  setSearchHanaSapCode: PropTypes.func.isRequired,
  searchItemDescriptionEN: PropTypes.string,
  setSearchItemDescriptionEN: PropTypes.func.isRequired,
  searchItemDescriptionVN: PropTypes.string,
  setSearchItemDescriptionVN: PropTypes.func.isRequired,
  searchMaterialGroupFullDescription: PropTypes.string,
  setSearchMaterialGroupFullDescription: PropTypes.func.isRequired,
  searchProductType1Id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSearchProductType1Id: PropTypes.func.isRequired,
  searchProductType2Id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSearchProductType2Id: PropTypes.func.isRequired,
  searchCurrency: PropTypes.string,
  setSearchCurrency: PropTypes.func.isRequired,
  searchGoodType: PropTypes.string,
  setSearchGoodType: PropTypes.func.isRequired,
  setPage: PropTypes.func,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
  disabled: PropTypes.bool,
};
