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
  const map = { EURO: 'EUR' };
  if (!code) return 'VND';
  const normalized = map[code.toUpperCase()] || code.toUpperCase();
  return ['VND', 'USD', 'EUR', 'JPY', 'GBP'].includes(normalized) ? normalized : 'VND';
};

export default function EditDialog({ open, item, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
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
    groupId: '',
    productType1Id: '',
    productType2Id: '',
    unit: '',
    supplierPrice: 0,
  });

  const [deptRows, setDeptRows] = useState([{ department: '', qty: '', buy: '' }]);
  const [deptErrors, setDeptErrors] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('VND');
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(true);
  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const totalRequestQty = deptRows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);

  const orderQtyError = formData.orderQty && totalRequestQty > 0 && parseFloat(formData.orderQty) > totalRequestQty
    ? `Order Q'ty cannot exceed total request (${totalRequestQty})`
    : '';

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
      buy: allocated[row.department] ?? ''
    }));
  }, [totalRequestQty]);

  useEffect(() => {
    if (!orderQtyError) {
      setDeptRows(prev => autoAllocateBuy(prev, formData.orderQty));
    }
  }, [formData.orderQty, autoAllocateBuy, orderQtyError]);

  const fetchGroupCurrency = useCallback(async () => {
    if (!item?.requisition?.groupId) return setGroupCurrency('VND');
    setLoadingCurrency(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/${item.requisition.groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupCurrency(normalizeCurrencyCode(data.currency));
      }
    } catch {
      setGroupCurrency('VND');
    } finally {
      setLoadingCurrency(false);
    }
  }, [item]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`);
      if (!res.ok) throw new Error('Load failed');
      const data = await res.json();

      setFormData({
        itemDescriptionEN: data.itemDescriptionEN || '',
        itemDescriptionVN: data.itemDescriptionVN || '',
        fullItemDescriptionVN: data.fullDescription || '',
        oldSapCode: data.oldSAPCode || '',
        hanaSapCode: data.hanaSAPCode || '',
        orderQty: data.orderQty?.toString() || '',
        reason: data.reason || '',
        remark: data.remark || '',
        remarkComparison: data.remarkComparison || '',
        supplierId: data.supplierId || '',
        groupId: data.groupId || '',
        productType1Id: data.productType1Id || '',
        productType2Id: data.productType2Id || '',
        unit: data.unit || '',
        supplierPrice: data.price || 0,
      });

      const depts = (data.departmentRequisitions || []).map(d => ({
        department: d.id ? String(d.id) : '',
        qty: d.qty ? String(d.qty) : '',
        buy: d.buy ? String(d.buy) : '',
      }));

      if (depts.length === 0) depts.push({ department: '', qty: '', buy: '' });

      setDeptRows(depts);
      setDeptErrors(new Array(depts.length).fill(''));

      setImageUrls(data.imageUrls || []);
      setFiles([]);
      setPreviews([]);
      setImagesToDelete([]);

      if (data.supplierId) {
        setSelectedSupplier({
          supplierName: data.supplierName || '',
          sapCode: data.oldSAPCode || '',
          price: data.price || 0,
          unit: data.unit || '',
        });
        setShowSupplierSelector(false);
      } else {
        setShowSupplierSelector(true);
      }

      setIsEnManuallyEdited(false);
    } catch (err) {
      setErrorMessage('Failed to load data');
      setErrorOpen(true);
    }
  };

  const fetchDepartmentList = async () => {
    setLoadingDepartments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`);
      const data = await res.json();
      setDepartmentList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    if (open && item?.requisition?.id) {
      fetchData();
      fetchGroupCurrency();
      fetchDepartmentList();
    } else {
      // reset khi đóng
      setFormData(prev => ({ ...prev, orderQty: '', oldSapCode: '', itemDescriptionVN: '' }));
      setDeptRows([{ department: '', qty: '', buy: '' }]);
      setDeptErrors(['']);
      setFiles([]);
      setPreviews([]);
      setImageUrls([]);
      setImagesToDelete([]);
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
    }
  }, [open, item]);

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
        const data = await res.json();
        setFormData(prev => ({ ...prev, itemDescriptionEN: data.translatedText || '' }));
      }
    } catch { }
    finally { setTranslating(false); }
  };

  const debouncedTranslate = useCallback(debounce(translateText, 600), [isEnManuallyEdited]);

  useEffect(() => {
    if (formData.itemDescriptionVN && !isEnManuallyEdited) {
      debouncedTranslate(formData.itemDescriptionVN);
    }
  }, [formData.itemDescriptionVN, debouncedTranslate]);

  const itemNoForSupplier = formData.itemDescriptionVN.trim();

  const handleSelectSupplier = (supplierData) => {
    if (supplierData) {
      setFormData(prev => ({
        ...prev,
        fullItemDescriptionVN: supplierData.fullItemDescriptionVN || '',
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
        productType1Id: '', productType2Id: '', fullItemDescriptionVN: ''
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
    const newRows = [...deptRows];
    newRows[index][field] = value;
    setDeptRows(newRows);

    const newErrors = newRows.map((row, i) => {
      if (i === index && field === 'department' && value) {
        const dup = newRows.some((r, j) => j !== i && r.department === value && r.department);
        return dup ? 'This department is already selected' : '';
      }
      return '';
    });
    setDeptErrors(newErrors);
  };

  const handleAddDeptRow = () => {
    setDeptRows([...deptRows, { department: '', qty: '', buy: '' }]);
    setDeptErrors([...deptErrors, '']);
  };

  const handleDeleteDeptRow = (index) => {
    setDeptRows(deptRows.filter((_, i) => i !== index));
    setDeptErrors(deptErrors.filter((_, i) => i !== index));
  };

  const calcTotalRequestQty = () => deptRows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
  const calcTotalBuy = () => deptRows.reduce((s, r) => s + (parseFloat(r.buy) || 0), 0);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
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

  const handleRemoveFile = (index) => {
    if (index < imageUrls.length) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
      setImagesToDelete(prev => [...prev, imageUrls[index]]);
    } else {
      const i = index - imageUrls.length;
      URL.revokeObjectURL(previews[i]);
      setFiles(files.filter((_, j) => j !== i));
      setPreviews(previews.filter((_, j) => j !== i));
    }
  };

  const handleSaveClick = () => {
    if (!formData.itemDescriptionVN) return setErrorMessage('Item Description (VN) is required'), setErrorOpen(true);
    if (totalRequestQty === 0) return setErrorMessage('At least one department must have Qty'), setErrorOpen(true);
    if (orderQtyError) return setErrorMessage(orderQtyError), setErrorOpen(true);
    const deptIds = deptRows.filter(r => r.department).map(r => r.department);
    if (new Set(deptIds).size !== deptIds.length) return setErrorMessage('Duplicate departments'), setErrorOpen(true);
    setOpenConfirmDialog(true);
  };

  const handleSave = async () => {
    const departmentRequisitions = deptRows
      .filter(r => r.department && r.qty)
      .map(r => ({
        id: r.department,
        name: departmentList.find(d => d.id === r.department)?.departmentName || '',
        qty: parseFloat(r.qty) || 0,
        buy: parseFloat(r.buy) || 0,
      }));

    const fd = new FormData();
    fd.append('englishName', formData.itemDescriptionEN || '');
    fd.append('vietnameseName', formData.itemDescriptionVN || '');
    fd.append('fullDescription', formData.fullItemDescriptionVN || '');
    fd.append('oldSapCode', formData.oldSapCode || '');
    fd.append('hanaSapCode', formData.hanaSapCode || '');
    fd.append('departmentRequisitions', JSON.stringify(departmentRequisitions));
    fd.append('orderQty', parseFloat(formData.orderQty) || 0);
    fd.append('reason', formData.reason || '');
    fd.append('remark', formData.remark || '');
    fd.append('remarkComparison', formData.remarkComparison || '');
    fd.append('supplierId', formData.supplierId || '');
    fd.append('groupId', formData.groupId || '');
    fd.append('productType1Id', formData.productType1Id || '');
    fd.append('productType2Id', formData.productType2Id || '');
    fd.append('unit', formData.unit || '');
    fd.append('supplierPrice', formData.supplierPrice || 0);
    files.forEach(f => fd.append('files', f));
    fd.append('imagesToDelete', JSON.stringify(imagesToDelete));

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`, {
        method: 'PUT',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }
      onClose?.('Updated successfully!');
      onRefresh?.();
    } catch (err) {
      setErrorMessage(err.message || 'Update failed');
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          Edit Request
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>

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

            {showSupplierSelector ? (
              <SupplierSelector
                oldSapCode={formData.oldSapCode}
                itemNo={itemNoForSupplier}
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
                        <MenuItem key={d.id} value={String(d.id)}>{d.departmentName}</MenuItem>
                      ))}
                    </Select>
                    {deptErrors[i] && <FormHelperText>{deptErrors[i]}</FormHelperText>}
                  </FormControl>

                  <TextField label="Qty" type="number" size="small" value={row.qty} onChange={e => handleDeptChange(i, 'qty', e.target.value)} />

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
              {(files.length + imageUrls.length - imagesToDelete.length) > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {files.length + imageUrls.length - imagesToDelete.length} image(s)
                </Typography>
              )}
              {(previews.length > 0 || imageUrls.length > 0) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {imageUrls.map((url, i) => (
                    <Box key={`old-${i}`} sx={{ position: 'relative' }}>
                      <img src={`${API_BASE_URL}${url}`} alt="" style={{ height: 120, borderRadius: 4, border: '1px solid #ddd' }} />
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)' }} onClick={() => handleRemoveFile(i)}>
                        <CloseIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  ))}
                  {previews.map((url, i) => (
                    <Box key={`new-${i}`} sx={{ position: 'relative' }}>
                      <img src={url} alt="" style={{ height: 120, borderRadius: 4, border: '1px solid #ddd' }} />
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)' }} onClick={() => handleRemoveFile(i + imageUrls.length)}>
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
            onClick={handleSaveClick}
            disabled={saving || deptErrors.some(Boolean) || !!orderQtyError}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Edit</DialogTitle>
        <DialogContent>
          <Typography>Are you sure to save changes for "<strong>{formData.itemDescriptionVN || 'this item'}</strong>"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={errorOpen} autoHideDuration={6000} onClose={() => setErrorOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setErrorOpen(false)}>{errorMessage}</Alert>
      </Snackbar>
    </>
  );
}