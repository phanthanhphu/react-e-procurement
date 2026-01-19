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

const normalizeCurrency = (c) => {
  const s = String(c ?? '').trim();
  if (!s) return '';
  const up = s.toUpperCase();
  if (up === 'EUR') return 'EURO';
  if (up === 'EURO') return 'EURO';
  if (up === 'USD') return 'USD';
  if (up === 'VND') return 'VND';
  return up;
};

const normalizeGoodType = (t) => {
  const s = String(t ?? '').trim();
  if (!s) return '';
  const up = s.toUpperCase();

  if (['COMMON', 'NORMAL', 'STANDARD', 'STD', 'C'].includes(up)) return 'Common';
  if (['SPECIAL', 'SPEC', 'SP', 'S'].includes(up)) return 'Special';
  if (['ELECTRONICS', 'ELECTRONIC', 'ELEC', 'EL', 'E'].includes(up)) return 'Electronics';

  return s.length <= 2 ? s.toUpperCase() : s.charAt(0).toUpperCase() + s.slice(1);
};

const getCurrencyColor = (c) => {
  const cc = normalizeCurrency(c);
  return { VND: '#16a34a', EURO: '#2563eb', USD: '#dc2626' }[cc] || '#6b7280';
};

const getGoodTypeColor = (t) => {
  const gt = normalizeGoodType(t);
  return { Common: '#16a34a', Special: '#2563eb', Electronics: '#dc2626' }[gt] || '#6b7280';
};

// ✅ format tiền KHÔNG làm tròn (không toFixed), chỉ thêm dấu phẩy, giữ nguyên thập phân nếu có
// - VND: mặc định không hiển thị thập phân; nhưng nếu có thập phân khác 0 thì vẫn giữ để không mất dữ liệu
const formatMoneyNoRound = (value, currency) => {
  const cur = normalizeCurrency(currency);

  if (value === null || value === undefined || value === '') return '0';

  let raw = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '0') : String(value);
  raw = raw.trim();
  if (!raw) return '0';

  // bỏ dấu phẩy ngăn cách sẵn có (nếu backend/excel gửi "10,000.00")
  raw = raw.replace(/,/g, '');

  // lấy dấu âm
  let sign = '';
  if (raw.startsWith('-')) {
    sign = '-';
    raw = raw.slice(1);
  }

  // tách phần thập phân (nếu có)
  const parts = raw.split('.');
  const intRaw = parts[0] ?? '0';
  const fracRaw = parts.length > 1 ? parts.slice(1).join('') : null; // phòng trường hợp có nhiều dấu "."

  // chỉ giữ digit (tránh ký tự lạ)
  let intDigits = String(intRaw).replace(/[^\d]/g, '');
  if (intDigits === '') intDigits = '0';

  // bỏ leading zeros nhưng giữ lại 1 số 0 nếu toàn 0
  intDigits = intDigits.replace(/^0+(?=\d)/, '') || '0';

  // thêm dấu phẩy cho phần nguyên
  const intWithComma = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // không có thập phân
  if (fracRaw == null) return sign + intWithComma;

  // giữ nguyên digit của phần thập phân
  const fracDigits = String(fracRaw).replace(/[^\d]/g, '');

  // VND: mặc định bỏ thập phân nếu toàn 0
  if (cur === 'VND') {
    if (!fracDigits || /^0+$/.test(fracDigits)) return sign + intWithComma;
    return sign + intWithComma + '.' + fracDigits;
  }

  // USD/EURO/...: giữ nguyên thập phân như dữ liệu (không ép 2 số)
  if (!fracDigits) return sign + intWithComma;
  return sign + intWithComma + '.' + fracDigits;
};

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
   ✅ Sort helpers (CLIENT fallback) — y hệt WeeklyMonthly
   ========================= */
const toTimestamp = (v) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};

const getComparableValue = (row, key) => {
  if (!row) return '';

  const dateKeys = new Set(['createdAt', 'updatedAt']);
  const numberKeys = new Set(['price']);

  if (dateKeys.has(key)) return toTimestamp(row?.[key]);
  if (numberKeys.has(key)) {
    const n = Number(row?.[key]);
    return Number.isFinite(n) ? n : 0;
  }

  if (key === 'currency') return normalizeCurrency(row?.currency || '').toLowerCase();
  if (key === 'goodType') return normalizeGoodType(row?.goodType || '').toLowerCase();

  const s = row?.[key];
  return (s == null ? '' : String(s)).trim().toLowerCase();
};

const sortRowsClient = (rows, sortConfig) => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  if (!sortConfig?.key || !sortConfig?.direction) return rows;

  const dir = sortConfig.direction === 'desc' ? -1 : 1;
  const key = sortConfig.key;

  const withIndex = rows.map((r, i) => ({ r, i }));
  withIndex.sort((a, b) => {
    const va = getComparableValue(a.r, key);
    const vb = getComparableValue(b.r, key);

    if (typeof va === 'number' && typeof vb === 'number') {
      if (va !== vb) return (va - vb) * dir;
      return a.i - b.i;
    }

    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
    if (cmp !== 0) return cmp * dir;
    return a.i - b.i;
  });

  return withIndex.map((x) => x.r);
};

/* =========================
   ✅ Sort Indicator (tri-state)
   ========================= */
const SortIndicator = ({ active, direction }) => {
  if (!active) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.2, lineHeight: 0 }}>
        <ArrowUpward sx={{ fontSize: '0.7rem', color: '#9ca3af' }} />
        <ArrowDownward sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: '-4px' }} />
      </Box>
    );
  }

  if (direction === 'asc') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.2, lineHeight: 0 }}>
        <ArrowUpward sx={{ fontSize: '0.85rem', color: '#6b7280' }} />
        <ArrowDownward sx={{ fontSize: '0.7rem', color: '#d1d5db', mt: '-4px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.2, lineHeight: 0 }}>
      <ArrowUpward sx={{ fontSize: '0.7rem', color: '#d1d5db' }} />
      <ArrowDownward sx={{ fontSize: '0.85rem', color: '#6b7280', mt: '-4px' }} />
    </Box>
  );
};

/* =========================
   Headers
   ✅ thêm backendKey để build sort param
   ========================= */
const HEADERS = [
  { label: 'No', key: 'no', backendKey: 'no', sortable: false, align: 'center' },

  { label: 'Product Item 1', key: 'productType1Name', backendKey: 'productType1Name', sortable: true },
  { label: 'Product Item 2', key: 'productType2Name', backendKey: 'productType2Name', sortable: true },
  { label: 'Supplier Description', key: 'supplierName', backendKey: 'supplierName', sortable: true },
  { label: 'SAP Code', key: 'sapCode', backendKey: 'sapCode', sortable: true },

  { label: 'Hana Sap Code', key: 'hanaSapCode', backendKey: 'hanaSapCode', sortable: true },
  { label: 'Item Description(EN)', key: 'itemDescriptionEN', backendKey: 'itemDescriptionEN', sortable: true },
  { label: 'Item Description(VN)', key: 'itemDescriptionVN', backendKey: 'itemDescriptionVN', sortable: true },
  { label: 'Size', key: 'size', backendKey: 'size', sortable: true, align: 'center' },
  { label: 'Unit', key: 'unit', backendKey: 'unit', sortable: true, align: 'center' },

  { label: 'Price', key: 'price', backendKey: 'price', sortable: true, align: 'center' },
  { label: 'Currency', key: 'currency', backendKey: 'currency', sortable: true, align: 'center' },
  { label: 'Good Type', key: 'goodType', backendKey: 'goodType', sortable: true, align: 'center' },

  { label: 'Images', key: 'image', backendKey: 'image', sortable: false, align: 'center' },
  { label: 'Created Date', key: 'createdAt', backendKey: 'createdAt', sortable: true, align: 'center' },
  { label: 'Updated Date', key: 'updatedAt', backendKey: 'updatedAt', sortable: true, align: 'center' },

  { label: 'Action', key: 'action', backendKey: 'action', sortable: false, align: 'center' },
];

/* =========================
   PaginationBar
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
   ✅ SINGLE CLICK ROW => OPEN EDIT (FIX)
   ========================= */
function SupplierProductsTable({ rows, page, rowsPerPage, sortConfig, loading, onSort, onEdit, onDelete }) {
  const WRAP_SX = {
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    lineHeight: 1.35,
  };

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

  const stickyKeys = ['no', 'productType1Name', 'productType2Name', 'supplierName', 'sapCode'];

  const LEFT_NO = 0;
  const LEFT_PT1 = LEFT_NO + W.no;
  const LEFT_PT2 = LEFT_PT1 + W.productType1Name;
  const LEFT_SUP = LEFT_PT2 + W.productType2Name;
  const LEFT_SAP = LEFT_SUP + W.supplierName;

  const headCellSx = (key) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    py: 0.6,
    px: 0.7,
    position: 'sticky',
    top: 0,

    zIndex: key === 'no' ? 3 : stickyKeys.includes(key) ? 2 : 1,

    cursor: 'default',
    whiteSpace: 'nowrap',
    minWidth: W[key] || 120,
    width: W[key] || 120,

    ...(key === 'no' && { left: LEFT_NO }),
    ...(key === 'productType1Name' && { left: LEFT_PT1 }),
    ...(key === 'productType2Name' && { left: LEFT_PT2 }),
    ...(key === 'supplierName' && { left: LEFT_SUP }),
    ...(key === 'sapCode' && { left: LEFT_SAP }),
  });

  const stickyBodySx = (key, bg) => {
    const base = {
      position: 'sticky',
      zIndex: 0,
      backgroundColor: bg,
      minWidth: W[key],
      width: W[key],
      ...WRAP_SX,
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

  // ✅ ignore click when user clicks on buttons/inputs inside row
  const shouldIgnoreRowClick = (e) => {
    const t = e?.target;
    return !!t?.closest?.(
      'button, a, input, textarea, select, [role="button"], .MuiIconButton-root, .MuiButton-root, .MuiCheckbox-root, .MuiButtonBase-root'
    );
  };

  // ✅ optional: prevent open edit when user is selecting text
  const hasTextSelection = () => {
    const sel = window.getSelection?.();
    return sel && String(sel).trim().length > 0;
  };

  // Images popover
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
          position: 'relative',
          zIndex: 0,
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: MIN_W, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              {HEADERS.map((h) => {
                const active = sortConfig.key === h.key && !!sortConfig.direction;

                return (
                  <TableCell
                    key={h.key}
                    align={
                      h.align ||
                      (['price', 'currency', 'goodType', 'image', 'createdAt', 'updatedAt', 'action', 'size', 'unit'].includes(h.key)
                        ? 'center'
                        : 'left')
                    }
                    sx={{
                      ...headCellSx(h.key),
                      ...(stickyKeys.includes(h.key) ? { borderRight: 'none' } : {}),
                    }}
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

                      {h.sortable ? (
                        <Tooltip title="Sort" arrow>
                          <span>
                            <IconButton
                              size="small"
                              disabled={loading}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSort(h.key);
                              }}
                              sx={{
                                p: 0.25,
                                border: '1px solid transparent',
                                '&:hover': { borderColor: '#e5e7eb', backgroundColor: '#eef2f7' },
                              }}
                              aria-label={`sort-${h.key}`}
                            >
                              <SortIndicator active={active} direction={sortConfig.direction} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((p, i) => {
              const zebra = i % 2 === 0 ? '#ffffff' : '#fafafa';
              const globalIndex = page * rowsPerPage + i + 1;

              const currencyLabel = normalizeCurrency(p.currency) || 'N/A';
              const goodTypeLabel = normalizeGoodType(p.goodType) || 'N/A';

              return (
                <TableRow
                  key={p.id || `${p.sapCode || ''}_${i}`}
                  // ✅ FIX: single click open edit
                  onClick={(e) => {
                    if (shouldIgnoreRowClick(e)) return;
                    if (hasTextSelection()) return;
                    onEdit?.(p);
                  }}
                  sx={{
                    backgroundColor: zebra,
                    '&:hover': { backgroundColor: '#f1f5f9' },
                    '& > *': { borderBottom: '1px solid #f3f4f6' },
                    cursor: 'pointer',
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: '0.75rem',
                      py: 0.4,
                      px: 0.6,
                      fontWeight: 700,
                      ...stickyBodySx('no', zebra),
                    }}
                  >
                    {globalIndex}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('productType1Name', zebra) }}>
                    {p.productType1Name || '-'}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('productType2Name', zebra) }}>
                    {p.productType2Name || '-'}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('supplierName', zebra) }}>
                    {p.supplierName || '-'}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('sapCode', zebra) }}>
                    {p.sapCode || '-'}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.hanaSapCode, width: W.hanaSapCode }}>
                    {p.hanaSapCode || '-'}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.itemDescriptionEN, width: W.itemDescriptionEN }}>
                    {p.itemDescriptionEN || '-'}
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.itemDescriptionVN, width: W.itemDescriptionVN }}>
                    {p.itemDescriptionVN || '-'}
                  </TableCell>

                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.size, width: W.size }}>
                    {p.size || '-'}
                  </TableCell>

                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...WRAP_SX, minWidth: W.unit, width: W.unit }}>
                    {p.unit || '-'}
                  </TableCell>

                  {/* ✅ FIX: truyền currency vào để VND không bị .00 + không làm tròn */}
                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, minWidth: W.price, width: W.price }}>
                    {formatMoneyNoRound(p.price, p.currency)}
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.currency, width: W.currency }}>
                    <Box sx={{ ...tagPillSx, backgroundColor: getCurrencyColor(currencyLabel) }}>{currencyLabel}</Box>
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.goodType, width: W.goodType }}>
                    <Tooltip title={String(p.goodType ?? '')} arrow>
                      <Box sx={{ ...tagPillSx, backgroundColor: getGoodTypeColor(p.goodType) }}>
                        {goodTypeLabel}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.image, width: W.image }}>
                    {(p.imageUrls?.length || 0) > 0 ? (
                      <IconButton
                        size="small"
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          openPopover(e, p.imageUrls);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-haspopup="true"
                      >
                        <ImageIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>—</Typography>
                    )}
                  </TableCell>

                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, minWidth: W.createdAt, width: W.createdAt }}>
                    {formatDateISO(p.createdAt)}
                  </TableCell>

                  <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, minWidth: W.updatedAt, width: W.updatedAt }}>
                    {formatDateISO(p.updatedAt)}
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.4, px: 0.6, minWidth: W.action, width: W.action }}>
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(p);
                        }}
                        sx={{ p: 0.25 }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(p);
                        }}
                        sx={{ p: 0.25 }}
                      >
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
  useTheme(); // giữ hook nếu project bạn đang dùng theme context
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

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const sortLabel = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return 'createdAt,desc';
    const backendKey = HEADERS.find((h) => h.key === sortConfig.key)?.backendKey || sortConfig.key;
    return `${backendKey},${sortConfig.direction}`;
  }, [sortConfig]);

  const fetchData = useCallback(
    async (overrides = {}) => {
      const effPage = Number.isInteger(overrides.page) ? overrides.page : page;
      const effSize = Number.isInteger(overrides.size) ? overrides.size : rowsPerPage;
      const effSearch = overrides.search ?? search;
      const effSort = overrides.sortConfig ?? sortConfig;

      const sortParam =
        effSort?.key && effSort?.direction
          ? `${HEADERS.find((h) => h.key === effSort.key)?.backendKey || effSort.key},${effSort.direction}`
          : 'createdAt,desc';

      setLoading(true);
      try {
        const params = { page: effPage, size: effSize, sort: sortParam };

        Object.entries(effSearch).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) params[k] = v;
        });

        const res = await axiosInstance.get('/api/supplier-products/filter', { params });

        const content = res.data?.data?.content || [];
        const finalRows = sortRowsClient(content, effSort);

        setRows(finalRows);
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
    [page, rowsPerPage, search, sortConfig]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/react/login');
      return;
    }
    fetchData({ page, size: rowsPerPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const firstPagingRef = useRef(true);
  useEffect(() => {
    if (firstPagingRef.current) {
      firstPagingRef.current = false;
      return;
    }
    fetchData({ page, size: rowsPerPage });
  }, [page, rowsPerPage, fetchData]);

  const handleSort = useCallback(
    (key) => {
      if (loading) return;
      const h = HEADERS.find((x) => x.key === key);
      if (!h?.sortable) return;

      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;

      const nextSort = { key: direction ? key : null, direction };
      setSortConfig(nextSort);
      setPage(0);
      fetchData({ page: 0, sortConfig: nextSort });
    },
    [loading, sortConfig, fetchData]
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
    const defaultSort = { key: null, direction: null };

    setSearch(cleared);
    setSortConfig(defaultSort);
    setPage(0);
    fetchData({ page: 0, search: cleared, sortConfig: defaultSort });
  }, [fetchData]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f && !/\.(xlsx|xls)$/i.test(f.name)) {
      setSnack({ open: true, sev: 'error', msg: 'Only .xlsx or .xls files allowed' });
      return;
    }
    setFile(f || null);
  };

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
        // eslint-disable-next-line no-console
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
                Sort: <span style={{ color: '#111827' }}>{sortLabel}</span>
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Tip: click row to edit
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

        {loading && (
          <Typography align="center" sx={{ mt: 1.5, fontSize: '0.85rem', color: 'text.secondary' }}>
            <CircularProgress size={18} sx={{ mr: 1 }} />
            Loading...
          </Typography>
        )}

        {!loading && (
          <>
            <SupplierProductsTable
              rows={rows}
              page={page}
              rowsPerPage={rowsPerPage}
              sortConfig={sortConfig}
              loading={loading}
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
              onPageChange={(p) => setPage(p)}
              onRowsPerPageChange={(size) => {
                setRowsPerPage(size);
                setPage(0);
              }}
            />
          </>
        )}

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
