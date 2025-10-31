import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TablePagination,
  useTheme,
  Tooltip,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import InboxIcon from '@mui/icons-material/Inbox';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import axios from 'axios';
import ExportRequisitionWeeklyExcelButton from './ExportRequisitionWeeklyExcelButton';
import EditDialog from './EditDialog';
import AddDialog from './AddDialog';
import RequisitionSearch from './RequisitionSearch';
import { API_BASE_URL } from '../../config';
import ImportExcelButton from './ImportExcelButton';
import Notification from './Notification';

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

// Updated table headers with Currency and Good Type
const headers = [
  { label: 'No', key: 'no', sortable: false, backendKey: 'no' },
  { label: 'Product Type 1', key: 'productType1Name', sortable: true, backendKey: 'productType1Name' },
  { label: 'Product Type 2', key: 'productType2Name', sortable: true, backendKey: 'productType2Name' },
  { label: 'Item Description (EN)', key: 'englishName', sortable: true, backendKey: 'englishName' },
  { label: 'Item Description (VN)', key: 'vietnameseName', sortable: true, backendKey: 'vietnameseName' },
  { label: 'Old SAP Code', key: 'oldSapCode', sortable: true, backendKey: 'oldSapCode' },
  { label: 'Hana SAP Code', key: 'hanaSapCode', sortable: true, backendKey: 'hanaSapCode' },
  { label: 'Department', key: 'departmentRequests', sortable: false, backendKey: 'departmentRequests' },
  { label: 'Request Qty', key: 'requestQty', sortable: true, backendKey: 'totalRequestQty' }, // Updated backendKey to totalRequestQty
  { label: 'Order Qty', key: 'orderQty', sortable: true, backendKey: 'orderQty' },
  { label: 'Supplier Description', key: 'supplierName', sortable: true, backendKey: 'supplierName' },
  { label: 'Price', key: 'price', sortable: true, backendKey: 'price' },
  { label: 'Currency', key: 'currency', sortable: true, backendKey: 'currency' },
  { label: 'Amount', key: 'amount', sortable: true, backendKey: 'totalPrice' },
  { label: 'Stock', key: 'stock', sortable: true, backendKey: 'stock' },
  { label: 'Reason', key: 'reason', sortable: true, backendKey: 'reason' },
  { label: 'Remark', key: 'remark', sortable: true, backendKey: 'remark' },
  { label: 'Good Type', key: 'goodType', sortable: true, backendKey: 'goodType' },
  { label: 'Created Date', key: 'createdDate', sortable: true, backendKey: 'createdDate' },
  { label: 'Updated Date', key: 'updatedDate', sortable: true, backendKey: 'updatedDate' },
  { label: 'Images', key: 'image', sortable: false, backendKey: 'image' },
  { label: 'Actions', key: 'actions', sortable: false, backendKey: 'actions' },
];

// DeptRequestTable component remains unchanged
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
              {dept.departmentName || ''}
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

export default function SummaryPage() {
  const theme = useTheme();
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrcs, setPopoverImgSrcs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState(null);

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

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

  const fetchData = useCallback(async () => {
    if (!groupId) {
      setError('Invalid Group ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const hasSearch = Object.values(searchValues).some(
        (value) => value && value.trim() !== ''
      );
      const sortParam = sortConfig.key
        ? `${headers.find((h) => h.key === sortConfig.key)?.backendKey || sortConfig.key},${sortConfig.direction}`
        : 'updatedDate,desc';

      const params = {
        groupId,
        hasFilter: hasSearch,
        disablePagination: false,
        page,
        size: rowsPerPage,
        sort: sortParam,
        ...searchValues,
      };

      const response = await axios.get(`${API_BASE_URL}/api/summary-requisitions/search`, {
        params,
        headers: { Accept: '*/*' },
      });

      const mappedData = response.data.content.map((item) => ({
        ...item,
        requestQty: item.totalRequestQty, // Updated to map to totalRequestQty
        amount: item.totalPrice,
        currency: item.supplierProduct?.currency || 'VND',
        goodType: item.supplierProduct?.goodType || '',
      }));

      setData(mappedData);
      setOriginalData(mappedData);
      setTotalElements(response.data.totalElements || mappedData.length);
    } catch (err) {
      console.error('Fetch data error:', err.response?.data || err.message);
      setError(`Failed to fetch data from API: ${err.message}. Showing previously loaded data.`);
    } finally {
      setLoading(false);
    }
  }, [groupId, searchValues, page, rowsPerPage, sortConfig]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access this page.');
      navigate('/login');
      return;
    }
    setData([]);
    fetchGroupStatus();
    fetchData();
  }, [fetchData, fetchGroupStatus, navigate]);

  const handleDelete = async (item) => {
    setSelectedItemForDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItemForDelete) {
      setNotification({
        open: true,
        message: 'No item selected for deletion',
        severity: 'error',
      });
      setDeleteDialogOpen(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/summary-requisitions/${selectedItemForDelete.requisition.id}`, {
        headers: { Accept: '*/*' },
      });
      if (response.status >= 200 && response.status < 300) {
        await fetchData();
        const maxPage = Math.max(0, Math.ceil((totalElements - 1) / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
        setNotification({
          open: true,
          message: 'Item deleted successfully',
          severity: 'success',
        });
      } else {
        throw new Error('Could not delete item');
      }
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Could not delete item',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedItemForDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedItemForDelete(null);
  };

  const handleOpenEditDialog = (item) => {
    setSelectedItem(item);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = (successMessage) => {
    setOpenEditDialog(false);
    setSelectedItem(null);
    if (successMessage) {
      setNotification({
        open: true,
        message: successMessage,
        severity: successMessage.includes('successfully') ? 'success' : 'error',
      });
    }
  };

  const handleOpenAddDialog = (currency = '') => {
    setSelectedCurrency(currency);
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = (message) => {
    setOpenAddDialog(false);
    setSelectedCurrency('');
    if (message) {
      setNotification({
        open: true,
        message: message,
        severity: message.includes('successfully') ? 'success' : 'error',
      });
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (newValues) => {
    setSearchValues(newValues);
    setPage(0);
  };

  const handleSearch = () => {
    fetchData();
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
    });
    setSortConfig({ key: null, direction: null });
    setPage(0);
    fetchData();
  };

  const handleNavigateToComparison = () => {
    navigate(`/comparison/${groupId}`);
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
      fetchData();
      return;
    }
    fetchData();
  };

  const handleCurrencyClick = (currency) => {
    if (currency && !isCompleted) {
      handleOpenAddDialog(currency);
    }
  };

  const handlePopoverOpen = (event, imageUrls) => {
    setAnchorEl(event.currentTarget);
    const fullSrcs = imageUrls?.map((imgSrc) =>
      imgSrc.startsWith('http') ? imgSrc : `${API_BASE_URL}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`
    ) || [];
    setPopoverImgSrcs(fullSrcs);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverImgSrcs([]);
  };

  const handlePopoverEnter = () => {};
  const handlePopoverLeave = () => {
    handlePopoverClose();
  };

  const isCompleted = groupStatus === 'Completed';
  const displayData = data.slice(0, rowsPerPage);

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
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
        sx={{ userSelect: 'none' }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.dark,
            letterSpacing: '0.05em',
            fontSize: '1rem',
          }}
        >
          Weekly Requisition
        </Typography>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title={isCompleted ? 'Export Urgent Excel is disabled for Completed groups' : 'Export data to Excel'}>
            <span>
              <ExportRequisitionWeeklyExcelButton
                data={data}
                groupId={groupId}
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
          <Tooltip title={isCompleted ? 'Import Excel is disabled for Completed groups' : 'Import data from Excel'}>
            <span>
              <ImportExcelButton
                onImport={(importedData) => {
                  fetchData();
                }}
                groupId={groupId}
                disabled={isCompleted}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1,
                  px: 2,
                  py: 0.6,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  backgroundColor: isCompleted ? 'grey.300' : '#36c080',
                  backgroundImage: isCompleted
                    ? 'none'
                    : 'linear-gradient(90deg, #36c080 0%, #25a363 100%)',
                  color: isCompleted ? 'grey.700' : '#fff',
                  '&:hover': {
                    backgroundColor: isCompleted ? 'grey.300' : '#2fa16a',
                    backgroundImage: isCompleted
                      ? 'none'
                      : 'linear-gradient(90deg, #2fa16a 0%, #1f7f4f 100%)',
                  },
                }}
              />
            </span>
          </Tooltip>
          <Tooltip title={isCompleted ? 'Comparison is the only action available for Completed groups' : ''}>
            <Button
              variant="contained"
              onClick={handleNavigateToComparison}
              sx={{
                textTransform: 'none',
                borderRadius: 1,
                px: 2,
                py: 0.6,
                fontWeight: 600,
                fontSize: '0.75rem',
                background: 'linear-gradient(to right, #4cb8ff, #027aff)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(76, 184, 255, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
                  boxShadow: '0 6px 16px rgba(76, 184, 255, 0.4)',
                },
              }}
            >
              Comparison
            </Button>
          </Tooltip>
          <Tooltip title={isCompleted ? 'Adding new items is disabled for Completed groups' : ''}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => handleOpenAddDialog('')}
                disabled={isCompleted}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1,
                  px: 2,
                  py: 0.6,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  background: isCompleted
                    ? 'grey.300'
                    : 'linear-gradient(to right, #4cb8ff, #027aff)',
                  color: isCompleted ? 'grey.700' : '#fff',
                  boxShadow: isCompleted
                    ? 'none'
                    : '0 4px 12px rgba(76, 184, 255, 0.3)',
                  '&:hover': {
                    background: isCompleted
                      ? 'grey.300'
                      : 'linear-gradient(to right, #3aa4f8, #016ae3)',
                    boxShadow: isCompleted
                      ? 'none'
                      : '0 6px 16px rgba(76, 184, 255, 0.4)',
                  },
                }}
              >
                Add New
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <RequisitionSearch
        searchValues={searchValues}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

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
                  {headers.map(({ label, key, sortable, backendKey }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Price', 'Currency', 'Amount', 'Request Qty', 'Stock', 'Order Qty', 'Good Type', 'Created Date', 'Updated Date', 'Images', 'Actions'].includes(label)
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
                        zIndex: key === 'no' || key === 'productType1Name' || key === 'productType2Name' || key === 'englishName' || key === 'vietnameseName' || key === 'oldSapCode' ? 21 : 20,
                        backgroundColor: '#027aff',
                        ...(key === 'no' && { left: 0, boxShadow: '2px 0 5px rgba(0,0,0,0.1)', minWidth: 50 }),
                        ...(key === 'productType1Name' && { left: 50, minWidth: 100 }),
                        ...(key === 'productType2Name' && { left: 150, minWidth: 100 }),
                        ...(key === 'englishName' && { left: 250, minWidth: 150 }),
                        ...(key === 'vietnameseName' && { left: 400, minWidth: 150 }),
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
                {displayData.length > 0 ? (
                  displayData.map((item, idx) => {
                    const { requisition, supplierProduct, productType1Name, productType2Name, departmentRequests, requestQty, amount, currency, goodType } = item;
                    const imageUrls = requisition.imageUrls || supplierProduct?.imageUrls || [];

                    return (
                      <TableRow
                        key={requisition.id}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
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
                        <TableCell
                          align="center"
                          className="sticky-cell"
                          sx={{
                            px: 0.4,
                            py: 0.2,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            fontSize: '0.55rem',
                            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                            minWidth: 50,
                          }}
                        >
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            whiteSpace: 'nowrap',
                            px: 0.4,
                            py: 0.2,
                            fontSize: '0.55rem',
                            position: 'sticky',
                            left: 50,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            minWidth: 100,
                          }}
                        >
                          {productType1Name || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            whiteSpace: 'nowrap',
                            px: 0.4,
                            py: 0.2,
                            fontSize: '0.55rem',
                            position: 'sticky',
                            left: 150,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            minWidth: 100,
                          }}
                        >
                          {productType2Name || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            whiteSpace: 'nowrap',
                            px: 0.4,
                            py: 0.2,
                            fontWeight: 600,
                            fontSize: '0.55rem',
                            position: 'sticky',
                            left: 250,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            minWidth: 150,
                          }}
                        >
                          {requisition.englishName || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          sx={{
                            whiteSpace: 'nowrap',
                            px: 0.4,
                            py: 0.2,
                            fontSize: '0.55rem',
                            position: 'sticky',
                            left: 400,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            minWidth: 150,
                          }}
                        >
                          {requisition.vietnameseName || ''}
                        </TableCell>
                        <TableCell
                          className="sticky-cell"
                          align="center"
                          sx={{
                            px: 0.4,
                            py: 0.2,
                            fontSize: '0.55rem',
                            position: 'sticky',
                            left: 550,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            minWidth: 100,
                          }}
                        >
                          {requisition.oldSapCode || ''}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            px: 0.4,
                            py: 0.2,
                            fontSize: '0.55rem',
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                          }}
                        >
                          {requisition.hanaSapCode || ''}
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 0.4,
                            py: 0.2,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                          }}
                        >
                          <DeptRequestTable departmentRequests={departmentRequests} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontWeight: 600, fontSize: '0.55rem' }}>
                          {requestQty || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.orderQty || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {supplierProduct?.supplierName || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {supplierProduct?.price ? formatCurrency(supplierProduct.price, currency) : '0'}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            px: 0.4,
                            py: 0.2,
                            fontSize: '0.55rem',
                            cursor: isCompleted ? 'default' : 'pointer',
                            color: isCompleted ? '#888' : theme.palette.primary.main,
                            '&:hover': isCompleted ? {} : { backgroundColor: '#e1f0ff' },
                          }}
                          onClick={() => handleCurrencyClick(currency)}
                        >
                          {currency || '-'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontWeight: 700, color: theme.palette.primary.dark, fontSize: '0.55rem' }}>
                          {amount ? formatCurrency(amount, currency) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.stock || 0}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.reason || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.remark || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {goodType || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {formatDate(item.createdDate)}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {formatDate(item.updatedDate)}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2 }}>
                          {imageUrls.length > 0 ? (
                            <IconButton
                              size="small"
                              onMouseEnter={(e) => handlePopoverOpen(e, imageUrls)}
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
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2 }}>
                          <Stack direction="row" spacing={0.2} justifyContent="center">
                            <Tooltip title={isCompleted ? 'Editing is disabled for Completed groups' : 'Edit item'}>
                              <span>
                                <IconButton
                                  aria-label="edit"
                                  color="primary"
                                  size="small"
                                  sx={{
                                    backgroundColor: isCompleted ? 'grey.300' : 'rgba(25, 118, 210, 0.1)',
                                    '&:hover': {
                                      backgroundColor: isCompleted ? 'grey.300' : 'rgba(25, 118, 210, 0.25)',
                                    },
                                    borderRadius: 1,
                                    p: 0.2,
                                  }}
                                  onClick={() => handleOpenEditDialog(item)}
                                  disabled={isCompleted}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={isCompleted ? 'Deleting is disabled for Completed groups' : 'Delete item'}>
                              <span>
                                <IconButton
                                  aria-label="delete"
                                  color="error"
                                  size="small"
                                  sx={{
                                    backgroundColor: isCompleted ? 'grey.300' : 'rgba(211, 47, 47, 0.1)',
                                    '&:hover': {
                                      backgroundColor: isCompleted ? 'grey.300' : 'rgba(211, 47, 47, 0.25)',
                                    },
                                    borderRadius: 1,
                                    p: 0.2,
                                  }}
                                  onClick={() => handleDelete(item)}
                                  disabled={isCompleted}
                                >
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
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 2, color: '#90a4ae' }}>
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

          <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
            <DialogTitle sx={{ fontSize: '0.8rem' }}>Delete Item</DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.7rem' }}>
                Are you sure you want to delete &quot;{selectedItemForDelete?.requisition?.englishName || 'Unknown'}&quot;?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelDelete} color="primary" sx={{ fontSize: '0.65rem' }}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                color="error"
                sx={{ fontSize: '0.65rem' }}
                disabled={loading}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          <Popover
            id="mouse-over-popover"
            sx={{ pointerEvents: 'auto' }}
            open={Boolean(anchorEl)}
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
              onMouseEnter={handlePopoverEnter}
              onMouseLeave={handlePopoverLeave}
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

          <EditDialog
            open={openEditDialog}
            item={selectedItem}
            onClose={handleCloseEditDialog}
            onRefresh={fetchData}
          />

          <AddDialog
            open={openAddDialog}
            onClose={handleCloseAddDialog}
            onRefresh={fetchData}
            groupId={groupId}
            currency={selectedCurrency}
          />
        </>
      )}
    </Box>
  );
}