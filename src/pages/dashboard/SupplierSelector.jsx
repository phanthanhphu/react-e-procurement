import React, { useState, useEffect } from 'react';
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
}) {
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [filterValue, setFilterValue] = useState('');

  // Hàm tìm kiếm nhà cung cấp
  const searchSupplier = async (sapCode, filter = '') => {
    setSearchLoading(true);
    try {
      const queryParams = new URLSearchParams({ page: '0', size: '100' });
      if (sapCode.trim()) queryParams.append('sapCode', sapCode.trim());
      if (filter.trim()) queryParams.append('itemDescription', filter.trim());

      const endpoint = queryParams.toString()
        ? `${API_BASE_URL}/api/supplier-products/filter-by-sapcode?${queryParams.toString()}`
        : `${API_BASE_URL}/api/supplier-products/filter-by-sapcode?page=0&size=100`;

      const res = await fetch(endpoint, {
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Không thể tải danh sách nhà cung cấp');
      const data = await res.json();
      setSupplierOptions(data.content || []);
    } catch (error) {
      console.error('Lỗi khi tải nhà cung cấp:', error);
      setSupplierOptions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Gọi tìm kiếm khi oldSapCode hoặc filter thay đổi
  useEffect(() => {
    searchSupplier(oldSapCode, filterValue);
  }, [oldSapCode, filterValue]);

  // Xử lý khi chọn nhà cung cấp từ bảng
  const handleSelectSupplier = (opt) => {
    setSelectedSupplierId(opt.id);
    onSelectSupplier({
      itemDescriptionVN: opt.itemDescription || '',
      itemDescriptionEN: opt.itemNo || '',
      fullItemDescriptionVN: opt.fullDescription || '',
      oldSapCode: opt.sapCode || '',
      supplierPrice: opt.price || 0,
      unit: opt.unit || '',
      supplierId: opt.id,
      supplierName: opt.supplierName || '',
    });
  };

  return (
    <Paper variant="outlined" sx={{ mb: 1, p: 1 }}>
      {searchLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <CircularProgress size={24} />
        </div>
      ) : supplierOptions.length > 0 ? (
        <TableContainer sx={{ maxHeight: '300px', overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1100 }} aria-label="supplier table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>SAP Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Item No</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Item Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Supplier Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Supplier Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierOptions.map((opt) => (
                <TableRow
                  key={opt.id}
                  hover
                  selected={selectedSupplierId === opt.id}
                  sx={{
                    '&:hover': { bgcolor: '#e3f2fd' },
                    '&.Mui-selected': { bgcolor: '#bbdefb' },
                  }}
                >
                  <TableCell>{opt.sapCode || '-'}</TableCell>
                  <TableCell>{opt.itemNo || '-'}</TableCell>
                  <TableCell>{opt.itemDescription || '-'}</TableCell>
                  <TableCell>{opt.supplierCode || '-'}</TableCell>
                  <TableCell>{opt.supplierName || '-'}</TableCell>
                  <TableCell>{opt.price ? opt.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}</TableCell>
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
          Không tìm thấy nhà cung cấp
        </Typography>
      )}
    </Paper>
  );
}