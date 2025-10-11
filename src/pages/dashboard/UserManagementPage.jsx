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
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import AddUserDialog from './AddUserDialog';
import EditUserDialog from './EditUserDialog';
import { API_BASE_URL } from '../../config';

const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Username', key: 'username', sortable: true },
  { label: 'Email', key: 'email', sortable: true },
  { label: 'Address', key: 'address', sortable: true },
  { label: 'Phone', key: 'phone', sortable: true },
  { label: 'Role', key: 'role', sortable: true },
  { label: 'Profile Image', key: 'profileImage', sortable: false },
  { label: 'Actions', key: 'actions', sortable: false },
];

const UserManagementPage = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const DEFAULT_IMAGE_URL = '/default-user.png';

  const normalizeImageUrl = (url) => {
    if (!url) return null;
    let normalized = url.replace(/\\/g, '/').replace(/^[Uu]ploads/, 'uploads/users');
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    return normalized;
  };

  const fetchUsers = async (pageNumber = 0, sortKey = null, sortDirection = null, fetchAll = false) => {
    setLoading(true);
    setImageLoading({});
    setImageErrors({});
    try {
      let allUsers = [];
      let currentPage = pageNumber;
      let totalPages = 1;

      do {
        const url = new URL(`${API_BASE_URL}/users?page=${currentPage}&size=${rowsPerPage}`);
        if (sortKey && sortDirection) {
          url.searchParams.append('sort', `${sortKey},${sortDirection}`);
        }
        console.log(`Fetching users: ${url.toString()}`);
        const res = await fetch(url, {
          headers: { accept: '*/*' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
        const data = await res.json();
        console.log(`API Response (page ${currentPage}):`, JSON.stringify(data, null, 2));

        const userList = data.users || [];
        totalPages = data.totalPages || 1;
        const totalItems = data.totalItems || 0;

        const mapped = userList.map((user) => {
          const imageUrl = normalizeImageUrl(user.profileImageUrl);
          console.log(`Image URL for ${user.username}: ${API_BASE_URL}${imageUrl}`);
          return {
            id: user.id,
            username: user.username || '',
            email: user.email || '',
            address: user.address || '',
            phone: user.phone || '',
            role: user.role || '',
            profileImageUrl: imageUrl,
          };
        });

        allUsers = fetchAll ? [...allUsers, ...mapped] : mapped;
        setTotalRows(totalItems);
        setTotalPages(totalPages);
        currentPage++;
      } while (fetchAll && currentPage < totalPages);

      setUsers(allUsers);
      setImageLoading(
        allUsers.reduce((acc, user) => {
          if (user.profileImageUrl) {
            acc[user.id] = true;
          }
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Fetch users error:', error);
      setSnackbarMessage('Failed to fetch users: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setUsers([]);
      setTotalRows(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0, null, null, true); // Initial fetch of all users to check for 'dungds'
  }, []);

  useEffect(() => {
    fetchUsers(page, sortConfig.key, sortConfig.direction, false); // Fetch current page on pagination/sort change
  }, [page, rowsPerPage, sortConfig]);

  const handleAdd = async (data) => {
    if (!data || !data.data) {
      setSnackbarMessage('Invalid user data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      setAddDialogOpen(false);
      fetchUsers(page, sortConfig.key, sortConfig.direction, false);
      setSnackbarMessage(data.message || 'User added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Add user error:', error);
      setSnackbarMessage('Failed to add user: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleUpdate = async (data) => {
    if (!data || !data.data) {
      setSnackbarMessage('Invalid user data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      setEditDialogOpen(false);
      fetchUsers(page, sortConfig.key, sortConfig.direction, false);
      setSnackbarMessage(data.message || 'User updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Update user error:', error);
      setSnackbarMessage('Failed to update user: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to delete user: ${res.status} ${res.statusText}`);
      setSnackbarMessage('User deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      fetchUsers(page, sortConfig.key, sortConfig.direction, false);
    } catch (error) {
      console.error('Delete user error:', error);
      setSnackbarMessage('Failed to delete user: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const handleImageLoad = (userId) => {
    console.log(`Image loaded successfully for user ID: ${userId}`);
    setImageLoading((prev) => ({ ...prev, [userId]: false }));
    setImageErrors((prev) => ({ ...prev, [userId]: false }));
  };

  const handleImageError = (userId, username, imageUrl) => {
    console.error(`Failed to load image for ${username}: ${imageUrl}`);
    setImageLoading((prev) => ({ ...prev, [userId]: false }));
    setImageErrors((prev) => ({ ...prev, [userId]: true }));
    setSnackbarMessage(`Failed to load image for ${username}. Click to retry.`);
    setSnackbarSeverity('warning');
    setSnackbarOpen(true);
  };

  const handleRetryImage = (userId) => {
    setImageLoading((prev) => ({ ...prev, [userId]: true }));
    setImageErrors((prev) => ({ ...prev, [userId]: false }));
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="xl">
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
                width: '100%',
              }}
            >
              <Table stickyHeader size="medium" sx={{ minWidth: 1400, width: '100%' }}>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                    {headers.map(({ label, key, sortable }) => (
                      <TableCell
                        key={key}
                        align={['No', 'Profile Image', 'Actions'].includes(label) ? 'center' : 'left'}
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          color: '#ffffff',
                          py: 1.5,
                          px: 2,
                          whiteSpace: 'nowrap',
                          borderRight: '1px solid rgba(255,255,255,0.15)',
                          '&:last-child': { borderRight: 'none' },
                          position: 'sticky',
                          top: 0,
                          zIndex: 20,
                          backgroundColor: '#027aff',
                          cursor: sortable ? 'pointer' : 'default',
                          '&:hover': sortable ? { backgroundColor: '#016ae3' } : {},
                        }}
                        onClick={() => sortable && handleSort(key)}
                      >
                        <Tooltip title={label} arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: label === 'Actions' ? 'center' : 'flex-start' }}>
                            <span>{label}</span>
                            {sortable && (
                              <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                                {sortConfig.key === key && sortConfig.direction === 'asc' ? (
                                  <ArrowUpward sx={{ fontSize: '1rem', color: '#fff' }} />
                                ) : sortConfig.key === key && sortConfig.direction === 'desc' ? (
                                  <ArrowDownward sx={{ fontSize: '1rem', color: '#fff' }} />
                                ) : (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <ArrowUpward sx={{ fontSize: '0.8rem', color: '#ccc' }} />
                                    <ArrowDownward sx={{ fontSize: '0.8rem', color: '#ccc' }} />
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((user, idx) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                        '&:hover': {
                          backgroundColor: '#e1f0ff',
                          transition: 'background-color 0.3s ease',
                        },
                        fontSize: '0.85rem',
                        cursor: 'default',
                        userSelect: 'none',
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{
                          px: 2,
                          py: 1.5,
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                        }}
                      >
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.5, fontWeight: 600 }}>
                        {user.username || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.5 }}>
                        {user.email || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.5 }}>
                        {user.address || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.5 }}>
                        {user.phone || ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.5 }}>
                        {user.role || ''}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {imageLoading[user.id] ? (
                            <CircularProgress size={24} />
                          ) : user.profileImageUrl && !imageErrors[user.id] ? (
                            <img
                              src={`${API_BASE_URL}${user.profileImageUrl}`}
                              alt={user.username}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onLoad={() => handleImageLoad(user.id)}
                              onError={() => handleImageError(user.id, user.username, `${API_BASE_URL}${user.profileImageUrl}`)}
                            />
                          ) : (
                            <img
                              src={`${API_BASE_URL}${DEFAULT_IMAGE_URL}`}
                              alt="Default User"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onLoad={() => handleImageLoad(user.id)}
                              onError={() => handleImageError(user.id, user.username, `${API_BASE_URL}${DEFAULT_IMAGE_URL}`)}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
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
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalRows}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                mt: 1,
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: '0.85rem',
                  color: theme.palette.text.secondary,
                },
                '.MuiTablePagination-select': { fontSize: '0.85rem' },
                '.MuiTablePagination-actions > button': {
                  color: theme.palette.primary.main,
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
          <DialogTitle sx={{ fontSize: '1rem' }}>Delete User</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
              Are you sure you want to delete &quot;{selectedUser?.username || 'Unknown'}&quot;?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontSize: '0.85rem' }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              sx={{ fontSize: '0.85rem' }}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
            action={
              snackbarSeverity === 'warning' && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    const failedUser = users.find((user) => imageErrors[user.id]);
                    if (failedUser) {
                      handleRetryImage(failedUser.id);
                    }
                  }}
                >
                  Retry
                </Button>
              )
            }
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default UserManagementPage;