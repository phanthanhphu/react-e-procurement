import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  Input,
  Popover,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { API_BASE_URL } from '../../config';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import SupplierSearch from './SupplierSearch';
import Notification from './Notification';

const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Supplier Code', key: 'supplierCode', sortable: true },
  { label: 'Supplier Name', key: 'supplierName', sortable: true },
  { label: 'SAP Code', key: 'sapCode', sortable: true },
  { label: 'Item No', key: 'itemNo', sortable: true },
  { label: 'Item Description', key: 'itemDescription', sortable: true },
  { label: 'Full Description', key: 'fullDescription', sortable: true },
  { label: 'Size', key: 'size', sortable: true },
  { label: 'Material Group Full Description', key: 'materialGroupFullDescription', sortable: true },
  { label: 'Unit', key: 'unit', sortable: true },
  { label: 'Price', key: 'price', sortable: true },
  { label: 'Currency', key: 'currency', sortable: true },
  { label: 'Group Item 1', key: 'productType1Name', sortable: true },
  { label: 'Group Item 2', key: 'productType2Name', sortable: true },
  { label: 'Images', key: 'image', sortable: false },
  { label: 'Action', key: 'action', sortable: false },
];

function SupplierProductsTable({ supplierProducts, handleDelete, handleEdit, page, rowsPerPage, sortConfig, handleSort, onRefresh }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrcs, setPopoverImgSrcs] = useState([]);

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

  const handlePopoverEnter = () => {};
  const handlePopoverLeave = () => {
    handlePopoverClose();
  };

  const open = Boolean(anchorEl);

  if (!supplierProducts || supplierProducts.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.7rem', color: '#666' }}>No Data</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ height: 'calc(100vh - 320px)', overflowX: 'auto', boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)' }}>
      <Table size="small" sx={{ minWidth: 1400 }}>
        <TableHead>
          <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
            {headers.map(({ label, key, sortable }) => (
              <TableCell
                key={key}
                align={label === 'Action' || label === 'Images' ? 'center' : 'left'}
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
                  zIndex: 1,
                  backgroundColor: '#027aff',
                  ...(key === 'no' && { left: 0, zIndex: 2 }),
                  cursor: sortable ? 'pointer' : 'default',
                  '&:hover': sortable ? { backgroundColor: '#016ae3' } : {},
                }}
                onClick={() => sortable && handleSort(key)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: label === 'Action' || label === 'Images' ? 'center' : 'flex-start' }}>
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
                '&:hover': { backgroundColor: '#e3f2fd', transition: 'background-color 0.3s ease' },
                cursor: 'pointer',
              }}
            >
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4, position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                {idx + 1 + page * rowsPerPage}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.supplierCode || ''}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.supplierName || ''}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.sapCode || ''}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.itemNo || ''}</TableCell>
              <TableCell
                sx={{
                  fontSize: '0.55rem',
                  py: 0.2,
                  px: 0.4,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  width: '200px',
                }}
              >
                {product.itemDescription || ''}
              </TableCell>
              <TableCell
                sx={{
                  fontSize: '0.55rem',
                  py: 0.2,
                  px: 0.4,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  width: '200px',
                }}
              >
                {product.fullDescription || ''}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.size || ''}</TableCell>
              <TableCell
                sx={{
                  fontSize: '0.55rem',
                  py: 0.2,
                  px: 0.4,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  width: '200px',
                }}
              >
                {product.materialGroupFullDescription || ''}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.unit || ''}</TableCell>
              <TableCell align="left" sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>
                {product.price ? product.price.toLocaleString() : ''}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.currency || ''}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>
                {product.productType1Name || ''}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>
                {product.productType2Name || ''}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.2, px: 0.4 }}>
                {product.imageUrls && product.imageUrls.length > 0 ? (
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
                )}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.2, px: 0.4 }}>
                <Stack direction="row" spacing={0.5} justifyContent="center">
                  <IconButton size="small" color="primary" onClick={() => handleEdit(product)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(product)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
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
          onMouseEnter={handlePopoverEnter}
          onMouseLeave={handlePopoverLeave}
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
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    try {
      const params = {};
      if (searchSupplierCode) params.supplierCode = searchSupplierCode;
      if (searchSupplierName) params.supplierName = searchSupplierName;
      if (searchSapCode) params.sapCode = searchSapCode;
      if (searchItemNo) params.itemNo = searchItemNo;
      if (searchItemDescription) params.itemDescription = searchItemDescription;
      if (searchFullDescription) params.fullDescription = searchFullDescription;
      if (searchMaterialGroupFullDescription) params.materialGroupFullDescription = searchMaterialGroupFullDescription;
      if (searchProductType1Id) params.productType1Id = searchProductType1Id;
      if (searchProductType2Id) params.productType2Id = searchProductType2Id;
      params.page = page;
      params.size = rowsPerPage;
      params.sortBy = 'createdAt';
      params.sortDirection = 'DESC';
      const url = new URL(`${API_BASE_URL}/api/supplier-products/filter`);
      url.search = new URLSearchParams(params).toString();
      console.log('Request URL:', url.toString());
      const response = await fetch(url, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      console.log('API Response:', result);
      setData(result.data.content || []);
      setOriginalData(result.data.content || []);
      setTotalElements(result.data.totalElements || 0);
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to load data: ${err.message}`,
        severity: 'error',
      });
      console.error(err);
      setData([]);
      setOriginalData([]);
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
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = async (message) => {
    setPage(0); // Đặt lại trang về 0 để hiển thị dữ liệu mới
    setNotification({
      open: true,
      message: message,
      severity: 'success',
      autoHideDuration: 6000,
    });
    await fetchData(); // Gọi lại fetchData để làm mới dữ liệu
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
      const response = await fetch(`${API_BASE_URL}/api/supplier-products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
      });
      let message;
      if (!response.ok) {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          message = errorData.message || text || `Failed to delete product: ${response.status}`;
        } catch (parseError) {
          message = text || `Failed to delete product: ${response.status}`;
        }
        throw new Error(message);
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        message = data.message || text || 'Product deleted successfully';
      } catch (parseError) {
        message = text || 'Product deleted successfully';
      }
      setPage(0); // Đặt lại trang về 0
      await fetchData(); // Làm mới dữ liệu
      setNotification({
        open: true,
        message: message,
        severity: 'success',
        autoHideDuration: 6000,
      });
    } catch (error) {
      console.error('Delete product error:', error);
      setNotification({
        open: true,
        message: error.message,
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
      const response = await fetch(`${API_BASE_URL}/api/supplier-products/import`, {
        method: 'POST',
        body: formData,
      });
      let message;
      if (!response.ok) {
        const text = await response.text();
        if (response.status === 400) {
          message = text.includes('Invalid price format')
            ? 'Invalid price format in the file'
            : text.includes('Duplicate entry')
            ? 'Duplicate data in the file'
            : text || `Upload failed with status: ${response.status}`;
        } else if (response.status === 409) {
          message = text || 'Duplicate data in the file';
        } else {
          message = text || `Upload failed with status: ${response.status}`;
        }
        try {
          const errorData = JSON.parse(text);
          message = errorData.message || message;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(message);
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        message = data.message || text || 'File uploaded successfully';
      } catch (parseError) {
        message = text || 'File uploaded successfully';
      }
      setPage(0); // Đặt lại trang về 0
      await fetchData(); // Làm mới dữ liệu
      setNotification({
        open: true,
        message: message,
        severity: 'success',
        autoHideDuration: 6000,
      });
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setNotification({
        open: true,
        message: `Error uploading file: ${err.message}`,
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

    if (!direction) {
      setData([...originalData]);
      return;
    }

    const sortedData = [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (key === 'price') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setData(sortedData);
  };

  return (
    <Box sx={{ p: 1, fontSize: '0.65rem', backgroundColor: '#f5f8fa', minHeight: '100vh' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1rem' }}>
        Products
      </Typography>
      <Stack direction="row" spacing={1} mb={1} justifyContent="flex-end" alignItems="center">
        <Button
          variant="contained"
          startIcon={<FileUploadIcon />}
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
          startIcon={<AddIcon />}
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