import React, { useState, useEffect } from 'react';
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
import factoryImage from '../../assets/svg/logos/factory_1.png';
import { API_BASE_URL } from '../../config';

import AddDepartmentDialog from './AddDepartmentDialog';
import EditDepartmentDialog from './EditDepartmentDialog';
import DepartmentSearch from './DepartmentSearch';

const API_URL = `${API_BASE_URL}/api/departments`;

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [newName, setNewName] = useState('');
  const [page, setPage] = useState(0);
  const limit = 16;
  const [totalPages, setTotalPages] = useState(1);

  const theme = useTheme();

  useEffect(() => {
    fetchDepartments(page);
  }, [page]);

  const fetchDepartments = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/page?page=${pageNumber}&limit=${limit}`, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      const { content, totalPages: tp } = data;
      const mapped = content.map((dep) => ({
        id: dep.id,
        name: dep.name,
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

  const handleSearch = async () => {
    if (!newName.trim()) return fetchDepartments(0);

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/page/search?name=${encodeURIComponent(newName.trim())}&page=0&limit=${limit}`,
        { headers: { accept: '*/*' } }
      );
      if (!res.ok) throw new Error('Failed to search departments');
      const data = await res.json();
      const { content, totalPages: tp } = data;
      const mapped = content.map((dep) => ({
        id: dep.id,
        name: dep.name,
        image: factoryImage,
      }));
      setDepartments(mapped);
      setTotalPages(tp);
      setPage(0);
    } catch (error) {
      console.error(error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setNewName('');
    fetchDepartments(0);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({ name: newName, englishName: '' }),
      });
      if (!res.ok) throw new Error('Failed to add department');
      setAddDialogOpen(false);
      setNewName('');
      fetchDepartments(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment || !newName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/${selectedDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({ name: newName, englishName: '' }),
      });
      if (!res.ok) throw new Error('Failed to update department');
      setEditDialogOpen(false);
      fetchDepartments(page);
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
      if (!res.ok) throw new Error('Failed to delete department');
      setDeleteDialogOpen(false);
      fetchDepartments(page);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (dep) => {
    setSelectedDepartment(dep);
    setNewName(dep.name);
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
    <div style={{ padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          textAlign: 'left',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '12px',
          color: '#1976d2',
          lineHeight: 1.5,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Department Management
      </Typography>

      {/* Search + Add Button Row */}
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid item>
          <DepartmentSearch
            searchValue={newName}
            onSearchChange={setNewName}
            onSearch={handleSearch}
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
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
              height: '40px',
            }}
          >
            Add Department
          </Button>
        </Grid>
      </Grid>

      {/* Department List */}
      <Grid container spacing={3} justifyContent="flex-start">
        {loading ? (
          <Typography
            variant="h6"
            align="center"
            sx={{ width: '100%', color: '#9ca3af', fontStyle: 'italic', mt: 4 }}
          >
            Loading departments...
          </Typography>
        ) : departments.length === 0 ? (
          <Typography
            variant="h6"
            align="center"
            sx={{ width: '100%', color: '#9ca3af', fontStyle: 'italic', mt: 4 }}
          >
            No departments found.
          </Typography>
        ) : (
          departments.map((dep) => (
            <Grid item xs={12} sm={6} md={1.5} key={dep.id}>
              <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                <Stack spacing={2} alignItems="center">
                  <img
                    src={dep.image}
                    alt={dep.name}
                    style={{
                      width: '72px',
                      height: '72px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '2px solid #e0f2fe',
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
                    }}
                  >
                    {dep.name}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <IconButton
                      onClick={() => handleEdit(dep)}
                      sx={{
                        background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
                        color: '#fff',
                        borderRadius: '50%',
                        p: 1,
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(dep)}
                      sx={{
                        background: 'linear-gradient(135deg, #ef9a9a  0%, #e57373 100%)',
                        color: '#fff',
                        borderRadius: '50%',
                        p: 1,
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination Controls */}
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 0}
          sx={{
            bgcolor: '#f0f0f0',
            color: '#9e9e9e',
            borderRadius: '8px',
            textTransform: 'none',
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
        <Typography variant="body1" sx={{ alignSelf: 'center' }}>
          Page {page + 1} / {totalPages}
        </Typography>
        <Button
          onClick={() => handlePageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          sx={{
            bgcolor: '#f0f0f0',
            color: '#9e9e9e',
            borderRadius: '8px',
            textTransform: 'none',
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
      <EditDepartmentDialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        onUpdate={handleUpdate}
        newName={newName}
        setNewName={setNewName}
      />

      <AddDepartmentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAdd}
        newName={newName}
        setNewName={setNewName}
      />

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151' }}>
            Are you sure you want to delete this department?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

