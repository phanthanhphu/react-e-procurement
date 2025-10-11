import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  InputLabel,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL } from '../../config';

const EditUserDialog = ({ open, onClose, onUpdate, user }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    role: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Initialize form with user data and preload profile image
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Password is not pre-filled for security
        address: user.address || '',
        phone: user.phone || '',
        role: user.role || '',
      });
      setProfileImage(null);
      setImagePreview(null);

      if (user.profileImageUrl) {
        setImageLoading(true);
        const img = new Image();
        img.src = `${API_BASE_URL}${user.profileImageUrl}`;
        img.onload = () => {
          setImagePreview(img.src);
          setImageLoading(false);
        };
        img.onerror = () => {
          setSnackbarMessage('Failed to load profile image.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setImagePreview(null);
          setImageLoading(false);
        };
      }
    }
  }, [user]);

  // Clean up image preview when dialog closes
  useEffect(() => {
    return () => {
      if (imagePreview && profileImage) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      setProfileImage(null);
    };
  }, [imagePreview, open]);

  // Handle input changes
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSnackbarMessage('No file selected.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setSnackbarMessage('Only image files are accepted.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      e.target.value = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSnackbarMessage('Image file size must be under 5MB.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      e.target.value = null;
      return;
    }

    // Clean up previous preview
    if (imagePreview && profileImage) {
      URL.revokeObjectURL(imagePreview);
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = null;
  };

  // Remove profile image
  const handleRemoveImage = () => {
    if (imagePreview && profileImage) {
      URL.revokeObjectURL(imagePreview);
    }
    setProfileImage(null);
    setImagePreview(null);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.username) {
      setSnackbarMessage('Username is required.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (!formData.email) {
      setSnackbarMessage('Email is required.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formDataToSend.append(key, value);
      }
    });
    if (profileImage) {
      formDataToSend.append('profileImage', profileImage);
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          accept: '*/*',
        },
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Update failed with status ${res.status}`);
      }

      const data = await res.json();
      setSnackbarMessage(data.message || 'User updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setProfileImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
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
        Edit User
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Username"
            value={formData.username}
            onChange={handleChange('username')}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            fullWidth
            size="small"
            helperText="Leave blank to keep current password"
          />
          <TextField
            label="Address"
            value={formData.address}
            onChange={handleChange('address')}
            fullWidth
            size="small"
          />
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={handleChange('phone')}
            fullWidth
            size="small"
          />
          <TextField
            label="Role"
            value={formData.role}
            onChange={handleChange('role')}
            fullWidth
            size="small"
          />
          <Box>
            <InputLabel sx={{ mb: 1 }}>Profile Image</InputLabel>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                Select Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {imagePreview && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {profileImage ? '1 image selected' : 'Current profile image'}
                </Typography>
              )}
            </Stack>
            {imageLoading && (
              <Box mt={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {!imageLoading && imagePreview && (
              <Box mt={2} sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                  onError={(e) => {
                    console.error(`Failed to load image: ${imagePreview}`);
                    setSnackbarMessage('Failed to load profile image.');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    e.target.style.display = 'none';
                  }}
                />
                {profileImage && (
                  <IconButton
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10 }}
                    onClick={handleRemoveImage}
                  >
                    <CloseIcon color="error" />
                  </IconButton>
                )}
              </Box>
            )}
            {!imageLoading && !imagePreview && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                No image available
              </Typography>
            )}
          </Box>
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
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Update'}
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
    </Dialog>
  );
};

export default EditUserDialog;