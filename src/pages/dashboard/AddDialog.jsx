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
    productType1Id: '',
    productType2Id: '',
  });

  const [deptRows, setDeptRows] = useState([{ department: '', qty: '' }]);
  const [saving, setSaving] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [productType1List, setProductType1List] = useState([]);
  const [productType2List, setProductType2List] = useState([]);
  const [loadingType1, setLoadingType1] = useState(false);
  const [loadingType2, setLoadingType2] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProductType1List();
      fetchDepartmentList();
      setFormData((prev) => ({
        ...prev,
        groupId: groupId || '',
        productType1Id: '',
        productType2Id: '',
      }));
    }
  }, [open, groupId]);

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

  const handleDeleteDeptRow = (index) => {
    const updated = deptRows.filter((_, i) => i !== index);
    setDeptRows(updated.length > 0 ? updated : [{ department: '', qty: '' }]);
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

  const handleAdd = async () => {
    if (!groupId) {
      alert('Group ID is missing.');
      return;
    }

    const deptQtyMap = {};
    deptRows.forEach((row) => {
      if (row.department && row.qty) {
        deptQtyMap[row.department] = parseFloat(row.qty); // Key là department ID, value là qty
      }
    });

    const totalRequestQty = Object.values(deptQtyMap).reduce((sum, val) => sum + val, 0);

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
      totalRequestQty,
      totalPrice: totalRequestQty * (formData.supplierPrice || 0),
    };

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/summary-requisitions`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
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
        productType1Id: '',
        productType2Id: '',
      });
      setDeptRows([{ department: '', qty: '' }]);
      setSupplierOptions([]);
      setSelectedSupplierId('');
      setSelectedSupplierName('');
      setProductType1List([]);
      setProductType2List([]);
      // Removed setDepartmentList([]) to preserve department list
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

          <Stack direction="row" spacing={2}>
            <TextField
              label="Old SAP Code"
              value={formData.oldSapCode}
              onChange={handleChange('oldSapCode')}
              size="small"
              fullWidth
              sx={{ flex: 1 }}
              InputLabelProps={{
                style: { color: 'inherit' },
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
              InputLabelProps={{
                style: { color: 'inherit' },
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
              InputLabelProps={{
                style: { color: 'inherit' },
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
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                key={index}
                sx={{ mb: 1 }}
              >
                <FormControl fullWidth size="small" disabled={loadingDepartments}>
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