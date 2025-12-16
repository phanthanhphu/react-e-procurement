// src/pages/SummaryPage/SummaryPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Popover,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import InboxIcon from '@mui/icons-material/Inbox';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import ExportRequisitionWeeklyExcelButton from './ExportRequisitionWeeklyExcelButton';
import ImportExcelButton from './ImportExcelButton';
import RequisitionSearch from './RequisitionSearch';
import EditDialog from './EditDialog';
import AddDialog from './AddDialog';
import Notification from './Notification';
import { API_BASE_URL } from '../../config';

/* =========================
   Axios interceptors (once)
   ========================= */
if (!axios.__SUMMARY_PAGE_INTERCEPTORS__) {
  axios.__SUMMARY_PAGE_INTERCEPTORS__ = true;

  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

/* =========================
   Auth helpers (EMAIL)
   ========================= */
const parseJwt = (token) => {
  try {
    const part = token?.split?.('.')?.[1];
    if (!part) return null;

    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const looksLikeEmail = (v) => typeof v === 'string' && v.includes('@') && v.includes('.');

const getUserEmail = () => {
  // 1) direct keys
  const direct =
    localStorage.getItem('email') ||
    localStorage.getItem('userEmail') ||
    localStorage.getItem('username'); // nhiều hệ thống username = email

  if (direct && looksLikeEmail(String(direct).trim())) return String(direct).trim();

  // 2) decode token
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  const candidates = [payload.email, payload.userEmail, payload.username, payload.sub]
    .map((x) => (x == null ? null : String(x).trim()))
    .filter(Boolean);

  const found = candidates.find((x) => looksLikeEmail(x));
  return found || null;
};

/* =========================
   Helpers
   ========================= */
const formatCurrency = (value, currency) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (currency === 'VND') return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)} đ`;
  if (currency === 'USD') return `$${Number(value).toFixed(2)}`;
  if (currency === 'EUR') return `€${Number(value).toFixed(2)}`;
  return Number(value).toFixed(2);
};

const formatDate = (date) => {
  if (!date) return '';
  if (Array.isArray(date)) {
    const [y, m, d, hh = 0, mm = 0, ss = 0, ns = 0] = date;
    const dt = new Date(y, m - 1, d, hh, mm, ss, Math.floor(ns / 1e6));
    return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// parse boolean chuẩn (đỡ dính case "false" string)
const toBoolStrict = (v) => {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null) return false;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(s)) return true;
    if (['false', '0', 'no', 'n', ''].includes(s)) return false;
  }
  return Boolean(v);
};

/* =========================
   DeptRequestTable
   ========================= */
function DeptRequestTable({ departmentRequests }) {
  if (!departmentRequests?.length) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.72rem', color: 'text.secondary' }}>No Data</Typography>;
  }

  return (
    <Table
      size="small"
      sx={{
        minWidth: 160,
        border: '1px solid #e5e7eb',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      <TableHead>
        <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
          <TableCell sx={{ fontSize: '0.72rem', py: 0.3, px: 0.6, fontWeight: 600 }}>Name</TableCell>
          <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.3, px: 0.6, fontWeight: 600 }}>
            Request
          </TableCell>
          <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.3, px: 0.6, fontWeight: 600 }}>
            Buy
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {departmentRequests.map((d, i) => (
          <TableRow key={i} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
            <TableCell sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>{d.departmentName || ''}</TableCell>
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
            sx={{ height: 32, minWidth: 90, borderRadius: 1.2, '& .MuiSelect-select': { fontSize: '0.8rem' } }}
          >
            {[10, 25, 50, 100].map((n) => (
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
   Headers
   ========================= */
const HEADERS = [
  { label: 'Select', key: 'select', sortable: false },
  { label: 'No', key: 'no', sortable: false },
  { label: 'Product Type 1', key: 'productType1Name', sortable: true, backendKey: 'productType1Name' },
  { label: 'Product Type 2', key: 'productType2Name', sortable: true, backendKey: 'productType2Name' },
  { label: 'Item (EN)', key: 'englishName', sortable: true, backendKey: 'englishName' },
  { label: 'Item (VN)', key: 'vietnameseName', sortable: true, backendKey: 'vietnameseName' },
  { label: 'Old SAP', key: 'oldSapCode', sortable: true, backendKey: 'oldSapCode' },
  { label: 'Hana SAP', key: 'hanaSapCode', sortable: true, backendKey: 'hanaSapCode' },
  { label: 'Unit', key: 'unit', sortable: true, backendKey: 'unit' },
  { label: 'Department', key: 'departmentRequests', sortable: false },
  { label: 'Request Qty', key: 'requestQty', sortable: true, backendKey: 'totalRequestQty' },
  { label: 'Order Qty', key: 'orderQty', sortable: true, backendKey: 'orderQty' },
  { label: 'Supplier', key: 'supplierName', sortable: true, backendKey: 'supplierName' },
  { label: 'Price', key: 'price', sortable: true, backendKey: 'price' },
  { label: 'Currency', key: 'currency', sortable: true, backendKey: 'currency' },
  { label: 'Amount', key: 'amount', sortable: true, backendKey: 'totalPrice' },
  { label: 'Reason', key: 'reason', sortable: true, backendKey: 'reason' },
  { label: 'Remark', key: 'remark', sortable: true, backendKey: 'remark' },
  { label: 'Good Type', key: 'goodType', sortable: true, backendKey: 'goodType' },
  { label: 'Created', key: 'createdDate', sortable: true, backendKey: 'createdDate' },
  { label: 'Updated', key: 'updatedDate', sortable: true, backendKey: 'updatedDate' },
  { label: 'Completed', key: 'completedDate', sortable: false },
  { label: 'Images', key: 'image', sortable: false },
  { label: 'Actions', key: 'actions', sortable: false },
];

export default function SummaryPage() {
  const theme = useTheme();
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [groupStatus, setGroupStatus] = useState(null);
  const [totalElements, setTotalElements] = useState(0);

  const [searchValues, setSearchValues] = useState({
    productType1Name: '',
    productType2Name: '',
    englishName: '',
    vietnameseName: '',
    oldSapCode: '',
    hanaSapCode: '',
    supplierName: '',
    departmentName: '',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState(null);

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrcs, setPopoverImgSrcs] = useState([]);

  // pending desired changes
  const [pendingComplete, setPendingComplete] = useState(() => new Set());
  const [pendingUncomplete, setPendingUncomplete] = useState(() => new Set());

  const isGroupCompleted = (groupStatus || '').toLowerCase() === 'completed';
  const isPopoverOpen = Boolean(anchorEl);

  const btnSx = useMemo(() => ({ textTransform: 'none', fontWeight: 400 }), []);
  const closeNotification = () => setNotification((p) => ({ ...p, open: false }));

  /* =========================
     Fetch group status
     ========================= */
  const fetchGroupStatus = useCallback(async () => {
    if (!groupId) return setError('Invalid Group ID');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`, {
        headers: { Accept: '*/*' },
      });
      setGroupStatus(res.data?.status || null);
    } catch (e) {
      console.error('Fetch group status error:', e.response?.data || e.message);
      setError('Failed to fetch group status.');
    }
  }, [groupId]);

  /* =========================
     Fetch data (supports overrides)
     ========================= */
  const fetchData = useCallback(
    async (overrides = {}) => {
      if (!groupId) return setError('Invalid Group ID');

      const effPage = Number.isInteger(overrides.page) ? overrides.page : page;
      const effSize = Number.isInteger(overrides.size) ? overrides.size : rowsPerPage;
      const effSearch = overrides.searchValues ?? searchValues;
      const effSort = overrides.sortConfig ?? sortConfig;

      setLoading(true);
      setError(null);

      try {
        const hasSearch = Object.values(effSearch).some((v) => v && String(v).trim() !== '');
        const canSort = effSort.key && effSort.key !== 'select' && effSort.key !== 'no' && effSort.direction;
        const sortParam = canSort
          ? `${HEADERS.find((h) => h.key === effSort.key)?.backendKey || effSort.key},${effSort.direction}`
          : 'updatedDate,desc';

        const params = {
          groupId,
          hasFilter: hasSearch,
          disablePagination: false,
          page: effPage,
          size: effSize,
          sort: sortParam,
          ...effSearch,
        };

        const res = await axios.get(`${API_BASE_URL}/api/summary-requisitions/search`, {
          params,
          headers: { Accept: '*/*' },
        });

        const mapped = (res.data?.content || []).map((item) => {
          const r = item.requisition || {};
          const sp = item.supplierProduct || null;

          const isCompleted = toBoolStrict(r.isCompleted ?? item.isCompleted ?? r.completed ?? item.completed ?? false);
          const completedDate = r.completedDate || item.completedDate || null;

          return {
            ...item,
            requisition: r,
            supplierProduct: sp,
            requestQty: item.totalRequestQty,
            amount: item.totalPrice,
            currency: sp?.currency || item.currency || 'VND',
            goodType: sp?.goodType || item.goodType || '',
            unit: item.unit || r.unit || '',
            isCompleted,
            completedDate,
          };
        });

        setData(mapped);
        setTotalElements(res.data?.totalElements ?? mapped.length);
      } catch (e) {
        console.error('Fetch data error:', e.response?.data || e.message);
        setError(`Failed to fetch data: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [groupId, page, rowsPerPage, searchValues, sortConfig]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access this page.');
      navigate('/login');
      return;
    }
    fetchGroupStatus();
    fetchData();
  }, [fetchGroupStatus, fetchData, navigate]);

  // ✅ NEW: chỉ reset pending khi đổi context (group/page/size/sort/search)
  const searchKey = useMemo(() => JSON.stringify(searchValues), [searchValues]);
  useEffect(() => {
    setPendingComplete(new Set());
    setPendingUncomplete(new Set());
  }, [groupId, page, rowsPerPage, sortConfig.key, sortConfig.direction, searchKey]);

  // ✅ NEW: nếu group Completed thì clear pending (read-only)
  useEffect(() => {
    if (isGroupCompleted) {
      setPendingComplete(new Set());
      setPendingUncomplete(new Set());
    }
  }, [isGroupCompleted]);

  /* =========================
     Desired state logic
     ========================= */
  const rowMeta = useMemo(
    () =>
      data
        .map((x) => ({ id: x?.requisition?.id, currentCompleted: Boolean(x?.isCompleted) }))
        .filter((x) => Boolean(x.id)),
    [data]
  );

  const getDesiredCompleted = useCallback(
    (id, currentCompleted) => {
      if (pendingComplete.has(id)) return true;
      if (pendingUncomplete.has(id)) return false;
      return currentCompleted;
    },
    [pendingComplete, pendingUncomplete]
  );

  const desiredCheckedCount = useMemo(() => {
    let c = 0;
    for (const r of rowMeta) if (getDesiredCompleted(r.id, r.currentCompleted)) c += 1;
    return c;
  }, [rowMeta, getDesiredCompleted]);

  const headerChecked = rowMeta.length > 0 && desiredCheckedCount === rowMeta.length;
  const headerIndeterminate = desiredCheckedCount > 0 && desiredCheckedCount < rowMeta.length;

  const setDesiredForOne = (id, currentCompleted, newDesired) => {
    if (newDesired === currentCompleted) {
      setPendingComplete((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      setPendingUncomplete((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      return;
    }

    if (newDesired) {
      setPendingComplete((prev) => new Set(prev).add(id));
      setPendingUncomplete((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    } else {
      setPendingUncomplete((prev) => new Set(prev).add(id));
      setPendingComplete((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  const setDesiredForAll = (newDesired) => {
    const nextComplete = new Set(pendingComplete);
    const nextUncomplete = new Set(pendingUncomplete);

    rowMeta.forEach((r) => {
      if (newDesired === r.currentCompleted) {
        nextComplete.delete(r.id);
        nextUncomplete.delete(r.id);
      } else if (newDesired) {
        nextComplete.add(r.id);
        nextUncomplete.delete(r.id);
      } else {
        nextUncomplete.add(r.id);
        nextComplete.delete(r.id);
      }
    });

    setPendingComplete(nextComplete);
    setPendingUncomplete(nextUncomplete);
  };

  const pendingCompleteIds = useMemo(() => Array.from(pendingComplete), [pendingComplete]);
  const pendingUncompleteIds = useMemo(() => Array.from(pendingUncomplete), [pendingUncomplete]);
  const hasPending = pendingCompleteIds.length > 0 || pendingUncompleteIds.length > 0;

  const discardChanges = () => {
    setPendingComplete(new Set());
    setPendingUncomplete(new Set());
  };

  /* =========================
     API actions (✅ FIXED)
     ✅ Mark Completed chỉ clear pendingComplete
     ✅ Mark Uncompleted chỉ clear pendingUncomplete
     ========================= */
  const handleMarkCompleted = async () => {
    if (loading || isGroupCompleted || pendingCompleteIds.length === 0) return;

    const email = getUserEmail();
    if (!email) {
      setNotification({ open: true, severity: 'error', message: 'Missing user email. Please login again.' });
      return;
    }

    setLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/summary-requisitions/mark-completed`,
        { requisitionIds: pendingCompleteIds },
        {
          params: { email },
          headers: { Accept: '*/*' },
        }
      );

      setNotification({ open: true, severity: 'success', message: `Marked completed: ${pendingCompleteIds.length}` });

      // ✅ FIX: chỉ clear pendingComplete
      setPendingComplete(new Set());

      await Promise.all([fetchData(), fetchGroupStatus()]);
    } catch (e) {
      console.error('Mark completed error:', e.response?.data || e.message);
      setNotification({
        open: true,
        severity: 'error',
        message: e.response?.data?.message || 'Failed to mark completed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUncompleted = async () => {
    if (loading || isGroupCompleted || pendingUncompleteIds.length === 0) return;

    const email = getUserEmail();
    if (!email) {
      setNotification({ open: true, severity: 'error', message: 'Missing user email. Please login again.' });
      return;
    }

    setLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/summary-requisitions/mark-uncompleted`,
        { requisitionIds: pendingUncompleteIds },
        {
          params: { email },
          headers: { Accept: '*/*' },
        }
      );

      setNotification({ open: true, severity: 'success', message: `Marked uncompleted: ${pendingUncompleteIds.length}` });

      // ✅ FIX: chỉ clear pendingUncomplete
      setPendingUncomplete(new Set());

      await Promise.all([fetchData(), fetchGroupStatus()]);
    } catch (e) {
      console.error('Mark uncompleted error:', e.response?.data || e.message);
      setNotification({
        open: true,
        severity: 'error',
        message: e.response?.data?.message || 'Failed to mark uncompleted',
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI actions
     ========================= */
  const openEdit = (item) => {
    if (isGroupCompleted) return;
    setSelectedItem(item);
    setOpenEditDialog(true);
  };

  const closeEdit = (msg) => {
    setOpenEditDialog(false);
    setSelectedItem(null);
    if (msg) setNotification({ open: true, message: msg, severity: msg.includes('success') ? 'success' : 'info' });
  };

  const openAdd = (currency = '') => {
    if (isGroupCompleted) return;
    setSelectedCurrency(currency);
    setOpenAddDialog(true);
  };

  const closeAdd = (msg) => {
    setOpenAddDialog(false);
    setSelectedCurrency('');
    if (msg) setNotification({ open: true, message: msg, severity: msg.includes('success') ? 'success' : 'info' });
  };

  const askDelete = (item) => {
    if (isGroupCompleted) return;
    setSelectedItemForDelete(item);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedItemForDelete(null);
  };

  const confirmDelete = async () => {
    const id = selectedItemForDelete?.requisition?.id;
    if (!id) return cancelDelete();

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/summary-requisitions/${id}`, { headers: { Accept: '*/*' } });
      setNotification({ open: true, severity: 'success', message: 'Item deleted successfully' });
      await fetchData();
    } catch (e) {
      console.error('Delete error:', e.response?.data || e.message);
      setNotification({ open: true, severity: 'error', message: e.response?.data?.message || 'Could not delete item' });
    } finally {
      setLoading(false);
      cancelDelete();
    }
  };

  // Click header -> asc -> desc -> none
  const handleSort = (key) => {
    if (!key || key === 'select' || key === 'no') return;

    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;

    const nextSort = { key: direction ? key : null, direction };
    setSortConfig(nextSort);
    setPage(0);
    fetchData({ page: 0, sortConfig: nextSort });
  };

  const handleSearchChange = (v) => {
    setSearchValues(v);
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchData({ page: 0 });
  };

  const handleReset = () => {
    const cleared = {
      productType1Name: '',
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSapCode: '',
      hanaSapCode: '',
      supplierName: '',
      departmentName: '',
    };
    const nextSort = { key: null, direction: null };

    setSearchValues(cleared);
    setSortConfig(nextSort);
    setPage(0);
    fetchData({ page: 0, searchValues: cleared, sortConfig: nextSort });
  };

  const handleCurrencyClick = (currency) => {
    if (!currency || isGroupCompleted) return;
    openAdd(currency);
  };

  const openPopover = (event, imageUrls) => {
    setAnchorEl(event.currentTarget);
    const full = (imageUrls || []).map((src) =>
      src.startsWith('http') ? src : `${API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`
    );
    setPopoverImgSrcs(full);
  };

  const closePopover = () => {
    setAnchorEl(null);
    setPopoverImgSrcs([]);
  };

  /* =========================
     Sticky offsets
     ========================= */
  const SELECT_W = 46;
  const NO_W = 50;
  const PT1_W = 110;
  const PT2_W = 110;
  const EN_W = 170;
  const VN_W = 170;
  const OLD_W = 110;

  const LEFT_SELECT = 0;
  const LEFT_NO = LEFT_SELECT + SELECT_W;
  const LEFT_PT1 = LEFT_NO + NO_W;
  const LEFT_PT2 = LEFT_PT1 + PT1_W;
  const LEFT_EN = LEFT_PT2 + PT2_W;
  const LEFT_VN = LEFT_EN + EN_W;
  const LEFT_OLD = LEFT_VN + VN_W;

  const stickyKeys = ['select', 'no', 'productType1Name', 'productType2Name', 'englishName', 'vietnameseName', 'oldSapCode'];

  const headCellSx = (key, sortable) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    ...(stickyKeys.includes(key) ? { borderRight: 'none' } : {}),
    py: 0.6,
    px: 0.7,
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: key === 'select' ? 22 : stickyKeys.includes(key) ? 21 : 20,
    cursor: sortable ? 'pointer' : 'default',
    ...(key === 'select' && { left: LEFT_SELECT, minWidth: SELECT_W }),
    ...(key === 'no' && { left: LEFT_NO, minWidth: NO_W }),
    ...(key === 'productType1Name' && { left: LEFT_PT1, minWidth: PT1_W }),
    ...(key === 'productType2Name' && { left: LEFT_PT2, minWidth: PT2_W }),
    ...(key === 'englishName' && { left: LEFT_EN, minWidth: EN_W }),
    ...(key === 'vietnameseName' && { left: LEFT_VN, minWidth: VN_W }),
    ...(key === 'oldSapCode' && { left: LEFT_OLD, minWidth: OLD_W }),
  });

  const stickyBodySx = (left, minWidth, bg, z = 2) => ({
    position: 'sticky',
    left,
    zIndex: z,
    minWidth,
    backgroundColor: bg,
    borderRight: 'none',
  });

  // icon sort luôn hiện ở cột sortable
  const renderSortIndicator = (key) => {
    const active = sortConfig.key === key && !!sortConfig.direction;

    if (!active) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5, lineHeight: 0 }}>
          <ArrowUpward sx={{ fontSize: '0.7rem', color: '#9ca3af' }} />
          <ArrowDownward sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: '-4px' }} />
        </Box>
      );
    }

    if (sortConfig.direction === 'asc') {
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

  const statusText = groupStatus || '—';
  const statusBadgeSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.6,
    px: 1,
    py: 0.35,
    borderRadius: 999,
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: '0.75rem',
  };

  const dotSx = {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: isGroupCompleted ? '#9ca3af' : '#111827',
    opacity: 0.7,
  };

  return (
    <Box sx={{ p: 1.5, minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      <Notification open={notification.open} message={notification.message} severity={notification.severity} onClose={closeNotification} />

      {/* Header */}
      <Paper elevation={0} sx={{ p: 1.25, mb: 1, borderRadius: 1.5, border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Weekly Requisition</Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Box sx={statusBadgeSx}>
                <Box sx={dotSx} />
                <span>Status: {statusText}</span>
                {isGroupCompleted ? <span style={{ opacity: 0.75 }}>• Read-only</span> : null}
              </Box>

              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                Pending: complete ({pendingCompleteIds.length}) • uncomplete ({pendingUncompleteIds.length})
                {!hasPending ? ' • none' : ''}
              </Typography>
            </Stack>
          </Stack>

          {/* Top actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            <ExportRequisitionWeeklyExcelButton data={data} groupId={groupId} disabled={isGroupCompleted} sx={btnSx} />
            <ImportExcelButton onImport={fetchData} groupId={groupId} disabled={isGroupCompleted} sx={btnSx} />

            <Button variant="outlined" onClick={() => navigate(`/comparison/${groupId}`)} sx={btnSx}>
              Comparison
            </Button>

            <Button
              variant="outlined"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => openAdd('')}
              disabled={isGroupCompleted}
              sx={btnSx}
            >
              Add New
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Bulk actions */}
      <Paper elevation={0} sx={{ p: 1, mb: 1, borderRadius: 1.5, border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
          <Button
            variant="contained"
            onClick={handleMarkCompleted}
            disabled={loading || isGroupCompleted || pendingCompleteIds.length === 0}
            sx={btnSx}
          >
            Mark as Completed
          </Button>

          <Button
            variant="outlined"
            onClick={handleMarkUncompleted}
            disabled={loading || isGroupCompleted || pendingUncompleteIds.length === 0}
            sx={btnSx}
          >
            Mark as Uncompleted
          </Button>

          <Button variant="text" onClick={discardChanges} disabled={loading || isGroupCompleted || !hasPending} sx={btnSx}>
            Discard
          </Button>
        </Stack>
      </Paper>

      {/* Search */}
      <RequisitionSearch searchValues={searchValues} onSearchChange={handleSearchChange} onSearch={handleSearch} onReset={handleReset} />

      {loading && (
        <Typography align="center" sx={{ mt: 1.5, fontSize: '0.85rem', color: 'text.secondary' }}>
          Loading...
        </Typography>
      )}

      {error && (
        <Typography align="center" sx={{ mt: 1.5, fontSize: '0.85rem', color: theme.palette.error.main }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 1.5,
              border: '1px solid #e5e7eb',
              maxHeight: 560,
              overflowX: 'auto',
              backgroundColor: '#fff',
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 2100 }}>
              <TableHead>
                <TableRow>
                  {HEADERS.map(({ label, key, sortable }) => (
                    <TableCell
                      key={key}
                      align={
                        ['select', 'no', 'price', 'currency', 'amount', 'requestQty', 'orderQty', 'goodType', 'createdDate', 'updatedDate', 'completedDate', 'image', 'actions', 'unit'].includes(key)
                          ? 'center'
                          : 'left'
                      }
                      sx={headCellSx(key, sortable)}
                      onClick={() => sortable && handleSort(key)}
                    >
                      {key === 'select' ? (
                        <Tooltip title="Toggle all (desired completed state)" arrow>
                          <span>
                            <Checkbox
                              size="small"
                              disabled={isGroupCompleted || rowMeta.length === 0}
                              checked={headerChecked}
                              indeterminate={headerIndeterminate}
                              onChange={(e) => setDesiredForAll(e.target.checked)}
                              sx={{ p: 0.2 }}
                            />
                          </span>
                        </Tooltip>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={0.6}
                          alignItems="center"
                          justifyContent={
                            ['select', 'no', 'price', 'currency', 'amount', 'requestQty', 'orderQty', 'goodType', 'createdDate', 'updatedDate', 'completedDate', 'image', 'actions', 'unit'].includes(key)
                              ? 'center'
                              : 'flex-start'
                          }
                        >
                          <span>{label}</span>
                          {sortable ? renderSortIndicator(key) : null}
                        </Stack>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {data.length > 0 ? (
                  data.map((item, idx) => {
                    const zebra = idx % 2 === 0 ? '#ffffff' : '#fafafa';
                    const r = item.requisition || {};
                    const sp = item.supplierProduct || null;
                    const rowId = r.id;

                    const currentCompleted = Boolean(item.isCompleted);
                    const desiredCompleted = rowId ? getDesiredCompleted(rowId, currentCompleted) : false;

                    const imageUrls = r.imageUrls || sp?.imageUrls || item.imageUrls || [];

                    return (
                      <TableRow
                        key={rowId || idx}
                        sx={{
                          backgroundColor: zebra,
                          '&:hover': { backgroundColor: '#f1f5f9' },
                          '& > *': { borderBottom: '1px solid #f3f4f6' },
                        }}
                      >
                        <TableCell align="center" sx={{ py: 0.4, px: 0.5, ...stickyBodySx(LEFT_SELECT, SELECT_W, zebra, 3) }}>
                          <Checkbox
                            size="small"
                            disabled={isGroupCompleted || !rowId}
                            checked={desiredCompleted}
                            onChange={(e) => setDesiredForOne(rowId, currentCompleted, e.target.checked)}
                            sx={{ p: 0.2 }}
                          />
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_NO, NO_W, zebra, 3) }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_PT1, PT1_W, zebra, 3) }}>
                          {item.productType1Name || ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_PT2, PT2_W, zebra, 3) }}>
                          {item.productType2Name || ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_EN, EN_W, zebra, 3) }}>
                          {r.englishName || ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_VN, VN_W, zebra, 3) }}>
                          {r.vietnameseName || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_OLD, OLD_W, zebra, 3) }}>
                          {r.oldSapCode || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {r.hanaSapCode || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.unit || '-'}
                        </TableCell>

                        <TableCell sx={{ py: 0.4, px: 0.6 }}>
                          <DeptRequestTable departmentRequests={item.departmentRequests} />
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.requestQty || 0}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {r.orderQty ?? item.orderQty ?? ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, whiteSpace: 'nowrap' }}>
                          {sp?.supplierName || item.supplierName || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {sp?.price ? formatCurrency(sp.price, item.currency) : '0'}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.4,
                            px: 0.6,
                            cursor: isGroupCompleted ? 'default' : 'pointer',
                            color: isGroupCompleted ? 'text.secondary' : theme.palette.primary.main,
                          }}
                          onClick={() => handleCurrencyClick(item.currency)}
                        >
                          {item.currency || '-'}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.amount ? formatCurrency(item.amount, item.currency) : '0'}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, whiteSpace: 'nowrap' }}>
                          {r.reason || item.reason || ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, whiteSpace: 'nowrap' }}>
                          {r.remark || item.remarkComparison || item.remark || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.goodType || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {formatDate(item.createdDate || r.createdAt)}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {formatDate(item.updatedDate || r.updatedAt)}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {formatDate(item.completedDate)}
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.4, px: 0.6 }}>
                          {imageUrls.length > 0 ? (
                            <IconButton
                              size="small"
                              onMouseEnter={(e) => openPopover(e, imageUrls)}
                              aria-owns={isPopoverOpen ? 'mouse-over-popover' : undefined}
                              aria-haspopup="true"
                            >
                              <ImageIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>—</Typography>
                          )}
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.4, px: 0.6 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title={isGroupCompleted ? 'Disabled' : 'Edit'}>
                              <span>
                                <IconButton aria-label="edit" color="primary" size="small" onClick={() => openEdit(item)} disabled={isGroupCompleted}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title={isGroupCompleted ? 'Disabled' : 'Delete'}>
                              <span>
                                <IconButton aria-label="delete" color="error" size="small" onClick={() => askDelete(item)} disabled={isGroupCompleted}>
                                  <DeleteIcon fontSize="small" />
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
                    <TableCell colSpan={HEADERS.length} align="center" sx={{ py: 3 }}>
                      <Stack direction="column" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                        <InboxIcon fontSize="small" />
                        <Typography sx={{ fontSize: '0.85rem' }}>No data</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <PaginationBar
            count={totalElements}
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

          <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
            <DialogTitle sx={{ fontSize: '0.95rem' }}>Delete Item</DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: '0.85rem', color: '#111827' }}>
                Delete “{selectedItemForDelete?.requisition?.englishName || 'Unknown'}” ?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelDelete} sx={btnSx}>
                Cancel
              </Button>
              <Button onClick={confirmDelete} variant="contained" color="error" disabled={loading} sx={btnSx}>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          <Popover
            id="mouse-over-popover"
            sx={{ pointerEvents: 'auto' }}
            open={isPopoverOpen}
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            onClose={closePopover}
            disableRestoreFocus
          >
            <Box sx={{ p: 1, maxWidth: 280, maxHeight: 280, overflowY: 'auto' }} onMouseLeave={closePopover}>
              {popoverImgSrcs.length > 0 ? (
                <Stack spacing={1}>
                  {popoverImgSrcs.map((src, i) => (
                    <Box key={i} sx={{ textAlign: 'center' }}>
                      <img
                        src={src}
                        alt={`Product ${i + 1}`}
                        style={{ maxWidth: '100%', maxHeight: 190, borderRadius: 6, objectFit: 'contain' }}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/images/fallback.jpg';
                          e.target.alt = 'Failed to load';
                        }}
                      />
                      <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>Image {i + 1}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>No images</Typography>
              )}
            </Box>
          </Popover>

          <EditDialog open={openEditDialog} item={selectedItem} onClose={closeEdit} onRefresh={fetchData} />
          <AddDialog open={openAddDialog} onClose={closeAdd} onRefresh={fetchData} groupId={groupId} currency={selectedCurrency} />
        </>
      )}
    </Box>
  );
}
