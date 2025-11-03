// src/components/search/WeeklyMonthlyGroupSearch.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Paper, TextField, Button, Box, Autocomplete,
  FormControl, InputLabel, Select, MenuItem, Alert, Snackbar,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { enUS } from '@mui/x-date-pickers/locales';
import dayjs from 'dayjs';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function WeeklyMonthlyGroupSearch({
  searchValues,
  onSearchChange,
  onSearch,
  onReset,
}) {
  // === GROUP AUTOCOMPLETE ===
  const [groupOptions, setGroupOptions] = useState([]); // { id, name }
  const [groupInput, setGroupInput] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(''); // Lưu groupId
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupPage, setGroupPage] = useState(0);
  const [hasMoreGroups, setHasMoreGroups] = useState(true);
  const groupObserver = useRef();

  const loadGroups = useCallback(async (search = '', page = 0, append = false) => {
    if (page === 0 && !append) setGroupLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/group-summary-requisitions/filter`, {
        params: { name: search || undefined, page, size: 10 }
      });
      const newData = (res.data.content || []).map(g => ({ id: g.id, name: g.name }));
      setGroupOptions(prev => append ? [...prev, ...newData] : newData);
      setHasMoreGroups((res.data.totalElements || 0) > (page + 1) * 10);
    } catch (err) {
      console.error('Load groups failed:', err);
    } finally {
      setGroupLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups('', 0, false);
  }, [loadGroups]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGroups(groupInput, 0, false);
      setGroupPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [groupInput, loadGroups]);

  const lastGroupElementRef = useCallback(node => {
    if (groupLoading) return;
    if (groupObserver.current) groupObserver.current.disconnect();
    groupObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreGroups) {
        setGroupPage(prev => prev + 1);
      }
    });
    if (node) groupObserver.current.observe(node);
  }, [groupLoading, hasMoreGroups]);

  useEffect(() => {
    if (groupPage > 0) {
      loadGroups(groupInput, groupPage, true);
    }
  }, [groupPage, groupInput, loadGroups]);

  // === PRODUCT TYPE 1 ===
  const [productType1Options, setProductType1Options] = useState([]);
  const [filteredProductType1, setFilteredProductType1] = useState([]);
  const [selectedType1Id, setSelectedType1Id] = useState(null);

  // === PRODUCT TYPE 2 ===
  const [productType2Options, setProductType2Options] = useState([]);
  const [filteredProductType2, setFilteredProductType2] = useState([]);
  const [selectedType2Id, setSelectedType2Id] = useState(null);

  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState('');

  // Load Product Type 1
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/product-type-1/search?page=0&size=100`)
      .then(res => {
        const data = res.data.content || [];
        setProductType1Options(data);
        setFilteredProductType1(data);
      })
      .catch(() => setError('Cannot load product-type-1 list.'));
  }, []);

  // Load Product Type 2
  useEffect(() => {
    const fetchProductType2 = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/product-type-2/search`, {
          params: { productType1Id: selectedType1Id || undefined, page: 0, size: 100 }
        });
        const data = res.data.content || [];
        setProductType2Options(data);
        setFilteredProductType2(data);
      } catch {
        setError('Cannot load product-type-2 list.');
      }
    };
    fetchProductType2();
  }, [selectedType1Id]);

  // === HANDLERS ===
  const handleType1Input = async (_, value) => {
    onSearchChange({ ...searchValues, productType1Name: value || '', productType1Id: null });
    if (!value) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/product-type-1/search`, { params: { name: value, page: 0, size: 100 } });
      setFilteredProductType1(res.data.content);
    } catch {
      setError('Cannot search product-type-1.');
    }
  };

  const handleType1Select = (_, value) => {
    const id = value?.id || null;
    const name = value?.name || '';
    setSelectedType1Id(id);
    onSearchChange({ ...searchValues, productType1Id: id, productType1Name: name });
  };

  const handleType2Input = async (_, value) => {
    onSearchChange({ ...searchValues, productType2Name: value || '', productType2Id: null });
    if (!value) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/product-type-2/search`, {
        params: { productType1Id: selectedType1Id, name: value, page: 0, size: 100 }
      });
      setFilteredProductType2(res.data.content);
    } catch {
      setError('Cannot search product-type-2.');
    }
  };

  const handleType2Select = (_, value) => {
    const id = value?.id || null;
    const name = value?.name || '';
    setSelectedType2Id(id);
    onSearchChange({ ...searchValues, productType2Id: id, productType2Name: name });
  };

  const onInput = (field) => (e) => {
    const value = e.target.value;
    onSearchChange({ ...searchValues, [field]: value });
    if (field === 'startDate' || field === 'endDate') {
      setDateError('');
    }
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

  const handleSearch = () => {
    if (!validateDates()) return;
    onSearch({ ...searchValues });
  };

  const handleReset = () => {
    setSelectedType1Id(null);
    setSelectedType2Id(null);
    setFilteredProductType1(productType1Options);
    setFilteredProductType2(productType2Options);
    setDateError('');
    setGroupInput('');
    setSelectedGroupId('');
    setGroupOptions([]);
    setGroupPage(0);
    setHasMoreGroups(true);
    loadGroups('', 0, false);

    onSearchChange({
      groupName: '', groupId: '',
      typeId: '', startDate: '', endDate: '',
      productType1Id: null, productType1Name: '',
      productType2Id: null, productType2Name: '',
      englishName: '', vietnameseName: '', oldSapCode: '', hanaSapCode: ''
    });
    onReset?.();
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      localeText={enUS.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          mb: 1.5,
          background: 'linear-gradient(to right, #f7faff, #ffffff)',
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
          overflowX: 'auto',
          maxWidth: '100%',
        }}
      >
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert onClose={() => setError(null)} severity="error" sx={{ fontSize: '0.65rem' }}>
            {error}
          </Alert>
        </Snackbar>

        {dateError && (
          <Alert severity="warning" sx={{ mb: 1, fontSize: '0.65rem', py: 0.5 }}>
            {dateError}
          </Alert>
        )}

        {/* HÀNG 1: Product Type 1 → Product Type 2 → Type → Item (EN) → Item (VN) → Search */}
        <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, mb: 1, alignItems: 'center' }}>
          {/* Product Type 1 */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <Autocomplete
              freeSolo
              options={filteredProductType1}
              getOptionLabel={opt => typeof opt === 'string' ? opt : opt.name}
              value={searchValues.productType1Name || ''}
              onInputChange={handleType1Input}
              onChange={handleType1Select}
              renderInput={params => <TextField {...params} label="Product Type 1" size="small" sx={inputStyle} />}
            />
          </Box>

          {/* Product Type 2 */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <Autocomplete
              freeSolo
              options={filteredProductType2}
              getOptionLabel={opt => typeof opt === 'string' ? opt : opt.name}
              value={searchValues.productType2Name || ''}
              onInputChange={handleType2Input}
              onChange={handleType2Select}
              renderInput={params => <TextField {...params} label="Product Type 2" size="small" sx={inputStyle} />}
            />
          </Box>

          {/* Type (Weekly/Monthly) */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={labelStyle}>Type</InputLabel>
              <Select value={searchValues.typeId || ''} label="Type" onChange={onTypeChange} sx={selectStyle}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="1">Weekly</MenuItem>
                <MenuItem value="2">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Item (EN) */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <TextField label="Item Description (EN)" size="small" value={searchValues.englishName || ''} onChange={onInput('englishName')} sx={inputStyle} />
          </Box>

          {/* Item (VN) */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <TextField label="Item Description(VN)" size="small" value={searchValues.vietnameseName || ''} onChange={onInput('vietnameseName')} sx={inputStyle} />
          </Box>

          {/* Search Button */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <Button variant="contained" onClick={handleSearch} sx={searchBtnStyle}>Search</Button>
          </Box>
        </Box>

        {/* HÀNG 2: Group Name → From → To → Old SAP → Hana SAP → Reset */}
        <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, alignItems: 'center' }}>
          {/* Group Name Autocomplete */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <Autocomplete
              freeSolo
              options={groupOptions}
              getOptionLabel={(opt) => opt.name || ''}
              inputValue={groupInput}
              onInputChange={(_, newInput) => {
                setGroupInput(newInput);
                setSelectedGroupId('');
                onSearchChange({ ...searchValues, groupName: newInput, groupId: '' });
              }}
              onChange={(_, value) => {
                const id = value?.id || '';
                const name = value?.name || '';
                setGroupInput(name);
                setSelectedGroupId(id);
                onSearchChange({ ...searchValues, groupName: name, groupId: id });
              }}
              loading={groupLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Group Name"
                  size="small"
                  sx={inputStyle}
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
              ListboxProps={{ sx: { maxHeight: 200 } }}
            />
          </Box>

          {/* From Date - DatePicker */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
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
                  sx: inputStyle,
                  error: !!dateError && !!searchValues.startDate,
                },
              }}
            />
          </Box>

          {/* To Date - DatePicker */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
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
                  sx: inputStyle,
                  error: !!dateError && !!searchValues.endDate,
                },
              }}
            />
          </Box>

          {/* Old SAP Code */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <TextField label="Old SAP Code" size="small" value={searchValues.oldSapCode || ''} onChange={onInput('oldSapCode')} sx={inputStyle} />
          </Box>

          {/* Hana SAP Code */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <TextField label="Hana SAP Code" size="small" value={searchValues.hanaSapCode || ''} onChange={onInput('hanaSapCode')} sx={inputStyle} />
          </Box>

          {/* Reset Button */}
          <Box sx={{ width: '16.67%', minWidth: 150 }}>
            <Button variant="outlined" onClick={handleReset} sx={resetBtnStyle}>Reset</Button>
          </Box>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}

// === STYLES ===
const inputStyle = {
  width: '100%',
  '& .MuiInputBase-root': { height: 30, borderRadius: '6px', fontSize: '0.55rem' },
  '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
};

const labelStyle = { fontSize: '0.55rem', top: '-6px' };

const selectStyle = {
  height: 30,
  borderRadius: '6px',
  fontSize: '0.55rem',
};

const searchBtnStyle = {
  textTransform: 'none',
  fontWeight: 500,
  background: 'linear-gradient(to right, #4cb8ff, #027aff)',
  color: '#fff',
  px: 1.5,
  py: 0.3,
  borderRadius: '6px',
  fontSize: '0.55rem',
  height: 30,
  width: '100%',
  whiteSpace: 'nowrap',
};

const resetBtnStyle = {
  textTransform: 'none',
  fontWeight: 500,
  px: 1.5,
  py: 0.3,
  borderRadius: '6px',
  fontSize: '0.55rem',
  color: '#424242',
  borderColor: '#9e9e9e',
  height: 30,
  width: '100%',
  whiteSpace: 'nowrap',
};