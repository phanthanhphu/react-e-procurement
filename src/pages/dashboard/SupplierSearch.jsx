import React, { useEffect, useState } from 'react';
import { Paper, TextField, Button, Box, useTheme, Autocomplete, Snackbar, Alert } from '@mui/material';
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
  searchProductType1Id,
  setSearchProductType1Id,
  searchProductType2Id,
  setSearchProductType2Id,
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
  const handleGroupItem1Change = async (event, value) => {
    setSearchGroupItem1(value || '');
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
  const handleGroupItem1Select = (event, value) => {
    setSelectedProductType1Id(value ? value.id : null);
    setSearchGroupItem1(value ? value.name : '');
    setSearchProductType1Id(value ? value.id : '');
  };

  // Xử lý tìm kiếm product-type-2
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
      setError('Không thể tìm kiếm product-type-2. Vui lòng thử lại.');
      console.error("Error searching product type 2:", error);
    }
  };

  // Xử lý chọn product-type-2
  const handleGroupItem2Select = (event, value) => {
    setSelectedProductType2Id(value ? value.id : null);
    setSearchGroupItem2(value ? value.name : '');
    setSearchProductType2Id(value ? value.id : '');
  };

  // Xử lý reset
  const handleReset = () => {
    setPage(0);
    setSearchGroupItem1('');
    setSearchGroupItem2('');
    setSelectedProductType1Id(null);
    setSelectedProductType2Id(null);
    setSearchProductType1Id('');
    setSearchProductType2Id('');
    setFilteredProductType1Options(productType1Options);
    setFilteredProductType2Options(productType2Options);
    onReset();
  };

  // Xử lý search
  const handleSearch = () => {
    setPage(0);
    onSearch({ productType1Id: selectedProductType1Id, productType2Id: selectedProductType2Id });
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
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%', fontSize: '0.65rem' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Row 1: 4 inputs + Search button */}
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
        <Box sx={{ width: '20%', minWidth: 150 }}>
          <TextField
            label="Supplier Name"
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
        <Box sx={{ width: '20%', minWidth: 150 }}>
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
        <Box sx={{ width: '20%', minWidth: 150 }}>
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
              height: 30,
              width: '100%',
              whiteSpace: 'nowrap',
            }}
          >
            Search
          </Button>
        </Box>
      </Box>

      {/* Row 2: 4 inputs + Reset button */}
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
            label="Short Item Description"
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
        <Box sx={{ width: '20%', minWidth: 150 }}>
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
        <Box sx={{ width: '20%', minWidth: 150 }}>
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
                label="Group Item 1"
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
        <Box sx={{ width: '20%', minWidth: 150 }}>
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
                label="Group Item 2"
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