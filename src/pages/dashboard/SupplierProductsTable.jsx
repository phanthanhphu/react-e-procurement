import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Stack,
  IconButton,
  TablePagination,
  useTheme,
  useMediaQuery,
  Button,
  Input,
  Popover,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete, FileUpload, Add, Edit, Image as ImageIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import axios from 'axios';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import SupplierSearch from './SupplierSearch';
import Notification from './Notification';
import { API_BASE_URL } from '../../config';

// Danh sách các endpoint công khai
const PUBLIC_ENDPOINTS = [
  '/api/product-type-1/search',
  '/api/product-type-2/search',
  '/api/group-summary-requisitions/',
  '/api/departments/filter',
  '/api/supplier-products/filter',
  '/api/auth/login',
  '/users/login',
  '/api/users/add',
  '/users/add',
];

// Cấu hình axios với interceptor
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: '*/*',
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) => config.url.includes(endpoint));
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request URL:', config.url, 'Headers:', config.headers);
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('401 Unauthorized:', error.response.data);
      localStorage.removeItem('token');
      window.location.href = '/react/login';
    }
    return Promise.reject(error);
  }
);

// Hàm định dạng màu sắc cho tiền tệ
const getCurrencyColor = (currency) => {
  switch (currency) {
    case 'VND':
      return '#4caf50';
    case 'EURO':
      return '#2196f3';
    case 'USD':
      return '#e57373';
    default:
      return '#9e9e9e';
  }
};

// Hàm định dạng màu sắc cho goodType
const getGoodTypeColor = (goodType) => {
  switch (goodType) {
    case 'Common':
      return '#4caf50';
    case 'Special':
      return '#2196f3';
    case 'Electronics':
      return '#e57373';
    default:
      return '#9e9e9e';
  }
};

// Định nghĩa cột sticky (chỉ SAP Code)
const stickyColumns = [
  { key: 'sapCode', minWidth: 100, left: 0 },
];

const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Product Item 1', key: 'productType1Name', sortable: true, backendKey: 'productType1Name' },
  { label: 'Product Item 2', key: 'productType2Name', sortable: true, backendKey: 'productType2Name' },
  { label: 'Supplier Code', key: 'supplierCode', sortable: true, backendKey: 'supplierCode' },
  { label: 'Supplier Description', key: 'supplierName', sortable: true, backendKey: 'supplierName' },
  { label: 'SAP Code', key: 'sapCode', sortable: true, backendKey: 'sapCode' },
  { label: 'Item No', key: 'itemNo', sortable: true, backendKey: 'itemNo' },
  { label: 'Item Description', key: 'itemDescription', sortable: true, backendKey: 'itemDescription' },
  { label: 'Full Description', key: 'fullDescription', sortable: true, backendKey: 'fullDescription' },
  { label: 'Size', key: 'size', sortable: true, backendKey: 'size' },
  { label: 'Unit', key: 'unit', sortable: true, backendKey: 'unit' },
  { label: 'Price', key: 'price', sortable: true, backendKey: 'price' },
  { label: 'Currency', key: 'currency', sortable: true, backendKey: 'currency' },
  { label: 'Good Type', key: 'goodType', sortable: true, backendKey: 'goodType' },
  { label: 'Images', key: 'image', sortable: false },
  { label: 'Action', key: 'action', sortable: false },
];

function SupplierProductsTable({ supplierProducts, handleDelete, handleEdit, page, rowsPerPage, sortConfig, handleSort, onRefresh, theme }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrcs, setPopoverImgSrcs] = useState([]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handlePopoverOpen = (event, imageUrls) => {
    setAnchorEl(event.currentTarget);
    const fullSrcs = imageUrls.map((imgSrc) =>
      imgSrc.startsWith('http')
        ? `${imgSrc}?t=${new Date().getTime()}`
        : `${API_BASE_URL}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}?t=${new Date().getTime()}`
    );
    console.log('Image URLs:', fullSrcs);
    setPopoverImgSrcs(fullSrcs);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverImgSrcs([]);
  };

  const open = Boolean(anchorEl);

  if (!supplierProducts || supplierProducts.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.7rem', color: '#666' }}>No Data</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ height: 'calc(100vh - 320px)', overflowX: 'auto', boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)' }}>
      <Table size="small" sx={{ minWidth: 1500 }} stickyHeader>
        <TableHead>
          <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
            {headers.map(({ label, key, sortable }) => (
              <TableCell
                key={key}
                align={['Action', 'Images', 'Currency', 'Good Type', 'No', 'Price'].includes(label) ? 'center' : 'left'}
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.55rem',
                  color: '#ffffff',
                  py: 0.2,
                  px: 0.4,
                  whiteSpace: 'nowrap',
                  borderRight: '1px solid rgba(255,255,255,0.15)',
                  '&:last-child': { borderRight: 'none' },
                  position: 'sticky',
                  top: 0,
                  zIndex: stickyColumns.some((col) => col.key === key) ? 3 : 1, // Tăng zIndex cho SAP Code
                  backgroundColor: '#027aff',
                  ...(stickyColumns.some((col) => col.key === key) && !isMobile && {
                    left: stickyColumns.find((col) => col.key === key).left,
                    // Không sử dụng boxShadow để trông như cột bình thường
                  }),
                  minWidth: stickyColumns.find((col) => col.key === key)?.minWidth || 100,
                  cursor: sortable ? 'pointer' : 'default',
                  '&:hover': sortable ? { backgroundColor: '#016ae3' } : {},
                  transition: 'background-color 0.3s ease',
                }}
                onClick={() => sortable && handleSort(key)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: ['Action', 'Images', 'Currency', 'Good Type', 'No', 'Price'].includes(label) ? 'center' : 'flex-start' }}>
                  <Tooltip title={label} arrow>
                    <span>{label}</span>
                  </Tooltip>
                  {sortable && (
                    <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                      {sortConfig.key === key && sortConfig.direction === 'asc' ? (
                        <ArrowUpward sx={{ fontSize: '0.8rem', color: '#fff' }} />
                      ) : sortConfig.key === key && sortConfig.direction === 'desc' ? (
                        <ArrowDownward sx={{ fontSize: '0.8rem', color: '#fff' }} />
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <ArrowUpward sx={{ fontSize: '0.6rem', color: '#ccc' }} />
                          <ArrowDownward sx={{ fontSize: '0.6rem', color: '#ccc' }} />
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {supplierProducts.map((product, idx) => (
            <TableRow
              key={product.id}
              sx={{
                backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                  '& .sticky-cell': { backgroundColor: '#e3f2fd' },
                },
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              {headers.map(({ key, label }) => (
                <TableCell
                  key={key}
                  align={['Action', 'Images', 'Currency', 'Good Type', 'No', 'Price'].includes(label) ? 'center' : 'left'}
                  className={stickyColumns.some((col) => col.key === key) ? 'sticky-cell' : ''}
                  sx={{
                    fontSize: '0.55rem',
                    py: 0.2,
                    px: 0.4,
                    whiteSpace: key === 'itemDescription' || key === 'fullDescription' ? 'normal' : 'nowrap',
                    wordBreak: key === 'itemDescription' || key === 'fullDescription' ? 'break-word' : 'normal',
                    width: key === 'itemDescription' || key === 'fullDescription' ? '200px' : 'auto',
                    ...(stickyColumns.some((col) => col.key === key) && !isMobile && {
                      position: 'sticky',
                      left: stickyColumns.find((col) => col.key === key).left,
                      zIndex: 2, // Tăng zIndex để đảm bảo không bị che
                      backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff',
                      // Không sử dụng boxShadow
                    }),
                    minWidth: stickyColumns.find((col) => col.key === key)?.minWidth || 100,
                    transition: 'background-color 0.3s ease',
                  }}
                >
                  {key === 'no' && (idx + 1 + page * rowsPerPage)}
                  {key === 'productType1Name' && (product.productType1Name || '')}
                  {key === 'productType2Name' && (product.productType2Name || '')}
                  {key === 'supplierCode' && (product.supplierCode || '')}
                  {key === 'supplierName' && (product.supplierName || '')}
                  {key === 'sapCode' && (product.sapCode || '')}
                  {key === 'itemNo' && (product.itemNo || '')}
                  {key === 'itemDescription' && (product.itemDescription || '')}
                  {key === 'fullDescription' && (product.fullDescription || '')}
                  {key === 'size' && (product.size || '')}
                  {key === 'unit' && (product.unit || '')}
                  {key === 'price' && (product.price ? Number(product.price).toLocaleString() : '')}
                  {key === 'currency' && (
                    <Box
                      sx={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.55rem',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: getCurrencyColor(product.currency),
                        display: 'inline-block',
                      }}
                    >
                      {product.currency || 'N/A'}
                    </Box>
                  )}
                  {key === 'goodType' && (
                    <Box
                      sx={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.55rem',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: getGoodTypeColor(product.goodType),
                        display: 'inline-block',
                      }}
                    >
                      {product.goodType || 'N/A'}
                    </Box>
                  )}
                  {key === 'image' && (
                    product.imageUrls && product.imageUrls.length > 0 ? (
                      <IconButton
                        size="small"
                        onMouseEnter={(e) => handlePopoverOpen(e, product.imageUrls)}
                        aria-owns={open ? 'mouse-over-popover' : undefined}
                        aria-haspopup="true"
                      >
                        <ImageIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <Typography sx={{ fontSize: '0.55rem', color: '#888' }}>No Images</Typography>
                    )
                  )}
                  {key === 'action' && (
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(product)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(product)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Popover
        id="mouse-over-popover"
        sx={{ pointerEvents: 'auto' }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Box
          sx={{
            p: 1,
            maxWidth: 300,
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {popoverImgSrcs.length > 0 ? (
            <Stack direction="column" spacing={1}>
              {popoverImgSrcs.map((imgSrc, index) => (
                <Box key={index} sx={{ textAlign: 'center' }}>
                  <img
                    src={imgSrc}
                    alt={`Product Image ${index + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 4,
                      objectFit: 'contain',
                    }}
                    loading="lazy"
                    onError={(e) => {
                      console.error(`Failed to load image: ${imgSrc}`);
                      e.target.src = '/images/fallback.jpg';
                      e.target.alt = 'Failed to load';
                    }}
                  />
                  <Typography sx={{ mt: 0.5, fontSize: '0.7rem', color: '#555' }}>
                    Image {index + 1}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ p: 1, fontSize: '0.7rem' }}>No images available</Typography>
          )}
        </Box>
      </Popover>
    </TableContainer>
  );
}

export default function SupplierProductsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [file, setFile] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  const [searchSapCode, setSearchSapCode] = useState('');
  const [searchItemNo, setSearchItemNo] = useState('');
  const [searchItemDescription, setSearchItemDescription] = useState('');
  const [searchFullDescription, setSearchFullDescription] = useState('');
  const [searchMaterialGroupFullDescription, setSearchMaterialGroupFullDescription] = useState('');
  const [searchProductType1Id, setSearchProductType1Id] = useState('');
  const [searchProductType2Id, setSearchProductType2Id] = useState('');
  const [searchCurrency, setSearchCurrency] = useState('');
  const [searchGoodType, setSearchGoodType] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    try {
      const params = {
        page,
        size: rowsPerPage,
        sort: sortConfig.key
          ? `${headers.find((h) => h.key === sortConfig.key)?.backendKey || sortConfig.key},${sortConfig.direction || 'asc'}`
          : 'createdAt,desc',
      };
      if (searchSupplierCode) params.supplierCode = searchSupplierCode;
      if (searchSupplierName) params.supplierName = searchSupplierName;
      if (searchSapCode) params.sapCode = searchSapCode;
      if (searchItemNo) params.itemNo = searchItemNo;
      if (searchItemDescription) params.itemDescription = searchItemDescription;
      if (searchFullDescription) params.fullDescription = searchFullDescription;
      if (searchMaterialGroupFullDescription) params.materialGroupFullDescription = searchMaterialGroupFullDescription;
      if (searchProductType1Id) params.productType1Id = searchProductType1Id;
      if (searchProductType2Id) params.productType2Id = searchProductType2Id;
      if (searchCurrency) params.currency = searchCurrency;
      if (searchGoodType) params.goodType = searchGoodType;

      console.log('Request Params:', params);
      const response = await axiosInstance.get('/api/supplier-products/filter', { params });
      console.log('API Response:', response.data);
      setData(response.data.data.content || []);
      setTotalElements(response.data.data.totalElements || 0);
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      setNotification({
        open: true,
        message: `Failed to load data: ${err.response?.data?.message || err.message}`,
        severity: 'error',
      });
      setData([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    searchSupplierCode,
    searchSupplierName,
    searchSapCode,
    searchItemNo,
    searchItemDescription,
    searchFullDescription,
    searchMaterialGroupFullDescription,
    searchProductType1Id,
    searchProductType2Id,
    searchCurrency,
    searchGoodType,
    sortConfig,
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotification({
        open: true,
        message: 'Please login to access this page.',
        severity: 'error',
      });
      navigate('/react/login');
      return;
    }
    fetchData();
  }, [fetchData, navigate]);

  const handleAddSuccess = async (message) => {
    setPage(0);
    setNotification({
      open: true,
      message: message,
      severity: 'success',
      autoHideDuration: 6000,
    });
    await fetchData();
  };

  const handleEdit = (product) => {
    setProductToEdit(null);
    setProductToEdit({ ...product });
    setOpenEditDialog(true);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) {
      setNotification({
        open: true,
        message: 'No product selected for deletion',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/supplier-products/${productToDelete.id}`);
      let message = response.data.message || 'Product deleted successfully';
      setPage(0);
      await fetchData();
      setNotification({
        open: true,
        message: message,
        severity: 'success',
        autoHideDuration: 6000,
      });
    } catch (error) {
      console.error('Delete product error:', error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Failed to delete product: ${error.response?.data?.message || error.message}`,
        severity: 'error',
        autoHideDuration: 6000,
      });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setProductToDelete(null);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && !selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setNotification({
        open: true,
        message: 'Please select an .xlsx or .xls file',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setNotification({
        open: true,
        message: 'Please select a file to upload',
        severity: 'warning',
        autoHideDuration: 6000,
      });
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/supplier-products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      let message = response.data.message || 'File uploaded successfully';
      setPage(0);
      await fetchData();
      setNotification({
        open: true,
        message: message,
        severity: 'success',
        autoHideDuration: 6000,
      });
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      setNotification({
        open: true,
        message: `Error uploading file: ${err.response?.data?.message || err.message}`,
        severity: 'error',
        autoHideDuration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (file) {
      handleUpload();
    }
  }, [file]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
    setPage(0);
  };

  return (
    <Box sx={{ p: 1, fontSize: '0.65rem', backgroundColor: '#f5f8fa', minHeight: '100vh' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1rem' }}>
        Products
      </Typography>
      <Stack direction="row" spacing={1} mb={1} justifyContent="flex-end" alignItems="center">
        <Button
          variant="contained"
          startIcon={<FileUpload />}
          onClick={() => document.getElementById('file-input').click()}
          sx={{
            background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            color: '#fff',
            textTransform: 'none',
            px: 1.5,
            py: 0.3,
            borderRadius: '8px',
            fontSize: '0.65rem',
            '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
          }}
          disabled={loading}
        >
          Upload Excel
        </Button>
        <Input
          id="file-input"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          sx={{ display: 'none' }}
        />
        {file && (
          <Typography sx={{ fontSize: '0.65rem', color: '#555', mr: 1 }}>
            Uploading: {file.name}
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            color: '#fff',
            textTransform: 'none',
            px: 1.5,
            py: 0.3,
            borderRadius: '8px',
            fontSize: '0.65rem',
            '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
          }}
          disabled={loading}
        >
          Add Product
        </Button>
      </Stack>
      <SupplierSearch
        searchSupplierCode={searchSupplierCode}
        setSearchSupplierCode={setSearchSupplierCode}
        searchSupplierName={searchSupplierName}
        setSearchSupplierName={setSearchSupplierName}
        searchSapCode={searchSapCode}
        setSearchSapCode={setSearchSapCode}
        searchItemNo={searchItemNo}
        setSearchItemNo={setSearchItemNo}
        searchItemDescription={searchItemDescription}
        setSearchItemDescription={setSearchItemDescription}
        searchFullDescription={searchFullDescription}
        setSearchFullDescription={setSearchFullDescription}
        searchMaterialGroupFullDescription={searchMaterialGroupFullDescription}
        setSearchMaterialGroupFullDescription={setSearchMaterialGroupFullDescription}
        searchProductType1Id={searchProductType1Id}
        setSearchProductType1Id={setSearchProductType1Id}
        searchProductType2Id={searchProductType2Id}
        setSearchProductType2Id={setSearchProductType2Id}
        searchCurrency={searchCurrency}
        setSearchCurrency={setSearchCurrency}
        searchGoodType={searchGoodType}
        setSearchGoodType={setSearchGoodType}
        setPage={setPage}
        onSearch={fetchData}
        onReset={() => {
          setSearchSupplierCode('');
          setSearchSupplierName('');
          setSearchSapCode('');
          setSearchItemNo('');
          setSearchItemDescription('');
          setSearchFullDescription('');
          setSearchMaterialGroupFullDescription('');
          setSearchProductType1Id('');
          setSearchProductType2Id('');
          setSearchCurrency('');
          setSearchGoodType('');
          setSortConfig({ key: null, direction: null });
          setPage(0);
          fetchData();
        }}
      />
      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.7rem', mt: 1.5 }}>
          Loading data...
        </Typography>
      )}
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
        autoHideDuration={6000}
      />
      <SupplierProductsTable
        supplierProducts={data}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        page={page}
        rowsPerPage={rowsPerPage}
        sortConfig={sortConfig}
        handleSort={handleSort}
        onRefresh={fetchData}
        theme={theme}
      />
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalElements}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          mt: 1,
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontSize: '0.65rem',
            color: theme.palette.text.secondary,
          },
          '.MuiTablePagination-select': { fontSize: '0.65rem' },
          '.MuiTablePagination-actions > button': {
            color: theme.palette.primary.main,
          },
        }}
      />
      <AddProductDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onRefresh={fetchData}
        onSuccess={handleAddSuccess}
        disabled={loading}
      />
      {productToEdit && (
        <EditProductDialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setProductToEdit(null);
          }}
          product={productToEdit}
          onRefresh={fetchData}
          disabled={loading}
        />
      )}
      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle sx={{ fontSize: '0.8rem' }}>Delete Product</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.7rem' }}>
            Are you sure you want to delete &quot;{productToDelete?.itemNo || 'Unknown'}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary" sx={{ fontSize: '0.65rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{ fontSize: '0.65rem' }}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}