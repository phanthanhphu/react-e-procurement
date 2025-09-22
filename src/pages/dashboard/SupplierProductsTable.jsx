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
  Popover,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import { API_BASE_URL } from '../../config';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import SupplierSearch from './SupplierSearch';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Supplier Code', key: 'supplierCode' },
  { label: 'Supplier Name', key: 'supplierName' },
  { label: 'SAP Code', key: 'sapCode' },
  { label: 'Item No', key: 'itemNo' },
  { label: 'Item Description', key: 'itemDescription' },
  { label: 'Full Description', key: 'fullDescription' },
  { label: 'Size', key: 'size' },
  { label: 'Material Group Full Description', key: 'materialGroupFullDescription' },
  { label: 'Unit', key: 'unit' },
  { label: 'Price', key: 'price' },
  { label: 'Currency', key: 'currency' },
  { label: 'Group Item 1', key: 'groupItem1Name' },
  { label: 'Group Item 2', key: 'groupItem2Name' },
  { label: 'Images', key: 'image' },
  { label: 'Action', key: 'action' },
];

function SupplierProductsTable({ supplierProducts, handleDelete, handleEdit, page, rowsPerPage }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrcs, setPopoverImgSrcs] = useState([]);

  const handlePopoverOpen = (event, imageUrls) => {
    setAnchorEl(event.currentTarget);
    const fullSrcs = imageUrls.map((imgSrc) =>
      imgSrc.startsWith('http') ? imgSrc : `${API_BASE_URL}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`
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
            {headers.map(({ label, key }) => (
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
                  ...(key === 'no' && { left: 0, zIndex: 2 }), // Cố định cột "No" với left: 0
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
                '&:hover': { backgroundColor: '#e3f2fd', transition: 'background-color 0.3s ease' },
                cursor: 'pointer',
              }}
            >
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4, position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                {idx + 1 + page * rowsPerPage}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.supplierCode}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.supplierName}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.sapCode}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.itemNo || 'N/A'}</TableCell>
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
                {product.itemDescription || 'N/A'}
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
                {product.fullDescription || 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.size}</TableCell>
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
                {product.materialGroupFullDescription || 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.unit}</TableCell>
              <TableCell align="left" sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>
                {product.price ? product.price.toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>{product.currency || 'N/A'}</TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>
                {product.productType1Name || 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.55rem', py: 0.2, px: 0.4 }}>
                {product.productType2Name || 'N/A'}
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
                  <IconButton size="small" color="error" onClick={() => handleDelete(product.id)}>
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
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('State values:', {
      searchSupplierCode,
      searchSupplierName,
      searchSapCode,
      searchItemNo,
      searchItemDescription,
      searchFullDescription,
      searchMaterialGroupFullDescription,
      searchProductType1Id,
      searchProductType2Id,
    });
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
      console.log('API Call Params:', params);
      const url = new URL(`${API_BASE_URL}/api/supplier-products/filter`);
      url.search = new URLSearchParams(params).toString();
      console.log('Request URL:', url.toString());
      const response = await fetch(url, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(result.content);
      setTotalElements(result.totalElements);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
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
  ]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array to run only on mount

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
    formData.append('files', file);
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchData();
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    fetchData();
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setOpenEditDialog(true);
  };

  return (
    <Box sx={{ p: 1, fontSize: '0.65rem', backgroundColor: '#f5f8fa', minHeight: '100vh' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1rem' }}>
        Supplier Products
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
            px: 1.5,
            py: 0.3,
            borderRadius: '8px',
            fontSize: '0.65rem',
            '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
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
          setPage(0);
          fetchData();
        }}
      />
      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.7rem', mt: 1.5 }}>
          Loading data...
        </Typography>
      )}
      {error && (
        <Typography
          align="center"
          sx={{ color: theme.palette.error.main, fontWeight: 700, fontSize: '0.7rem', mt: 1.5 }}
        >
          {error}
        </Typography>
      )}
      <SupplierProductsTable
        supplierProducts={data}
        handleDelete={handleDelete}
        handleEdit={handleEditProduct}
        page={page}
        rowsPerPage={rowsPerPage}
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