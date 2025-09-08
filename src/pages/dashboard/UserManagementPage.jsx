import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  IconButton,
  Stack,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PersonIcon from '@mui/icons-material/Person';

const API_URL = 'http://localhost:8080/users';

const AddUserDialog = ({ open, onClose, onAdd }) => {
  const [user, setUser] = useState({
    username: '',
    password: '',
    email: '',
    address: '',
    phone: '',
    role: '',
  });

  const handleSubmit = () => {
    onAdd(user);
    setUser({ username: '', password: '', email: '', address: '', phone: '', role: '' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1976d2', color: '#fff', py: 2 }}>
        Add New User
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Username"
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Password"
            type="password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Address"
            value={user.address}
            onChange={(e) => setUser({ ...user, address: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Phone"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Role"
            value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value })}
            fullWidth
            variant="outlined"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EditUserDialog = ({ open, onClose, onUpdate, user }) => {
  const [updatedUser, setUpdatedUser] = useState(user || {});
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (user) setUpdatedUser(user);
  }, [user]);

  const handleSubmit = () => {
    onUpdate(updatedUser, profileImage);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1976d2', color: '#fff', py: 2 }}>
        Edit User
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Username"
            value={updatedUser.username || ''}
            onChange={(e) => setUpdatedUser({ ...updatedUser, username: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Password"
            type="password"
            value={updatedUser.password || ''}
            onChange={(e) => setUpdatedUser({ ...updatedUser, password: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Email"
            value={updatedUser.email || ''}
            onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Address"
            value={updatedUser.address || ''}
            onChange={(e) => setUpdatedUser({ ...updatedUser, address: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Phone"
            value={updatedUser.phone || ''}
            onChange={(e) => setUpdatedUser({ ...updatedUser, phone: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Role"
            value={updatedUser.role || ''}
            onChange={(e) => setUpdatedUser({ ...updatedUser, role: e.target.value })}
            fullWidth
            variant="outlined"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])}
            style={{ marginTop: '16px' }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const url = `${API_URL}?page=${pageNumber}&size=${size}`;
      const res = await fetch(url, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      const { users: userList, totalPages: tp } = data;

      const mapped = userList.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        address: user.address,
        phone: user.phone,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
      }));
      setUsers(mapped);
      setTotalPages(tp);
    } catch (error) {
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleAdd = async (newUser) => {
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) return;
    try {
      const res = await fetch(`${API_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          ...newUser,
          id: `temp_${Date.now()}`,
          profileImageUrl: '',
        }),
      });
      if (!res.ok) throw new Error('Failed to add user');
      setAddDialogOpen(false);
      fetchUsers(page);
    } catch (error) {
      console.error('Add user error:', error);
    }
  };

  const handleUpdate = async (updatedUser, profileImage) => {
    if (!updatedUser) return;
    try {
      const formData = new FormData();
      formData.append('user', JSON.stringify(updatedUser));
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const res = await fetch(`${API_URL}/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          accept: '*/*',
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to update user');
      setEditDialogOpen(false);
      fetchUsers(page);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setDeleteDialogOpen(false);
      fetchUsers(page);
    } catch (error) {
      console.error('Delete user error:', error);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPage(newPage);
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            bgcolor: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            p: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 4,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'Roboto, sans-serif',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            User Management
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              bgcolor: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
              color: '#fff',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                bgcolor: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            Add User
          </Button>
        </Box>

        <Grid container spacing={3}>
          {loading ? (
            <Typography
              variant="h6"
              align="center"
              sx={{ width: '100%', color: '#6b7280', fontStyle: 'italic', mt: 4 }}
            >
              Loading users...
            </Typography>
          ) : users.length === 0 ? (
            <Typography
              variant="h6"
              align="center"
              sx={{ width: '100%', color: '#6b7280', fontStyle: 'italic', mt: 4 }}
            >
              No users found.
            </Typography>
          ) : (
            users.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid #e3f2fd',
                        bgcolor: '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <PersonIcon
                          sx={{ fontSize: 50, color: '#1976d2' }}
                          style={{ display: 'flex' }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontFamily: 'Roboto, sans-serif',
                        color: '#1e293b',
                      }}
                    >
                      {user.username}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Roboto, sans-serif',
                        color: '#64748b',
                        textAlign: 'center',
                      }}
                    >
                      {user.email}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Roboto, sans-serif',
                        color: '#64748b',
                        textAlign: 'center',
                        bgcolor: '#e0f2fe',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {user.role}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <IconButton
                        onClick={() => handleEdit(user)}
                        sx={{
                          bgcolor: '#42a5f5',
                          color: '#fff',
                          '&:hover': { bgcolor: '#1e88e5' },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(user)}
                        sx={{
                          bgcolor: '#ef5350',
                          color: '#fff',
                          '&:hover': { bgcolor: '#d32f2f' },
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

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            startIcon={<ArrowBackIosIcon />}
            sx={{
              bgcolor: '#e0e0e0',
              color: '#424242',
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: '#bdbdbd' },
              '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' },
            }}
          >
            Previous
          </Button>
          <Typography
            variant="body1"
            sx={{
              alignSelf: 'center',
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              color: '#1e293b',
            }}
          >
            Page {page + 1} of {totalPages}
          </Typography>
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page + 1 >= totalPages}
            endIcon={<ArrowForwardIosIcon />}
            sx={{
              bgcolor: '#e0e0e0',
              color: '#424242',
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: '#bdbdbd' },
              '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' },
            }}
          >
            Next
          </Button>
        </Stack>

        <EditUserDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onUpdate={handleUpdate}
          user={selectedUser}
        />

        <AddUserDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAdd={handleAdd}
        />

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ bgcolor: '#ef5350', color: '#fff', py: 2 }}>
            Delete User
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" sx={{ color: '#1e293b' }}>
              Are you sure you want to delete this user?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserManagementPage;