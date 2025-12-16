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
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (currency === 'VND') return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
  if (currency === 'USD') return `$${Number(value).toFixed(0)}`;
  if (currency === 'EUR') return `€${Number(value).toFixed(0)}`;
  return Number(value).toFixed(0);
};

const getTypeColor = (t) => (t === 'WEEKLY' ? '#2563eb' : '#16a34a');

/* =========================
   DeptRequestTable (match SummaryPage style)
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
   PaginationBar (copied UX from SummaryPage)
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
   Headers + sticky left offsets
   ========================= */
const HEADERS = [
  { label: 'No', key: 'no', align: 'center', width: 50, sticky: true },
  { label: 'Product Type 1', key: 'productType1Name', sortable: true, width: 120, sticky: true, wrap: true },
  { label: 'Product Type 2', key: 'productType2Name', sortable: true, width: 120, sticky: true, wrap: true },
  { label: 'Type', key: 'type', sortable: true, align: 'center', width: 90, sticky: true },
  { label: 'Item (EN)', key: 'itemDescriptionEN', sortable: true, width: 170, sticky: true, wrap: true },
  { label: 'Item (VN)', key: 'itemDescriptionVN', sortable: true, width: 170, sticky: true, wrap: true },
  { label: 'Old SAP', key: 'oldSAPCode', sortable: true, align: 'center', width: 100 },
  { label: 'Hana SAP', key: 'hanaSAPCode', sortable: true, align: 'center', width: 110 },
  { label: 'Supplier', key: 'supplierName', sortable: true, width: 160, wrap: true },
  { label: 'Depts', key: 'departmentRequisitions', width: 240 },
  { label: 'Unit', key: 'unit', sortable: true, align: 'center', width: 70 },
  { label: 'Req Qty', key: 'totalRequestQty', sortable: true, align: 'center', width: 90 },
  { label: 'Order Qty', key: 'orderQty', sortable: true, align: 'center', width: 90 },
  { label: 'Price', key: 'price', sortable: true, align: 'center', width: 90 },
  { label: 'Curr', key: 'currency', sortable: true, align: 'center', width: 70 },
  { label: 'Amount', key: 'amount', sortable: true, align: 'center', width: 110 },
  { label: 'Created', key: 'createdDate', sortable: true, align: 'center', width: 110 },
  { label: 'Updated', key: 'updatedDate', sortable: true, align: 'center', width: 110 },
  { label: 'Img', key: 'imageUrls', align: 'center', width: 70 },
];

let leftOffset = 0;
HEADERS.forEach((h) => {
  if (h.sticky) {
    h.left = leftOffset;
    leftOffset += h.width;
  }
});
const gridTemplate = HEADERS.map((h) => `${h.width}px`).join(' ');

/* =========================
   Main
   ========================= */
export default function WeeklyMonthlyRequisitionsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  // tri-state: null/null => fallback updatedDate,desc
  const [sort, setSort] = useState({ key: null, dir: null });

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

  const sortParam = useMemo(() => {
    if (sort?.key && sort?.dir) return `${sort.key},${sort.dir}`;
    return 'updatedDate,desc';
  }, [sort]);

  const fetchData = useCallback(
    async (overrides = {}) => {
      const effPage = Number.isInteger(overrides.page) ? overrides.page : page;
      const effSize = Number.isInteger(overrides.size) ? overrides.size : rowsPerPage;
      const effSearch = overrides.searchValues ?? searchValues;
      const effSort = overrides.sort ?? sort;
      const effSortParam = effSort?.key && effSort?.dir ? `${effSort.key},${effSort.dir}` : 'updatedDate,desc';

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
          sort: effSortParam,
        };

        const res = await axios.get(`${API_BASE_URL}/api/requisitions/search_2`, { params });
        setData(res.data?.content || []);
        setTotal(res.data?.totalElements || 0);
      } catch (err) {
        setSnack({
          open: true,
          msg: 'Load failed: ' + (err.response?.data?.message || err.message),
          sev: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage, searchValues, sort]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sort indicator (always visible like SummaryPage)
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

  // click header -> asc -> desc -> none (fallback)
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

  // search from WeeklyMonthlyGroupSearch (don’t add duplicate buttons here)
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
    const defaultSort = { key: null, dir: null };

    setSearchValues(cleared);
    setSort(defaultSort);
    setPage(0);
    fetchData({ page: 0, searchValues: cleared, sort: defaultSort });
  }, [fetchData]);

  const openPopover = (event, images) => setPopover({ anchor: event.currentTarget, images: images || [] });
  const closePopover = () => setPopover({ anchor: null, images: [] });

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
                Sort: <span style={{ color: '#111827' }}>{sortParam}</span>
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Search box (already has Search/Reset buttons) */}
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

        {/* Table */}
        {!loading && (
          <>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 1.5,
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ maxHeight: 650, overflow: 'auto' }}>
                {/* Header */}
                <Box
                  display="grid"
                  gridTemplateColumns={gridTemplate}
                  position="sticky"
                  top={0}
                  zIndex={22}
                  sx={{
                    backgroundColor: '#f3f4f6',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  {HEADERS.map((h) => {
                    const sticky = !isMobile && h.sticky;
                    return (
                      <Box
                        key={h.key}
                        onClick={() => h.sortable && handleSort(h.key)}
                        sx={{
                          py: 0.6,
                          px: 0.7,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: '#111827',
                          textAlign: h.align || 'left',
                          whiteSpace: h.wrap ? 'normal' : 'nowrap',
                          wordBreak: h.wrap ? 'break-word' : 'normal',
                          cursor: h.sortable ? 'pointer' : 'default',
                          position: sticky ? 'sticky' : 'relative',
                          left: sticky ? h.left : 'auto',
                          zIndex: sticky ? 21 : 20,
                          backgroundColor: '#f3f4f6',
                          borderRight: '1px solid #eef2f7',
                          '&:last-child': { borderRight: 'none' },
                          '&:hover': h.sortable ? { backgroundColor: '#eef2f7' } : {},
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.6}
                          alignItems="center"
                          justifyContent={h.align === 'center' ? 'center' : 'flex-start'}
                        >
                          <Tooltip title={h.label} arrow>
                            <span>{h.label}</span>
                          </Tooltip>
                          {h.sortable ? renderSortIndicator(h.key) : null}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>

                {/* Body */}
                <Box>
                  {processed.length ? (
                    processed.map((r, i) => {
                      const globalIndex = page * rowsPerPage + i + 1;
                      const rowBg = i % 2 === 0 ? '#ffffff' : '#fafafa';

                      return (
                        <Box
                          key={r.id || `${r.oldSAPCode || ''}_${i}`}
                          display="grid"
                          gridTemplateColumns={gridTemplate}
                          sx={{
                            backgroundColor: rowBg,
                            borderBottom: '1px solid #f3f4f6',
                            '&:hover': { backgroundColor: '#f1f5f9' },
                          }}
                        >
                          {HEADERS.map((h) => {
                            const sticky = !isMobile && h.sticky;
                            return (
                              <Box
                                key={h.key}
                                sx={{
                                  py: 0.45,
                                  px: 0.7,
                                  fontSize: '0.75rem',
                                  fontWeight: 400,
                                  lineHeight: 1.4,
                                  textAlign: h.align || 'left',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  position: sticky ? 'sticky' : 'relative',
                                  left: sticky ? h.left : 'auto',
                                  zIndex: sticky ? 2 : 'auto',
                                  backgroundColor: rowBg,
                                  borderRight: '1px solid #f8fafc',
                                  '&:last-child': { borderRight: 'none' },
                                  color: '#111827',
                                }}
                              >
                                {h.key === 'no' && <Box textAlign="center" fontWeight={700}>{globalIndex}</Box>}

                                {h.key === 'type' && (
                                  <Box sx={{ ...tagSx, backgroundColor: getTypeColor(r.type) }}>
                                    {r.type || '—'}
                                  </Box>
                                )}

                                {h.key === 'productType1Name' && (r.productType1Name || '-')}
                                {h.key === 'productType2Name' && (r.productType2Name || '-')}
                                {h.key === 'itemDescriptionVN' && (r.itemDescriptionVN || '-')}
                                {h.key === 'itemDescriptionEN' && (r.itemDescriptionEN || '-')}
                                {h.key === 'oldSAPCode' && (r.oldSAPCode || '-')}
                                {h.key === 'hanaSAPCode' && (r.hanaSAPCode || '-')}
                                {h.key === 'supplierName' && (r.supplierName || '-')}

                                {h.key === 'departmentRequisitions' && (
                                  <DeptRequestTable departmentRequests={r.departmentRequisitions} />
                                )}

                                {h.key === 'unit' && <Box textAlign="center">{r.unit || '-'}</Box>}
                                {h.key === 'totalRequestQty' && <Box textAlign="center">{r.totalRequestQty || 0}</Box>}
                                {h.key === 'orderQty' && <Box textAlign="center">{r.orderQty || 0}</Box>}

                                {h.key === 'price' && (
                                  <Box textAlign="center">{formatCurrency(r.price, r.currency)}</Box>
                                )}

                                {h.key === 'currency' && <Box textAlign="center">{r.currency || 'VND'}</Box>}

                                {h.key === 'amount' && (
                                  <Box textAlign="center">{formatCurrency(r.amount, r.currency)}</Box>
                                )}

                                {h.key === 'createdDate' && <Box textAlign="center">{r.createdDateDisplay}</Box>}
                                {h.key === 'updatedDate' && <Box textAlign="center">{r.updatedDateDisplay}</Box>}

                                {h.key === 'imageUrls' && (
                                  r.displayImageUrls.length ? (
                                    <IconButton
                                      size="small"
                                      onMouseEnter={(e) => openPopover(e, r.displayImageUrls)}
                                      aria-haspopup="true"
                                      sx={{ p: 0.2 }}
                                    >
                                      <ImageIcon sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                  ) : (
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center' }}>
                                      —
                                    </Typography>
                                  )
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      );
                    })
                  ) : (
                    <Box p={3} textAlign="center" sx={{ color: 'text.secondary' }}>
                      <InboxIcon sx={{ fontSize: 30, opacity: 0.6 }} />
                      <Typography sx={{ fontSize: '0.85rem' }}>No data</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Pagination (SummaryPage UX) */}
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

        {/* Image popover (hover + scroll like SummaryPage) */}
        <Popover
          open={!!popover.anchor}
          anchorEl={popover.anchor}
          onClose={closePopover}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          disableRestoreFocus
          sx={{ pointerEvents: 'auto' }}
        >
          <Box
            p={1}
            sx={{ maxWidth: 280, maxHeight: 280, overflowY: 'auto' }}
            onMouseLeave={closePopover}
          >
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
