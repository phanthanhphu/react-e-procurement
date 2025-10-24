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

const AddUserDialog = ({ open, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    role: 'User',
    isEnabled: true, // THÊM: bật/tắt user khi tạo mới
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [emailError, setEmailError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Clean up image preview when dialog closes or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, open]);

  // Handle input changes with email validation
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') {
      if (value && !emailRegex.test(value)) {
        setEmailError('Invalid email format');
      } else {
        setEmailError('');
      }
    }
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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = null;
  };

  // Remove profile image
  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setProfileImage(null);
    setImagePreview(null);
  };

  // Trigger confirmation
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
    if (!formData.password) {
      setSnackbarMessage('Password is required.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      setSnackbarMessage('Invalid email format.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  // Confirm and proceed with API call
  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formDataToSend.append(key, value);
      }
    });
    if (profileImage) {
      formDataToSend.append('profileImage', profileImage);
    }

    // Debug: Log FormData entries
    console.log('FormData entries:');
    for (let pair of formDataToSend.entries()) {
      console.log(`${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/add`, {
        method: 'POST',
        headers: {
          accept: '*/*',
        },
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = `Add user failed with status ${res.status}`;
        try {
          const errorData = JSON.parse(errorText);
          message = errorData.message || message;
        } catch (parseError) {
          message = errorText || message;
        }
        throw new Error(message);
      }

      const text = await res.text();
      let message = 'User added successfully';
      try {
        const data = JSON.parse(text);
        message = data.message || message;
        onAdd(data);
      } catch (parseError) {
        console.warn('Response is not JSON:', text);
        onAdd({ message });
      }

      setSnackbarMessage(message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setFormData({ username: '', email: '', password: '', address: '', phone: '', role: 'User dex', isEnabled: true });
      setEmailError('');
      handleRemoveImage(); // Clean up image and preview
      onClose();
    } catch (err) {
      console.error('Add user error:', err);
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
        Add New User
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
            error={formData.username === '' && snackbarOpen}
            helperText={formData.username === '' && snackbarOpen ? 'Username is required' : ''}
            disabled={saving}
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            size="small"
            required
            error={!!emailError || (formData.email === '' && snackbarOpen)}
            helperText={emailError || (formData.email === '' && snackbarOpen ? 'Email is required' : '')}
            disabled={saving}
          />
          <TextField
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            fullWidth
            size="small"
            required
            error={formData.password === '' && snackbarOpen}
            helperText={formData.password === '' && snackbarOpen ? 'Password is required' : ''}
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
          <Box>
            <InputLabel sx={{ mb: 1 }}>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={handleChange('role')}
              fullWidth
              size="small"
              displayEmpty
              renderValue={(selected) => selected || 'User'}
              disabled={saving}
            >
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Leader">Leader</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </Box>

          {/* THÊM: BẬT/TẮT USER KHI TẠO MỚI */}
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
            <InputLabel sx={{ mb: 1 }}>Profile Image</InputLabel>
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
              {profileImage && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  1 image selected
                </Typography>
              )}
            </Stack>
            {imagePreview && (
              <Box mt={2} sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                  onError={(e) => {
                    console.error(`Failed to load image: ${imagePreview}`);
                    setSnackbarMessage('Failed to load image preview.');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    e.target.style.display = 'none';
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
                  {profileImage.name}
                </Typography>
              </Box>
            )}
            {!imagePreview && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                No image selected
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
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Add'}
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
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Add</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to add user &quot;{formData.username || 'Unknown'}&quot;?
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

export default AddUserDialog;