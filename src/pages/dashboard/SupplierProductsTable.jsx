// src/pages/supplier/SupplierProductsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Stack, IconButton, TablePagination,
  useTheme, useMediaQuery, Button, Input, Popover, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Delete, FileUpload, Add, Edit, Image as ImageIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import axios from 'axios';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import SupplierSearch from './SupplierSearch';
import Notification from './Notification';
import { API_BASE_URL } from '../../config';

// === Axios Config ===
const PUBLIC_ENDPOINTS = [
  '/api/product-type-1/search', '/api/product-type-2/search', '/api/group-summary-requisitions/',
  '/api/departments/filter', '/api/supplier-products/filter', '/api/auth/login',
  '/users/login', '/api/users/add', '/users/add',
];

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: '*/*', 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  const isPublic = PUBLIC_ENDPOINTS.some(e => cfg.url.includes(e));
  if (token && !isPublic) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
}, err => Promise.reject(err));

axiosInstance.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/react/login';
  }
  return Promise.reject(err);
});

// === Color Helpers ===
const getCurrencyColor = c => ({ VND: '#4caf50', EURO: '#2196f3', USD: '#e57373' }[c] || '#9e9e9e');
const getGoodTypeColor = t => ({ Common: '#4caf50', Special: '#2196f3', Electronics: '#e57373' }[t] || '#9e9e9e');

// === HEADERS + STICKY ===
const baseHeaders = [
  { label: 'No', key: 'no', align: 'center', width: 50, sticky: true },
  { label: 'Product Item 1', key: 'productType1Name', sortable: true, width: 120, sticky: true, wrap: true },
  { label: 'Product Item 2', key: 'productType2Name', sortable: true, width: 120, sticky: true, wrap: true },
  { label: 'Supplier Code', key: 'supplierCode', sortable: true, width: 110, sticky: true, wrap: true },
  { label: 'Supplier Description', key: 'supplierName', sortable: true, width: 150, sticky: true, wrap: true },
  { label: 'SAP Code', key: 'sapCode', sortable: true, width: 100, sticky: true },
  { label: 'Item No', key: 'itemNo', sortable: true, width: 90 },
  { label: 'Item Description', key: 'itemDescription', sortable: true, width: 180, wrap: true },
  { label: 'Full Description', key: 'fullDescription', sortable: true, width: 200, wrap: true },
  { label: 'Size', key: 'size', sortable: true, width: 70 },
  { label: 'Unit', key: 'unit', sortable: true, width: 60 },
  { label: 'Price', key: 'price', sortable: true, align: 'center', width: 90 },
  { label: 'Currency', key: 'currency', sortable: true, align: 'center', width: 70 },
  { label: 'Good Type', key: 'goodType', sortable: true, align: 'center', width: 90 },
  { label: 'Images', key: 'image', align: 'center', width: 70 },
  { label: 'Action', key: 'action', align: 'center', width: 100 },
];

let stickyOffset = 0;
const headers = baseHeaders.map(h => {
  const header = { ...h };
  if (header.sticky) {
    header.left = stickyOffset;
    stickyOffset += header.width;
  }
  return header;
});

const gridTemplate = headers.map(h => `${h.width}px`).join(' ');

// === SUB TABLE COMPONENT ===
function SupplierProductsTable({ supplierProducts, handleDelete, handleEdit, page, rowsPerPage, sortConfig, handleSort, theme }) {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [popover, setPopover] = useState({ anchor: null, images: [] });

  const openPopover = (e, urls) => {
    const full = urls.map(src =>
      src.startsWith('http') ? `${src}?t=${Date.now()}` :
      `${API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}?t=${Date.now()}`
    );
    setPopover({ anchor: e.currentTarget, images: full });
  };

  const closePopover = () => setPopover({ anchor: null, images: [] });

  if (!supplierProducts.length) {
    return <Typography sx={{ fontSize: '0.55rem', color: '#666', fontStyle: 'italic', py: 2, fontWeight: 600, textAlign: 'center' }}>No Data</Typography>;
  }

  return (
    <>
      <Box sx={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto', border: '1px solid #ddd', borderRadius: 0 }}>
        {/* HEADER */}
        <Box display="grid" gridTemplateColumns={gridTemplate} bgcolor="#027aff" position="sticky" top={0} zIndex={22}>
          {headers.map(h => (
            <Box
              key={h.key}
              sx={{
                p: '4px 6px',
                fontWeight: 700,
                fontSize: '0.55rem',
                color: '#fff',
                fontFamily: '"Inter var", sans-serif',
                textAlign: h.align || 'left',
                whiteSpace: h.wrap ? 'normal' : 'nowrap',
                wordBreak: h.wrap ? 'break-word' : 'normal',
                position: h.sticky ? 'sticky' : 'relative',
                left: h.sticky ? h.left : 'auto',
                backgroundColor: '#027aff',
                zIndex: h.sticky ? 21 : 20,
                cursor: h.sortable ? 'pointer' : 'default',
                '&:hover': h.sortable ? { bgcolor: '#016ae3' } : {},
                lineHeight: 1.4,
                borderRight: '1px solid rgba(255,255,255,0.15)',
                '&:last-child': { borderRight: 'none' },
              }}
              onClick={() => h.sortable && handleSort(h.key)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: h.align === 'center' ? 'center' : 'flex-start' }}>
                <Tooltip title={h.label} arrow><span>{h.label}</span></Tooltip>
                {h.sortable && (
                  <Box sx={{ ml: 0.3 }}>
                    {sortConfig.key === h.key ? (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpward sx={{ fontSize: '0.7rem', color: '#fff' }} /> : 
                        <ArrowDownward sx={{ fontSize: '0.7rem', color: '#fff' }} />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <ArrowUpward sx={{ fontSize: '0.55rem', color: '#ccc' }} />
                        <ArrowDownward sx={{ fontSize: '0.55rem', color: '#ccc' }} />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* BODY */}
        <Box>
          {supplierProducts.map((p, i) => {
            const idx = page * rowsPerPage + i + 1;
            const rowBg = i % 2 === 0 ? '#fff' : '#f7f9fc';

            return (
              <Box
                key={p.id}
                display="grid"
                gridTemplateColumns={gridTemplate}
                bgcolor={rowBg}
                sx={{
                  '&:hover': { bgcolor: '#e3f2fd', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s ease' },
                  borderBottom: '1px solid #fafbfb',
                }}
              >
                {headers.map(h => {
                  const isSticky = !isMobile && h.sticky;
                  return (
                    <Box
                      key={h.key}
                      sx={{
                        p: '3px 6px',
                        fontSize: '0.55rem',
                        fontWeight: 400,
                        fontFamily: '"Inter var", sans-serif',
                        lineHeight: 1.4,
                        textAlign: h.align || 'left',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        position: isSticky ? 'sticky' : 'relative',
                        left: isSticky ? h.left : 'auto',
                        backgroundColor: rowBg,
                        zIndex: isSticky ? 1 : 'auto',
                        color: '#1D2630',
                      }}
                    >
                      {h.key === 'no' && <Box fontWeight={700} textAlign="center">{idx}</Box>}
                      {h.key === 'productType1Name' && (p.productType1Name || '-')}
                      {h.key === 'productType2Name' && (p.productType2Name || '-')}
                      {h.key === 'supplierCode' && (p.supplierCode || '-')}
                      {h.key === 'supplierName' && (p.supplierName || '-')}
                      {h.key === 'sapCode' && (p.sapCode || '-')}
                      {h.key === 'itemNo' && (p.itemNo || '-')}
                      {h.key === 'itemDescription' && (p.itemDescription || '-')}
                      {h.key === 'fullDescription' && (p.fullDescription || '-')}
                      {h.key === 'size' && (p.size || '-')}
                      {h.key === 'unit' && (p.unit || '-')}
                      {h.key === 'price' && <Box textAlign="center">{p.price ? Number(p.price).toLocaleString() : '-'}</Box>}
                      {h.key === 'currency' && (
                        <Box sx={{ ...tagSx, bgcolor: getCurrencyColor(p.currency) }}>
                          {p.currency || 'N/A'}
                        </Box>
                      )}
                      {h.key === 'goodType' && (
                        <Box sx={{ ...tagSx, bgcolor: getGoodTypeColor(p.goodType) }}>
                          {p.goodType || 'N/A'}
                        </Box>
                      )}
                      {h.key === 'image' && (
                        p.imageUrls?.length ? (
                          <IconButton size="small" onMouseEnter={(e) => openPopover(e, p.imageUrls)} onMouseLeave={closePopover} sx={{ p: 0.1 }}>
                            <ImageIcon sx={{ fontSize: '0.75rem' }} />
                          </IconButton>
                        ) : (
                          <Typography fontSize="0.55rem" color="#999" textAlign="center">—</Typography>
                        )
                      )}
                      {h.key === 'action' && (
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          <IconButton size="small" color="primary" onClick={() => handleEdit(p)} sx={{ p: 0.25 }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(p)} sx={{ p: 0.25 }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Popover
        open={!!popover.anchor}
        anchorEl={popover.anchor}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ pointerEvents: 'none' }}
      >
        <Box p={1} maxWidth={220} maxHeight={220} sx={{ overflow: 'auto' }}>
          {popover.images.map((src, i) => (
            <Box key={i} textAlign="center" mb={1}>
              <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 4, objectFit: 'contain' }} />
              <Typography fontSize="0.55rem" color="#555">Image {i + 1}</Typography>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}

const tagSx = { 
  padding: '1px 4px', 
  borderRadius: '3px', 
  fontSize: '0.5rem', 
  fontWeight: 600, 
  color: '#fff', 
  display: 'inline-flex', 
  justifyContent: 'center', 
  minWidth: 44, 
  mx: 'auto' 
};

// === MAIN PAGE ===
export default function SupplierProductsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [file, setFile] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const [search, setSearch] = useState({
    supplierCode: '', supplierName: '', sapCode: '', itemNo: '', itemDescription: '',
    fullDescription: '', materialGroupFullDescription: '', productType1Id: '',
    productType2Id: '', currency: '', goodType: ''
  });

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // === FETCH DATA ===
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: rowsPerPage };
      if (sortConfig.key) {
        const header = headers.find(h => h.key === sortConfig.key);
        params.sort = `${header?.backendKey || sortConfig.key},${sortConfig.direction}`;
      } else {
        params.sort = 'createdAt,desc';
      }

      // === ĐÃ FIX: Thêm tất cả search fields ===
      Object.entries(search).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params[key] = value;
        }
      });

      console.log('API PARAMS:', params); // DEBUG

      const res = await axiosInstance.get('/api/supplier-products/filter', { params });
      setData(res.data.data.content || []);
      setTotal(res.data.data.totalElements || 0);
    } catch (err) {
      setNotification({ open: true, message: `Load failed: ${err.response?.data?.message || err.message}`, severity: 'error' });
      setData([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortConfig, search]); // ĐÃ CÓ search

  // === ĐÃ FIX: useEffect theo dõi search, page, sortConfig ===
  useEffect(() => { 
    const token = localStorage.getItem('token');
    if (!token) { 
      navigate('/react/login'); 
      return; 
    }
    fetchData();
  }, [fetchData, navigate]); // fetchData đã bao gồm search, page, sortConfig

  const handleSort = k => {
    setSortConfig(s => ({
      key: k,
      direction: s.key === k && s.direction === 'asc' ? 'desc' : s.key === k && s.direction === 'desc' ? null : 'asc'
    }));
    setPage(0);
  };

  const handleSearch = () => { 
    setPage(0); 
    fetchData(); 
  };

  const handleReset = () => {
    setSearch({
      supplierCode: '', supplierName: '', sapCode: '', itemNo: '', itemDescription: '',
      fullDescription: '', materialGroupFullDescription: '', productType1Id: '',
      productType2Id: '', currency: '', goodType: ''
    });
    setSortConfig({ key: null, direction: null });
    setPage(0);
    fetchData();
  };

  const handleFile = e => {
    const f = e.target.files[0];
    if (f && !/\.(xlsx|xls)$/.test(f.name)) {
      setNotification({ open: true, message: 'Only .xlsx or .xls files allowed', severity: 'error' });
      return;
    }
    setFile(f);
  };

  useEffect(() => {
    if (file) {
      const form = new FormData(); 
      form.append('file', file);
      axiosInstance.post('/api/supplier-products/import', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(() => { 
          setPage(0); 
          fetchData(); 
          setNotification({ open: true, message: 'Upload successful!', severity: 'success' }); 
        })
        .catch(err => setNotification({ open: true, message: `Upload failed: ${err.response?.data?.message || err.message}`, severity: 'error' }))
        .finally(() => { setFile(null); setLoading(false); });
    }
  }, [file]);

  return (
    <Box sx={{ p: 1, bgcolor: '#f5f8fa', minHeight: '100vh', fontFamily: '"Inter var", sans-serif' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1rem', mb: 1 }}>Products</Typography>

      <Stack direction="row" spacing={1} mb={1} justifyContent="flex-end">
        <Button 
          variant="contained" 
          startIcon={<FileUpload />} 
          onClick={() => document.getElementById('file-input').click()}
          sx={{ 
            bgcolor: 'linear-gradient(to right, #4cb8ff, #027aff)', 
            fontSize: '0.55rem', 
            px: 1.2, 
            py: 0.25, 
            borderRadius: 2, 
            textTransform: 'none',
            minWidth: 'auto'
          }}
        >
          Upload Excel
        </Button>
        <Input id="file-input" type="file" accept=".xlsx,.xls" onChange={handleFile} sx={{ display: 'none' }} />
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => setOpenAdd(true)}
          sx={{ 
            bgcolor: 'linear-gradient(to right, #4cb8ff, #027aff)', 
            fontSize: '0.55rem', 
            px: 1.2, 
            py: 0.25, 
            borderRadius: 2, 
            textTransform: 'none',
            minWidth: 'auto'
          }}
        >
          Add Product
        </Button>
      </Stack>

      {/* ĐÃ FIX: Truyền đúng tên props */}
      <SupplierSearch 
        supplierCode={search.supplierCode}
        setSearchSupplierCode={(v) => { setSearch(s => ({ ...s, supplierCode: v })); setPage(0); }}
        supplierName={search.supplierName}
        setSearchSupplierName={(v) => { setSearch(s => ({ ...s, supplierName: v })); setPage(0); }}
        sapCode={search.sapCode}
        setSearchSapCode={(v) => { setSearch(s => ({ ...s, sapCode: v })); setPage(0); }}
        itemNo={search.itemNo}
        setSearchItemNo={(v) => { setSearch(s => ({ ...s, itemNo: v })); setPage(0); }}
        itemDescription={search.itemDescription}
        setSearchItemDescription={(v) => { setSearch(s => ({ ...s, itemDescription: v })); setPage(0); }}
        fullDescription={search.fullDescription}
        setSearchFullDescription={(v) => { setSearch(s => ({ ...s, fullDescription: v })); setPage(0); }}
        materialGroupFullDescription={search.materialGroupFullDescription}
        setSearchMaterialGroupFullDescription={(v) => { setSearch(s => ({ ...s, materialGroupFullDescription: v })); setPage(0); }}
        productType1Id={search.productType1Id}
        setSearchProductType1Id={(v) => { setSearch(s => ({ ...s, productType1Id: v })); setPage(0); }}
        productType2Id={search.productType2Id}
        setSearchProductType2Id={(v) => { setSearch(s => ({ ...s, productType2Id: v })); setPage(0); }}
        currency={search.currency}
        setSearchCurrency={(v) => { setSearch(s => ({ ...s, currency: v })); setPage(0); }}
        goodType={search.goodType}
        setSearchGoodType={(v) => { setSearch(s => ({ ...s, goodType: v })); setPage(0); }}
        onSearch={handleSearch} 
        onReset={handleReset} 
        setPage={setPage} 
      />

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          <Typography fontSize="0.55rem" color="#666">Loading...</Typography>
        </Box>
      )}

      <Notification open={notification.open} message={notification.message} severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })} />

      <SupplierProductsTable
        supplierProducts={data}
        handleDelete={p => { setProductToDelete(p); setOpenDelete(true); }}
        handleEdit={p => { setProductToEdit(p); setOpenEdit(true); }}
        page={page} 
        rowsPerPage={rowsPerPage} 
        sortConfig={sortConfig} 
        handleSort={handleSort} 
        theme={theme}
      />

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
        sx={{
          mt: 1,
          fontSize: '0.55rem',
          border: '1px solid #ddd',
          borderTop: 'none',
          bgcolor: '#fff',
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.55rem' },
          '.MuiTablePagination-select': { fontSize: '0.55rem', py: 0.3 },
        }}
      />

      <AddProductDialog open={openAdd} onClose={() => setOpenAdd(false)} onRefresh={fetchData} disabled={loading} />
      {productToEdit && (
        <EditProductDialog 
          open={openEdit} 
          onClose={() => { setOpenEdit(false); setProductToEdit(null); }} 
          product={productToEdit} 
          onRefresh={fetchData} 
          disabled={loading} 
        />
      )}
      
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle sx={{ fontSize: '0.7rem' }}>Delete Product</DialogTitle>
        <DialogContent>
          <Typography fontSize="0.55rem">Confirm delete "{productToDelete?.itemNo}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} sx={{ fontSize: '0.55rem' }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={async () => {
              await axiosInstance.delete(`/api/supplier-products/${productToDelete.id}`);
              setOpenDelete(false); 
              setProductToDelete(null); 
              setPage(0); 
              fetchData();
            }} 
            sx={{ fontSize: '0.55rem' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}