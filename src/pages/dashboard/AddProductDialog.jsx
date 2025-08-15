import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
} from '@mui/material';
import { API_BASE_URL } from '../../config';

export default function AddProductDialog({ open, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    supplierCode: '',
    supplierName: '',
    sapCode: '',
    productFullName: '',
    productShortName: '',
    size: '',
    price: 0,
    unit: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateForm = () => {
    return formData.supplierCode && formData.sapCode && formData.productFullName && formData.productShortName;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(`Add failed status ${res.status}`);

      await onRefresh(); // Refresh the data after adding the new product
      onClose(); // Close the dialog
    } catch (err) {
      console.error('Add error:', err);
      alert('Failed to add product. Please try again!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Update DialogTitle with custom style */}
      <DialogTitle sx={{ backgroundColor: '#4680FF', color: 'white' }}>
        Add Product
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Supplier Code"
            value={formData.supplierCode}
            onChange={handleChange('supplierCode')}
            size="small"
            fullWidth
          />
          <TextField
            label="Supplier Name"
            value={formData.supplierName}
            onChange={handleChange('supplierName')}
            size="small"
            fullWidth
          />
          <TextField
            label="SAP Code"
            value={formData.sapCode}
            onChange={handleChange('sapCode')}
            size="small"
            fullWidth
          />
          <TextField
            label="Product Full Name"
            value={formData.productFullName}
            onChange={handleChange('productFullName')}
            size="small"
            fullWidth
          />
          <TextField
            label="Product Short Name"
            value={formData.productShortName}
            onChange={handleChange('productShortName')}
            size="small"
            fullWidth
          />
          <TextField
            label="Size"
            value={formData.size}
            onChange={handleChange('size')}
            size="small"
            fullWidth
          />
          <TextField
            label="Price"
            value={formData.price}
            onChange={handleChange('price')}
            size="small"
            fullWidth
            type="number"
          />
          <TextField
            label="Unit"
            value={formData.unit}
            onChange={handleChange('unit')}
            size="small"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
