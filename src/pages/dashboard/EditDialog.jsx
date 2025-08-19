import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
  Typography, Paper, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_BASE_URL } from '../../config';

export default function EditDialog({ open, item, onClose, onRefresh }) {
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
    supplierPrice: 0,
    supplierId: '',
  });
  const [deptRows, setDeptRows] = useState([{ department: '', qty: '' }]);
  const [saving, setSaving] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    console.log('EditDialog opened with item:', item); // Debug: Log item prop
    if (open && item && item.requisition && item.requisition.id) {
      fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch requisition data: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('API response:', data); // Debug: Log API response
          const requisition = data.requisition || {};
          const supplierProduct = data.supplierProduct || {};

          setFormData({
            itemDescriptionEN: requisition.englishName || '',
            itemDescriptionVN: requisition.vietnameseName || '',
            fullItemDescriptionVN: requisition.vietnameseName || '',
            oldSapCode: requisition.oldSapCode || '',
            newSapCode: requisition.newSapCode || '',
            unit: supplierProduct.unit || '',
            stock: requisition.stock || '',
            purchasingSuggest: requisition.purchasingSuggest || '',
            reason: requisition.reason || '',
            remark: requisition.remark || '',
            supplierPrice: supplierProduct.price || 0,
            supplierId: supplierProduct.id || '',
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

          setSupplierOptions(supplierProduct.id ? [supplierProduct] : []);
        })
        .catch(err => {
          console.error('Error fetching requisition data:', err);
          alert('Failed to load requisition data. Please try again.');
        });
    } else {
      console.warn('No valid item or item.requisition.id, resetting form. Item:', item); // Debug: Log missing item
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
        supplierPrice: 0,
        supplierId: '',
      });
      setDeptRows([{ department: '', qty: '' }]);
      setSupplierOptions([]);
    }
  }, [item, open]);

  const searchSupplierByName = (query) => {
    if (!query) {
      setSupplierOptions([]);
      setFormData(prev => ({
        ...prev,
        supplierId: '',
        supplierPrice: 0,
        unit: '',
      }));
      return;
    }
    setSearchLoading(true);
    fetch(`${API_BASE_URL}/api/supplier-products/search?productFullName=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => setSupplierOptions(data || []))
      .catch(() => setSupplierOptions([]))
      .finally(() => setSearchLoading(false));
  };

  useEffect(() => {
    searchSupplierByName(formData.itemDescriptionVN.trim());
  }, [formData.itemDescriptionVN]);

  useEffect(() => {
    searchSupplierByName(formData.itemDescriptionEN.trim());
  }, [formData.itemDescriptionEN]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleDeptChange = (index, field, value) => {
    const newRows = [...deptRows];
    newRows[index][field] = value;
    setDeptRows(newRows);
  };

  const handleAddDeptRow = () => setDeptRows([...deptRows, { department: '', qty: '' }]);

  const handleRemoveDeptRow = (index) => {
    const newRows = deptRows.filter((_, i) => i !== index);
    setDeptRows(newRows.length ? newRows : [{ department: '', qty: '' }]);
  };

  const handleSelectSupplier = (e) => {
    const selectedSupplierId = e.target.value;
    const selectedSupplier = supplierOptions.find(opt => opt.id === selectedSupplierId);

    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplierId: selectedSupplier.id,
        supplierPrice: selectedSupplier.price,
        unit: selectedSupplier.unit,
        itemDescriptionVN: selectedSupplier.productFullName,
        itemDescriptionEN: selectedSupplier.productShortName || selectedSupplier.productFullName,
        fullItemDescriptionVN: selectedSupplier.productFullName,
        oldSapCode: selectedSupplier.sapCode || prev.oldSapCode,
      }));
    }
  };

  const handleSave = async () => {
    if (!item || !item.requisition || !item.requisition.id) {
      alert('Cannot save: Item or requisition ID is missing.');
      return;
    }

    const deptQtyMap = {};
    deptRows.forEach(({ department, qty }) => {
      if (department.trim() && qty.trim()) deptQtyMap[department.trim()] = parseFloat(qty);
    });

    const payload = { ...formData, departmentRequestQty: deptQtyMap };

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      await onRefresh();
      onClose();
    } catch {
      alert('Failed to update item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalQty = deptRows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0);
  const totalPrice = formData.supplierPrice * totalQty;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
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
          <Stack direction="row" spacing={2}>
            <TextField
              label="Old SAP Code"
              value={formData.oldSapCode}
              onChange={handleChange('oldSapCode')}
              size="small"
              fullWidth
            />
            <TextField
              label="New SAP Code"
              value={formData.newSapCode}
              onChange={handleChange('newSapCode')}
              size="small"
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Item Description (VN)"
              value={formData.itemDescriptionVN}
              onChange={handleChange('itemDescriptionVN')}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: formData.itemDescriptionVN.trim() ? (searchLoading ? <CircularProgress size={20} /> : null) : null,
              }}
            />
            <TextField
              label="Item Description (EN)"
              value={formData.itemDescriptionEN}
              onChange={handleChange('itemDescriptionEN')}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: formData.itemDescriptionEN.trim() ? (searchLoading ? <CircularProgress size={20} /> : null) : null,
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

          <Paper variant="outlined" sx={{ mb: 1, p: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Supplier</InputLabel>
              <Select value={formData.supplierId} onChange={handleSelectSupplier}>
                {supplierOptions.length > 0 ? (
                  supplierOptions.map(opt => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {`${opt.productFullName} | Supplier: ${opt.supplierName} | Price: ${opt.price}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No suppliers found</MenuItem>
                )}
              </Select>
            </FormControl>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Department Request Qty:
            </Typography>
            {deptRows.map((row, i) => (
              <Stack direction="row" spacing={2} alignItems="center" key={i} sx={{ mb: 1 }}>
                <TextField
                  label="Department"
                  value={row.department}
                  onChange={e => handleDeptChange(i, 'department', e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Qty"
                  type="number"
                  value={row.qty}
                  onChange={e => handleDeptChange(i, 'qty', e.target.value)}
                  size="small"
                  fullWidth
                />
                <IconButton onClick={() => handleRemoveDeptRow(i)} disabled={deptRows.length === 1} size="large">
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDeptRow} sx={{ mt: 1}}>
              Add Department
            </Button>
          </Paper>

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
              Total Request Qty: <span style={{ color: '#1976d2' }}>{totalQty}</span>
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              Unit: <span style={{ color: '#1976d2' }}>{formData.unit || '-'}</span>
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              Price: <span style={{ color: '#1976d2' }}>{formData.supplierPrice || 0}</span>
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              Total Price: <span style={{ color: '#1976d2' }}>{totalPrice.toFixed(2)}</span>
            </Typography>
          </Stack>

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
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}