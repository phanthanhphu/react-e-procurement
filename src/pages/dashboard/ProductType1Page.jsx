import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  useTheme,
  Button,
  Snackbar,
  Alert,
  Divider,
  Pagination,
  Select,
  MenuItem,
  Container,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { Add, Edit, Delete, Visibility, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useNavigate } from 'react-router-dom';
import ProductTypeSearch from './ProductTypeSearch';
import { API_BASE_URL } from '../../config';

import AddProductType1Dialog from './AddProductType1Dialog';
import EditProductType1Dialog from './EditProductType1Dialog';

const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Created Date', key: 'createdDate', sortable: true },
  { label: 'Action', key: 'action', sortable: false },
];

/* =========================
   ✅ PaginationBar (giống UI mới)
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
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '0.8rem',
                minWidth: 32,
                height: 32,
              },
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
            sx={{
              height: 32,
              minWidth: 110,
              borderRadius: 1.2,
              '& .MuiSelect-select': { fontSize: '0.8rem' },
            }}
          >
            {[5, 10, 25, 50].map((n) => (
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
   ✅ Table (UI mới: fixed layout + colgroup)
   ========================= */
function ProductType1Table({
  productTypes,
  handleDelete,
  handleEdit,
  handleView,
  page,
  rowsPerPage,
  sortConfig,
  handleSort,
  setNotification,
}) {
  const formatCreatedDate = (createdDateArray) => {
    if (!createdDateArray || createdDateArray.length < 3) return '';
    const [year, month, day] = createdDateArray;
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${dd}/${mm}/${year}`;
  };

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

  const cellEllipsisSx = {
    fontSize: '0.8rem',
    py: 0.55,
    px: 0.8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 0,
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 1.5,
        border: '1px solid #e5e7eb',
        maxHeight: 560,
        overflowX: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      <Table stickyHeader size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '10%' }} />
          <col style={{ width: '55%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>

        <TableHead>
          <TableRow>
            {headers.map(({ label, key, sortable }) => (
              <TableCell
                key={key}
                align={label === 'Action' || label === 'No' ? 'center' : 'left'}
                onClick={() => sortable && handleSort(key)}
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#111827',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  py: 0.75,
                  px: 0.9,
                  whiteSpace: 'nowrap',
                  cursor: sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.6}
                  alignItems="center"
                  justifyContent={label === 'Action' || label === 'No' ? 'center' : 'flex-start'}
                >
                  <span>{label}</span>
                  {sortable ? renderSortIndicator(key) : null}
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {productTypes && productTypes.length > 0 ? (
            productTypes.map((productType, idx) => {
              const zebra = idx % 2 === 0 ? '#ffffff' : '#fafafa';

              return (
                <TableRow
                  key={productType.id || idx}
                  sx={{
                    backgroundColor: zebra,
                    '&:hover': { backgroundColor: '#f1f5f9' },
                    '& > *': { borderBottom: '1px solid #f3f4f6' },
                  }}
                >
                  <TableCell align="center" sx={{ fontSize: '0.8rem', py: 0.55, px: 0.8 }}>
                    {idx + 1 + page * rowsPerPage}
                  </TableCell>

                  <TableCell sx={cellEllipsisSx} title={productType.name || ''}>
                    {productType.name || ''}
                  </TableCell>

                  <TableCell sx={cellEllipsisSx} title={formatCreatedDate(productType.createdDate)}>
                    {formatCreatedDate(productType.createdDate)}
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.55, px: 0.8 }}>
                    <Stack direction="row" spacing={0.3} justifyContent="center">
                      <Tooltip title="View">
                        <span>
                          <IconButton
                            aria-label="view"
                            color="primary"
                            size="small"
                            sx={{ p: 0.25 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!productType.id) {
                                setNotification({ open: true, message: 'Invalid Product Type ID', severity: 'error' });
                                return;
                              }
                              handleView(productType);
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            aria-label="edit"
                            color="success"
                            size="small"
                            sx={{ p: 0.25 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(productType);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            aria-label="delete"
                            color="error"
                            size="small"
                            sx={{ p: 0.25 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(productType);
                            }}
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
              <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                No Data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function ProductType1Page() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState(null);

  const [productTypeToEdit, setProductTypeToEdit] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [type1Name, setType1Name] = useState('');

  const btnSx = useMemo(() => ({ textTransform: 'none', fontWeight: 400 }), []);

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // ✅ fix nhẹ: cho phép override page/size để tránh stale state khi setPage(0) rồi fetch
  const fetchData = useCallback(
    async ({ name = '', pageOverride = page, sizeOverride = rowsPerPage } = {}) => {
      setLoading(true);
      setNotification({ open: false, message: '', severity: 'info' });
      try {
        const url = new URL(`${API_BASE_URL}/api/product-type-1/search`);
        const params = { page: pageOverride, size: sizeOverride };
        if (name) params.name = name;
        url.search = new URLSearchParams(params).toString();

        const response = await fetch(url, {
          method: 'GET',
          headers: { accept: '*/*' },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.content || []);
        setTotalElements(result.totalElements || 0);
      } catch (err) {
        setNotification({
          open: true,
          message: `Failed to load data: ${err.message}`,
          severity: 'error',
        });
        setData([]);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage]
  );

  useEffect(() => {
    fetchData({ name: type1Name });
  }, [fetchData, type1Name]);

  // ===== Add / Update handlers (được dialog gọi) =====
  const handleAdd = async (name) => {
    const url = new URL(`${API_BASE_URL}/api/product-type-1`);
    url.search = new URLSearchParams({ name }).toString();

    const response = await fetch(url, { method: 'POST', headers: { accept: '*/*' } });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    setPage(0);
    await fetchData({ name: type1Name, pageOverride: 0 });

    setNotification({
      open: true,
      message: `Name '${result.name}' has been added`,
      severity: 'success',
      autoHideDuration: 6000,
    });
  };

  const handleUpdate = async ({ id, name }) => {
    const url = new URL(`${API_BASE_URL}/api/product-type-1/${id}`);
    url.search = new URLSearchParams({ name }).toString();

    const response = await fetch(url, { method: 'PUT', headers: { accept: '*/*' } });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    setPage(0);
    await fetchData({ name: type1Name, pageOverride: 0 });

    setNotification({
      open: true,
      message: `Name '${name}' has been updated`,
      severity: 'success',
      autoHideDuration: 6000,
    });
  };

  const handleEdit = (productType) => {
    setProductTypeToEdit(productType);
    setOpenEditDialog(true);
  };

  const handleDelete = (productType) => {
    setProductTypeToDelete(productType);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!productTypeToDelete) {
      setNotification({ open: true, message: 'No product type selected for deletion', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/product-type-1/${productTypeToDelete.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setPage(0);
      await fetchData({ name: type1Name, pageOverride: 0 });

      setNotification({
        open: true,
        message: `Name '${productTypeToDelete.name}' has been deleted`,
        severity: 'success',
        autoHideDuration: 6000,
      });
    } catch (err) {
      setNotification({ open: true, message: `Failed to delete product type: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setProductTypeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setProductTypeToDelete(null);
  };

  const handleView = (productType) => {
    if (!productType.id) {
      setNotification({ open: true, message: 'Invalid Product Type ID', severity: 'error' });
      return;
    }
    navigate(`/product-type-2/${productType.id}`, { state: { type1Name: productType.name } });
  };

  // ✅ sort tri-state: asc -> desc -> off
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;

    setSortConfig({ key: direction ? key : null, direction });
    setPage(0);

    if (!direction) {
      fetchData({ name: type1Name, pageOverride: 0 });
      return;
    }

    const sortedData = [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (key === 'createdDate') {
        if (!Array.isArray(aValue) || !Array.isArray(bValue) || aValue.length < 3 || bValue.length < 3) return 0;
        const [aYear, aMonth, aDay] = aValue;
        const [bYear, bMonth, bDay] = bValue;
        const aDate = new Date(aYear, aMonth - 1, aDay);
        const bDate = new Date(bYear, bMonth - 1, bDay);
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      return direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setData(sortedData);
  };

  const handleType1NameChange = (value) => {
    setType1Name(value);
    setPage(0);
  };

  const handleSearch = ({ name }) => {
    setType1Name(name);
    setPage(0);
    fetchData({ name, pageOverride: 0 });
  };

  const handleReset = () => {
    setType1Name('');
    setSortConfig({ key: null, direction: null });
    setPage(0);
    fetchData({ name: '', pageOverride: 0 });
  };

  return (
    <Box sx={{ p: 1.5, minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      <Container maxWidth={false} disableGutters sx={{ px: 1.5 }}>
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
            <Stack spacing={0.4}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                Product Type 1
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                Total: {totalElements} • {type1Name ? `Filter: "${type1Name}"` : 'Filter: none'} • Sort:{' '}
                {sortConfig.key ? `${sortConfig.key} (${sortConfig.direction})` : 'none'}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<Add fontSize="small" />}
              onClick={() => setOpenAddDialog(true)}
              disabled={loading}
              sx={btnSx}
            >
              Add Product Type 1
            </Button>
          </Stack>
        </Paper>

        {/* Search */}
        <ProductTypeSearch
          type1NameValue={type1Name}
          onType1NameChange={handleType1NameChange}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {loading && (
          <Typography align="center" sx={{ color: '#6b7280', fontSize: '0.85rem', mt: 1.5 }}>
            Loading data...
          </Typography>
        )}

        {/* Table */}
        <ProductType1Table
          productTypes={data}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
          handleView={handleView}
          page={page}
          rowsPerPage={rowsPerPage}
          sortConfig={sortConfig}
          handleSort={handleSort}
          setNotification={setNotification}
        />

        {/* PaginationBar */}
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

        {/* Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={notification.autoHideDuration || 6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%', fontSize: '0.85rem' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* ✅ Add (NEW FILE) */}
        <AddProductType1Dialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          onAdd={handleAdd}
          disabled={loading}
        />

        {/* ✅ Edit (NEW FILE) */}
        <EditProductType1Dialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setProductTypeToEdit(null);
          }}
          onUpdate={handleUpdate}
          productType={productTypeToEdit}
          disabled={loading}
        />

        {/* Delete Confirm (giữ nguyên đơn giản) */}
        <Dialog open={openDeleteDialog} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontSize: '0.95rem' }}>Delete Product Type</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#374151', fontSize: '0.9rem' }}>
              Are you sure you want to delete &quot;{productTypeToDelete?.name || 'Unknown'}&quot;?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} sx={btnSx}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={loading} sx={btnSx}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
