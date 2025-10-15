import React, { useState, useEffect, useRef } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Snackbar, Alert, Box } from '@mui/material';
import { Edit2, Profile, Lock } from 'iconsax-react';
import { useUser } from './useUser';
import EditUserDialog from '../../../../../pages/dashboard/EditUserDialog';
import ChangePasswordDialog from '../../../../../pages/dashboard/ChangePasswordDialog';
import ViewUserDialog from '../../../../../pages/dashboard/ViewUserDialog'; // Fixed import
import { API_BASE_URL } from '../../../../../config.js'; // Kept as provided

export default function ProfileTab() {
  const {
    username,
    email,
    address,
    phone,
    role,
    profileImage,
    userId,
    createdAt,
    isEditing,
    error,
    success,
    setIsEditing,
    fetchUser,
    handleUpdateUser,
    handleUpdatePassword,
  } = useUser();
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openChangePassDialog, setOpenChangePassDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const viewAnchorRef = useRef(null);

  useEffect(() => {
    if (error || success) {
      setSnackbarOpen(true);
    }
  }, [error, success]);

  const handleViewProfile = () => {
    setOpenViewDialog(true);
    setOpenChangePassDialog(false);
    setIsEditing(false);
    if (userId) {
      fetchUser(userId);
    }
  };

  const handleEdit = () => {
    setOpenViewDialog(false);
    setOpenChangePassDialog(false);
    setIsEditing(true);
  };

  const handleChangePass = () => {
    setOpenViewDialog(false);
    setOpenChangePassDialog(true);
    setIsEditing(false);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
  };

  const handleCloseChangePassDialog = () => {
    setOpenChangePassDialog(false);
  };

  const handleCloseEditDialog = () => {
    setIsEditing(false);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
        <ListItemButton onClick={handleViewProfile} ref={viewAnchorRef}>
          <ListItemIcon>
            <Profile variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="View Profile" />
        </ListItemButton>
        <ListItemButton onClick={handleEdit}>
          <ListItemIcon>
            <Edit2 variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="Edit Profile" />
        </ListItemButton>
        <ListItemButton onClick={handleChangePass}>
          <ListItemIcon>
            <Lock variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="Change Password" />
        </ListItemButton>
      </List>

      {/* View User Dialog */}
      <ViewUserDialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        user={{ username, email, address, phone, role, profileImageUrl: profileImage, createdAt }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={isEditing}
        onClose={handleCloseEditDialog}
        onUpdate={handleUpdateUser}
        user={{ id: userId, username, email, address, phone, role, profileImageUrl: profileImage }}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={openChangePassDialog}
        onClose={handleCloseChangePassDialog}
        onUpdate={handleUpdatePassword}
        user={{ email }}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}