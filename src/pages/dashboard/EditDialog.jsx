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

export default function EditDialog({ open, item, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullDescription: '',
    oldSAPCode: '',
    hanaSAPCode: '',
    stock: '',
    orderQty: '',
    reason: '',
    remark: '',
    remarkComparison: '',
    supplierId: '',
    groupId: '',
    productType1Id: '',
    productType2Id: '',
    unit: '',
    supplierPrice: 0,
  });
  const [deptRows, setDeptRows] = useState([{ department: '', qty: '', buy: '' }]);
  const [deptErrors, setDeptErrors] = useState([]);
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
  const [translating, setTranslating] = useState(false);
  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);
  const [initialVNDescription, setInitialVNDescription] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('VND');
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [currencyError, setCurrencyError] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

const fetchGroupCurrency = useCallback(async () => {
  if (!item?.requisition?.groupId) {
    setCurrencyError('Invalid group ID');
    setGroupCurrency('VND');
    return;
  }

  setLoadingCurrency(true);
  setCurrencyError(null);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/group-summary-requisitions/${item.requisition.groupId}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Read JSON directly from response body
    const result = await response.json();

    const apiCurrency = result.currency || 'VND';

    const currencyCodeMap = {
      EURO: 'EUR',
      VND: 'VND',
      USD: 'USD',
    };

    const normalizedCurrency =
      currencyCodeMap[apiCurrency.toUpperCase()] || apiCurrency;

    try {
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: normalizedCurrency,
      }).format(0);

      setGroupCurrency(normalizedCurrency);
    } catch (err) {
      console.error('Invalid currency code:', normalizedCurrency);
      setCurrencyError(`Invalid currency code: ${normalizedCurrency}. Using default (VND).`);
      setGroupCurrency('VND');
    }
  } catch (err) {
    console.error('Error fetching currency:', err);
    setCurrencyError('Cannot fetch currency. Using default (VND).');
    setGroupCurrency('VND');
  } finally {
    setLoadingCurrency(false);
  }
}, [item]);


  useEffect(() => {
    console.log('EditDialog opened with item:', item);
    if (open && item && item.requisition && item.requisition.id) {
      fetchData();
      fetchGroupCurrency();
    } else {
      resetForm();
      setShowSupplierSelector(true);
    }
    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
    }
    setOpenConfirmDialog(false);
  }, [open, item, fetchGroupCurrency]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed: ${res.status} - ${text.substring(0, 100)}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON, received: ${text.substring(0, 100)}`);
      }

      const data = await res.json();  
      console.log('API response:', data);
      const requisition = data; // Since API now returns RequisitionMonthly directly
      const supplierProduct = data.supplierProduct || {};
      const vietnameseName = requisition.itemDescriptionVN || '';

      setFormData({
        itemDescriptionEN: requisition.itemDescriptionEN || '',
        itemDescriptionVN: vietnameseName,
        fullDescription: requisition.fullDescription || '',
        oldSAPCode: requisition.oldSAPCode || '',
        hanaSAPCode: requisition.hanaSAPCode || '',
        stock: requisition.stock != null ? requisition.stock.toString() : '', // Use stock, synced with dailyMedInventory
        orderQty: requisition.orderQty != null ? requisition.orderQty.toString() : '',
        reason: requisition.reason || '',
        remark: requisition.remark || '',
        remarkComparison: requisition.remarkComparison || '',
        supplierId: requisition.supplierId || '',
        groupId: requisition.groupId || '',
        productType1Id: requisition.productType1Id || '',
        productType2Id: requisition.productType2Id || '',
        unit: requisition.unit || '',
        supplierPrice: requisition.price || 0,
      });

      setDeptRows(
        requisition.departmentRequisitions && Array.isArray(requisition.departmentRequisitions)
          ? requisition.departmentRequisitions.map((dept) => ({
              department: dept.id,
              qty: dept.qty != null ? dept.qty.toString() : '',
              buy: dept.buy != null ? dept.buy.toString() : '',
            }))
          : [{ department: '', qty: '', buy: '' }]
      );
      setDeptErrors(
        requisition.departmentRequisitions && Array.isArray(requisition.departmentRequisitions)
          ? requisition.departmentRequisitions.map(() => '')
          : ['']
      );

      setImageUrls(requisition.imageUrls || []);
      setImagesToDelete([]);
      setFiles([]);
      setPreviews([]);
      setSelectedSupplier(
        requisition.supplierId
          ? {
              id: requisition.supplierId,
              supplierName: requisition.supplierName || '',
              sapCode: requisition.oldSAPCode || '',
              itemDescription: requisition.itemDescriptionVN || '',
              price: requisition.price || 0,
              unit: requisition.unit || '',
              fullDescription: requisition.fullDescription || '',
              productType1Id: requisition.productType1Id || '',
              productType2Id: requisition.productType2Id || '',
            }
          : null
      );
      if (requisition.supplierId) {
        setShowSupplierSelector(false);
      }
      setIsEnManuallyEdited(false);
      setInitialVNDescription(vietnameseName);
    } catch (err) {
      console.error('Fetch error:', err);
      setSnackbarMessage(`Failed to load data: ${err.message}`);
      setSnackbarOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      itemDescriptionEN: '',
      itemDescriptionVN: '',
      fullDescription: '',
      oldSAPCode: '',
      hanaSAPCode: '',
      stock: '',
      orderQty: '',
      reason: '',
      remark: '',
      remarkComparison: '',
      supplierId: '',
      groupId: '',
      productType1Id: '',
      productType2Id: '',
      unit: '',
      supplierPrice: 0,
    });
    setDeptRows([{ department: '', qty: '', buy: '' }]);
    setDeptErrors(['']);
    setImageUrls([]);
    setImagesToDelete([]);
    setFiles([]);
    setPreviews([]);
    setSelectedSupplier(null);
    setShowSupplierSelector(true);
    setIsEnManuallyEdited(false);
    setInitialVNDescription('');
    setGroupCurrency('VND');
    setCurrencyError(null);
    setOpenConfirmDialog(false);
  };

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
          accept: '*/*',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed with status ${response.status}`);
      }

      const data = await response.json();
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
        previews.forEach((preview) => preview && URL.revokeObjectURL(preview));
      };
    }, [previews]);


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
      console.error('Error loading department list:', error);
      setDepartmentList([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleSelectSupplier = (supplierData) => {
    if (supplierData) {
      setFormData((prev) => ({
        ...prev,
        fullDescription: supplierData.fullItemDescriptionVN || '',
        oldSAPCode: supplierData.oldSapCode || '',
        supplierId: supplierData.supplierId || '',
        unit: supplierData.unit || '',
        supplierPrice: parseFloat(supplierData.supplierPrice) || 0,
        productType1Id: supplierData.productType1Id || '',
        productType2Id: supplierData.productType2Id || '',
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
        productType1Id: supplierData.productType1Id || '',
        productType2Id: supplierData.productType2Id || '',
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
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'itemDescriptionEN') setIsEnManuallyEdited(true);
    if (field === 'itemDescriptionVN') setIsEnManuallyEdited(false);
    if (field === 'oldSAPCode') {
      if (!value) {
        setSelectedSupplier(null);
        setShowSupplierSelector(true);
      } else if (value !== item.oldSAPCode) { // So sánh với item gốc
        setShowSupplierSelector(true);
      }
    }
  };


  const handleDeptChange = (index, field, value) => {
    const updatedRows = [...deptRows];
    updatedRows[index][field] = value;
    setDeptRows(updatedRows);

    const updatedErrors = updatedRows.map((row, i) => {
      if (i === index && field === 'department' && value) {
        const isDuplicate = updatedRows.some(
          (otherRow, otherIndex) =>
            otherIndex !== i && otherRow.department === value && value !== ''
        );
        return isDuplicate ? 'This department is already selected' : '';
      }
      return deptErrors[i] || '';
    });
    setDeptErrors(updatedErrors);
  };
  
  const handleAddDeptRow = () => {
    setDeptRows([...deptRows, { department: '', qty: '', buy: '' }]);
    setDeptErrors([...deptErrors, '']);
  };

  const handleDeleteDeptRow = (index) => {
    const updatedRows = deptRows.filter((_, i) => i !== index);
    const updatedErrors = deptErrors.filter((_, i) => i !== index);
    setDeptRows(updatedRows.length > 0 ? updatedRows : [{ department: '', qty: '', buy: '' }]);
    setDeptErrors(updatedErrors.length > 0 ? updatedErrors : ['']);
  };

  const calcTotalRequestQty = () => {
    return deptRows.reduce((sum, row) => {
      const q = parseFloat(row.qty) || 0;
      return sum + q;
    }, 0);
  };

  const calcTotalBuy = () => {
    return deptRows.reduce((sum, row) => {
      const b = parseFloat(row.buy) || 0;
      return sum + b;
    }, 0);
  };

  const calcTotalPrice = () => {
    return calcTotalBuy() * (formData.supplierPrice || 0);
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
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    if (validFiles.length !== selectedFiles.length) {
      setSnackbarMessage('Only image files under 5MB are accepted.');
      setSnackbarOpen(true);
      return;
    }

    const newFiles = [...files, ...validFiles];
    if (newFiles.length + imageUrls.length - imagesToDelete.length > 10) {
      setSnackbarMessage('You can only upload a maximum of 10 images.');
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
    e.target.value = null;
  };

  const handleRemoveImage = (index) => {
    console.log('Removing image at index:', index);
    if (index < imageUrls.length) {
      const newImageUrls = [...imageUrls];
      const removedUrl = newImageUrls.splice(index, 1)[0];
      setImageUrls(newImageUrls);
      setImagesToDelete((prev) => [...prev, removedUrl]);
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

  const handleSaveClick = () => {
    console.log('Save button clicked. Starting handleSaveClick...');
    if (!item || !item.requisition || !item.requisition.id) {
      setSnackbarMessage('Cannot save: Missing item or requisition ID.');
      setSnackbarOpen(true);
      return;
    }

    if (!formData.itemDescriptionVN) {
      setSnackbarMessage('Product Description (VN) is required.');
      setSnackbarOpen(true);
      return;
    }

    if (deptRows.every((row) => !row.department || !row.qty || !row.buy)) {
      setSnackbarMessage('At least one department, quantity, and buy must be provided.');
      setSnackbarOpen(true);
      return;
    }

    const departmentIds = deptRows
      .filter((row) => row.department)
      .map((row) => row.department);
    const hasDuplicates = new Set(departmentIds).size !== departmentIds.length;
    if (hasDuplicates) {
      setSnackbarMessage('Duplicate departments detected. Please select unique departments.');
      setSnackbarOpen(true);
      return;
    }

    setOpenConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    console.log('Confirm save clicked');
    setOpenConfirmDialog(false);
    await handleSave();
  };

  const handleCancelSave = () => {
    console.log('Cancel confirmation clicked');
    setOpenConfirmDialog(false);
  };

  const handleSave = async () => {
    if (!item || !item.requisition || !item.requisition.id) {
      setSnackbarMessage('Cannot save: Missing item or requisition ID.');
      setSnackbarOpen(true);
      return;
    }

    if (!formData.itemDescriptionVN) {
      setSnackbarMessage('Product Description (VN) is required.');
      setSnackbarOpen(true);
      return;
    }

    if (deptRows.every((row) => !row.department || !row.qty || !row.buy)) {
      setSnackbarMessage('At least one department, quantity, and buy must be provided.');
      setSnackbarOpen(true);
      return;
    }

    const departmentIds = deptRows
      .filter((row) => row.department)
      .map((row) => row.department);
    const hasDuplicates = new Set(departmentIds).size !== departmentIds.length;
    if (hasDuplicates) {
      setSnackbarMessage('Duplicate departments detected. Please select unique departments.');
      setSnackbarOpen(true);
      return;
    }

    // Validate stock for non-negative value
    if (formData.stock && parseFloat(formData.stock) < 0) {
      setSnackbarMessage('Stock value cannot be negative.');
      setSnackbarOpen(true);
      return;
    }

    const deptRequisitions = deptRows
      .filter((row) => row.department && row.qty && row.buy)
      .map((row) => ({
        id: row.department,
        name: departmentList.find((dept) => dept.id === row.department)?.departmentName || '',
        qty: parseFloat(row.qty) || 0,
        buy: parseFloat(row.buy) || 0,
      }));

    const formDataToSend = new FormData();
    files.forEach(file => formDataToSend.append('files', file));
    const cleanImagesToDelete = imagesToDelete.filter(url => url && url.trim() !== '');
    formDataToSend.append('imagesToDelete', JSON.stringify(cleanImagesToDelete));
    Object.entries({
      englishName: formData.itemDescriptionEN || '',
      vietnameseName: formData.itemDescriptionVN || '',
      fullDescription: formData.fullDescription || '',
      oldSapCode: formData.oldSAPCode || '',
      hanaSapCode: formData.hanaSAPCode || '',
      departmentRequisitions: JSON.stringify(deptRequisitions), // Updated key
      stock: formData.stock ? parseFloat(formData.stock) : 0, // Send stock as number
      orderQty: parseFloat(formData.orderQty) || 0,
      reason: formData.reason || '',
      remark: formData.remark || '',
      remarkComparison: formData.remarkComparison || '',
      supplierId: formData.supplierId || '',
      groupId: formData.groupId || '',
      productType1Id: formData.productType1Id || undefined,
      productType2Id: formData.productType2Id || undefined,
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
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.warn('Error response is not JSON:', errorText);
        }
        const apiMessage = errorData.message || errorText || `Update failed with status ${res.status}`;
        throw new Error(apiMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      console.log('Save successful, response:', data);
      const successMessage = data.message || 'Request updated successfully!';
      setSnackbarMessage(successMessage);
      setSnackbarOpen(true);
      if (data.imageUrls) {
        setImageUrls(data.imageUrls);
        console.log('Updated imageUrls from response:', data.imageUrls);
      }
      previews.forEach(preview => preview && URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
      setImagesToDelete([]);
      await onRefresh();
      onClose(successMessage);
    } catch (err) {
      console.error('Update error:', err);
      setSnackbarMessage(err.message);
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
          Edit Request
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
              label="Full Description (VN)"
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
                selectedSupplier={selectedSupplier}
                productType1List={productType1List}
                productType2List={productType2List}
                currency={groupCurrency}
                disabled={loadingCurrency}
              />
            ) : (
              selectedSupplier && (
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 4 }}>
                  <Typography>Supplier: {selectedSupplier.supplierName}</Typography>
                  <Typography>SAP Code: {selectedSupplier.sapCode}</Typography>
                  <Typography>Price: {(selectedSupplier.price || 0).toLocaleString('vi-VN', { style: 'currency', currency: groupCurrency || 'VND' })}</Typography>
                  <Button variant="outlined" onClick={() => setShowSupplierSelector(true)} sx={{ mt: 1 }}>
                    Change Supplier
                  </Button>
                </Box>
              )
            )}

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Requested Quantity by Department:
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
                    {deptErrors[index] && <FormHelperText>{deptErrors[index]}</FormHelperText>}
                    {loadingDepartments && <FormHelperText>Loading departments...</FormHelperText>}
                  </FormControl>
                  <TextField
                    label="Quantity"
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
                  Total Requested Q'ty: <span style={{ color: '#1976d2' }}>{calcTotalRequestQty()}</span>
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  Total Buy: <span style={{ color: '#1976d2' }}>{calcTotalBuy()}</span>
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  Unit: <span style={{ color: '#1976d2' }}>{formData.unit || '-'}</span>
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
                error={formData.stock && parseFloat(formData.stock) < 0}
                helperText={formData.stock && parseFloat(formData.stock) < 0 ? 'Stock cannot be negative' : ''}
              />
              <TextField
                label="Order Q'ty"
                value={formData.orderQty}
                onChange={handleChange('orderQty')}
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
              <InputLabel sx={{ mb: 1 }}>Images (Maximum 10)</InputLabel>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                  Select Images
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                </Button>
                {(files.length + imageUrls.length - imagesToDelete.length) > 0 && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Selected {files.length + imageUrls.length - imagesToDelete.length} images
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
                          console.error(`Failed to load image for ${url}`, e);
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
              {files.length === 0 && imageUrls.length === imagesToDelete.length && (
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
          <Button
            variant="contained"
            onClick={handleSaveClick}
            disabled={saving || deptErrors.some((error) => error) || loadingCurrency}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
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
      <Dialog open={openConfirmDialog} onClose={handleCancelSave}>
        <DialogTitle sx={{ fontSize: '1rem' }}>Confirm Edit Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#374151', fontSize: '0.9rem' }}>
            Are you sure you want to save changes to the request with Item Description (VN) &quot;{formData.itemDescriptionVN || 'Unknown'}&quot;?
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