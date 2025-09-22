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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [divisionFilter, setDivisionFilter] = useState('');
  const [departmentNameFilter, setDepartmentNameFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);

  const theme = useTheme();

  const fetchDepartments = async (pageNumber = 0, divisionFilter = '', departmentNameFilter = '') => {
    setLoading(true);
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
      if (!res.ok) throw new Error('Failed to fetch departments');
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
    } catch (error) {
      console.error(error);
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

  // Trigger debounced search on divisionFilter or departmentNameFilter change
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
      return;
    }
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
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add department: ${res.status} - ${errorText}`);
      }
      setAddDialogOpen(false);
      fetchDepartments(0, divisionFilter, departmentNameFilter);
    } catch (error) {
      console.error('Add department error:', error);
    }
  };

  const handleUpdate = async (updatedDepartment) => {
    if (!updatedDepartment) return;
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
      if (!res.ok) throw new Error(`Failed to update department: ${res.status}`);
      setEditDialogOpen(false);
      fetchDepartments(page, divisionFilter, departmentNameFilter);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDepartment) return;
    try {
      const res = await fetch(`${API_URL}/${selectedDepartment.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error(`Failed to delete department: ${res.status}`);
      setDeleteDialogOpen(false);
      fetchDepartments(page, divisionFilter, departmentNameFilter);
    } catch (error) {
      console.error(error);
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
        Department Management
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
          >
            Add Department
          </Button>
        </Grid>
      </Grid>

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
          disabled={page === 0}
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
          disabled={page + 1 >= totalPages}
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
            Are you sure you want to delete this department?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary" sx={{ fontSize: '0.65rem' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ fontSize: '0.65rem' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <EditDepartmentDialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        onUpdate={handleUpdate}
        department={selectedDepartment}
      />

      <AddDepartmentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}