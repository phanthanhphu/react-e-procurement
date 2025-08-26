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
import { API_BASE_URL } from '../../config';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';

export default function AddProductDialog({ open, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    productType1Id: '',
    productType2Id: '',
    supplierCode: '',
    supplierName: '',
    sapCode: '',
    productFullName: '',
    productShortName: '',
    size: '',
    price: '',
    unit: '',
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);

  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);

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
      if (!res.ok) throw new Error('Failed to load product type 1 list');
      const data = await res.json();
      setProductType1List(data.content || data);
    } catch (error) {
      console.error(error);
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
      if (!res.ok) throw new Error('Failed to load product type 2 list');
      const data = await res.json();
      setProductType2List(data.content || data);
    } catch (error) {
      console.error(error);
      setProductType2List([]);
    } finally {
      setLoadingType2(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newFiles = [...files, ...selectedFiles];
    if (newFiles.length > 10) {
      alert('You can upload a maximum of 10 images.');
      return;
    }

    // Thu hồi các URL preview cũ để tránh rò rỉ bộ nhớ
    previews.forEach((preview) => URL.revokeObjectURL(preview));

    setFiles(newFiles);
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviewUrls);

    // Reset input để cho phép chọn lại file ngay lập tức
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    // Xóa file và preview tại index
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    // Thu hồi URL của preview bị xóa
    URL.revokeObjectURL(previews[index]);

    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const validateForm = () => {
    return (
      formData.supplierCode &&
      formData.sapCode &&
      formData.productFullName &&
      formData.productShortName &&
      files.length > 0
    );
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields and select at least one image.');
      return;
    }

    const multipartForm = new FormData();

    // Append productType1Id và productType2Id nếu có giá trị
    if (formData.productType1Id) {
      multipartForm.append('productType1Id', formData.productType1Id);
    }
    if (formData.productType2Id) {
      multipartForm.append('productType2Id', formData.productType2Id);
    }

    multipartForm.append('supplierCode', formData.supplierCode);
    multipartForm.append('supplierName', formData.supplierName);
    multipartForm.append('sapCode', formData.sapCode);
    multipartForm.append('productFullName', formData.productFullName);
    multipartForm.append('productShortName', formData.productShortName);
    multipartForm.append('size', formData.size);
    multipartForm.append('price', formData.price);
    multipartForm.append('unit', formData.unit);

    // Append danh sách file với key 'files'
    files.forEach((file) => {
      multipartForm.append('files', file);
    });

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier-products/create`, {
        method: 'POST',
        body: multipartForm,
      });

      if (!res.ok) throw new Error(`Add failed with status ${res.status}`);

      await onRefresh();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Add error:', err);
      alert('Failed to add product. Please try again!');
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
      productFullName: '',
      productShortName: '',
      size: '',
      price: '',
      unit: '',
    });
    // Thu hồi tất cả URL preview để tránh rò rỉ bộ nhớ
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles([]);
    setPreviews([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#4680FF', color: 'white' }}>
        Add Product
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="product-type-1-label">Product Type 1</InputLabel>
            <Select
              labelId="product-type-1-label"
              value={formData.productType1Id}
              label="Product Type 1"
              onChange={handleChange('productType1Id')}
              disabled={loadingType1}
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
            disabled={!formData.productType1Id || loadingType2}
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

          <Box>
            <InputLabel sx={{ mb: 1 }}>Product Images (Max 10)</InputLabel>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                Choose Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
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
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}