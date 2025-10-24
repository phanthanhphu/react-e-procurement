import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Typography,
  Box,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Stack,
  IconButton,
  Button,
  TablePagination,
  useTheme,
  Tooltip,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import InboxIcon from '@mui/icons-material/Inbox';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import axios from 'axios';
import ExportRequisitionMonthlyExcelButton from './ExportRequisitionMonthlyExcelButton';
import EditRequisitionMonthly from './EditRequisitionMonthly';
import AddRequisitionMonthly from './AddRequisitionMonthly';
import RequisitionMonthlySearch from './RequisitionMonthlySearch';
import { API_BASE_URL } from '../../config';

// Cấu hình axios interceptor để tự động thêm token và xử lý lỗi 401
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
    }
    return Promise.reject(error);
  }
);

// Define table headers for the requisition table
const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Product Type 1', key: 'groupItem1', sortable: true, backendKey: 'productType1Name' },
  { label: 'Product Type 2', key: 'groupItem2', sortable: true, backendKey: 'productType2Name' },
  { label: 'Item Description (EN)', key: 'itemDescriptionEN', sortable: true, backendKey: 'itemDescriptionEN' },
  { label: 'Item Description (VN)', key: 'itemDescriptionVN', sortable: true, backendKey: 'itemDescriptionVN' },
  { label: 'Old SAP Code', key: 'oldSapCode', sortable: true, backendKey: 'oldSAPCode' },
  { label: 'Hana SAP Code', key: 'hanaSapCode', sortable: true, backendKey: 'hanaSAPCode' },
  { label: 'Unit', key: 'unit', sortable: true, backendKey: 'unit' },
  { label: 'Department', key: 'departmentRequests', sortable: false },
  { label: 'Request Qty', key: 'totalRequestQty', sortable: true, backendKey: 'totalRequestQty' },
  { label: 'Order Qty', key: 'orderQty', sortable: true, backendKey: 'orderQty' },
  { label: 'Supplier Description', key: 'supplierName', sortable: true, backendKey: 'supplierName' },
  { label: 'Price', key: 'price', sortable: true, backendKey: 'price' },
  { label: 'Currency', key: 'currency', sortable: true, backendKey: 'currency' },
  { label: 'Amount', key: 'amount', sortable: true, backendKey: 'amount' },
  { label: 'Daily Med Inventory', key: 'dailyMedInventory', sortable: true, backendKey: 'dailyMedInventory' },
  { label: 'Safe Stock', key: 'safeStock', sortable: true, backendKey: 'safeStock' },
  { label: 'Use Stock Qty', key: 'useStockQty', sortable: true, backendKey: 'useStockQty' },
  { label: 'Full Description', key: 'fullDescription', sortable: true, backendKey: 'fullDescription' },
  { label: 'Reason', key: 'reason', sortable: true, backendKey: 'reason' },
  { label: 'Remark', key: 'remark', sortable: true, backendKey: 'remark' },
  { label: 'Good Type', key: 'goodType', sortable: true, backendKey: 'goodType' },
  { label: 'Remark Comparison', key: 'remarkComparison', sortable: true, backendKey: 'remarkComparison' },
  { label: 'Created Date', key: 'createdDate', sortable: true, backendKey: 'createdDate' },
  { label: 'Updated Date', key: 'updatedDate', sortable: true, backendKey: 'updatedDate' },
  { label: 'Images', key: 'image', sortable: false },
  { label: 'Actions', key: 'actions', sortable: false },
];

// Sub-component to display department requests in a nested table
function DeptRequestTable({ departmentRequests }) {
  if (!departmentRequests || departmentRequests.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.55rem', color: '#666' }}>No Data</Typography>;
  }

  return (
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
            }}
          >
            Department
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontWeight: 700,
              fontSize: '0.55rem',
              py: 0.2,
              px: 0.3,
              color: '#1976d2',
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
            }}
          >
            Buy
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {departmentRequests.map((dept, idx) => (
          <TableRow
            key={idx}
            sx={{
              '&:nth-of-type(even)': { backgroundColor: '#f9fbff' },
              '&:hover': { backgroundColor: '#bbdefb', transition: 'background-color 0.3s' },
              fontSize: '0.55rem',
            }}
          >
            <TableCell sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, color: '#0d47a1' }}>
              {dept.name || 'Unknown'}
            </TableCell>
            <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600 }}>
              {dept.qty || 0}
            </TableCell>
            <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600 }}>
              {dept.buy || 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

DeptRequestTable.propTypes = {
  departmentRequests: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      qty: PropTypes.number,
      buy: PropTypes.number,
    })
  ),
};

export default function RequisitionMonthlyPage() {
  const theme = useTheme();
  const { groupId } = useParams();
  const navigate = useNavigate();

  // State management
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Store original data for resetting
  const [groupStatus, setGroupStatus] = useState(null); // State for group status
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalElements, setTotalElements] = useState(0); // Store total elements for pagination
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrcs, setPopoverImgSrcs] = useState([]);
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Format currency with dynamic symbols
  const formatCurrency = (value, currency) => {
    if (!value || isNaN(value)) return '0';
    switch (currency) {
      case 'VND':
        return `${new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)} đ`;
      case 'USD':
        return `$${Number(value).toFixed(2)}`;
      case 'EUR':
        return `€${Number(value).toFixed(2)}`;
      default:
        return Number(value).toFixed(2);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    if (Array.isArray(date)) {
      const [year, month, day, hour, minute, second, nanosecond] = date;
      const dateObj = new Date(year, month - 1, day, hour, minute, second, nanosecond / 1000000);
      return dateObj.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Fetch group status from API
  const fetchGroupStatus = useCallback(async () => {
    if (!groupId) {
      setError('Invalid Group ID');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`, {
        headers: { Accept: '*/*' },
      });
      setGroupStatus(response.data.status || null);
      console.log('Group Status:', response.data.status);
    } catch (err) {
      console.error('Fetch group status error:', err.response?.data || err.message);
      setError('Failed to fetch group status.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!groupId) {
      setError('Invalid Group ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/requisition-monthly/filter`, {
        params: {
          groupId,
          hasFilter: false,
          page,
          size: rowsPerPage,
          sort: 'updatedDate,desc',
        },
        headers: { Accept: '*/*' },
      });
      const mappedData = response.data.requisitions.content.map((item) => ({
        id: item.id,
        groupId: item.groupId,
        groupItem1: item.productType1Name || 'Unknown',
        groupItem2: item.productType2Name || 'Unknown',
        itemDescriptionEN: item.itemDescriptionEN || '',
        itemDescriptionVN: item.itemDescriptionVN || '',
        oldSapCode: item.oldSAPCode || '',
        hanaSapCode: item.hanaSAPCode || '',
        unit: item.unit || '',
        departmentRequests: item.departmentRequisitions.map((dept) => ({
          id: dept.id || '',
          name: dept.name || '',
          qty: dept.qty || 0,
          buy: dept.buy || 0,
        })),
        totalRequestQty: item.totalRequestQty || 0,
        orderQty: item.orderQty || 0,
        supplierName: item.supplierName || '',
        price: item.price || 0,
        currency: item.currency || 'VND',
        goodType: item.goodType || '',
        amount: item.amount || 0,
        dailyMedInventory: item.dailyMedInventory || 0,
        safeStock: item.safeStock || 0,
        useStockQty: item.useStockQty || 0,
        fullDescription: item.fullDescription || '',
        reason: item.reason || '',
        remark: item.remark || '',
        remarkComparison: item.remarkComparison || '',
        createdDate: item.createdDate || '',
        updatedDate: item.updatedDate || '',
        imageUrls: item.imageUrls || [],
      }));
      setData(mappedData);
      setOriginalData(mappedData);
      setTotalElements(response.data.requisitions.totalElements);
    } catch (err) {
      console.error('Fetch data error:', err.response?.data || err.message);
      setError(`Failed to fetch data from API: ${err.message}. Showing previously loaded data.`);
    } finally {
      setLoading(false);
    }
  }, [groupId, page, rowsPerPage]);

  // Check authentication status on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access this page.');
      navigate('/login');
      return;
    }
    setData([]); // Clear previous data
    fetchGroupStatus();
    fetchData();
  }, [fetchData, fetchGroupStatus, navigate]);

  // Handle search parameters change
  const handleSearchChange = (newSearchValues) => {
    setSearchValues(newSearchValues);
  };

  // Handle search action (server-side filtering)
  const handleSearch = useCallback(async () => {
    if (!groupId) {
      setError('Invalid Group ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const hasFilter = !!(
        searchValues.productType1Name ||
        searchValues.productType2Name ||
        searchValues.englishName ||
        searchValues.vietnameseName ||
        searchValues.oldSapCode ||
        searchValues.hanaSapCode ||
        searchValues.supplierName ||
        searchValues.departmentName
      );
      const sortParam = sortConfig.key
        ? `${headers.find((h) => h.key === sortConfig.key)?.backendKey || sortConfig.key},${sortConfig.direction}`
        : 'updatedDate,desc';
      const params = {
        groupId,
        productType1Name: searchValues.productType1Name || undefined,
        productType2Name: searchValues.productType2Name || undefined,
        englishName: searchValues.englishName || undefined,
        vietnameseName: searchValues.vietnameseName || undefined,
        oldSapCode: searchValues.oldSapCode || undefined,
        hanaSapCode: searchValues.hanaSapCode || undefined,
        supplierName: searchValues.supplierName || undefined,
        departmentName: searchValues.departmentName || undefined,
        hasFilter,
        page,
        size: rowsPerPage,
        sort: sortParam,
      };
      const response = await axios.get(`${API_BASE_URL}/requisition-monthly/filter`, {
        params,
        headers: { Accept: '*/*' },
      });
      const mappedData = response.data.requisitions.content.map((item) => ({
        id: item.id,
        groupId: item.groupId,
        groupItem1: item.productType1Name || 'Unknown',
        groupItem2: item.productType2Name || 'Unknown',
        itemDescriptionEN: item.itemDescriptionEN || '',
        itemDescriptionVN: item.itemDescriptionVN || '',
        oldSapCode: item.oldSAPCode || '',
        hanaSapCode: item.hanaSAPCode || '',
        unit: item.unit || '',
        departmentRequests: item.departmentRequisitions.map((dept) => ({
          id: dept.id || '',
          name: dept.name || '',
          qty: dept.qty || 0,
          buy: dept.buy || 0,
        })),
        totalRequestQty: item.totalRequestQty || 0,
        orderQty: item.orderQty || 0,
        supplierName: item.supplierName || '',
        price: item.price || 0,
        currency: item.currency || 'VND',
        goodType: item.goodType || '',
        amount: item.amount || 0,
        dailyMedInventory: item.dailyMedInventory || 0,
        safeStock: item.safeStock || 0,
        useStockQty: item.useStockQty || 0,
        fullDescription: item.fullDescription || '',
        reason: item.reason || '',
        remark: item.remark || '',
        remarkComparison: item.remarkComparison || '',
        createdDate: item.createdDate || '',
        updatedDate: item.updatedDate || '',
        imageUrls: item.imageUrls || [],
      }));
      setData(mappedData);
      setTotalElements(response.data.requisitions.totalElements);
    } catch (err) {
      console.error('Search error:', err.response?.data || err.message);
      setError(`Failed to search data: ${err.message}. Showing previously loaded data.`);
    } finally {
      setLoading(false);
    }
  }, [groupId, searchValues, page, rowsPerPage, sortConfig]);

  // Handle reset search
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
    });
    setSortConfig({ key: null, direction: null });
    setPage(0);
    setData([]);
    fetchData();
  };

  // Handle item deletion with DELETE API call
  const handleDelete = async (id) => {
    if (isCompleted) return;
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/requisition-monthly/${id}`, {
        headers: { Accept: '*/*' },
      });
      if (response.status >= 200 && response.status < 300) {
        await fetchData();
        const maxPage = Math.max(0, Math.ceil((totalElements - 1) / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
        setError(null);
        setSnackbarMessage('Item deleted successfully!');
        setSnackbarOpen(true);
      } else {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      setError(`Failed to delete item: ${error.message}. Please try again.`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  // Dialog and navigation handlers
  const handleOpenEditDialog = (item) => {
    if (isCompleted) return;
    setSelectedItem(item);
    setOpenEditDialog(true);
  };

  const handleOpenAddDialog = () => {
    if (isCompleted) return;
    setOpenAddDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedItem(null);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleGoToComparison = () => {
    if (groupId) {
      navigate(`/request-monthly-comparison/${groupId}`);
    } else {
      setError('Invalid Group ID');
    }
  };

  // Image popover handlers
  const handlePopoverOpen = (event, imageUrls) => {
    setAnchorEl(event.currentTarget);
    const fullSrcs = imageUrls.map((imgSrc) =>
      imgSrc.startsWith('http') ? imgSrc : `${API_BASE_URL}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`
    );
    setPopoverImgSrcs(fullSrcs);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverImgSrcs([]);
  };

  const open = Boolean(anchorEl);
  const isCompleted = groupStatus === 'Completed';
  const displayData = data.slice(0, rowsPerPage);

  // Delete dialog handlers
  const handleOpenDeleteDialog = (id) => {
    if (isCompleted) return;
    setItemToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      handleDelete(itemToDelete);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    handleSearch();
  };

  return (
    <Box
      sx={{
        p: 1.5,
        fontSize: '0.65rem',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        backgroundColor: '#f5f8fa',
        minHeight: '100vh',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
        sx={{ userSelect: 'none' }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.dark,
            letterSpacing: '0.05em',
            fontSize: '0.9rem',
          }}
        >
          Requisition Monthly
        </Typography>

        <Stack direction="row" spacing={1}>
          <Tooltip title={isCompleted ? 'Export is disabled for Completed groups' : 'Export data to Excel'}>
            <span>
              <ExportRequisitionMonthlyExcelButton
                groupId={groupId}
                data={data}
                searchValues={searchValues}
                disabled={isCompleted}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1,
                  px: 2,
                  py: 0.6,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  backgroundColor: isCompleted ? 'grey.300' : 'rgba(25, 118, 210, 0.1)',
                  color: isCompleted ? 'grey.700' : '#1976d2',
                  '&:hover': {
                    backgroundColor: isCompleted ? 'grey.300' : 'rgba(25, 118, 210, 0.25)',
                  },
                }}
              />
            </span>
          </Tooltip>

          <Tooltip title={isCompleted ? 'Comparison is the only action available for Completed groups' : ''}>
            <Button
              variant="contained"
              onClick={handleGoToComparison}
              sx={{
                textTransform: 'none',
                borderRadius: 1,
                px: 2,
                py: 0.6,
                fontWeight: 600,
                fontSize: '0.75rem',
                background: 'linear-gradient(to right, #4cb8ff, #027aff)',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(76, 184, 255, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
                  boxShadow: '0 3px 8px rgba(76, 184, 255, 0.4)',
                },
              }}
            >
              Comparison
            </Button>
          </Tooltip>

          <Tooltip title={isCompleted ? 'Adding new items is disabled for Completed groups' : 'Add new item'}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleOpenAddDialog}
                disabled={isCompleted}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1,
                  px: 2,
                  py: 0.6,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  background: isCompleted ? 'grey.300' : 'linear-gradient(to right, #4cb8ff, #027aff)',
                  color: isCompleted ? 'grey.700' : '#fff',
                  boxShadow: isCompleted ? 'none' : '0 2px 6px rgba(76, 184, 255, 0.3)',
                  '&:hover': {
                    background: isCompleted ? 'grey.300' : 'linear-gradient(to right, #3aa4f8, #016ae3)',
                    boxShadow: isCompleted ? 'none' : '0 3px 8px rgba(76, 184, 255, 0.4)',
                  },
                }}
              >
                Add New
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <RequisitionMonthlySearch
        searchValues={searchValues}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%', fontSize: '0.65rem' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes('Failed') ? 'error' : 'success'}
          sx={{ width: '100%', fontSize: '0.65rem' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.65rem', mt: 2 }}>
          Loading data...
        </Typography>
      )}

      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              overflowX: 'auto',
              maxHeight: 480,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              backgroundColor: '#fff',
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 2300 }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {headers.map(({ label, key, sortable, backendKey }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Unit', 'Request Qty', 'Order Qty', 'Price', 'Currency', 'Amount', 'Daily Med Inventory', 'Safe Stock', 'Use Stock Qty', 'Images', 'Actions', 'Created Date', 'Updated Date'].includes(label)
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.55rem',
                        color: '#ffffff',
                        py: 0.5,
                        px: 0.8,
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        '&:last-child': { borderRight: 'none' },
                        position: 'sticky',
                        top: 0,
                        zIndex: key === 'no' || key === 'groupItem1' || key === 'groupItem2' || key === 'itemDescriptionEN' || key === 'itemDescriptionVN' || key === 'oldSapCode' ? 21 : 20,
                        backgroundColor: '#027aff',
                        ...(key === 'no' && { left: 0, boxShadow: '2px 0 5px rgba(0,0,0,0.1)', minWidth: 50 }),
                        ...(key === 'groupItem1' && { left: 50, minWidth: 100 }),
                        ...(key === 'groupItem2' && { left: 150, minWidth: 100 }),
                        ...(key === 'itemDescriptionEN' && { left: 250, minWidth: 150 }),
                        ...(key === 'itemDescriptionVN' && { left: 400, minWidth: 150 }),
                        ...(key === 'oldSapCode' && { left: 550, minWidth: 100 }),
                        cursor: sortable ? 'pointer' : 'default',
                        '&:hover': sortable ? { backgroundColor: '#016ae3' } : {},
                      }}
                      onClick={() => sortable && handleSort(key)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: ['Actions', 'Images'].includes(label) ? 'center' : 'flex-start' }}>
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
                {displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 3, fontStyle: 'italic', color: '#999', fontSize: '0.65rem' }}>
                      <Stack direction="column" alignItems="center" spacing={0.5}>
                        <InboxIcon fontSize="small" />
                        <Typography sx={{ fontSize: '0.7rem' }}>No data available.</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((row, index) => {
                    const globalIndex = page * rowsPerPage + index + 1;
                    const rowBackgroundColor = index % 2 === 0 ? '#fff' : '#f7f9fc';

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          backgroundColor: rowBackgroundColor,
                          '&:hover': {
                            backgroundColor: '#e1f0ff',
                            transition: 'background-color 0.3s ease',
                            '& .sticky-cell': {
                              backgroundColor: '#e1f0ff',
                            },
                          },
                          '& > *': { borderBottom: 'none' },
                        }}
                      >
                        <TableCell
                          align="center"
                          className="sticky-cell"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                            minWidth: 50,
                          }}
                        >
                          {globalIndex}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            minWidth: 100,
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 50,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                          }}
                        >
                          {row.groupItem1 || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            minWidth: 100,
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 150,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                          }}
                        >
                          {row.groupItem2 || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            minWidth: 150,
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 250,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                          }}
                        >
                          {row.itemDescriptionEN || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            minWidth: 150,
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 400,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                          }}
                        >
                          {row.itemDescriptionVN || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            minWidth: 100,
                            textAlign: 'center',
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 550,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                          }}
                        >
                          {row.oldSapCode || ''}
                        </TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.hanaSapCode || ''}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.unit || ''}</TableCell>
                        <TableCell sx={{ minWidth: 160, textAlign: 'center', py: 0.5, px: 0.8 }}>
                          <DeptRequestTable departmentRequests={row.departmentRequests} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.totalRequestQty || 0}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.orderQty || 0}</TableCell>
                        <TableCell sx={{ minWidth: 180, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.supplierName || ''}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>
                          {formatCurrency(row.price, row.currency)}
                        </TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>
                          {row.currency || 'VND'}
                        </TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>
                          {formatCurrency(row.amount, row.currency)}
                        </TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.dailyMedInventory || 0}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.safeStock || 0}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.useStockQty || 0}</TableCell>
                        <TableCell sx={{ minWidth: 180, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.fullDescription || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.reason || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.remark || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.goodType || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.remarkComparison || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{formatDate(row.createdDate)}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{formatDate(row.updatedDate)}</TableCell>
                        <TableCell align="center" sx={{ minWidth: 80, py: 0.5, px: 0.8 }}>
                          {row.imageUrls.length > 0 ? (
                            <IconButton
                              size="small"
                              onMouseEnter={(e) => handlePopoverOpen(e, row.imageUrls)}
                              aria-owns={open ? 'mouse-over-popover' : undefined}
                              aria-haspopup="true"
                            >
                              <ImageIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography sx={{ fontSize: '0.55rem', color: '#888' }}>
                              No Images
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 80, py: 0.5, px: 0.8 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title={isCompleted ? 'Editing is disabled for Completed groups' : 'Edit item'}>
                              <span>
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleOpenEditDialog(row)}
                                  aria-label="Edit"
                                  disabled={isCompleted}
                                  sx={{
                                    backgroundColor: isCompleted ? 'grey.300' : 'rgba(25, 118, 210, 0.1)',
                                    '&:hover': {
                                      backgroundColor: isCompleted ? 'grey.300' : 'rgba(25, 118, 210, 0.25)',
                                    },
                                    borderRadius: 1,
                                    p: 0.2,
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: '10px' }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={isCompleted ? 'Deleting is disabled for Completed groups' : 'Delete item'}>
                              <span>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleOpenDeleteDialog(row.id)}
                                  aria-label="Delete"
                                  disabled={isCompleted}
                                  sx={{
                                    backgroundColor: isCompleted ? 'grey.300' : 'rgba(211, 47, 47, 0.1)',
                                    '&:hover': {
                                      backgroundColor: isCompleted ? 'grey.300' : 'rgba(211, 47, 47, 0.25)',
                                    },
                                    borderRadius: 1,
                                    p: 0.2,
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: '10px' }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
            <DialogTitle sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Confirm Deletion</DialogTitle>
            <DialogContent sx={{ fontSize: '0.65rem' }}>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog} sx={{ fontSize: '0.65rem' }}>
                Cancel
              </Button>
              <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ fontSize: '0.65rem' }}>
                Yes
              </Button>
            </DialogActions>
          </Dialog>

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
                p: 0.5,
                maxWidth: 250,
                maxHeight: 250,
                overflowY: 'auto',
              }}
            >
              {popoverImgSrcs.length > 0 ? (
                <Stack direction="column" spacing={0.5}>
                  {popoverImgSrcs.map((imgSrc, index) => (
                    <Box key={index} sx={{ textAlign: 'center' }}>
                      <img
                        src={imgSrc}
                        alt={`Product Image ${index + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: 180,
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
                      <Typography sx={{ mt: 0.2, fontSize: '0.7rem', color: '#555' }}>
                        Image {index + 1}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ p: 0.5, fontSize: '0.7rem' }}>No images available</Typography>
              )}
            </Box>
          </Popover>

          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Rows per page"
            sx={{
              mt: 1,
              '& .MuiTablePagination-toolbar': {
                paddingLeft: 1,
                paddingRight: 1,
                backgroundColor: '#f0f4f8',
                borderRadius: 1,
                fontSize: '0.55rem',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.55rem',
              },
            }}
          />
        </>
      )}

      <EditRequisitionMonthly
        open={openEditDialog}
        item={selectedItem}
        onClose={handleCloseEditDialog}
        onRefresh={fetchData}
      />

      <AddRequisitionMonthly
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onRefresh={fetchData}
        groupId={groupId}
      />
    </Box>
  );
}

RequisitionMonthlyPage.propTypes = {
  groupId: PropTypes.string,
};