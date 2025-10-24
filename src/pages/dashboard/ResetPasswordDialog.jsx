import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { API_BASE_URL } from '../../config';

export default function ResetPasswordDialog({ open, onClose, onUpdate, user }) {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Initialize form with user email only
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [user]);

  // Handle input changes
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Trigger confirmation
  const handleSubmit = () => {
    if (!formData.email) {
      setSnackbarMessage('Email is required.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (!formData.newPassword) {
      setSnackbarMessage('New password is required.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      setSnackbarMessage('New password and confirmation do not match.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  // Confirm and proceed with API call
  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      // Reset password API call
      const res = await fetch(`${API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmNewPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Password reset failed with status ${res.status}`);
      }

      const data = await res.json();
      setSnackbarMessage(data.message || 'Password reset successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setFormData({
        email: user.email || '',
        newPassword: '',
        confirmNewPassword: '',
      });
      onUpdate(data);
      onClose();
    } catch (err) {
      setSnackbarMessage(err.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // Cancel confirmation
  const handleCancelConfirm = () => {
    setConfirmOpen(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: (theme) => theme.palette.primary.main,
          color: (theme) => theme.palette.primary.contrastText,
          fontWeight: 'bold',
          fontSize: '1.25rem',
          textTransform: 'capitalize',
          letterSpacing: 1,
        }}
      >
        Reset Password
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            size="small"
            required
            type="email"
          />
          <TextField
            label="New Password"
            value={formData.newPassword}
            onChange={handleChange('newPassword')}
            fullWidth
            size="small"
            required
            type="password"
          />
          <TextField
            label="Confirm New Password"
            value={formData.confirmNewPassword}
            onChange={handleChange('confirmNewPassword')}
            fullWidth
            size="small"
            required
            type="password"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving} variant="outlined" color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          variant="contained"
          color="primary"
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Reset'}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog
        open={confirmOpen}
        onClose={handleCancelConfirm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Password Reset</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to reset the password?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCancelConfirm} disabled={saving} variant="outlined" color="secondary">
            No
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            disabled={saving}
            variant="contained"
            color="primary"
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}