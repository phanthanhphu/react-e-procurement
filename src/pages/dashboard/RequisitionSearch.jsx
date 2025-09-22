import React, { useEffect, useState } from 'react';
import { Paper, TextField, Button, Box, useTheme, Autocomplete, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function RequisitionSearch({ searchValues, onSearchChange, onSearch, onReset }) {
  const theme = useTheme();
  const [productType1Options, setProductType1Options] = useState([]);
  const [filteredProductType1Options, setFilteredProductType1Options] = useState([]);
  const [selectedProductType1Id, setSelectedProductType1Id] = useState(null);
  const [productType2Options, setProductType2Options] = useState([]);
  const [filteredProductType2Options, setFilteredProductType2Options] = useState([]);
  const [selectedProductType2Id, setSelectedProductType2Id] = useState(null);
  const [error, setError] = useState(null);

  // Lấy danh sách product-type-1 khi component mount
  useEffect(() => {
    const fetchProductType1 = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/product-type-1/search?page=0&size=100`);
        setProductType1Options(response.data.content);
        setFilteredProductType1Options(response.data.content);
      } catch (error) {
        setError('Không thể tải danh sách product-type-1. Vui lòng thử lại.');
        console.error("Error fetching product type 1:", error);
      }
    };
    fetchProductType1();
  }, []);

  // Lấy danh sách product-type-2 ban đầu, sử dụng selectedProductType1Id nếu có
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
        setError('Không thể tải danh sách product-type-2. Vui lòng thử lại.');
        console.error("Error fetching product type 2:", error);
      }
    };
    fetchProductType2();
  }, [selectedProductType1Id]);

  // Xử lý tìm kiếm product-type-1
  const handleProductType1Change = async (event, value) => {
    onSearchChange({ ...searchValues, productType1Name: value || '' });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/product-type-1/search`, {
        params: { page: 0, size: 100, name: value || '' },
      });
      setFilteredProductType1Options(response.data.content);
    } catch (error) {
      setError('Không thể tìm kiếm product-type-1. Vui lòng thử lại.');
      console.error("Error searching product type 1:", error);
    }
  };

  // Xử lý chọn product-type-1
  const handleProductType1Select = (event, value) => {
    setSelectedProductType1Id(value ? value.id : null);
    onSearchChange({ ...searchValues, productType1Name: value ? value.name : '' });
  };

  // Xử lý tìm kiếm product-type-2
  const handleProductType2Change = async (event, value) => {
    onSearchChange({ ...searchValues, productType2Name: value || '' });
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
      setError('Không thể tìm kiếm product-type-2. Vui lòng thử lại.');
      console.error("Error searching product type 2:", error);
    }
  };

  // Xử lý chọn product-type-2
  const handleProductType2Select = (event, value) => {
    setSelectedProductType2Id(value ? value.id : null);
    onSearchChange({ ...searchValues, productType2Name: value ? value.name : '' });
  };

  // Xử lý input change cho các trường khác
  const handleInputChange = (field) => (e) => {
    onSearchChange({ ...searchValues, [field]: e.target.value });
  };

  // Xử lý search
  const handleSearch = () => {
    onSearch({ productType1Id: selectedProductType1Id, productType2Id: selectedProductType2Id });
  };

  // Xử lý reset
  const handleReset = () => {
    setSelectedProductType1Id(null);
    setSelectedProductType2Id(null);
    setFilteredProductType1Options(productType1Options);
    setFilteredProductType2Options(productType2Options);
    onReset();
  };

  // Đóng Snackbar lỗi
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
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%', fontSize: '0.65rem' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* First Row: 4 Input Fields + Search Button */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          mb: 1,
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <Autocomplete
            freeSolo
            options={filteredProductType1Options}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            value={searchValues.productType1Name || ''}
            onInputChange={handleProductType1Change}
            onChange={handleProductType1Select}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product Type 1 Name"
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
                  width: '100%',
                }}
              />
            )}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <Autocomplete
            freeSolo
            options={filteredProductType2Options}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            value={searchValues.productType2Name || ''}
            onInputChange={handleProductType2Change}
            onChange={handleProductType2Select}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product Type 2 Name"
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
                  width: '100%',
                }}
              />
            )}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <TextField
            label="English Name"
            variant="outlined"
            size="small"
            value={searchValues.englishName || ''}
            onChange={handleInputChange('englishName')}
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <TextField
            label="Vietnamese Name"
            variant="outlined"
            size="small"
            value={searchValues.vietnameseName || ''}
            onChange={handleInputChange('vietnameseName')}
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
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
              fontSize: '0.65rem',
              height: '30px',
              width: '100%',
            }}
          >
            Search
          </Button>
        </Box>
      </Box>

      {/* Second Row: 4 Input Fields + Reset Button */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <TextField
            label="Old SAP Code"
            variant="outlined"
            size="small"
            value={searchValues.oldSapCode || ''}
            onChange={handleInputChange('oldSapCode')}
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <TextField
            label="New SAP Code"
            variant="outlined"
            size="small"
            value={searchValues.newSapCode || ''}
            onChange={handleInputChange('newSapCode')}
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <TextField
            label="Unit"
            variant="outlined"
            size="small"
            value={searchValues.unit || ''}
            onChange={handleInputChange('unit')}
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <TextField
            label="Department Name"
            variant="outlined"
            size="small"
            value={searchValues.departmentName || ''}
            onChange={handleInputChange('departmentName')}
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 1.5,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
              height: '30px',
              width: '100%',
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}