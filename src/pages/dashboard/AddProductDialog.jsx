import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  InputLabel,
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL } from '../../config';
import Notification from './Notification';

// New: Helper functions for VND formatting
const formatVND = (number) => {
  if (!number && number !== 0) return '';
  return Number(number).toLocaleString('vi-VN', { minimumFractionDigits: 0 });
};

const parseVND = (value) => {
  if (!value) return '';
  const cleanValue = value.replace(/[^0-9]/g, '');
  return cleanValue ? parseInt(cleanValue, 10).toString() : '';
};

export default function AddProductDialog({ open, onClose, onRefresh, onSuccess, disabled }) {
  const [formData, setFormData] = useState({
    productType1Id: '',
    productType2Id: '',
    supplierCode: '',
    supplierName: '',
    sapCode: '',
    itemNo: '',
    itemDescription: '',
    fullDescription: '',
    size: '',
    materialGroupFullDescription: '',
    unit: '',
    price: '',
    currency: '',
  });

  // New: State for formatted price display
  const [formattedPrice, setFormattedPrice] = useState('');

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);
  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (open) {
      fetchProductType1List();
      resetForm();
    }
  }, [open]);

  const fetchProductType1List = async () => {
    setLoadingType1(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-1`);
      if (!res.ok) throw new Error(`Failed to load product type 1 list: status ${res.status}`);
      const data = await res.json();
      setProductType1List(data.content || data);
    } catch (error) {
      console.error(error);
      setNotification({
        open: true,
        message: `Failed to load product type 1 list: ${error.message}`,
        severity: 'error',
      });
      setProductType1List([]);
    } finally {
      setLoadingType1(false);
    }
  };

  useEffect(() => {
    if (formData.productType1Id) {
      fetchProductType2List(formData.productType1Id);
    } else {
      setProductType2List([]);
      setFormData((prev) => ({ ...prev, productType2Id: '' }));
    }
  }, [formData.productType1Id]);

  const fetchProductType2List = async (type1Id) => {
    setLoadingType2(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-type-2?productType1Id=${type1Id}&page=0&size=50`
      );
      if (!res.ok) throw new Error(`Failed to load product type 2 list: status ${res.status}`);
      const data = await res.json();
      setProductType2List(data.content || data);
    } catch (error) {
      console.error(error);
      setNotification({
        open: true,
        message: `Failed to load product type 2 list: ${error.message}`,
        severity: 'error',
      });
      setProductType2List([]);
    } finally {
      setLoadingType2(false);
    }
  };

  const handleChange = (field) => (e) => {
    if (field === 'price') {
      // New: Handle price input with VND formatting
      const rawValue = parseVND(e.target.value);
      setFormData((prev) => ({ ...prev, price: rawValue }));
      setFormattedPrice(formatVND(rawValue));
    } else {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Validate image format
    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== selectedFiles.length) {
      setNotification({
        open: true,
        message: 'Please select only image files (e.g., .jpg, .png)',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return;
    }

    const newFiles = [...files, ...validFiles];
    if (newFiles.length > 10) {
      setNotification({
        open: true,
        message: 'You can upload a maximum of 10 images',
        severity: 'warning',
        autoHideDuration: 6000,
      });
      return;
    }

    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles(newFiles);
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviewUrls);

    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    URL.revokeObjectURL(previews[index]);

    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const validateForm = () => {
    if (!formData.supplierCode?.trim() || !formData.supplierName?.trim() || !formData.sapCode?.trim() || !formData.itemNo?.trim()) {
      setNotification({
        open: true,
        message: 'Supplier Code, Supplier Name, SAP Code, and Item No are required',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return false;
    }
    if (formData.price && isNaN(formData.price)) {
      setNotification({
        open: true,
        message: 'Price must be a valid number',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const multipartForm = new FormData();

    if (formData.productType1Id) multipartForm.append('productType1Id', formData.productType1Id);
    if (formData.productType2Id) multipartForm.append('productType2Id', formData.productType2Id);
    multipartForm.append('supplierCode', formData.supplierCode);
    multipartForm.append('supplierName', formData.supplierName);
    multipartForm.append('sapCode', formData.sapCode);
    multipartForm.append('itemNo', formData.itemNo);
    multipartForm.append('itemDescription', formData.itemDescription || '');
    multipartForm.append('fullDescription', formData.fullDescription || '');
    multipartForm.append('size', formData.size || '');
    multipartForm.append('materialGroupFullDescription', formData.materialGroupFullDescription || '');
    multipartForm.append('unit', formData.unit || '');
    multipartForm.append('price', formData.price || '0'); // Clean number is sent to backend
    multipartForm.append('currency', formData.currency || '');

    files.forEach((file) => {
      multipartForm.append('files', file);
    });

    // Debug: Log FormData entries
    console.log('FormData entries:');
    for (let pair of multipartForm.entries()) {
      console.log(`${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier-products/create`, {
        method: 'POST',
        body: multipartForm,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = `Failed to add product: status ${res.status}`;
        if (res.status === 400 || res.status === 409) {
          try {
            const errorData = JSON.parse(errorText);
            message = errorData.message || errorText || message;
          } catch (parseError) {
            message = errorText || message;
          }
        }
        throw new Error(message);
      }

      const text = await res.text();
      let message = 'Product added successfully';
      try {
        const data = JSON.parse(text);
        message = data.message || message;
      } catch (parseError) {
        console.warn('Response is not JSON:', text);
        message = text || message;
      }

      // Truyền thông báo thành công về parent component
      if (typeof onSuccess === 'function') {
        onSuccess(message);
      } else {
        console.warn('onSuccess is not a function');
      }

      // Làm mới dữ liệu
      if (typeof onRefresh === 'function') {
        await onRefresh();
      } else {
        console.warn('onRefresh is not a function');
      }

      onClose();
      resetForm();
    } catch (err) {
      console.error('Add error:', err);
      setNotification({
        open: true,
        message: err.message,
        severity: 'error',
        autoHideDuration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productType1Id: '',
      productType2Id: '',
      supplierCode: '',
      supplierName: '',
      sapCode: '',
      itemNo: '',
      itemDescription: '',
      fullDescription: '',
      size: '',
      materialGroupFullDescription: '',
      unit: '',
      price: '',
      currency: '',
    });
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles([]);
    setPreviews([]);
    setNotification({ open: false, message: '', severity: 'info' });
    // New: Reset formatted price
    setFormattedPrice('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            required
            disabled={saving || disabled}
          />
          <TextField
            label="Supplier Name"
            value={formData.supplierName}
            onChange={handleChange('supplierName')}
            size="small"
            fullWidth
            required
            disabled={saving || disabled}
          />
          <TextField
            label="SAP Code"
            value={formData.sapCode}
            onChange={handleChange('sapCode')}
            size="small"
            fullWidth
            required
            disabled={saving || disabled}
          />
          <TextField
            label="Item No"
            value={formData.itemNo}
            onChange={handleChange('itemNo')}
            size="small"
            fullWidth
            required
            disabled={saving || disabled}
          />
          <TextField
            label="Item Description"
            value={formData.itemDescription}
            onChange={handleChange('itemDescription')}
            size="small"
            fullWidth
            disabled={saving || disabled}
          />
          <TextField
            label="Full Description"
            value={formData.fullDescription}
            onChange={handleChange('fullDescription')}
            size="small"
            fullWidth
            multiline
            rows={4}
            disabled={saving || disabled}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Size"
              value={formData.size}
              onChange={handleChange('size')}
              size="small"
              fullWidth
              disabled={saving || disabled}
            />
            <TextField
              label="Material Group Full Description"
              value={formData.materialGroupFullDescription}
              onChange={handleChange('materialGroupFullDescription')}
              size="small"
              fullWidth
              disabled={saving || disabled}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Unit"
              value={formData.unit}
              onChange={handleChange('unit')}
              size="small"
              fullWidth
              disabled={saving || disabled}
            />
            {/* Modified: Price TextField with VND formatting */}
            <TextField
              label="Price"
              value={formattedPrice}
              onChange={handleChange('price')}
              size="small"
              fullWidth
              type="text" // Changed from type="number" to allow formatted input
              disabled={saving || disabled}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }} // Restrict to numeric-like input
            />
          </Stack>
          <TextField
            label="Currency"
            value={formData.currency}
            onChange={handleChange('currency')}
            size="small"
            fullWidth
            disabled={saving || disabled}
          />
          <FormControl fullWidth size="small" disabled={loadingType1 || saving || disabled}>
            <InputLabel id="product-type-1-label">Group Item 1</InputLabel>
            <Select
              labelId="product-type-1-label"
              value={formData.productType1Id}
              label="Group Item 1"
              onChange={handleChange('productType1Id')}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {productType1List.map((type1) => (
                <MenuItem key={type1.id} value={type1.id}>
                  {type1.name}
                </MenuItem>
              ))}
            </Select>
            {loadingType1 && <FormHelperText>Loading types...</FormHelperText>}
          </FormControl>
          <FormControl
            fullWidth
            size="small"
            disabled={!formData.productType1Id || loadingType2 || saving || disabled}
          >
            <InputLabel id="product-type-2-label">Group Item 2</InputLabel>
            <Select
              labelId="product-type-2-label"
              value={formData.productType2Id}
              label="Group Item 2"
              onChange={handleChange('productType2Id')}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {productType2List.map((type2) => (
                <MenuItem key={type2.id} value={type2.id}>
                  {type2.name}
                </MenuItem>
              ))}
            </Select>
            {loadingType2 && <FormHelperText>Loading subtypes...</FormHelperText>}
          </FormControl>
          <Box>
            <InputLabel sx={{ mb: 1 }}>Images (Max 10)</InputLabel>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={saving || disabled}
              >
                Choose Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </Button>
              {files.length > 0 && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {files.length} image(s) selected
                </Typography>
              )}
            </Stack>
            {previews.length > 0 && (
              <Box mt={2} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {previews.map((preview, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                    />
                    <IconButton
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                      onClick={() => handleRemoveFile(index)}
                      disabled={saving || disabled}
                    >
                      <CloseIcon color="error" />
                    </IconButton>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                      {files[index].name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving || disabled}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || disabled}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
        autoHideDuration={6000}
      />
    </Dialog>
  );
}