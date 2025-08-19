import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  IconButton,
  TablePagination,
  useTheme,
  Button,
  Input,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { API_BASE_URL } from '../../config';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import SupplierSearch from './SupplierSearch';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Supplier Code', key: 'supplierCode' },
  { label: 'Supplier Name', key: 'supplierName' },
  { label: 'SAP Code', key: 'sapCode' },
  { label: 'Item Description', key: 'productFullName' },
  { label: 'Short Item Description', key: 'productShortName' },
  { label: 'Size', key: 'size' },
  { label: 'Price', key: 'price' },
  { label: 'Unit', key: 'unit' },
  { label: 'Action', key: 'action' },
];

function SupplierProductsTable({ supplierProducts, handleDelete, handleEdit }) {
  if (!supplierProducts || supplierProducts.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>No Data</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ height: 'calc(100vh - 320px)', overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 180, border: '1px solid #ccc', borderRadius: 1 }}>
        <TableHead>
          <TableRow
            sx={{
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            }}
          >
            {headers.map(({ label, key }) => (
              <TableCell
                key={key}
                align={label === 'Action' ? 'center' : 'left'}
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  py: 1, // Tăng padding cho các ô header
                  px: 1,
                  whiteSpace: 'nowrap',
                  borderRight: '1px solid rgba(255,255,255,0.15)',
                  '&:last-child': {
                    borderRight: 'none',
                  },
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  backgroundColor: '#027aff',
                }}
              >
                {label}
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
                  transition: 'background-color 0.3s ease',
                },
                cursor: 'pointer',
              }}
            >
              <TableCell align="center" sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>
                {idx + 1}
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>{product.supplierCode}</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>{product.supplierName}</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>{product.sapCode}</TableCell>
              <TableCell
                sx={{
                  fontSize: '0.75rem',
                  py: 1,
                  px: 1,
                  whiteSpace: 'normal',  // Cho phép văn bản xuống dòng
                  wordBreak: 'break-word',  // Cắt từ dài nếu cần
                  width: '300px',  // Cố định chiều rộng cho cột dài
                }}
              >
                {product.productFullName}
              </TableCell>
              <TableCell
                sx={{
                  fontSize: '0.75rem',
                  py: 1,
                  px: 1,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  width: '300px',  // Cố định chiều rộng cho cột dài
                }}
              >
                {product.productShortName}
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>{product.size}</TableCell>
              <TableCell align="left" sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>
                {product.price ? product.price.toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>{product.unit}</TableCell>
              <TableCell align="center" sx={{ py: 1, px: 1 }}>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <IconButton size="small" color="primary" onClick={() => handleEdit(product)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(product.id)}>
                    <DeleteIcon fontSize="small" />
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

export default function SupplierProductsPage() {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Search states
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  const [searchSapCode, setSearchSapCode] = useState('');
  const [searchProductFullName, setSearchProductFullName] = useState('');
  const [searchProductShortName, setSearchProductShortName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-products`, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-products/${id}`, {
        method: 'DELETE',
        headers: { Accept: '*/*' },
      });
      if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
      await fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload.');
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

      if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
      alert('File uploaded successfully');
      fetchData();
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
      alert('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter data dựa trên từ khóa tìm kiếm
  const filteredData = data.filter((item) => {
    return (
      item.supplierCode?.toLowerCase().includes(searchSupplierCode.toLowerCase()) &&
      item.supplierName?.toLowerCase().includes(searchSupplierName.toLowerCase()) &&
      item.sapCode?.toLowerCase().includes(searchSapCode.toLowerCase()) &&
      item.productFullName?.toLowerCase().includes(searchProductFullName.toLowerCase()) &&
      item.productShortName?.toLowerCase().includes(searchProductShortName.toLowerCase())
    );
  });

  const displayData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setOpenEditDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Supplier Products
      </Typography>

      <Stack direction="row" spacing={2} mb={2} justifyContent="flex-end" alignItems="center">
        <Button
          variant="contained"
          startIcon={<FileUploadIcon />}
          onClick={() => document.getElementById('file-input').click()}
          sx={{
            background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            color: '#fff',
            textTransform: 'none',
            px: 3,
            borderRadius: '20px',
            '&:hover': {
              background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
            },
          }}
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            color: '#fff',
            textTransform: 'none',
            px: 3,
            borderRadius: '20px',
            '&:hover': {
              background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
            },
          }}
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
        searchProductFullName={searchProductFullName}
        setSearchProductFullName={setSearchProductFullName}
        searchProductShortName={searchProductShortName}
        setSearchProductShortName={setSearchProductShortName}
        setPage={setPage}
      />

      <SupplierProductsTable
        supplierProducts={displayData}
        handleDelete={handleDelete}
        handleEdit={handleEditProduct}
      />

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ mt: 1 }}
      />

      <AddProductDialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} onRefresh={fetchData} />

      {productToEdit && (
        <EditProductDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          product={productToEdit}
          onRefresh={fetchData}
        />
      )}
    </Box>
  );
}
