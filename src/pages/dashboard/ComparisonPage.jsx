import React, { useState, useEffect, useCallback } from 'react';
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
  TablePagination,
  useTheme,
  Tooltip,
  Button,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import axios from 'axios';
import ExportComparisonWeeklyExcelButton from './ExportComparisonWeeklyExcelButton.jsx';
import EditDialog from './EditDialog.jsx';
import ComparisonSearch from './ComparisonSearch.jsx';
import { API_BASE_URL } from '../../config.js';

// Function to normalize currency codes for toLocaleString
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

// Function to get display currency name (for UI labels)
const getDisplayCurrency = (currency) => {
  if (!currency) return 'VND';
  return currency.toUpperCase();
};

// Function to get locale based on currency
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

// === CẬP NHẬT HEADERS: THÊM CỘT UNIT SAU DEPARTMENT ===
const getHeaders = (currency = 'VND') => [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Product Type 1', key: 'type1Name', sortable: true },
  { label: 'Product Type 2', key: 'type2Name', sortable: true },
  { label: 'Item Description (Vietnamese)', key: 'vietnameseName', sortable: true },
  { label: 'Item Description (English)', key: 'englishName', sortable: true },
  { label: 'Old SAP Code', key: 'oldSapCode', sortable: true },
  { label: 'Hana SAP Code', key: 'hanaSapCode', sortable: true },
  { label: 'Supplier Description', key: 'supplierName', sortable: true },
  { label: 'Supplier List', key: 'suppliers', sortable: false },
  { label: 'Best Price', key: 'bestPrice', sortable: false },
  { label: 'Unit', key: 'unit', sortable: true },

  { label: 'Department', key: 'departmentRequests', sortable: false },
  // THÊM CỘT UNIT Ở ĐÂY
  { label: 'Request Qty', key: 'requestQty', sortable: true },
  { label: 'Order Qty', key: 'orderQty', sortable: true },
  { label: `Price (${getDisplayCurrency(currency)})`, key: 'selectedPrice', sortable: true },
  { label: `Amount (${getDisplayCurrency(currency)})`, key: 'amtVnd', sortable: true },
  { label: `Highest Price (${getDisplayCurrency(currency)})`, key: 'highestPrice', sortable: true },
  { label: `Amount Difference (${getDisplayCurrency(currency)})`, key: 'amtDifference', sortable: true },
  { label: 'Difference (%)', key: 'percentage', sortable: true },
  { label: 'Remark', key: 'remarkComparison', sortable: true },
];

function DeptRequestTable({ departmentRequests }) {
  const [showAllDepts, setShowAllDepts] = useState(false);
  const displayDepts = showAllDepts ? departmentRequests : departmentRequests?.slice(0, 3);

  if (!departmentRequests || departmentRequests.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.55rem', color: '#666' }}>No Data</Typography>;
  }

  return (
    <div>
      <Table
        size="small"
        sx={{
          minWidth: 160,
          border: '1px solid #ddd',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
            <TableCell
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '40%',
              }}
            >
              Name
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '30%',
              }}
            >
              Request Qty
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '30%',
              }}
            >
              Buy
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayDepts.map((dept, idx) => (
            <TableRow
              key={dept.departmentId + idx}
              sx={{
                '&:nth-of-type(even)': { backgroundColor: '#f9fbff' },
                '&:hover': { backgroundColor: '#bbdefb', transition: 'background-color 0.3s' },
                fontSize: '0.55rem',
              }}
            >
              <TableCell sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, color: '#0d47a1', width: '40%' }}>
                {dept.departmentName}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600, width: '30%' }}>
                {dept.qty || 0}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600, width: '30%' }}>
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
          sx={{
            mt: 0.5,
            fontSize: '0.65rem',
            color: '#1976d2',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#e3f2fd' },
          }}
        >
          {showAllDepts ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
}

function SupplierTable({ suppliers, currency }) {
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const displaySuppliers = showAllSuppliers ? suppliers : suppliers?.slice(0, 3);

  if (!suppliers || suppliers.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.55rem', color: '#666' }}>No Suppliers</Typography>;
  }

  const normalizedCurrency = normalizeCurrencyCode(currency);

  return (
    <div>
      <Table
        size="small"
        sx={{
          minWidth: 180,
          border: '1px solid #ddd',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
            <TableCell
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '50%',
              }}
            >
              Supplier Name
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '20%',
              }}
            >
              Price ({getDisplayCurrency(currency)})
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '15%',
              }}
            >
              Unit
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '15%',
              }}
            >
              Selected
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displaySuppliers.map((supplier, idx) => (
            <TableRow
              key={idx}
              sx={{
                backgroundColor: supplier.isSelected === 1 ? '#d0f0c0' : idx % 2 === 0 ? '#fff' : '#f9fbff',
                '&:hover': { backgroundColor: supplier.isSelected === 1 ? '#b8e6a3' : '#bbdefb', transition: 'background-color 0.3s' },
                fontSize: '0.55rem',
              }}
            >
              <TableCell sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, color: '#0d47a1', width: '50%' }}>
                {supplier.supplierName}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, width: '20%' }}>
                {supplier.price ? supplier.price.toLocaleString(getLocaleForCurrency(normalizedCurrency), { style: 'currency', currency: normalizedCurrency }) : '0'}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, width: '15%' }}>
                {supplier.unit || ''}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600, width: '15%' }}>
                {supplier.isSelected === 1 ? 'Yes' : 'No'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {suppliers.length > 3 && (
        <Button
          size="small"
          onClick={() => setShowAllSuppliers(!showAllSuppliers)}
          sx={{
            mt: 0.5,
            fontSize: '0.65rem',
            color: '#1976d2',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#e3f2fd' },
          }}
        >
          {showAllSuppliers ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
}

export default function ComparisonPage() {
  const theme = useTheme();
  const { groupId } = useParams();

  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [searchValues, setSearchValues] = useState({
    productType1Name: '',
    productType2Name: '',
    englishName: '',
    vietnameseName: '',
    oldSapCode: '',
    hanaSapCode: '',
    supplierName: '',
    departmentName: '',
    filter: false,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currency, setCurrency] = useState('VND');

  useEffect(() => {
    if (data.length > 0 && data[0].currency) {
      setCurrency(data[0].currency);
    }
  }, [data]);

  const fetchUnfilteredTotals = useCallback(async () => {
    if (!groupId) {
      setError('Invalid Group ID');
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/summary-requisitions/search/comparison`,
        {
          params: {
            groupId,
            hasFilter: false,
            disablePagination: true,
          },
          headers: { Accept: '*/*' },
        }
      );
      setUnfilteredTotals({
        totalAmt: response.data.totalAmt || 0,
        totalAmtDifference: response.data.totalAmtDifference || 0,
        totalDifferencePercentage: response.data.totalDifferencePercentage || 0,
      });
    } catch (err) {
      console.error('Error fetching unfiltered totals:', err);
      setError('Failed to fetch unfiltered totals.');
    }
  }, [groupId]);

  const fetchData = useCallback(async (filters = {}, pageNum = 0, size = 25, sort = 'string') => {
    if (!groupId) {
      setError('Invalid Group ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const queryParams = {
        groupId,
        productType1Name: filters.productType1Name || '',
        productType2Name: filters.productType2Name || '',
        englishName: filters.englishName || '',
        vietnameseName: filters.vietnameseName || '',
        oldSapCode: filters.oldSapCode || '',
        hanaSapCode: filters.hanaSapCode || '',
        supplierName: filters.supplierName || '',
        departmentName: filters.departmentName || '',
        hasFilter: filters.filter ? 'true' : 'false',
        disablePagination: 'false',
        page: pageNum,
        size,
        sort,
      };

      const response = await axios.get(
        `${API_BASE_URL}/api/summary-requisitions/search/comparison`,
        {
          params: queryParams,
          headers: { Accept: '*/*' },
        }
      );
      const mappedData = response.data.page.content.map(item => ({
        ...item,
        requestQty: Math.floor(item.requestQty || 0),
        orderQty: item.orderQty || 0,
        unit: item.unit || '', // THÊM UNIT VÀO MAPPED DATA
      }));
      setData(mappedData);
      setOriginalData(mappedData);
      setTotalElements(response.data.page.totalElements);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from API.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchUnfilteredTotals();
    fetchData({}, page, rowsPerPage, sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : 'string');
  }, [fetchUnfilteredTotals, fetchData, page, rowsPerPage, sortConfig]);

  const handleSearchChange = (newSearchValues) => {
    setSearchValues(newSearchValues);
  };

  const handleSearch = (filters) => {
    setPage(0);
    fetchData(filters, 0, rowsPerPage, sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : 'string');
  };

  const handleReset = () => {
    setSearchValues({
      productType1Name: '',
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSapCode: '',
      hanaSapCode: '',
      supplierName: '',
      departmentName: '',
      filter: false,
    });
    setSortConfig({ key: null, direction: null });
    setPage(0);
    fetchData({ filter: false }, 0, rowsPerPage, 'string');
  };

  const handleDelete = async (oldSapCode) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/summary-requisitions/${oldSapCode}`, {
        headers: { Accept: '*/*' },
      });
      await fetchUnfilteredTotals();
      await fetchData(searchValues, page, rowsPerPage, sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : 'string');
      const maxPage = Math.max(0, Math.ceil((totalElements - 1) / rowsPerPage) - 1);
      if (page > maxPage) setPage(maxPage);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete item.');
    }
  };

  const handleOpenEditDialog = (item) => {
    setSelectedItem(item);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedItem(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
    setPage(0);

    if (!direction) {
      fetchData(searchValues, 0, rowsPerPage, 'string');
      return;
    }

    fetchData(searchValues, 0, rowsPerPage, `${key},${direction}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchData(searchValues, newPage, rowsPerPage, sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : 'string');
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchData(searchValues, 0, newRowsPerPage, sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : 'string');
  };

  const paginatedData = data;

  const mappedDataForExport = paginatedData.map(item => ({
    englishName: item.englishName || '',
    vietnameseName: item.vietnameseName || '',
    oldSapCode: item.oldSapCode || '',
    hanaSapCode: item.hanaSapCode || '',
    suppliers: item.suppliers || [],
    remarkComparison: item.remarkComparison || '',
    supplierName: item.suppliers?.find(s => s.isSelected === 1)?.supplierName || '',
    requestQty: item.requestQty || 0,
    orderQty: item.orderQty || 0,
    currency: item.currency || 'VND',
    bestPrice: item.bestPrice ? 'Yes' : 'No',
    unit: item.unit || '', // THÊM UNIT VÀO EXPORT
  }));

  return (
    <Box
      sx={{
        p: 1,
        fontSize: '0.65rem',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        backgroundColor: '#f5f8fa',
        minHeight: '100vh',
      }}
    >
      <ComparisonSearch
        searchValues={searchValues}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        mb={1}
        sx={{ userSelect: 'none' }}
      >
        <ExportComparisonWeeklyExcelButton
          data={mappedDataForExport}
          disabled={loading}
          groupId={groupId}
        />
      </Stack>

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

      {!loading && !error && (
        <>
          <Box
            sx={{
              mb: 1,
              p: 0.5,
              backgroundColor: '#e3f2fd',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#1976d2',
              }}
            >
              Total Amount ({getDisplayCurrency(currency)}): {unfilteredTotals.totalAmt ? unfilteredTotals.totalAmt.toLocaleString(getLocaleForCurrency(normalizeCurrencyCode(currency)), { style: 'currency', currency: normalizeCurrencyCode(currency) }) : '0'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: unfilteredTotals.totalAmtDifference < 0 ? theme.palette.error.main : '#1976d2',
              }}
            >
              Total Difference ({getDisplayCurrency(currency)}): {unfilteredTotals.totalAmtDifference ? unfilteredTotals.totalAmtDifference.toLocaleString(getLocaleForCurrency(normalizeCurrencyCode(currency)), { style: 'currency', currency: normalizeCurrencyCode(currency) }) : '0'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: unfilteredTotals.totalDifferencePercentage < 0 ? theme.palette.error.main : '#1976d2',
              }}
            >
              Total Difference (%): {unfilteredTotals.totalDifferencePercentage ? unfilteredTotals.totalDifferencePercentage.toFixed(2) + '%' : '0%'}
            </Typography>
          </Box>

          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              overflowX: 'auto',
              maxHeight: 450,
              boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
              backgroundColor: '#fff',
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 1900 }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {getHeaders(currency).map(({ label, key, sortable }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Old SAP Code', 'Hana SAP Code', 'Supplier Description', 'Request Qty', 'Order Qty', `Price (${getDisplayCurrency(currency)})`, `Amount (${getDisplayCurrency(currency)})`, `Highest Price (${getDisplayCurrency(currency)})`, `Amount Difference (${getDisplayCurrency(currency)})`, 'Difference (%)', 'Best Price', 'Unit'].includes(label)
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.55rem',
                        color: '#ffffff',
                        py: 0.2,
                        px: 0.4,
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        '&:last-child': { borderRight: 'none' },
                        position: 'sticky',
                        top: 0,
                        zIndex: key === 'no' || key === 'type1Name' || key === 'type2Name' || key === 'vietnameseName' || key === 'englishName' || key === 'oldSapCode' ? 21 : 20,
                        backgroundColor: '#027aff',
                        ...(key === 'no' && { left: 0, boxShadow: '2px 0 5px rgba(0,0,0,0.1)', minWidth: 50 }),
                        ...(key === 'type1Name' && { left: 50, minWidth: 100 }),
                        ...(key === 'type2Name' && { left: 150, minWidth: 100 }),
                        ...(key === 'vietnameseName' && { left: 250, minWidth: 150 }),
                        ...(key === 'englishName' && { left: 400, minWidth: 150 }),
                        ...(key === 'oldSapCode' && { left: 550, minWidth: 100 }),
                        ...(key === 'bestPrice' && { minWidth: 80 }),
                        cursor: sortable ? 'pointer' : 'default',
                        '&:hover': sortable ? { backgroundColor: '#016ae3' } : {},
                        ...(label === 'Remark' && { minWidth: 200 }),
                      }}
                      onClick={() => sortable && handleSort(key)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: ['Supplier List', 'Department', 'Best Price'].includes(label) ? 'center' : 'flex-start' }}>
                        <Tooltip title={label} arrow>
                          <span>{label}</span>
                        </Tooltip>
                        {sortable && (
                          <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                            {sortConfig.key === key && sortConfig.direction === 'asc' ? (
                              <ArrowUpward sx={{ fontSize: '0.8rem', color: '#fff' }} />
                            ) : sortConfig.key === key && sortConfig.direction === 'desc' ? (
                              <ArrowDownward sx={{ fontSize: '0.8rem', color: '#fff' }} />
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <ArrowUpward sx={{ fontSize: '0.6rem', color: '#ccc' }} />
                                <ArrowDownward sx={{ fontSize: '0.6rem', color: '#ccc' }} />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, idx) => {
                    const rowBackgroundColor = idx % 2 === 0 ? '#fff' : '#f7f9fc';
                    const itemCurrency = normalizeCurrencyCode(item.currency || currency);
                    return (
                      <TableRow
                        key={item.oldSapCode + idx}
                        sx={{
                          backgroundColor: rowBackgroundColor,
                          '&:hover': {
                            backgroundColor: '#e1f0ff',
                            transition: 'background-color 0.3s ease',
                            '& .sticky-cell': {
                              backgroundColor: '#e1f0ff',
                            },
                          },
                          fontSize: '0.55rem',
                          cursor: 'default',
                          userSelect: 'none',
                          '& > *': { borderBottom: 'none' },
                        }}
                      >
                        <TableCell align="center" className="sticky-cell" sx={{ px: 0.4, py: 0.2, position: 'sticky', left: 0, zIndex: 1, backgroundColor: rowBackgroundColor, fontSize: '0.55rem', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', minWidth: 50 }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell className="sticky-cell" sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem', position: 'sticky', left: 50, zIndex: 1, backgroundColor: rowBackgroundColor, minWidth: 100 }}>
                          {item.type1Name || ''}
                        </TableCell>
                        <TableCell className="sticky-cell" sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem', position: 'sticky', left: 150, zIndex: 1, backgroundColor: rowBackgroundColor, minWidth: 100 }}>
                          {item.type2Name || ''}
                        </TableCell>
                        <TableCell className="sticky-cell" sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontWeight: 600, fontSize: '0.55rem', position: 'sticky', left: 250, zIndex: 1, backgroundColor: rowBackgroundColor, minWidth: 150 }}>
                          {item.vietnameseName || ''}
                        </TableCell>
                        <TableCell className="sticky-cell" sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem', position: 'sticky', left: 400, zIndex: 1, backgroundColor: rowBackgroundColor, minWidth: 150 }}>
                          {item.englishName || ''}
                        </TableCell>
                        <TableCell align="center" className="sticky-cell" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem', position: 'sticky', left: 550, zIndex: 1, backgroundColor: rowBackgroundColor, minWidth: 100 }}>
                          {item.oldSapCode || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.hanaSapCode || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.suppliers?.find(s => s.isSelected === 1)?.supplierName || ''}
                        </TableCell>
                        <TableCell sx={{ px: 0.4, py: 0.2 }}>
                          <SupplierTable suppliers={item.suppliers} currency={item.currency || currency} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem', fontWeight: 600, color: item.bestPrice ? '#4caf50' : theme.palette.error.main }}>
                          {item.bestPrice ? 'Yes' : 'No'}
                        </TableCell>
                                                {/* THÊM CỘT UNIT Ở ĐÂY */}
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontWeight: 600, fontSize: '0.55rem', backgroundColor: rowBackgroundColor }}>
                          {item.unit || '-'}
                        </TableCell>
                        <TableCell sx={{ px: 0.4, py: 0.2 }}>
                          <DeptRequestTable departmentRequests={item.departmentRequests} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.requestQty || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.orderQty || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.selectedPrice ? item.selectedPrice.toLocaleString(getLocaleForCurrency(itemCurrency), { style: 'currency', currency: itemCurrency }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontWeight: 700, color: theme.palette.primary.dark, fontSize: '0.55rem' }}>
                          {item.amtVnd ? item.amtVnd.toLocaleString(getLocaleForCurrency(itemCurrency), { style: 'currency', currency: itemCurrency }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.highestPrice ? item.highestPrice.toLocaleString(getLocaleForCurrency(itemCurrency), { style: 'currency', currency: itemCurrency }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.amtDifference ? item.amtDifference.toLocaleString(getLocaleForCurrency(itemCurrency), { style: 'currency', currency: itemCurrency }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.percentage ? item.percentage.toFixed(2) + '%' : '0%'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', px: 0.4, py: 0.2, fontSize: '0.55rem', minWidth: 200 }}>
                          {item.remarkComparison || ''}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={getHeaders(currency).length} align="center" sx={{ py: 2, color: '#90a4ae' }}>
                      <Stack direction="column" alignItems="center" spacing={0.5}>
                        <InboxIcon fontSize="small" />
                        <Typography sx={{ fontSize: '0.7rem' }}>No data available.</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
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
        </>
      )}

      <EditDialog
        open={openEditDialog}
        item={selectedItem}
        onClose={handleCloseEditDialog}
        onSave={() => {
          fetchUnfilteredTotals();
          fetchData(searchValues, page, rowsPerPage, sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : 'string');
        }}
      />
    </Box>
  );
}