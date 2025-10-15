import React, { useState, useEffect, useCallback } from 'react';
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
  useMediaQuery,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupSearchBar from './GroupSearchBar';
import { API_BASE_URL } from '../../config';

// Check React version
const reactVersion = React.version.split('.')[0];
if (reactVersion >= 19) {
  console.warn('React 19 detected. Ant Design v5.x may have compatibility issues. See https://u.ant.design/v5-for-19 for details.');
}

const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const headers = [
  { label: 'No', key: 'no', sortable: false, hideOnSmall: false },
  { label: 'Name', key: 'name', sortable: true, hideOnSmall: false },
  { label: 'Type', key: 'type', sortable: true, hideOnSmall: false },
  { label: 'Status', key: 'status', sortable: true, hideOnSmall: false },
  { label: 'Created By', key: 'createdBy', sortable: true, hideOnSmall: true },
  { label: 'Created Date', key: 'createdDate', sortable: true, hideOnSmall: false },
  { label: 'Stock Date', key: 'stockDate', sortable: true, hideOnSmall: true },
  { label: 'Currency', key: 'currency', sortable: true, hideOnSmall: true },
  { label: 'Actions', key: 'actions', sortable: false, hideOnSmall: false },
];

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
  stockEndDate = null
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
    });
    if (startDate && startDate.isValid()) params.append('startDate', startDate.format('YYYY-MM-DD'));
    if (endDate && endDate.isValid()) params.append('endDate', endDate.format('YYYY-MM-DD'));
    if (stockStartDate && stockStartDate.isValid()) params.append('stockStartDate', stockStartDate.format('YYYY-MM-DD'));
    if (stockEndDate && stockEndDate.isValid()) params.append('stockEndDate', stockEndDate.format('YYYY-MM-DD'));

    const response = await fetch(`${apiUrl}/filter?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: '*/*', 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Fetched groups:', data.content);
    return {
      content: data.content || [],
      totalPages: data.totalPages || 1,
    };
  } catch (error) {
    console.error('Error fetching groups:', error);
    return { content: [], totalPages: 1 };
  }
};

const deleteGroup = async (id) => {
  try {
    const response = await fetch(`${apiUrl}/${id}`, {
      method: 'DELETE',
      headers: { Accept: '*/*', 'Content-Type': 'application/json' },
    });
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError);
      throw new Error('Failed to delete group');
    }
    if (!response.ok) throw new Error(responseBody.message || `Delete failed with status ${response.status}`);
    return { success: true, message: responseBody.message || 'Group deleted successfully' };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, message: error.message || 'Failed to delete group' };
  }
};

const formatDate = (dateArray) => {
  if (!Array.isArray(dateArray) || dateArray.length < 3) return null;
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return '#4caf50'; // Green
    case 'Not Started':
      return '#f44336'; // Red
    case 'In Progress':
      return '#2196f3'; // Blue
    default:
      return '#9e9e9e'; // Gray
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'Requisition_monthly':
      return '#64b5f6'; // Blue
    case 'Requisition_weekly':
      return '#e57373'; // Red
    default:
      return '#9e9e9e'; // Gray
  }
};

const getCurrencyColor = (currency) => {
  switch (currency) {
    case 'VND':
      return '#4caf50'; // Green
    case 'EURO':
      return '#2196f3'; // Blue
    case 'USD':
      return '#e57373'; // Red
    default:
      return '#9e9e9e'; // Gray
  }
};

export default function GroupRequestPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg')); // ≥1200px
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // ≤900px
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
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
  const [rowsPerPage, setRowsPerPage] = useState(isLargeScreen ? 20 : 12); // 20 for 24", 12 for 15.6"
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    const [startDate, endDate] = dateRange || [];
    const [stockStartDate, stockEndDate] = stockDateRange || [];
    const { content, totalPages } = await fetchGroups(
      page,
      rowsPerPage,
      nameFilter,
      statusFilter,
      createdByFilter,
      typeFilter,
      currencyFilter,
      startDate,
      endDate,
      stockStartDate,
      stockEndDate
    );
    console.log('Fetched groups:', content);
    setData(content || []);
    setOriginalData(content || []);
    setTotalPages(totalPages || 1);
    setLoading(false);
  }, [page, rowsPerPage, nameFilter, statusFilter, createdByFilter, typeFilter, currencyFilter, dateRange, stockDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Adjust rowsPerPage based on screen size
    setRowsPerPage(isLargeScreen ? 20 : 12);
    setPage(0); // Reset to first page when rowsPerPage changes
  }, [isLargeScreen]);

  const handleAddOk = () => {
    console.log('handleAddOk called');
    setIsAddModalOpen(false);
    fetchData();
  };

  const handleEditOk = () => {
    console.log('handleEditOk called with currentItem:', currentItem);
    setIsEditModalOpen(false);
    setCurrentItem(null);
    fetchData();
  };

  const handleDelete = (group) => {
    setSelectedGroup(group);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGroup) {
      setNotification({
        open: true,
        message: 'No group selected for deletion',
        severity: 'error',
      });
      setDeleteDialogOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { success, message } = await deleteGroup(selectedGroup.id);
      if (success) {
        await fetchData();
        const maxPage = Math.max(0, Math.ceil((data.length - 1) / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
      }
      setNotification({
        open: true,
        message: message,
        severity: success ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Delete group error:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to delete group',
        severity: 'error',
      });
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
    fetchData();
  };

  const handleReset = () => {
    setNameFilter('');
    setStatusFilter('');
    setCreatedByFilter('');
    setTypeFilter('');
    setCurrencyFilter('');
    setDateRange([]);
    setStockDateRange([]);
    setPage(0);
    setSortConfig({ key: null, direction: null });
    fetchData();
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
      setData([...originalData]);
      return;
    }

    const sortedData = [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === 'createdDate' || key === 'stockDate') {
        aValue = formatDate(a[key]) || '';
        bValue = formatDate(b[key]) || '';
      }

      if (aValue === null || aValue === undefined) return direction === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return direction === 'asc' ? 1 : -1;

      if (typeof aValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setData(sortedData);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseNotification = () => {
    setNotification({ open: false, message: '', severity: 'info' });
  };

  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box
      sx={{
        p: 1,
        fontSize: '0.65rem',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#f5f8fa',
        minHeight: '100vh',
      }}
    >
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
            fontWeight: 600,
            color: theme.palette.primary.dark,
            fontSize: '1rem',
          }}
        >
          Group
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            console.log('Opening AddGroupModal');
            setIsAddModalOpen(true);
          }}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 1,
            py: 0.2,
            fontWeight: 600,
            fontSize: '0.65rem',
            background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(76, 184, 255, 0.3)',
            '&:hover': {
              background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
              boxShadow: '0 6px 16px rgba(76, 184, 255, 0.4)',
            },
          }}
        >
          Add Request Group
        </Button>
      </Stack>

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

      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.7rem', mt: 1.5 }}>
          Loading data...
        </Typography>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%', fontSize: '0.7rem' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      {!loading && (
        <>
          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              overflowX: 'auto', // Allow horizontal scroll if needed
              boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.primary.main,
                borderRadius: '4px',
              },
            }}
          >
            <Table stickyHeader size="small" sx={{ width: '100%' }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {headers.map(({ label, key, sortable, hideOnSmall }) => (
                    <TableCell
                      key={key}
                      align={['No', 'Status', 'Currency', 'Actions'].includes(label) ? 'center' : 'left'}
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.65rem',
                        color: '#ffffff',
                        py: 0.5,
                        px: 1,
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                        '&:last-child': { borderRight: 'none' },
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        backgroundColor: '#027aff',
                        ...(key === 'no' && { left: 0, zIndex: 21, width: '60px' }),
                        cursor: sortable ? 'pointer' : 'default',
                        '&:hover': sortable ? { backgroundColor: '#016ae3' } : {},
                        ...(label === 'Name' && { width: '25%' }),
                        ...(label === 'Created By' && { width: '15%', display: { xs: hideOnSmall ? 'none' : 'table-cell', md: 'table-cell' } }),
                        ...(label === 'Created Date' && { width: '15%' }),
                        ...(label === 'Stock Date' && { width: '15%', display: { xs: hideOnSmall ? 'none' : 'table-cell', md: 'table-cell' } }),
                        ...(label === 'Currency' && { display: { xs: hideOnSmall ? 'none' : 'table-cell', md: 'table-cell' } }),
                        ...(label === 'Actions' && { width: '120px' }),
                      }}
                      onClick={() => sortable && handleSort(key)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: ['No', 'Status', 'Currency', 'Actions'].includes(label) ? 'center' : 'flex-start' }}>
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
                  displayData.map((group, idx) => {
                    const createdDateIso = formatDate(group.createdDate);
                    const stockDateIso = formatDate(group.stockDate);
                    const isCompleted = group.status === 'Completed';
                    return (
                      <TableRow
                        key={group.id}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease',
                          },
                          fontSize: '0.65rem',
                        }}
                      >
                        <TableCell
                          align="center"
                          sx={{
                            px: 1,
                            py: 0.5,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            fontSize: '0.65rem',
                          }}
                        >
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 1,
                            py: 0.5,
                            fontSize: '0.65rem',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                          }}
                        >
                          {group.name || ''}
                        </TableCell>
                        <TableCell sx={{ px: 1, py: 0.5, fontSize: '0.65rem' }}>
                          <Chip
                            label={
                              group.type === 'Requisition_monthly'
                                ? 'Monthly Requisition'
                                : group.type === 'Requisition_weekly'
                                ? 'Weekly Requisition'
                                : 'Unknown'
                            }
                            size="small"
                            sx={{
                              fontSize: '0.55rem',
                              fontWeight: 600,
                              bgcolor: getTypeColor(group.type),
                              color: '#fff',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1, py: 0.5, fontSize: '0.65rem' }}>
                          <Chip
                            label={group.status || ''}
                            size="small"
                            sx={{
                              fontSize: '0.55rem',
                              fontWeight: 600,
                              bgcolor: getStatusColor(group.status),
                              color: '#fff',
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 1,
                            py: 0.5,
                            fontSize: '0.65rem',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            display: { xs: headers.find(h => h.key === 'createdBy').hideOnSmall ? 'none' : 'table-cell', md: 'table-cell' },
                          }}
                        >
                          {group.createdBy || ''}
                        </TableCell>
                        <TableCell sx={{ px: 1, py: 0.5, fontSize: '0.65rem' }}>
                          {createdDateIso ? dayjs(createdDateIso).format('YYYY-MM-DD') : 'N/A'}
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 1,
                            py: 0.5,
                            fontSize: '0.65rem',
                            display: { xs: headers.find(h => h.key === 'stockDate').hideOnSmall ? 'none' : 'table-cell', md: 'table-cell' },
                          }}
                        >
                          {stockDateIso ? dayjs(stockDateIso).format('YYYY-MM-DD') : 'N/A'}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            px: 1,
                            py: 0.5,
                            fontSize: '0.65rem',
                            display: { xs: headers.find(h => h.key === 'currency').hideOnSmall ? 'none' : 'table-cell', md: 'table-cell' },
                          }}
                        >
                          <Chip
                            label={group.currency || 'N/A'}
                            size="small"
                            sx={{
                              fontSize: '0.55rem',
                              fontWeight: 600,
                              bgcolor: getCurrencyColor(group.currency),
                              color: '#fff',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1, py: 0.5 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                aria-label="view"
                                color="primary"
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.25)' },
                                  borderRadius: 1,
                                  p: 0.3,
                                }}
                                onClick={() => {
                                  console.log('Navigating to group:', group.id, 'type:', group.type);
                                  if (group.type === 'Requisition_monthly') {
                                    navigate(`/dashboard/requisition-monthly/${group.id}`);
                                  } else if (group.type === 'Requisition_weekly') {
                                    navigate(`/dashboard/summary/${group.id}`);
                                  } else {
                                    navigate(`/dashboard/summary/${group.id}`);
                                  }
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Group">
                              <IconButton
                                aria-label="edit"
                                color="success"
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(56, 142, 60, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(56, 142, 60, 0.25)' },
                                  borderRadius: 1,
                                  p: 0.3,
                                }}
                                onClick={() => {
                                  console.log('Opening EditGroupModal with group:', group);
                                  setCurrentItem(group);
                                  setIsEditModalOpen(true);
                                }}
                                disabled={isCompleted}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Group">
                              <IconButton
                                aria-label="delete"
                                color="error"
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.25)' },
                                  borderRadius: 1,
                                  p: 0.3,
                                }}
                                onClick={() => handleDelete(group)}
                                disabled={loading || isCompleted}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 2, color: '#90a4ae' }}>
                      <Typography sx={{ fontSize: '0.7rem' }}>No data available.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 12, 20, 50]}
            component="div"
            count={data.length}
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

      <AddGroupModal
        open={isAddModalOpen}
        onCancel={() => {
          console.log('Closing AddGroupModal');
          setIsAddModalOpen(false);
        }}
        onOk={handleAddOk}
      />
      <EditGroupModal
        open={isEditModalOpen}
        currentItem={currentItem}
        onCancel={() => {
          console.log('Closing EditGroupModal');
          setIsEditModalOpen(false);
          setCurrentItem(null);
        }}
        onOk={handleEditOk}
      />

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle sx={{ fontSize: '0.8rem' }}>Delete Group</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.7rem' }}>
            Are you sure you want to delete "{selectedGroup?.name || 'Unknown'}"?
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
    </Box>
  );
}