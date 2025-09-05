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
import { debounce } from 'lodash';

export default function EditDialog({ open, item, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
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
    groupId: '',
    productType1Id: '',
    productType2Id: '',
    unit: '',
    supplierPrice: 0,
  });
  const [deptRows, setDeptRows] = useState([{ department: '', qty: '' }]);
  const [saving, setSaving] = useState(false);
  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);
  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    console.log('EditDialog opened with item:', item);
    if (open && item && item.requisition && item.requisition.id) {
      fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch requisition data: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log('API response:', data);
          const requisition = data.requisition || data;
          const supplierProduct = data.supplierProduct || {};

          setFormData({
            itemDescriptionEN: requisition.englishName || '',
            itemDescriptionVN: requisition.vietnameseName || '',
            fullItemDescriptionVN: requisition.fullDescription || '',
            oldSapCode: requisition.oldSapCode || '',
            newSapCode: requisition.newSapCode || '',
            stock: requisition.stock || '',
            purchasingSuggest: requisition.purchasingSuggest || '',
            reason: requisition.reason || '',
            remark: requisition.remark || '',
            supplierId: supplierProduct.id || '',
            groupId: requisition.groupId || '',
            productType1Id: requisition.productType1Id || '',
            productType2Id: requisition.productType2Id || '',
            unit: supplierProduct.unit || '',
            supplierPrice: supplierProduct.price || 0,
          });

          if (requisition.departmentRequestQty && typeof requisition.departmentRequestQty === 'object') {
            const rows = Object.entries(requisition.departmentRequestQty).map(([department, qty]) => ({
              department,
              qty: qty.toString(),
            }));
            setDeptRows(rows.length ? rows : [{ department: '', qty: '' }]);
          } else {
            setDeptRows([{ department: '', qty: '' }]);
          }

          setImageUrls(requisition.imageUrls || []);
          console.log('Initial imageUrls:', requisition.imageUrls || []);
        })
        .catch((err) => {
          console.error('Error fetching requisition data:', err);
          setSnackbarMessage(`Failed to load requisition data: ${err.message}`);
          setSnackbarOpen(true);
        });
    } else {
      console.warn('No valid item or item.requisition.id, resetting form. Item:', item);
      setFormData({
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
        groupId: '',
        productType1Id: '',
        productType2Id: '',
        unit: '',
        supplierPrice: 0,
      });
      setDeptRows([{ department: '', qty: '' }]);
      setImageUrls([]);
    }

    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
    }
  }, [item, open]);

  useEffect(() => {
    // Cleanup only when dialog closes
    return () => {
      if (!open) {
        previews.forEach((preview) => preview && URL.revokeObjectURL(preview));
        setFiles([]);
        setPreviews([]);
        console.log('Cleanup: Cleared files and previews');
      }
    };
  }, [open, previews]);

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

  const debouncedSearchSupplier = useCallback(
    debounce((query) => {
      if (query) {
        fetch(`${API_BASE_URL}/api/supplier-products/search?productFullName=${encodeURIComponent(query)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              const selected = data.find((s) => s.id === formData.supplierId) || data[0];
              setFormData((prev) => ({
                ...prev,
                supplierId: selected.id,
                supplierPrice: selected.price || 0,
                unit: selected.unit || '',
              }));
            }
          })
          .catch(() => {
            setFormData((prev) => ({ ...prev, supplierId: '', supplierPrice: 0, unit: '' }));
          });
      }
    }, 500),
    [formData.supplierId]
  );

  useEffect(() => {
    debouncedSearchSupplier(formData.itemDescriptionVN.trim() || formData.itemDescriptionEN.trim());
    return () => debouncedSearchSupplier.cancel();
  }, [formData.itemDescriptionVN, formData.itemDescriptionEN, debouncedSearchSupplier]);

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
      const q = parseFloat(row.qty) || 0;
      return sum + q;
    }, 0);
  };

  const calcTotalPrice = () => {
    return calcTotalRequestQty() * (formData.supplierPrice || 0);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log('Selected files:', selectedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      isFile: file instanceof File,
    })));
    if (selectedFiles.length === 0) {
      console.warn('No files selected');
      return;
    }

    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // Max 5MB
    );
    if (validFiles.length !== selectedFiles.length) {
      setSnackbarMessage('Only image files under 5MB are allowed.');
      setSnackbarOpen(true);
      return;
    }

    const newFiles = [...files, ...validFiles];
    if (newFiles.length + imageUrls.length > 10) {
      setSnackbarMessage('You can upload a maximum of 10 images total.');
      setSnackbarOpen(true);
      return;
    }

    previews.forEach((preview) => preview && URL.revokeObjectURL(preview));
    setFiles(newFiles);
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviewUrls);
    console.log('Updated files state:', newFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
    })));
    e.target.value = null; // Reset input
  };

  const handleRemoveFile = (index) => {
    console.log('Removing file at index:', index);
    if (index < imageUrls.length) {
      const newImageUrls = [...imageUrls];
      newImageUrls.splice(index, 1);
      setImageUrls(newImageUrls);
      console.log('Updated imageUrls:', newImageUrls);
    } else {
      const adjustedIndex = index - imageUrls.length;
      if (adjustedIndex >= 0 && adjustedIndex < previews.length) {
        URL.revokeObjectURL(previews[adjustedIndex]);
        const newFiles = files.filter((_, i) => i !== adjustedIndex);
        const newPreviews = previews.filter((_, i) => i !== adjustedIndex);
        setFiles(newFiles);
        setPreviews(newPreviews);
        console.log('Updated files:', newFiles.map(file => file.name));
      }
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];
    const uploadFormData = new FormData();
    files.forEach(file => uploadFormData.append('files', file));
    console.log('Uploading files:', files.map(file => file.name));
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`File upload failed: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      console.log('Upload response:', data);
      return data.imageUrls || []; // Giả sử backend trả về danh sách URL
    } catch (err) {
      console.error('File upload error:', err);
      setSnackbarMessage(`Failed to upload images: ${err.message}`);
      setSnackbarOpen(true);
      return [];
    }
  };

  const handleSave = async () => {
    if (!item || !item.requisition || !item.requisition.id) {
      setSnackbarMessage('Cannot save: Item or requisition ID is missing.');
      setSnackbarOpen(true);
      return;
    }

    const deptQtyMap = {};
    deptRows.forEach((row) => {
      if (row.department && row.qty) {
        deptQtyMap[row.department] = parseFloat(row.qty) || 0;
      }
    });

    // Upload new files and get URLs
    let updatedImageUrls = [...imageUrls];
    if (files.length > 0) {
      const newUrls = await uploadFiles();
      updatedImageUrls = [...imageUrls, ...newUrls];
      console.log('Updated imageUrls with new URLs:', updatedImageUrls);
    }

    const formDataToSend = new FormData();
    Object.entries({
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
      totalRequestQty: calcTotalRequestQty(),
      totalPrice: calcTotalPrice(),
      imageUrls: JSON.stringify(updatedImageUrls), // Gửi danh sách imageUrls đầy đủ
    }).forEach(([key, value]) => {
      if (value !== undefined) {
        formDataToSend.append(key, value);
      }
    });

    // Log FormData contents for debugging
    for (let [key, value] of formDataToSend.entries()) {
      console.log(`FormData entry: ${key}=${value instanceof File ? value.name : value}`);
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Update failed: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('Save successful, response:', data);
      setSnackbarMessage('Request updated successfully!');
      setSnackbarOpen(true);
      // Update imageUrls with response from backend if provided
      if (data.requisition && data.requisition.imageUrls) {
        setImageUrls(data.requisition.imageUrls);
        console.log('Updated imageUrls from response:', data.requisition.imageUrls);
      }
      // Clear files and previews after successful save
      previews.forEach(preview => preview && URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
      await onRefresh();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      setSnackbarMessage(`Failed to update item: ${err.message}`);
      setSnackbarOpen(true);
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
        Edit request
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
            />
            <TextField
              label="Item Description (EN)"
              value={formData.itemDescriptionEN}
              onChange={handleChange('itemDescriptionEN')}
              fullWidth
              size="small"
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
                  onChange={(e) => {
                    console.log('File input changed', e.target.files);
                    handleFileChange(e);
                  }}
                />
              </Button>
              {(files.length + imageUrls.length) > 0 && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {files.length + imageUrls.length} image(s) selected
                </Typography>
              )}
            </Stack>
            {(previews.length > 0 || imageUrls.length > 0) && (
              <Box mt={2} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {imageUrls.map((url, index) => (
                  <Box key={`existing-${index}`} sx={{ position: 'relative' }}>
                    <img
                      src={`${API_BASE_URL}${url}`}
                      alt={`Existing ${index + 1}`}
                      style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                      onError={(e) => {
                        console.error(`Image load failed for ${url}`, e);
                        e.target.style.display = 'none';
                      }}
                    />
                    <IconButton
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10 }}
                      onClick={() => handleRemoveFile(index)}
                    >
                      <CloseIcon color="error" />
                    </IconButton>
                  </Box>
                ))}
                {previews.map((preview, index) => (
                  <Box key={`new-${index}`} sx={{ position: 'relative' }}>
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                    />
                    <IconButton
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10 }}
                      onClick={() => handleRemoveFile(index + imageUrls.length)}
                    >
                      <CloseIcon color="error" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarMessage.includes('Failed') ? 'error' : 'success'} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}