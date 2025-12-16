import React, { useEffect, useMemo, useState } from 'react';
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
  Chip,
  Divider,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
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
  if (currency === 'VND') cleanValue = value.replace(/[^0-9]/g, '');
  else cleanValue = value.replace(/[^0-9.]/g, '');
  return cleanValue ? cleanValue : '';
};

export default function EditProductDialog({ open, onClose, product, onRefresh }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    productType1Id: '',
    productType2Id: '',
    supplierCode: '',
    supplierName: '',
    sapCode: '',
    hanaSapCode: '',
    itemDescriptionEN: '',
    itemDescriptionVN: '',
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

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const locked = saving; // khoá thao tác khi đang save
  const disabledAll = saving || loadingProduct || isUsedInRequests;

  // ====== STYLE TOKENS (same vibe) ======
  const paperSx = useMemo(
    () => ({
      borderRadius: fullScreen ? 0 : 4,
      overflow: 'hidden',
      boxShadow: `0 22px 70px ${alpha('#000', 0.25)}`,
      border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
      background:
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.72)
          : alpha('#FFFFFF', 0.92),
      backdropFilter: 'blur(14px)',
    }),
    [fullScreen, theme]
  );

  const headerSx = useMemo(
    () => ({
      position: 'relative',
      py: 2,
      px: 2.5,
      color: 'common.white',
      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    }),
    [theme]
  );

  const subtleCardSx = useMemo(
    () => ({
      borderRadius: 4,
      border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
      background: alpha(theme.palette.common.white, 0.6),
      backdropFilter: 'blur(10px)',
      boxShadow: `0 10px 30px ${alpha('#000', 0.08)}`,
    }),
    [theme]
  );

  const fieldSx = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.common.white, 0.65),
        '& fieldset': { borderColor: alpha(theme.palette.divider, 0.7) },
        '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.5) },
        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 2 },
      },
    }),
    [theme]
  );

  const gradientBtnSx = useMemo(
    () => ({
      borderRadius: 999,
      px: 2.2,
      py: 1.1,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.28)}`,
      transform: 'translateY(0)',
      transition: 'transform .15s ease, box-shadow .15s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 14px 30px ${alpha(theme.palette.primary.main, 0.34)}`,
        backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
      },
    }),
    [theme]
  );

  const outlineBtnSx = {
    borderRadius: 999,
    px: 2.2,
    py: 1.1,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  };

  const handleCloseNotification = () => setNotification((prev) => ({ ...prev, open: false }));

  // Fetch product details, type 1 list, and check usage when dialog opens
  useEffect(() => {
    if (open && product?.id) {
      fetchProductDetails(product.id);
      fetchProductType1List();
      checkSupplierUsage(product.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  // Load product type 2 list when productType1Id changes
  useEffect(() => {
    if (formData.productType1Id) {
      fetchProductType2List(formData.productType1Id);
    } else {
      setProductType2List([]);
      setFormData((prev) => ({ ...prev, productType2Id: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.productType1Id]);

  // Validate productType2Id after productType2List is loaded
  useEffect(() => {
    if (productType2List.length > 0 && formData.productType2Id) {
      const isValidType2 = productType2List.some((type2) => type2.id === formData.productType2Id);
      if (!isValidType2) {
        setFormData((prev) => ({ ...prev, productType2Id: '' }));
        setNotification({
          open: true,
          message: 'Product Type 2 is invalid or not available for the selected Product Type 1',
          severity: 'warning',
        });
      }
    }
  }, [productType2List, formData.productType2Id]);

  // Clean up preview URLs
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
        hanaSapCode: '',
        itemDescriptionEN: '',
        itemDescriptionVN: '',
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
      setOpenConfirmDialog(false);
    }
  }, [open]);

  // ====== API ======
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

      setFormData({
        productType1Id: productData.productType1Id || '',
        productType2Id: productData.productType2Id || '',
        supplierCode: productData.supplierCode || '',
        supplierName: productData.supplierName || '',
        sapCode: productData.sapCode || '',
        hanaSapCode: productData.hanaSapCode || '',
        itemDescriptionEN: productData.itemDescriptionEN || '',
        itemDescriptionVN: productData.itemDescriptionVN || '',
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
      setNotification({
        open: true,
        message: `Failed to load product details: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoadingProduct(false);
    }
  };

  const checkSupplierUsage = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-products/check-usage/${id}`, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!response.ok) throw new Error(`Failed to check supplier usage: status ${response.status}`);
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
      setProductType1List(data.content || data);

      if ((data.content?.length || data.length || 0) === 0) {
        setNotification({ open: true, message: 'No Product Type 1 available', severity: 'warning' });
      }
    } catch (error) {
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
      const res = await fetch(`${API_BASE_URL}/api/product-type-2?productType1Id=${type1Id}&page=0&size=10`, {
        method: 'GET',
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error(`Failed to load product type 2 list: status ${res.status}`);
      const data = await res.json();
      setProductType2List(data.content || data);

      if ((data.content?.length || data.length || 0) === 0) {
        setNotification({
          open: true,
          message: 'No Product Type 2 available for the selected Product Type 1',
          severity: 'warning',
        });
      }
    } catch (error) {
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

  // ====== handlers ======
  const handleDialogClose = () => {
    if (locked) return;
    onClose?.();
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    if (field === 'price') {
      const rawValue = parsePrice(value, formData.currency);
      setFormData((prev) => ({ ...prev, price: rawValue }));
      setFormattedPrice(formatPrice(rawValue, formData.currency));
      return;
    }

    if (field === 'currency') {
      setFormData((prev) => ({ ...prev, currency: value, price: '' }));
      setFormattedPrice('');
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== selectedFiles.length) {
      setNotification({ open: true, message: 'Please select only image files (e.g., .jpg, .png)', severity: 'error' });
      return;
    }

    const newFiles = [...files, ...validFiles];
    if (newFiles.length + keptImageUrls.length > 10) {
      setNotification({ open: true, message: 'You can upload a maximum of 10 images', severity: 'warning' });
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
    if (!formData.supplierName || !formData.sapCode) {
      setNotification({ open: true, message: 'Supplier Name and SAP Code are required', severity: 'error' });
      return false;
    }
    if (!formData.currency) {
      setNotification({ open: true, message: 'Currency is required', severity: 'error' });
      return false;
    }
    if (!['VND', 'USD', 'EURO'].includes(formData.currency)) {
      setNotification({ open: true, message: 'Currency must be VND, USD, or EURO', severity: 'error' });
      return false;
    }
    if (!formData.goodType) {
      setNotification({ open: true, message: 'Good Type is required', severity: 'error' });
      return false;
    }
    if (!['Common', 'Special'].includes(formData.goodType)) {
      setNotification({ open: true, message: 'Good Type must be Common, Special', severity: 'error' });
      return false;
    }
    if (formData.price && isNaN(formData.price)) {
      setNotification({ open: true, message: 'Price must be a valid number', severity: 'error' });
      return false;
    }
    return true;
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;
    setOpenConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setOpenConfirmDialog(false);
    await handleSave();
  };

  const handleCancelSave = () => setOpenConfirmDialog(false);

  const handleSave = async () => {
    const multipartForm = new FormData();
    if (formData.productType1Id) multipartForm.append('productType1Id', formData.productType1Id);
    if (formData.productType2Id) multipartForm.append('productType2Id', formData.productType2Id);

    multipartForm.append('supplierCode', formData.supplierCode || '');
    multipartForm.append('supplierName', formData.supplierName || '');
    multipartForm.append('sapCode', formData.sapCode || '');
    multipartForm.append('hanaSapCode', formData.hanaSapCode || '');
    multipartForm.append('itemDescriptionEN', formData.itemDescriptionEN || '');
    multipartForm.append('itemDescriptionVN', formData.itemDescriptionVN || '');
    multipartForm.append('size', formData.size || '');
    multipartForm.append('unit', formData.unit || '');
    multipartForm.append('price', formData.price || '0');
    multipartForm.append('currency', formData.currency || '');
    multipartForm.append('goodType', formData.goodType || '');

    if (files.length > 0) files.forEach((file) => multipartForm.append('files', file));
    if (removedImageUrls.length > 0) removedImageUrls.forEach((url) => multipartForm.append('imagesToDelete', url));

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

      if (updatedProduct && updatedProduct.imageUrls) {
        const newImageUrls = updatedProduct.imageUrls.map((imgUrl) =>
          imgUrl.startsWith('http')
            ? `${imgUrl}?t=${new Date().getTime()}`
            : `${API_BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}?t=${new Date().getTime()}`
        );
        setKeptImageUrls(newImageUrls);
        setPreviews(newImageUrls);
      } else {
        setKeptImageUrls([]);
        setPreviews([]);
      }

      setFiles([]);
      setRemovedImageUrls([]);

      setNotification({ open: true, message: 'Product updated successfully', severity: 'success' });

      if (typeof onRefresh === 'function') await onRefresh();

      onClose?.();
    } catch (err) {
      setNotification({ open: true, message: `Failed to update product: ${err.message}`, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const headerChipLabel = isUsedInRequests ? 'Locked' : 'Editing';

  return (
    <>
      <Dialog
        open={open}
        onClose={locked ? undefined : handleDialogClose}
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: paperSx }}
      >
        {/* Header */}
        <DialogTitle sx={headerSx}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  fontSize: { xs: 18, sm: 20 },
                }}
              >
                Edit Product
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 13 }}>
                Update product info, pricing and images
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label={headerChipLabel}
                sx={{
                  color: 'common.white',
                  bgcolor: alpha('#000', 0.18),
                  border: `1px solid ${alpha('#fff', 0.22)}`,
                  fontWeight: 700,
                }}
              />
              <Tooltip title="Close">
                <span>
                  <IconButton
                    onClick={handleDialogClose}
                    disabled={locked}
                    sx={{
                      color: 'common.white',
                      bgcolor: alpha('#000', 0.18),
                      border: `1px solid ${alpha('#fff', 0.22)}`,
                      '&:hover': { bgcolor: alpha('#000', 0.28) },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          {loadingProduct ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {/* Locked note */}
              {isUsedInRequests ? (
                <Box
                  sx={{
                    p: 1.4,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.18)}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <InfoRoundedIcon sx={{ fontSize: 18, mt: '2px', color: alpha(theme.palette.warning.main, 0.9) }} />
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      <b>Locked:</b> This product is used in requests, so all fields are disabled.
                    </Typography>
                  </Stack>
                </Box>
              ) : null}

              {/* Card 1: Types + GoodType + Currency */}
              <Box sx={{ ...subtleCardSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Classification</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                  Keep it consistent for filtering & reporting
                </Typography>
                <Divider sx={{ my: 1.6 }} />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.8,
                  }}
                >
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel id="product-type-1-label">Product Type 1</InputLabel>
                    <Select
                      labelId="product-type-1-label"
                      value={formData.productType1Id}
                      label="Product Type 1"
                      onChange={handleChange('productType1Id')}
                      disabled={disabledAll || loadingType1}
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
                    {loadingType1 ? <FormHelperText>Loading types...</FormHelperText> : null}
                  </FormControl>

                  <FormControl
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    disabled={!formData.productType1Id || disabledAll || loadingType2}
                  >
                    <InputLabel id="product-type-2-label">Product Type 2</InputLabel>
                    <Select
                      labelId="product-type-2-label"
                      value={formData.productType2Id}
                      label="Product Type 2"
                      onChange={handleChange('productType2Id')}
                      disabled={!formData.productType1Id || disabledAll || loadingType2}
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
                    {loadingType2 ? <FormHelperText>Loading subtypes...</FormHelperText> : null}
                  </FormControl>

                  <FormControl fullWidth size="small" sx={fieldSx} disabled={disabledAll}>
                    <InputLabel id="good-type-label">Good Type</InputLabel>
                    <Select
                      labelId="good-type-label"
                      value={formData.goodType}
                      label="Good Type"
                      onChange={handleChange('goodType')}
                      required
                      disabled={disabledAll}
                    >
                      <MenuItem value="">
                        <em>Select Good Type</em>
                      </MenuItem>
                      <MenuItem value="Common">Common</MenuItem>
                      <MenuItem value="Special">Special</MenuItem>
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography sx={{ fontWeight: 900, letterSpacing: 0.3, fontSize: 12.5, mb: 0.6 }}>
                      Currency
                    </Typography>
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.common.white, 0.55),
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      }}
                    >
                      <RadioGroup
                        row
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange('currency')}
                      >
                        <FormControlLabel value="VND" control={<Radio />} label="VND" disabled={disabledAll} />
                        <FormControlLabel value="USD" control={<Radio />} label="USD" disabled={disabledAll} />
                        <FormControlLabel value="EURO" control={<Radio />} label="EURO" disabled={disabledAll} />
                      </RadioGroup>
                      {!formData.currency ? (
                        <FormHelperText error sx={{ mt: 0.2 }}>
                          Please select a currency
                        </FormHelperText>
                      ) : null}
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 1.8,
                    p: 1.4,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <InfoRoundedIcon sx={{ fontSize: 18, mt: '2px', color: alpha(theme.palette.primary.main, 0.8) }} />
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      <b>Tip:</b> Pick Currency first, then input Price to avoid format errors.
                    </Typography>
                  </Stack>
                </Box>
              </Box>

              {/* Card 2: Core fields */}
              <Box sx={{ ...subtleCardSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Core Information</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                  These fields affect request matching and reporting
                </Typography>
                <Divider sx={{ my: 1.6 }} />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.8,
                  }}
                >
                  <TextField
                    label="Supplier Code"
                    value={formData.supplierCode}
                    onChange={handleChange('supplierCode')}
                    size="small"
                    fullWidth
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="(optional)"
                  />

                  <TextField
                    label="Supplier Description"
                    value={formData.supplierName}
                    onChange={handleChange('supplierName')}
                    size="small"
                    fullWidth
                    required
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="e.g., Supplier ABC - cookies"
                  />

                  <TextField
                    label="SAP Code"
                    value={formData.sapCode}
                    onChange={handleChange('sapCode')}
                    size="small"
                    fullWidth
                    required
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="e.g., 10002341"
                  />

                  <TextField
                    label="Item No"
                    value={formData.hanaSapCode}
                    onChange={handleChange('hanaSapCode')}
                    size="small"
                    fullWidth
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="e.g., HANA-xxxx"
                  />

                  <TextField
                    label="Size"
                    value={formData.size}
                    onChange={handleChange('size')}
                    size="small"
                    fullWidth
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="e.g., 500g"
                  />

                  <TextField
                    label="Unit"
                    value={formData.unit}
                    onChange={handleChange('unit')}
                    size="small"
                    fullWidth
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="e.g., box / pcs"
                  />

                  <TextField
                    label="Price"
                    value={formattedPrice}
                    onChange={handleChange('price')}
                    size="small"
                    fullWidth
                    type="text"
                    disabled={!formData.currency || disabledAll}
                    sx={fieldSx}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: formData.currency === 'VND' ? '[0-9]*' : '[0-9.]*',
                    }}
                    helperText={!formData.currency ? 'Please select a currency first' : ' '}
                  />

                  <Box sx={{ display: { xs: 'none', md: 'block' } }} />
                </Box>
              </Box>

              {/* Card 3: Descriptions */}
              <Box sx={{ ...subtleCardSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Descriptions</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                  Keep short EN and detailed VN if needed
                </Typography>
                <Divider sx={{ my: 1.6 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.8 }}>
                  <TextField
                    label="Item Description (EN)"
                    value={formData.itemDescriptionEN}
                    onChange={handleChange('itemDescriptionEN')}
                    size="small"
                    fullWidth
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="Short english description"
                  />

                  <TextField
                    label="Full Description (VN)"
                    value={formData.itemDescriptionVN}
                    onChange={handleChange('itemDescriptionVN')}
                    size="small"
                    fullWidth
                    multiline
                    minRows={4}
                    disabled={disabledAll}
                    sx={fieldSx}
                    placeholder="Mô tả chi tiết tiếng Việt..."
                  />
                </Box>
              </Box>

              {/* Card 4: Images */}
              <Box sx={{ ...subtleCardSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Images</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                  Max 10 images. Leave empty to keep current.
                </Typography>
                <Divider sx={{ my: 1.6 }} />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    disabled={disabledAll}
                    sx={outlineBtnSx}
                  >
                    Choose Images
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      disabled={disabledAll}
                    />
                  </Button>

                  {(files.length > 0 || keptImageUrls.length > 0) ? (
                    <Chip
                      size="small"
                      label={`${files.length + keptImageUrls.length} image(s)`}
                      sx={{
                        fontWeight: 800,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      }}
                    />
                  ) : null}
                </Stack>

                {previews.length > 0 ? (
                  <Box
                    sx={{
                      mt: 2,
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                      gap: 1.5,
                    }}
                  >
                    {previews.map((preview, index) => {
                      const isCurrent = index < keptImageUrls.length;
                      const label = isCurrent ? 'Current' : (files[index - keptImageUrls.length]?.name || 'New');

                      return (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            boxShadow: `0 10px 22px ${alpha('#000', 0.08)}`,
                            bgcolor: alpha(theme.palette.common.white, 0.55),
                          }}
                        >
                          <Box
                            component="img"
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            onError={(e) => {
                              e.target.src = '/images/fallback.jpg';
                              e.target.alt = 'Failed to load';
                            }}
                            sx={{
                              width: '100%',
                              height: 140,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />

                          <Chip
                            size="small"
                            label={isCurrent ? 'Current' : 'New'}
                            sx={{
                              position: 'absolute',
                              left: 10,
                              top: 10,
                              color: 'common.white',
                              bgcolor: alpha('#000', 0.35),
                              border: `1px solid ${alpha('#fff', 0.18)}`,
                              fontWeight: 800,
                              backdropFilter: 'blur(10px)',
                            }}
                          />

                          <Tooltip title="Remove">
                            <span>
                              <IconButton
                                onClick={() => handleRemoveFile(index)}
                                disabled={disabledAll}
                                sx={{
                                  position: 'absolute',
                                  right: 8,
                                  top: 8,
                                  color: 'common.white',
                                  bgcolor: alpha('#000', 0.35),
                                  border: `1px solid ${alpha('#fff', 0.18)}`,
                                  '&:hover': { bgcolor: alpha('#000', 0.5) },
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Box sx={{ p: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: 'text.secondary',
                                fontWeight: 700,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={label}
                            >
                              {label}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : null}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 2, gap: 1 }}>
          <Button onClick={handleDialogClose} disabled={locked || loadingProduct} variant="outlined" sx={outlineBtnSx}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveClick}
            disabled={disabledAll}
            sx={gradientBtnSx}
          >
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

      {/* Confirm dialog (same vibe) */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCancelSave}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
            background: alpha('#FFFFFF', 0.92),
            backdropFilter: 'blur(14px)',
            boxShadow: `0 22px 70px ${alpha('#000', 0.18)}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm Update</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 13.5 }}>
            Are you sure you want to save changes to this product?
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 1.4,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            }}
          >
            <Stack spacing={0.6}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Supplier: <b>{formData.supplierName?.trim() || '—'}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • SAP Code: <b>{formData.sapCode?.trim() || '—'}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Currency: <b>{formData.currency || '—'}</b> • Price: <b>{formattedPrice || '—'}</b>
              </Typography>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCancelSave} disabled={saving} variant="outlined" sx={outlineBtnSx}>
            No
          </Button>
          <Button onClick={handleConfirmSave} disabled={saving} variant="contained" sx={{ ...gradientBtnSx, px: 2.4 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

EditProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
  onRefresh: PropTypes.func,
};
