import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  IconButton,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Paper,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import factoryImage from '../../assets/svg/logos/factory_1.png';
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/api/departments`;

function DepartmentSearch({ onSearch, onReset }) {
  const [searchName, setSearchName] = useState('');
  const theme = useTheme();

  const handleSearchClick = () => {
    onSearch?.(searchName.trim());
  };

  const handleReset = () => {
    setSearchName('');
    onReset?.();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 3,
        background: 'linear-gradient(to right, #f7faff, #ffffff)',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`,
        overflowX: 'auto',
      }}
    >
      {/* Table bao quanh input và nút */}
      <Table sx={{ minWidth: 300 }}>
        <TableBody>
          <TableRow>
            <TableCell sx={{ width: '70%', borderBottom: 'none', paddingRight: 1 }}>
              <TextField
                fullWidth
                label="Department Name"
                variant="outlined"
                size="small"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </TableCell>
            <TableCell sx={{ width: '30%', borderBottom: 'none', paddingLeft: 1 }}>
              <Grid container spacing={1} justifyContent="flex-start" alignItems="center">
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={handleSearchClick}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      background: 'linear-gradient(to right, #4cb8ff, #027aff)',
                      color: '#fff',
                      px: 3,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                    }}
                  >
                    Search
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: theme.palette.grey[800],
                      borderColor: theme.palette.grey[400],
                    }}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, { headers: { accept: '*/*' } });
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      const mapped = data.map(dep => ({
        id: dep.id,
        name: dep.name,
        icon: 'Calendar',
        image: factoryImage,
      }));
      setDepartments(mapped);
    } catch (error) {
      console.error(error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const searchDepartmentsByName = async (name) => {
    if (!name) {
      fetchDepartments();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/search?name=${encodeURIComponent(name)}`, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to search departments');
      const data = await res.json();
      const mapped = data.map(dep => ({
        id: dep.id,
        name: dep.name,
        icon: 'Calendar',
        image: factoryImage,
      }));
      setDepartments(mapped);
    } catch (error) {
      console.error(error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    searchDepartmentsByName(term);
  };

  const handleAdd = async () => {
    if (newName.trim() === '') return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: '*/*' },
        body: JSON.stringify({ name: newName, englishName: '' }),
      });
      if (!res.ok) throw new Error('Failed to add department');
      await fetchDepartments();
      setAddDialogOpen(false);
      setNewName('');
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
      await fetchDepartments();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment || newName.trim() === '') return;
    try {
      const res = await fetch(`${API_URL}/${selectedDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', accept: '*/*' },
        body: JSON.stringify({ name: newName, englishName: '' }),
      });
      if (!res.ok) throw new Error('Failed to update department');
      await fetchDepartments();
      setEditDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setNewName(department.name);
    setEditDialogOpen(true);
  };

  const handleDelete = (department) => {
    setSelectedDepartment(department);
    setDeleteDialogOpen(true);
  };

  const handleCancelEdit = () => setEditDialogOpen(false);
  const handleCancelDelete = () => setDeleteDialogOpen(false);

  return (
    <div style={{ padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        gutterBottom
        style={{
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

      {/* Nút Add Department trên cùng, nằm bên phải */}
      <Grid container justifyContent="flex-end" sx={{ mb: 1 }}>
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
          }}
        >
          Add Department
        </Button>
      </Grid>

      {/* Tìm kiếm rộng bằng bảng */}
      <DepartmentSearch onSearch={handleSearch} onReset={fetchDepartments} />

      {/* Department Cards */}
      <Grid container spacing={3} justifyContent="center">
        {loading ? (
          <Typography
            variant="h6"
            align="center"
            style={{ width: '100%', color: '#9ca3af', fontStyle: 'italic', marginTop: '20px' }}
          >
            Loading departments...
          </Typography>
        ) : departments.length === 0 ? (
          <Typography
            variant="h6"
            align="center"
            style={{ width: '100%', color: '#9ca3af', fontStyle: 'italic', marginTop: '20px' }}
          >
            No departments found.
          </Typography>
        ) : (
          departments.map((department) => (
            <Grid item xs={12} sm={6} md={4} key={department.id}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  height: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                }}
              >
                <img
                  src={department.image}
                  alt={department.name}
                  style={{
                    width: '72px',
                    height: '72px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    margin: '0 auto 16px',
                    border: '2px solid #e0f2fe',
                    backgroundColor: '#f0f9ff',
                  }}
                />
                <Typography variant="h6" style={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#374151' }}>
                  {department.name}
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center" marginTop="auto">
                  <IconButton
                    onClick={() => handleEdit(department)}
                    sx={{
                      background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
                      color: '#fff',
                      borderRadius: '50%',
                      padding: '10px',
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(department)}
                    sx={{
                      background: 'linear-gradient(135deg, #ef9a9a 0%, #e57373 100%)',
                      color: '#fff',
                      borderRadius: '50%',
                      padding: '10px',
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </div>
            </Grid>
          ))
        )}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit}>
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
            Update the department name:
          </Typography>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Department name"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
            Enter the new department name:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New department name"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddDialogOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '8px',
              px: 3,
              fontSize: '0.875rem',
              color: (theme) => theme.palette.grey[800],
              borderColor: (theme) => theme.palette.grey[400],
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
