// src/pages/group/GroupRequestPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UpdateStatusGroup from './UpdateStatusGroup';
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
  Button,
  useTheme,
  useMediaQuery,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
} from '@mui/material';

import {
  Add,
  Edit,
  Delete,
  Visibility,
  ArrowUpward,
  ArrowDownward,
  Close,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupSearchBar from './GroupSearchBar';
import { API_BASE_URL } from '../../config';

/* =========================
   Axios client
   ========================= */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: '*/*', 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* =========================
   Helpers (match SupplierProductsPage style)
   ========================= */
const formatDateISO = (dateInput) => {
  if (!dateInput) return '-';

  let d;
  if (Array.isArray(dateInput)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
    d = dayjs(new Date(year, month - 1, day, hour, minute, second));
  } else if (typeof dateInput === 'string') {
    d = dayjs(dateInput);
  } else {
    return '-';
  }

  if (!d.isValid()) return '-';
  return d.format('DD/MM/YYYY');
};

const getTypeColor = (type) =>
  ({ Requisition_monthly: '#2563eb', Requisition_weekly: '#dc2626' }[type] || '#6b7280');

const getCurrencyColor = (currency) =>
  ({ VND: '#16a34a', EUR: '#2563eb', EURO: '#2563eb', USD: '#dc2626' }[currency] || '#6b7280');

const tagPillSx = {
  padding: '2px 8px',
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#fff',
  display: 'inline-flex',
  justifyContent: 'center',
  minWidth: 78,
  mx: 'auto',
};

/* =========================
   Headers
   ========================= */
const headers = [
  { label: 'No', key: 'no', sortable: false, hideOnSmall: false, backendKey: 'no' },
  { label: 'Name', key: 'name', sortable: true, hideOnSmall: false, backendKey: 'name' },
  { label: 'Type', key: 'type', sortable: true, hideOnSmall: false, backendKey: 'type' },
  { label: 'Status', key: 'status', sortable: true, hideOnSmall: false, backendKey: 'status' },
  { label: 'Created By', key: 'createdBy', sortable: true, hideOnSmall: true, backendKey: 'createdBy' },
  { label: 'Created Date', key: 'createdDate', sortable: true, hideOnSmall: false, backendKey: 'createdDate' },
  { label: 'Currency', key: 'currency', sortable: true, hideOnSmall: true, backendKey: 'currency' },
  { label: 'Actions', key: 'actions', sortable: false, hideOnSmall: false, backendKey: 'actions' },
];

/* =========================
   API functions
   ========================= */
const fetchGroups = async (
  page = 0,
  limit = 12,
  name = '',
  status = '',
  createdBy = '',
  type = '',
  currency = '',
  startDate = null,
  endDate = null,
  stockStartDate = null,
  stockEndDate = null,
  sort = 'createdDate,desc'
) => {
  try {
    const params = new URLSearchParams({
      page,
      size: limit,
      name: name || '',
      status: status || '',
      createdBy: createdBy || '',
      type: type || '',
      currency: currency || '',
      sort,
    });

    if (startDate && startDate.isValid()) params.append('startDate', startDate.format('YYYY-MM-DD'));
    if (endDate && endDate.isValid()) params.append('endDate', endDate.format('YYYY-MM-DD'));

    const response = await apiClient.get(`/api/group-summary-requisitions/filter`, { params });
    return {
      content: response.data.content || [],
      totalElements: response.data.totalElements || 0,
      totalPages: response.data.totalPages || 1,
    };
  } catch (error) {
    console.error('Error fetching groups:', error.response?.data || error.message);
    return { content: [], totalElements: 0, totalPages: 1 };
  }
};

const deleteGroup = async (id) => {
  try {
    const response = await apiClient.delete(`/api/group-summary-requisitions/${id}`);
    return { success: true, message: response.data?.message || 'Group deleted successfully' };
  } catch (error) {
    console.error('Error deleting group:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Failed to delete group' };
  }
};

/* =========================
   ✅ Sorting helpers (CLIENT fallback) — giống Monthly
   ========================= */
const toTimestamp = (v) => {
  if (!v) return 0;
  if (Array.isArray(v)) {
    const [y, m, d, hh = 0, mm = 0, ss = 0] = v;
    const dt = new Date(y, m - 1, d, hh, mm, ss);
    const t = dt.getTime();
    return Number.isFinite(t) ? t : 0;
  }
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};

const getComparableValue = (row, key) => {
  const dateKeys = new Set(['createdDate']);
  if (dateKeys.has(key)) return toTimestamp(row?.[key]);

  // mặc định string
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
   Sort indicator (tri-state like SupplierProductsPage)
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
   PaginationBar (same as SupplierProductsPage)
   ========================= */
function PaginationBar({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange, loading }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / (rowsPerPage || 1)));
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count || 0, (page + 1) * rowsPerPage);

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
            {[10, 12, 20, 50].map((n) => (
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
   Page
   ========================= */
export default function GroupRequestPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const btnSx = useMemo(() => ({ textTransform: 'none', fontWeight: 400 }), []);

  const [data, setData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [stockDateRange, setStockDateRange] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isLargeScreen ? 20 : 12);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const pageWrapSx = useMemo(
    () => ({
      bgcolor: '#f7f7f7',
      minHeight: '100vh',
      p: 1.5,
    }),
    []
  );

  /* =========================
     ✅ Fetch data (support overrides like Monthly)
     ========================= */
  const fetchData = useCallback(
    async (overrides = {}) => {
      setLoading(true);

      const effPage = Number.isInteger(overrides.page) ? overrides.page : page;
      const effSize = Number.isInteger(overrides.size) ? overrides.size : rowsPerPage;
      const effSort = overrides.sortConfig ?? sortConfig;

      const effName = overrides.nameFilter ?? nameFilter;
      const effStatus = overrides.statusFilter ?? statusFilter;
      const effCreatedBy = overrides.createdByFilter ?? createdByFilter;
      const effType = overrides.typeFilter ?? typeFilter;
      const effCurrency = overrides.currencyFilter ?? currencyFilter;
      const effDateRange = overrides.dateRange ?? dateRange;

      const [startDate, endDate] = effDateRange || [];

      const sortParam = effSort.key && effSort.direction
        ? `${headers.find((h) => h.key === effSort.key)?.backendKey || effSort.key},${effSort.direction}`
        : 'createdDate,desc';

      const { content, totalElements: te, totalPages: tp } = await fetchGroups(
        effPage,
        effSize,
        effName,
        effStatus,
        effCreatedBy,
        effType,
        effCurrency,
        startDate,
        endDate,
        null,
        null,
        sortParam
      );

      // ✅ client fallback sort để đảm bảo bấm icon là UI đổi thứ tự (trong page hiện tại)
      const finalData = sortRowsClient(content, effSort);

      setData(finalData);
      setTotalElements(te);
      setTotalPages(tp);

      setLoading(false);
    },
    [page, rowsPerPage, nameFilter, statusFilter, createdByFilter, typeFilter, currencyFilter, dateRange, sortConfig]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotification({ open: true, message: 'Please login to access this page.', severity: 'error' });
      navigate('/login');
      return;
    }
    fetchData();
  }, [fetchData, navigate, location]);

  useEffect(() => {
    setRowsPerPage(isLargeScreen ? 20 : 12);
    setPage(0);
  }, [isLargeScreen]);

  // ✅ NEW: khi page/rowsPerPage đổi, fetch ngay (đỡ phụ thuộc useEffect phức tạp)
  useEffect(() => {
    fetchData({ page, size: rowsPerPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const handleAddOk = () => {
    setIsAddModalOpen(false);
    fetchData({ page: 0 });
  };

  const handleEditOk = () => {
    setIsEditModalOpen(false);
    setCurrentItem(null);
    fetchData({ page });
  };

  const handleDelete = (group) => {
    setSelectedGroup(group);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGroup) {
      setNotification({ open: true, message: 'No group selected for deletion', severity: 'error' });
      setDeleteDialogOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { success, message } = await deleteGroup(selectedGroup.id);

      if (success) {
        const maxPage = Math.max(0, Math.ceil((totalElements - 1) / rowsPerPage) - 1);
        if (page > maxPage) {
          setPage(maxPage);
          await fetchData({ page: maxPage });
        } else {
          await fetchData({ page });
        }
      }

      setNotification({ open: true, message, severity: success ? 'success' : 'error' });
    } catch (error) {
      setNotification({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedGroup(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleSearch = () => {
    setPage(0);
    setSortConfig({ key: null, direction: null });
    fetchData({ page: 0, sortConfig: { key: null, direction: null } });
  };

  const handleReset = () => {
    const cleared = {
      nameFilter: '',
      statusFilter: '',
      createdByFilter: '',
      typeFilter: '',
      currencyFilter: '',
      dateRange: [],
      stockDateRange: [],
    };

    setNameFilter('');
    setStatusFilter('');
    setCreatedByFilter('');
    setTypeFilter('');
    setCurrencyFilter('');
    setDateRange([]);
    setStockDateRange([]);
    setPage(0);
    setSortConfig({ key: null, direction: null });

    fetchData({
      page: 0,
      sortConfig: { key: null, direction: null },
      ...cleared,
    });
  };

  /* =========================
     ✅ Sort: bấm icon (asc -> desc -> none) + fetch ngay
     ========================= */
  const handleSort = useCallback(
    (key) => {
      if (loading) return;
      const meta = headers.find((h) => h.key === key);
      if (!meta?.sortable) return;

      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;

      const nextSort = { key: direction ? key : null, direction };
      setSortConfig(nextSort);
      setPage(0);

      // ✅ fetch ngay (không chờ render)
      fetchData({ page: 0, sortConfig: nextSort });
    },
    [loading, sortConfig, fetchData]
  );

  const sortLabel = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return 'createdDate,desc';
    const backendKey = headers.find((h) => h.key === sortConfig.key)?.backendKey || sortConfig.key;
    return `${backendKey},${sortConfig.direction}`;
  }, [sortConfig]);

  const hasActiveSearch = useMemo(
    () => [nameFilter, statusFilter, createdByFilter, typeFilter, currencyFilter].some((v) => (v || '').trim()),
    [nameFilter, statusFilter, createdByFilter, typeFilter, currencyFilter]
  );

  const handleCloseNotification = () => setNotification({ open: false, message: '', severity: 'info' });

  return (
    <Box sx={pageWrapSx}>
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
          <Stack spacing={0.35}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Group</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              Total: {totalElements} • {hasActiveSearch ? 'Filter: active' : 'Filter: none'} • Sort:{' '}
              <span style={{ color: '#111827' }}>{sortLabel}</span>
            </Typography>
          </Stack>

          <Button
            variant="contained"
            startIcon={<Add fontSize="small" />}
            onClick={() => setIsAddModalOpen(true)}
            disabled={loading}
            sx={{
              ...btnSx,
              borderRadius: 1.2,
              height: 34,
              px: 1.25,
              backgroundColor: '#111827',
              '&:hover': { backgroundColor: '#0b1220' },
            }}
          >
            Add Request Group
          </Button>
        </Stack>
      </Paper>

      {/* Search card */}
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
        <Box
          sx={{
            border: '1px solid #e5e7eb',
            borderRadius: 1.5,
            p: 1.25,
            backgroundColor: '#fafafa',
          }}
        >
          <GroupSearchBar
            nameFilter={nameFilter}
            statusFilter={statusFilter}
            createdByFilter={createdByFilter}
            typeFilter={typeFilter}
            currencyFilter={currencyFilter}
            setNameFilter={setNameFilter}
            setStatusFilter={setStatusFilter}
            setCreatedByFilter={setCreatedByFilter}
            setTypeFilter={setTypeFilter}
            setCurrencyFilter={setCurrencyFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            stockDateRange={stockDateRange}
            setStockDateRange={setStockDateRange}
            setPage={setPage}
            handleSearch={handleSearch}
            handleReset={handleReset}
          />
        </Box>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1.5,
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          overflow: 'hidden',
        }}
      >
        <TableContainer
          sx={{
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: '8px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '8px' },
          }}
        >
          <Table stickyHeader size="small" sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                {headers.map(({ label, key, sortable, hideOnSmall }) => {
                  const align = ['No', 'Status', 'Currency', 'Actions'].includes(label) ? 'center' : 'left';
                  const active = sortConfig.key === key && !!sortConfig.direction;

                  const stickyNo = key === 'no';
                  const hideXs = hideOnSmall ? { display: { xs: 'none', md: 'table-cell' } } : {};

                  return (
                    <TableCell
                      key={key}
                      align={align}
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#111827',
                        backgroundColor: '#f3f4f6',
                        borderBottom: '1px solid #e5e7eb',
                        py: 0.6,
                        px: 0.7,
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        ...(stickyNo && {
                          position: 'sticky',
                          left: 0,
                          zIndex: 3,
                          width: 64,
                        }),
                        ...(key === 'actions' && { width: 140 }),
                        ...hideXs,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.6}
                        alignItems="center"
                        justifyContent={align === 'center' ? 'center' : 'flex-start'}
                      >
                        <Tooltip title={label} arrow>
                          <span>{label}</span>
                        </Tooltip>

                        {/* ✅ Chỉ bấm icon sort mới đổi sort */}
                        {sortable ? (
                          <Tooltip title="Sort" arrow>
                            <span>
                              <IconButton
                                size="small"
                                disabled={loading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSort(key);
                                }}
                                sx={{
                                  p: 0.25,
                                  border: '1px solid transparent',
                                  '&:hover': { borderColor: '#e5e7eb', backgroundColor: '#eef2f7' },
                                }}
                                aria-label={`sort-${key}`}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={headers.length} sx={{ py: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <CircularProgress size={18} />
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Loading data...</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((group, idx) => {
                  const zebra = idx % 2 === 0 ? '#ffffff' : '#fafafa';
                  const isCompleted = group.status === 'Completed';

                  const typeColor = getTypeColor(group.type);
                  const curColor = getCurrencyColor(group.currency);

                  return (
                    <TableRow
                      key={group.id}
                      sx={{
                        backgroundColor: zebra,
                        '&:hover': { backgroundColor: '#f1f5f9' },
                        '& > *': { borderBottom: '1px solid #f3f4f6' },
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.45,
                          px: 0.7,
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          backgroundColor: zebra,
                          color: '#111827',
                        }}
                      >
                        {page * rowsPerPage + idx + 1}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.45,
                          px: 0.7,
                          color: '#111827',
                          fontWeight: 500,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {group.name || ''}
                      </TableCell>

                      <TableCell sx={{ py: 0.45, px: 0.7 }}>
                        <Box
                          sx={{
                            ...tagPillSx,
                            backgroundColor: typeColor,
                          }}
                          title={group.type || 'Unknown'}
                        >
                          {group.type === 'Requisition_monthly'
                            ? 'Monthly'
                            : group.type === 'Requisition_weekly'
                            ? 'Weekly'
                            : 'Unknown'}
                        </Box>
                      </TableCell>

                      <TableCell align="center" sx={{ py: 0.45, px: 0.7 }}>
                        <UpdateStatusGroup
                          groupId={group.id}
                          currentStatus={group.status || 'Not Started'}
                          onSuccess={() => fetchData({ page })}
                          userRole={localStorage.getItem('role') || ''}
                        />
                      </TableCell>

                      <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.45,
                          px: 0.7,
                          color: '#374151',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          display: {
                            xs: headers.find((h) => h.key === 'createdBy')?.hideOnSmall ? 'none' : 'table-cell',
                            md: 'table-cell',
                          },
                        }}
                      >
                        {group.createdBy || ''}
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.75rem', py: 0.45, px: 0.7, color: '#374151' }}>
                        {formatDateISO(group.createdDate)}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          py: 0.45,
                          px: 0.7,
                          display: {
                            xs: headers.find((h) => h.key === 'currency')?.hideOnSmall ? 'none' : 'table-cell',
                            md: 'table-cell',
                          },
                        }}
                      >
                        <Box sx={{ ...tagPillSx, backgroundColor: curColor }}>{group.currency || 'N/A'}</Box>
                      </TableCell>

                      <TableCell align="center" sx={{ py: 0.45, px: 0.7 }}>
                        <Stack direction="row" spacing={0.4} justifyContent="center">
                          <Tooltip title="View details" arrow>
                            <span>
                              <IconButton
                                color="primary"
                                size="small"
                                sx={{ p: 0.25 }}
                                onClick={() => {
                                  if (group.type === 'Requisition_monthly') navigate(`/requisition-monthly/${group.id}`);
                                  else navigate(`/summary/${group.id}`);
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title={isCompleted ? 'Completed: cannot edit' : 'Edit group'} arrow>
                            <span>
                              <IconButton
                                color="primary"
                                size="small"
                                sx={{ p: 0.25 }}
                                disabled={isCompleted}
                                onClick={() => {
                                  setCurrentItem(group);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title={isCompleted ? 'Completed: cannot delete' : 'Delete group'} arrow>
                            <span>
                              <IconButton
                                color="error"
                                size="small"
                                sx={{ p: 0.25 }}
                                disabled={loading || isCompleted}
                                onClick={() => handleDelete(group)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length} sx={{ py: 3 }}>
                    <Stack direction="column" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                      <InboxIcon sx={{ fontSize: 30, opacity: 0.6 }} />
                      <Typography sx={{ fontSize: '0.85rem' }}>
                        {hasActiveSearch ? 'No groups found matching your search.' : 'No data'}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />

        {/* PaginationBar */}
        <Box sx={{ p: 1.0, backgroundColor: '#fff' }}>
          <PaginationBar
            count={totalElements}
            page={page}
            rowsPerPage={rowsPerPage}
            loading={loading}
            onPageChange={(p) => setPage(p)}
            onRowsPerPageChange={(size) => {
              setRowsPerPage(size);
              setPage(0);
            }}
          />
        </Box>
      </Paper>

      {/* Toast */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4500}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ fontSize: '0.85rem' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Add/Edit modals */}
      <AddGroupModal open={isAddModalOpen} onCancel={() => setIsAddModalOpen(false)} onOk={handleAddOk} />
      <EditGroupModal
        open={isEditModalOpen}
        currentItem={currentItem}
        onCancel={() => {
          setIsEditModalOpen(false);
          setCurrentItem(null);
        }}
        onOk={handleEditOk}
      />

      {/* Delete dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={loading ? undefined : handleCancelDelete}
        PaperProps={{ sx: { borderRadius: 1.5, border: '1px solid #e5e7eb' } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ px: 1.5, py: 1.1, borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Delete group</Typography>
            <IconButton
              size="small"
              onClick={handleCancelDelete}
              disabled={loading}
              sx={{ border: '1px solid #e5e7eb' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 1.5, backgroundColor: '#fff' }}>
          <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>
            Are you sure you want to delete <strong>{selectedGroup?.name || 'Unknown'}</strong>?
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: '0.78rem', color: 'text.secondary' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 1.5, py: 1.1, borderTop: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <Button onClick={handleCancelDelete} disabled={loading} sx={btnSx}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={loading} sx={btnSx}>
            {loading ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
