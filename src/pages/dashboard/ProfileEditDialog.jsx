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
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL } from '../../config';

const ProfileEditDialog = ({ open, onClose, onUpdate, user }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    address: '',
    phone: '',
    role: '',
    isEnabled: true, // THÊM: bật/tắt user
  });
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [keptImageUrl, setKeptImageUrl] = useState('');
  const [removedImageUrl, setRemovedImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Initialize form with user data and preload profile image
  useEffect(() => {
    if (user && open) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        address: user.address || '',
        phone: user.phone || '',
        role: user.role || '',
        isEnabled: user.isEnabled !== undefined ? user.isEnabled : true, // THÊM: lấy từ user
      });
      setNewImage(null);
      setNewImagePreview(null);
      setRemovedImageUrl('');
      if (user.profileImageUrl) {
        const imageUrl = user.profileImageUrl.startsWith('http')
          ? `${user.profileImageUrl}?t=${new Date().getTime()}`
          : `${API_BASE_URL}${user.profileImageUrl.startsWith('/') ? '' : '/'}${user.profileImageUrl}?t=${new Date().getTime()}`;
        setKeptImageUrl(imageUrl);
        setNewImagePreview(imageUrl);
      } else {
        setKeptImageUrl('');
        setNewImagePreview(null);
      }
    }
  }, [user, open]);

  // Clean up preview URL when dialog closes or new image changes
  useEffect(() => {
    return () => {
      if (newImagePreview && newImage) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview, newImage, open]);

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
      setSnackbarMessage('Please select an image file (e.g., .jpg, .png).');
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
    if (newImagePreview && newImage) {
      URL.revokeObjectURL(newImagePreview);
    }

    // If there's an existing image, mark it for removal
    if (keptImageUrl) {
      const cleanUrl = keptImageUrl.split('?')[0].replace(`${API_BASE_URL}/`, '/').replace(API_BASE_URL, '');
      setRemovedImageUrl(cleanUrl);
      setKeptImageUrl('');
    }

    setNewImage(file);
    setNewImagePreview(URL.createObjectURL(file));
    e.target.value = null;
  };

  // Remove profile image
  const handleRemoveImage = () => {
    if (newImagePreview && newImage) {
      URL.revokeObjectURL(newImagePreview);
      setNewImage(null);
      setNewImagePreview(null);
    } else if (keptImageUrl) {
      const cleanUrl = keptImageUrl.split('?')[0].replace(`${API_BASE_URL}/`, '/').replace(API_BASE_URL, '');
      setRemovedImageUrl(cleanUrl);
      setKeptImageUrl('');
      setNewImagePreview(null);
    }
  };

  // Submit form (trigger confirmation)
  const handleSubmit = () => {
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
    setConfirmOpen(true);
  };

  // Confirm and proceed with API call
  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    setSaving(true);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formDataToSend.append(key, value);
      }
    });
    if (newImage) {
      formDataToSend.append('profileImage', newImage);
    }
    if (removedImageUrl) {
      formDataToSend.append('imageToDelete', removedImageUrl);
    }

    // Debug: Log FormData entries
    console.log('FormData entries:');
    for (let pair of formDataToSend.entries()) {
      console.log(`${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          accept: '*/*',
        },
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = `Update failed with status ${res.status}`;
        try {
          const errorData = JSON.parse(errorText);
          message = errorData.message || message;
        } catch (parseError) {
          message = errorText || message;
        }
        throw new Error(message);
      }

      const text = await res.text();
      let message = 'User updated successfully';
      let data;
      try {
        data = JSON.parse(text);
        message = data.message || message;
      } catch (parseError) {
        console.warn('Response is not JSON:', text);
      }

      setSnackbarMessage(message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setNewImage(null);
      setNewImagePreview(null);
      setKeptImageUrl(data.profileImageUrl
        ? `${data.profileImageUrl.startsWith('http') ? '' : API_BASE_URL}${data.profileImageUrl}?t=${new Date().getTime()}`
        : '');
      setRemovedImageUrl('');
      onUpdate(data || { message });
      onClose();
    } catch (err) {
      console.error('Update user error:', err);
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

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
            disabled={saving}
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            size="small"
            required
            disabled={saving}
          />
          <TextField
            label="Address"
            value={formData.address}
            onChange={handleChange('address')}
            fullWidth
            size="small"
            disabled={saving}
          />
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={handleChange('phone')}
            fullWidth
            size="small"
            disabled={saving}
          />
          {/* THÊM: BẬT/TẮT USER */}
          <FormControl component="fieldset" sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
                disabled={saving}
              />
              <Typography variant="body2">
                {formData.isEnabled ? 'Enabled' : 'Disabled'}
              </Typography>
            </Stack>
          </FormControl>

          <Box>
            <InputLabel sx={{ mb: 1 }}>Profile Image (Leave empty to keep current)</InputLabel>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={saving}
              >
                Select Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {(newImage || keptImageUrl) && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {newImage ? '1 image selected' : 'Current profile image'}
                </Typography>
              )}
            </Stack>
            {newImagePreview && (
              <Box mt={2} sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={newImagePreview}
                  alt="Profile Preview"
                  style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                  onError={(e) => {
                    console.error(`Failed to load image: ${newImagePreview}`);
                    setSnackbarMessage('Failed to load profile image.');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    e.target.src = '/images/fallback.jpg';
                    e.target.alt = 'Failed to load';
                  }}
                />
                <IconButton
                  sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                  onClick={handleRemoveImage}
                  disabled={saving}
                >
                  <CloseIcon color="error" />
                </IconButton>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                  {newImage ? newImage.name : 'Current Image'}
                </Typography>
              </Box>
            )}
            {!newImagePreview && (
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
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to update user &quot;{formData.username || 'Unknown'}&quot;?
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
};

export default ProfileEditDialog;