import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

export default function EditRequisitionMonthly({ open, item, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
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
    groupId: '',
    unit: '',
    supplierPrice: 0,
  });

  const [deptRows, setDeptRows] = useState([{ id: '', name: '', qty: '', buy: '' }]);
  const [deptErrors, setDeptErrors] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [translating, setTranslating] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(true);
  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);
  const [groupCurrency, setGroupCurrency] = useState('VND');
  const [confirmOpen, setConfirmOpen] = useState(false);          // ← ĐÃ SỬA
  const [itemNoForSearch, setItemNoForSearch] = useState('');

  // Ngăn infinite loop khi Confirmed MED không đổi
  const prevConfirmedRef = useRef('');

  // Tổng số lượng yêu cầu
  const totalRequestQty = useMemo(() => {
    return deptRows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0);
  }, [deptRows]);

  const orderQtyError = formData.dailyMedInventory && totalRequestQty > 0 &&
    parseFloat(formData.dailyMedInventory) > totalRequestQty
      ? `Confirmed MED Quantity cannot exceed total request (${totalRequestQty})`
      : '';

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // AUTO ALLOCATE BUY – HOÀN HẢO, chạy khi thay đổi Confirmed hoặc các dòng phòng ban
  useEffect(() => {
    const currentConfirmedStr = formData.dailyMedInventory || '';
    const currentConfirmed = parseFloat(currentConfirmedStr) || 0;

    // Nếu Confirmed không đổi → bỏ qua (ngăn loop)
    if (currentConfirmedStr === prevConfirmedRef.current) {
      return;
    }
    prevConfirmedRef.current = currentConfirmedStr;

    // Reset buy nếu không hợp lệ
    if (!currentConfirmedStr || isNaN(currentConfirmed) || currentConfirmed <= 0) {
      setDeptRows(prev => {
        const hasBuy = prev.some(r => r.buy && r.buy !== '');
        return hasBuy ? prev.map(r => ({ ...r, buy: '' })) : prev;
      });
      return;
    }

    // Nếu Confirmed > Total Request → xóa buy (cảnh báo ở dưới)
    if (currentConfirmed > totalRequestQty) {
      setDeptRows(prev => {
        const hasBuy = prev.some(r => r.buy && r.buy !== '');
        return hasBuy ? prev.map(r => ({ ...r, buy: '' })) : prev;
      });
      return;
    }

    // CHIA LẠI BUY THEO QTY MỚI
    setDeptRows(prev => {
      const validRows = prev
        .map((r, i) => ({ ...r, qtyNum: parseFloat(r.qty) || 0, idx: i }))
        .filter(r => r.qtyNum > 0);

      if (validRows.length === 0) return prev;

      // Ưu tiên chia cho khoa có Qty ít hơn trước (công bằng + ổn định)
      validRows.sort((a, b) => a.qtyNum - b.qtyNum || a.idx - b.idx);

      let remaining = currentConfirmed;
      const newRows = [...prev];
      let hasChanged = false;

      validRows.forEach(row => {
        if (remaining <= 0) return;
        const allocate = Math.min(row.qtyNum, remaining);
        const newBuyStr = allocate.toString();

        if (newRows[row.idx].buy !== newBuyStr) {
          newRows[row.idx] = { ...newRows[row.idx], buy: newBuyStr };
          hasChanged = true;
        }
        remaining -= allocate;
      });

      // Xóa buy ở các dòng không hợp lệ
      prev.forEach((row, i) => {
        const isValid = validRows.some(v => v.idx === i);
        if (!isValid && row.buy !== '') {
          newRows[i] = { ...newRows[i], buy: '' };
          hasChanged = true;
        }
      });

      return hasChanged ? newRows : prev;
    });
  }, [formData.dailyMedInventory, deptRows]); // ← chạy khi Confirmed hoặc deptRows thay đổi

  // Load dữ liệu khi mở dialog
  useEffect(() => {
    if (!open || !item?.id) {
      setDeptRows([{ id: '', name: '', qty: '', buy: '' }]);
      setDeptErrors(['']);
      setImageUrls([]);
      setImagesToDelete([]);
      setFiles([]);
      setPreviews([]);
      prevConfirmedRef.current = '';
      return;
    }

    const loadData = async () => {
      try {
        const [reqRes, deptRes, groupRes] = await Promise.all([
          fetch(`${API_BASE_URL}/requisition-monthly/${item.id}`),
          fetch(`${API_BASE_URL}/api/departments`),
          fetch(`${API_BASE_URL}/api/group-summary-requisitions/${item.groupId || ''}`).catch(() => ({ ok: false }))
        ]);

        if (!reqRes.ok) throw new Error('Failed to load requisition');
        const data = await reqRes.json();

        setFormData({
          itemDescriptionEN: data.itemDescriptionEN || '',
          itemDescriptionVN: data.itemDescriptionVN || '',
          fullDescription: data.fullDescription || '',
          oldSAPCode: data.oldSAPCode || '',
          hanaSAPCode: data.hanaSAPCode || '',
          dailyMedInventory: data.dailyMedInventory?.toString() || '',
          reason: data.reason || '',
          remark: data.remark || '',
          remarkComparison: data.remarkComparison || '',
          supplierId: data.supplierId || '',
          groupId: data.groupId || '',
          unit: data.unit || '',
          supplierPrice: parseFloat(data.price) || 0,
        });

        prevConfirmedRef.current = data.dailyMedInventory?.toString() || '';

        const depts = (data.departmentRequisitions || []).map(d => ({
          id: d.id || '',
          name: d.name || '',
          qty: d.qty?.toString() || '',
          buy: d.buy?.toString() || '',
        }));

        setDeptRows(depts.length > 0 ? depts : [{ id: '', name: '', qty: '', buy: '' }]);
        setDeptErrors(new Array(depts.length || 1).fill(''));

        setImageUrls(data.imageUrls || []);
        setImagesToDelete([]);
        setFiles([]);
        setPreviews([]);

        setSelectedSupplier(data.supplierId ? {
          supplierName: data.supplierName || 'Unknown',
          sapCode: data.oldSAPCode || '',
          price: parseFloat(data.price) || 0,
          unit: data.unit || '',
        } : null);

        setShowSupplierSelector(!data.supplierId);
        setItemNoForSearch(data.itemDescriptionVN || '');

        if (deptRes.ok) {
          const deps = await deptRes.json();
          setDepartmentList(deps || []);
        }

        if (groupRes.ok) {
          const g = await groupRes.json();
          setGroupCurrency(normalizeCurrencyCode(g.currency));
        }
      } catch (err) {
        showSnackbar('Failed to load data', 'error');
      }
    };

    loadData();
  }, [open, item?.id, showSnackbar]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      previews.forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Dịch tự động VN → EN
  const translateText = async (text) => {
    if (!text || isEnManuallyEdited) return;
    setTranslating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/translate/vi-to-en`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const { translatedText } = await res.json();
        setFormData(prev => ({ ...prev, itemDescriptionEN: translatedText || '' }));
      }
    } catch { } finally {
      setTranslating(false);
    }
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
        oldSAPCode: '', supplierId: '', unit: '', supplierPrice: 0, fullDescription: ''
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
      fullDescription: supplierData.fullItemDescriptionVN || '',
    }));

    setSelectedSupplier({
      supplierName: supplierData.supplierName || 'Unknown',
      sapCode: supplierData.oldSapCode || '',
      price,
      unit: supplierData.unit || '',
    });
    setShowSupplierSelector(false);
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    const val = field === 'dailyMedInventory'
      ? value === '' ? '' : (isNaN(parseFloat(value)) ? '' : parseFloat(value).toString())
      : value;

    setFormData(prev => ({ ...prev, [field]: val }));
    if (field === 'itemDescriptionEN') setIsEnManuallyEdited(true);
    if (field === 'itemDescriptionVN') setIsEnManuallyEdited(false);
  };

  const handleDeptChange = (i, field, val) => {
    setDeptRows(prev => {
      const updated = [...prev];
      if (field === 'id') {
        const dept = departmentList.find(d => d.id === val);
        updated[i] = { ...updated[i], id: val, name: dept?.departmentName || '' };
      } else {
        updated[i] = { ...updated[i], [field]: val };
      }
      return updated;
    });

    // Kiểm tra trùng khoa
    setDeptErrors(prev => {
      const errors = prev.map(() => '');
      deptRows.forEach((row, idx) => {
        if (row.id && deptRows.filter((r, j) => r.id === row.id && j !== idx).length > 0) {
          errors[idx] = 'This department is already selected';
        }
      });
      return errors;
    });
  };

  const handleAddDeptRow = () => {
    setDeptRows(prev => [...prev, { id: '', name: '', qty: '', buy: '' }]);
    setDeptErrors(prev => [...prev, '']);
  };

  const handleDeleteDeptRow = (i) => {
    setDeptRows(prev => prev.filter((_, idx) => idx !== i));
    setDeptErrors(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length === 0) return;

    const valid = selected.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length < selected.length) {
      showSnackbar('Only image files ≤ 5MB are allowed', 'warning');
      return;
    }

    const totalCurrent = files.length + imageUrls.length - imagesToDelete.length;
    if (totalCurrent + valid.length > 10) {
      showSnackbar('Maximum 10 images allowed', 'warning');
      return;
    }

    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    e.target.value = null;
  };

  const handleRemoveImage = (index) => {
    if (index < imageUrls.length) {
      const removed = imageUrls[index];
      setImageUrls(prev => prev.filter((_, i) => i !== index));
      setImagesToDelete(prev => [...prev, removed]);
    } else {
      const fileIdx = index - imageUrls.length;
      if (fileIdx >= 0 && fileIdx < previews.length) {
        URL.revokeObjectURL(previews[fileIdx]);
        setFiles(prev => prev.filter((_, i) => i !== fileIdx));
        setPreviews(prev => prev.filter((_, i) => i !== fileIdx));
      }
    }
  };

  const handleSaveClick = () => {
    if (!formData.itemDescriptionVN?.trim()) return showSnackbar('Item Description (VN) is required', 'error');
    if (totalRequestQty === 0) return showSnackbar('At least one department must have Qty', 'error');
    if (orderQtyError) return showSnackbar(orderQtyError, 'error');
    if (deptErrors.some(Boolean)) return showSnackbar('Please fix duplicate departments', 'error');
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    const departmentRequisitions = deptRows
      .filter(r => r.id && r.qty)
      .map(r => ({
        id: r.id,
        name: r.name,
        qty: parseFloat(r.qty) || 0,
        buy: parseFloat(r.buy) || 0,
      }));

    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    fd.append('imagesToDelete', JSON.stringify(imagesToDelete));
    fd.append('departmentRequisitions', JSON.stringify(departmentRequisitions));
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v ?? ''));

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/requisition-monthly/${item.id}`, {
        method: 'PUT',
        body: fd,
      });
      if (!res.ok) throw new Error('Update failed');
      showSnackbar('Updated successfully!', 'success');
      onRefresh?.();
      onClose();
    } catch (err) {
      showSnackbar(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          Edit Monthly Requisition
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Old SAP Code" value={formData.oldSAPCode} onChange={handleChange('oldSAPCode')} size="small" fullWidth />
              <TextField label="Hana SAP Code" value={formData.hanaSAPCode} onChange={handleChange('hanaSAPCode')} size="small" fullWidth />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField label="Item Description (VN) *" value={formData.itemDescriptionVN} onChange={handleChange('itemDescriptionVN')} size="small" fullWidth required />
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
                <Typography>Price: <strong>{selectedSupplier.price > 0 ? selectedSupplier.price.toLocaleString('vi-VN', { style: 'currency', currency: groupCurrency }) : '—'}</strong></Typography>
                <Typography>Unit: <strong>{selectedSupplier.unit || '—'}</strong></Typography>
                <Button size="small" variant="outlined" onClick={() => setShowSupplierSelector(true)} sx={{ mt: 1 }}>Change Supplier</Button>
              </Paper>
            ) : null}

            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Department Request Qty:</Typography>
              {deptRows.map((row, i) => (
                <Stack direction="row" spacing={2} alignItems="center" key={i} sx={{ mt: 1 }}>
                  <FormControl fullWidth size="small" error={!!deptErrors[i]}>
                    <InputLabel>Department</InputLabel>
                    <Select value={row.id} label="Department" onChange={(e) => handleDeptChange(i, 'id', e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {departmentList.map(d => <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>)}
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
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                  Choose Images
                  <input hidden multiple accept="image/*" type="file" onChange={handleFileChange} />
                </Button>
                {(files.length + imageUrls.length - imagesToDelete.length) > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {files.length + imageUrls.length - imagesToDelete.length} image(s)
                  </Typography>
                )}
              </Stack>

              {(previews.length > 0 || imageUrls.length > 0) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {imageUrls.map((url, i) => (
                    <Box key={`old-${i}`} sx={{ position: 'relative' }}>
                      <img
                        src={`${API_BASE_URL}${url}`}
                        alt={`Image ${i + 1}`}
                        style={{ height: 120, borderRadius: 8, border: '1px solid #ddd', objectFit: 'cover' }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)' }} onClick={() => handleRemoveImage(i)}>
                        <CloseIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  ))}
                  {previews.map((url, i) => (
                    <Box key={`new-${i}`} sx={{ position: 'relative' }}>
                      <img src={url} alt={`New ${i + 1}`} style={{ height: 120, borderRadius: 8, border: '1px solid #ddd', objectFit: 'cover' }} />
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)' }} onClick={() => handleRemoveImage(i + imageUrls.length)}>
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
          <Button variant="contained" onClick={handleSaveClick} disabled={saving || !!orderQtyError || deptErrors.some(Boolean)}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography>Are you sure to update "<strong>{formData.itemDescriptionVN || 'this item'}</strong>"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Confirm Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}