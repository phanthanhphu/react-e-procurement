import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from '@mui/material';

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

export default AddUserDialog;