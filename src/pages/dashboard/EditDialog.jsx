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
    productType1Id: '',
    productType2Id: '',
    groupId: '',
  });
  const [deptRows, setDeptRows] = useState([{ department: '', qty: '' }]);
  const [saving, setSaving] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);
  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

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
            fullItemDescriptionVN: requisition.fullDescription || '',
            oldSapCode: requisition.oldSapCode || '',
            newSapCode: requisition.newSapCode || '',
            unit: supplierProduct.unit || '',
            stock: requisition.stock || '',
            purchasingSuggest: requisition.purchasingSuggest || '',
            reason: requisition.reason || '',
            remark: requisition.remark || '',
            supplierPrice: supplierProduct.price || 0,
            supplierId: supplierProduct.id || '',
            productType1Id: requisition.productType1Id || '',
            productType2Id: requisition.productType2Id || '',
            groupId: requisition.groupId || '',
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
        productType1Id: '',
        productType2Id: '',
        groupId: '',
      });
      setDeptRows([{ department: '', qty: '' }]);
      setSupplierOptions([]);
    }

    // Load productType1 and department list when dialog opens
    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
    }

    // Cleanup when dialog closes
    return () => {
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
        productType1Id: '',
        productType2Id: '',
        groupId: '',
      });
      setDeptRows([{ department: '', qty: '' }]);
      setSupplierOptions([]);
      setProductType1List([]);
      setProductType2List([]);
      // Preserve departmentList to avoid refetching
    };
  }, [item, open]);

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
      setFormData((prev) => ({ ...prev, productType2Id: '' }));
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
      console.log('Department list response:', data); // Debug log
      setDepartmentList(data || []);
      console.log('Department names:', data.map(dept => dept.departmentName)); // Debug log
    } catch (error) {
      console.error('Error fetching department list:', error);
      setDepartmentList([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

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
      if (department.trim() && qty.trim()) {
        // Use department ID directly as key
        deptQtyMap[department] = parseFloat(qty);
      }
    });

    const payload = {
      englishName: formData.itemDescriptionEN || '',
      vietnameseName: formData.itemDescriptionVN || '',
      fullDescription: formData.fullItemDescriptionVN || '',
      oldSapCode: formData.oldSapCode || '',
      newSapCode: formData.newSapCode || '',
      departmentRequestQty: deptQtyMap,
      stock: parseFloat(formData.stock) || 0,
      purchasingSuggest: parseFloat(formData.purchasingSuggest) || 0,
      reason: formData.reason || '',
      remark: formData.remark || '',
      supplierId: formData.supplierId || '',
      groupId: formData.groupId || '',
      productType1Id: formData.productType1Id || undefined,
      productType2Id: formData.productType2Id || undefined,
    };

    console.log('Sending payload:', payload); // Debug payload

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions/${item.requisition.id}`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error('API error:', error);
        alert(`Update failed: ${error || 'Unknown error'}`);
        throw new Error(`Update failed: ${res.status} - ${error}`);
      }
      await onRefresh();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
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

          <TextField
            label="Group ID"
            value={formData.groupId}
            onChange={handleChange('groupId')}
            fullWidth
            size="small"
          />

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
                <FormControl fullWidth size="small" disabled={loadingDepartments}>
                  <InputLabel id={`department-label-${i}`}>Department</InputLabel>
                  <Select
                    labelId={`department-label-${i}`}
                    value={row.department}
                    label="Department"
                    onChange={e => handleDeptChange(i, 'department', e.target.value)}
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
                  onChange={e => handleDeptChange(i, 'qty', e.target.value)}
                  size="small"
                  fullWidth
                />
                <IconButton onClick={() => handleRemoveDeptRow(i)} disabled={deptRows.length === 1} size="large">
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDeptRow} sx={{ mt: 1 }}>
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