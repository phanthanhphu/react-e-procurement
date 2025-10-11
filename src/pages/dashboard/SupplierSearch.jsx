import React, { useEffect, useState } from 'react';
import { Paper, TextField, Button, Box, useTheme, Autocomplete, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function SupplierSearch({
  searchSupplierCode,
  setSearchSupplierCode,
  searchSupplierName,
  setSearchSupplierName,
  searchSapCode,
  setSearchSapCode,
  searchItemNo,
  setSearchItemNo,
  searchItemDescription,
  setSearchItemDescription,
  searchFullDescription,
  setSearchFullDescription,
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
}) {
  const theme = useTheme();
  const [productType1Options, setProductType1Options] = useState([]);
  const [filteredProductType1Options, setFilteredProductType1Options] = useState([]);
  const [selectedProductType1Id, setSelectedProductType1Id] = useState(null);
  const [selectedProductType2Id, setSelectedProductType2Id] = useState(null);
  const [productType2Options, setProductType2Options] = useState([]);
  const [filteredProductType2Options, setFilteredProductType2Options] = useState([]);
  const [searchGroupItem1, setSearchGroupItem1] = useState('');
  const [searchGroupItem2, setSearchGroupItem2] = useState('');
  const [error, setError] = useState(null);

  // Fetch product-type-1 list when component mounts
  useEffect(() => {
    const fetchProductType1 = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/product-type-1/search?page=0&size=100`);
        setProductType1Options(response.data.content);
        setFilteredProductType1Options(response.data.content);
      } catch (error) {
        setError('Cannot load product-type-1 list. Please try again.');
        console.error("Error fetching product type 1:", error);
      }
    };
    fetchProductType1();
  }, []);

  // Fetch product-type-2 list initially, using selectedProductType1Id if available
  useEffect(() => {
    const fetchProductType2 = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/product-type-2/search`, {
          params: {
            productType1Id: selectedProductType1Id || undefined,
            page: 0,
            size: 100,
          },
        });
        setProductType2Options(response.data.content);
        setFilteredProductType2Options(response.data.content);
      } catch (error) {
        setError('Cannot load product-type-2 list. Please try again.');
        console.error("Error fetching product type 2:", error);
      }
    };
    fetchProductType2();
  }, [selectedProductType1Id]);

  // Handle product-type-1 search
  const handleGroupItem1Change = async (event, value) => {
    setSearchGroupItem1(value || '');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/product-type-1/search`, {
        params: { page: 0, size: 100, name: value || '' },
      });
      setFilteredProductType1Options(response.data.content);
    } catch (error) {
      setError('Cannot search product-type-1. Please try again.');
      console.error("Error searching product type 1:", error);
    }
  };

  // Handle product-type-1 selection
  const handleGroupItem1Select = (event, value) => {
    setSelectedProductType1Id(value ? value.id : null);
    setSearchGroupItem1(value ? value.name : '');
    setSearchProductType1Id(value ? value.id : '');
    setSelectedProductType2Id(null);
    setSearchGroupItem2('');
    setSearchProductType2Id('');
  };

  // Handle product-type-2 search
  const handleGroupItem2Change = async (event, value) => {
    setSearchGroupItem2(value || '');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/product-type-2/search`, {
        params: {
          productType1Id: selectedProductType1Id || undefined,
          page: 0,
          size: 100,
          name: value || '',
        },
      });
      setProductType2Options(response.data.content);
      setFilteredProductType2Options(response.data.content);
    } catch (error) {
      setError('Cannot search product-type-2. Please try again.');
      console.error("Error searching product type 2:", error);
    }
  };

  // Handle product-type-2 selection
  const handleGroupItem2Select = (event, value) => {
    setSelectedProductType2Id(value ? value.id : null);
    setSearchGroupItem2(value ? value.name : '');
    setSearchProductType2Id(value ? value.id : '');
  };

  // Handle currency change
  const handleCurrencyChange = (event) => {
    const value = event.target.value;
    setSearchCurrency(value);
    setPage(0);
  };

  // Handle goodType change
  const handleGoodTypeChange = (event) => {
    const value = event.target.value;
    setSearchGoodType(value);
    setPage(0);
  };

  // Handle reset
  const handleReset = () => {
    setPage(0);
    setSearchGroupItem1('');
    setSearchGroupItem2('');
    setSelectedProductType1Id(null);
    setSelectedProductType2Id(null);
    setSearchProductType1Id('');
    setSearchProductType2Id('');
    setSearchSupplierCode('');
    setSearchSupplierName('');
    setSearchSapCode('');
    setSearchItemNo('');
    setSearchItemDescription('');
    setSearchFullDescription('');
    setSearchMaterialGroupFullDescription('');
    setSearchCurrency('');
    setSearchGoodType('');
    setFilteredProductType1Options(productType1Options);
    setFilteredProductType2Options(productType2Options);
    onReset();
  };

  // Handle search
  const handleSearch = () => {
    setPage(0);
    onSearch();
  };

  // Close error Snackbar
  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        mb: 1.5,
        background: 'linear-gradient(to right, #f7faff, #ffffff)',
        borderRadius: 2,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        border: `1px solid ${theme.palette.divider}`,
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%', fontSize: '0.65rem' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Row 1: Product Type 1, Product Type 2, Supplier Code, Supplier Name, Currency, Search */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          mb: 1,
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <Autocomplete
            freeSolo
            options={filteredProductType1Options}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            value={searchGroupItem1}
            onInputChange={handleGroupItem1Change}
            onChange={handleGroupItem1Select}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product Type 1"
                variant="outlined"
                size="small"
                sx={{
                  width: '100%',
                  '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
                }}
              />
            )}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <Autocomplete
            freeSolo
            options={filteredProductType2Options}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            value={searchGroupItem2}
            onInputChange={handleGroupItem2Change}
            onChange={handleGroupItem2Select}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product Type 2"
                variant="outlined"
                size="small"
                sx={{
                  width: '100%',
                  '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
                }}
              />
            )}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <TextField
            label="Supplier Code"
            variant="outlined"
            size="small"
            value={searchSupplierCode}
            onChange={(e) => {
              setPage(0);
              setSearchSupplierCode(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <TextField
            label="Supplier Description"
            variant="outlined"
            size="small"
            value={searchSupplierName}
            onChange={(e) => {
              setPage(0);
              setSearchSupplierName(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="currency-label" sx={{ fontSize: '0.55rem', top: '-6px' }}>
              Currency
            </InputLabel>
            <Select
              labelId="currency-label"
              value={searchCurrency}
              label="Currency"
              onChange={handleCurrencyChange}
              sx={{
                height: '30px',
                borderRadius: '6px',
                fontSize: '0.55rem',
              }}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="VND">VND</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EURO">EURO</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
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
            }}
          >
            Search
          </Button>
        </Box>
      </Box>

      {/* Row 2: SAP Code, Item No, Item Description, Full Description, Good Type, Reset */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <TextField
            label="SAP Code"
            variant="outlined"
            size="small"
            value={searchSapCode}
            onChange={(e) => {
              setPage(0);
              setSearchSapCode(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <TextField
            label="Item No"
            variant="outlined"
            size="small"
            value={searchItemNo}
            onChange={(e) => {
              setPage(0);
              setSearchItemNo(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <TextField
            label="Item Description"
            variant="outlined"
            size="small"
            value={searchItemDescription}
            onChange={(e) => {
              setPage(0);
              setSearchItemDescription(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <TextField
            label="Full Description"
            variant="outlined"
            size="small"
            value={searchFullDescription}
            onChange={(e) => {
              setPage(0);
              setSearchFullDescription(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="good-type-label" sx={{ fontSize: '0.55rem', top: '-6px' }}>
              Good Type
            </InputLabel>
            <Select
              labelId="good-type-label"
              value={searchGoodType}
              label="Good Type"
              onChange={handleGoodTypeChange}
              sx={{
                height: '30px',
                borderRadius: '6px',
                fontSize: '0.55rem',
              }}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="Common">Common</MenuItem>
              <MenuItem value="Special">Special</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: '16.67%', minWidth: 150 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 1.5,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.55rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
              height: 30,
              width: '100%',
              whiteSpace: 'nowrap',
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}