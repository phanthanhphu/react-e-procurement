import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Typography, Paper,
  IconButton, FormHelperText, Box, Snackbar, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL } from '../../config';
import SupplierSelector from './SupplierSelector';
import { debounce } from 'lodash';

const normalizeCurrencyCode = (code) => {
  const valid = ['VND', 'USD', 'EUR', 'JPY', 'GBP'];
  const map = { EURO: 'EUR' };
  if (!code) return 'VND';
  const n = map[code.toUpperCase()] || code.toUpperCase();
  return valid.includes(n) ? n : 'VND';
};

export default function AddRequisitionMonthly({ open, onClose, onRefresh, groupId }) {
  const defaultFormData = {
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullDescription: '',
    oldSAPCode: '',
    hanaSAPCode: '',
    dailyMedInventory: '',
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
  const [deptErrors, setDeptErrors] = useState(['']); // lỗi trùng phòng
  const [saving, setSaving] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [translating, setTranslating] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(true);
  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);
  const [groupCurrency, setGroupCurrency] = useState('VND');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [itemNoForSearch, setItemNoForSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setItemNoForSearch(formData.itemDescriptionVN.trim());
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.itemDescriptionVN]);

  const totalRequestQty = deptRows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);

  const orderQtyError = formData.dailyMedInventory && totalRequestQty > 0 &&
    parseFloat(formData.dailyMedInventory) > totalRequestQty
      ? `Confirmed MED Quantity cannot exceed total request (${totalRequestQty})`
      : '';

  const autoAllocateBuy = useCallback((rows, confirmedInput) => {
    const confirmed = parseFloat(confirmedInput) || 0;
    if (confirmed <= 0 || totalRequestQty === 0) {
      return rows.map(r => ({ ...r, buy: '' }));
    }
    const effective = Math.min(confirmed, totalRequestQty);

    const sorted = rows
      .map((r, i) => ({ ...r, idx: i }))
      .filter(r => parseFloat(r.qty) > 0)
      .sort((a, b) => (parseFloat(a.qty) || 0) - (parseFloat(b.qty) || 0) || a.idx - b.idx);

    const allocated = {};
    let remain = effective;
    for (const row of sorted) {
      if (remain <= 0) break;
      const req = parseFloat(row.qty) || 0;
      const give = Math.min(req, remain);
      allocated[row.id] = give;
      remain -= give;
    }

    return rows.map(row => ({
      ...row,
      buy: allocated[row.id] !== undefined ? allocated[row.id].toString() : ''
    }));
  }, [totalRequestQty]);

  useEffect(() => {
    if (!orderQtyError && formData.dailyMedInventory) {
      setDeptRows(prev => autoAllocateBuy(prev, formData.dailyMedInventory));
    } else {
      setDeptRows(prev => prev.map(r => ({ ...r, buy: '' })));
    }
  }, [formData.dailyMedInventory, autoAllocateBuy, orderQtyError]);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    try {
      const [currencyRes, deptRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`),
        fetch(`${API_BASE_URL}/api/departments`)
      ]);
      if (currencyRes.ok) {
        const c = await currencyRes.json();
        setGroupCurrency(normalizeCurrencyCode(c.currency));
      }
      if (deptRes.ok) {
        const d = await deptRes.json();
        setDepartmentList(d || []);
      }
    } catch (err) {
      console.error(err);
      setGroupCurrency('VND');
    }
  }, [groupId]);

  useEffect(() => {
    if (open) {
      fetchData();
      setFormData({ ...defaultFormData, groupId });
      setDeptRows([{ id: '', name: '', qty: '', buy: '' }]);
      setDeptErrors(['']);
      setFiles([]);
      setPreviews(p => { p.forEach(URL.revokeObjectURL); return []; });
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      setIsEnManuallyEdited(false);
      setItemNoForSearch('');
      setConfirmOpen(false);
    }
  }, [open, groupId, fetchData]);

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
    } catch { }
    finally { setTranslating(false); }
  };

  const debouncedTranslate = useCallback(debounce(translateText, 600), [isEnManuallyEdited]);

  useEffect(() => {
    if (formData.itemDescriptionVN && !isEnManuallyEdited) {
      debouncedTranslate(formData.itemDescriptionVN);
    }
  }, [formData.itemDescriptionVN, debouncedTranslate]);

  const handleSelectSupplier = (supplierData) => {
    if (!supplierData) {
      setFormData(prev => ({
        ...prev,
        oldSAPCode: '', supplierId: '', unit: '', supplierPrice: 0,
        productType1Id: '', productType2Id: ''
      }));
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      return;
    }

    const price = parseFloat(supplierData.supplierPrice) || 0;

    setFormData(prev => ({
      ...prev,
      oldSAPCode: supplierData.oldSapCode || '',
      supplierId: supplierData.supplierId || '',
      unit: supplierData.unit || '',
      supplierPrice: price,
      productType1Id: supplierData.productType1Id || '',
      productType2Id: supplierData.productType2Id || '',
    }));

    setSelectedSupplier({
      supplierName: supplierData.supplierName || 'Unknown',
      sapCode: supplierData.oldSapCode || '',
      price: price,
      unit: supplierData.unit || '',
      currency: supplierData.currency || groupCurrency,
    });

    setShowSupplierSelector(false);
  };

  const handleChange = (field) => (e) => {
    const val = ['dailyMedInventory'].includes(field)
      ? e.target.value === '' ? '' : parseFloat(e.target.value) || ''
      : e.target.value;
    setFormData(prev => ({ ...prev, [field]: val }));
    if (field === 'itemDescriptionEN') setIsEnManuallyEdited(true);
    if (field === 'itemDescriptionVN') setIsEnManuallyEdited(false);
  };

  // CHỈ SỬA HÀM NÀY: KIỂM TRA TRÙNG PHÒNG VÀ CẬP NHẬT LỖI NGAY
  const handleDeptChange = (i, field, val) => {
    const updated = [...deptRows];
    if (field === 'id') {
      const dept = departmentList.find(d => d.id === val);
      updated[i] = { ...updated[i], id: val, name: dept?.departmentName || '' };
    } else {
      updated[i][field] = val;
    }
    setDeptRows(updated);

    // Tính lỗi trùng phòng – hiện đỏ ngay dưới ô
    const errors = updated.map((row, idx) => {
      if (!row.id) return '';
      const isDuplicate = updated.some((r, index) => r.id === row.id && index !== idx);
      return isDuplicate ? 'This department is already selected' : '';
    });
    setDeptErrors(errors);
  };

  const handleAddDeptRow = () => {
    setDeptRows([...deptRows, { id: '', name: '', qty: '', buy: '' }]);
    setDeptErrors([...deptErrors, '']);
  };

  const handleDeleteDeptRow = (i) => {
    setDeptRows(deptRows.filter((_, idx) => idx !== i));
    setDeptErrors(deptErrors.filter((_, idx) => idx !== i));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10 - files.length);
    const valid = selected.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length < selected.length) {
      setSnackbarMessage('Only images ≤ 5MB allowed');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
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
    if (!formData.itemDescriptionVN?.trim()) {
      setSnackbarMessage('Item Description (VN) is required');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (totalRequestQty === 0) {
      setSnackbarMessage('At least one department must have Qty');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (orderQtyError) {
      setSnackbarMessage(orderQtyError);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    // Kiểm tra trùng phòng trước khi mở confirm
    if (deptErrors.some(Boolean)) {
      setSnackbarMessage('Please fix duplicate department selections');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmAdd = async () => {
    const departmentRequisitions = deptRows
      .filter(r => r.id && r.qty)
      .map(r => ({
        id: r.id,
        name: r.name,
        qty: parseFloat(r.qty) || 0,
        buy: parseFloat(r.buy) || 0,
      }));

    const formDataToSend = new FormData();
    formDataToSend.append('itemDescriptionEN', formData.itemDescriptionEN || '');
    formDataToSend.append('itemDescriptionVN', formData.itemDescriptionVN || '');
    formDataToSend.append('fullDescription', formData.fullDescription || '');
    formDataToSend.append('oldSAPCode', formData.oldSAPCode || '');
    formDataToSend.append('hanaSAPCode', formData.hanaSAPCode || '');
    formDataToSend.append('dailyMedInventory', parseFloat(formData.dailyMedInventory) || 0);
    formDataToSend.append('reason', formData.reason || '');
    formDataToSend.append('remark', formData.remark || '');
    formDataToSend.append('remarkComparison', formData.remarkComparison || '');
    formDataToSend.append('supplierId', formData.supplierId || '');
    formDataToSend.append('groupId', groupId || '');
    formDataToSend.append('departmentRequisitions', JSON.stringify(departmentRequisitions));
    files.forEach(f => formDataToSend.append('files', f));

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/requisition-monthly`, {
        method: 'POST',
        headers: { accept: '*/*' },
        body: formDataToSend,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Add failed');
      }
      setSnackbarMessage('Added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      onRefresh?.();
      onClose();
    } catch (err) {
      setSnackbarMessage(err.message || 'Add failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          Add Monthly Requisition
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Old SAP Code" value={formData.oldSAPCode} onChange={handleChange('oldSAPCode')} size="small" fullWidth />
              <TextField label="Hana SAP Code" value={formData.hanaSAPCode} onChange={handleChange('hanaSAPCode')} size="small" fullWidth />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField label="Item Description (VN) *" value={formData.itemDescriptionVN} onChange={handleChange('itemDescriptionVN')} size="small" fullWidth required />
              <TextField label="Item Description (EN)" value={formData.itemDescriptionEN} onChange={handleChange('itemDescriptionEN')} size="small" fullWidth disabled={translating} InputProps={{ endAdornment: translating ? <CircularProgress size={16} /> : null }} />
            </Stack>

            <TextField label="Full Description" value={formData.fullDescription} onChange={handleChange('fullDescription')} size="small" fullWidth multiline rows={2} />

            {showSupplierSelector ? (
              <SupplierSelector
                oldSapCode={formData.oldSAPCode}
                itemNo={itemNoForSearch}
                onSelectSupplier={handleSelectSupplier}
                currency={groupCurrency}
              />
            ) : selectedSupplier ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Selected Supplier:</Typography>
                <Typography><strong>{selectedSupplier.supplierName}</strong></Typography>
                <Typography>SAP Code: <strong>{selectedSupplier.sapCode || '—'}</strong></Typography>
                <Typography>
                  Price: <strong>
                    {selectedSupplier.price > 0
                      ? selectedSupplier.price.toLocaleString('vi-VN', { style: 'currency', currency: selectedSupplier.currency || groupCurrency })
                      : '—'}
                  </strong>
                </Typography>
                <Typography>Unit: <strong>{selectedSupplier.unit || '—'}</strong></Typography>
                <Button size="small" variant="outlined" onClick={() => setShowSupplierSelector(true)} sx={{ mt: 1 }}>
                  Change Supplier
                </Button>
              </Paper>
            ) : null}

            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Department Request Qty:</Typography>
              {deptRows.map((row, i) => (
                <Stack direction="row" spacing={2} alignItems="center" key={i} sx={{ mt: 1 }}>
                  {/* CHỈ SỬA ĐOẠN NÀY: HIỆN LỖI ĐỎ DƯỚI Ô */}
                  <FormControl fullWidth size="small" error={!!deptErrors[i]}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={row.id}
                      label="Department"
                      onChange={(e) => handleDeptChange(i, 'id', e.target.value)}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {departmentList.map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                      ))}
                    </Select>
                    {deptErrors[i] && <FormHelperText>{deptErrors[i]}</FormHelperText>}
                  </FormControl>

                  <TextField label="Qty" type="number" size="small" value={row.qty} onChange={(e) => handleDeptChange(i, 'qty', e.target.value)} />
                  <TextField label="Buy" type="number" size="small" value={row.buy || ''} disabled sx={{ bgcolor: '#f5f5f5' }} />
                  <IconButton onClick={() => handleDeleteDeptRow(i)} color="error"><DeleteIcon /></IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleAddDeptRow} variant="outlined" size="small" sx={{ mt: 1 }}>Add Department</Button>

              <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                  <Typography><strong>Total Request:</strong> <span style={{ color: '#1976d2' }}>{totalRequestQty}</span></Typography>
                  <Typography><strong>Total Buy:</strong> <span style={{ color: '#1976d2' }}>{formData.dailyMedInventory || 0}</span></Typography>
                  <Typography><strong>Unit:</strong> {formData.unit || '-'}</Typography>
                </Stack>
              </Box>
            </Paper>

            <TextField
              label="Confirmed MED Quantity *"
              type="number"
              value={formData.dailyMedInventory}
              onChange={handleChange('dailyMedInventory')}
              size="small"
              fullWidth
              error={!!orderQtyError}
              helperText={orderQtyError || `Total request: ${totalRequestQty}`}
              inputProps={{ min: 0 }}
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
          {/* Thêm kiểm tra trùng phòng để disable nút Add */}
          <Button
            variant="contained"
            onClick={handleAddClick}
            disabled={saving || !!orderQtyError || deptErrors.some(Boolean)}
          >
            {saving ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Add Requisition</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure to add "<strong>{formData.itemDescriptionVN || 'this item'}</strong>"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmAdd} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Confirm Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}