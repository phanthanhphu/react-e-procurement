import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import factoryImage from '../../assets/svg/logos/corporation.png';
import { API_BASE_URL } from '../../config';

import AddDepartmentDialog from './AddDepartmentDialog';
import EditDepartmentDialog from './EditDepartmentDialog';
import DepartmentSearch from './DepartmentSearch';

const API_URL = `${API_BASE_URL}/api/departments`;

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [divisionFilter, setDivisionFilter] = useState('');
  const [departmentNameFilter, setDepartmentNameFilter] = useState('');

  const [page, setPage] = useState(0);
  const size = 20; // ✅ 20/page
  const [totalPages, setTotalPages] = useState(1);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const closeNotification = () => setNotification((prev) => ({ ...prev, open: false }));

  const fetchDepartments = useCallback(
    async (pageNumber = 0, division = '', departmentName = '') => {
      setLoading(true);
      setNotification({ open: false, message: '', severity: 'info' });

      try {
        let url = `${API_URL}/filter?page=${pageNumber}&size=${size}`;
        if (division.trim()) url += `&division=${encodeURIComponent(division.trim())}`;
        if (departmentName.trim()) url += `&departmentName=${encodeURIComponent(departmentName.trim())}`;

        const res = await fetch(url, { headers: { accept: '*/*' } });

        if (!res.ok) {
          let errorMessage = 'Failed to fetch departments';
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }

        const data = await res.json();
        const { content, totalPages: tp } = data;

        const mapped = (content || []).map((dep) => ({
          id: dep.id,
          departmentName: dep.departmentName,
          division: dep.division,
          createdAt: dep.createdAt,
          image: factoryImage,
        }));

        setDepartments(mapped);
        setTotalPages(tp || 1);

        if ((tp || 1) > 0 && pageNumber >= (tp || 1)) {
          setPage(Math.max(0, (tp || 1) - 1));
        }
      } catch (error) {
        console.error('Fetch departments error:', error);
        setNotification({
          open: true,
          message: `Failed to load departments: ${error.message}`,
          severity: 'error',
        });
        setDepartments([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [size]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((division, departmentName) => {
        setPage(0);
        fetchDepartments(0, division, departmentName);
      }, 500),
    [fetchDepartments]
  );

  const mountedRef = useRef(false);

  useEffect(() => {
    fetchDepartments(page, divisionFilter, departmentNameFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    debouncedSearch(divisionFilter, departmentNameFilter);
  }, [divisionFilter, departmentNameFilter, debouncedSearch]);

  const handleResetSearch = () => {
    setDivisionFilter('');
    setDepartmentNameFilter('');
    setPage(0);
    fetchDepartments(0, '', '');
  };

  const handleAdd = async (newDepartment) => {
    if (!newDepartment?.departmentName?.trim() || !newDepartment?.division?.trim()) {
      setNotification({ open: true, message: 'Department name and division cannot be empty', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const currentDate = new Date().toISOString();
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: '*/*' },
        body: JSON.stringify({
          id: `temp_${Date.now()}`,
          departmentName: newDepartment.departmentName,
          division: newDepartment.division,
          createdAt: currentDate,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = text || `Failed to add department: ${res.status}`;
        try {
          const errorData = JSON.parse(text);
          message = errorData.message || message;
        } catch {}
        throw new Error(message);
      }

      setAddDialogOpen(false);
      setPage(0);
      await fetchDepartments(0, divisionFilter, departmentNameFilter);
      setNotification({ open: true, message: 'Department added successfully', severity: 'success' });
    } catch (error) {
      console.error('Add department error:', error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedDepartment) => {
    if (!updatedDepartment) {
      setNotification({ open: true, message: 'No department selected for update', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${updatedDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', accept: '*/*' },
        body: JSON.stringify({
          id: updatedDepartment.id,
          departmentName: updatedDepartment.departmentName,
          division: updatedDepartment.division,
          createdAt: updatedDepartment.createdAt,
        }),
      });

      if (!res.ok) {
        let errorMessage = `Failed to update department: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      setEditDialogOpen(false);
      await fetchDepartments(page, divisionFilter, departmentNameFilter);
      setNotification({ open: true, message: 'Department updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Update department error:', error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDepartment) {
      setNotification({ open: true, message: 'No department selected for deletion', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${selectedDepartment.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
      });

      if (!res.ok) {
        let errorMessage = 'Could not delete department';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      await fetchDepartments(page, divisionFilter, departmentNameFilter);
      setNotification({ open: true, message: 'Department deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Delete department error:', error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedDepartment(null);
    }
  };

  const handleEdit = (dep) => {
    setSelectedDepartment(dep);
    setEditDialogOpen(true);
  };

  const handleDelete = (dep) => {
    setSelectedDepartment(dep);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPage(newPage);
  };

  // ====== UI tokens ======
  const pageWrapSx = useMemo(
    () => ({
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      px: { xs: 1.5, md: 2 },
      py: 2,
    }),
    []
  );

  const sectionCardSx = useMemo(
    () => ({
      p: 1.25,
      borderRadius: 1.5,
      border: '1px solid #e5e7eb',
      backgroundColor: '#fff',
      boxSizing: 'border-box',
    }),
    []
  );

  const btnPrimarySx = useMemo(
    () => ({
      textTransform: 'none',
      fontWeight: 400,
      borderRadius: 1.2,
      height: 34,
      fontSize: '0.85rem',
      px: 2,
      backgroundColor: '#111827',
      '&:hover': { backgroundColor: '#0b1220' },
      whiteSpace: 'nowrap',
    }),
    []
  );

  const pagerBtnSx = useMemo(
    () => ({
      textTransform: 'none',
      borderRadius: 1.2,
      height: 34,
      fontSize: '0.85rem',
      px: 1.2,
      color: '#111827',
      borderColor: '#e5e7eb',
      backgroundColor: '#fff',
      '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
      '&.Mui-disabled': { color: '#9ca3af', borderColor: '#e5e7eb' },
      whiteSpace: 'nowrap',
      minWidth: 44,
    }),
    []
  );

  const iconPill = (bg) => ({
    width: 34,
    height: 34,
    borderRadius: 1.2,
    backgroundColor: bg,
    border: '1px solid #e5e7eb',
    '&:hover': { filter: 'brightness(0.98)', backgroundColor: bg },
  });

  // ✅ (chỉ chỉnh đúng 2 ý bạn yêu cầu)
  // 1) mỗi box 4 item  -> 4 box = 16 item hiển thị
  // 2) bỏ title "Box 1,2,3..."
  const buckets = useMemo(() => {
    const visible = departments.slice(0, 16);
    return [visible.slice(0, 4), visible.slice(4, 8), visible.slice(8, 12), visible.slice(12, 16)];
  }, [departments]);

  return (
    <Box sx={pageWrapSx}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={1.25}
        sx={{ mb: 1.25 }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.3,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Department
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mt: 0.25 }}>
            Manage departments • <b>{size}</b>/page
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          sx={btnPrimarySx}
          disabled={loading}
        >
          Add Department
        </Button>
      </Stack>

      {/* Filters */}
      <Paper elevation={0} sx={{ ...sectionCardSx, mb: 1.25 }}>
        <DepartmentSearch
          searchValue={divisionFilter}
          departmentNameValue={departmentNameFilter}
          onSearchChange={(v) => setDivisionFilter(v)}
          onDepartmentNameChange={(v) => setDepartmentNameFilter(v)}
          onSearch={({ departmentName, division }) => {
            setPage(0);
            fetchDepartments(0, division, departmentName);
          }}
          onReset={handleResetSearch}
          disabled={loading}
        />
      </Paper>

      {/* List */}
      <Paper elevation={0} sx={sectionCardSx}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
            Departments
          </Typography>

          {loading && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} />
              <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Loading…</Typography>
            </Stack>
          )}
        </Stack>

        <Divider sx={{ borderColor: '#eef2f7', mb: 1.25 }} />

        {!loading && departments.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: '#6b7280' }}>
            <Typography sx={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No departments found.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.25,
              alignItems: 'stretch',
            }}
          >
            {buckets.map((list, boxIndex) => (
              <Paper
                key={boxIndex}
                elevation={0}
                sx={{
                  borderRadius: 1.75,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 260,
                }}
              >
                {/* Box Header (GIỮ NGUYÊN CSS, chỉ bỏ title) */}
                <Box
                  sx={{
                    px: 1.25,
                    py: 1,
                    borderBottom: '1px solid #eef2f7',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    {/* bỏ "Box 1/2/3/4" nhưng giữ layout */}
                    <Typography
                      sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}
                      aria-hidden="true"
                    >
                      {'\u00A0'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {list.length} items
                    </Typography>
                  </Stack>
                </Box>

                {/* Box Content */}
                <Box
                  sx={{
                    p: 1.25,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    flex: 1,
                    overflow: 'auto',
                  }}
                >
                  {list.length === 0 ? (
                    <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>
                      Empty
                    </Typography>
                  ) : (
                    list.map((dep) => (
                      <Paper
                        key={dep.id}
                        elevation={0}
                        sx={{
                          borderRadius: 1.5,
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#fff',
                          p: 1.1,
                          transition: 'transform 180ms ease, box-shadow 180ms ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 10px 24px rgb(0 0 0 / 0.06)',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.1} alignItems="center">
                          <Box
                            component="img"
                            src={dep.image}
                            alt={dep.departmentName}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1.4,
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#f9fafb',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                color: '#111827',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={dep.departmentName}
                            >
                              {dep.departmentName}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: '0.84rem',
                                color: '#6b7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={dep.division}
                            >
                              {dep.division}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={0.75} flexShrink={0}>
                            <IconButton
                              onClick={() => handleEdit(dep)}
                              disabled={loading}
                              sx={iconPill('#f9fafb')}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <EditIcon sx={{ fontSize: 18, color: '#111827' }} />
                            </IconButton>

                            <IconButton
                              onClick={() => handleDelete(dep)}
                              disabled={loading}
                              sx={iconPill('#fff5f5')}
                              aria-label="Delete"
                              title="Delete"
                            >
                              <DeleteIcon sx={{ fontSize: 18, color: '#b91c1c' }} />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* Pagination */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Page <b style={{ color: '#111827' }}>{page + 1}</b> / {totalPages}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<ChevronLeftIcon />}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0 || loading}
              sx={pagerBtnSx}
            >
              Prev
            </Button>

            <Button
              variant="outlined"
              endIcon={<ChevronRightIcon />}
              onClick={() => handlePageChange(page + 1)}
              disabled={page + 1 >= totalPages || loading}
              sx={pagerBtnSx}
            >
              Next
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            width: { xs: '92%', sm: 420 },
            maxWidth: 520,
            borderRadius: 1.5,
            boxShadow: '0 10px 30px rgb(0 0 0 / 0.12)',
          },
        }}
      >
        <Alert onClose={closeNotification} severity={notification.severity} sx={{ width: '100%', fontSize: '0.9rem' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Delete confirm */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, border: '1px solid #e5e7eb' } }}
      >
        <DialogTitle sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
          Delete Department
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to delete <b>{selectedDepartment?.departmentName || 'Unknown'}</b>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: 1.2,
              height: 34,
              fontSize: '0.85rem',
              borderColor: '#e5e7eb',
              color: '#111827',
              '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 1.2,
              height: 34,
              fontSize: '0.85rem',
              px: 2,
              backgroundColor: '#b91c1c',
              '&:hover': { backgroundColor: '#991b1b' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit / Add */}
      <EditDepartmentDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onUpdate={handleUpdate}
        department={selectedDepartment}
        disabled={loading}
      />

      <AddDepartmentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAdd}
        disabled={loading}
      />
    </Box>
  );
}
