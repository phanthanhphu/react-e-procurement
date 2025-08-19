import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button
} from '@mui/material';

export default function EditDepartmentDialog({ open, onClose, onUpdate, newName, setNewName }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Department</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
          Update the department name:
        </Typography>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Department name"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            outline: 'none',
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button onClick={onUpdate} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
