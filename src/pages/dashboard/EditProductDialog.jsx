import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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

export default function EditProductDialog({ open, onClose, product, onRefresh }) {
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
  const [keptImageUrls, setKeptImageUrls] = useState([]);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);
  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [isUsedInRequests, setIsUsedInRequests] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Fetch product details, type 1 list, and check usage when dialog opens
  useEffect(() => {
    if (open && product?.id) {
      fetchProductDetails(product.id);
      fetchProductType1List();
      checkSupplierUsage(product.id);
    }
  }, [open, product]);

  // Fetch product details
  const fetchProductDetails = async (id) => {
    setLoadingProduct(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier-products/${id}`, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error(`Failed to load product details: status ${res.status}`);
      const result = await res.json();
      const productData = result.data;
      console.log('Product details:', productData); // Debug
      setFormData({
        productType1Id: productData.productType1Id || '',
        productType2Id: productData.productType2Id || '',
        supplierCode: productData.supplierCode || '',
        supplierName: productData.supplierName || '',
        sapCode: productData.sapCode || '',
        itemNo: productData.itemNo || '',
        itemDescription: productData.itemDescription || '',
        fullDescription: productData.fullDescription || '',
        size: productData.size || '',
        unit: productData.unit || '',
        price: productData.price ? productData.price.toString() : '',
        currency: productData.currency || '',
        goodType: productData.goodType || '',
      });
      setFormattedPrice(
        productData.price && productData.currency ? formatPrice(productData.price, productData.currency) : ''
      );
      const initialImageUrls = (productData.imageUrls || []).map((imgUrl) =>
        imgUrl.startsWith('http')
          ? `${imgUrl}?t=${new Date().getTime()}`
          : `${API_BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}?t=${new Date().getTime()}`
      );
      setKeptImageUrls(initialImageUrls);
      setPreviews(initialImageUrls);
      setFiles([]);
      setRemovedImageUrls([]);
    } catch (error) {
      console.error('Fetch product details error:', error);
      setNotification({
        open: true,
        message: `Failed to load product details: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoadingProduct(false);
    }
  };

  // Load product type 2 list when productType1Id changes
  useEffect(() => {
    if (formData.productType1Id) {
      fetchProductType2List(formData.productType1Id);
    } else {
      setProductType2List([]);
      setFormData((prev) => ({ ...prev, productType2Id: '' }));
    }
  }, [formData.productType1Id]);

  // Validate productType2Id after productType2List is loaded
  useEffect(() => {
    if (productType2List.length > 0 && formData.productType2Id) {
      const isValidType2 = productType2List.some((type2) => type2.id === formData.productType2Id);
      if (!isValidType2) {
        console.warn(`Invalid productType2Id: ${formData.productType2Id} not found in productType2List`);
        setFormData((prev) => ({ ...prev, productType2Id: '' }));
        setNotification({
          open: true,
          message: 'Product Type 2 is invalid or not available for the selected Product Type 1',
          severity: 'warning',
        });
      }
    }
  }, [productType2List]);

  // Clean up preview URLs when dialog closes or previews change
  useEffect(() => {
    return () => {
      previews.slice(keptImageUrls.length).forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews, keptImageUrls.length]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
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
      setFiles([]);
      setPreviews([]);
      setKeptImageUrls([]);
      setRemovedImageUrls([]);
      setIsUsedInRequests(false);
      setNotification({ open: false, message: '', severity: 'info' });
      setFormattedPrice('');
    }
  }, [open]);

  // Check if supplier product is used in requests
  const checkSupplierUsage = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-products/check-usage/${id}`, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!response.ok) {
        throw new Error(`Failed to check supplier usage: status ${response.status}`);
      }
      const result = await response.json();
      setIsUsedInRequests(result.data);
      if (result.data) {
        setNotification({
          open: true,
          message: 'This product is used in requests, so all fields are disabled.',
          severity: 'warning',
        });
      }
    } catch (error) {
      console.error('Check supplier usage error:', error);
      setIsUsedInRequests(false);
      setNotification({
        open: true,
        message: `Failed to check supplier usage: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const fetchProductType1List = async () => {
    setLoadingType1(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-1?page=0&size=10`, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error(`Failed to load product type 1 list: status ${res.status}`);
      const data = await res.json();
      console.log('Product Type 1 API response:', data); // Debug
      setProductType1List(data.content || data);
      if (data.content?.length === 0 || data.length === 0) {
        setNotification({
          open: true,
          message: 'No Product Type 1 available',
          severity: 'warning',
        });
      }
    } catch (error) {
      console.error('Fetch product type 1 error:', error);
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

  const fetchProductType2List = async (type1Id) => {
    setLoadingType2(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-type-2?productType1Id=${type1Id}&page=0&size=10`,
        {
          method: 'GET',
          headers: { accept: '*/*' },
        }
      );
      if (!res.ok) throw new Error(`Failed to load product type 2 list: status ${res.status}`);
      const data = await res.json();
      console.log('Product Type 2 API response:', data); // Debug
      setProductType2List(data.content || data);
      if (data.content?.length === 0 || data.length === 0) {
        setNotification({
          open: true,
          message: 'No Product Type 2 available for the selected Product Type 1',
          severity: 'warning',
        });
      }
    } catch (error) {
      console.error('Fetch product type 2 error:', error);
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
      setFormData((prev) => ({ ...prev, currency: value, price: '' }));
      setFormattedPrice('');
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== selectedFiles.length) {
      setNotification({
        open: true,
        message: 'Please select only image files (e.g., .jpg, .png)',
        severity: 'error',
      });
      return;
    }

    const newFiles = [...files, ...validFiles];
    if (newFiles.length + keptImageUrls.length > 10) {
      setNotification({
        open: true,
        message: 'You can upload a maximum of 10 images',
        severity: 'warning',
      });
      return;
    }

    previews.slice(keptImageUrls.length).forEach((preview) => URL.revokeObjectURL(preview));
    setFiles(newFiles);
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...keptImageUrls, ...newPreviewUrls]);
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    previews.slice(keptImageUrls.length).forEach((preview) => URL.revokeObjectURL(preview));
    if (index < keptImageUrls.length) {
      const newKeptImageUrls = [...keptImageUrls];
      const removedUrl = newKeptImageUrls.splice(index, 1)[0];
      const cleanUrl = removedUrl.split('?')[0].replace(`${API_BASE_URL}/`, '/').replace(API_BASE_URL, '');
      setKeptImageUrls(newKeptImageUrls);
      setRemovedImageUrls((prev) => [...prev, cleanUrl]);
      setPreviews([...newKeptImageUrls, ...files.map((file) => URL.createObjectURL(file))]);
    } else {
      const fileIndex = index - keptImageUrls.length;
      const newFiles = files.filter((_, i) => i !== fileIndex);
      setFiles(newFiles);
      setPreviews([...keptImageUrls, ...newFiles.map((file) => URL.createObjectURL(file))]);
    }
  };

  const validateForm = () => {
    if (!formData.supplierCode || !formData.supplierName || !formData.sapCode) {
      setNotification({
        open: true,
        message: 'Supplier Code, Supplier Name, and SAP Code are required',
        severity: 'error',
      });
      return false;
    }
    if (!formData.currency) {
      setNotification({
        open: true,
        message: 'Currency is required',
        severity: 'error',
      });
      return false;
    }
    if (!['VND', 'USD', 'EURO'].includes(formData.currency)) {
      setNotification({
        open: true,
        message: 'Currency must be VND, USD, or EURO',
        severity: 'error',
      });
      return false;
    }
    if (!formData.goodType) {
      setNotification({
        open: true,
        message: 'Good Type is required',
        severity: 'error',
      });
      return false;
    }
    if (!['Common', 'Special'].includes(formData.goodType)) {
      setNotification({
        open: true,
        message: 'Good Type must be Common, Special',
        severity: 'error',
      });
      return false;
    }
    if (formData.price && isNaN(formData.price)) {
      setNotification({
        open: true,
        message: 'Price must be a valid number',
        severity: 'error',
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
    multipartForm.append('unit', formData.unit);
    multipartForm.append('price', formData.price || '0');
    multipartForm.append('currency', formData.currency);
    multipartForm.append('goodType', formData.goodType);

    if (files.length > 0) {
      files.forEach((file) => {
        multipartForm.append('files', file);
      });
    }

    if (removedImageUrls.length > 0) {
      console.log('Images to delete:', removedImageUrls);
      removedImageUrls.forEach((url) => {
        multipartForm.append('imagesToDelete', url);
      });
    }

    console.log('FormData entries:');
    for (let pair of multipartForm.entries()) {
      console.log(`${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier-products/${product.id}`, {
        method: 'PUT',
        body: multipartForm,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = `Edit failed with status ${res.status}`;
        if (res.status === 400) {
          message = errorText.includes('Invalid price format')
            ? 'Invalid price format'
            : errorText.includes('Duplicate entry')
            ? 'Duplicate data detected'
            : errorText || message;
        } else if (res.status === 409) {
          message = errorText || 'Duplicate data detected';
        }
        throw new Error(message);
      }

      const updatedProduct = await res.json();
      console.log('Backend response:', updatedProduct);

      if (updatedProduct && updatedProduct.imageUrls) {
        const newImageUrls = updatedProduct.imageUrls.map((imgUrl) =>
          imgUrl.startsWith('http')
            ? `${imgUrl}?t=${new Date().getTime()}`
            : `${API_BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}?t=${new Date().getTime()}`
        );
        setKeptImageUrls(newImageUrls);
        setPreviews(newImageUrls);
      } else {
        console.warn('No imageUrls in response, keeping existing images');
        setKeptImageUrls([]);
        setPreviews([]);
      }

      setFiles([]);
      setRemovedImageUrls([]);

      setNotification({
        open: true,
        message: 'Product updated successfully',
        severity: 'success',
      });

      if (typeof onRefresh === 'function') {
        await onRefresh();
      } else {
        console.warn('onRefresh is not a function');
      }

      onClose();
    } catch (err) {
      console.error('Edit error:', err);
      setNotification({
        open: true,
        message: `Failed to update product: ${err.message}`,
        severity: 'error',
      });
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
        {loadingProduct ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="product-type-1-label">Product Type 1</InputLabel>
              <Select
                labelId="product-type-1-label"
                value={formData.productType1Id}
                label="Product Type 1"
                onChange={handleChange('productType1Id')}
                disabled={saving || loadingType1 || isUsedInRequests}
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
              disabled={!formData.productType1Id || loadingType2 || saving || isUsedInRequests}
            >
              <InputLabel id="product-type-2-label">Product Type 2</InputLabel>
              <Select
                labelId="product-type-2-label"
                value={formData.productType2Id}
                label="Product Type 2"
                onChange={handleChange('productType2Id')}
                disabled={saving || loadingType2 || isUsedInRequests}
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
              disabled={saving || isUsedInRequests}
            />
            <TextField
              label="Supplier Description"
              value={formData.supplierName}
              onChange={handleChange('supplierName')}
              size="small"
              fullWidth
              required
              disabled={saving || isUsedInRequests}
            />
            <TextField
              label="SAP Code"
              value={formData.sapCode}
              onChange={handleChange('sapCode')}
              size="small"
              fullWidth
              required
              disabled={saving || isUsedInRequests}
            />
            <TextField
              label="Item No"
              value={formData.itemNo}
              onChange={handleChange('itemNo')}
              size="small"
              fullWidth
              disabled={saving || isUsedInRequests}
            />
            <TextField
              label="Item Description"
              value={formData.itemDescription}
              onChange={handleChange('itemDescription')}
              size="small"
              fullWidth
              disabled={saving || isUsedInRequests}
            />
            <TextField
              label="Full Description"
              value={formData.fullDescription}
              onChange={handleChange('fullDescription')}
              size="small"
              fullWidth
              multiline
              rows={4}
              disabled={saving || isUsedInRequests}
            />
            <FormControl fullWidth size="small" disabled={saving || isUsedInRequests}>
              <InputLabel id="good-type-label">Good Type</InputLabel>
              <Select
                labelId="good-type-label"
                value={formData.goodType}
                label="Good Type"
                onChange={handleChange('goodType')}
                required
                disabled={saving || isUsedInRequests}
              >
                <MenuItem value="">
                  <em>Select Good Type</em>
                </MenuItem>
                <MenuItem value="Common">Common</MenuItem>
                <MenuItem value="Special">Special</MenuItem>
              </Select>
            </FormControl>
            <FormControl component="fieldset" disabled={saving || isUsedInRequests} required>
              <Typography variant="subtitle2" gutterBottom>
                Currency
              </Typography>
              <RadioGroup
                row
                name="currency"
                value={formData.currency}
                onChange={handleChange('currency')}
                disabled={saving || isUsedInRequests}
              >
                <FormControlLabel value="VND" control={<Radio />} label="VND" disabled={saving || isUsedInRequests} />
                <FormControlLabel value="USD" control={<Radio />} label="USD" disabled={saving || isUsedInRequests} />
                <FormControlLabel value="EURO" control={<Radio />} label="EURO" disabled={saving || isUsedInRequests} />
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
                disabled={saving || isUsedInRequests}
              />
              <TextField
                label="Unit"
                value={formData.unit}
                onChange={handleChange('unit')}
                size="small"
                fullWidth
                disabled={saving || isUsedInRequests}
              />
              <TextField
                label="Price"
                value={formattedPrice}
                onChange={handleChange('price')}
                size="small"
                fullWidth
                type="text"
                disabled={!formData.currency || saving || isUsedInRequests}
                inputProps={{ inputMode: 'numeric', pattern: formData.currency === 'VND' ? '[0-9]*' : '[0-9.]*' }}
                helperText={!formData.currency ? 'Please select a currency first' : ''}
              />
            </Stack>
            <Box>
              <InputLabel sx={{ mb: 1 }}>
                Product Images (Max 10, leave empty to keep current)
              </InputLabel>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  disabled={saving || isUsedInRequests}
                >
                  Choose Image
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={saving || isUsedInRequests}
                  />
                </Button>
                {(files.length > 0 || keptImageUrls.length > 0) && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {files.length + keptImageUrls.length} image(s) selected
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
                        style={{
                          maxHeight: '150px',
                          borderRadius: 4,
                          border: '1px solid #ddd',
                        }}
                        onError={(e) => {
                          console.error(`Failed to load preview image: ${preview}`);
                          e.target.src = '/images/fallback.jpg';
                          e.target.alt = 'Failed to load';
                        }}
                      />
                      <IconButton
                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                        onClick={() => handleRemoveFile(index)}
                        disabled={saving || isUsedInRequests}
                      >
                        <CloseIcon color="error" />
                      </IconButton>
                      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                        {index < keptImageUrls.length
                          ? 'Current Image'
                          : files[index - keptImageUrls.length]?.name || 'New Image'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving || loadingProduct}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || loadingProduct || isUsedInRequests}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />
    </Dialog>
  );
}

EditProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
  onRefresh: PropTypes.func,
};