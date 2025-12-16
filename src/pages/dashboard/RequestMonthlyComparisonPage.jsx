import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
  useTheme,
  Tooltip,
  Button,
  IconButton,
  Divider,
  Pagination,
  Select,
  MenuItem,
} from '@mui/material';

import InboxIcon from '@mui/icons-material/Inbox';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Edit as EditIcon } from '@mui/icons-material';

import axios from 'axios';
import ExportComparisonMonthlyExcelButton from './ExportComparisonMonthlyExcelButton.jsx';
import ComparisonSearch from './ComparisonSearch.jsx';
import EditComparisonItemDialog from './EditComparisonItemDialog.jsx';
import { API_BASE_URL } from '../../config.js';

/* ========= Retry ========= */
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, options);
      return response;
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`Retry ${i + 1}/${retries} for ${url}:`, err.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
};

/* ========= Currency helpers ========= */
const normalizeCurrencyCode = (currency) => {
  if (!currency) return 'VND';
  switch (currency.toUpperCase()) {
    case 'EURO':
      return 'EUR';
    case 'VND':
      return 'VND';
    case 'USD':
      return 'USD';
    default:
      return 'VND';
  }
};

const getDisplayCurrency = (currency) => (currency ? currency.toUpperCase() : 'VND');

const getLocaleForCurrency = (currency) => {
  switch (currency) {
    case 'VND':
      return 'vi-VN';
    case 'USD':
      return 'en-US';
    case 'EUR':
      return 'de-DE';
    default:
      return 'en-US';
  }
};

const formatCurrency = (value, currency) => {
  if (value == null) return '0';
  const cur = normalizeCurrencyCode(currency);
  const locale = getLocaleForCurrency(cur);
  try {
    return Number(value).toLocaleString(locale, { style: 'currency', currency: cur });
  } catch {
    return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }
};

/* ========= Headers ========= */
const getHeaders = (currency = 'VND') => [
  { label: 'No', key: 'no' },
  { label: 'Product Type 1', key: 'type1Name' },
  { label: 'Product Type 2', key: 'type2Name' },
  { label: 'Item (VN)', key: 'vietnameseName' },
  { label: 'Item (EN)', key: 'englishName' },
  { label: 'Old SAP', key: 'oldSapCode' },
  { label: 'Hana SAP', key: 'hanaSapCode' },
  { label: 'Unit', key: 'unit' },
  { label: 'Supplier List', key: 'suppliers' },
  { label: 'Best Price', key: 'isBestPrice' },
  { label: 'Department', key: 'departmentRequests' },
  { label: 'Request Qty', key: 'totalRequestQty' },
  { label: 'MED Confirmed', key: 'medConfirmed' },
  { label: `Price (${getDisplayCurrency(currency)})`, key: 'price' },
  { label: 'Currency', key: 'currency' },
  { label: `Amount (${getDisplayCurrency(currency)})`, key: 'amount' },
  { label: `Highest Price (${getDisplayCurrency(currency)})`, key: 'highestPrice' },
  { label: `Amt Diff (${getDisplayCurrency(currency)})`, key: 'amtDifference' },
  { label: 'Diff (%)', key: 'percentage' },
  { label: 'Remark', key: 'remarkComparison' },
  { label: 'Good Type', key: 'productType2Name' },
  { label: 'Action', key: 'action' },
];

/* ========= Admin-style Pagination Bar (client-side) ========= */
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
            sx={{
              '& .MuiPaginationItem-root': { fontSize: '0.8rem', minWidth: 32, height: 32 },
            }}
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
            sx={{ height: 32, minWidth: 110, borderRadius: 1.2, '& .MuiSelect-select': { fontSize: '0.8rem' } }}
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

/* ========= DeptRequestTable (admin style) ========= */
function DeptRequestTable({ departmentRequests }) {
  const [showAllDepts, setShowAllDepts] = useState(false);
  const displayDepts = showAllDepts ? departmentRequests : departmentRequests?.slice(0, 3);

  if (!departmentRequests || departmentRequests.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.72rem', color: 'text.secondary' }}>No Data</Typography>;
  }

  return (
    <Box>
      <Table
        size="small"
        sx={{
          minWidth: 180,
          border: '1px solid #e5e7eb',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.3, px: 0.6 }}>Name</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.3, px: 0.6 }}>
              Request
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.3, px: 0.6 }}>
              Buy
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {displayDepts.map((dept, idx) => (
            <TableRow
              key={(dept.departmentId || dept.departmentName || idx) + idx}
              sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}
            >
              <TableCell sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>{dept.departmentName || ''}</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>
                {dept.qty || 0}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>
                {dept.buy || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {departmentRequests.length > 3 && (
        <Button
          size="small"
          onClick={() => setShowAllDepts(!showAllDepts)}
          sx={{ mt: 0.5, fontSize: '0.75rem', textTransform: 'none', fontWeight: 400 }}
        >
          {showAllDepts ? 'Show less' : 'Show more'}
        </Button>
      )}
    </Box>
  );
}

/* ========= SupplierTable (admin style) =========
   ✅ default chỉ show 2 NCC, Show more mới bung hết
*/
function SupplierTable({ suppliers, currency }) {
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const displaySuppliers = showAllSuppliers ? suppliers : suppliers?.slice(0, 2);

  if (!suppliers || suppliers.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.72rem', color: 'text.secondary' }}>No Suppliers</Typography>;
  }

  const cur = normalizeCurrencyCode(currency);
  const locale = getLocaleForCurrency(cur);

  return (
    <Box>
      <Table
        size="small"
        sx={{
          minWidth: 300, // ✅ rộng hơn
          border: '1px solid #e5e7eb',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.3, px: 0.6 }}>Supplier</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.3, px: 0.6 }}>
              Price
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.3, px: 0.6 }}>
              Unit
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.3, px: 0.6 }}>
              Selected
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {displaySuppliers.map((s, idx) => {
            const selected = s.isSelected === 1;
            return (
              <TableRow
                key={idx}
                sx={{
                  backgroundColor: selected ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa',
                  '&:hover': { backgroundColor: selected ? '#dcfce7' : '#f1f5f9' },
                }}
              >
                <TableCell sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>{s.supplierName || ''}</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>
                  {s.price ? Number(s.price).toLocaleString(locale, { style: 'currency', currency: cur }) : '0'}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>
                  {s.unit || ''}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.72rem', py: 0.25, px: 0.6 }}>
                  {selected ? 'Yes' : 'No'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {suppliers.length > 2 && (
        <Button
          size="small"
          onClick={() => setShowAllSuppliers(!showAllSuppliers)}
          sx={{ mt: 0.5, fontSize: '0.75rem', textTransform: 'none', fontWeight: 400 }}
        >
          {showAllSuppliers ? 'Show less' : 'Show more'}
        </Button>
      )}
    </Box>
  );
}

export default function RequestMonthlyComparisonPage() {
  const theme = useTheme();
  const { groupId } = useParams();

  const [data, setData] = useState([]);
  const [unfilteredTotals, setUnfilteredTotals] = useState({
    totalAmt: 0,
    totalAmtDifference: 0,
    totalDifferencePercentage: 0,
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currency, setCurrency] = useState('VND');

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [searchValues, setSearchValues] = useState({
    productType1Name: '',
    productType2Name: '',
    englishName: '',
    vietnameseName: '',
    oldSapCode: '',
    hanaSapCode: '',
    unit: '',
    departmentName: '',
  });

  useEffect(() => {
    if (data.length > 0 && data[0]?.currency) setCurrency(data[0].currency);
  }, [data]);

  const fetchUnfilteredTotals = useCallback(async () => {
    if (!groupId) return;
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/search/comparison-monthly`, {
        params: { groupId, filter: false },
        headers: { Accept: '*/*' },
      });

      setUnfilteredTotals({
        totalAmt: response.data.totalAmt || 0,
        totalAmtDifference: response.data.totalAmtDifference || 0,
        totalDifferencePercentage: response.data.totalDifferencePercentage || 0,
      });
    } catch (err) {
      if (!data.length) setError('Failed to fetch unfiltered totals. Please try again.');
    }
  }, [groupId, data.length]);

  const fetchData = useCallback(
    async (filters = {}) => {
      if (!groupId) {
        setError('Invalid Group ID. Please check the URL.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          groupId,
          filter: true,
          ...(filters.productType1Name && { productType1Name: filters.productType1Name }),
          ...(filters.productType2Name && { productType2Name: filters.productType2Name }),
          ...(filters.englishName && { englishName: filters.englishName }),
          ...(filters.vietnameseName && { vietnameseName: filters.vietnameseName }),
          ...(filters.oldSapCode && { oldSapCode: filters.oldSapCode }),
          ...(filters.hanaSapCode && { hanaSapCode: filters.hanaSapCode }),
          ...(filters.unit && { unit: filters.unit }),
          ...(filters.departmentName && { departmentName: filters.departmentName }),
        }).toString();

        const response = await fetchWithRetry(`${API_BASE_URL}/search/comparison-monthly?${queryParams}`, {
          headers: { Accept: '*/*' },
        });

        const mappedData =
          response.data.requisitions?.map((item) => ({
            ...item,
            id: item.id,
            productType2Name: item.goodtype || item.productType2Name || '',
          })) || [];

        setData(mappedData);
        setTotalElements(mappedData.length);
      } catch (err) {
        setError(!data.length ? 'Failed to fetch data from API. Please try again.' : 'Failed to fetch new data. Showing previously loaded data.');
      } finally {
        setLoading(false);
      }
    },
    [groupId, data.length]
  );

  useEffect(() => {
    fetchUnfilteredTotals();
    fetchData();
  }, [fetchUnfilteredTotals, fetchData]);

  // giữ page hợp lệ khi totalElements thay đổi
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil((totalElements || 0) / (rowsPerPage || 1)) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalElements, rowsPerPage, page]);

  const handleSearchChange = (newSearchValues) => setSearchValues(newSearchValues);

  const handleSearch = (filters) => {
    setPage(0);
    fetchData(filters);
  };

  const handleReset = () => {
    const cleared = {
      productType1Name: '',
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSapCode: '',
      hanaSapCode: '',
      unit: '',
      departmentName: '',
    };
    setSearchValues(cleared);
    setPage(0);
    fetchData();
  };

  const paginatedData = useMemo(() => data.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [data, page, rowsPerPage]);

  const mappedDataForExport = useMemo(
    () =>
      paginatedData.map((item) => ({
        englishName: item.englishName || '',
        vietnameseName: item.vietnameseName || '',
        oldSapCode: item.oldSapCode || '',
        hanaSapCode: item.hanaSapCode || '',
        suppliers: item.suppliers || [],
        remarkComparison: item.remarkComparison || '',
        unit: item.unit || '',
        totalRequestQty: item.totalRequestQty || 0,
        medConfirmed: item.medConfirmed ?? item.orderQty ?? 0,
        currency: item.currency || 'VND',
        productType2Name: item.productType2Name || '',
      })),
    [paginatedData]
  );

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setOpenEdit(true);
  };

  const handleAfterSave = async () => {
    setOpenEdit(false);
    setSelectedItem(null);
    await fetchData(searchValues);
    await fetchUnfilteredTotals();
  };

  /* ========= Table UX (sticky & neutral) ========= */
  const zebraBg = (idx) => (idx % 2 === 0 ? '#ffffff' : '#fafafa');

  const stickyKeys = ['no', 'type1Name', 'type2Name', 'vietnameseName', 'englishName', 'oldSapCode'];

  const NO_W = 50;
  const T1_W = 120;
  const T2_W = 120;
  const VN_W = 180;
  const EN_W = 180;
  const OLD_W = 110;

  const LEFT_NO = 0;
  const LEFT_T1 = LEFT_NO + NO_W;
  const LEFT_T2 = LEFT_T1 + T1_W;
  const LEFT_VN = LEFT_T2 + T2_W;
  const LEFT_EN = LEFT_VN + VN_W;
  const LEFT_OLD = LEFT_EN + EN_W;

  const headCellSx = (key) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    py: 0.6,
    px: 0.7,
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: stickyKeys.includes(key) ? 21 : 20,
    ...(stickyKeys.includes(key) ? { borderRight: 'none' } : {}),
    ...(key === 'no' && { left: LEFT_NO, minWidth: NO_W }),
    ...(key === 'type1Name' && { left: LEFT_T1, minWidth: T1_W }),
    ...(key === 'type2Name' && { left: LEFT_T2, minWidth: T2_W }),
    ...(key === 'vietnameseName' && { left: LEFT_VN, minWidth: VN_W }),
    ...(key === 'englishName' && { left: LEFT_EN, minWidth: EN_W }),
    ...(key === 'oldSapCode' && { left: LEFT_OLD, minWidth: OLD_W }),
    ...(key === 'suppliers' && { minWidth: 380 }), // ✅ cột Supplier dài ra
    ...(key === 'remarkComparison' && { minWidth: 240 }),
  });

  const stickyBodySx = (left, minWidth, bg) => ({
    position: 'sticky',
    left,
    zIndex: 3,
    minWidth,
    backgroundColor: bg,
    borderRight: 'none',
  });

  const alignByKey = (key) => {
    const centerKeys = [
      'no',
      'oldSapCode',
      'hanaSapCode',
      'unit',
      'isBestPrice',
      'totalRequestQty',
      'medConfirmed',
      'price',
      'currency',
      'amount',
      'highestPrice',
      'amtDifference',
      'percentage',
      'action',
    ];
    return centerKeys.includes(key) ? 'center' : 'left';
  };

  const cur = normalizeCurrencyCode(currency);
  const locale = getLocaleForCurrency(cur);

  const totalAmtText = unfilteredTotals.totalAmt ? unfilteredTotals.totalAmt.toLocaleString(locale, { style: 'currency', currency: cur }) : '0';
  const totalDiffText = unfilteredTotals.totalAmtDifference
    ? unfilteredTotals.totalAmtDifference.toLocaleString(locale, { style: 'currency', currency: cur })
    : '0';
  const totalPctText = unfilteredTotals.totalDifferencePercentage ? `${unfilteredTotals.totalDifferencePercentage.toFixed(2)}%` : '0%';

  const diffIsNegative = (unfilteredTotals.totalAmtDifference || 0) < 0 || (unfilteredTotals.totalDifferencePercentage || 0) < 0;

  return (
    <Box sx={{ p: 1.5, backgroundColor: '#f7f7f7', minHeight: '100vh' }}>
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
          <Stack spacing={0.3}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Comparison Monthly</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              Currency: <span style={{ color: '#111827' }}>{getDisplayCurrency(currency)}</span>
            </Typography>
          </Stack>

          <ExportComparisonMonthlyExcelButton data={mappedDataForExport} disabled={loading} groupId={groupId} />
        </Stack>
      </Paper>

      {/* Search giữ component hiện có */}
      <ComparisonSearch searchValues={searchValues} onSearchChange={handleSearchChange} onSearch={handleSearch} onReset={handleReset} />

      {/* Totals bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 1,
          p: 1,
          borderRadius: 1.5,
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            Total Amount: <span style={{ color: '#111827', fontWeight: 600 }}>{totalAmtText}</span>
          </Typography>

          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            Total Difference:{' '}
            <span style={{ color: diffIsNegative ? theme.palette.error.main : '#111827', fontWeight: 600 }}>{totalDiffText}</span>
          </Typography>

          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            Total Diff (%):{' '}
            <span style={{ color: diffIsNegative ? theme.palette.error.main : '#111827', fontWeight: 600 }}>{totalPctText}</span>
          </Typography>
        </Stack>
      </Paper>

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
                  {getHeaders(currency).map(({ label, key }) => (
                    <TableCell key={key} align={alignByKey(key)} sx={headCellSx(key)}>
                      <Tooltip title={label} arrow>
                        <span>{label}</span>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, idx) => {
                    const bg = zebraBg(idx);
                    return (
                      <TableRow
                        key={(item.oldSapCode || item.id || idx) + idx}
                        sx={{
                          backgroundColor: bg,
                          '&:hover': { backgroundColor: '#f1f5f9' },
                          '& > *': { borderBottom: '1px solid #f3f4f6' },
                        }}
                      >
                        {/* Sticky cells */}
                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_NO, NO_W, bg) }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, whiteSpace: 'nowrap', ...stickyBodySx(LEFT_T1, T1_W, bg) }}>
                          {item.type1Name || ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, whiteSpace: 'nowrap', ...stickyBodySx(LEFT_T2, T2_W, bg) }}>
                          {item.type2Name || ''}
                        </TableCell>

                        <TableCell
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.4,
                            px: 0.6,
                            whiteSpace: 'nowrap',
                            fontWeight: 600,
                            ...stickyBodySx(LEFT_VN, VN_W, bg),
                          }}
                        >
                          {item.vietnameseName || ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, whiteSpace: 'nowrap', ...stickyBodySx(LEFT_EN, EN_W, bg) }}>
                          {item.englishName || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, ...stickyBodySx(LEFT_OLD, OLD_W, bg) }}>
                          {item.oldSapCode || ''}
                        </TableCell>

                        {/* Non-sticky */}
                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.hanaSapCode || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.unit || ''}
                        </TableCell>

                        {/* ✅ Supplier column rộng + table con chỉ show 2 */}
                        <TableCell sx={{ py: 0.4, px: 0.6, minWidth: 380 }}>
                          <SupplierTable suppliers={item.suppliers} currency={item.currency || currency} />
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.4,
                            px: 0.6,
                            fontWeight: 600,
                            color: item.isBestPrice ? '#16a34a' : theme.palette.error.main,
                          }}
                        >
                          {item.isBestPrice ? 'Yes' : 'No'}
                        </TableCell>

                        <TableCell sx={{ py: 0.4, px: 0.6 }}>
                          <DeptRequestTable departmentRequests={item.departmentRequests} />
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.totalRequestQty != null ? String(item.totalRequestQty) : '0'}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, fontWeight: 600, color: '#d32f2f' }}>
                          {item.medConfirmed ?? item.orderQty ?? 0}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.price ? formatCurrency(item.price, item.currency) : '0'}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {getDisplayCurrency(item.currency) || 'VND'}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, fontWeight: 700, color: theme.palette.primary.dark }}>
                          {item.amount ? formatCurrency(item.amount, item.currency) : '0'}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.highestPrice ? formatCurrency(item.highestPrice, item.currency) : '0'}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.amtDifference ? formatCurrency(item.amtDifference, item.currency) : '0'}
                        </TableCell>

                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                          {item.percentage ? `${item.percentage.toFixed(2)}%` : '0%'}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, minWidth: 240, whiteSpace: 'pre-wrap' }}>
                          {item.remarkComparison || ''}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6, whiteSpace: 'nowrap' }}>
                          {item.productType2Name || ''}
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.4, px: 0.6 }}>
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={getHeaders(currency).length} align="center" sx={{ py: 3 }}>
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

          {/* Admin pagination */}
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
        </>
      )}

      {/* Edit dialog */}
      <EditComparisonItemDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        item={selectedItem}
        onSaved={handleAfterSave}
      />
    </Box>
  );
}
