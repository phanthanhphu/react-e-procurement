import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Typography, Stack, Avatar, IconButton } from '@mui/material';
import { Trash } from 'iconsax-react';
import { API_BASE_URL } from '../../config.js'; // Adjusted for D:\Project\React\react\config.js

export default function ViewUserDialog({ open, onClose, user }) {
  const formatDate = (dateArray) => {
    if (!dateArray || dateArray.length < 7) return 'N/A';
    const [year, month, day, hour, minute, second] = dateArray;
    const date = new Date(year, month - 1, day, hour, minute, second);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="view-user-dialog-title"
      sx={{ '& .MuiDialog-paper': { maxWidth: 400, p: 2 } }}
    >
      <DialogTitle id="view-user-dialog-title">View Profile</DialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="center">
          <Avatar
            src={user.profileImageUrl ? `${API_BASE_URL}${user.profileImageUrl}` : `${API_BASE_URL}/Uploads/users/default-user.png`}
            sx={{ width: 100, height: 100 }}
            onError={(e) => {
              console.error(`Failed to load image: ${user.profileImageUrl || '/Uploads/users/default-user.png'}`);
              e.target.src = `${API_BASE_URL}/Uploads/users/default-user.png`;
            }}
          />
          <Typography><strong>Username:</strong> {user.username || 'N/A'}</Typography>
          <Typography><strong>Email:</strong> {user.email || 'N/A'}</Typography>
          <Typography><strong>Address:</strong> {user.address || 'N/A'}</Typography>
          <Typography><strong>Phone:</strong> {user.phone || 'N/A'}</Typography>
          <Typography><strong>Role:</strong> {user.role || 'N/A'}</Typography>
          <Typography><strong>Created At:</strong> {formatDate(user.createdAt)}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <IconButton color="error" onClick={onClose}>
          <Trash variant="Bulk" size={18} />
        </IconButton>
      </DialogActions>
    </Dialog>
  );
}