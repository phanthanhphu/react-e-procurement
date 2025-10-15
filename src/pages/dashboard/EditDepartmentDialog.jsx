import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';

export default function EditDepartmentDialog({ open, onClose, onUpdate, department }) {
  const [departmentName, setDepartmentName] = useState(department?.departmentName || '');
  const [division, setDivision] = useState(department?.division || '');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // New state for confirmation dialog
  const [snackbarOpen, setSnackbarOpen] = useState(false); // New state for success notification
  const [snackbarMessage, setSnackbarMessage] = useState(''); // New state for snackbar message

  useEffect(() => {
    if (department) {
      setDepartmentName(department.departmentName || '');
      setDivision(department.division || '');
    }
    setOpenConfirmDialog(false); // Ensure confirmation dialog is closed when dialog opens
    setSnackbarOpen(false); // Ensure snackbar is closed when dialog opens
    setSnackbarMessage(''); // Reset snackbar message
  }, [department, open]);

  const handleSaveClick = () => {
    // Perform validation from handleUpdate
    if (!departmentName.trim()) {
      setSnackbarMessage('Department Name is required.');
      setSnackbarOpen(true);
      return;
    }
    if (!division.trim()) {
      setSnackbarMessage('Division is required.');
      setSnackbarOpen(true);
      return;
    }

    setOpenConfirmDialog(true); // Show confirmation dialog
  };

  const handleConfirmSave = () => {
    setOpenConfirmDialog(false); // Close confirmation dialog
    handleUpdate(); // Execute the original update logic
  };

  const handleCancelSave = () => {
    setOpenConfirmDialog(false); // Close confirmation dialog without saving
  };

  const handleUpdate = () => {
    onUpdate({ id: department.id, departmentName, division, createdAt: department.createdAt });
    setSnackbarMessage('Department updated successfully!'); // Set success message
    setSnackbarOpen(true); // Show success notification
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
            Update the department details:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            placeholder="Division"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            placeholder="Department Name"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '8px', px: 3, fontSize: '0.875rem' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveClick}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openConfirmDialog} onClose={handleCancelSave}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Save Department</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to update the department &quot;{departmentName || 'Unknown'}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave} sx={{ fontSize: '0.875rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            sx={{
              fontSize: '0.875rem',
              textTransform: 'none',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              borderRadius: '8px',
              '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarMessage.includes('required') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}