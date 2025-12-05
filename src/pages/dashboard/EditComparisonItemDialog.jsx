// src/components/EditComparisonItemDialog.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Box,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const EditComparisonItemDialog = ({ open, onClose, item, onSaved }) => {
  const [formData, setFormData] = useState({
    statusBestPrice: '',
    remarkComparison: '',
  });

  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load data khi mở dialog
  useEffect(() => {
    if (item && open) {
      setFormData({
        statusBestPrice:
          item.isBestPrice === true || item.isBestPrice === 1
            ? 'Yes'
            : item.isBestPrice === false || item.isBestPrice === 0
            ? 'No'
            : '',
        remarkComparison: item.remarkComparison || '',
      });
    }
  }, [item, open]);

  // Hiển thị thông báo
  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit
  const handleSubmit = async () => {
    if (formData.statusBestPrice === '') {
      showMessage('Please select Best Price status (Yes/No).', 'warning');
      return;
    }

    setSaving(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/requisition-monthly/${item.id}/best-price`,
        {
          statusBestPrice:
            formData.statusBestPrice === 'Yes'
              ? 'Yes'
              : formData.statusBestPrice === 'No'
              ? 'No'
              : null,
          remarkComparison: formData.remarkComparison.trim(),
        }
      );

      showMessage('Updated successfully!', 'success');
      onSaved?.(); // Refresh table
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update. Please try again.';
      showMessage(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
          Edit Best Price & Remark
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Best Price Status */}
            <Box>
              <InputLabel sx={{ mb: 1, fontWeight: 500 }}>Best Price Status</InputLabel>
              <FormControl fullWidth size="small">
                <Select
                  name="statusBestPrice"
                  value={formData.statusBestPrice}
                  onChange={handleChange}
                  displayEmpty
                  disabled={saving}
                >
                  <MenuItem value="" disabled>
                    <em>Select status</em>
                  </MenuItem>
                  <MenuItem value="Yes">Yes - This is the best price</MenuItem>
                  <MenuItem value="No">No - Not the best price</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Remark */}
            <Box>
              <InputLabel sx={{ mb: 1, fontWeight: 500 }}>Remark</InputLabel>
              <TextField
                name="remarkComparison"
                value={formData.remarkComparison}
                onChange={handleChange}
                multiline
                rows={5}
                placeholder="Enter reason or note (optional)"
                fullWidth
                size="small"
                disabled={saving}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.9rem',
                  },
                }}
              />
            </Box>

            {/* Item Info (readonly) */}
            <Box sx={{ pt: 2, pb: 1, bgcolor: '#f5f8fa', borderRadius: 2, p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Item:</strong> {item?.vietnameseName || item?.englishName || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Old SAP Code:</strong> {item?.oldSapCode || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="contained"
            color="primary"
            size="medium"
          >
            {saving ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo chuẩn */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditComparisonItemDialog;