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

export default function EditProductDialog({ open, onClose, product, onRefresh }) {
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
  const [keptImageUrls, setKeptImageUrls] = useState([]); // Danh sách URL hình ảnh cần giữ
  const [saving, setSaving] = useState(false);

  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);

  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProductType1List();
    }
  }, [open]);

  useEffect(() => {
    if (product) {
      setFormData({
        productType1Id: product.productType1Id || '',
        productType2Id: product.productType2Id || '',
        supplierCode: product.supplierCode || '',
        supplierName: product.supplierName || '',
        sapCode: product.sapCode || '',
        productFullName: product.productFullName || '',
        productShortName: product.productShortName || '',
        size: product.size || '',
        price: product.price || '',
        unit: product.unit || '',
      });

      // Load danh sách hình ảnh hiện tại từ product.imageUrls
      const initialImageUrls = (product.imageUrls || []).map((imgUrl) =>
        imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`
      );
      setKeptImageUrls(initialImageUrls);
      setPreviews(initialImageUrls);
      setFiles([]); // Không cần giữ file ban đầu, chỉ cần preview
    }
  }, [product]);

  useEffect(() => {
    if (formData.productType1Id) {
      fetchProductType2List(formData.productType1Id);
    } else {
      setProductType2List([]);
      setFormData((prev) => ({ ...prev, productType2Id: '' }));
    }
  }, [formData.productType1Id]);

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
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newFiles = [...files, ...selectedFiles];
    if (newFiles.length + keptImageUrls.length > 10) {
      alert('You can upload a maximum of 10 images.');
      return;
    }

    setFiles(newFiles);
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...keptImageUrls, ...newPreviewUrls]);

    // Reset input để cho phép chọn lại file ngay lập tức
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    if (index < keptImageUrls.length) {
      // Xóa hình ảnh hiện tại khỏi keptImageUrls
      const newKeptImageUrls = [...keptImageUrls];
      newKeptImageUrls.splice(index, 1);
      setKeptImageUrls(newKeptImageUrls);
      const newPreviews = [...newKeptImageUrls, ...files.map((file) => URL.createObjectURL(file))];
      setPreviews(newPreviews);
    } else {
      // Xóa file và preview mới thêm
      const fileIndex = index - keptImageUrls.length;
      const newFiles = files.filter((_, i) => i !== fileIndex);
      const newPreviews = [...keptImageUrls, ...newFiles.map((file) => URL.createObjectURL(file))];
      files.forEach((file) => URL.revokeObjectURL(URL.createObjectURL(file))); // Thu hồi tất cả file cũ
      setFiles(newFiles);
      setPreviews(newPreviews);
    }
  };

  const validateForm = () => {
    return (
      formData.supplierCode.trim() !== '' &&
      formData.sapCode.trim() !== '' &&
      formData.productFullName.trim() !== '' &&
      formData.productShortName.trim() !== ''
    );
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields.');
      return;
    }

    const multipartForm = new FormData();
    if (formData.productType1Id) multipartForm.append('productType1Id', formData.productType1Id);
    if (formData.productType2Id) multipartForm.append('productType2Id', formData.productType2Id);

    multipartForm.append('supplierCode', formData.supplierCode);
    multipartForm.append('supplierName', formData.supplierName);
    multipartForm.append('sapCode', formData.sapCode);
    multipartForm.append('productFullName', formData.productFullName);
    multipartForm.append('productShortName', formData.productShortName);
    multipartForm.append('size', formData.size);
    multipartForm.append('price', formData.price);
    multipartForm.append('unit', formData.unit);

    // Append danh sách file mới
    files.forEach((file) => {
      multipartForm.append('files', file);
    });

    // Append danh sách URL cần giữ, chuẩn hóa đường dẫn và log để debug
    console.log('KeptImageUrls before send:', keptImageUrls);
    if (keptImageUrls.length === 0) {
      console.log('No images to keep, all existing images will be removed');
    }
    keptImageUrls.forEach((url) => {
      const normalizedUrl = url.replace(`${API_BASE_URL}/`, '/').replace(API_BASE_URL, '');
      console.log('Sending keptImageUrl:', normalizedUrl);
      multipartForm.append('keptImageUrls', normalizedUrl);
    });

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier-products/${product.id}`, {
        method: 'PUT',
        body: multipartForm,
      });

      if (!res.ok) throw new Error(`Edit failed status ${res.status}`);

      await onRefresh();
      onClose();
    } catch (err) {
      console.error('Edit error:', err);
      alert('Edit failed. Please try again!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#4680FF', color: 'white' }}>
        Edit Product
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Product Type 1 Select */}
          <FormControl fullWidth size="small" disabled={loadingType1}>
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

          {/* Product Type 2 Select */}
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

          {/* Text Fields */}
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

          {/* Upload Image Section */}
          <Box>
            <InputLabel sx={{ mb: 1 }}>
              Product Images (Max 10, leave empty to keep current)
            </InputLabel>
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
                  {files.length} new image(s) selected
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
                      {index < keptImageUrls.length ? 'Current Image' : files[index - keptImageUrls.length]?.name || 'New Image'}
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