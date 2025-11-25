import { useState, useEffect, useCallback, useRef } from 'react';
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

const normalizeCurrencyCode = (code) => {
  const validCurrencies = ['VND', 'USD', 'EUR', 'JPY', 'GBP'];
  const currencyMap = { EURO: 'EUR' };
  if (!code) return 'VND';
  const normalizedCode = currencyMap[code.toUpperCase()] || code.toUpperCase();
  return validCurrencies.includes(normalizedCode) ? normalizedCode : 'VND';
};

export default function EditRequisitionMonthly({ open, item, onClose, onRefresh }) {
  const isMounted = useRef(false);
  const abortControllerRef = useRef(null); // For canceling fetch on unmount

  const [formData, setFormData] = useState({
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullDescription: '',
    oldSAPCode: '',
    hanaSAPCode: '',
    dailyMedInventory: 0,
    safeStock: 0,
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

  const [deptRows, setDeptRows] = useState([{ id: '', name: '', qty: '', buy: '' }]);
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
  const [quantityError, setQuantityError] = useState('');

  // === FETCH GROUP CURRENCY ===
  const fetchGroupCurrency = useCallback(async () => {
    if (!formData.groupId) {
      setCurrencyError('Invalid Group ID');
      setGroupCurrency('VND');
      return;
    }
    setLoadingCurrency(true);
    setCurrencyError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/${formData.groupId}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      const validatedCurrency = normalizeCurrencyCode(result.currency);
      setGroupCurrency(validatedCurrency);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch group currency error:', err);
      setCurrencyError('Failed to fetch group currency. Using default (VND).');
      setGroupCurrency('VND');
    } finally {
      setLoadingCurrency(false);
    }
  }, [formData.groupId]);

  // === FETCH MAIN DATA (FIXED JSON PARSING ERROR) ===
  const fetchData = async () => {
    if (!item?.id) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`${API_BASE_URL}/requisition-monthly/${item.id}`, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const text = await res.text();
          errorMsg += `: ${text.substring(0, 150)}`;
          if (res.status === 401 || res.status === 403) {
            errorMsg = 'Session expired. Please log in again.';
          }
        } catch (e) {
          errorMsg += ' (Failed to read response)';
        }
        throw new Error(errorMsg);
      }

    const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await res.text();

        // AUTO RETRY ONCE IF SESSION EXPIRED
        if (text.includes('session has been expired') || text.includes('login')) {
          console.log('Session expired → retrying once...');
          return fetchData(); // AUTO RETRY
        }

        throw new Error(`Invalid data: ${text.substring(0, 100)}`);
      }

      const data = await res.json();

      setFormData({
        itemDescriptionEN: data.itemDescriptionEN || '',
        itemDescriptionVN: data.itemDescriptionVN || '',
        fullDescription: data.fullDescription || '',
        oldSAPCode: data.oldSAPCode || '',
        hanaSAPCode: data.hanaSAPCode || '',
        dailyMedInventory: data.dailyMedInventory ?? 0,
        safeStock: data.safeStock ?? 0,
        reason: data.reason || '',
        remark: data.remark || '',
        remarkComparison: data.remarkComparison || '',
        supplierId: data.supplierId || '',
        groupId: data.groupId || '',
        productType1Id: data.productType1Id || '',
        productType2Id: data.productType2Id || '',
        unit: data.unit || '',
        supplierPrice: parseFloat(data.price) || 0,
      });

      const depts = data.departmentRequisitions && Array.isArray(data.departmentRequisitions)
        ? data.departmentRequisitions.map((dept) => ({
            id: dept.id || '',
            name: dept.name || '',
            qty: dept.qty?.toString() || '',
            buy: dept.buy?.toString() || '',
          }))
        : [{ id: '', name: '', qty: '', buy: '' }];

      setDeptRows(depts);
      setDeptErrors(depts.map(() => ''));

      setImageUrls(data.imageUrls || []);
      setImagesToDelete([]);
      setFiles([]);
      setPreviews([]);
      setSelectedSupplier(
        data.supplierId
          ? {
              id: data.supplierId,
              supplierName: data.supplierName || '',
              sapCode: data.oldSAPCode || '',
              price: parseFloat(data.price) || 0,
              unit: data.unit || '',
              fullDescription: data.fullDescription || '',
            }
          : null
      );
      setShowSupplierSelector(!data.supplierId);
      setIsEnManuallyEdited(false);
      setInitialVNDescription(data.itemDescriptionVN || '');
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setSnackbarMessage(`Failed to load data: ${err.message}`);
      setSnackbarOpen(true);
    }
  };

  // === RESET FORM ===
  const resetForm = () => {
    setFormData({
      itemDescriptionEN: '',
      itemDescriptionVN: '',
      fullDescription: '',
      oldSAPCode: '',
      hanaSAPCode: '',
      dailyMedInventory: 0,
      safeStock: 0,
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
    setDeptRows([{ id: '', name: '', qty: '', buy: '' }]);
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
    setQuantityError('');
  };

  // === AUTO TRANSLATE VI → EN ===
  const translateText = async (text) => {
    if (!text) {
      setFormData((prev) => ({ ...prev, itemDescriptionEN: '' }));
      setSnackbarMessage('Vietnamese description cleared.');
      setSnackbarOpen(true);
      setIsEnManuallyEdited(false);
      return;
    }
    setTranslating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate/vi-to-en`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
      const data = await response.json();
      const translatedText = data.translatedText || data.text || '';
      setFormData((prev) => ({ ...prev, itemDescriptionEN: translatedText }));
      setIsEnManuallyEdited(false);
    } catch (error) {
      console.error('Translation error:', error.message);
      setFormData((prev) => ({ ...prev, itemDescriptionEN: '' }));
      setSnackbarMessage('Translation failed. Please enter manually.');
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

  // === CLEANUP PREVIEWS ON CLOSE ===
  useEffect(() => {
    return () => {
      if (!open) {
        previews.forEach((preview) => preview && URL.revokeObjectURL(preview));
        setFiles([]);
        setPreviews([]);
      }
    };
  }, [open, previews]);

  // === FETCH PRODUCT TYPE 1 WITH ONE RETRY ===
  const fetchProductType1List = async () => {
    setLoadingType1(true);

    // API call function (wrapped to reuse for retry)
    const callApi = async () => {
      const res = await fetch(`${API_BASE_URL}/api/product-type-1`);

      console.log("STATUS:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.log("Response text:", text);
        throw new Error(`Failed: ${res.status}`);
      }

      const data = await res.json();
      console.log("DATA:", data);

      return data;
    };

    try {
      // First attempt
      const data = await callApi();
      setProductType1List(data.content || data);
    } catch (error) {
      console.warn("⚠️ First request failed. Retrying...", error);

      try {
        // Retry attempt
        const data = await callApi();
        setProductType1List(data.content || data);
      } catch (retryError) {
        console.error("❌ Retry failed:", retryError);
        setProductType1List([]);
        setSnackbarMessage("Failed to load product types.");
        setSnackbarOpen(true);
      }
    } finally {
      setLoadingType1(false);
    }
  };



  // === FETCH PRODUCT TYPE 2 ===
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

  // === FETCH DEPARTMENTS WITH ONE RETRY ===
  const fetchDepartmentList = async () => {
    setLoadingDepartments(true);

    // API call function
    const callApi = async () => {
      const res = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { accept: "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    };

    try {
      // First attempt
      const data = await callApi();
      setDepartmentList(data || []);
    } catch (error) {
      console.warn("⚠️ First API call failed. Retrying...", error);

      try {
        // Second attempt (retry)
        const data = await callApi();
        setDepartmentList(data || []);
      } catch (retryError) {
        console.error("❌ Retry failed:", retryError);
        setDepartmentList([]);
        setSnackbarMessage("Failed to load departments.");
        setSnackbarOpen(true);
      }
    } finally {
      setLoadingDepartments(false);
    }
  };


  // === HANDLE SUPPLIER SELECTION ===
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

  // === HANDLE INPUT CHANGE ===
  const handleChange = (field) => (e) => {
    const value = ['dailyMedInventory', 'safeStock'].includes(field)
      ? parseFloat(e.target.value) || 0
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

  // === DEPARTMENT ROW HANDLERS ===
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
      updatedRows[index][field] = value;
    }
    setDeptRows(updatedRows);

    const updatedErrors = deptRows.map((row, i) => {
      if (i === index && field === 'id' && value) {
        const isDuplicate = deptRows.some(
          (otherRow, otherIndex) => otherIndex !== i && otherRow.id === value && value !== ''
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

  // === CALCULATE TOTALS ===
  const calcTotalRequestQty = () => {
    return deptRows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);
  };

  const calcTotalStock = () => {
    return (parseFloat(formData.dailyMedInventory) || 0) + (parseFloat(formData.safeStock) || 0);
  };

  // === AUTO CALCULATE BUY FIELD ===
  useEffect(() => {
    const totalQty = calcTotalRequestQty();
    const totalStock = calcTotalStock();

    let error = '';
    if (totalQty > 0 && totalStock > 0 && totalQty !== totalStock) {
      error = `Total request quantity (${totalQty}) must equal Daily Med Inventory + Safe Stock (${totalStock})`;
    }
    setQuantityError(error);

    if (totalQty === 0 || totalStock === 0 || error) {
      setDeptRows((rows) =>
        rows.map((row) => ({
          ...row,
          buy: error ? '' : row.qty,
        }))
      );
      return;
    }

    const ratio = totalStock / totalQty;
    const updatedRows = deptRows.map((row) => ({
      ...row,
      buy: row.qty ? Math.round(parseFloat(row.qty) * ratio).toString() : '',
    }));
    setDeptRows(updatedRows);
  }, [deptRows.map(r => r.qty).join(','), formData.dailyMedInventory, formData.safeStock]);

  // === IMAGE HANDLERS ===
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const validFiles = selectedFiles.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
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
    e.target.value = null;
  };

  const handleRemoveImage = (index) => {
    if (index < imageUrls.length) {
      const newImageUrls = [...imageUrls];
      const removedUrl = newImageUrls.splice(index, 1)[0];
      setImageUrls(newImageUrls);
      setImagesToDelete((prev) => [...prev, removedUrl]);
    } else {
      const adjustedIndex = index - imageUrls.length;
      if (adjustedIndex >= 0 && adjustedIndex < previews.length) {
        URL.revokeObjectURL(previews[adjustedIndex]);
        const newFiles = files.filter((_, i) => i !== adjustedIndex);
        const newPreviews = previews.filter((_, i) => i !== adjustedIndex);
        setFiles(newFiles);
        setPreviews(newPreviews);
      }
    }
  };

  // === SAVE VALIDATION ===
  const handleSaveClick = () => {
    if (!item?.id) {
      setSnackbarMessage('Cannot save: Missing requisition ID.');
      setSnackbarOpen(true);
      return;
    }
    if (!formData.itemDescriptionVN) {
      setSnackbarMessage('Product Description (VN) is required.');
      setSnackbarOpen(true);
      return;
    }
    if (deptRows.every((row) => !row.id || !row.qty)) {
      setSnackbarMessage('At least one department and quantity must be provided.');
      setSnackbarOpen(true);
      return;
    }
    const departmentIds = deptRows.filter((row) => row.id).map((row) => row.id);
    const hasDuplicates = new Set(departmentIds).size !== departmentIds.length;
    if (hasDuplicates) {
      setSnackbarMessage('Duplicate departments detected. Please select unique departments.');
      setSnackbarOpen(true);
      return;
    }
    if (quantityError) {
      setSnackbarMessage(quantityError);
      setSnackbarOpen(true);
      return;
    }
    setOpenConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setOpenConfirmDialog(false);
    await handleSave();
  };

  const handleCancelSave = () => {
    setOpenConfirmDialog(false);
  };

  // === SAVE TO SERVER ===
  const handleSave = async () => {
    const departmentRequisitions = deptRows
      .filter((row) => row.id && row.qty && row.buy)
      .map((row) => ({
        id: row.id,
        name: row.name,
        qty: parseFloat(row.qty) || 0,
        buy: parseFloat(row.buy) || 0,
      }));

    const formDataToSend = new FormData();
    files.forEach(file => formDataToSend.append('files', file));
    const cleanImagesToDelete = imagesToDelete.filter(url => url && url.trim() !== '');
    formDataToSend.append('imagesToDelete', JSON.stringify(cleanImagesToDelete.length > 0 ? cleanImagesToDelete : []));
    formDataToSend.append('departmentRequisitions', JSON.stringify(departmentRequisitions));
    Object.entries({
      itemDescriptionEN: formData.itemDescriptionEN || '',
      itemDescriptionVN: formData.itemDescriptionVN || '',
      fullDescription: formData.fullDescription || '',
      oldSAPCode: formData.oldSAPCode || '',
      hanaSAPCode: formData.hanaSAPCode || '',
      dailyMedInventory: parseFloat(formData.dailyMedInventory) || 0,
      safeStock: parseFloat(formData.safeStock) || 0,
      reason: formData.reason || '',
      remark: formData.remark || '',
      remarkComparison: formData.remarkComparison || '',
      supplierId: formData.supplierId || '',
      groupId: formData.groupId || '',
      productType1Id: formData.productType1Id || undefined,
      productType2Id: formData.productType2Id || undefined,
    }).forEach(([key, value]) => {
      if (value !== undefined) formDataToSend.append(key, value);
    });

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/requisition-monthly/${item.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Update failed: ${res.status} - ${errorText.substring(0, 200)}`);
      }
      const data = await res.json();
      setSnackbarMessage('Requisition updated successfully!');
      setSnackbarOpen(true);
      if (data.imageUrls) setImageUrls(data.imageUrls);
      previews.forEach(preview => preview && URL.revokeObjectURL(preview));
      setFiles([]);
      setPreviews([]);
      setImagesToDelete([]);
      await onRefresh();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      setSnackbarMessage(`Failed to update: ${err.message}`);
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // === MAIN EFFECTS ===
  useEffect(() => {
    if (open && item?.id && !isMounted.current) {
      isMounted.current = true;
      fetchData();
    } else if (!open) {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }

    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
      setOpenConfirmDialog(false);
    }
  }, [open, item?.id]);

  useEffect(() => {
    if (formData.groupId) {
      fetchGroupCurrency();
    }
  }, [formData.groupId, fetchGroupCurrency]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
          Edit Monthly Requisition
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {currencyError && <Alert severity="warning">{currencyError}</Alert>}

            <Stack direction="row" spacing={2}>
              <TextField label="Old SAP Code" value={formData.oldSAPCode} onChange={handleChange('oldSAPCode')} size="small" fullWidth />
              <TextField label="Hana SAP Code" value={formData.hanaSAPCode} onChange={handleChange('hanaSAPCode')} size="small" fullWidth />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Product Description (VN)"
                value={formData.itemDescriptionVN}
                onChange={handleChange('itemDescriptionVN')}
                fullWidth
                size="small"
              />
              <TextField
                label="Product Description (EN)"
                value={formData.itemDescriptionEN}
                onChange={handleChange('itemDescriptionEN')}
                fullWidth
                size="small"
                disabled={translating}
                InputProps={{ endAdornment: translating ? <CircularProgress size={16} /> : null }}
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
                currency={groupCurrency}
                disabled={loadingCurrency}
              />
            ) : (
              selectedSupplier && (
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 4 }}>
                  <Typography>Supplier: {selectedSupplier.supplierName}</Typography>
                  <Typography>SAP Code: {selectedSupplier.sapCode}</Typography>
                  <Typography>
                    Price: {(selectedSupplier.price || 0).toLocaleString('en-US', { style: 'currency', currency: groupCurrency })}
                  </Typography>
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
                <Stack direction="row" spacing={2} alignItems="center" key={index} sx={{ mb: 1 }}>
                  <FormControl fullWidth size="small" disabled={loadingDepartments} error={!!deptErrors[index]}>
                    <InputLabel>Department</InputLabel>
                    <Select value={row.id} label="Department" onChange={(e) => handleDeptChange(index, 'id', e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {departmentList.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>{dept.departmentName}</MenuItem>
                      ))}
                    </Select>
                    {deptErrors[index] && <FormHelperText>{deptErrors[index]}</FormHelperText>}
                  </FormControl>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={row.qty}
                    onChange={(e) => handleDeptChange(index, 'qty', e.target.value)}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                  <TextField label="Buy" type="number" value={row.buy} size="small" fullWidth disabled />
                  <IconButton onClick={() => handleDeleteDeptRow(index)} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDeptRow} sx={{ mt: 1 }}>
                Add Department
              </Button>

              <Stack direction="row" spacing={4} sx={{ mt: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Requested: <span style={{ color: '#1976d2' }}>{calcTotalRequestQty()}</span>
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Buy: <span style={{ color: '#1976d2' }}>{calcTotalRequestQty()}</span>
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  Unit: <span style={{ color: '#1976d2' }}>{formData.unit || '-'}</span>
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  Price: <span style={{ color: '#1976d2' }}>
                    {(formData.supplierPrice || 0).toLocaleString('en-US', { style: 'currency', currency: groupCurrency })}
                  </span>
                </Typography>
              </Stack>
            </Paper>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Daily Med Inventory"
                value={formData.dailyMedInventory}
                onChange={handleChange('dailyMedInventory')}
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Safe Stock"
                value={formData.safeStock}
                onChange={handleChange('safeStock')}
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
              />
            </Stack>
            {quantityError && <Alert severity="error">{quantityError}</Alert>}

            <TextField label="Reason" value={formData.reason} onChange={handleChange('reason')} fullWidth size="small" multiline rows={2} />
            <TextField label="Remark" value={formData.remark} onChange={handleChange('remark')} fullWidth size="small" multiline rows={2} />
            <FormControl fullWidth size="small">
              <InputLabel>Remark Comparison</InputLabel>
              <Select value={formData.remarkComparison} label="Remark Comparison" onChange={handleChange('remarkComparison')}>
                <MenuItem value=""><em>None</em></MenuItem>
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
                  <input hidden type="file" accept="image/*" multiple onChange={handleFileChange} />
                </Button>
                {(files.length + imageUrls.length - imagesToDelete.length) > 0 && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {files.length + imageUrls.length - imagesToDelete.length} images selected
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
                        onError={(e) => { e.target.style.display = 'none'; }}
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
                      <img src={preview} alt={`New ${index + 1}`} style={{ maxHeight: '150px', borderRadius: 4, border: '1px solid #ddd' }} />
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
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveClick}
            disabled={saving || deptErrors.some(e => e) || loadingCurrency || !!quantityError}
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

      {/* Confirm Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCancelSave}>
        <DialogTitle>Confirm Save Requisition</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to update the requisition for item "{formData.itemDescriptionVN || 'Unknown'}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave}>Cancel</Button>
          <Button onClick={handleConfirmSave} variant="contained" disabled={saving}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}