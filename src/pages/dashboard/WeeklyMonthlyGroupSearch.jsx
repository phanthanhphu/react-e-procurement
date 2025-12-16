// src/components/search/WeeklyMonthlyGroupSearch.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { enUS } from '@mui/x-date-pickers/locales';
import dayjs from 'dayjs';

import { API_BASE_URL } from '../../config';

export default function WeeklyMonthlyGroupSearch({
  searchValues,
  onSearchChange,
  onSearch,
  onReset,
  disabled = false,
}) {
  const theme = useTheme();

  // ===== UI styles like ComparisonSearch =====
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

  // ===== Errors =====
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState('');
  const closeError = () => setError(null);

  // ===== Group autocomplete (infinite scroll) =====
  const [groupOptions, setGroupOptions] = useState([]); // {id,name}
  const [groupInput, setGroupInput] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupPage, setGroupPage] = useState(0);
  const [hasMoreGroups, setHasMoreGroups] = useState(true);
  const groupObserver = useRef(null);

  const loadGroups = useCallback(async (search = '', page = 0, append = false) => {
    if (page === 0 && !append) setGroupLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/group-summary-requisitions/filter`, {
        params: { name: search || undefined, page, size: 10 },
      });
      const newData = (res.data?.content || []).map((g) => ({ id: g.id, name: g.name }));
      setGroupOptions((prev) => (append ? [...prev, ...newData] : newData));
      setHasMoreGroups((res.data?.totalElements || 0) > (page + 1) * 10);
    } catch (e) {
      console.error('Load groups failed:', e.response?.data || e.message);
      setError('Không thể tải danh sách Group. Vui lòng thử lại.');
    } finally {
      setGroupLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups('', 0, false);
  }, [loadGroups]);

  // debounce group input search
  useEffect(() => {
    const t = setTimeout(() => {
      loadGroups(groupInput, 0, false);
      setGroupPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [groupInput, loadGroups]);

  const lastGroupElementRef = useCallback(
    (node) => {
      if (groupLoading) return;
      if (groupObserver.current) groupObserver.current.disconnect();

      groupObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreGroups) {
          setGroupPage((p) => p + 1);
        }
      });

      if (node) groupObserver.current.observe(node);
    },
    [groupLoading, hasMoreGroups]
  );

  useEffect(() => {
    if (groupPage > 0) loadGroups(groupInput, groupPage, true);
  }, [groupPage, groupInput, loadGroups]);

  // ===== Product Type 1/2 like ComparisonSearch =====
  const [productType1Options, setProductType1Options] = useState([]);
  const [productType2Options, setProductType2Options] = useState([]);

  const [selectedPT1, setSelectedPT1] = useState(null);
  const [selectedPT2, setSelectedPT2] = useState(null);

  const [loadingPT1, setLoadingPT1] = useState(false);
  const [loadingPT2, setLoadingPT2] = useState(false);

  // Fetch PT1
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

  // Sync selected PT1 from searchValues
  useEffect(() => {
    if (!productType1Options.length) return;
    const found = productType1Options.find((x) => x?.id === searchValues.productType1Id) ||
                  productType1Options.find((x) => x?.name === searchValues.productType1Name) ||
                  null;
    setSelectedPT1(found);
  }, [productType1Options, searchValues.productType1Id, searchValues.productType1Name]);

  // Fetch PT2 when PT1 changes
  useEffect(() => {
    let alive = true;
    const fetchPT2 = async () => {
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

  // Sync selected PT2 from searchValues
  useEffect(() => {
    if (!productType2Options.length) return;
    const found = productType2Options.find((x) => x?.id === searchValues.productType2Id) ||
                  productType2Options.find((x) => x?.name === searchValues.productType2Name) ||
                  null;
    setSelectedPT2(found);
  }, [productType2Options, searchValues.productType2Id, searchValues.productType2Name]);

  // ===== Handlers =====
  const handleInputChange = (field) => (e) => {
    onSearchChange({ ...searchValues, [field]: e.target.value });
    if (field === 'startDate' || field === 'endDate') setDateError('');
  };

  const handlePT1Select = (_, value) => {
    setSelectedPT1(value || null);
    // reset PT2
    setSelectedPT2(null);
    setProductType2Options([]);

    onSearchChange({
      ...searchValues,
      productType1Id: value?.id || null,
      productType1Name: value?.name || '',
      productType2Id: null,
      productType2Name: '',
    });
  };

  const handlePT2Select = (_, value) => {
    setSelectedPT2(value || null);
    onSearchChange({
      ...searchValues,
      productType2Id: value?.id || null,
      productType2Name: value?.name || '',
    });
  };

  const onTypeChange = (e) => onSearchChange({ ...searchValues, typeId: e.target.value });

  const validateDates = () => {
    const start = searchValues.startDate;
    const end = searchValues.endDate;

    if (start && !end) {
      setDateError('Please select "To Date" when "From Date" is selected.');
      return false;
    }
    if (end && !start) {
      setDateError('Please select "From Date" when "To Date" is selected.');
      return false;
    }
    setDateError('');
    return true;
  };

  const busy = disabled || loadingPT1 || loadingPT2 || groupLoading;

  const handleSearchClick = useCallback(() => {
    if (!validateDates()) return;
    onSearch?.({ ...searchValues });
  }, [onSearch, searchValues]);

  const handleResetClick = useCallback(() => {
    setSelectedPT1(null);
    setSelectedPT2(null);
    setProductType2Options([]);

    setGroupInput('');
    setGroupOptions([]);
    setGroupPage(0);
    setHasMoreGroups(true);
    loadGroups('', 0, false);

    setDateError('');

    onSearchChange({
      groupName: '',
      groupId: '',
      typeId: '',
      startDate: '',
      endDate: '',
      productType1Id: null,
      productType1Name: '',
      productType2Id: null,
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSapCode: '',
      hanaSapCode: '',
    });

    onReset?.();
  }, [loadGroups, onReset, onSearchChange]);

  const onEnterSearch = (e) => {
    if (e.key === 'Enter') handleSearchClick();
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      localeText={enUS.components.MuiLocalizationProvider.defaultProps.localeText}
    >
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

        {dateError && (
          <Alert severity="warning" sx={{ mb: 1, fontSize: '0.85rem' }}>
            {dateError}
          </Alert>
        )}

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

          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Type</InputLabel>
            <Select value={searchValues.typeId || ''} label="Type" onChange={onTypeChange} disabled={disabled}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">Weekly</MenuItem>
              <MenuItem value="2">Monthly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Item Description (EN)"
            size="small"
            value={searchValues.englishName || ''}
            onChange={handleInputChange('englishName')}
            disabled={disabled}
            sx={inputSx}
            onKeyDown={onEnterSearch}
          />

          <TextField
            label="Item Description (VN)"
            size="small"
            value={searchValues.vietnameseName || ''}
            onChange={handleInputChange('vietnameseName')}
            disabled={disabled}
            sx={inputSx}
            onKeyDown={onEnterSearch}
          />

          <Button variant="contained" onClick={handleSearchClick} disabled={busy} sx={btnPrimarySx}>
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
          <Autocomplete
            freeSolo
            options={groupOptions}
            getOptionLabel={(opt) => opt?.name || ''}
            inputValue={groupInput}
            onInputChange={(_, newInput) => {
              setGroupInput(newInput);
              onSearchChange({ ...searchValues, groupName: newInput, groupId: '' });
            }}
            onChange={(_, value) => {
              const id = value?.id || '';
              const name = value?.name || '';
              setGroupInput(name);
              onSearchChange({ ...searchValues, groupName: name, groupId: id });
            }}
            loading={groupLoading}
            disabled={disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Group Name"
                placeholder="Type to search…"
                size="small"
                sx={inputSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {groupLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option, { index }) => {
              const isLast = index === groupOptions.length - 1;
              return (
                <li {...props} ref={isLast ? lastGroupElementRef : null} key={option.id}>
                  {option.name}
                </li>
              );
            }}
            ListboxProps={{ sx: { maxHeight: 240 } }}
          />

          <DatePicker
            label="From Date"
            value={searchValues.startDate ? dayjs(searchValues.startDate) : null}
            onChange={(date) => {
              const formatted = date ? date.format('YYYY-MM-DD') : '';
              onSearchChange({ ...searchValues, startDate: formatted });
              setDateError('');
            }}
            format="MM/DD/YYYY"
            slotProps={{
              textField: {
                size: 'small',
                sx: inputSx,
                error: !!dateError && !!searchValues.startDate,
              },
            }}
            disabled={disabled}
          />

          <DatePicker
            label="To Date"
            value={searchValues.endDate ? dayjs(searchValues.endDate) : null}
            onChange={(date) => {
              const formatted = date ? date.format('YYYY-MM-DD') : '';
              onSearchChange({ ...searchValues, endDate: formatted });
              setDateError('');
            }}
            format="MM/DD/YYYY"
            slotProps={{
              textField: {
                size: 'small',
                sx: inputSx,
                error: !!dateError && !!searchValues.endDate,
              },
            }}
            disabled={disabled}
          />

          <TextField
            label="Old SAP Code"
            size="small"
            value={searchValues.oldSapCode || ''}
            onChange={handleInputChange('oldSapCode')}
            disabled={disabled}
            sx={inputSx}
            onKeyDown={onEnterSearch}
          />

          <TextField
            label="Hana SAP Code"
            size="small"
            value={searchValues.hanaSapCode || ''}
            onChange={handleInputChange('hanaSapCode')}
            disabled={disabled}
            sx={inputSx}
            onKeyDown={onEnterSearch}
          />

          <Button variant="outlined" onClick={handleResetClick} disabled={busy} sx={btnOutlineSx}>
            Reset
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}

WeeklyMonthlyGroupSearch.propTypes = {
  searchValues: PropTypes.object.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
  disabled: PropTypes.bool,
};
