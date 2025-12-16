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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Container,
  Divider,
  Pagination,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import { Add, Edit, Delete, ArrowUpward, ArrowDownward, ArrowBack } from '@mui/icons-material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProductType2Search from './ProductType2Search';
import { API_BASE_URL } from '../../config';

import AddProductType2Dialog from './AddProductType2Dialog';
import EditProductType2Dialog from './EditProductType2Dialog';

const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Created Date', key: 'createdDate', sortable: true },
  { label: 'Action', key: 'action', sortable: false },
];

/* =========================
   ✅ PaginationBar
   ========================= */
function PaginationBar({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange, loading }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / (rowsPerPage || 1)));
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count || 0, (page + 1) * rowsPerPage);

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
            sx={{ textTransform: 'none', fontWeight: 400 }}
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
            sx={{ textTransform: 'none', fontWeight: 400 }}
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
   ✅ Table (fixed layout + colgroup)
   ========================= */
function ProductType2Table({ productTypes, handleDelete, handleEdit, page, rowsPerPage, sortConfig, handleSort }) {
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
                No Data Available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function ProductType2Page() {
  const theme = useTheme();
  const { productType1Id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const type1Name = location.state?.type1Name || 'Unknown';

  const [data, setData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState(null);

  const [productTypeToEdit, setProductTypeToEdit] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [type2NameValue, setType2NameValue] = useState('');

  const btnSx = useMemo(() => ({ textTransform: 'none', fontWeight: 400 }), []);

  const handleCloseNotification = () => setNotification((prev) => ({ ...prev, open: false }));

  // ✅ unified fetch: có name -> search endpoint, không có -> list endpoint
  const fetchData = useCallback(
    async ({ name = type2NameValue, pageOverride = page, sizeOverride = rowsPerPage } = {}) => {
      setLoading(true);
      setNotification({ open: false, message: '', severity: 'info' });

      try {
        const useSearch = !!(name && name.trim());
        const url = new URL(
          useSearch ? `${API_BASE_URL}/api/product-type-2/search` : `${API_BASE_URL}/api/product-type-2`
        );

        const params = {
          productType1Id,
          page: pageOverride,
          size: sizeOverride,
        };
        if (useSearch) params.name = name.trim();

        url.search = new URLSearchParams(params).toString();

        const response = await fetch(url, { method: 'GET', headers: { accept: '*/*' } });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.content || []);
        setTotalElements(result.totalElements || 0);
      } catch (err) {
        setNotification({ open: true, message: `Failed to load data: ${err.message}`, severity: 'error' });
        setData([]);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE_URL, productType1Id, page, rowsPerPage, type2NameValue]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== actions =====
  const handleAdd = async (name) => {
    const url = new URL(`${API_BASE_URL}/api/product-type-2`);
    url.search = new URLSearchParams({ productType1Id, name }).toString();

    const response = await fetch(url, { method: 'POST', headers: { accept: '*/*' } });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    setPage(0);
    await fetchData({ pageOverride: 0 });

    setNotification({
      open: true,
      message: `Name '${result.name}' has been added`,
      severity: 'success',
      autoHideDuration: 6000,
    });
  };

  const handleUpdate = async ({ id, name }) => {
    if (!id) throw new Error('Invalid Product Type ID');

    const url = new URL(`${API_BASE_URL}/api/product-type-2/${id}`);
    url.search = new URLSearchParams({ name }).toString();

    const response = await fetch(url, { method: 'PUT', headers: { accept: '*/*' } });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    setPage(0);
    await fetchData({ pageOverride: 0 });

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
    if (!productTypeToDelete?.id) {
      setNotification({ open: true, message: 'No product type selected for deletion', severity: 'error' });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/product-type-2/${productTypeToDelete.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setPage(0);
      await fetchData({ pageOverride: 0 });

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

  // ✅ sort tri-state: asc -> desc -> off
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;

    setSortConfig({ key: direction ? key : null, direction });
    setPage(0);

    if (!direction) {
      fetchData({ pageOverride: 0 });
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

  const handleType2NameChange = (value) => {
    setType2NameValue(value);
    setPage(0);
  };

  const handleSearch = ({ name }) => {
    const v = (name || '').trim();
    setType2NameValue(v);
    setPage(0);
    fetchData({ name: v, pageOverride: 0 });
  };

  const handleReset = () => {
    setType2NameValue('');
    setSortConfig({ key: null, direction: null });
    setPage(0);
    fetchData({ name: '', pageOverride: 0 });
  };

  // ===== delete confirm style (same vibe but keep inside page to stay 3 files) =====
  const deletePaperSx = useMemo(
    () => ({
      borderRadius: 4,
      border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
      background: alpha('#FFFFFF', 0.92),
      backdropFilter: 'blur(14px)',
      boxShadow: `0 22px 70px ${alpha('#000', 0.18)}`,
      overflow: 'hidden',
    }),
    [theme]
  );

  const deleteHeaderSx = useMemo(
    () => ({
      py: 1.6,
      px: 2.3,
      color: 'common.white',
      background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
    }),
    [theme]
  );

  const pillBtn = (color = 'primary') => ({
    borderRadius: 999,
    px: 2.2,
    py: 1.05,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    ...(color === 'danger'
      ? {
          backgroundImage: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
          boxShadow: `0 10px 24px ${alpha(theme.palette.error.main, 0.25)}`,
          '&:hover': {
            backgroundImage: `linear-gradient(90deg, ${theme.palette.error.dark}, ${theme.palette.warning.dark})`,
            boxShadow: `0 14px 30px ${alpha(theme.palette.error.main, 0.32)}`,
            transform: 'translateY(-1px)',
          },
        }
      : {}),
  });

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
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={() => navigate('/product-type-management')}
                disabled={loading}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                }}
                aria-label="Back"
              >
                <ArrowBack fontSize="small" />
              </IconButton>

              <Stack spacing={0.35}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                  Product Type 2 • {type1Name}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  Total: {totalElements} • Filter: {type2NameValue ? `"${type2NameValue}"` : 'none'} • Sort:{' '}
                  {sortConfig.key ? `${sortConfig.key} (${sortConfig.direction})` : 'none'}
                </Typography>
              </Stack>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<Add fontSize="small" />}
              onClick={() => setOpenAddDialog(true)}
              disabled={loading}
              sx={btnSx}
            >
              Add Product Type 2
            </Button>
          </Stack>
        </Paper>

        {/* Search */}
        <ProductType2Search
          type2NameValue={type2NameValue}
          onType2NameChange={handleType2NameChange}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {loading && (
          <Typography align="center" sx={{ color: '#6b7280', fontSize: '0.85rem', mt: 1.5 }}>
            Loading data...
          </Typography>
        )}

        {/* Table */}
        <ProductType2Table
          productTypes={data}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
          page={page}
          rowsPerPage={rowsPerPage}
          sortConfig={sortConfig}
          handleSort={handleSort}
        />

        {/* Pagination */}
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
        <AddProductType2Dialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          onAdd={handleAdd}
          disabled={loading}
          type1Name={type1Name}
        />

        {/* ✅ Edit (NEW FILE) */}
        <EditProductType2Dialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setProductTypeToEdit(null);
          }}
          onUpdate={handleUpdate}
          productType={productTypeToEdit}
          disabled={loading}
          type1Name={type1Name}
        />

        {/* Delete Confirm (styled but kept inside page = vẫn đúng 3 file) */}
        <Dialog open={openDeleteDialog} onClose={handleCancelDelete} maxWidth="xs" fullWidth PaperProps={{ sx: deletePaperSx }}>
          <DialogTitle sx={deleteHeaderSx}>
            <Typography sx={{ fontWeight: 900, letterSpacing: 1.1, textTransform: 'uppercase' }}>
              Delete Product Type 2
            </Typography>
            <Typography sx={{ opacity: 0.92, mt: 0.3, fontSize: 13 }}>
              Parent: <b>{type1Name}</b>
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 13.5 }}>
              Are you sure you want to delete <b>{productTypeToDelete?.name || 'Unknown'}</b>?
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleCancelDelete} disabled={loading} variant="outlined" sx={{ borderRadius: 999, px: 2.2, py: 1.05, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} disabled={loading} variant="contained" sx={pillBtn('danger')}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
