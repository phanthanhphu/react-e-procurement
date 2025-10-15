import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';
import { API_BASE_URL } from '../../config';

export default function SupplierSelector({
  oldSapCode,
  onSelectSupplier,
  productType1List = [], // Default to empty array
  productType2List = [], // Default to empty array
  currency = '', // Add currency prop with default empty string
}) {
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Function to search for suppliers
  const searchSupplier = async (sapCode, currencyFilter) => {
    setSearchLoading(true);
    try {
      const queryParams = new URLSearchParams({ page: '0', size: '100' });
      if (sapCode.trim()) queryParams.append('sapCode', sapCode.trim());
      // Always include currency in query params, even if empty (API should handle empty currency as no filter)
      queryParams.append('currency', currencyFilter || '');

      const endpoint = `${API_BASE_URL}/api/supplier-products/filter-by-sapcode?${queryParams.toString()}`;

      const res = await fetch(endpoint, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to load supplier list');
      const data = await res.json();
      setSupplierOptions(data.data.content || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSupplierOptions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Trigger search when oldSapCode or currency changes
  useEffect(() => {
    // Only trigger search if currency is defined (avoid initial call with undefined)
    if (currency !== undefined) {
      searchSupplier(oldSapCode, currency);
    }
  }, [oldSapCode, currency]);

  // Handle supplier selection from the table
  const handleSelectSupplier = (opt) => {
    onSelectSupplier({
      fullItemDescriptionVN: opt.fullDescription || '',
      oldSapCode: opt.sapCode || '',
      supplierId: opt.id,
      unit: opt.unit || '',
      supplierPrice: opt.price || 0,
      productType1Id: opt.productType1Id || '',
      productType2Id: opt.productType2Id || '',
      itemDescriptionVN: opt.itemDescription || '',
      supplierName: opt.supplierName || 'Unknown Supplier', // Thêm supplierName
    });
  };

  // Map productType1Id and productType2Id to names
  const getProductTypeName = (id, typeList) => {
    if (!typeList || !Array.isArray(typeList)) return '-';
    const type = typeList.find((item) => item.id === id);
    return type ? type.name : '-';
  };

  return (
    <Paper variant="outlined" sx={{ mb: 1, p: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Select Supplier{currency ? ` (Filtered by Currency: ${currency})` : ''}
      </Typography>
      {searchLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <CircularProgress size={24} />
        </div>
      ) : supplierOptions.length > 0 ? (
        <TableContainer sx={{ maxHeight: '300px', overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1200 }} aria-label="supplier table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>No</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Product Type 1</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Product Type 2</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>SAP Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Item Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Supplier Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Supplier Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Currency</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierOptions.map((opt, index) => (
                <TableRow
                  key={opt.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: '#e3f2fd' },
                    '&.Mui-selected': { bgcolor: '#bbdefb' },
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{opt.productType1Name || getProductTypeName(opt.productType1Id, productType1List)}</TableCell>
                  <TableCell>{opt.productType2Name || getProductTypeName(opt.productType2Id, productType2List)}</TableCell>
                  <TableCell>{opt.sapCode || '-'}</TableCell>
                  <TableCell>{opt.itemNo || '-'}</TableCell>
                  <TableCell>{opt.itemDescription || '-'}</TableCell>
                  <TableCell>{opt.supplierCode || '-'}</TableCell>
                  <TableCell>{opt.supplierName || '-'}</TableCell>
                  <TableCell>{opt.price ? opt.price.toLocaleString('vi-VN', { style: 'currency', currency: opt.currency || 'VND' }) : '0'}</TableCell>
                  <TableCell>{opt.currency || '-'}</TableCell>
                  <TableCell>{opt.unit || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleSelectSupplier(opt)}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 2 }}>
          No products found
        </Typography>
      )}
    </Paper>
  );
}