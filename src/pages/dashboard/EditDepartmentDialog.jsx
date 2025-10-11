import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
} from '@mui/material';

export default function EditDepartmentDialog({ open, onClose, onUpdate, department }) {
  const [departmentName, setDepartmentName] = useState(department?.departmentName || '');
  const [division, setDivision] = useState(department?.division || '');

  useEffect(() => {
    if (department) {
      setDepartmentName(department.departmentName || '');
      setDivision(department.division || '');
    }
  }, [department]);

  const handleUpdate = () => {
    if (departmentName.trim() && division.trim()) {
      onUpdate({ id: department.id, departmentName, division, createdAt: department.createdAt });
      onClose();
    }
  };

  return (
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
          onClick={handleUpdate}
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
  );
}