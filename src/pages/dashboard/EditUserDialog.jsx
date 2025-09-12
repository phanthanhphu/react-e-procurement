import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from '@mui/material';

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

export default EditUserDialog;