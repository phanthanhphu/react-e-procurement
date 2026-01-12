import React, { useEffect, useMemo, useState } from 'react';
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

export default function AddProductDialog({ open, onClose, onRefresh, onSuccess, disabled }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    productType1Id: '',
    productType2Id: '',
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

  const [saving, setSaving] = useState(false);

  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);
  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const locked = saving || !!disabled;
  const disabledAll = saving || !!disabled;

  const handleCloseNotification = () => setNotification((prev) => ({ ...prev, open: false }));

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

  // ====== LIFECYCLE ======
  useEffect(() => {
    if (open) {
      fetchProductType1List();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (formData.productType1Id) fetchProductType2List(formData.productType1Id);
    else {
      setProductType2List([]);
      setFormData((prev) => ({ ...prev, productType2Id: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.productType1Id]);

  // cleanup object urls on unmount/close
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
  }, [previews]);

  // ====== API ======
  const fetchProductType1List = async () => {
    setLoadingType1(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-1`);
      if (!res.ok) throw new Error(`Failed to load product type 1 list: status ${res.status}`);
      const data = await res.json();
      setProductType1List(data.content || data);
    } catch (error) {
      setNotification({ open: true, message: `Failed to load product type 1 list: ${error.message}`, severity: 'error' });
      setProductType1List([]);
    } finally {
      setLoadingType1(false);
    }
  };

  const fetchProductType2List = async (type1Id) => {
    setLoadingType2(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-2?productType1Id=${type1Id}&page=0&size=50`);
      if (!res.ok) throw new Error(`Failed to load product type 2 list: status ${res.status}`);
      const data = await res.json();
      setProductType2List(data.content || data);
    } catch (error) {
      setNotification({ open: true, message: `Failed to load product type 2 list: ${error.message}`, severity: 'error' });
      setProductType2List([]);
    } finally {
      setLoadingType2(false);
    }
  };

  // ====== HANDLERS ======
  const handleDialogClose = () => {
    if (saving) return;
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
    if (newFiles.length > 10) {
      setNotification({ open: true, message: 'You can upload a maximum of 10 images', severity: 'warning' });
      return;
    }

    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles(newFiles);

    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviewUrls);

    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.supplierName?.trim() || !formData.sapCode?.trim() || !formData.hanaSapCode?.trim()) {
      setNotification({ open: true, message: 'Supplier Name, SAP Code, and Hana SAP Code are required', severity: 'error' });
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
      setNotification({ open: true, message: 'Good Type must be Common or Special', severity: 'error' });
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

  const handleCancelSave = () => setOpenConfirmDialog(false);

  const handleConfirmSave = async () => {
    setOpenConfirmDialog(false);
    await handleSave();
  };

  const handleSave = async () => {
    const multipartForm = new FormData();

    if (formData.productType1Id) multipartForm.append('productType1Id', formData.productType1Id);
    if (formData.productType2Id) multipartForm.append('productType2Id', formData.productType2Id);

    multipartForm.append('supplierName', formData.supplierName);
    multipartForm.append('sapCode', formData.sapCode);
    multipartForm.append('hanaSapCode', formData.hanaSapCode);
    multipartForm.append('itemDescriptionEN', formData.itemDescriptionEN || '');
    multipartForm.append('itemDescriptionVN', formData.itemDescriptionVN || '');
    multipartForm.append('size', formData.size || '');
    multipartForm.append('unit', formData.unit || '');
    multipartForm.append('price', formData.price || '0');
    multipartForm.append('currency', formData.currency);
    multipartForm.append('goodType', formData.goodType);

    files.forEach((file) => multipartForm.append('files', file));

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
          } catch {
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
      } catch {
        message = text || message;
      }

      setNotification({ open: true, message, severity: 'success' });

      if (typeof onSuccess === 'function') onSuccess(message);
      if (typeof onRefresh === 'function') await onRefresh();

      onClose?.();
      resetForm();
    } catch (err) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productType1Id: '',
      productType2Id: '',
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

    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles([]);
    setPreviews([]);
    setFormattedPrice('');
    setOpenConfirmDialog(false);
    setNotification({ open: false, message: '', severity: 'info' });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={saving ? undefined : handleDialogClose}
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
                Add Product
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 13 }}>
                Create new product with pricing and images
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label="Creating"
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
                    disabled={saving}
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
          <Stack spacing={2}>
            {/* Card 1: Classification */}
            <Box sx={{ ...subtleCardSx, p: 2 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Classification</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                Choose types for clean filtering and reporting
              </Typography>
              <Divider sx={{ my: 1.6 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.8 }}>
                <FormControl fullWidth size="small" disabled={loadingType1 || disabledAll} sx={fieldSx}>
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
                  {loadingType1 ? <FormHelperText>Loading types...</FormHelperText> : null}
                </FormControl>

                <FormControl
                  fullWidth
                  size="small"
                  disabled={!formData.productType1Id || loadingType2 || disabledAll}
                  sx={fieldSx}
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
                  {loadingType2 ? <FormHelperText>Loading subtypes...</FormHelperText> : null}
                </FormControl>

                {/* ✅ Currency FIRST (closer to Price) */}
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
                    <RadioGroup row name="currency" value={formData.currency} onChange={handleChange('currency')}>
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

                <FormControl fullWidth size="small" disabled={disabledAll} sx={fieldSx}>
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
                    <b>Tip:</b> Select Currency first, then enter Price for correct formatting.
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Card 2: Core info */}
            <Box sx={{ ...subtleCardSx, p: 2 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Core Information</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                Required fields for creating product
              </Typography>
              <Divider sx={{ my: 1.6 }} />

              {/* ✅ Re-ordered grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.8 }}>
                <TextField
                  label="Supplier Description"
                  value={formData.supplierName}
                  onChange={handleChange('supplierName')}
                  size="small"
                  fullWidth
                  required
                  disabled={disabledAll}
                  sx={fieldSx}
                />

                <TextField
                  label="Unit"
                  value={formData.unit}
                  onChange={handleChange('unit')}
                  size="small"
                  fullWidth
                  disabled={disabledAll}
                  sx={fieldSx}
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
                />

                <TextField
                  label="Hana SAP Code"
                  value={formData.hanaSapCode}
                  onChange={handleChange('hanaSapCode')}
                  size="small"
                  fullWidth
                  required
                  disabled={disabledAll}
                  sx={fieldSx}
                />

                <TextField
                  label="Size"
                  value={formData.size}
                  onChange={handleChange('size')}
                  size="small"
                  fullWidth
                  disabled={disabledAll}
                  sx={fieldSx}
                />

                <TextField
                  label={`Price ${formData.currency ? `(${formData.currency})` : ''}`}
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
              </Box>
            </Box>

            {/* Card 3: Descriptions */}
            <Box sx={{ ...subtleCardSx, p: 2 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Descriptions</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                Optional fields for searching & display
              </Typography>
              <Divider sx={{ my: 1.6 }} />

              {/* ✅ Balanced multiline */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.8 }}>
                <TextField
                  label="Item Description (EN)"
                  value={formData.itemDescriptionEN}
                  onChange={handleChange('itemDescriptionEN')}
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  disabled={disabledAll}
                  sx={fieldSx}
                />
                <TextField
                  label="Item Description (VN)"
                  value={formData.itemDescriptionVN}
                  onChange={handleChange('itemDescriptionVN')}
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  disabled={disabledAll}
                  sx={fieldSx}
                />
              </Box>
            </Box>

            {/* Card 4: Images */}
            <Box sx={{ ...subtleCardSx, p: 2 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Images</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                Max 10 images
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
                  <input hidden type="file" accept="image/*" multiple onChange={handleFileChange} />
                </Button>

                {files.length > 0 ? (
                  <Chip
                    size="small"
                    label={`${files.length} image(s)`}
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
                  {previews.map((preview, index) => (
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
                        sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                      />

                      <Chip
                        size="small"
                        label="New"
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
                          title={files[index]?.name || ''}
                        >
                          {files[index]?.name || 'Image'}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 2, gap: 1 }}>
          <Button onClick={handleDialogClose} disabled={saving} variant="outlined" sx={outlineBtnSx}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSaveClick} disabled={disabledAll} sx={gradientBtnSx}>
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

      {/* Confirm dialog */}
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
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm Add</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 13.5 }}>
            Are you sure you want to add this product?
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
                • Hana SAP: <b>{formData.hanaSapCode?.trim() || '—'}</b>
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
