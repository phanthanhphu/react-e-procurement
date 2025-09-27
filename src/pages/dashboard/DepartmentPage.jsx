import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Typography,
  IconButton,
  Stack,
  Button,
  Paper,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import factoryImage from '../../assets/svg/logos/corporation.png';
import { API_BASE_URL } from '../../config';
import AddDepartmentDialog from './AddDepartmentDialog';
import EditDepartmentDialog from './EditDepartmentDialog';
import DepartmentSearch from './DepartmentSearch';
import Notification from './Notification';

const API_URL = `${API_BASE_URL}/api/departments`;

// Simple debounce function
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
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [divisionFilter, setDivisionFilter] = useState('');
  const [departmentNameFilter, setDepartmentNameFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);

  const theme = useTheme();

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const fetchDepartments = async (pageNumber = 0, divisionFilter = '', departmentNameFilter = '') => {
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    try {
      let url = `${API_URL}/filter?page=${pageNumber}&size=${size}`;
      if (divisionFilter.trim()) {
        url += `&division=${encodeURIComponent(divisionFilter.trim())}`;
      }
      if (departmentNameFilter.trim()) {
        url += `&departmentName=${encodeURIComponent(departmentNameFilter.trim())}`;
      }

      const res = await fetch(url, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) {
        let errorMessage = 'Failed to fetch departments';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      const { content, totalPages: tp } = data;

      const mapped = content.map((dep) => ({
        id: dep.id,
        departmentName: dep.departmentName,
        division: dep.division,
        createdAt: dep.createdAt,
        image: factoryImage,
      }));
      setDepartments(mapped);
      setTotalPages(tp);
      // No success notification for load data
    } catch (error) {
      console.error('Fetch departments error:', error);
      setNotification({
        open: true,
        message: `Failed to load departments: ${error.message}`,
        severity: 'error',
      });
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((division, departmentName) => {
      fetchDepartments(0, division, departmentName);
    }, 500),
    []
  );

  useEffect(() => {
    fetchDepartments(page, divisionFilter, departmentNameFilter);
  }, [page]);

  useEffect(() => {
    debouncedSearch(divisionFilter, departmentNameFilter);
  }, [divisionFilter, departmentNameFilter, debouncedSearch]);

  const handleResetSearch = () => {
    setDivisionFilter('');
    setDepartmentNameFilter('');
    setPage(0);
  };

  const handleAdd = async (newDepartment) => {
    console.log('handleAdd called with:', newDepartment);
    if (!newDepartment.departmentName.trim() || !newDepartment.division.trim()) {
      console.log('Validation failed: departmentName or division is empty');
      setNotification({
        open: true,
        message: 'Department name and division cannot be empty',
        severity: 'error',
      });
      return;
    }
    setLoading(true);
    try {
      const currentDate = new Date().toISOString();
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          id: `temp_${Date.now()}`,
          departmentName: newDepartment.departmentName,
          division: newDepartment.division,
          createdAt: currentDate,
        }),
      });
      let message;
      if (!res.ok) {
        const text = await res.text();
        console.log('Raw error response:', text);
        try {
          const errorData = JSON.parse(text);
          message = errorData.message || text || `Failed to add department: ${res.status}`;
        } catch (parseError) {
          message = text || `Failed to add department: ${res.status}`;
        }
        throw new Error(message);
      }
      const text = await res.text();
      console.log('Raw success response:', text);
      try {
        const data = JSON.parse(text);
        message = data.message || text || 'Department added successfully';
      } catch (parseError) {
        message = text || 'Department added successfully';
      }
      setAddDialogOpen(false);
      await fetchDepartments(0, divisionFilter, departmentNameFilter);
      setNotification({
        open: true,
        message: message,
        severity: 'success',
      });
    } catch (error) {
      console.error('Add department error:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedDepartment) => {
    if (!updatedDepartment) {
      setNotification({
        open: true,
        message: 'No department selected for update',
        severity: 'error',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${updatedDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
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
          console.log('Raw error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setEditDialogOpen(false);
      await fetchDepartments(page, divisionFilter, departmentNameFilter);
      setNotification({
        open: true,
        message: 'Department updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Update department error:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDepartment) {
      setNotification({
        open: true,
        message: 'No department selected for deletion',
        severity: 'error',
      });
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
          console.log('Raw error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      await fetchDepartments(page, divisionFilter, departmentNameFilter);
      setNotification({
        open: true,
        message: 'Department deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Delete department error:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
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

  const handleCancelEdit = () => setEditDialogOpen(false);
  const handleCancelDelete = () => setDeleteDialogOpen(false);

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPage(newPage);
  };

  return (
    <div style={{ padding: '15px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          textAlign: 'left',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#1976d2',
          lineHeight: 1.5,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Department
      </Typography>

      {/* Search + Add Button Row */}
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Grid item>
          <DepartmentSearch
            searchValue={divisionFilter}
            departmentNameValue={departmentNameFilter}
            onSearchChange={setDivisionFilter}
            onDepartmentNameChange={setDepartmentNameFilter}
            onSearch={({ departmentName, division }) => fetchDepartments(0, division, departmentName)}
            onReset={handleResetSearch}
          />
        </Grid>

        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 1.5,
              borderRadius: '6px',
              fontSize: '0.65rem',
              height: '30px',
            }}
            disabled={loading}
          >
            Add Department
          </Button>
        </Grid>
      </Grid>

      {/* Notification */}
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />

      {/* Department List */}
      <Grid container spacing={1.5} justifyContent="flex-start">
        {loading ? (
          <Typography
            variant="h6"
            align="center"
            sx={{ width: '100%', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.7rem', mt: 1.5 }}
          >
            Loading departments...
          </Typography>
        ) : departments.length === 0 ? (
          <Typography
            variant="h6"
            align="center"
            sx={{ width: '100%', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.7rem', mt: 1.5 }}
          >
            No departments found.
          </Typography>
        ) : (
          departments.map((dep) => (
            <Grid item xs={12} sm={6} md={1.5} key={dep.id}>
              <Paper elevation={3} sx={{ p: 1, height: '100%' }}>
                <Stack spacing={1} alignItems="center">
                  <img
                    src={dep.image}
                    alt={dep.departmentName}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e0f2fe',
                      background: '#f0f9ff',
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontFamily: 'Poppins, sans-serif',
                      color: '#374151',
                      textAlign: 'center',
                      fontSize: '0.55rem',
                    }}
                  >
                    {dep.departmentName}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      color: '#6b7280',
                      textAlign: 'center',
                      fontSize: '0.55rem',
                    }}
                  >
                    {dep.division}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => handleEdit(dep)}
                      sx={{
                        background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
                        color: '#fff',
                        borderRadius: '50%',
                        p: 0.5,
                      }}
                      disabled={loading}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(dep)}
                      sx={{
                        background: 'linear-gradient(135deg, #ef9a9a 0%, #e57373 100%)',
                        color: '#fff',
                        borderRadius: '50%',
                        p: 0.5,
                      }}
                      disabled={loading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination Controls */}
      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 1.5 }}>
        <Button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 0 || loading}
          sx={{
            bgcolor: '#f0f0f0',
            color: '#9e9e9e',
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: '0.65rem',
            px: 1,
            py: 0.3,
            '&:hover': {
              bgcolor: '#d6d6d6',
            },
            '&.Mui-disabled': {
              color: '#c0c0c0',
              bgcolor: '#f0f0f0',
              cursor: 'default',
            },
          }}
        >
          Previous
        </Button>
        <Typography variant="body1" sx={{ alignSelf: 'center', fontSize: '0.65rem' }}>
          Page {page + 1} / {totalPages}
        </Typography>
        <Button
          onClick={() => handlePageChange(page + 1)}
          disabled={page + 1 >= totalPages || loading}
          sx={{
            bgcolor: '#f0f0f0',
            color: '#9e9e9e',
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: '0.65rem',
            px: 1,
            py: 0.3,
            '&:hover': {
              bgcolor: '#d6d6d6',
            },
            '&.Mui-disabled': {
              color: '#c0c0c0',
              bgcolor: '#f0f0f0',
              cursor: 'default',
            },
          }}
        >
          Next
        </Button>
      </Stack>

      {/* Dialogs */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle sx={{ fontSize: '0.8rem' }}>Delete Department</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.7rem' }}>
            Are you sure you want to delete &quot;{selectedDepartment?.departmentName || 'Unknown'}&quot;?
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

      <EditDepartmentDialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
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
    </div>
  );
}