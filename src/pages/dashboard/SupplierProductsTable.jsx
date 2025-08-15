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
import AddProductDialog from './AddProductDialog'; // Import component mới
import EditProductDialog from './EditProductDialog'; // Import Edit dialog

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Supplier Code', key: 'supplierCode' }, // Mã nhà cung cấp
  { label: 'Supplier Name', key: 'supplierName' }, // Tên nhà cung cấp
  { label: 'SAP Code', key: 'sapCode' }, // SAP code
  { label: 'Product Full Name', key: 'productFullName' }, // Tên dài sản phẩm
  { label: 'Product Short Name', key: 'productShortName' }, // Tên ngắn sản phẩm
  { label: 'Size', key: 'size' }, // Kích thước
  { label: 'Price', key: 'price' }, // Đơn giá
  { label: 'Unit', key: 'unit' }, // Đơn vị tính sản phẩm
  { label: 'Action', key: 'action' }, // Cột Action
];

function SupplierProductsTable({ supplierProducts, handleDelete, handleEdit }) {
  if (!supplierProducts || supplierProducts.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>No Data</Typography>;
  }
  return (
    <TableContainer component={Paper} sx={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>  {/* Chiều cao bảng chiếm toàn bộ phần còn lại của màn hình */}
      <Table size="small" sx={{ minWidth: 180, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
        <TableHead>
          <TableRow>
            {headers.map(({ label, key }) => (
              <TableCell
                key={key}
                align={label === 'Actions' ? 'center' : 'left'}
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.72rem',
                  backgroundColor: '#4680FF', // Màu nền xanh
                  color: 'white', // Màu chữ trắng
                  py: 0.5,
                  px: 1,
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
                backgroundColor: idx % 2 === 0 ? '#fafafa' : '#f4f7fb',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                  transition: 'background-color 0.3s ease',
                },
                cursor: 'pointer',
              }}
            >
              <TableCell align="center" sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>
                {idx + 1}
              </TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{product.supplierCode}</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{product.supplierName}</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{product.sapCode}</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{product.productFullName}</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{product.productShortName}</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{product.size}</TableCell>
              <TableCell align="left" sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>
                {product.price ? product.price.toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{product.unit}</TableCell>
              <TableCell align="center" sx={{ py: 0.3, px: 1 }}>
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
  const [file, setFile] = useState(null);  // Trạng thái để lưu trữ file Excel
  const [openAddDialog, setOpenAddDialog] = useState(false); // Trạng thái mở Dialog Add
  const [openEditDialog, setOpenEditDialog] = useState(false); // Trạng thái mở Dialog Edit
  const [productToEdit, setProductToEdit] = useState(null); // Trạng thái để chứa sản phẩm cần chỉnh sửa

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-products`, {
        method: 'GET',
        headers: { 'accept': '*/*' },
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

  // Hàm xử lý file khi chọn
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Hàm upload file
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
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
      alert("File uploaded successfully");
      fetchData();  // Fetch the updated data after the upload
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
      alert("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Hàm để chỉnh sửa sản phẩm
  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setOpenEditDialog(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Supplier Products
      </Typography>

      <Stack direction="row" spacing={2} mb={2} justifyContent="flex-end" alignItems="center">
        <Button
          variant="contained"
          startIcon={<FileUploadIcon />}
          onClick={() => document.getElementById('file-input').click()}
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
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Product
        </Button>
      </Stack>

      <SupplierProductsTable
        supplierProducts={displayData}
        handleDelete={handleDelete}
        handleEdit={handleEditProduct}
      />

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Add Product Dialog */}
      <AddProductDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onRefresh={fetchData}
      />

      {/* Edit Product Dialog */}
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
