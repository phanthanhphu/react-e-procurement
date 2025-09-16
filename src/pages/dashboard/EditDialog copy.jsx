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
  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);

  useEffect(() => {
    console.log('EditDialog opened with item:', item);
    if (open && item && item.requisition && item.requisition.id) {
      if (!formData.itemDescriptionEN && !formData.itemDescriptionVN) { // Chỉ fetch nếu form rỗng
        fetchData();
      }
      // Hiển thị nhà cung cấp hiện tại nếu có, không show selector trừ khi oldSapCode bị xóa
      if (item.requisition.supplierId) {
        setShowSupplierSelector(false);
      } else {
        setShowSupplierSelector(true);
      }
    } else {
      resetForm();
      setShowSupplierSelector(true); // Show selector khi không có item
    }
    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
    }
  }, [open, item, formData.itemDescriptionEN, formData.itemDescriptionVN]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
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
      setDeptRows(
        requisition.departmentRequestQty && typeof requisition.departmentRequestQty === 'object'
          ? Object.entries(requisition.departmentRequestQty).map(([dept, qty]) => ({
              department: dept,
              qty: qty.toString(),
            }))
          : [{ department: '', qty: '' }]
      );
      setImageUrls(requisition.imageUrls || []);
      setImagesToDelete([]);
      setFiles([]);
      setPreviews([]);
      setSelectedSupplier(supplierProduct.id ? { id: supplierProduct.id, ...supplierProduct } : null);
      // Hiển thị supplier hiện tại nếu có
      if (supplierProduct.id) {
        setShowSupplierSelector(false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setSnackbarMessage(`Failed: ${err.message}`);
      setSnackbarOpen(true);
    }
  };

  const resetForm = () => {
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
    setImagesToDelete([]);
    setFiles([]);
    setPreviews([]);
    setSelectedSupplier(null);
    setShowSupplierSelector(true);
  };

  useEffect(() => {
    // Cleanup previews when dialog closes
    return () => {
      if (!open) {
        previews.forEach((preview) => preview && URL.revokeObjectURL(preview));
        setFiles([]);
        setPreviews([]);
        console.log('Cleanup: Cleared files and previews');
      }
    };
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
      // Không set formData.productType2Id để tránh vòng lặp
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
      setSelectedSupplier({
        id: supplierData.supplierId,
        sapCode: supplierData.oldSapCode || '',
        itemNo: supplierData.itemDescriptionEN || '',
        itemDescription: supplierData.itemDescriptionVN || '',
        supplierCode: supplierData.supplierCode || '',
        supplierName: supplierData.supplierName || '',
        price: supplierData.supplierPrice || 0,
        unit: supplierData.unit || '',
        fullDescription: supplierData.fullItemDescriptionVN || '',
      });
      setShowSupplierSelector(false); // Ẩn selector sau khi chọn
    } else {
      setFormData((prev) => ({
        ...prev,
        fullItemDescriptionVN: '',
        oldSapCode: '',
        supplierId: '',
        unit: '',
        supplierPrice: 0,
      }));
      setSelectedSupplier(null);
      setShowSupplierSelector(true); // Hiển thị selector khi xóa
    }
  };

  const handleChange = (field) => (e) => {
    const value = ['stock', 'purchasingSuggest'].includes(field)
      ? parseFloat(e.target.value) || ''
      : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'oldSapCode') {
      if (!value) {
        setSelectedSupplier(null); // Clear supplier khi xóa oldSapCode
        setShowSupplierSelector(true); // Hiển thị selector khi xóa
      } else if (value !== formData.oldSapCode) {
        setShowSupplierSelector(true); // Hiển thị selector khi nhập mới
      }
    }
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

  const handleRemoveImage = (index) => {
    console.log('Removing image at index:', index);
    if (index < imageUrls.length) {
      const newImageUrls = [...imageUrls];
      const removedUrl = newImageUrls.splice(index, 1)[0];
      setImageUrls(newImageUrls);
      setImagesToDelete([...imagesToDelete, removedUrl]);
      console.log('Updated imageUrls:', newImageUrls);
      console.log('Updated imagesToDelete:', [...imagesToDelete, removedUrl]);
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

    const formDataToSend = new FormData();
    files.forEach(file => formDataToSend.append('imageUrls', file));
    imagesToDelete.forEach(url => formDataToSend.append('imagesToDelete', url));
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
    }).forEach(([key, value]) => {
      if (value !== undefined) {
        formDataToSend.append(key, value);
      }
    });

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
      if (data.requisition && data.requisition.imageUrls) {
        setImageUrls(data.requisition.imageUrls);
        console.log('Updated imageUrls from response:', data.requisition.imageUrls);
      }
      previews.forEach(preview => preview && URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
      setImagesToDelete([]);
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

          {showSupplierSelector ? (
            <SupplierSelector
              oldSapCode={formData.oldSapCode}
              onSelectSupplier={handleSelectSupplier}
              selectedSupplier={selectedSupplier}
            />
          ) : (
            selectedSupplier && (
              <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 4 }}>
                <Typography>Supplier: {selectedSupplier.supplierName}</Typography>
                <Typography>SAP Code: {selectedSupplier.sapCode}</Typography>
                <Typography>Price: {(selectedSupplier.price || 0).toLocaleString('vi-VN')} ₫</Typography>
                <Button variant="outlined" onClick={() => setShowSupplierSelector(true)} sx={{ mt: 1 }}>
                  Change Supplier
                </Button>
              </Box>
            )
          )}

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
                      alt={`Image ${index + 1}`}
                      style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                      onError={(e) => {
                        console.error(`Image load failed for ${url}`, e);
                        e.target.style.display = 'none';
                      }}
                    />
                    <IconButton
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10 }}
                      onClick={() => handleRemoveImage(index)}
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
                      onClick={() => handleRemoveImage(index + imageUrls.length)}
                    >
                      <CloseIcon color="error" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            {files.length === 0 && imageUrls.length === 0 && (
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                No images selected
              </Typography>
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