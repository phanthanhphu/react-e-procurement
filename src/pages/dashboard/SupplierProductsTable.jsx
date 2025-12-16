// src/pages/supplier/SupplierProductsPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Input,
  MenuItem,
  Pagination,
  Paper,
  Popover,
  Select,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InboxIcon from '@mui/icons-material/Inbox';
import { Delete, FileUpload, Add, Edit, Image as ImageIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material';

import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import SupplierSearch from './SupplierSearch';
import { API_BASE_URL } from '../../config';

/* =========================
   Axios Config
   ========================= */
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

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: '*/*', 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem('token');
    const isPublic = PUBLIC_ENDPOINTS.some((e) => cfg.url?.includes(e));
    if (token && !isPublic) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  },
  (err) => Promise.reject(err)
);

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/react/login';
    }
    return Promise.reject(err);
  }
);

/* =========================
   Helpers
   ========================= */
const formatDateISO = (s) => {
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (currency === 'VND') return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
  if (currency === 'USD') return `$${Number(value).toFixed(0)}`;
  if (currency === 'EURO' || currency === 'EUR') return `€${Number(value).toFixed(0)}`;
  return Number(value).toFixed(0);
};

const getCurrencyColor = (c) => ({ VND: '#16a34a', EURO: '#2563eb', USD: '#dc2626' }[c] || '#6b7280');
const getGoodTypeColor = (t) => ({ Common: '#16a34a', Special: '#2563eb', Electronics: '#dc2626' }[t] || '#6b7280');

const tagPillSx = {
  padding: '2px 8px',
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#fff',
  display: 'inline-flex',
  justifyContent: 'center',
  minWidth: 70,
  mx: 'auto',
};

/* =========================
   Headers (Supplier Products)
   - Sticky columns: No, Product Item 1, Product Item 2, Supplier Description, SAP Code
   ========================= */
const HEADERS = [
  { label: 'No', key: 'no', sortable: false, align: 'center' },

  { label: 'Product Item 1', key: 'productType1Name', sortable: true },
  { label: 'Product Item 2', key: 'productType2Name', sortable: true },
  { label: 'Supplier Description', key: 'supplierName', sortable: true },
  { label: 'SAP Code', key: 'sapCode', sortable: true },

  { label: 'Hana Sap Code', key: 'hanaSapCode', sortable: true },
  { label: 'Item Description(EN)', key: 'itemDescriptionEN', sortable: true },
  { label: 'Item Description(VN)', key: 'itemDescriptionVN', sortable: true },
  { label: 'Size', key: 'size', sortable: true, align: 'center' },
  { label: 'Unit', key: 'unit', sortable: true, align: 'center' },

  { label: 'Price', key: 'price', sortable: true, align: 'center' },
  { label: 'Currency', key: 'currency', sortable: true, align: 'center' },
  { label: 'Good Type', key: 'goodType', sortable: true, align: 'center' },

  { label: 'Images', key: 'image', sortable: false, align: 'center' },
  { label: 'Created Date', key: 'createdAt', sortable: true, align: 'center' },
  { label: 'Updated Date', key: 'updatedAt', sortable: true, align: 'center' },

  { label: 'Action', key: 'action', sortable: false, align: 'center' },
];

/* =========================
   PaginationBar (giữ y như bạn đang dùng)
   ========================= */
function PaginationBar({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange, loading }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / (rowsPerPage || 1)));
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count, (page + 1) * rowsPerPage);

  const btnSx = { textTransform: 'none', fontWeight: 400 };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1,
        px: 1.25,
        py: 0.9,
        borderRadius: 1.5,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          Showing <span style={{ color: '#111827' }}>{from}-{to}</span> of{' '}
          <span style={{ color: '#111827' }}>{count || 0}</span>
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Button
            variant="text"
            startIcon={<ChevronLeftIcon fontSize="small" />}
            disabled={loading || page <= 0}
            onClick={() => onPageChange(page - 1)}
            sx={btnSx}
          >
            Prev
          </Button>

          <Pagination
            size="small"
            page={page + 1}
            count={totalPages}
            onChange={(_, p1) => onPageChange(p1 - 1)}
            disabled={loading}
            siblingCount={1}
            boundaryCount={1}
            sx={{ '& .MuiPaginationItem-root': { fontSize: '0.8rem', minWidth: 32, height: 32 } }}
          />

          <Button
            variant="text"
            endIcon={<ChevronRightIcon fontSize="small" />}
            disabled={loading || page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            sx={btnSx}
          >
            Next
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Page size</Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            disabled={loading}
            sx={{
              height: 32,
              minWidth: 110,
              borderRadius: 1.2,
              '& .MuiSelect-select': { fontSize: '0.8rem' },
            }}
          >
            {[10, 20, 25, 50].map((n) => (
              <MenuItem key={n} value={n} sx={{ fontSize: '0.8rem' }}>
                {n} / page
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>
    </Paper>
  );
}

/* =========================
   SupplierProductsTable
   ✅ Dính cột kiểu RequisitionMonthlyPage (Table + sticky offsets)
   ✅ FIX: text dài KHÔNG chà cột -> tự xuống dòng (kể cả SAP Code)
   ========================= */
function SupplierProductsTable({ rows, page, rowsPerPage, sort, onSort, onEdit, onDelete }) {
  // ✅ Wrap mạnh: chuỗi không có space vẫn bẻ dòng
  const WRAP_SX = {
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    lineHeight: 1.35,
  };

  // ---- widths (bạn có thể tăng nếu muốn “dài ra” hơn)
  const W = {
    no: 50,
    productType1Name: 140,
    productType2Name: 140,
    supplierName: 190,
    sapCode: 150,

    hanaSapCode: 140,
    itemDescriptionEN: 220,
    itemDescriptionVN: 240,
    size: 90,
    unit: 80,

    price: 110,
    currency: 95,
    goodType: 110,

    image: 80,
    createdAt: 130,
    updatedAt: 130,

    action: 110,
  };

  // ---- sticky keys + left offsets (GIỐNG logic mẫu)
  const stickyKeys = ['no', 'productType1Name', 'productType2Name', 'supplierName', 'sapCode'];

  const LEFT_NO = 0;
  const LEFT_PT1 = LEFT_NO + W.no;
  const LEFT_PT2 = LEFT_PT1 + W.productType1Name;
  const LEFT_SUP = LEFT_PT2 + W.productType2Name;
  const LEFT_SAP = LEFT_SUP + W.supplierName;

  const headCellSx = (key, sortable) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    py: 0.6,
    px: 0.7,
    position: 'sticky',
    top: 0,
    zIndex: key === 'no' ? 22 : stickyKeys.includes(key) ? 21 : 20,
    cursor: sortable ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    minWidth: W[key] || 120,
    width: W[key] || 120,

    ...(key === 'no' && { left: LEFT_NO }),
    ...(key === 'productType1Name' && { left: LEFT_PT1 }),
    ...(key === 'productType2Name' && { left: LEFT_PT2 }),
    ...(key === 'supplierName' && { left: LEFT_SUP }),
    ...(key === 'sapCode' && { left: LEFT_SAP }),
  });

  const stickyBodySx = (key, bg, z = 3) => {
    const base = {
      position: 'sticky',
      zIndex: z,
      backgroundColor: bg,
      minWidth: W[key],
      width: W[key],
      // ✅ chống chà chữ
      ...WRAP_SX,
      // nhìn rõ mép sticky
      boxShadow: '1px 0 0 rgba(0,0,0,0.04)',
      borderRight: 'none',
    };

    if (key === 'no') return { ...base, left: LEFT_NO };
    if (key === 'productType1Name') return { ...base, left: LEFT_PT1 };
    if (key === 'productType2Name') return { ...base, left: LEFT_PT2 };
    if (key === 'supplierName') return { ...base, left: LEFT_SUP };
    if (key === 'sapCode') return { ...base, left: LEFT_SAP };
    return base;
  };

  const renderSortIndicator = (key) => {
    const active = sort.key === key && !!sort.dir;

    if (!active) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5, lineHeight: 0 }}>
          <ArrowUpward sx={{ fontSize: '0.7rem', color: '#9ca3af' }} />
          <ArrowDownward sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: '-4px' }} />
        </Box>
      );
    }

    if (sort.dir === 'asc') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5, lineHeight: 0 }}>
          <ArrowUpward sx={{ fontSize: '0.85rem', color: '#6b7280' }} />
          <ArrowDownward sx={{ fontSize: '0.7rem', color: '#d1d5db', mt: '-4px' }} />
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5, lineHeight: 0 }}>
        <ArrowUpward sx={{ fontSize: '0.7rem', color: '#d1d5db' }} />
        <ArrowDownward sx={{ fontSize: '0.85rem', color: '#6b7280', mt: '-4px' }} />
      </Box>
    );
  };

  // Images popover (giữ như bạn đang dùng)
  const cacheBust = useMemo(() => Date.now(), []);
  const API_URL = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const DEFAULT_IMG = useMemo(() => `${API_BASE_URL}/uploads/default-item.png?v=${cacheBust}`, [cacheBust]);

  const imgCache = useRef(new Map());
  const [imgErr, setImgErr] = useState({});
  const [popover, setPopover] = useState({ anchor: null, images: [] });

  const normalizeImg = useCallback(
    (url) => {
      if (!url) return null;
      const key = `url_${url}`;
      if (imgCache.current.has(key)) return imgCache.current.get(key);

      const final = url.startsWith('http')
        ? `${url}?t=${cacheBust}`
        : url.startsWith('/uploads/')
          ? `${API_BASE_URL}${url}?t=${cacheBust}`
          : `${API_URL}/uploads/${url.replace(/^\/?[Uu]ploads\//i, '')}?t=${cacheBust}`;

      imgCache.current.set(key, final);
      return final;
    },
    [cacheBust, API_URL]
  );

  const openPopover = (event, urls) => {
    const images = (urls || []).map(normalizeImg).filter(Boolean);
    setPopover({ anchor: event.currentTarget, images });
  };
  const closePopover = () => setPopover({ anchor: null, images: [] });

  if (!rows?.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1.5,
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          overflow: 'hidden',
        }}
      >
        <Box p={3} textAlign="center" sx={{ color: 'text.secondary' }}>
          <InboxIcon sx={{ fontSize: 30, opacity: 0.6 }} />
          <Typography sx={{ fontSize: '0.85rem' }}>No data</Typography>
        </Box>
      </Paper>
    );
  }

  // minWidth cho scroll ngang
  const MIN_W = Object.values(W).reduce((a, b) => a + b, 0);

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 1.5,
          border: '1px solid #e5e7eb',
          maxHeight: 650,
          overflowX: 'auto',
          backgroundColor: '#fff',
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: MIN_W, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              {HEADERS.map((h) => (
                <TableCell
                  key={h.key}
                  align={h.align || (['price', 'currency', 'goodType', 'image', 'createdAt', 'updatedAt', 'action', 'size', 'unit'].includes(h.key) ? 'center' : 'left')}
                  sx={{
                    ...headCellSx(h.key, h.sortable),
                    ...(stickyKeys.includes(h.key) ? { borderRight: 'none' } : {}),
                  }}
                  onClick={() => h.sortable && onSort(h.key)}
                >
                  <Stack
                    direction="row"
                    spacing={0.6}
                    alignItems="center"
                    justifyContent={(h.align || 'left') === 'center' ? 'center' : 'flex-start'}
                  >
                    <Tooltip title={h.label} arrow>
                      <span>{h.label}</span>
                    </Tooltip>
                    {h.sortable ? renderSortIndicator(h.key) : null}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((p, i) => {
              const zebra = i % 2 === 0 ? '#ffffff' : '#fafafa';
              const globalIndex = page * rowsPerPage + i + 1;

              return (
                <TableRow
                  key={p.id || `${p.sapCode || ''}_${i}`}
                  sx={{
                    backgroundColor: zebra,
                    '&:hover': { backgroundColor: '#f1f5f9' },
                    '& > *': { borderBottom: '1px solid #f3f4f6' },
                  }}
                >
                  {/* No (sticky) */}
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: '0.75rem',
                      py: 0.4,
                      px: 0.6,
                      fontWeight: 700,
                      ...stickyBodySx('no', zebra, 3),
                    }}
                  >
                    {globalIndex}
                  </TableCell>

                  {/* Product Item 1 (sticky) */}
                  <TableCell
                    sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('productType1Name', zebra, 3) }}
                  >
                    {p.productType1Name || '-'}
                  </TableCell>

                  {/* Product Item 2 (sticky) */}
                  <TableCell
                    sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('productType2Name', zebra, 3) }}
                  >
                    {p.productType2Name || '-'}
                  </TableCell>

                  {/* Supplier (sticky) */}
                  <TableCell
                    sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('supplierName', zebra, 3) }}
                  >
                    {p.supplierName || '-'}
                  </TableCell>

                  {/* SAP Code (sticky) */}
                  <TableCell
                    sx={{
                      fontSize: '0.75rem',
                      py: 0.4,
                      px: 0.6,
                      ...stickyBodySx('sapCode', zebra, 3),
                    }}
                  >
                    {p.sapCode || '-'}
                  </TableCell>

                  {/* Hana SAP */}
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.hanaSapCode, width: W.hanaSapCode }}>
                    {p.hanaSapCode || '-'}
                  </TableCell>

                  {/* Item EN */}
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.itemDescriptionEN, width: W.itemDescriptionEN }}>
                    {p.itemDescriptionEN || '-'}
                  </TableCell>

                  {/* Item VN */}
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.itemDescriptionVN, width: W.itemDescriptionVN }}>
                    {p.itemDescriptionVN || '-'}
                  </TableCell>

                  {/* Size */}
                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.size, width: W.size }}>
                    {p.size || '-'}
                  </TableCell>

                  {/* Unit */}
                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.unit, width: W.unit }}>
                    {p.unit || '-'}
                  </TableCell>

                  {/* Price */}
                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, minWidth: W.price, width: W.price }}>
                    {formatCurrency(p.price, p.currency)}
                  </TableCell>

                  {/* Currency */}
                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.currency, width: W.currency }}>
                    <Box sx={{ ...tagPillSx, backgroundColor: getCurrencyColor(p.currency) }}>{p.currency || 'N/A'}</Box>
                  </TableCell>

                  {/* Good Type */}
                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.goodType, width: W.goodType }}>
                    <Box sx={{ ...tagPillSx, backgroundColor: getGoodTypeColor(p.goodType) }}>{p.goodType || 'N/A'}</Box>
                  </TableCell>

                  {/* Images */}
                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.image, width: W.image }}>
                    {(p.imageUrls?.length || 0) > 0 ? (
                      <IconButton size="small" onMouseEnter={(e) => openPopover(e, p.imageUrls)} aria-haspopup="true">
                        <ImageIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>—</Typography>
                    )}
                  </TableCell>

                  {/* Created */}
                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, minWidth: W.createdAt, width: W.createdAt }}>
                    {formatDateISO(p.createdAt)}
                  </TableCell>

                  {/* Updated */}
                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, minWidth: W.updatedAt, width: W.updatedAt }}>
                    {formatDateISO(p.updatedAt)}
                  </TableCell>

                  {/* Action */}
                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.action, width: W.action }}>
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" onClick={() => onEdit(p)} sx={{ p: 0.25 }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(p)} sx={{ p: 0.25 }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Popover images */}
      <Popover
        open={!!popover.anchor}
        anchorEl={popover.anchor}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableRestoreFocus
        sx={{ pointerEvents: 'auto' }}
      >
        <Box p={1} sx={{ maxWidth: 280, maxHeight: 280, overflowY: 'auto' }} onMouseLeave={closePopover}>
          {popover.images?.length ? (
            <Stack spacing={1}>
              {popover.images.map((src, i) => (
                <Box key={src || i} sx={{ textAlign: 'center' }}>
                  <img
                    src={imgErr[src] ? DEFAULT_IMG : src}
                    alt=""
                    style={{ maxWidth: '100%', maxHeight: 190, borderRadius: 6, objectFit: 'contain' }}
                    loading="lazy"
                    onError={() => setImgErr((prev) => ({ ...prev, [src]: true }))}
                  />
                  <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>
                    Image {i + 1}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>No images</Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}

/* =========================
   Main Page
   ========================= */
export default function SupplierProductsPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const [search, setSearch] = useState({
    supplierCode: '',
    supplierName: '',
    sapCode: '',
    hanaSapCode: '',
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    materialGroupFullDescription: '',
    productType1Id: '',
    productType2Id: '',
    currency: '',
    goodType: '',
  });

  // tri-state sort: asc -> desc -> none
  const [sort, setSort] = useState({ key: null, dir: null });

  const sortParam = useMemo(() => {
    if (sort?.key && sort?.dir) return `${sort.key},${sort.dir}`;
    return 'createdAt,desc';
  }, [sort]);

  const fetchData = useCallback(
    async (overrides = {}) => {
      const effPage = Number.isInteger(overrides.page) ? overrides.page : page;
      const effSize = Number.isInteger(overrides.size) ? overrides.size : rowsPerPage;
      const effSearch = overrides.search ?? search;
      const effSort = overrides.sort ?? sort;

      const effSortParam = effSort?.key && effSort?.dir ? `${effSort.key},${effSort.dir}` : 'createdAt,desc';

      setLoading(true);
      try {
        const params = { page: effPage, size: effSize, sort: effSortParam };

        Object.entries(effSearch).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) params[k] = v;
        });

        const res = await axiosInstance.get('/api/supplier-products/filter', { params });
        setRows(res.data?.data?.content || []);
        setTotal(res.data?.data?.totalElements || 0);
      } catch (err) {
        setRows([]);
        setTotal(0);
        setSnack({
          open: true,
          sev: 'error',
          msg: 'Load failed: ' + (err.response?.data?.message || err.message),
        });
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage, search, sort]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/react/login');
      return;
    }
    fetchData();
  }, [fetchData, navigate]);

  const handleSort = useCallback(
    (key) => {
      const h = HEADERS.find((x) => x.key === key);
      if (!h?.sortable) return;

      let next = { key, dir: 'asc' };
      if (sort.key === key && sort.dir === 'asc') next = { key, dir: 'desc' };
      else if (sort.key === key && sort.dir === 'desc') next = { key: null, dir: null };

      setSort(next);
      setPage(0);
      fetchData({ page: 0, sort: next });
    },
    [sort.key, sort.dir, fetchData]
  );

  const handleSearch = useCallback(() => {
    setPage(0);
    fetchData({ page: 0 });
  }, [fetchData]);

  const handleReset = useCallback(() => {
    const cleared = {
      supplierCode: '',
      supplierName: '',
      sapCode: '',
      hanaSapCode: '',
      itemDescriptionEN: '',
      itemDescriptionVN: '',
      materialGroupFullDescription: '',
      productType1Id: '',
      productType2Id: '',
      currency: '',
      goodType: '',
    };
    const defaultSort = { key: null, dir: null };

    setSearch(cleared);
    setSort(defaultSort);
    setPage(0);
    fetchData({ page: 0, search: cleared, sort: defaultSort });
  }, [fetchData]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f && !/\.(xlsx|xls)$/i.test(f.name)) {
      setSnack({ open: true, sev: 'error', msg: 'Only .xlsx or .xls files allowed' });
      return;
    }
    setFile(f || null);
  };

  // Upload file
  useEffect(() => {
    if (!file) return;

    const uploadFile = async () => {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axiosInstance.post('/api/supplier-products/import-new-format', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setSnack({
          open: true,
          sev: 'success',
          msg: `Import successful! File "${file.name}" has been processed.`,
        });

        setPage(0);
        fetchData({ page: 0 });
      } catch (err) {
        const errorData = err.response?.data;

        if (errorData?.error === 'Duplicate entry found') {
          setSnack({
            open: true,
            sev: 'error',
            msg: `Import failed – Duplicate entry detected! Row ${errorData.row} | Supplier "${errorData.supplierName}" | SAP: ${errorData.sapCode}`,
          });
        } else {
          setSnack({
            open: true,
            sev: 'error',
            msg: errorData?.message || 'Import failed. Please check the file and try again.',
          });
        }
        console.error('Import error:', errorData || err);
      } finally {
        setFile(null);
        setLoading(false);
        const input = document.getElementById('file-input');
        if (input) input.value = '';
      }
    };

    uploadFile();
  }, [file, fetchData]);

  return (
    <Box sx={{ bgcolor: '#f7f7f7', minHeight: '100vh', p: 1.5 }}>
      <Box sx={{ px: { xs: 0.5, sm: 1, md: 1.5 } }}>
        {/* Header card */}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            mb: 1,
            borderRadius: 1.5,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack spacing={0.25}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                Supplier Products
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                Sort: <span style={{ color: '#111827' }}>{sortParam}</span>
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                startIcon={<FileUpload />}
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.2,
                  height: 34,
                  backgroundColor: '#111827',
                  '&:hover': { backgroundColor: '#0b1220' },
                }}
              >
                {loading ? 'Importing...' : 'Upload Excel'}
              </Button>
              <Input id="file-input" type="file" accept=".xlsx,.xls" onChange={handleFile} sx={{ display: 'none' }} />

              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setOpenAdd(true)}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.2,
                  height: 34,
                  borderColor: '#e5e7eb',
                  color: '#111827',
                  '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
                }}
              >
                Add Product
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Search */}
        <SupplierSearch
          searchSupplierCode={search.supplierCode}
          setSearchSupplierCode={(v) => {
            setSearch((s) => ({ ...s, supplierCode: v }));
            setPage(0);
          }}
          searchSupplierName={search.supplierName}
          setSearchSupplierName={(v) => {
            setSearch((s) => ({ ...s, supplierName: v }));
            setPage(0);
          }}
          searchSapCode={search.sapCode}
          setSearchSapCode={(v) => {
            setSearch((s) => ({ ...s, sapCode: v }));
            setPage(0);
          }}
          searchHanaSapCode={search.hanaSapCode}
          setSearchHanaSapCode={(v) => {
            setSearch((s) => ({ ...s, hanaSapCode: v }));
            setPage(0);
          }}
          searchItemDescriptionEN={search.itemDescriptionEN}
          setSearchItemDescriptionEN={(v) => {
            setSearch((s) => ({ ...s, itemDescriptionEN: v }));
            setPage(0);
          }}
          searchItemDescriptionVN={search.itemDescriptionVN}
          setSearchItemDescriptionVN={(v) => {
            setSearch((s) => ({ ...s, itemDescriptionVN: v }));
            setPage(0);
          }}
          searchMaterialGroupFullDescription={search.materialGroupFullDescription}
          setSearchMaterialGroupFullDescription={(v) => {
            setSearch((s) => ({ ...s, materialGroupFullDescription: v }));
            setPage(0);
          }}
          searchProductType1Id={search.productType1Id}
          setSearchProductType1Id={(v) => {
            setSearch((s) => ({ ...s, productType1Id: v }));
            setPage(0);
          }}
          searchProductType2Id={search.productType2Id}
          setSearchProductType2Id={(v) => {
            setSearch((s) => ({ ...s, productType2Id: v }));
            setPage(0);
          }}
          searchCurrency={search.currency}
          setSearchCurrency={(v) => {
            setSearch((s) => ({ ...s, currency: v }));
            setPage(0);
          }}
          searchGoodType={search.goodType}
          setSearchGoodType={(v) => {
            setSearch((s) => ({ ...s, goodType: v }));
            setPage(0);
          }}
          setPage={setPage}
          onSearch={handleSearch}
          onReset={handleReset}
          // legacy props fallback
          supplierCode={search.supplierCode}
          supplierName={search.supplierName}
          sapCode={search.sapCode}
          hanaSapCode={search.hanaSapCode}
          itemDescriptionEN={search.itemDescriptionEN}
          itemDescriptionVN={search.itemDescriptionVN}
          materialGroupFullDescription={search.materialGroupFullDescription}
          productType1Id={search.productType1Id}
          productType2Id={search.productType2Id}
          currency={search.currency}
          goodType={search.goodType}
        />

        {/* Loading */}
        {loading && (
          <Typography align="center" sx={{ mt: 1.5, fontSize: '0.85rem', color: 'text.secondary' }}>
            <CircularProgress size={18} sx={{ mr: 1 }} />
            Loading...
          </Typography>
        )}

        {/* Table + Pagination */}
        {!loading && (
          <>
            <SupplierProductsTable
              rows={rows}
              page={page}
              rowsPerPage={rowsPerPage}
              sort={sort}
              onSort={handleSort}
              onEdit={(p) => {
                setProductToEdit(p);
                setOpenEdit(true);
              }}
              onDelete={(p) => {
                setProductToDelete(p);
                setOpenDelete(true);
              }}
            />

            <PaginationBar
              count={total}
              page={page}
              rowsPerPage={rowsPerPage}
              loading={loading}
              onPageChange={(p) => {
                setPage(p);
                fetchData({ page: p });
              }}
              onRowsPerPageChange={(size) => {
                setRowsPerPage(size);
                setPage(0);
                fetchData({ page: 0, size });
              }}
            />
          </>
        )}

        {/* Dialogs */}
        <AddProductDialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onRefresh={() => fetchData({ page: 0 })}
          disabled={loading}
        />

        {productToEdit && (
          <EditProductDialog
            open={openEdit}
            onClose={() => {
              setOpenEdit(false);
              setProductToEdit(null);
            }}
            product={productToEdit}
            onRefresh={() => fetchData({ page: 0 })}
            disabled={loading}
          />
        )}

        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle sx={{ fontSize: '0.9rem' }}>Delete Product</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: '0.85rem' }}>
              Confirm delete "{productToDelete?.hanaSapCode || productToDelete?.sapCode || ''}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                try {
                  await axiosInstance.delete(`/api/supplier-products/${productToDelete.id}`);
                  setOpenDelete(false);
                  setProductToDelete(null);
                  setPage(0);
                  fetchData({ page: 0 });
                  setSnack({ open: true, sev: 'success', msg: 'Deleted successfully.' });
                } catch (err) {
                  setSnack({
                    open: true,
                    sev: 'error',
                    msg: 'Delete failed: ' + (err.response?.data?.message || err.message),
                  });
                }
              }}
              sx={{ textTransform: 'none' }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snack.open}
          autoHideDuration={6000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.sev}
            sx={{ fontSize: '0.8rem' }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
