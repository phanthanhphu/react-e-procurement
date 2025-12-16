// src/pages/users/UserManagementPage.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Tooltip,
  Container,
  useTheme,
  Snackbar,
  Alert,
  Divider,
  Pagination,
  Select,
  MenuItem,
  Popover,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import LockResetIcon from '@mui/icons-material/LockReset';
import InboxIcon from '@mui/icons-material/Inbox';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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
  { label: 'Status', key: 'isEnabled', sortable: true },
  { label: 'Profile Image', key: 'profileImage', sortable: false },
  { label: 'Actions', key: 'actions', sortable: false },
];

/* =========================
   PaginationBar
   ========================= */
function PaginationBar({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange, loading }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / (rowsPerPage || 1)));
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count || 0, (page + 1) * rowsPerPage);

  const btnSx = { textTransform: 'none', fontWeight: 400 };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1,
        px: 1.25,
        py: 0.9,
        borderRadius: 1.5,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          Showing <span style={{ color: '#111827' }}>{from}-{to}</span> of{' '}
          <span style={{ color: '#111827' }}>{count || 0}</span>
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Button
            variant="text"
            startIcon={<ChevronLeftIcon fontSize="small" />}
            disabled={loading || page <= 0}
            onClick={() => onPageChange(page - 1)}
            sx={btnSx}
          >
            Prev
          </Button>

          <Pagination
            size="small"
            page={page + 1}
            count={totalPages}
            onChange={(_, p1) => onPageChange(p1 - 1)}
            disabled={loading}
            siblingCount={1}
            boundaryCount={1}
            sx={{ '& .MuiPaginationItem-root': { fontSize: '0.8rem', minWidth: 32, height: 32 } }}
          />

          <Button
            variant="text"
            endIcon={<ChevronRightIcon fontSize="small" />}
            disabled={loading || page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            sx={btnSx}
          >
            Next
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Page size</Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            disabled={loading}
            sx={{ height: 32, minWidth: 110, borderRadius: 1.2, '& .MuiSelect-select': { fontSize: '0.8rem' } }}
          >
            {[5, 10, 25, 50].map((n) => (
              <MenuItem key={n} value={n} sx={{ fontSize: '0.8rem' }}>
                {n} / page
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function UserManagementPage() {
  const theme = useTheme();
  const btnSx = useMemo(() => ({ textTransform: 'none', fontWeight: 400 }), []);

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

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // popover preview ảnh
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrc, setPopoverImgSrc] = useState('');
  const isPopoverOpen = Boolean(anchorEl);

  const API_BASE_URL_FULL = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const DEFAULT_IMAGE_URL = useMemo(
    () => `${API_BASE_URL}/uploads/users/default-user.png?v=${cacheBust}`,
    [cacheBust]
  );

  const normalizeImageUrl = useCallback(
    (url) => {
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
    },
    [cacheBust, API_BASE_URL_FULL]
  );

  const processedUsers = useMemo(() => {
    return users.map((user) => {
      const imageUrl = normalizeImageUrl(user.profileImageUrl);
      const finalImageUrl = imageUrl || DEFAULT_IMAGE_URL;
      return {
        ...user,
        profileImageUrl: imageUrl,
        displayImageUrl: finalImageUrl,
        isEnabled: user.enabled,
      };
    });
  }, [users, normalizeImageUrl, DEFAULT_IMAGE_URL]);

  const fetchUsers = useCallback(
    async (pageNumber = 0, sortKey = null, sortDirection = null) => {
      setLoading(true);
      try {
        const url = new URL(`${API_BASE_URL}/users`);
        url.searchParams.append('page', String(pageNumber));
        url.searchParams.append('size', String(rowsPerPage));

        if (searchUsername) url.searchParams.append('username', searchUsername);
        if (searchAddress) url.searchParams.append('address', searchAddress);
        if (searchPhone) url.searchParams.append('phone', searchPhone);
        if (searchEmail) url.searchParams.append('email', searchEmail);
        if (searchRole) url.searchParams.append('role', searchRole);

        if (sortKey && sortDirection) url.searchParams.append('sort', `${sortKey},${sortDirection}`);

        const res = await fetch(url, { headers: { accept: '*/*' }, credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);

        const data = await res.json();
        setUsers(data.users || []);
        setTotalRows(data.totalItems || 0);
      } catch (error) {
        console.error('Fetch users error:', error);
        setSnackbarMessage('Failed to fetch users: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setUsers([]);
        setTotalRows(0);
      } finally {
        setLoading(false);
      }
    },
    [rowsPerPage, searchUsername, searchAddress, searchPhone, searchEmail, searchRole]
  );

  useEffect(() => {
    fetchUsers(page, sortConfig.key, sortConfig.direction);
  }, [page, rowsPerPage, sortConfig, fetchUsers]);

  const handleImageError = (userId) => {
    if (imageErrors[userId]) return;
    setImageErrors((prev) => ({ ...prev, [userId]: true }));
  };

  const openPopover = (event, src) => {
    setAnchorEl(event.currentTarget);
    setPopoverImgSrc(src || '');
  };

  const closePopover = () => {
    setAnchorEl(null);
    setPopoverImgSrc('');
  };

  const handleSearch = useCallback(() => setPage(0), []);
  const handleReset = useCallback(() => {
    setSearchUsername('');
    setSearchAddress('');
    setSearchPhone('');
    setSearchEmail('');
    setSearchRole('');
    setSortConfig({ key: null, direction: null });
    setPage(0);
  }, []);

  const handleAdd = useCallback(
    async (data) => {
      setAddDialogOpen(false);
      await fetchUsers(page, sortConfig.key, sortConfig.direction);
      setSnackbarMessage(data?.message || 'User added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    [fetchUsers, page, sortConfig]
  );

  const handleUpdate = useCallback(
    async (data) => {
      setEditDialogOpen(false);
      await fetchUsers(page, sortConfig.key, sortConfig.direction);
      setSnackbarMessage(data?.message || 'User updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    [fetchUsers, page, sortConfig]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { accept: '*/*' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);

      setImageErrors((prev) => {
        const next = { ...prev };
        delete next[selectedUser.id];
        return next;
      });

      setSnackbarMessage('User deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setDeleteDialogOpen(false);
      setSelectedUser(null);

      await fetchUsers(page, sortConfig.key, sortConfig.direction);
    } catch (error) {
      setSnackbarMessage('Failed to delete user: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [selectedUser, fetchUsers, page, sortConfig]);

  const handleEdit = useCallback((user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  }, []);

  const handleResetPassword = useCallback((user) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  }, []);

  const handlePasswordUpdate = useCallback(
    (datadir) => {
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      fetchUsers(page, sortConfig.key, sortConfig.direction);
      setSnackbarMessage(datadir?.message || 'Password reset successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    [fetchUsers, page, sortConfig]
  );

  const hasActiveSearch = useMemo(
    () => [searchUsername, searchAddress, searchPhone, searchEmail, searchRole].some((v) => v?.trim?.()),
    [searchUsername, searchAddress, searchPhone, searchEmail, searchRole]
  );

  // sort tri-state: asc -> desc -> off
  const handleSort = useCallback(
    (key) => {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;

      setSortConfig({ key: direction ? key : null, direction });
      setPage(0);
    },
    [sortConfig]
  );

  const renderSortIndicator = (key) => {
    const active = sortConfig.key === key && !!sortConfig.direction;

    if (!active) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5, lineHeight: 0 }}>
          <ArrowUpward sx={{ fontSize: '0.7rem', color: '#9ca3af' }} />
          <ArrowDownward sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: '-4px' }} />
        </Box>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5, lineHeight: 0 }}>
          <ArrowUpward sx={{ fontSize: '0.85rem', color: '#6b7280' }} />
          <ArrowDownward sx={{ fontSize: '0.7rem', color: '#d1d5db', mt: '-4px' }} />
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5, lineHeight: 0 }}>
        <ArrowUpward sx={{ fontSize: '0.7rem', color: '#d1d5db' }} />
        <ArrowDownward sx={{ fontSize: '0.85rem', color: '#6b7280', mt: '-4px' }} />
      </Box>
    );
  };

  const cellEllipsisSx = {
    fontSize: '0.75rem',
    py: 0.4,
    px: 0.6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 0, // quan trọng để ellipsis hoạt động trong tableLayout=fixed
  };

  const roleBadge = (roleRaw) => {
    const role = (roleRaw || '').toString();
    const up = role.toUpperCase();

    let bg = '#dcfce7';
    let color = '#166534';

    if (up === 'ADMIN' || role === 'Admin') {
      bg = '#fee2e2';
      color = '#991b1b';
    } else if (up === 'LEADER' || role === 'Leader') {
      bg = '#ffedd5';
      color = '#9a3412';
    }

    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1,
          py: 0.3,
          borderRadius: 999,
          border: '1px solid #e5e7eb',
          backgroundColor: bg,
          color,
          fontSize: '0.72rem',
          fontWeight: 800,
          width: '100%',
          maxWidth: 120,
          mx: 'auto',
        }}
        title={role || 'User'}
      >
        {role || 'User'}
      </Box>
    );
  };

  const enabledBadge = (enabled) => {
    const bg = enabled ? '#dcfce7' : '#fee2e2';
    const color = enabled ? '#166534' : '#991b1b';
    const label = enabled ? 'Enabled' : 'Disabled';

    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1,
          py: 0.3,
          borderRadius: 999,
          border: '1px solid #e5e7eb',
          backgroundColor: bg,
          color,
          fontSize: '0.72rem',
          fontWeight: 800,
          width: '100%',
          maxWidth: 120,
          mx: 'auto',
        }}
      >
        {label}
      </Box>
    );
  };

  // ✅ BỎ ICON IMAGE — chỉ còn thumbnail, hover để preview
  const UserImageCell = ({ u }) => {
    const hasError = imageErrors[u.id];

    return (
      <Tooltip title={hasError ? 'Image error' : 'Hover to preview'}>
        <Box
          onMouseEnter={(e) => {
            if (!hasError) openPopover(e, u.displayImageUrl);
          }}
          onMouseLeave={closePopover}
          sx={{
            width: 30,
            height: 30,
            borderRadius: 999,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            color: '#9ca3af',
            mx: 'auto',
            cursor: hasError ? 'not-allowed' : 'zoom-in',
          }}
        >
          {hasError ? (
            '?'
          ) : (
            <img
              src={u.displayImageUrl}
              alt={u.username}
              width={30}
              height={30}
              style={{ objectFit: 'cover', display: 'block' }}
              loading="lazy"
              onError={() => handleImageError(u.id)}
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: 1.5, minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      <Container maxWidth={false} disableGutters sx={{ px: 1.5 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            mb: 1,
            borderRadius: 1.5,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack spacing={0.4}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                User Management
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                Total: {totalRows} • {hasActiveSearch ? 'Filter: active' : 'Filter: none'} • Sort:{' '}
                {sortConfig.key ? `${sortConfig.key} (${sortConfig.direction})` : 'none'}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => setAddDialogOpen(true)}
              disabled={loading}
              sx={btnSx}
            >
              Add User
            </Button>
          </Stack>
        </Paper>

        {/* Search */}
        <UserSearch
          searchUsername={searchUsername}
          setSearchUsername={setSearchUsername}
          searchAddress={searchAddress}
          setSearchAddress={setSearchAddress}
          searchPhone={searchPhone}
          setSearchPhone={setSearchPhone}
          searchEmail={searchEmail}
          setSearchEmail={setSearchEmail}
          searchRole={searchRole}
          setSearchRole={setSearchRole}
          setPage={setPage}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {loading && (
          <Typography align="center" sx={{ mt: 1.5, fontSize: '0.85rem', color: 'text.secondary' }}>
            Loading...
          </Typography>
        )}

        {!loading && (
          <>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 1.5,
                border: '1px solid #e5e7eb',
                maxHeight: 560,
                overflowX: 'hidden',
                backgroundColor: '#fff',
              }}
            >
              <Table stickyHeader size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>

                <TableHead>
                  <TableRow>
                    {headers.map(({ label, key, sortable }) => (
                      <TableCell
                        key={key}
                        align={['no', 'profileImage', 'actions', 'isEnabled', 'role'].includes(key) ? 'center' : 'left'}
                        onClick={() => sortable && handleSort(key)}
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#111827',
                          backgroundColor: '#f3f4f6',
                          borderBottom: '1px solid #e5e7eb',
                          py: 0.6,
                          px: 0.7,
                          whiteSpace: 'nowrap',
                          cursor: sortable ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.6}
                          alignItems="center"
                          justifyContent={
                            ['no', 'profileImage', 'actions', 'isEnabled', 'role'].includes(key)
                              ? 'center'
                              : 'flex-start'
                          }
                        >
                          <span>{label}</span>
                          {sortable ? renderSortIndicator(key) : null}
                        </Stack>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {processedUsers.length > 0 ? (
                    processedUsers.map((u, idx) => {
                      const zebra = idx % 2 === 0 ? '#ffffff' : '#fafafa';

                      return (
                        <TableRow
                          key={u.id}
                          sx={{
                            backgroundColor: zebra,
                            '&:hover': { backgroundColor: '#f1f5f9' },
                            '& > *': { borderBottom: '1px solid #f3f4f6' },
                          }}
                        >
                          <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.4, px: 0.6 }}>
                            {idx + 1 + page * rowsPerPage}
                          </TableCell>

                          <TableCell sx={cellEllipsisSx} title={u.username || ''}>
                            {u.username || ''}
                          </TableCell>

                          <TableCell sx={cellEllipsisSx} title={u.email || ''}>
                            {u.email || ''}
                          </TableCell>

                          <TableCell sx={cellEllipsisSx} title={u.address || ''}>
                            {u.address || ''}
                          </TableCell>

                          <TableCell sx={cellEllipsisSx} title={u.phone || ''}>
                            {u.phone || ''}
                          </TableCell>

                          <TableCell align="center" sx={{ py: 0.4, px: 0.6 }}>
                            {roleBadge(u.role)}
                          </TableCell>

                          <TableCell align="center" sx={{ py: 0.4, px: 0.6 }}>
                            {enabledBadge(Boolean(u.isEnabled))}
                          </TableCell>

                          <TableCell align="center" sx={{ py: 0.4, px: 0.6 }}>
                            <UserImageCell u={u} />
                          </TableCell>

                          <TableCell align="center" sx={{ py: 0.4, px: 0.6 }}>
                            <Stack direction="row" spacing={0.3} justifyContent="center">
                              <Tooltip title="Edit">
                                <span>
                                  <IconButton color="primary" size="small" onClick={() => handleEdit(u)} sx={{ p: 0.25 }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title="Delete">
                                <span>
                                  <IconButton color="error" size="small" onClick={() => handleDelete(u)} sx={{ p: 0.25 }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title="Reset password">
                                <span>
                                  <IconButton
                                    color="warning"
                                    size="small"
                                    onClick={() => handleResetPassword(u)}
                                    sx={{ p: 0.25 }}
                                  >
                                    <LockResetIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Stack direction="column" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                          <InboxIcon fontSize="small" />
                          <Typography sx={{ fontSize: '0.85rem' }}>
                            {hasActiveSearch ? 'No users found matching your search criteria.' : 'No users found.'}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <PaginationBar
              count={totalRows}
              page={page}
              rowsPerPage={rowsPerPage}
              loading={loading}
              onPageChange={(p) => setPage(p)}
              onRowsPerPageChange={(size) => {
                setRowsPerPage(size);
                setPage(0);
              }}
            />
          </>
        )}

        {/* dialogs */}
        <EditUserDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onUpdate={handleUpdate}
          user={selectedUser}
        />

        <AddUserDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={handleAdd} />

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontSize: '0.95rem' }}>Delete User</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: '0.85rem', color: '#111827' }}>
              Are you sure you want to delete “{selectedUser?.username || 'Unknown'}” ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={btnSx}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={loading} sx={btnSx}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <ResetPasswordDialog
          open={resetPasswordDialogOpen}
          onClose={() => setResetPasswordDialogOpen(false)}
          onUpdate={handlePasswordUpdate}
          user={selectedUser}
        />

        {/* popover ảnh (preview-only, không “bắt chuột”) */}
        <Popover
          id="user-image-popover"
          sx={{ pointerEvents: 'none' }}
          open={isPopoverOpen}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          onClose={closePopover}
          disableRestoreFocus
        >
          <Box sx={{ p: 1, maxWidth: 280, maxHeight: 300, overflowY: 'auto' }}>
            {popoverImgSrc ? (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={popoverImgSrc}
                  alt="Profile"
                  style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, objectFit: 'contain' }}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = '/images/fallback.jpg';
                    e.target.alt = 'Failed to load';
                  }}
                />
                <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>Preview</Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>No image</Typography>
            )}
          </Box>
        </Popover>

        {/* snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4500}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ fontSize: '0.85rem' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
