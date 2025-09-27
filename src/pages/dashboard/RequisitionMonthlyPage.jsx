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

// Define table headers for the requisition table
const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Group Type 1', key: 'groupItem1', sortable: true },
  { label: 'Group Type 2', key: 'groupItem2', sortable: true },
  { label: 'Item Description (EN)', key: 'itemDescriptionEN', sortable: true },
  { label: 'Item Description (VN)', key: 'itemDescriptionVN', sortable: true },
  { label: 'Old SAP Code', key: 'oldSAPCode', sortable: true },
  { label: 'SAP Code in New SAP', key: 'sapCodeNewSAP', sortable: true },
  { label: 'Order Unit', key: 'unit', sortable: true },
  { label: 'Department', key: 'departmentRequests', sortable: false },
  { label: 'Buying Qty', key: 'sumBuy', sortable: true },
  { label: 'Total Not Issued Qty', key: 'totalNotIssuedQty', sortable: true },
  { label: 'In Hand', key: 'inHand', sortable: true },
  { label: 'Actual In Hand', key: 'actualInHand', sortable: true },
  { label: 'Order Qty', key: 'orderQty', sortable: true },
  { label: 'Full Description', key: 'fullDescription', sortable: true },
  { label: 'Reason', key: 'reason', sortable: true },
  { label: 'Remark', key: 'remark', sortable: true },
  { label: 'Remark Comparison', key: 'remarkComparison', sortable: true },
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
  const [groupStatus, setGroupStatus] = useState(null); // New state for group status
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
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
    oldSAPCode: '',
    sapCodeNewSAP: '',
    unit: '',
    departmentName: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch group status from API
  const fetchGroupStatus = useCallback(async () => {
    if (!groupId) {
      console.warn('No groupId, skipping fetchGroupStatus');
      setError('Invalid Group ID');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`, {
        headers: { Accept: '*/*' },
      });
      setGroupStatus(response.data.status || null);
      console.log('Group Status:', response.data.status); // Debug log
    } catch (err) {
      console.error('Fetch group status error:', err.response?.data || err.message);
      setError('Failed to fetch group status.');
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
      console.log('Fetching data with groupId:', groupId);
      const response = await axios.get(`${API_BASE_URL}/requisition-monthly/search-by-group-id`, {
        params: { groupId },
        headers: { Accept: '*/*' },
      });
      const mappedData = response.data.map((item) => ({
        id: item.id,
        groupId: item.groupId,
        groupItem1: item.productType1Name || 'Unknown',
        groupItem2: item.productType2Name || 'Unknown',
        itemDescriptionEN: item.itemDescriptionEN || '',
        itemDescriptionVN: item.itemDescriptionVN || '',
        oldSAPCode: item.oldSAPCode || '',
        sapCodeNewSAP: item.sapCodeNewSAP || '',
        unit: item.unit || '',
        departmentRequests: item.departmentRequisitions.map((dept) => ({
          id: dept.id || '',
          name: dept.name || '',
          qty: dept.qty || 0,
          buy: dept.buy || 0,
        })),
        sumBuy: item.departmentRequisitions.reduce((sum, dept) => sum + (dept.buy || 0), 0),
        totalNotIssuedQty: item.totalNotIssuedQty || 0,
        inHand: item.inHand || 0,
        actualInHand: item.actualInHand || 0,
        orderQty: item.orderQty || 0,
        fullDescription: item.fullDescription || '',
        reason: item.reason || '',
        remark: item.remark || '',
        remarkComparison: item.remarkComparison || '',
        imageUrls: item.imageUrls || [],
        supplierName: item.supplierName || '',
        price: item.price || 0,
        amount: item.amount || 0,
      }));
      console.log('Fetched and mapped data:', mappedData); // Debug log
      setData(mappedData);
      setOriginalData(mappedData); // Store original data
    } catch (err) {
      console.error('Fetch data error:', err.response?.data || err.message);
      setError(`Failed to fetch data from API: ${err.message}. Showing previously loaded data.`);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    setData([]); // Clear previous data
    fetchGroupStatus(); // Fetch group status
    fetchData();
  }, [fetchData, fetchGroupStatus]);

  // Handle search parameters change
  const handleSearchChange = (newSearchValues) => {
    setSearchValues(newSearchValues);
  };

  // Handle search action (client-side filtering)
  const handleSearch = () => {
    if (
      !searchValues.productType1Name &&
      !searchValues.productType2Name &&
      !searchValues.englishName &&
      !searchValues.vietnameseName &&
      !searchValues.oldSAPCode &&
      !searchValues.sapCodeNewSAP &&
      !searchValues.unit &&
      !searchValues.departmentName
    ) {
      fetchData();
      return;
    }

    const filteredData = originalData.filter((item) => {
      return (
        (!searchValues.productType1Name || item.groupItem1.toLowerCase().includes(searchValues.productType1Name.toLowerCase())) &&
        (!searchValues.productType2Name || item.groupItem2.toLowerCase().includes(searchValues.productType2Name.toLowerCase())) &&
        (!searchValues.englishName || item.itemDescriptionEN.toLowerCase().includes(searchValues.englishName.toLowerCase())) &&
        (!searchValues.vietnameseName || item.itemDescriptionVN.toLowerCase().includes(searchValues.vietnameseName.toLowerCase())) &&
        (!searchValues.oldSAPCode || item.oldSAPCode.toLowerCase().includes(searchValues.oldSAPCode.toLowerCase())) &&
        (!searchValues.sapCodeNewSAP || item.sapCodeNewSAP.toLowerCase().includes(searchValues.sapCodeNewSAP.toLowerCase())) &&
        (!searchValues.unit || item.unit.toLowerCase().includes(searchValues.unit.toLowerCase())) &&
        (!searchValues.departmentName ||
          item.departmentRequests.some((dept) => dept.name.toLowerCase().includes(searchValues.departmentName.toLowerCase())))
      );
    });
    setData(filteredData);
  };

  // Handle reset search
  const handleReset = () => {
    setSearchValues({
      productType1Name: '',
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSAPCode: '',
      sapCodeNewSAP: '',
      unit: '',
      departmentName: '',
    });
    setSortConfig({ key: null, direction: null });
    setData([]); // Clear data before refetching
    fetchData();
  };

  // Handle item deletion with DELETE API call
  const handleDelete = async (id) => {
    if (isCompleted) return; // Prevent deletion if group is completed
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/requisition-monthly/${id}`, {
        headers: { Accept: '*/*' },
      });
      if (response.status >= 200 && response.status < 300) {
        await fetchData();
        const maxPage = Math.max(0, Math.ceil((data.length - 1) / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
        setError(null);
        setSnackbarMessage('Item deleted successfully!');
      } else {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      setError(`Failed to delete item: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  // Dialog and navigation handlers
  const handleOpenEditDialog = (item) => {
    if (isCompleted) return; // Prevent editing if group is completed
    setSelectedItem(item);
    setOpenEditDialog(true);
  };

  const handleOpenAddDialog = () => {
    if (isCompleted) return; // Prevent adding if group is completed
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
      navigate(`/dashboard/comparison/${groupId}`);
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
    console.log('Image URLs:', fullSrcs);
    setPopoverImgSrcs(fullSrcs);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverImgSrcs([]);
  };

  const open = Boolean(anchorEl);
  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const isCompleted = groupStatus === 'Completed';

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

  // Snackbar state and message
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
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
                  background: isCompleted
                    ? 'grey.300'
                    : 'linear-gradient(to right, #4cb8ff, #027aff)',
                  color: isCompleted ? 'grey.700' : '#fff',
                  boxShadow: isCompleted
                    ? 'none'
                    : '0 2px 6px rgba(76, 184, 255, 0.3)',
                  '&:hover': {
                    background: isCompleted
                      ? 'grey.300'
                      : 'linear-gradient(to right, #3aa4f8, #016ae3)',
                    boxShadow: isCompleted
                      ? 'none'
                      : '0 3px 8px rgba(76, 184, 255, 0.4)',
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
        <Alert onClose={handleSnackbarClose} severity={snackbarMessage.includes('Failed') ? 'error' : 'success'} sx={{ width: '100%', fontSize: '0.65rem' }}>
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
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 2100 }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {headers.map(({ label, key, sortable }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Order Unit', 'Buying Qty', 'Total Not Issued Qty', 'In Hand', 'Actual In Hand', 'Order Qty', 'Images', 'Actions'].includes(label)
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
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                        '&:last-child': { borderRight: 'none' },
                        position: label === 'No' ? 'sticky' : 'static',
                        left: label === 'No' ? 0 : undefined,
                        zIndex: label === 'No' ? 2 : 1,
                        backgroundColor: '#027aff',
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
                    const rowBackgroundColor = '#fff';

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          backgroundColor: rowBackgroundColor,
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                            transition: 'background-color 0.3s ease',
                            '& .sticky-no-column': {
                              backgroundColor: '#e3f2fd',
                            },
                          },
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        <TableCell
                          align="center"
                          className="sticky-no-column"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                          }}
                        >
                          {globalIndex}
                        </TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.groupItem1 || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.groupItem2 || ''}</TableCell>
                        <TableCell sx={{ minWidth: 180, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.itemDescriptionEN || ''}</TableCell>
                        <TableCell sx={{ minWidth: 180, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.itemDescriptionVN || ''}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.oldSAPCode || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.sapCodeNewSAP || ''}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.unit || ''}</TableCell>
                        <TableCell sx={{ minWidth: 160, textAlign: 'center', py: 0.5, px: 0.8 }}>
                          <DeptRequestTable departmentRequests={row.departmentRequests} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.sumBuy || 0}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.totalNotIssuedQty || 0}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.inHand || 0}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.actualInHand || 0}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.orderQty || 0}</TableCell>
                        <TableCell sx={{ minWidth: 180, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.fullDescription || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.reason || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.remark || ''}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.remarkComparison || ''}</TableCell>
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
            count={data.length}
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