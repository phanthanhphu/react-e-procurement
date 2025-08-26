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

  const handleAdd = () => {
    if (departmentName.trim() && division.trim()) {
      onAdd({ departmentName, division }); // Loại bỏ englishName vì API không yêu cầu
      setDepartmentName('');
      setDivision('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
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
          onClick={onClose}
          variant="outlined"
          sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '8px', px: 3, fontSize: '0.875rem' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
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
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}