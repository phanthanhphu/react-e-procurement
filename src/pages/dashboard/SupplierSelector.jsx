import { useEffect, useMemo, useRef, useState } from 'react';
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
  IconButton,
  Box,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { API_BASE_URL } from '../../config';

// ✅ Format number with comma thousands (12.000 -> 12,000)
// - VND: 0 decimals
// - USD/EURO: 2 decimals
const formatMoneyNumber = (value, currencyCode = 'VND') => {
  if (value == null || value === '') return '0';

  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  const code = (currencyCode || 'VND').trim().toUpperCase();
  const decimals = code === 'VND' ? 0 : 2;

  try {
    return new Intl.NumberFormat('en-US', {
      useGrouping: true,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch {
    const fixed = decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
    const [intPart, decPart] = fixed.split('.');
    const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${withComma}.${decPart}` : withComma;
  }
};

// ✅ Qty: chỉ cần dấu phẩy, không decimals
const formatQtyNumber = (value) => {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  try {
    return new Intl.NumberFormat('en-US', {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

// ✅ Format date string "2025-12-14T07:30:23" -> "14/12/2025 07:30:23"
const formatDateTime = (d) => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);

    const pad = (x) => String(x).padStart(2, '0');
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(
      dt.getMinutes()
    )}:${pad(dt.getSeconds())}`;
  } catch {
    return String(d);
  }
};

export default function SupplierSelector({
  oldSapCode = '',
  itemNo = '', // backend đang map qua hanaSapCode (theo response của bạn)
  onSelectSupplier,
  productType1List = [],
  productType2List = [],
  currency = 'VND',
}) {
  const PAGE_SIZE = 10;

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const containerRef = useRef(null);

  const hasSapCode = oldSapCode?.trim();
  const hasItemNo = itemNo?.trim();

  const queryKey = useMemo(() => {
    return `${(oldSapCode || '').trim()}|${(itemNo || '').trim()}|${(currency || 'VND').trim().toUpperCase()}`;
  }, [oldSapCode, itemNo, currency]);

  const getProductTypeName = (id, typeList) => {
    if (!typeList || !Array.isArray(typeList)) return '-';
    const type = typeList.find((item) => item.id === id);
    return type ? type.name : '-';
  };

  const mergeUniqueById = (prev, next) => {
    const map = new Map();
    prev.forEach((x) => map.set(x.id, x));
    next.forEach((x) => map.set(x.id, x));
    return Array.from(map.values());
  };

  const fetchSuppliers = async ({ pageToLoad = 0, append = false } = {}) => {
    if (append) setLoadingMore(true);
    else setSearchLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: String(pageToLoad),
        size: String(PAGE_SIZE),
      });

      if (oldSapCode?.trim()) queryParams.append('sapCode', oldSapCode.trim());
      if (itemNo?.trim()) queryParams.append('itemNo', itemNo.trim()); // backend hiểu = hanaSapCode
      queryParams.append('currency', (currency || 'VND').trim());

      const endpoint = `${API_BASE_URL}/api/supplier-products/filter-by-sapcode?${queryParams.toString()}`;
      console.log('Calling API:', endpoint);

      const res = await fetch(endpoint, { headers: { accept: '*/*' } });
      if (!res.ok) throw new Error('Failed to load suppliers');

      const json = await res.json();

      const pageObj = json?.data || json; // tùy backend trả data hay không
      const content = pageObj?.content || [];

      // paging flags
      const isLast = !!pageObj?.last;
      const totalPages = Number(pageObj?.totalPages || 0);
      const pageNumber = Number(pageObj?.number ?? pageToLoad);

      setHasMore(!isLast && pageNumber + 1 < totalPages);

      setSupplierOptions((prev) => (append ? mergeUniqueById(prev, content) : content));
      setPage(pageNumber);
    } catch (e) {
      console.error('Error loading suppliers:', e);
      if (!append) setSupplierOptions([]);
      setHasMore(false);
    } finally {
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  // ✅ reset & load page 0 khi filter đổi
  useEffect(() => {
    setSupplierOptions([]);
    setPage(0);
    setHasMore(false);
    fetchSuppliers({ pageToLoad: 0, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const loadNextPage = () => {
    if (searchLoading || loadingMore || !hasMore) return;
    fetchSuppliers({ pageToLoad: page + 1, append: true });
  };

  // ✅ infinite scroll
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    if (nearBottom) loadNextPage();
  };

  const handleSelectSupplier = (opt) => {
    onSelectSupplier({
      fullItemDescriptionVN: opt.materialGroupFullDescription || opt.itemDescriptionVN || '',
      oldSapCode: opt.sapCode || '',
      supplierId: opt.id,
      unit: opt.unit || '',
      supplierPrice: opt.price || 0,
      productType1Id: opt.productType1Id || '',
      productType2Id: opt.productType2Id || '',
      itemDescriptionVN: opt.itemDescriptionVN || opt.itemDescriptionEN || '',
      supplierName: opt.supplierName || opt.supplierCode || 'Unknown Supplier',
      currency: opt.currency || currency,
    });
  };

  // ✅ style cho 3 cột last purchase (màu khác nhẹ)
  const lastPurchaseHeaderSx = { fontWeight: 'bold', bgcolor: '#e3f2fd' };
  const lastPurchaseCellSx = { bgcolor: '#f6fbff' };

  const colSpanCount = 14; // tổng số cột hiện tại (để row load more span đúng)

  return (
    <Paper variant="outlined" sx={{ mb: 1, p: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Select Supplier
        {hasSapCode && hasItemNo
          ? ` (SAP: ${oldSapCode} + Item: "${itemNo}")`
          : hasSapCode
          ? ` (SAP Code: ${oldSapCode})`
          : hasItemNo
          ? ` (Item No: "${itemNo}")`
          : ' (All products)'}{' '}
        | Currency: <strong>{currency}</strong>
      </Typography>

      {searchLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <CircularProgress size={28} />
        </div>
      ) : supplierOptions.length > 0 ? (
        <TableContainer
          ref={containerRef}
          onScroll={handleScroll}
          sx={{ maxHeight: '340px', overflowY: 'auto' }}
        >
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

                {/* ✅ 3 cột last purchase (bỏ Last Supplier) */}
                <TableCell sx={lastPurchaseHeaderSx}>Last Purchase Date</TableCell>
                <TableCell sx={lastPurchaseHeaderSx}>Last Price</TableCell>
                <TableCell sx={lastPurchaseHeaderSx}>Last Order Qty</TableCell>

                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {supplierOptions.map((opt, index) => {
                const code = (opt.currency || currency || 'VND').trim().toUpperCase();

                return (
                  <TableRow key={opt.id} hover>
                    <TableCell>{index + 1}</TableCell>

                    <TableCell>
                      {opt.productType1Name || getProductTypeName(opt.productType1Id, productType1List)}
                    </TableCell>

                    <TableCell>
                      {opt.productType2Name || getProductTypeName(opt.productType2Id, productType2List)}
                    </TableCell>

                    <TableCell>{opt.sapCode || '-'}</TableCell>

                    {/* backend trả hanaSapCode */}
                    <TableCell>{opt.hanaSapCode || '-'}</TableCell>

                    <TableCell>{opt.itemDescriptionVN || opt.itemDescriptionEN || '-'}</TableCell>

                    <TableCell>{opt.supplierName || opt.supplierCode || '-'}</TableCell>

                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {formatMoneyNumber(opt.price, code)}
                    </TableCell>

                    <TableCell align="center">{code}</TableCell>
                    <TableCell align="center">{opt.unit || '-'}</TableCell>

                    {/* ✅ last purchase */}
                    <TableCell sx={lastPurchaseCellSx} align="center">
                      {opt.lastPurchaseDate ? formatDateTime(opt.lastPurchaseDate) : '-'}
                    </TableCell>

                    <TableCell sx={lastPurchaseCellSx} align="right">
                      {opt.lastPurchasePrice != null && opt.lastPurchasePrice !== ''
                        ? formatMoneyNumber(opt.lastPurchasePrice, code)
                        : '-'}
                    </TableCell>

                    <TableCell sx={lastPurchaseCellSx} align="right">
                      {opt.lastPurchaseOrderQty != null && opt.lastPurchaseOrderQty !== ''
                        ? formatQtyNumber(opt.lastPurchaseOrderQty)
                        : '-'}
                    </TableCell>

                    <TableCell>
                      <Button variant="contained" color="primary" size="small" onClick={() => handleSelectSupplier(opt)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* ✅ Row load more (icon) */}
              {hasMore && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} sx={{ py: 1.2 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                      <IconButton
                        onClick={loadNextPage}
                        disabled={loadingMore || searchLoading}
                        size="small"
                        color="primary"
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                      <Typography variant="body2" color="text.secondary">
                        {loadingMore ? 'Loading more…' : 'Load more'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {loadingMore && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} sx={{ textAlign: 'center', py: 1 }}>
                    <CircularProgress size={20} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
          {hasSapCode || hasItemNo ? 'No products match your search criteria.' : `No products available for currency: ${currency}`}
        </Typography>
      )}
    </Paper>
  );
}
