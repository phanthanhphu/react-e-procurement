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

const normalizeCurrencyCode = (code) => {
  const validCurrencies = ['VND', 'USD', 'EUR', 'JPY', 'GBP'];
  const currencyMap = { EURO: 'EUR' };
  if (!code) return 'VND';
  const normalizedCode = currencyMap[code.toUpperCase()] || code.toUpperCase();
  return validCurrencies.includes(normalizedCode) ? normalizedCode : 'VND';
};

export default function AddDialog({ open, onClose, onRefresh, groupId }) {
  const defaultFormData = {
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullItemDescriptionVN: '',
    oldSapCode: '',
    hanaSapCode: '',
    orderQty: '',
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
  const [deptRows, setDeptRows] = useState([{ department: '', qty: '', buy: '' }]);
  const [deptErrors, setDeptErrors] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('VND');
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [currencyError, setCurrencyError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(true);
  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // TỔNG REQUEST QTY
  const totalRequestQty = deptRows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);

  // LỖI ORDER QTY > TỔNG REQUEST
  const orderQtyError = formData.orderQty && totalRequestQty > 0 && parseFloat(formData.orderQty) > totalRequestQty
    ? `Order Q'ty cannot exceed total request (${totalRequestQty})`
    : '';

  // TỰ ĐỘNG CHIA BUY – ưu tiên phòng có Qty nhỏ nhất trước
  const autoAllocateBuy = useCallback((rows, orderQtyInput) => {
    const orderQty = parseFloat(orderQtyInput) || 0;
    if (orderQty <= 0 || totalRequestQty === 0) {
      return rows.map(r => ({ ...r, buy: '' }));
    }
    const effectiveQty = Math.min(orderQty, totalRequestQty);

    const sorted = rows
      .map((r, i) => ({ ...r, originalIndex: i }))
      .filter(r => parseFloat(r.qty) > 0)
      .sort((a, b) => (parseFloat(a.qty) || 0) - (parseFloat(b.qty) || 0) || a.originalIndex - b.originalIndex);

    const allocated = {};
    let remaining = effectiveQty;

    for (const row of sorted) {
      if (remaining <= 0) break;
      const req = parseFloat(row.qty) || 0;
      if (req > 0) {
        const give = Math.min(req, remaining);
        allocated[row.department] = give;
        remaining -= give;
      }
    }

    return rows.map(row => ({
      ...row,
      buy: row.department && allocated[row.department] !== undefined ? allocated[row.department] : ''
    }));
  }, [totalRequestQty]);

// THAY ĐOẠN NÀY TRONG FILE CỦA BẠN:
useEffect(() => {
  if (!orderQtyError && formData.orderQty) {
    const newRows = autoAllocateBuy(deptRows, formData.orderQty);
    setDeptRows(newRows);
  }
}, [formData.orderQty, autoAllocateBuy, orderQtyError]); // ĐÃ XÓA deptRows

  // FETCH CURRENCY + DATA
  const fetchGroupCurrency = useCallback(async () => {
    if (!groupId) return setGroupCurrency('VND');
    setLoadingCurrency(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGroupCurrency(normalizeCurrencyCode(data.currency));
    } catch {
      setGroupCurrency('VND');
    } finally {
      setLoadingCurrency(false);
    }
  }, [groupId]);

  const fetchDepartmentList = async () => {
    setLoadingDepartments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`, { headers: { accept: '*/*' } });
      const data = await res.json();
      setDepartmentList(data || []);
    } catch (err) {
      console.error(err);
      setDepartmentList([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGroupCurrency();
      fetchDepartmentList();
      setFormData({ ...defaultFormData, groupId: groupId || '' });
      setDeptRows([{ department: '', qty: '', buy: '' }]);
      setDeptErrors(['']);
      setFiles([]);
      setPreviews(p => { p.forEach(URL.revokeObjectURL); return []; });
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      setIsEnManuallyEdited(false);
      setErrorOpen(false);
      setOpenConfirmDialog(false);
    }
  }, [open, groupId, fetchGroupCurrency]);

  // DỊCH TỰ ĐỘNG VN → EN
  const translateText = async (text) => {
    if (!text || isEnManuallyEdited) return;
    setTranslating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/translate/vi-to-en`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setFormData(prev => ({ ...prev, itemDescriptionEN: data.translatedText || '' }));
    } catch (err) {
      console.error('Translate failed:', err);
    } finally {
      setTranslating(false);
    }
  };

  const debouncedTranslate = useCallback(debounce(translateText, 600), [isEnManuallyEdited]);

  useEffect(() => {
    if (formData.itemDescriptionVN && !isEnManuallyEdited) {
      debouncedTranslate(formData.itemDescriptionVN);
    }
  }, [formData.itemDescriptionVN, debouncedTranslate]);

  // TRUYỀN ITEM DESCRIPTION VN LÀM ITEMNO CHO SUPPLIER SELECTOR
  const itemNoForSupplier = formData.itemDescriptionVN.trim();

  const handleSelectSupplier = (supplierData) => {
    if (supplierData) {
      setFormData(prev => ({
        ...prev,
        oldSapCode: supplierData.oldSapCode || '',
        supplierId: supplierData.supplierId || '',
        unit: supplierData.unit || '',
        supplierPrice: parseFloat(supplierData.supplierPrice) || 0,
        productType1Id: supplierData.productType1Id || '',
        productType2Id: supplierData.productType2Id || '',
      }));
      setSelectedSupplier({
        supplierName: supplierData.supplierName || '',
        sapCode: supplierData.oldSapCode || '',
        price: parseFloat(supplierData.supplierPrice) || 0,
        unit: supplierData.unit || '',
      });
      setShowSupplierSelector(false);
    } else {
      setFormData(prev => ({
        ...prev,
        oldSapCode: '', supplierId: '', unit: '', supplierPrice: 0,
        productType1Id: '', productType2Id: ''
      }));
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'itemDescriptionEN') setIsEnManuallyEdited(true);
    if (field === 'itemDescriptionVN') setIsEnManuallyEdited(false);
  };

  const handleDeptChange = (index, field, value) => {
    const updated = [...deptRows];
    if (field === 'department') updated[index].department = value;
    if (field === 'qty') updated[index].qty = value;
    setDeptRows(updated);

    const errors = deptErrors.map((err, i) => {
      if (i === index && field === 'department' && value) {
        const dup = deptRows.some((r, idx) => idx !== i && r.department === value);
        return dup ? 'This department is already selected' : '';
      }
      return err;
    });
    setDeptErrors(errors);
  };

  const handleAddDeptRow = () => {
    setDeptRows([...deptRows, { department: '', qty: '', buy: '' }]);
    setDeptErrors([...deptErrors, '']);
  };

  const handleDeleteDeptRow = (i) => {
    setDeptRows(deptRows.filter((_, idx) => idx !== i));
    setDeptErrors(deptErrors.filter((_, idx) => idx !== i));
  };

  const calcTotalRequestQty = () => deptRows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
  const calcTotalBuy = () => deptRows.reduce((s, r) => s + (parseFloat(r.buy) || 0), 0);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10 - files.length);
    const valid = selected.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length < selected.length) {
      setErrorMessage('Only images ≤ 5MB allowed');
      setErrorOpen(true);
    }
    const newFiles = [...files, ...valid];
    setFiles(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
    e.target.value = null;
  };

  const handleRemoveFile = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(files.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const handleAddClick = () => {
    if (!formData.itemDescriptionVN) return setErrorMessage('Item Description (VN) is required'), setErrorOpen(true);
    if (totalRequestQty === 0) return setErrorMessage('At least one department must have request quantity'), setErrorOpen(true);
    if (orderQtyError) return setErrorMessage(orderQtyError), setErrorOpen(true);
    const deptIds = deptRows.filter(r => r.department).map(r => r.department);
    if (new Set(deptIds).size !== deptIds.length) return setErrorMessage('Duplicate departments not allowed'), setErrorOpen(true);
    setOpenConfirmDialog(true);
  };

  const handleAdd = async () => {
    const departmentRequisitions = deptRows
      .filter(r => r.department && r.qty && r.buy)
      .map(r => ({
        id: r.department,
        name: departmentList.find(d => d.id === r.department)?.departmentName || '',
        qty: parseFloat(r.qty) || 0,
        buy: parseFloat(r.buy) || 0,
      }));

    const formDataToSend = new FormData();
    formDataToSend.append('englishName', formData.itemDescriptionEN || '');
    formDataToSend.append('vietnameseName', formData.itemDescriptionVN || '');
    formDataToSend.append('fullDescription', formData.fullItemDescriptionVN || '');
    formDataToSend.append('oldSapCode', formData.oldSapCode || '');
    formDataToSend.append('hanaSapCode', formData.hanaSapCode || '');
    formDataToSend.append('departmentRequisitions', JSON.stringify(departmentRequisitions));
    formDataToSend.append('orderQty', parseFloat(formData.orderQty) || 0);
    formDataToSend.append('reason', formData.reason || '');
    formDataToSend.append('remark', formData.remark || '');
    formDataToSend.append('remarkComparison', formData.remarkComparison || '');
    formDataToSend.append('supplierId', formData.supplierId || '');
    formDataToSend.append('groupId', formData.groupId || '');
    formDataToSend.append('productType1Id', formData.productType1Id || '');
    formDataToSend.append('productType2Id', formData.productType2Id || '');
    formDataToSend.append('unit', formData.unit || '');
    formDataToSend.append('supplierPrice', formData.supplierPrice || 0);
    files.forEach(f => formDataToSend.append('files', f));

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/create`, {
        method: 'POST',
        headers: { 'accept': '*/*' },
        body: formDataToSend,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Add failed');
      onClose?.('Added successfully!');
      onRefresh?.();
    } catch (err) {
      setErrorMessage(err.message || 'Add failed');
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
          Add Request
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>

            {currencyError && <Alert severity="warning">{currencyError}</Alert>}

            <Stack direction="row" spacing={2}>
              <TextField label="Old SAP Code" value={formData.oldSapCode} onChange={handleChange('oldSapCode')} size="small" fullWidth />
              <TextField label="Hana SAP Code" value={formData.hanaSapCode} onChange={handleChange('hanaSapCode')} size="small" fullWidth />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Item Description (VN) *"
                value={formData.itemDescriptionVN}
                onChange={handleChange('itemDescriptionVN')}
                size="small"
                fullWidth
                required
                autoFocus
              />
              <TextField
                label="Item Description (EN)"
                value={formData.itemDescriptionEN}
                onChange={handleChange('itemDescriptionEN')}
                size="small"
                fullWidth
                disabled={translating}
                InputProps={{ endAdornment: translating ? <CircularProgress size={16} /> : null }}
              />
            </Stack>

            <TextField
              label="Full Item Description (VN)"
              value={formData.fullItemDescriptionVN}
              onChange={handleChange('fullItemDescriptionVN')}
              size="small"
              fullWidth
              multiline
              rows={2}
            />

            {/* TRUYỀN itemNo = Item Description (VN) */}
            {showSupplierSelector ? (
              <SupplierSelector
                oldSapCode={formData.oldSapCode}
                itemNo={itemNoForSupplier}  // ĐÚNG YÊU CẦU CỦA BẠN
                onSelectSupplier={handleSelectSupplier}
                currency={groupCurrency}
                disabled={loadingCurrency}
              />
            ) : selectedSupplier ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography fontWeight="bold">Selected Supplier:</Typography>
                <Typography>Supplier: {selectedSupplier.supplierName}</Typography>
                <Typography>SAP Code: {selectedSupplier.sapCode}</Typography>
                <Typography>Price: {(selectedSupplier.price || 0).toLocaleString('vi-VN', { style: 'currency', currency: groupCurrency })}</Typography>
                <Typography>Unit: {selectedSupplier.unit || '-'}</Typography>
                <Button variant="outlined" size="small" onClick={() => setShowSupplierSelector(true)} sx={{ mt: 1 }}>
                  Change Supplier
                </Button>
              </Paper>
            ) : null}

            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Department Request Qty:</Typography>
              {deptRows.map((row, i) => (
                <Stack direction="row" spacing={2} alignItems="center" key={i} sx={{ mt: 1 }}>
                  <FormControl fullWidth size="small" error={!!deptErrors[i]}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={row.department}
                      label="Department"
                      onChange={(e) => handleDeptChange(i, 'department', e.target.value)}
                      disabled={loadingDepartments}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {departmentList.map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                      ))}
                    </Select>
                    {deptErrors[i] && <FormHelperText>{deptErrors[i]}</FormHelperText>}
                  </FormControl>
                  <TextField label="Qty" type="number" size="small" value={row.qty} onChange={(e) => handleDeptChange(i, 'qty', e.target.value)} />
                  <TextField
                    label="Buy"
                    type="number"
                    size="small"
                    value={row.buy || ''}
                    disabled
                    InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}
                  />
                  <IconButton onClick={() => handleDeleteDeptRow(i)} color="error"><DeleteIcon /></IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleAddDeptRow} variant="outlined" size="small" sx={{ mt: 1 }}>
                Add Department
              </Button>

              <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                  <Typography><strong>Total Qty:</strong> <span style={{ color: '#1976d2' }}>{calcTotalRequestQty()}</span></Typography>
                  <Typography><strong>Total Buy:</strong> <span style={{ color: '#1976d2' }}>{calcTotalBuy()}</span></Typography>
                  <Typography><strong>Unit:</strong> {formData.unit || '-'}</Typography>
                  <Typography><strong>Price:</strong> {(formData.supplierPrice || 0).toLocaleString('vi-VN', { style: 'currency', currency: groupCurrency })}</Typography>
                </Stack>
              </Box>
            </Paper>

            <TextField
              label="Order Q'ty"
              type="number"
              value={formData.orderQty}
              onChange={handleChange('orderQty')}
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              error={!!orderQtyError}
              helperText={orderQtyError || `Total request: ${totalRequestQty}`}
            />

            <TextField label="Reason" value={formData.reason} onChange={handleChange('reason')} size="small" fullWidth multiline rows={2} />
            <TextField label="Remark" value={formData.remark} onChange={handleChange('remark')} size="small" fullWidth multiline rows={2} />

            <FormControl fullWidth size="small">
              <InputLabel>Remark Comparison</InputLabel>
              <Select value={formData.remarkComparison} label="Remark Comparison" onChange={handleChange('remarkComparison')}>
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value="Old price">Old price</MenuItem>
                <MenuItem value="The goods heavy and Small Q'ty. Only 1 Supplier can provide this type">The goods heavy and Small Q'ty. Only 1 Supplier can provide this type</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <InputLabel sx={{ mb: 1 }}>Images (Max 10)</InputLabel>
              <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                Choose Images
                <input hidden multiple accept="image/*" type="file" onChange={handleFileChange} />
              </Button>
              {files.length > 0 && <Typography variant="body2" sx={{ mt: 1 }}>{files.length} image(s) selected</Typography>}
              {previews.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {previews.map((url, i) => (
                    <Box key={i} sx={{ position: 'relative' }}>
                      <img src={url} alt="" style={{ height: 120, borderRadius: 4, border: '1px solid #ddd' }} />
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)' }} onClick={() => handleRemoveFile(i)}>
                        <CloseIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddClick}
            disabled={saving || deptErrors.some(Boolean) || !!orderQtyError}
          >
            {saving ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Add Request</DialogTitle>
        <DialogContent>
          <Typography>Are you sure to add request for "<strong>{formData.itemDescriptionVN || 'Unknown'}</strong>"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={errorOpen} autoHideDuration={6000} onClose={() => setErrorOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setErrorOpen(false)}>{errorMessage}</Alert>
      </Snackbar>
    </>
  );
}