import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button
} from '@mui/material';

export default function AddDepartmentDialog({ open, onClose, onAdd, newName, setNewName }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Department</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
          Enter the new department name:
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New department name"
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '8px', px: 3, fontSize: '0.875rem' }}>
          Cancel
        </Button>
        <Button onClick={onAdd} variant="contained" sx={{ textTransform: 'none', fontWeight: 500, background: 'linear-gradient(to right, #4cb8ff, #027aff)', color: '#fff', px: 3, borderRadius: '8px', fontSize: '0.875rem' }}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
