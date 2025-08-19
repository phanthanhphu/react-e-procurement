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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { API_BASE_URL } from '../../config';

export default function AddDialog({ open, onClose, onRefresh, groupId }) {
  const [formData, setFormData] = useState({
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullItemDescriptionVN: '',
    oldSapCode: '',
    newSapCode: '',
    unit: '',
    stock: '',
    purchasingSuggest: '',
    reason: '',
    remark: '',
    departmentRequestQty: {},
    supplierPrice: 0,
    supplierId: '',
    groupId: groupId || '',
  });

  const [deptRows, setDeptRows] = useState([{ department: '', qty: '' }]);
  const [saving, setSaving] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [formErrors, setFormErrors] = useState({
    oldSapCode: '',
    itemDescriptionVN: '',
    itemDescriptionEN: '',
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, groupId: groupId || '' }));
  }, [groupId]);

  const searchSupplier = (productFullName, sapCode) => {
    if (!productFullName.trim() && !sapCode.trim()) {
      setSupplierOptions([]);
      setSelectedSupplierId('');
      setSelectedSupplierName('');
      setFormData((prev) => ({ ...prev, supplierPrice: 0, unit: '', supplierId: '' }));
      return;
    }
    setSearchLoading(true);
    const queryParams = new URLSearchParams();
    if (productFullName.trim()) queryParams.append('productFullName', productFullName.trim());
    if (sapCode.trim()) queryParams.append('sapCode', sapCode.trim());

    fetch(`${API_BASE_URL}/api/supplier-products/search?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSupplierOptions(data || []);
      })
      .catch(() => setSupplierOptions([]))
      .finally(() => setSearchLoading(false));
  };

  useEffect(() => {
    searchSupplier(formData.itemDescriptionVN, formData.oldSapCode);
  }, [formData.itemDescriptionVN, formData.oldSapCode]);

  const handleSelectSupplier = (event) => {
    const selId = event.target.value;
    setSelectedSupplierId(selId);
    const sel = supplierOptions.find((opt) => opt.id === selId);
    if (sel) {
      setFormData((prev) => ({
        ...prev,
        itemDescriptionVN: sel.productFullName || '',
        itemDescriptionEN: sel.productShortName || '',
        fullItemDescriptionVN: sel.productFullName || '',
        oldSapCode: sel.sapCode || '',
        supplierPrice: sel.price || 0,
        unit: sel.unit || '',
        supplierId: sel.id,
      }));
      setSelectedSupplierName(sel.supplierName || '');
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleDeptChange = (index, field, value) => {
    const updated = [...deptRows];
    updated[index][field] = value;
    setDeptRows(updated);
  };

  const handleAddDeptRow = () => {
    setDeptRows([...deptRows, { department: '', qty: '' }]);
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

  const validateForm = () => {
    const errors = {};
    if (!formData.oldSapCode.trim()) errors.oldSapCode = 'Old SAP Code is required';
    if (!formData.itemDescriptionVN.trim()) errors.itemDescriptionVN = 'Item Description (VN) is required';
    if (!formData.itemDescriptionEN.trim()) errors.itemDescriptionEN = 'Item Description (EN) is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    if (!groupId) {
      alert('Group ID is missing.');
      return;
    }

    const deptQtyMap = {};
    deptRows.forEach((row) => {
      if (row.department && row.qty) {
        deptQtyMap[row.department] = parseFloat(row.qty);
      }
    });

    const totalRequestQty = Object.values(deptQtyMap).reduce((sum, val) => sum + val, 0);

    const payload = {
      ...formData,
      departmentRequestQty: deptQtyMap,
      totalRequestQty,
      totalPrice: totalRequestQty * (formData.supplierPrice || 0),
      groupId,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Add failed status ${res.status}`);

      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
      onClose();

      setFormData({
        itemDescriptionEN: '',
        itemDescriptionVN: '',
        fullItemDescriptionVN: '',
        oldSapCode: '',
        newSapCode: '',
        unit: '',
        stock: '',
        purchasingSuggest: '',
        reason: '',
        remark: '',
        departmentRequestQty: {},
        supplierPrice: 0,
        supplierId: '',
        groupId: groupId || '',
      });
      setDeptRows([{ department: '', qty: '' }]);
      setSupplierOptions([]);
      setSelectedSupplierId('');
      setSelectedSupplierName('');
    } catch (err) {
      console.error('Add error:', err);
      alert('Add failed. Please try again!');
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
          <Stack direction="row" spacing={2}>
            <TextField
              label="Old SAP Code"
              value={formData.oldSapCode}
              onChange={handleChange('oldSapCode')}
              size="small"
              fullWidth
              sx={{ flex: 1 }}
              error={!!formErrors.oldSapCode}
              helperText={formErrors.oldSapCode}
              InputLabelProps={{
                required: true,
                style: { color: 'red' },
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
              error={!!formErrors.itemDescriptionVN}
              helperText={formErrors.itemDescriptionVN}
              InputLabelProps={{
                required: true,
                style: { color: 'red' },
              }}
              InputProps={{
                endAdornment: formData.itemDescriptionVN.trim() ? (
                  searchLoading ? (
                    <CircularProgress size={20} />
                  ) : null
                ) : null,
              }}
            />
            <TextField
              label="Item Description (EN)"
              value={formData.itemDescriptionEN}
              onChange={handleChange('itemDescriptionEN')}
              fullWidth
              size="small"
              error={!!formErrors.itemDescriptionEN}
              helperText={formErrors.itemDescriptionEN}
              InputLabelProps={{
                required: true,
                style: { color: 'red' },
              }}
              InputProps={{
                endAdornment: formData.itemDescriptionEN.trim() ? (
                  searchLoading ? (
                    <CircularProgress size={20} />
                  ) : null
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

          {supplierOptions.length > 0 && (
            <Paper variant="outlined" sx={{ mb: 1, p: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Supplier</InputLabel>
                <Select value={selectedSupplierId} onChange={handleSelectSupplier}>
                  {supplierOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {`${opt.productFullName} | Supplier: ${opt.supplierName} | Price: ${opt.price}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Department Request Qty:
            </Typography>
            {deptRows.map((row, index) => (
              <Stack direction="row" spacing={2} alignItems="center" key={index} sx={{ mb: 1 }}>
                <TextField
                  label="Department"
                  value={row.department}
                  onChange={(e) => handleDeptChange(index, 'department', e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Qty"
                  type="number"
                  value={row.qty}
                  onChange={(e) => handleDeptChange(index, 'qty', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Stack>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDeptRow} sx={{ mt: 1 }}>
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
                Price: <span style={{ color: '#1976d2' }}>{formData.supplierPrice || 0}</span>
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Total Price: <span style={{ color: '#1976d2' }}>{calcTotalPrice().toFixed(2)}</span>
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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAdd} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}