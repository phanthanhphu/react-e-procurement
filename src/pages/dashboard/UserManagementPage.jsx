import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Container,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import AddUserDialog from './AddUserDialog';
import EditUserDialog from './EditUserDialog';

const API_URL = 'http://localhost:8080/users';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Username', key: 'username' },
  { label: 'Email', key: 'email' },
  { label: 'Address', key: 'address' },
  { label: 'Phone', key: 'phone' },
  { label: 'Role', key: 'role' },
  { label: 'Profile Image', key: 'profileImage' },
  { label: 'Actions', key: 'actions' },
];

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const fetchUsers = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const url = `${API_URL}?page=${pageNumber}&size=${rowsPerPage}`;
      const res = await fetch(url, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      const { users: userList, totalElements } = data;

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
      setTotalRows(totalElements);
    } catch (error) {
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page, rowsPerPage]);

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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
          sx={{ userSelect: 'none' }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1976d2',
              letterSpacing: '0.05em',
            }}
          >
            User Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 0.75,
              fontWeight: 700,
              fontSize: '0.85rem',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(76, 184, 255, 0.3)',
              '&:hover': {
                background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
                boxShadow: '0 6px 16px rgba(76, 184, 255, 0.4)',
              },
            }}
          >
            Add User
          </Button>
        </Stack>

        {loading && (
          <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.9rem', mt: 4 }}>
            Loading users...
          </Typography>
        )}
        {!loading && users.length === 0 && (
          <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.9rem', mt: 4 }}>
            No users found.
          </Typography>
        )}
        {!loading && users.length > 0 && (
          <>
            <TableContainer
              component={Paper}
              elevation={4}
              sx={{
                borderRadius: 2,
                overflowX: 'auto',
                maxHeight: 640,
                boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
              }}
            >
              <Table stickyHeader size="medium" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                    {headers.map(({ label, key }) => (
                      <TableCell
                        key={key}
                        align={['No', 'Profile Image', 'Actions'].includes(label) ? 'center' : 'left'}
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          color: '#ffffff',
                          py: 1,
                          px: 1,
                          whiteSpace: 'nowrap',
                          borderRight: '1px solid rgba(255,255,255,0.15)',
                          '&:last-child': { borderRight: 'none' },
                          position: 'sticky',
                          top: 0,
                          zIndex: 20,
                          backgroundColor: '#027aff',
                        }}
                      >
                        <Tooltip title={label} arrow>
                          <span>{label}</span>
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user, idx) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                        '&:hover': {
                          backgroundColor: '#e1f0ff',
                          transition: 'background-color 0.3s ease',
                        },
                        fontSize: '0.8rem',
                        cursor: 'default',
                        userSelect: 'none',
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{
                          px: 2,
                          py: 1.2,
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                        }}
                      >
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2, fontWeight: 600 }}>
                        {user.username || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                        {user.email || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                        {user.address || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                        {user.phone || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                        {user.role || ''}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                        {user.profileImageUrl ? (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={user.profileImageUrl}
                              alt={user.username}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <PersonIcon
                              sx={{ fontSize: 30, color: '#1976d2' }}
                              style={{ display: 'none' }}
                            />
                          </Box>
                        ) : (
                          <PersonIcon sx={{ fontSize: 30, color: '#1976d2' }} />
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            aria-label="edit"
                            color="primary"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(25, 118, 210, 0.1)',
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.25)' },
                              borderRadius: 1,
                            }}
                            onClick={() => handleEdit(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            aria-label="delete"
                            color="error"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(211, 47, 47, 0.1)',
                              '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.25)' },
                              borderRadius: 1,
                            }}
                            onClick={() => handleDelete(user)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalRows}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              sx={{
                mt: 3,
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: '0.85rem',
                  color: '#424242',
                },
                '.MuiTablePagination-select': { fontSize: '0.85rem' },
                '.MuiTablePagination-actions > button': {
                  color: '#1976d2',
                },
              }}
            />
          </>
        )}

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