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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, ArrowUpward, ArrowDownward, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import ProductType2Search from './ProductType2Search';
import { API_BASE_URL } from '../../config';

const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Created Date', key: 'createdDate', sortable: true },
  { label: 'Action', key: 'action', sortable: false },
];

function ProductType2Table({ productTypes, handleDelete, handleEdit, page, rowsPerPage, sortConfig, handleSort }) {
  if (!productTypes || productTypes.length === 0) {
    return (
      <TableContainer component={Paper} sx={{ height: 'calc(100vh - 320px)', overflowX: 'auto', boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)' }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
              {headers.map(({ label, key, sortable }) => (
                <TableCell
                  key={key}
                  align={label === 'Action' ? 'center' : 'left'}
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    py: 0.3,
                    px: 0.5,
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: label === 'Action' ? 'center' : 'flex-start' }}>
                    <span>{label}</span>
                    {sortable && (
                      <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                        {sortConfig.key === key && sortConfig.direction === 'asc' ? (
                          <ArrowUpward sx={{ fontSize: '1rem', color: '#fff' }} />
                        ) : sortConfig.key === key && sortConfig.direction === 'desc' ? (
                          <ArrowDownward sx={{ fontSize: '1rem', color: '#fff' }} />
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <ArrowUpward sx={{ fontSize: '0.8rem', color: '#ccc' }} />
                            <ArrowDownward sx={{ fontSize: '0.8rem', color: '#ccc' }} />
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
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
                  <Typography sx={{ fontStyle: 'italic', fontSize: '1rem', mt: 1 }}>No Data Available</Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Hàm chuyển đổi mảng createdDate sang định dạng DD/MM/YYYY
  const formatCreatedDate = (createdDateArray) => {
    if (!createdDateArray || createdDateArray.length < 3) return '';
    const [year, month, day] = createdDateArray;
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');
    const formattedYear = year;
    return `${formattedDay}/${formattedMonth}/${formattedYear}`;
  };

  return (
    <TableContainer component={Paper} sx={{ height: 'calc(100vh - 320px)', overflowX: 'auto', boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)' }}>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
            {headers.map(({ label, key, sortable }) => (
              <TableCell
                key={key}
                align={label === 'Action' ? 'center' : 'left'}
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  py: 0.3,
                  px: 0.5,
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: label === 'Action' ? 'center' : 'flex-start' }}>
                  <span>{label}</span>
                  {sortable && (
                    <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                      {sortConfig.key === key && sortConfig.direction === 'asc' ? (
                        <ArrowUpward sx={{ fontSize: '1rem', color: '#fff' }} />
                      ) : sortConfig.key === key && sortConfig.direction === 'desc' ? (
                        <ArrowDownward sx={{ fontSize: '1rem', color: '#fff' }} />
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <ArrowUpward sx={{ fontSize: '0.8rem', color: '#ccc' }} />
                          <ArrowDownward sx={{ fontSize: '0.8rem', color: '#ccc' }} />
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
          {productTypes.map((productType, idx) => (
            <TableRow
              key={productType.id}
              sx={{
                backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff',
                '&:hover': { backgroundColor: '#e3f2fd', transition: 'background-color 0.3s ease' },
                cursor: 'pointer',
              }}
            >
              <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5, position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                {idx + 1 + page * rowsPerPage}
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5 }}>{productType.name || ''}</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5 }}>
                {formatCreatedDate(productType.createdDate)}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.3, px: 0.5 }}>
                <Stack direction="row" spacing={0.2} justifyContent="center">
                  <IconButton
                    aria-label="edit"
                    color="success"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(56, 142, 60, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(56, 142, 60, 0.25)' },
                      borderRadius: 1,
                      p: 0.2,
                    }}
                    onClick={() => handleEdit(productType)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.25)' },
                      borderRadius: 1,
                      p: 0.2,
                    }}
                    onClick={() => handleDelete(productType)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function ProductType2Page() {
  const theme = useTheme();
  const { productType1Id } = useParams();
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
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState(null);
  const [productTypeToEdit, setProductTypeToEdit] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [newProductTypeName, setNewProductTypeName] = useState('');
  const [editProductTypeName, setEditProductTypeName] = useState('');
  const [type2NameValue, setType2NameValue] = useState('');

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    try {
      const url = new URL(`${API_BASE_URL}/api/product-type-2`);
      url.search = new URLSearchParams({ productType1Id, page, size: rowsPerPage }).toString();
      const response = await fetch(url, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result.content || []);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to load data: ${err.message}`,
        severity: 'error',
      });
      setData([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [productType1Id, page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!newProductTypeName.trim()) {
      setNotification({
        open: true,
        message: 'Please enter a product type name',
        severity: 'warning',
      });
      return;
    }
    try {
      setLoading(true);
      const url = new URL(`${API_BASE_URL}/api/product-type-2`);
      url.search = new URLSearchParams({ productType1Id, name: newProductTypeName }).toString();
      const response = await fetch(url, {
        method: 'POST',
        headers: { accept: '*/*' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setPage(0);
      await fetchData();
      setNotification({
        open: true,
        message: `Name '${result.name}' has been added`,
        severity: 'success',
        autoHideDuration: 6000,
      });
      setNewProductTypeName('');
      setOpenAddDialog(false);
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to add product type: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productType) => {
    setProductTypeToEdit(productType);
    setEditProductTypeName(productType.name);
    setOpenEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editProductTypeName.trim()) {
      setNotification({
        open: true,
        message: 'Please enter a product type name',
        severity: 'warning',
      });
      return;
    }
    try {
      setLoading(true);
      const url = new URL(`${API_BASE_URL}/api/product-type-2/${productTypeToEdit.id}`);
      url.search = new URLSearchParams({ name: editProductTypeName }).toString();
      const response = await fetch(url, {
        method: 'PUT',
        headers: { accept: '*/*' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setPage(0);
      await fetchData();
      setNotification({
        open: true,
        message: `Name '${editProductTypeName}' has been updated`,
        severity: 'success',
        autoHideDuration: 6000,
      });
      setOpenEditDialog(false);
      setProductTypeToEdit(null);
      setEditProductTypeName('');
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to update product type: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (productType) => {
    setProductTypeToDelete(productType);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!productTypeToDelete) {
      setNotification({
        open: true,
        message: 'No product type selected for deletion',
        severity: 'error',
      });
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/product-type-2/${productTypeToDelete.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setPage(0);
      await fetchData();
      setNotification({
        open: true,
        message: `Name '${productTypeToDelete.name}' has been deleted`,
        severity: 'success',
        autoHideDuration: 6000,
      });
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to delete product type: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setProductTypeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setProductTypeToDelete(null);
  };

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
      fetchData();
      return;
    }

    const sortedData = [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (key === 'createdDate') {
        if (aValue.length < 3 || bValue.length < 3) return 0;
        const [aYear, aMonth, aDay] = aValue;
        const [bYear, bMonth, bDay] = bValue;
        const aDate = new Date(aYear, aMonth - 1, aDay);
        const bDate = new Date(bYear, bMonth - 1, bDay);
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      return direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setData(sortedData);
  };

  const handleType2NameChange = (value) => {
    setType2NameValue(value);
  };

  const handleSearch = (params) => {
    setPage(0);
    setLoading(true);
    const url = new URL(`${API_BASE_URL}/api/product-type-2/search`);
    url.search = new URLSearchParams({
      productType1Id,
      page: 0,
      size: rowsPerPage,
      name: params.name || '',
    }).toString();
    fetch(url, {
      method: 'GET',
      headers: { accept: '*/*' },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((result) => {
        setData(result.content || []);
        setTotalElements(result.totalElements || 0);
      })
      .catch((err) => {
        setNotification({
          open: true,
          message: `Failed to load data: ${err.message}`,
          severity: 'error',
        });
        setData([]);
        setTotalElements(0);
      })
      .finally(() => setLoading(false));
  };

  const handleReset = () => {
    setType2NameValue('');
    setPage(0);
    fetchData();
  };

  return (
    <Box sx={{ p: 1, fontSize: '0.85rem', backgroundColor: '#f5f8fa', minHeight: '100vh' }}>
      <IconButton
        onClick={() => navigate('/dashboard/product-type-management')}
        sx={{
          mb: 1.5,
          background: 'linear-gradient(to right, #4cb8ff, #027aff)',
          color: '#fff',
          '&:hover': {
            background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          p: 0.5,
          borderRadius: '50%',
          width: 40,
          height: 40,
          transition: 'all 0.3s ease',
        }}
        disabled={loading}
        aria-label="Back to Product Type 1"
        title="Back to Product Type 1"
      >
        <ArrowBack />
      </IconButton>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.25rem' }}>
        Product Type 2
      </Typography>
      <Stack direction="row" spacing={1} mb={1} justifyContent="space-between" alignItems="center">
        <ProductType2Search
          type2NameValue={type2NameValue}
          onType2NameChange={handleType2NameChange}
          onSearch={handleSearch}
          onReset={handleReset}
        />
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
            fontSize: '0.85rem',
            '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
          }}
          disabled={loading}
        >
          Add Product Type 2
        </Button>
      </Stack>
      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.9rem', mt: 1.5 }}>
          Loading data...
        </Typography>
      )}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration || 6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Position at top center
        sx={{
          '& .MuiSnackbarContent-root': {
            width: { xs: '90%', sm: '400px' }, // Responsive width
            maxWidth: '500px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            zIndex: 1500, // Ensure Snackbar is above other content
          },
        }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%', fontSize: '0.9rem' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      <ProductType2Table
        productTypes={data}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        page={page}
        rowsPerPage={rowsPerPage}
        sortConfig={sortConfig}
        handleSort={handleSort}
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
            fontSize: '0.85rem',
            color: theme.palette.text.secondary,
          },
          '.MuiTablePagination-select': { fontSize: '0.85rem' },
          '.MuiTablePagination-actions > button': {
            color: theme.palette.primary.main,
          },
        }}
      />
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Add Product Type 2</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product Type Name"
            fullWidth
            value={newProductTypeName}
            onChange={(e) => setNewProductTypeName(e.target.value)}
            sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} sx={{ fontSize: '0.85rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            sx={{
              fontSize: '0.85rem',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
            }}
            disabled={loading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Edit Product Type 2</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product Type Name"
            fullWidth
            value={editProductTypeName}
            onChange={(e) => setEditProductTypeName(e.target.value)}
            sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ fontSize: '0.85rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            sx={{
              fontSize: '0.85rem',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
            }}
            disabled={loading}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Delete Product Type</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to delete &quot;{productTypeToDelete?.name || 'Unknown'}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} sx={{ fontSize: '0.85rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{ fontSize: '0.85rem' }}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}