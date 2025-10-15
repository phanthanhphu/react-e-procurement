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
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL } from '../../config';
import Notification from './Notification';

// Helper functions for currency formatting
const formatPrice = (number, currency) => {
  if (!number && number !== 0) return '';
  if (currency === 'VND') {
    return Number(number).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  } else if (currency === 'USD' || currency === 'EURO') {
    return Number(number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return number.toString();
};

const parsePrice = (value, currency) => {
  if (!value) return '';
  let cleanValue;
  if (currency === 'VND') {
    cleanValue = value.replace(/[^0-9]/g, '');
  } else if (currency === 'USD' || currency === 'EURO') {
    cleanValue = value.replace(/[^0-9.]/g, '');
  } else {
    cleanValue = value.replace(/[^0-9.]/g, '');
  }
  return cleanValue ? cleanValue : '';
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
    unit: '',
    price: '',
    currency: '',
    goodType: '',
  });

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
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // State for confirmation dialog

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
    const value = e.target.value;
    if (field === 'price') {
      const rawValue = parsePrice(value, formData.currency);
      setFormData((prev) => ({ ...prev, price: rawValue }));
      setFormattedPrice(formatPrice(rawValue, formData.currency));
    } else if (field === 'currency') {
      // Reset price when currency changes
      setFormData((prev) => ({ ...prev, currency: value, price: '' }));
      setFormattedPrice('');
    } else {
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
    if (!formData.currency) {
      setNotification({
        open: true,
        message: 'Currency is required',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return false;
    }
    if (!['VND', 'USD', 'EURO'].includes(formData.currency)) {
      setNotification({
        open: true,
        message: 'Currency must be VND, USD, or EURO',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return false;
    }
    if (!formData.goodType) {
      setNotification({
        open: true,
        message: 'Good Type is required',
        severity: 'error',
        autoHideDuration: 6000,
      });
      return false;
    }
    if (!['Common', 'Special'].includes(formData.goodType)) {
      setNotification({
        open: true,
        message: 'Good Type must be Common or Special',
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

  const handleSaveClick = () => {
    if (!validateForm()) return;
    setOpenConfirmDialog(true); // Show confirmation dialog
  };

  const handleConfirmSave = async () => {
    setOpenConfirmDialog(false); // Close confirmation dialog
    await handleSave(); // Execute the original save logic
  };

  const handleCancelSave = () => {
    setOpenConfirmDialog(false); // Close confirmation dialog without saving
  };

  const handleSave = async () => {
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
    multipartForm.append('unit', formData.unit || '');
    multipartForm.append('price', formData.price || '0');
    multipartForm.append('currency', formData.currency);
    multipartForm.append('goodType', formData.goodType);

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

      setNotification({
        open: true,
        message: message,
        severity: 'success',
        autoHideDuration: 6000,
      });

      if (typeof onSuccess === 'function') {
        onSuccess(message);
      } else {
        console.warn('onSuccess is not a function');
      }

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
      unit: '',
      price: '',
      currency: '',
      goodType: '',
    });
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles([]);
    setPreviews([]);
    setNotification({ open: false, message: '', severity: 'info' });
    setFormattedPrice('');
    setOpenConfirmDialog(false); // Ensure confirmation dialog is closed
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#4680FF', color: 'white' }}>
          Add Product
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth size="small" disabled={loadingType1 || saving || disabled}>
              <InputLabel id="product-type-1-label">Product Type 1</InputLabel>
              <Select
                labelId="product-type-1-label"
                value={formData.productType1Id}
                label="Product Type 1"
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
              <InputLabel id="product-type-2-label">Product Type 2</InputLabel>
              <Select
                labelId="product-type-2-label"
                value={formData.productType2Id}
                label="Product Type 2"
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
              label="Supplier Description"
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
            <FormControl fullWidth size="small" disabled={saving || disabled}>
              <InputLabel id="good-type-label">Good Type</InputLabel>
              <Select
                labelId="good-type-label"
                value={formData.goodType}
                label="Good Type"
                onChange={handleChange('goodType')}
                required
              >
                <MenuItem value="">
                  <em>Select Good Type</em>
                </MenuItem>
                <MenuItem value="Common">Common</MenuItem>
                <MenuItem value="Special">Special</MenuItem>
              </Select>
            </FormControl>
            <FormControl component="fieldset" disabled={saving || disabled} required>
              <Typography variant="subtitle2" gutterBottom>
                Currency
              </Typography>
              <RadioGroup
                row
                name="currency"
                value={formData.currency}
                onChange={handleChange('currency')}
              >
                <FormControlLabel value="VND" control={<Radio />} label="VND" />
                <FormControlLabel value="USD" control={<Radio />} label="USD" />
                <FormControlLabel value="EURO" control={<Radio />} label="EURO" />
              </RadioGroup>
              {!formData.currency && (
                <FormHelperText error>Please select a currency</FormHelperText>
              )}
            </FormControl>
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
                label="Unit"
                value={formData.unit}
                onChange={handleChange('unit')}
                size="small"
                fullWidth
                disabled={saving || disabled}
              />
              <TextField
                label="Price"
                value={formattedPrice}
                onChange={handleChange('price')}
                size="small"
                fullWidth
                type="text"
                disabled={!formData.currency || saving || disabled}
                inputProps={{ inputMode: 'numeric', pattern: formData.currency === 'VND' ? '[0-9]*' : '[0-9.]*' }}
                helperText={!formData.currency ? 'Please select a currency first' : ''}
              />
            </Stack>
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
          <Button
            variant="contained"
            onClick={handleSaveClick}
            disabled={saving || disabled}
          >
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
      <Dialog open={openConfirmDialog} onClose={handleCancelSave}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Add Product</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to add a product with Supplier Code &quot;{formData.supplierCode || 'Unknown'}&quot;?
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
            disabled={saving}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}