import { useState, useEffect, useCallback } from 'react';
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

// Utility function to normalize currency codes
const normalizeCurrencyCode = (code) => {
  const validCurrencies = ['VND', 'USD', 'EUR', 'JPY', 'GBP']; // Add more as needed
  const currencyMap = {
    EURO: 'EUR', // Normalize incorrect codes
  };

  if (!code) return 'VND'; // Default to VND if code is empty
  const normalizedCode = currencyMap[code.toUpperCase()] || code.toUpperCase();
  return validCurrencies.includes(normalizedCode) ? normalizedCode : 'VND';
};

export default function AddRequisitionMonthly({ open, onClose, onRefresh, groupId }) {
  const defaultFormData = {
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullDescription: '',
    oldSAPCode: '',
    hanaSAPCode: '',
    dailyMedInventory: '',
    safeStock: '',
    reason: '',
    remark: '',
    remarkComparison: '',
    supplierId: '',
    groupId: groupId || '',
    productType1Id: '',
    productType2Id: '',
    unit: '',
    supplierPrice: 0,
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [deptRows, setDeptRows] = useState([{ id: '', name: '', qty: '', buy: '' }]);
  const [deptErrors, setDeptErrors] = useState(['']);
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
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(true);
  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);
  const [initialVNDescription, setInitialVNDescription] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('VND'); // Default to 'VND'
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [currencyError, setCurrencyError] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // New state for confirmation dialog

  // Fetch currency from API
  const fetchGroupCurrency = useCallback(async () => {
    if (!groupId) {
      setCurrencyError('Invalid Group ID');
      setGroupCurrency('VND'); // Fallback to default
      return;
    }
    setLoadingCurrency(true);
    setCurrencyError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`, {
        method: 'GET',
        headers: { Accept: '*/*' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const validatedCurrency = normalizeCurrencyCode(result.currency); // Normalize currency
      setGroupCurrency(validatedCurrency); // Use validated currency
    } catch (err) {
      console.error('Fetch group currency error:', err);
      setCurrencyError('Failed to fetch group currency. Using default (VND).');
      setGroupCurrency('VND'); // Fallback to default
    } finally {
      setLoadingCurrency(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
      fetchGroupCurrency(); // Fetch currency when dialog opens
      setFormData((prev) => ({
        ...defaultFormData,
        groupId: groupId || '',
      }));
      setDeptRows([{ id: '', name: '', qty: '', buy: '' }]);
      setDeptErrors(['']);
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      setIsEnManuallyEdited(false);
      setInitialVNDescription('');
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
      setGroupCurrency('VND'); // Reset currency
      setCurrencyError(null);
      setOpenConfirmDialog(false); // Reset confirmation dialog
    }
  }, [open, groupId, fetchGroupCurrency]);

  const translateText = async (text) => {
    if (!text) {
      setFormData((prev) => ({ ...prev, itemDescriptionEN: '' }));
      setSnackbarMessage('Vietnamese description has been cleared.');
      setSnackbarOpen(true);
      setIsEnManuallyEdited(false);
      return;
    }

    setTranslating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate/vi-to-en`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.translatedText && !data.text) {
        throw new Error('Invalid translation response: missing translated text');
      }

      const translatedText = data.translatedText || data.text;
      setFormData((prev) => ({ ...prev, itemDescriptionEN: translatedText }));
      setIsEnManuallyEdited(false);
    } catch (error) {
      console.error('Translation error:', error.message);
      setFormData((prev) => ({ ...prev, itemDescriptionEN: '' }));
      setSnackbarMessage('Unable to translate text. Please try again or enter manually.');
      setSnackbarOpen(true);
    } finally {
      setTranslating(false);
    }
  };

  const debouncedTranslate = useCallback(
    debounce((text) => {
      if (text !== initialVNDescription && !isEnManuallyEdited) {
        translateText(text);
      }
    }, 500),
    [initialVNDescription, isEnManuallyEdited]
  );

  useEffect(() => {
    if (formData.itemDescriptionVN !== initialVNDescription) {
      debouncedTranslate(formData.itemDescriptionVN);
    }
    return () => debouncedTranslate.cancel();
  }, [formData.itemDescriptionVN, debouncedTranslate, initialVNDescription]);

  useEffect(() => {
    return () => {
      if (!open) {
        previews.forEach((preview) => preview && URL.revokeObjectURL(preview));
        setFiles([]);
        setPreviews([]);
        console.log('Cleanup: Files and previews cleared');
        setOpenConfirmDialog(false); // Ensure confirmation dialog is closed
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

  useEffect(() => {
    if (formData.productType1Id) {
      fetchProductType2List(formData.productType1Id);
    } else {
      setProductType2List([]);
      setFormData((prev) => ({ ...prev, productType2Id: '' }));
    }
  }, [formData.productType1Id]);

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
        fullDescription: supplierData.fullItemDescriptionVN,
        oldSAPCode: supplierData.oldSapCode,
        supplierId: supplierData.supplierId,
        unit: supplierData.unit || '',
        supplierPrice: parseFloat(supplierData.supplierPrice) || 0,
        productType1Id: supplierData.productType1Id || '',
        productType2Id: supplierData.productType2Id || '',
      }));
      setSelectedSupplier({
        id: supplierData.supplierId,
        sapCode: supplierData.oldSapCode || '',
        price: supplierData.supplierPrice || 0,
        unit: supplierData.unit || '',
        supplierName: supplierData.supplierName || '',
        fullDescription: supplierData.fullItemDescriptionVN || '',
      });
      setShowSupplierSelector(false);
      if (supplierData.itemDescriptionVN) {
        setFormData((prev) => ({ ...prev, itemDescriptionVN: supplierData.itemDescriptionVN }));
        if (supplierData.itemDescriptionVN !== initialVNDescription && !isEnManuallyEdited) {
          translateText(supplierData.itemDescriptionVN);
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        fullDescription: '',
        oldSAPCode: '',
        supplierId: '',
        unit: '',
        supplierPrice: 0,
        productType1Id: '',
        productType2Id: '',
      }));
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
    }
  };

  const handleChange = (field) => (e) => {
    const value = ['dailyMedInventory', 'safeStock'].includes(field)
      ? parseFloat(e.target.value) || ''
      : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'itemDescriptionEN') {
      setIsEnManuallyEdited(true);
    } else if (field === 'itemDescriptionVN') {
      setIsEnManuallyEdited(false);
    } else if (field === 'oldSAPCode') {
      if (!value) {
        setSelectedSupplier(null);
        setShowSupplierSelector(true);
      } else if (value !== formData.oldSAPCode) {
        setShowSupplierSelector(true);
      }
    }
  };

  const handleDeptChange = (index, field, value) => {
    const updatedRows = [...deptRows];
    if (field === 'id') {
      const selectedDept = departmentList.find((dept) => dept.id === value);
      updatedRows[index] = {
        ...updatedRows[index],
        id: value,
        name: selectedDept ? selectedDept.departmentName : '',
      };
    } else {
      updatedRows[index][field] = parseFloat(value) || '';
    }
    setDeptRows(updatedRows);

    const updatedErrors = deptRows.map((row, i) => {
      if (i === index && field === 'id' && value) {
        const isDuplicate = deptRows.some(
          (otherRow, otherIndex) =>
            otherIndex !== i && otherRow.id === value && value !== ''
        );
        return isDuplicate ? 'This department is already selected' : '';
      }
      return deptErrors[i] || '';
    });
    setDeptErrors(updatedErrors);
  };

  const handleAddDeptRow = () => {
    setDeptRows([...deptRows, { id: '', name: '', qty: '', buy: '' }]);
    setDeptErrors([...deptErrors, '']);
  };

  const handleDeleteDeptRow = (index) => {
    const updatedRows = deptRows.filter((_, i) => i !== index);
    const updatedErrors = deptErrors.filter((_, i) => i !== index);
    setDeptRows(updatedRows.length > 0 ? updatedRows : [{ id: '', name: '', qty: '', buy: '' }]);
    setDeptErrors(updatedErrors.length > 0 ? updatedErrors : ['']);
  };

  const calcTotalBuy = () => {
    return deptRows.reduce((sum, row) => {
      const b = parseFloat(row.buy);
      return sum + (isNaN(b) ? 0 : b);
    }, 0);
  };

  const calcTotalPrice = () => {
    return calcTotalBuy() * (formData.supplierPrice || 0);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) {
      console.warn('No files selected');
      return;
    }

    const validFiles = selectedFiles.filter((file) =>
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    if (validFiles.length !== selectedFiles.length) {
      setSnackbarMessage('Only image files under 5MB are allowed.');
      setSnackbarOpen(true);
      return;
    }

    const newFiles = [...files, ...validFiles];
    if (newFiles.length > 10) {
      setSnackbarMessage('You can upload a maximum of 10 images.');
      setSnackbarOpen(true);
      return;
    }

    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles(newFiles);
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviewUrls);
    console.log('Updated files state:', newFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    })));
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    console.log('Removing file at index:', index);
    URL.revokeObjectURL(previews[index]);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    console.log('Updated files:', newFiles.map((file) => file.name));
  };

  const handleAddClick = () => {
    console.log('Add button clicked. Starting handleAddClick...');
    // Perform the same validations as in handleAdd
    if (!groupId) {
      setSnackbarMessage('Group ID is missing.');
      setSnackbarOpen(true);
      return;
    }
    if (!formData.itemDescriptionVN) {
      setSnackbarMessage('Item Description (VN) is required.');
      setSnackbarOpen(true);
      return;
    }
    if (deptRows.every((row) => !row.id || !row.qty || !row.buy)) {
      setSnackbarMessage('At least one department, quantity, and buy must be provided.');
      setSnackbarOpen(true);
      return;
    }

    const departmentIds = deptRows
      .filter((row) => row.id)
      .map((row) => row.id);
    const hasDuplicates = new Set(departmentIds).size !== departmentIds.length;
    if (hasDuplicates) {
      setSnackbarMessage('Duplicate departments detected. Please select unique departments.');
      setSnackbarOpen(true);
      return;
    }

    setOpenConfirmDialog(true); // Show confirmation dialog
  };

  const handleConfirmAdd = async () => {
    console.log('Confirm add clicked');
    setOpenConfirmDialog(false); // Close confirmation dialog
    await handleAdd(); // Execute the original add logic
  };

  const handleCancelAdd = () => {
    console.log('Cancel confirmation clicked');
    setOpenConfirmDialog(false); // Close confirmation dialog
  };

  const handleAdd = async () => {
    if (!groupId) {
      setSnackbarMessage('Group ID is missing.');
      setSnackbarOpen(true);
      return;
    }
    if (!formData.itemDescriptionVN) {
      setSnackbarMessage('Item Description (VN) is required.');
      setSnackbarOpen(true);
      return;
    }
    if (deptRows.every((row) => !row.id || !row.qty || !row.buy)) {
      setSnackbarMessage('At least one department, quantity, and buy must be provided.');
      setSnackbarOpen(true);
      return;
    }

    const departmentIds = deptRows
      .filter((row) => row.id)
      .map((row) => row.id);
    const hasDuplicates = new Set(departmentIds).size !== departmentIds.length;
    if (hasDuplicates) {
      setSnackbarMessage('Duplicate departments detected. Please select unique departments.');
      setSnackbarOpen(true);
      return;
    }

    const departmentRequisitions = deptRows
      .filter((row) => row.id && row.qty && row.buy)
      .map((row) => ({
        id: row.id,
        name: row.name,
        qty: parseFloat(row.qty) || 0,
        buy: parseFloat(row.buy) || 0,
      }));

    const formDataToSend = new FormData();
    formDataToSend.append('itemDescriptionEN', formData.itemDescriptionEN || '');
    formDataToSend.append('itemDescriptionVN', formData.itemDescriptionVN || '');
    formDataToSend.append('fullDescription', formData.fullDescription || '');
    formDataToSend.append('oldSAPCode', formData.oldSAPCode || '');
    formDataToSend.append('hanaSAPCode', formData.hanaSAPCode || '');
    formDataToSend.append('departmentRequisitions', JSON.stringify(departmentRequisitions));
    formDataToSend.append('dailyMedInventory', parseFloat(formData.dailyMedInventory) || 0);
    formDataToSend.append('safeStock', parseFloat(formData.safeStock) || 0);
    formDataToSend.append('reason', formData.reason || '');
    formDataToSend.append('remark', formData.remark || '');
    formDataToSend.append('remarkComparison', formData.remarkComparison || '');
    formDataToSend.append('supplierId', formData.supplierId || '');
    formDataToSend.append('productType1Id', formData.productType1Id || '');
    formDataToSend.append('productType2Id', formData.productType2Id || '');
    formDataToSend.append('groupId', formData.groupId || '');
    files.forEach((file) => {
      formDataToSend.append('files', file);
    });

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/requisition-monthly`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
        },
        body: formDataToSend,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Add failed with status ${res.status}`);
      }

      setSnackbarMessage('Request added successfully!');
      setSnackbarOpen(true);

      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
      onClose();

      setFormData(defaultFormData);
      setDeptRows([{ id: '', name: '', qty: '', buy: '' }]);
      setDeptErrors(['']);
      setProductType1List([]);
      setProductType2List([]);
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      setGroupCurrency('VND'); // Reset currency
      setCurrencyError(null);
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      console.error('Add error:', err);
      setSnackbarMessage(`Add failed: ${err.message}`);
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
          Add Monthly Requisition
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {currencyError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {currencyError}
              </Alert>
            )}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Old SAP Code"
                value={formData.oldSAPCode}
                onChange={handleChange('oldSAPCode')}
                size="small"
                fullWidth
                sx={{ flex: 1 }}
                InputLabelProps={{
                  style: { color: 'inherit' },
                }}
              />
              <TextField
                label="Hana SAP Code"
                value={formData.hanaSAPCode}
                onChange={handleChange('hanaSAPCode')}
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
              label="Full Description"
              value={formData.fullDescription}
              onChange={handleChange('fullDescription')}
              fullWidth
              size="small"
              multiline
              rows={2}
            />

            {showSupplierSelector ? (
              <SupplierSelector
                oldSapCode={formData.oldSAPCode}
                onSelectSupplier={handleSelectSupplier}
                productType1List={productType1List}
                productType2List={productType2List}
                currency={groupCurrency} // Use normalized groupCurrency
                disabled={loadingCurrency} // Disable while loading currency
              />
            ) : (
              selectedSupplier && (
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 4 }}>
                  <Typography>Supplier: {selectedSupplier.supplierName}</Typography>
                  <Typography>SAP Code: {selectedSupplier.sapCode}</Typography>
                  <Typography>Price: {(selectedSupplier.price || 0).toLocaleString('vi-VN', { style: 'currency', currency: groupCurrency })}</Typography>
                  <Button variant="outlined" onClick={() => setShowSupplierSelector(true)} sx={{ mt: 1 }}>
                    Change Supplier
                  </Button>
                </Box>
              )
            )}

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Department Requisitions:
              </Typography>
              {deptRows.map((row, index) => (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  key={index}
                  sx={{ mb: 1 }}
                >
                  <FormControl fullWidth size="small" disabled={loadingDepartments} error={!!deptErrors[index]}>
                    <InputLabel id={`department-label-${index}`}>Department</InputLabel>
                    <Select
                      labelId={`department-label-${index}`}
                      value={row.id}
                      label="Department"
                      onChange={(e) => handleDeptChange(index, 'id', e.target.value)}
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
                    {deptErrors[index] && <FormHelperText>{deptErrors[index]}</FormHelperText>}
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
                  <TextField
                    label="Buy"
                    type="number"
                    value={row.buy}
                    onChange={(e) => handleDeptChange(index, 'buy', e.target.value)}
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
                  Total Buy: <span style={{ color: '#1976d2' }}>{calcTotalBuy()}</span>
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  Unit: <span style={{ color: '#1976d2' }}>{formData.unit || '-'}</span>
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  Price: <span style={{ color: '#1976d2' }}>{(formData.supplierPrice || 0).toLocaleString('vi-VN', { style: 'currency', currency: groupCurrency })}</span>
                </Typography>
              </Stack>
            </Paper>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Daily Med Inventory"
                value={formData.dailyMedInventory}
                onChange={handleChange('dailyMedInventory')}
                size="small"
                fullWidth
                type="number"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Safe Stock"
                value={formData.safeStock}
                onChange={handleChange('safeStock')}
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
            <FormControl fullWidth size="small">
              <InputLabel id="remark-comparison-label">Remark Comparison</InputLabel>
              <Select
                labelId="remark-comparison-label"
                value={formData.remarkComparison}
                label="Remark Comparison"
                onChange={handleChange('remarkComparison')}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="Old price">Old price</MenuItem>
                <MenuItem value="The goods heavy and Small Q'ty. Only 1 Supplier can provide this type">
                  The goods heavy and Small Q'ty. Only 1 Supplier can provide this type
                </MenuItem>
              </Select>
            </FormControl>

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
                    <Box key={`new-${index}`} sx={{ position: 'relative' }}>
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }}
                      />
                      <IconButton
                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10 }}
                        onClick={() => handleRemoveFile(index)}
                      >
                        <CloseIcon color="error" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              {files.length === 0 && (
                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
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
          <Button
            variant="contained"
            onClick={handleAddClick} // Updated to trigger confirmation
            disabled={saving || deptErrors.some((error) => error) || loadingCurrency}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Add'}
          </Button>
        </DialogActions>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarMessage.includes('failed') || snackbarMessage.includes('Duplicate') ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Dialog>
      <Dialog open={openConfirmDialog} onClose={handleCancelAdd}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Add Requisition</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to add a new requisition with Item Description (VN) &quot;{formData.itemDescriptionVN || 'Unknown'}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAdd} sx={{ fontSize: '0.875rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdd}
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