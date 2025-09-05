import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  IconButton,
  FormHelperText,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL } from '../../config';
import SupplierSelector from './SupplierSelector';
import { debounce } from 'lodash';

export default function AddDialog({ open, onClose, onRefresh, groupId }) {
  const defaultFormData = {
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullItemDescriptionVN: '',
    oldSapCode: '',
    newSapCode: '',
    stock: '',
    purchasingSuggest: '',
    reason: '',
    remark: '',
    supplierId: '',
    groupId: groupId || '',
    productType1Id: '',
    productType2Id: '',
    unit: '',
    supplierPrice: 0,
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [deptRows, setDeptRows] = useState([{ department: '', qty: '' }]);
  const [saving, setSaving] = useState(false);
  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);
  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
      setFormData((prev) => ({
        ...defaultFormData,
        groupId: groupId || '',
      }));
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
    }
  }, [open, groupId]);

  const translateText = async (text) => {
    if (!text) {
      setFormData((prev) => ({ ...prev, itemDescriptionEN: '' }));
      return;
    }

    setTranslating(true);
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: 'vi',
            target: 'en',
            format: 'text',
          }),
        }
      );

      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      setFormData((prev) => ({ ...prev, itemDescriptionEN: translatedText }));
    } catch (error) {
      console.error('Translation error:', error);
      setFormData((prev) => ({ ...prev, itemDescriptionEN: '' }));
      alert('Failed to translate text. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const debouncedTranslate = useCallback(
    debounce((text) => translateText(text), 500),
    []
  );

  useEffect(() => {
    debouncedTranslate(formData.itemDescriptionVN);
    return () => debouncedTranslate.cancel();
  }, [formData.itemDescriptionVN, debouncedTranslate]);

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

  const fetchDepartmentList = async () => {
    setLoadingDepartments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to load department list');
      const data = await res.json();
      setDepartmentList(data || []);
    } catch (error) {
      console.error('Error fetching department list:', error);
      setDepartmentList([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleSelectSupplier = (supplierData) => {
    if (supplierData) {
      setFormData((prev) => ({
        ...prev,
        fullItemDescriptionVN: supplierData.fullItemDescriptionVN,
        oldSapCode: supplierData.oldSapCode,
        supplierId: supplierData.supplierId,
        unit: supplierData.unit || '',
        supplierPrice: parseFloat(supplierData.supplierPrice) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fullItemDescriptionVN: '',
        oldSapCode: '',
        supplierId: '',
        unit: '',
        supplierPrice: 0,
      }));
    }
  };

  const handleChange = (field) => (e) => {
    const value = ['stock', 'purchasingSuggest'].includes(field)
      ? parseFloat(e.target.value) || ''
      : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeptChange = (index, field, value) => {
    const updated = [...deptRows];
    updated[index][field] = value;
    setDeptRows(updated);
  };

  const handleAddDeptRow = () => {
    setDeptRows([...deptRows, { department: '', qty: '' }]);
  };

  const handleDeleteDeptRow = (index) => {
    const updated = deptRows.filter((_, i) => i !== index);
    setDeptRows(updated.length > 0 ? updated : [{ department: '', qty: '' }]);
  };

  const calcTotalRequestQty = () => {
    return deptRows.reduce((sum, row) => {
      const q = parseFloat(row.qty);
      return sum + (isNaN(q) ? 0 : q);
    }, 0);
  };

  const calcTotalPrice = () => {
    return calcTotalRequestQty() * (formData.supplierPrice || 0);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newFiles = [...files, ...selectedFiles];
    if (newFiles.length > 10) {
      alert('You can upload a maximum of 10 images.');
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

  const handleAdd = async () => {
    if (!groupId) {
      alert('Group ID is missing.');
      return;
    }
    if (!formData.itemDescriptionVN) {
      alert('Item Description (VN) is required.');
      return;
    }
    if (deptRows.every((row) => !row.department || !row.qty)) {
      alert('At least one department and quantity must be provided.');
      return;
    }

    const deptQtyMap = {};
    deptRows.forEach((row) => {
      if (row.department && row.qty) {
        deptQtyMap[row.department] = parseFloat(row.qty);
      }
    });

    const totalRequestQty = Object.values(deptQtyMap).reduce((sum, val) => sum + val, 0);

    const formDataToSend = {
      englishName: formData.itemDescriptionEN || '',
      vietnameseName: formData.itemDescriptionVN || '',
      fullDescription: formData.fullItemDescriptionVN || '',
      oldSapCode: formData.oldSapCode || '',
      newSapCode: formData.newSapCode || '',
      departmentRequestQty: JSON.stringify(deptQtyMap),
      stock: parseFloat(formData.stock) || 0,
      purchasingSuggest: parseFloat(formData.purchasingSuggest) || 0,
      reason: formData.reason || '',
      remark: formData.remark || '',
      supplierId: formData.supplierId || '',
      groupId: formData.groupId || '',
      productType1Id: formData.productType1Id || undefined,
      productType2Id: formData.productType2Id || undefined,
      totalRequestQty,
      totalPrice: parseFloat(formData.totalPrice) || totalRequestQty,
    };

    const multipartForm = new FormData();
    Object.entries(formDataToSend).forEach(([key, value]) => {
      if (value !== undefined) {
        multipartForm.append(key, value);
      }
    });
    files.forEach((file) => {
      multipartForm.append('files', file);
    });

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/create`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
        },
        body: multipartForm,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Add failed with status ${res.status}`);
      }

      const data = await res.json();
      setSnackbarMessage('Request added successfully!');
      setSnackbarOpen(true);

      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
      onClose();

      setFormData(defaultFormData);
      setDeptRows([{ department: '', qty: '' }]);
      setProductType1List([]);
      setProductType2List([]);
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      console.error('Add error:', err);
      alert(`Add failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: (theme) => theme.palette.primary.main,
          color: (theme) => theme.palette.primary.contrastText,
          fontWeight: 'bold',
          fontSize: '1.25rem',
          textTransform: 'capitalize',
          letterSpacing: 1,
        }}
      >
        Add request
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

          <Stack direction="row" spacing={2}>
            <TextField
              label="Old SAP Code"
              value={formData.oldSapCode}
              onChange={handleChange('oldSapCode')}
              size="small"
              fullWidth
              sx={{ flex: 1 }}
              InputLabelProps={{
                style: { color: 'inherit' },
              }}
            />
            <TextField
              label="New SAP Code"
              value={formData.newSapCode}
              onChange={handleChange('newSapCode')}
              size="small"
              fullWidth
              sx={{ flex: 1 }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Item Description (VN)"
              value={formData.itemDescriptionVN}
              onChange={handleChange('itemDescriptionVN')}
              fullWidth
              size="small"
              InputLabelProps={{
                style: { color: 'inherit' },
              }}
            />
            <TextField
              label="Item Description (EN)"
              value={formData.itemDescriptionEN}
              onChange={handleChange('itemDescriptionEN')}
              fullWidth
              size="small"
              InputLabelProps={{
                style: { color: 'inherit' },
              }}
              disabled={translating}
              InputProps={{
                endAdornment: translating ? (
                  <CircularProgress size={16} />
                ) : null,
              }}
            />
          </Stack>

          <TextField
            label="Full Item Description (VN)"
            value={formData.fullItemDescriptionVN}
            onChange={handleChange('fullItemDescriptionVN')}
            fullWidth
            size="small"
            multiline
            rows={2}
          />

          <SupplierSelector
            itemDescriptionVN={formData.itemDescriptionVN}
            itemDescriptionEN={formData.itemDescriptionEN}
            oldSapCode={formData.oldSapCode}
            onSelectSupplier={handleSelectSupplier}
          />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Department Request Qty:
            </Typography>
            {deptRows.map((row, index) => (
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                key={index}
                sx={{ mb: 1 }}
              >
                <FormControl fullWidth size="small" disabled={loadingDepartments}>
                  <InputLabel id={`department-label-${index}`}>Department</InputLabel>
                  <Select
                    labelId={`department-label-${index}`}
                    value={row.department}
                    label="Department"
                    onChange={(e) => handleDeptChange(index, 'department', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {departmentList.length > 0 ? (
                      departmentList.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No departments available</MenuItem>
                    )}
                  </Select>
                  {loadingDepartments && <FormHelperText>Loading departments...</FormHelperText>}
                </FormControl>
                <TextField
                  label="Qty"
                  type="number"
                  value={row.qty}
                  onChange={(e) => handleDeptChange(index, 'qty', e.target.value)}
                  size="small"
                  fullWidth
                />
                <IconButton
                  aria-label="delete department"
                  onClick={() => handleDeleteDeptRow(index)}
                  size="small"
                  color="error"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddDeptRow}
              sx={{ mt: 1 }}
            >
              Add Department
            </Button>

            <Stack
              direction="row"
              spacing={4}
              sx={{
                mt: 2,
                bgcolor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                boxShadow: 1,
                justifyContent: 'space-between',
                textTransform: 'capitalize',
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Total Request Qty: <span style={{ color: '#1976d2' }}>{calcTotalRequestQty()}</span>
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Unit: <span style={{ color: '#1976d2' }}>{formData.unit || '-'}</span>
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Price: <span style={{ color: '#1976d2' }}>{(formData.supplierPrice || 0).toLocaleString('vi-VN')} ₫</span>
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Total Price: <span style={{ color: '#1976d2' }}>{calcTotalPrice().toLocaleString('vi-VN')} ₫</span>
              </Typography>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Stock"
              value={formData.stock}
              onChange={handleChange('stock')}
              size="small"
              fullWidth
              type="number"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Purchasing Suggest"
              value={formData.purchasingSuggest}
              onChange={handleChange('purchasingSuggest')}
              size="small"
              fullWidth
              type="number"
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            label="Reason"
            value={formData.reason}
            onChange={handleChange('reason')}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
          <TextField
            label="Remark"
            value={formData.remark}
            onChange={handleChange('remark')}
            fullWidth
            size="small"
            multiline
            rows={2}
          />

          <Box>
            <InputLabel sx={{ mb: 1 }}>Images (Max 10)</InputLabel>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
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
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClose={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAdd} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Add'}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}