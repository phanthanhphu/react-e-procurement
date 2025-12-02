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

// Format tiền đẹp chuẩn quốc tế + VND
const formatPrice = (price, currencyCode = 'VND') => {
  if (!price || price === 0) return '0';

  const code = currencyCode.toUpperCase();

  if (code === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  const options = {
    style: 'currency',
    currency: code,
    minimumFractionDigits: code === 'JPY' ? 0 : 2,
    maximumFractionDigits: code === 'JPY' ? 0 : 2,
  };

  return new Intl.NumberFormat('en-US', options).format(price);
};

export default function SupplierSelector({
  oldSapCode = '',
  itemNo = '',
  onSelectSupplier,
  productType1List = [],
  productType2List = [],
  currency = 'VND',
}) {
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchSupplier = async (sapCodeValue = '', itemNoValue = '', currencyFilter = 'VND') => {
    setSearchLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: '0',
        size: '100',
      });

      // GỌI CẢ 2 THAM SỐ NẾU CÓ → ĐÚNG YÊU CẦU MỚI
      if (sapCodeValue?.trim()) {
        queryParams.append('sapCode', sapCodeValue.trim());
      }
      if (itemNoValue?.trim()) {
        queryParams.append('itemNo', itemNoValue.trim());
      }

      // Nếu cả 2 đều trống → vẫn gọi API để lấy tất cả theo currency
      queryParams.append('currency', currencyFilter || 'VND');

      const endpoint = `${API_BASE_URL}/api/supplier-products/filter-by-sapcode?${queryParams.toString()}`;
      console.log('Calling API:', endpoint); // Dễ debug

      const res = await fetch(endpoint, { headers: { accept: '*/*' } });
      if (!res.ok) throw new Error('Failed to load suppliers');
      const data = await res.json();

      const content = data.data?.content || data.content || [];
      setSupplierOptions(content);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSupplierOptions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Gọi lại mỗi khi có thay đổi ở SAP Code HOẶC Item Description (VN) HOẶC currency
  useEffect(() => {
    searchSupplier(oldSapCode, itemNo, currency);
  }, [oldSapCode, itemNo, currency]);

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
      supplierName: opt.supplierName || 'Unknown Supplier',
    });
  };

  const getProductTypeName = (id, typeList) => {
    if (!typeList || !Array.isArray(typeList)) return '-';
    const type = typeList.find((item) => item.id === id);
    return type ? type.name : '-';
  };

  const hasSapCode = oldSapCode?.trim();
  const hasItemNo = itemNo?.trim();

  return (
    <Paper variant="outlined" sx={{ mb: 1, p: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Select Supplier
        {hasSapCode && hasItemNo ? ` (SAP: ${oldSapCode} + Item: "${itemNo}")` : 
         hasSapCode ? ` (SAP Code: ${oldSapCode})` :
         hasItemNo ? ` (Item No: "${itemNo}")` :
         ' (All products)'}
        {' '} | Currency: <strong>{currency}</strong>
      </Typography>

      {searchLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <CircularProgress size={28} />
        </div>
      ) : supplierOptions.length > 0 ? (
        <TableContainer sx={{ maxHeight: '340px', overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>No</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Type 1</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Type 2</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>SAP Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Item No</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Currency</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierOptions.map((opt, index) => (
                <TableRow key={opt.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{opt.productType1Name || getProductTypeName(opt.productType1Id, productType1List)}</TableCell>
                  <TableCell>{opt.productType2Name || getProductTypeName(opt.productType2Id, productType2List)}</TableCell>
                  <TableCell>{opt.sapCode || '-'}</TableCell>
                  <TableCell>{opt.itemNo || '-'}</TableCell>
                  <TableCell>{opt.itemDescription || '-'}</TableCell>
                  <TableCell>{opt.supplierName || opt.supplierCode || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    {formatPrice(opt.price, opt.currency || currency)}
                  </TableCell>
                  <TableCell>{opt.currency || currency}</TableCell>
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
        <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
          {hasSapCode || hasItemNo
            ? 'No products match your search criteria.'
            : `No products available for currency: ${currency}`}
        </Typography>
      )}
    </Paper>
  );
}