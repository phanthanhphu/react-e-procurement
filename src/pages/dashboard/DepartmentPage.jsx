import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, IconButton, Stack, Dialog, DialogActions,
  DialogContent, DialogTitle, Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import factoryImage from '../../assets/svg/logos/factory_1.png';

const API_URL = 'http://10.232.100.50:8080/api/departments';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchDepartmentsByName(searchTerm);
    }, 500); // Debounce 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          color: '#1e3a8a',
        }}
      >
        Department Management
      </Typography>

      {/* Search and Add button in the same row */}
      <Grid container spacing={3} justifyContent="center" alignItems="center">
        {/* Search Box */}
        <Grid item xs={12} sm={6} md={8}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search department by name..."
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '16px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
          </div>
        </Grid>

        {/* Button Add */}
        <Grid item xs={12} sm={6} md={4}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #a5d6a7 0%, #66bb6a 100%)',
                color: '#fff',
                padding: '10px 24px',
                fontSize: '16px',
                borderRadius: '12px',
                fontWeight: 500,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Add Department
            </Button>
          </div>
        </Grid>
      </Grid>

      <Grid container spacing={3} justifyContent="center">
        {loading ? (
          <Typography
            variant="h6"
            align="center"
            style={{
              width: '100%',
              color: '#9ca3af',
              fontStyle: 'italic',
              marginTop: '20px',
            }}
          >
            Loading departments...
          </Typography>
        ) : departments.length === 0 ? (
          <Typography
            variant="h6"
            align="center"
            style={{
              width: '100%',
              color: '#9ca3af',
              fontStyle: 'italic',
              marginTop: '20px',
            }}
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
                <Typography
                  variant="h6"
                  style={{
                    fontWeight: 600,
                    fontFamily: 'Poppins, sans-serif',
                    color: '#374151',
                  }}
                >
                  {department.name}
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="center" marginTop="auto">
                  <IconButton
                    onClick={() => handleEdit(department)}
                    style={{
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
                    style={{
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

      {/* Dialog: Edit */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit}>
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2" style={{ marginBottom: '10px', color: '#374151' }}>
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
          <Button onClick={handleCancelEdit} color="primary">Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Delete */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          <Typography variant="body1" style={{ color: '#374151' }}>
            Are you sure you want to delete this department?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Add */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2" style={{ marginBottom: '10px', color: '#374151' }}>
            Enter the new department name:
          </Typography>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New department name"
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
          <Button onClick={() => setAddDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleAdd} variant="contained" color="success">Add</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
