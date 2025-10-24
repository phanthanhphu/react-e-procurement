import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, Typography, IconButton, Stack, Button, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Tooltip, Container, useTheme,
  Snackbar, Alert, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import LockResetIcon from '@mui/icons-material/LockReset';
import AddUserDialog from './AddUserDialog';
import EditUserDialog from './EditUserDialog';
import ResetPasswordDialog from './ResetPasswordDialog';
import UserSearch from './UserSearch';
import { API_BASE_URL } from '../../config';

const headers = [
  { label: 'No', key: 'no', sortable: false },
  { label: 'Username', key: 'username', sortable: true },
  { label: 'Email', key: 'email', sortable: true },
  { label: 'Address', key: 'address', sortable: true },
  { label: 'Phone', key: 'phone', sortable: true },
  { label: 'Role', key: 'role', sortable: true },
  { label: 'Status', key: 'isEnabled', sortable: true }, // CỘT STATUS
  { label: 'Profile Image', key: 'profileImage', sortable: false },
  { label: 'Actions', key: 'actions', sortable: false },
];

const UserManagementPage = () => {
  const theme = useTheme();
  const cacheBust = useMemo(() => Date.now(), []);
  const imageCacheRef = useRef(new Map());

  const [searchUsername, setSearchUsername] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const API_BASE_URL_FULL = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const DEFAULT_IMAGE_URL = useMemo(() => `${API_BASE_URL}/uploads/users/default-user.png?v=${cacheBust}`, [cacheBust]);

  const normalizeImageUrl = useCallback((url) => {
    if (!url) return null;
    const cacheKey = `url_${url}`;
    if (imageCacheRef.current.has(cacheKey)) return imageCacheRef.current.get(cacheKey);
    let normalized = url.replace(/\\/g, '/');
    let finalUrl;
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      finalUrl = `${normalized}?v=${cacheBust}`;
    } else if (normalized.startsWith('/uploads/users/')) {
      finalUrl = `${API_BASE_URL}${normalized}?v=${cacheBust}`;
    } else {
      const cleanPath = normalized.replace(/^\/?[Uu]ploads\/users\//i, '');
      finalUrl = `${API_BASE_URL_FULL}/Uploads/users/${cleanPath}?v=${cacheBust}`;
    }
    imageCacheRef.current.set(cacheKey, finalUrl);
    return finalUrl;
  }, [cacheBust, API_BASE_URL_FULL]);

  // SỬA: ÁNH XẠ enabled → isEnabled
  const processedUsers = useMemo(() => {
    return users.map((user) => {
      const imageUrl = normalizeImageUrl(user.profileImageUrl);
      const finalImageUrl = imageUrl || DEFAULT_IMAGE_URL;
      return {
        ...user,
        profileImageUrl: imageUrl,
        displayImageUrl: finalImageUrl,
        isEnabled: user.enabled // THÊM DÒNG NÀY
      };
    });
  }, [users, normalizeImageUrl, DEFAULT_IMAGE_URL]);

  const fetchUsers = useCallback(async (pageNumber = 0, sortKey = null, sortDirection = null, fetchAll = false) => {
    setLoading(true);
    try {
      let allUsers = [];
      let currentPage = pageNumber;
      let totalPagesCount = 1;
      do {
        const url = new URL(`${API_BASE_URL}/users`);
        url.searchParams.append('page', currentPage.toString());
        url.searchParams.append('size', rowsPerPage.toString());
        if (searchUsername) url.searchParams.append('username', searchUsername);
        if (searchAddress) url.searchParams.append('address', searchAddress);
        if (searchPhone) url.searchParams.append('phone', searchPhone);
        if (searchEmail) url.searchParams.append('email', searchEmail);
        if (searchRole) url.searchParams.append('role', searchRole);
        if (sortKey && sortDirection) url.searchParams.append('sort', `${sortKey},${sortDirection}`);
        const res = await fetch(url, { headers: { accept: '*/*' }, credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
        const data = await res.json();
        const userList = data.users || [];
        totalPagesCount = data.totalPages || 1;
        const totalItems = data.totalItems || 0;
        allUsers = fetchAll ? [...allUsers, ...userList] : userList;
        setTotalRows(totalItems);
        setTotalPages(totalPagesCount);
        currentPage++;
      } while (fetchAll && currentPage < totalPagesCount);
      setUsers(allUsers);
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
  }, [rowsPerPage, searchUsername, searchAddress, searchPhone, searchEmail, searchRole, API_BASE_URL]);

  const handleImageError = (userId) => {
    if (imageErrors[userId]) return;
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const UserImage = ({ processedUser }) => {
    const { id, username, displayImageUrl } = processedUser;
    const hasError = imageErrors[id];

    const renderContent = () => {
      if (hasError) {
        return (
          <Box sx={{ 
            bgcolor: '#f5f5f5', width: 40, height: 40, 
            borderRadius: '50%', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontSize: '1rem', color: '#999' 
          }}>
            ?
          </Box>
        );
      }
      return (
        <img
          src={displayImageUrl}
          alt={username}
          width={40}
          height={40}
          style={{ 
            borderRadius: '50%', 
            objectFit: 'cover', 
            display: 'block'
          }}
          loading="lazy"
          onError={() => handleImageError(id)}
        />
      );
    };

    return (
      <Tooltip 
        title={
          <Box>
            <img 
              src={displayImageUrl} 
              alt={username} 
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} 
            />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
              {username}
            </Typography>
          </Box>
        }
        arrow
        sx={{ 
          '& .MuiTooltip-tooltip': { 
            bgcolor: 'white', 
            borderRadius: 2, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
          } 
        }}
      >
        <Box sx={{ 
          width: 40, height: 40, 
          borderRadius: '50%', 
          display: 'inline-flex', alignItems: 'center', 
          justifyContent: 'center', cursor: 'pointer',
          '&:hover': { 
            transform: 'scale(1.05)', 
            transition: '0.2s', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
          }
        }}>
          {renderContent()}
        </Box>
      </Tooltip>
    );
  };

  useEffect(() => { fetchUsers(0, null, null, false); }, []);
  useEffect(() => { fetchUsers(page, sortConfig.key, sortConfig.direction, false); }, [page, rowsPerPage, sortConfig, fetchUsers]);

  const handleSearch = useCallback(() => { setPage(0); }, []);
  const handleReset = useCallback(() => { setSearchUsername(''); setSearchAddress(''); setSearchPhone(''); setSearchEmail(''); setSearchRole(''); setPage(0); }, []);
  const handleAdd = useCallback(async (data) => {
    if (!data?.data) { setSnackbarMessage('Invalid user data.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
    try {
      setAddDialogOpen(false);
      await fetchUsers(page, sortConfig.key, sortConfig.direction, false);
      setSnackbarMessage(data.message || 'User added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to add user: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [fetchUsers, page, sortConfig]);

  const handleUpdate = useCallback(async (data) => {
    if (!data?.data) { setSnackbarMessage('Invalid user data.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
    try {
      setEditDialogOpen(false);
      await fetchUsers(page, sortConfig.key, sortConfig.direction, false);
      setSnackbarMessage(data.message || 'User updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to update user: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [fetchUsers, page, sortConfig]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, { method: 'DELETE', headers: { accept: '*/*' }, credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
      setImageErrors(prev => { const newErrors = { ...prev }; delete newErrors[selectedUser.id]; return newErrors; });
      setSnackbarMessage('User deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await fetchUsers(page, sortConfig.key, sortConfig.direction, false);
    } catch (error) {
      setSnackbarMessage('Failed to delete user: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [selectedUser, fetchUsers, page, sortConfig, API_BASE_URL]);

  const handleEdit = useCallback((user) => { setSelectedUser(user); setEditDialogOpen(true); }, []);
  const handleDelete = useCallback((user) => { setSelectedUser(user); setDeleteDialogOpen(true); }, []);
  const handleResetPassword = useCallback((user) => { setSelectedUser(user); setResetPasswordDialogOpen(true); }, []);
  const handleChangePage = useCallback((event, newPage) => { setPage(newPage); }, []);
  const handleChangeRowsPerPage = useCallback((event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }, []);
  const handleSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key: direction ? key : null, direction });
  }, [sortConfig]);

  const handlePasswordUpdate = useCallback((datadir) => {
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
    fetchUsers(page, sortConfig.key, sortConfig.direction, false);
    setSnackbarMessage(datadir.message || 'Password reset successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, [fetchUsers, page, sortConfig]);

  const hasActiveSearch = useMemo(() => 
    [searchUsername, searchAddress, searchPhone, searchEmail, searchRole].some(val => val?.trim()),
    [searchUsername, searchAddress, searchPhone, searchEmail, searchRole]
  );

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 1 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ fontSize: '1rem', fontWeight: 600, color: '#1976d2', mb: '8px', fontFamily: 'Inter, sans-serif' }}>
          User Management
        </Typography>

        <UserSearch
          searchUsername={searchUsername} setSearchUsername={setSearchUsername}
          searchAddress={searchAddress} setSearchAddress={setSearchAddress}
          searchPhone={searchPhone} setSearchPhone={setSearchPhone}
          searchEmail={searchEmail} setSearchEmail={setSearchEmail}
          searchRole={searchRole} setSearchRole={setSearchRole}
          setPage={setPage}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        <Stack direction="row" alignItems="center" justifyContent="flex-end" mb={1} sx={{ userSelect: 'none' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => setAddDialogOpen(true)}
            disabled={loading}
            sx={{
              textTransform: 'none', borderRadius: '8px', px: 1.5, py: 0.3, fontWeight: 700, fontSize: '0.85rem',
              background: loading ? theme.palette.action.disabledBackground : 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
            }}
          >
            Add User
          </Button>
        </Stack>

        {loading && (
          <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.9rem', mt: 1.5 }}>
            Loading users...
          </Typography>
        )}

        {!loading && (
          <>
            <TableContainer component={Paper} sx={{ height: 'calc(100vh - 320px)', overflowX: 'auto', boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 0 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                    {headers.map(({ label, key, sortable }) => (
                      <TableCell
                        key={key}
                        align={['No', 'Profile Image', 'Actions', 'Status'].includes(label) ? 'center' : 'left'}
                        sx={{
                          fontWeight: 'bold', fontSize: '0.75rem', color: '#ffffff', py: 0.3, px: 0.5, whiteSpace: 'nowrap',
                          borderRight: '1px solid rgba(255,255,255,0.15)', '&:last-child': { borderRight: 'none' },
                          position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#027aff',
                          ...(key === 'no' && { left: 0, zIndex: 2, width: '40px' }),
                          cursor: sortable ? 'pointer' : 'default',
                          '&:hover': sortable ? { backgroundColor: '#016ae3' } : {},
                          ...(label === 'Username' && { width: '12%' }),
                          ...(label === 'Email' && { width: '18%' }),
                          ...(label === 'Address' && { width: '18%' }),
                          ...(label === 'Phone' && { width: '10%' }),
                          ...(label === 'Role' && { width: '10%' }),
                          ...(label === 'Status' && { width: '80px' }),
                          ...(label === 'Profile Image' && { width: '60px' }),
                          ...(label === 'Actions' && { width: '100px' }),
                        }}
                        onClick={() => sortable && handleSort(key)}
                      >
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
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedUsers.length > 0 ? (
                    processedUsers.map((processedUser, idx) => (
                      <TableRow
                        key={processedUser.id}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff',
                          '&:hover': { backgroundColor: '#e3f2fd', transition: 'background-color 0.3s ease' },
                        }}
                      >
                        <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5, position: 'sticky', left: 0, backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff', zIndex: 1 }}>
                          {idx + 1 + page * rowsPerPage}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5 }}>{processedUser.username || ''}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5 }}>{processedUser.email || ''}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5 }}>{processedUser.address || ''}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5 }}>{processedUser.phone || ''}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.3, px: 0.5 }}>
                          <Box sx={{
                            bgcolor: processedUser.role === 'Admin' ? '#ffebee' : processedUser.role === 'Leader' ? '#fff3e0' : '#e8f5e8',
                            color: processedUser.role === 'Admin' ? '#c62828' : processedUser.role === 'Leader' ? '#ef6c00' : '#2e7d32',
                            px: 1, py: 0.5, borderRadius: 0.5, fontSize: '0.75rem', fontWeight: 600, textAlign: 'center',
                          }}>
                            {processedUser.role || 'User'}
                          </Box>
                        </TableCell>

                        {/* CỘT STATUS */}
                        <TableCell align="center" sx={{ py: 0.3, px: 0.5 }}>
                          <Chip
                            label={processedUser.isEnabled ? 'Enabled' : 'Disabled'}
                            size="small"
                            color={processedUser.isEnabled ? 'success' : 'error'}
                            sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600 }}
                          />
                        </TableCell>

                        <TableCell align="center" sx={{ py: 0.3, px: 0.5 }}>
                          <UserImage processedUser={processedUser} />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.3, px: 0.5 }}>
                          <Stack direction="row" spacing={0.2} justifyContent="center">
                            <IconButton aria-label="edit" color="primary" size="small" sx={{ backgroundColor: 'rgba(25, 118, 210, 0.1)', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.25)' }, borderRadius: 1, p: 0.2 }} onClick={() => handleEdit(processedUser)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="delete" color="error" size="small" sx={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.25)' }, borderRadius: 1, p: 0.2 }} onClick={() => handleDelete(processedUser)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="reset-password" color="warning" size="small" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.25)' }, borderRadius: 1, p: 0.2 }} onClick={() => handleResetPassword(processedUser)}>
                              <LockResetIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3, fontSize: '0.9rem', color: '#90a4ae' }}>
                        <Typography variant="body1">
                          {hasActiveSearch ? 'No users found matching your search criteria.' : 'No users found.'}
                        </Typography>
                        {!hasActiveSearch && (
                          <Button variant="contained" onClick={() => setAddDialogOpen(true)} sx={{ mt: 1, fontSize: '0.85rem', textTransform: 'none', background: 'linear-gradient(to right, #4cb8ff, #027aff)', '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' } }}>
                            Add First User
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalRows}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                mt: 1,
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.85rem', color: theme.palette.text.secondary },
                '.MuiTablePagination-select': { fontSize: '0.85rem' },
                '.MuiTablePagination-actions > button': { color: theme.palette.primary.main },
              }}
            />
          </>
        )}

        <EditUserDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} onUpdate={handleUpdate} user={selectedUser} />
        <AddUserDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={handleAdd} />
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontSize: '1rem' }}>Delete User</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
              Are you sure you want to delete "{selectedUser?.username || 'Unknown'}"?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontSize: '0.85rem', textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ fontSize: '0.85rem', textTransform: 'none' }} disabled={loading}>Delete</Button>
          </DialogActions>
        </Dialog>
        <ResetPasswordDialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)} onUpdate={handlePasswordUpdate} user={selectedUser} />

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ '& .MuiSnackbarContent-root': { width: { xs: '90%', sm: '400px' }, maxWidth: '500px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' } }}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%', fontSize: '0.9rem' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default UserManagementPage;