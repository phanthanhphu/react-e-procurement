// src/pages/dashboard/WeeklyMonthlyRequisitionsPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Popover,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Alert,
} from '@mui/material';

import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ImageIcon from '@mui/icons-material/Image';
import InboxIcon from '@mui/icons-material/Inbox';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { API_BASE_URL } from '../../config';
import WeeklyMonthlyGroupSearch from './WeeklyMonthlyGroupSearch';

/* =========================
   Axios interceptors (once)
   ========================= */
if (!axios.__WEEKLY_MONTHLY_REQUISITIONS_INTERCEPTORS__) {
  axios.__WEEKLY_MONTHLY_REQUISITIONS_INTERCEPTORS__ = true;

  axios.interceptors.request.use(
    (cfg) => {
      const token = localStorage.getItem('token');
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    },
    (err) => Promise.reject(err)
  );

  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );
}

/* =========================
   Helpers
   ========================= */
const formatDate = (arr) => {
  if (!Array.isArray(arr) || arr.length < 3) return '-';
  const [year, month, day] = arr;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return '0';
  const n = Number(value);
  if (currency === 'VND') return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n);
  if (currency === 'USD') return `$${n.toFixed(0)}`;
  if (currency === 'EUR' || currency === 'EURO') return `€${n.toFixed(0)}`;
  return n.toFixed(0);
};

const getTypeColor = (t) => (t === 'WEEKLY' ? '#2563eb' : '#16a34a');

const tagSx = {
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
   ✅ Sorting helpers (CLIENT fallback) — giống GroupRequestPage
   ========================= */
const toTimestamp = (v) => {
  if (!v) return 0;

  // backend hay trả date dạng [y,m,d,hh,mm,ss]
  if (Array.isArray(v)) {
    const [y, m, d, hh = 0, mm = 0, ss = 0] = v;
    const dt = new Date(y, m - 1, d, hh, mm, ss);
    const t = dt.getTime();
    return Number.isFinite(t) ? t : 0;
  }

  // string / Date
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};

const getComparableValue = (row, key) => {
  if (!row) return '';

  const dateKeys = new Set(['createdDate', 'updatedDate']);
  const numberKeys = new Set(['totalRequestQty', 'orderQty', 'price', 'amount']);

  if (dateKeys.has(key)) return toTimestamp(row?.[key]);
  if (numberKeys.has(key)) {
    const n = Number(row?.[key]);
    return Number.isFinite(n) ? n : 0;
  }

  // default string
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
   ✅ Sort indicator (tri-state like GroupRequestPage)
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
   DeptRequestTable
   ========================= */
function DeptRequestTable({ departmentRequests }) {
  if (!departmentRequests?.length) {
    return (
      <Typography sx={{ fontStyle: 'italic', fontSize: '0.72rem', color: 'text.secondary', textAlign: 'center' }}>
        No Data
      </Typography>
    );
  }

  return (
    <Table
      size="small"
      sx={{
        minWidth: 200,
        border: '1px solid #e5e7eb',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      <TableHead>
        <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
          <TableCell sx={{ fontSize: '0.72rem', py: 0.3, px: 0.6, fontWeight: 600 }}>Dept</TableCell>
          <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.3, px: 0.6, fontWeight: 600 }}>
            Req
          </TableCell>
          <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.3, px: 0.6, fontWeight: 600 }}>
            Buy
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {departmentRequests.map((d, i) => (
          <TableRow key={i} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
            <TableCell sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>{d.name || '—'}</TableCell>
            <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>
              {d.qty || 0}
            </TableCell>
            <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>
              {d.buy || 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

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
   Headers (sticky columns)
   ✅ thêm backendKey để build sort param giống GroupRequestPage
   ========================= */
const HEADERS = [
  { label: 'No', key: 'no', backendKey: 'no', align: 'center', width: 50, sticky: true, sortable: false },

  { label: 'Product Type 1', key: 'productType1Name', backendKey: 'productType1Name', sortable: true, width: 120, sticky: true },
  { label: 'Product Type 2', key: 'productType2Name', backendKey: 'productType2Name', sortable: true, width: 120, sticky: true },
  { label: 'Type', key: 'type', backendKey: 'type', sortable: true, align: 'center', width: 90, sticky: true },
  { label: 'Item (EN)', key: 'itemDescriptionEN', backendKey: 'itemDescriptionEN', sortable: true, width: 170, sticky: true },
  { label: 'Item (VN)', key: 'itemDescriptionVN', backendKey: 'itemDescriptionVN', sortable: true, width: 170, sticky: true },

  { label: 'Old SAP', key: 'oldSAPCode', backendKey: 'oldSAPCode', sortable: true, align: 'center', width: 110 },
  { label: 'Hana SAP', key: 'hanaSAPCode', backendKey: 'hanaSAPCode', sortable: true, align: 'center', width: 110 },
  { label: 'Supplier', key: 'supplierName', backendKey: 'supplierName', sortable: true, width: 160 },
  { label: 'Depts', key: 'departmentRequisitions', backendKey: 'departmentRequisitions', width: 240, sortable: false },
  { label: 'Unit', key: 'unit', backendKey: 'unit', sortable: true, align: 'center', width: 70 },
  { label: 'Req Qty', key: 'totalRequestQty', backendKey: 'totalRequestQty', sortable: true, align: 'center', width: 90 },
  { label: 'Order Qty', key: 'orderQty', backendKey: 'orderQty', sortable: true, align: 'center', width: 90 },
  { label: 'Price', key: 'price', backendKey: 'price', sortable: true, align: 'center', width: 90 },
  { label: 'Curr', key: 'currency', backendKey: 'currency', sortable: true, align: 'center', width: 70 },
  { label: 'Amount', key: 'amount', backendKey: 'amount', sortable: true, align: 'center', width: 110 },
  { label: 'Created', key: 'createdDate', backendKey: 'createdDate', sortable: true, align: 'center', width: 110 },
  { label: 'Updated', key: 'updatedDate', backendKey: 'updatedDate', sortable: true, align: 'center', width: 110 },
  { label: 'Img', key: 'imageUrls', backendKey: 'imageUrls', align: 'center', width: 70, sortable: false },
];

/* =========================
   WeeklyMonthlyTable
   ✅ Sort chỉ bấm icon (y hệt GroupRequestPage)
   ========================= */
function WeeklyMonthlyTable({ rows, page, rowsPerPage, sortConfig, loading, onSort, onHoverImages }) {
  // ✅ Wrap mạnh: chuỗi không có space vẫn bẻ dòng
  const WRAP_SX = {
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    lineHeight: 1.35,
  };

  // widths map
  const W = useMemo(() => {
    const o = {};
    HEADERS.forEach((h) => (o[h.key] = h.width || 120));
    return o;
  }, []);

  const stickyKeys = useMemo(() => HEADERS.filter((h) => h.sticky).map((h) => h.key), []);
  const LEFT = useMemo(() => {
    let left = 0;
    const m = {};
    stickyKeys.forEach((k) => {
      m[k] = left;
      left += W[k] || 120;
    });
    return m;
  }, [stickyKeys, W]);

  const headCellSx = useCallback(
    (key, sortable, sticky) => ({
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#111827',
      backgroundColor: '#f3f4f6',
      borderBottom: '1px solid #e5e7eb',
      py: 0.6,
      px: 0.7,
      position: 'sticky',
      top: 0,
      zIndex: key === 'no' ? 22 : sticky ? 21 : 20,
      cursor: 'default',
      whiteSpace: 'nowrap',
      minWidth: W[key] || 120,
      width: W[key] || 120,
      ...(sticky ? { left: LEFT[key] } : {}),
    }),
    [LEFT, W]
  );

  const stickyBodySx = useCallback(
    (key, bg, sticky, z = 3) => {
      const base = {
        backgroundColor: bg,
        minWidth: W[key] || 120,
        width: W[key] || 120,
        ...WRAP_SX,
      };
      if (!sticky) return base;

      return {
        ...base,
        position: 'sticky',
        left: LEFT[key],
        zIndex: z,
        boxShadow: '1px 0 0 rgba(0,0,0,0.04)',
        borderRight: 'none',
      };
    },
    [LEFT, W]
  );

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
            {HEADERS.map((h) => {
              const active = sortConfig.key === h.key && !!sortConfig.direction;

              return (
                <TableCell
                  key={h.key}
                  align={h.align || 'left'}
                  sx={{
                    ...headCellSx(h.key, h.sortable, h.sticky),
                    ...(h.sticky ? { borderRight: 'none' } : {}),
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

                    {/* ✅ CHỈ BẤM ICON */}
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
          {rows.map((r, i) => {
            const zebra = i % 2 === 0 ? '#ffffff' : '#fafafa';
            const globalIndex = page * rowsPerPage + i + 1;

            return (
              <TableRow
                key={r.id || `${r.oldSAPCode || ''}_${i}`}
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
                    ...stickyBodySx('no', zebra, true, 3),
                  }}
                >
                  {globalIndex}
                </TableCell>

                {/* ProductType1 (sticky) */}
                <TableCell
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.4,
                    px: 0.6,
                    ...stickyBodySx('productType1Name', zebra, true, 3),
                  }}
                >
                  {r.productType1Name || '-'}
                </TableCell>

                {/* ProductType2 (sticky) */}
                <TableCell
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.4,
                    px: 0.6,
                    ...stickyBodySx('productType2Name', zebra, true, 3),
                  }}
                >
                  {r.productType2Name || '-'}
                </TableCell>

                {/* Type (sticky) */}
                <TableCell
                  align="center"
                  sx={{
                    py: 0.4,
                    px: 0.6,
                    ...stickyBodySx('type', zebra, true, 3),
                  }}
                >
                  <Box sx={{ ...tagSx, backgroundColor: getTypeColor(r.type) }}>{r.type || '—'}</Box>
                </TableCell>

                {/* Item EN (sticky) */}
                <TableCell
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.4,
                    px: 0.6,
                    ...stickyBodySx('itemDescriptionEN', zebra, true, 3),
                  }}
                >
                  {r.itemDescriptionEN || '-'}
                </TableCell>

                {/* Item VN (sticky) */}
                <TableCell
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.4,
                    px: 0.6,
                    ...stickyBodySx('itemDescriptionVN', zebra, true, 3),
                  }}
                >
                  {r.itemDescriptionVN || '-'}
                </TableCell>

                {/* Old SAP */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('oldSAPCode', zebra, false) }}
                >
                  {r.oldSAPCode || '-'}
                </TableCell>

                {/* Hana SAP */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('hanaSAPCode', zebra, false) }}
                >
                  {r.hanaSAPCode || '-'}
                </TableCell>

                {/* Supplier */}
                <TableCell
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('supplierName', zebra, false) }}
                >
                  {r.supplierName || '-'}
                </TableCell>

                {/* Depts */}
                <TableCell sx={{ py: 0.35, px: 0.6, ...stickyBodySx('departmentRequisitions', zebra, false) }}>
                  <DeptRequestTable departmentRequests={r.departmentRequisitions} />
                </TableCell>

                {/* Unit */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('unit', zebra, false) }}
                >
                  {r.unit || '-'}
                </TableCell>

                {/* Req Qty */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('totalRequestQty', zebra, false) }}
                >
                  {r.totalRequestQty || 0}
                </TableCell>

                {/* Order Qty */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('orderQty', zebra, false) }}
                >
                  {r.orderQty || 0}
                </TableCell>

                {/* Price */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('price', zebra, false) }}
                >
                  {formatCurrency(r.price, r.currency)}
                </TableCell>

                {/* Curr */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('currency', zebra, false) }}
                >
                  {r.currency || 'VND'}
                </TableCell>

                {/* Amount */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('amount', zebra, false) }}
                >
                  {formatCurrency(r.amount, r.currency)}
                </TableCell>

                {/* Created */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('createdDate', zebra, false) }}
                >
                  {r.createdDateDisplay}
                </TableCell>

                {/* Updated */}
                <TableCell
                  align="center"
                  sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx('updatedDate', zebra, false) }}
                >
                  {r.updatedDateDisplay}
                </TableCell>

                {/* Img */}
                <TableCell
                  align="center"
                  sx={{ py: 0.4, px: 0.6, ...stickyBodySx('imageUrls', zebra, false) }}
                >
                  {r.displayImageUrls?.length ? (
                    <IconButton
                      size="small"
                      onMouseEnter={(e) => onHoverImages(e, r.displayImageUrls)}
                      aria-haspopup="true"
                      sx={{ p: 0.2 }}
                    >
                      <ImageIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  ) : (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>—</Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* =========================
   Main
   ========================= */
export default function WeeklyMonthlyRequisitionsPage() {
  const theme = useTheme();
  useMediaQuery(theme.breakpoints.down('sm')); // giữ import theo project (không cần dùng)

  const cacheBust = useMemo(() => Date.now(), []);
  const imageCache = useRef(new Map());

  const API_URL = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const DEFAULT_IMG = useMemo(() => `${API_BASE_URL}/uploads/default-item.png?v=${cacheBust}`, [cacheBust]);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [loading, setLoading] = useState(false);

  const [searchValues, setSearchValues] = useState({
    groupName: '',
    groupId: '',
    typeId: '',
    startDate: '',
    endDate: '',
    productType1Id: null,
    productType1Name: '',
    productType2Id: null,
    productType2Name: '',
    englishName: '',
    vietnameseName: '',
    oldSapCode: '',
    hanaSapCode: '',
  });

  // ✅ giống GroupRequestPage: sortConfig {key, direction}
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [popover, setPopover] = useState({ anchor: null, images: [] });
  const [imgErr, setImgErr] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const normalizeImg = useCallback(
    (url) => {
      if (!url) return null;
      const key = `url_${url}`;
      if (imageCache.current.has(key)) return imageCache.current.get(key);

      const final = url.startsWith('http')
        ? `${url}?t=${cacheBust}`
        : url.startsWith('/uploads/')
          ? `${API_BASE_URL}${url}?t=${cacheBust}`
          : `${API_URL}/uploads/${url.replace(/^\/?[Uu]ploads\//i, '')}?t=${cacheBust}`;

      imageCache.current.set(key, final);
      return final;
    },
    [cacheBust, API_URL]
  );

  const processed = useMemo(
    () =>
      (data || []).map((r) => ({
        ...r,
        displayImageUrls: (r.imageUrls || []).map(normalizeImg).filter(Boolean),
        departmentRequisitions: (r.departmentRequisitions || []).map((d) => ({
          name: d.name || '—',
          qty: d.qty || 0,
          buy: d.buy || 0,
        })),
        createdDateDisplay: formatDate(r.createdDate),
        updatedDateDisplay: formatDate(r.updatedDate),
      })),
    [data, normalizeImg]
  );

  const sortLabel = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return 'updatedDate,desc';
    const backendKey = HEADERS.find((h) => h.key === sortConfig.key)?.backendKey || sortConfig.key;
    return `${backendKey},${sortConfig.direction}`;
  }, [sortConfig]);

  /* =========================
     ✅ Fetch data (support overrides like GroupRequestPage)
     ========================= */
  const fetchData = useCallback(
    async (overrides = {}) => {
      const effPage = Number.isInteger(overrides.page) ? overrides.page : page;
      const effSize = Number.isInteger(overrides.size) ? overrides.size : rowsPerPage;
      const effSearch = overrides.searchValues ?? searchValues;
      const effSort = overrides.sortConfig ?? sortConfig;

      const sortParam =
        effSort?.key && effSort?.direction
          ? `${HEADERS.find((h) => h.key === effSort.key)?.backendKey || effSort.key},${effSort.direction}`
          : 'updatedDate,desc';

      setLoading(true);
      try {
        const params = {
          groupId: effSearch.groupId || undefined,
          typeId: effSearch.typeId || undefined,
          startDate: effSearch.startDate ? new Date(effSearch.startDate).toISOString().slice(0, 19) : undefined,
          endDate: effSearch.endDate ? new Date(effSearch.endDate).toISOString().slice(0, 19) : undefined,
          productType1Id: effSearch.productType1Id || undefined,
          productType2Id: effSearch.productType2Id || undefined,
          englishName: effSearch.englishName?.trim() || undefined,
          vietnameseName: effSearch.vietnameseName?.trim() || undefined,
          oldSapCode: effSearch.oldSapCode?.trim() || undefined,
          hanaSapCode: effSearch.hanaSapCode?.trim() || undefined,
          page: effPage,
          size: effSize,
          sort: sortParam,
        };

        const res = await axios.get(`${API_BASE_URL}/api/requisitions/search_2`, { params });
        const content = res.data?.content || [];

        // ✅ client fallback sort để đảm bảo bấm icon là UI đổi thứ tự
        const finalData = sortRowsClient(content, effSort);

        setData(finalData);
        setTotal(res.data?.totalElements || 0);
      } catch (err) {
        setSnack({
          open: true,
          msg: 'Load failed: ' + (err.response?.data?.message || err.message),
          sev: 'error',
        });
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage, searchValues, sortConfig]
  );

  // initial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ giống GroupRequestPage: khi page/rowsPerPage đổi => fetch ngay
  useEffect(() => {
    fetchData({ page, size: rowsPerPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  /* =========================
     ✅ Sort: bấm icon (asc -> desc -> none) + fetch ngay
     ========================= */
  const handleSort = useCallback(
    (key) => {
      if (loading) return;
      const meta = HEADERS.find((h) => h.key === key);
      if (!meta?.sortable) return;

      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;

      const nextSort = { key: direction ? key : null, direction };
      setSortConfig(nextSort);
      setPage(0);

      // ✅ fetch ngay
      fetchData({ page: 0, sortConfig: nextSort });
    },
    [loading, sortConfig, fetchData]
  );

  const onSearch = useCallback(
    (nextSearch) => {
      const eff = nextSearch ?? searchValues;
      setSearchValues(eff);
      setPage(0);
      fetchData({ page: 0, searchValues: eff });
    },
    [fetchData, searchValues]
  );

  const onReset = useCallback(() => {
    const cleared = {
      groupName: '',
      groupId: '',
      typeId: '',
      startDate: '',
      endDate: '',
      productType1Id: null,
      productType1Name: '',
      productType2Id: null,
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSapCode: '',
      hanaSapCode: '',
    };
    const defaultSort = { key: null, direction: null };

    setSearchValues(cleared);
    setSortConfig(defaultSort);
    setPage(0);
    fetchData({ page: 0, searchValues: cleared, sortConfig: defaultSort });
  }, [fetchData]);

  const openPopover = (event, images) => setPopover({ anchor: event.currentTarget, images: images || [] });
  const closePopover = () => setPopover({ anchor: null, images: [] });

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
                Weekly & Monthly Requisitions
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                Sort: <span style={{ color: '#111827' }}>{sortLabel}</span>
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Search box */}
        <WeeklyMonthlyGroupSearch
          searchValues={searchValues}
          onSearchChange={setSearchValues}
          onSearch={onSearch}
          onReset={onReset}
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
            <WeeklyMonthlyTable
              rows={processed}
              page={page}
              rowsPerPage={rowsPerPage}
              sortConfig={sortConfig}
              loading={loading}
              onSort={handleSort}
              onHoverImages={openPopover}
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

        {/* Image popover */}
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
                      onError={() => setImgErr((p) => ({ ...p, [src]: true }))}
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
