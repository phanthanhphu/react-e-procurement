import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
} from '@mui/material';

export default function AddDepartmentDialog({ open, onClose, onAdd }) {
  const [departmentName, setDepartmentName] = useState('');
  const [division, setDivision] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // New state for confirmation dialog

  const handleAdd = () => {
    if (!departmentName.trim() || !division.trim()) {
      return; // Validation already handled by disabling the button
    }
    setOpenConfirmDialog(true); // Show confirmation dialog
  };

  const handleConfirmAdd = () => {
    onAdd({ departmentName, division }); // Call the onAdd callback with department details
    setDepartmentName('');
    setDivision('');
    setOpenConfirmDialog(false); // Close confirmation dialog
    onClose(); // Close the main dialog
  };

  const handleCancelAdd = () => {
    setOpenConfirmDialog(false); // Close confirmation dialog without action
  };

  const handleClose = () => {
    setDepartmentName('');
    setDivision('');
    setOpenConfirmDialog(false); // Ensure confirmation dialog is closed
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
            Enter the new department details:
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
            onClick={handleClose}
            variant="outlined"
            sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '8px', px: 3, fontSize: '0.875rem' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!departmentName.trim() || !division.trim()} // Disable button if inputs are empty
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
              '&:hover': { background: 'linear-gradient(to right, #3aa4f8, #016ae3)' },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openConfirmDialog} onClose={handleCancelAdd}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Add Department</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to add a department with name &quot;{departmentName || 'Unknown'}&quot; and division &quot;{division || 'Unknown'}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAdd} sx={{ fontSize: '0.875rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdd}
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
    </>
  );
}