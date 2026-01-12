// src/pages/.../SupplierSelector.jsx
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
  TextField,
  Stack,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ClearIcon from '@mui/icons-material/Clear';
import { API_BASE_URL } from '../../config';

// Format money with comma thousands
// - VND: 0 decimals
// - others: 2 decimals
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

// Qty: comma grouping, no decimals
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

// "2025-12-14T07:30:23" -> "14/12/2025 07:30:23"
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

/** ✅ helper normalize:
 * - trim
 * - collapse spaces
 */
const normalizeText = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

/** ✅ helper check "NEW" (case-insensitive) */
const isNew = (v) => normalizeText(v).toLowerCase() === 'new';

/** ✅ SAP normalize:
 * - trim + UPPERCASE
 * - if empty or equals "NEW" (case-insensitive) => return ''
 */
const normalizeSapInput = (v) => {
  const s = normalizeText(v);
  if (!s) return '';
  const upper = s.toUpperCase();
  if (upper === 'NEW') return '';
  return upper;
};

/** ✅ For Hana code: usually uppercase, but if "NEW" -> return '' */
const normalizeHanaInput = (v) => {
  const s = normalizeText(v);
  if (!s) return '';
  const upper = s.toUpperCase();
  if (upper === 'NEW') return '';
  return upper;
};

/**
 * ✅ NEW RULE (AUTO INPUT ONLY 1 FIELD)
 */
const pickOneAutoFilter = ({
  prefillSapCode,
  prefillHanaCode,
  prefillItemDescriptionVN,
  prefillItemDescriptionEN,
}) => {
  const sapRaw = normalizeText(prefillSapCode);
  const hanaRaw = normalizeText(prefillHanaCode);
  const vnPref = normalizeText(prefillItemDescriptionVN);
  const enPref = normalizeText(prefillItemDescriptionEN);

  const sapIsNewOrEmpty = !sapRaw || isNew(sapRaw);
  const hanaIsNewOrEmpty = !hanaRaw || isNew(hanaRaw);

  const base = { sapCode: '', hanaSapCode: '', itemDescriptionVN: '', itemDescriptionEN: '' };

  if (!sapIsNewOrEmpty) {
    return { ...base, sapCode: normalizeSapInput(sapRaw) };
  }

  if (!hanaIsNewOrEmpty) {
    return { ...base, hanaSapCode: normalizeHanaInput(hanaRaw) };
  }

  if (vnPref) return { ...base, itemDescriptionVN: vnPref };
  if (enPref) return { ...base, itemDescriptionEN: enPref };

  return base;
};

export default function SupplierSelector({
  onSelectSupplier,
  currency = 'VND',
  disabled = false,

  // ✅ Prefill inputs from parent
  prefillSapCode = '',
  prefillHanaCode = '',
  prefillItemDescriptionVN = '',
  prefillItemDescriptionEN = '',
  prefillUnit = '', // ✅ NEW: auto input Unit from parent

  productType1List = [],
  productType2List = [],
}) {
  const PAGE_SIZE = 10;

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  /**
   * ✅ Filters state
   */
  const [filters, setFilters] = useState(() => {
    const picked = pickOneAutoFilter({
      prefillSapCode,
      prefillHanaCode,
      prefillItemDescriptionVN,
      prefillItemDescriptionEN,
    });

    return {
      ...picked,
      unit: normalizeText(prefillUnit), // ✅ AUTO SET UNIT INIT
      supplierName: '',
    };
  });

  /**
   * ✅ Track previous prefills
   */
  const prevPrefillRef = useRef({
    prefillSapCode: undefined,
    prefillHanaCode: undefined,
    prefillItemDescriptionVN: undefined,
    prefillItemDescriptionEN: undefined,
    prefillUnit: undefined,
  });

  /**
   * ✅ SYNC PREFILL FROM PARENT (FORCE OVERWRITE)
   */
  useEffect(() => {
    const prev = prevPrefillRef.current;

    const changed =
      prev.prefillSapCode !== prefillSapCode ||
      prev.prefillHanaCode !== prefillHanaCode ||
      prev.prefillItemDescriptionVN !== prefillItemDescriptionVN ||
      prev.prefillItemDescriptionEN !== prefillItemDescriptionEN ||
      prev.prefillUnit !== prefillUnit;

    prevPrefillRef.current = {
      prefillSapCode,
      prefillHanaCode,
      prefillItemDescriptionVN,
      prefillItemDescriptionEN,
      prefillUnit,
    };

    if (!changed) return;

    setFilters((prevFilters) => {
      const keepSupplierName = prevFilters.supplierName || '';

      const picked = pickOneAutoFilter({
        prefillSapCode,
        prefillHanaCode,
        prefillItemDescriptionVN,
        prefillItemDescriptionEN,
      });

      return {
        ...picked,
        unit: normalizeText(prefillUnit), // ✅ ALWAYS OVERWRITE UNIT FROM PARENT
        supplierName: keepSupplierName,
      };
    });
  }, [prefillSapCode, prefillHanaCode, prefillItemDescriptionVN, prefillItemDescriptionEN, prefillUnit]);

  const hasAnyFilter =
    !!normalizeSapInput(filters.sapCode) ||
    !!normalizeHanaInput(filters.hanaSapCode) ||
    !!normalizeText(filters.itemDescriptionVN) ||
    !!normalizeText(filters.itemDescriptionEN) ||
    !!normalizeText(filters.unit) || // ✅ include unit
    !!normalizeText(filters.supplierName);

  const queryKey = useMemo(() => {
    return [
      normalizeSapInput(filters.sapCode),
      normalizeHanaInput(filters.hanaSapCode),
      normalizeText(filters.itemDescriptionVN),
      normalizeText(filters.itemDescriptionEN),
      normalizeText(filters.unit), // ✅ include unit
      normalizeText(filters.supplierName),
      (currency || 'VND').trim().toUpperCase(),
    ].join('|');
  }, [filters, currency]);

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
    if (disabled) return;

    if (append) setLoadingMore(true);
    else setSearchLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: String(pageToLoad),
        size: String(PAGE_SIZE),
      });

      const sap = normalizeSapInput(filters.sapCode);
      const hana = normalizeHanaInput(filters.hanaSapCode);
      const vn = normalizeText(filters.itemDescriptionVN);
      const en = normalizeText(filters.itemDescriptionEN);
      const unit = normalizeText(filters.unit);
      const supplierName = normalizeText(filters.supplierName);

      if (sap) queryParams.append('sapCode', sap);
      if (hana) queryParams.append('hanaSapCode', hana);
      if (vn) queryParams.append('itemDescriptionVN', vn);
      if (en) queryParams.append('itemDescriptionEN', en);

      // ✅ ALWAYS FILTER BY UNIT IF EXISTS
      if (unit) queryParams.append('unit', unit);

      if (supplierName) queryParams.append('supplierName', supplierName);

      queryParams.append('currency', (currency || 'VND').trim());

      const endpoint = `${API_BASE_URL}/api/supplier-products/filter-by-sapcode?${queryParams.toString()}`;
      const res = await fetch(endpoint, { headers: { accept: '*/*' } });
      if (!res.ok) throw new Error('Failed to load suppliers');

      const json = await res.json();
      const pageObj = json?.data || json;
      const content = pageObj?.content || [];

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

  // ✅ debounce fetch when filters change
  useEffect(() => {
    setSupplierOptions([]);
    setPage(0);
    setHasMore(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuppliers({ pageToLoad: 0, append: false });
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, disabled]);

  const loadNextPage = () => {
    if (searchLoading || loadingMore || !hasMore || disabled) return;
    fetchSuppliers({ pageToLoad: page + 1, append: true });
  };

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    if (nearBottom) loadNextPage();
  };

  const handleSelectSupplier = (opt) => {
    onSelectSupplier?.({
      oldSapCode: opt.sapCode || '',
      hanaSapCode: opt.hanaSapCode || '',

      // ✅ ADD: pass VN/EN description back to parent (AddDialog)
      itemDescriptionVN: opt.itemDescriptionVN || '',
      itemDescriptionEN: opt.itemDescriptionEN || '',

      supplierId: opt.id,
      unit: opt.unit || '',
      supplierPrice: opt.price || 0,
      productType1Id: opt.productType1Id || '',
      productType2Id: opt.productType2Id || '',
      supplierName: opt.supplierName || opt.supplierCode || 'Unknown Supplier',
      currency: opt.currency || currency,
    });
  };

  const handleChangeFilter = (key) => (e) => {
    const raw = e.target.value;

    setFilters((prev) => {
      if (key === 'sapCode') return { ...prev, sapCode: normalizeSapInput(raw) };
      if (key === 'hanaSapCode') return { ...prev, hanaSapCode: normalizeHanaInput(raw) };
      return { ...prev, [key]: raw };
    });
  };

  const clearFilters = () => {
    // ✅ keep Unit from parent even when user clears
    const unitKeep = normalizeText(prefillUnit);

    setFilters({
      sapCode: '',
      hanaSapCode: '',
      itemDescriptionVN: '',
      itemDescriptionEN: '',
      unit: unitKeep,
      supplierName: '',
    });
  };

  const smallSx = {
    '& .MuiTypography-root': { fontSize: 12.2 },
    '& .MuiInputLabel-root': { fontSize: 11.5 },
    '& .MuiOutlinedInput-input': { fontSize: 12.2, py: 0.85 },
    '& .MuiFormHelperText-root': { fontSize: 11.2 },
    '& .MuiTableCell-root': { fontSize: 12.0, py: 0.7, px: 1 },
    '& .MuiTableCell-head': { fontSize: 12.0 },
    '& .MuiButton-root': { fontSize: 11.5, minHeight: 30, px: 1.2 },
    '& .MuiIconButton-root': { width: 32, height: 32 },
  };

  const headerCellSx = { fontWeight: 'bold', bgcolor: '#f5f5f5', fontSize: 12.0 };
  const lastPurchaseHeaderSx = { fontWeight: 'bold', bgcolor: '#e3f2fd', fontSize: 12.0 };
  const lastPurchaseCellSx = { bgcolor: '#f6fbff' };
  const colSpanCount = 14;

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 1,
        p: 1,
        opacity: disabled ? 0.7 : 1,
        ...smallSx,
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Select Supplier | Currency: <strong>{currency}</strong>
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small"
          label="SAP Code"
          value={filters.sapCode}
          onChange={handleChangeFilter('sapCode')}
          fullWidth
          disabled={disabled}
          helperText="If left blank or entered as ‘NEW’, the search will prioritize Hana code or item description"
        />
        <TextField
          size="small"
          label="Hana Code"
          value={filters.hanaSapCode}
          onChange={handleChangeFilter('hanaSapCode')}
          fullWidth
          disabled={disabled}
          helperText="If ‘NEW’ is entered, the Hana filter will be ignored"
        />
        <TextField
          size="small"
          label="Item Des (VN)"
          value={filters.itemDescriptionVN}
          onChange={handleChangeFilter('itemDescriptionVN')}
          fullWidth
          disabled={disabled}
        />
        <TextField
          size="small"
          label="Item Des (EN)"
          value={filters.itemDescriptionEN}
          onChange={handleChangeFilter('itemDescriptionEN')}
          fullWidth
          disabled={disabled}
        />

        {/* ✅ AUTO INPUT UNIT ON UI */}
        <TextField
          size="small"
          label="Unit (Auto)"
          value={filters.unit}
          fullWidth
          disabled // ✅ lock so user cannot change and break filtering
          helperText="Auto-filled from item unit (used for filtering suppliers)."
        />

        <TextField
          size="small"
          label="Supplier"
          value={filters.supplierName}
          onChange={handleChangeFilter('supplierName')}
          fullWidth
          disabled={disabled}
        />

        <IconButton
          onClick={clearFilters}
          size="small"
          sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
          disabled={!hasAnyFilter || disabled}
          title="Clear filters"
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </Stack>

      {searchLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <CircularProgress size={24} />
        </div>
      ) : supplierOptions.length > 0 ? (
        <TableContainer ref={containerRef} onScroll={handleScroll} sx={{ maxHeight: '340px', overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>No</TableCell>
                <TableCell sx={headerCellSx}>Type 1</TableCell>
                <TableCell sx={headerCellSx}>Type 2</TableCell>
                <TableCell sx={headerCellSx}>SAP Code</TableCell>
                <TableCell sx={headerCellSx}>Hana Code</TableCell>
                <TableCell sx={headerCellSx}>Description</TableCell>
                <TableCell sx={headerCellSx}>Supplier</TableCell>
                <TableCell sx={headerCellSx}>Price</TableCell>
                <TableCell sx={headerCellSx}>Currency</TableCell>
                <TableCell sx={headerCellSx}>Unit</TableCell>
                <TableCell sx={lastPurchaseHeaderSx}>Last Purchase Date</TableCell>
                <TableCell sx={lastPurchaseHeaderSx}>Last Price</TableCell>
                <TableCell sx={lastPurchaseHeaderSx}>Last Order Qty</TableCell>
                <TableCell sx={headerCellSx}>Action</TableCell>
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
                    <TableCell>{opt.hanaSapCode || '-'}</TableCell>

                    <TableCell>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{opt.itemDescriptionVN || '-'}</div>
                      {opt.itemDescriptionEN ? (
                        <div style={{ fontSize: 11, color: '#666' }}>{opt.itemDescriptionEN}</div>
                      ) : null}
                    </TableCell>

                    <TableCell>{opt.supplierName || opt.supplierCode || '-'}</TableCell>

                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {formatMoneyNumber(opt.price, code)}
                    </TableCell>

                    <TableCell align="center">{code}</TableCell>
                    <TableCell align="center">{opt.unit || '-'}</TableCell>

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
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleSelectSupplier(opt)}
                        disabled={disabled}
                        sx={{ fontSize: 11.5 }}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {hasMore && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} sx={{ py: 1.0 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                      <IconButton
                        onClick={loadNextPage}
                        disabled={loadingMore || searchLoading || disabled}
                        size="small"
                        color="primary"
                      >
                        <KeyboardArrowDownIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                        {loadingMore ? 'Loading more…' : 'Load more'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {loadingMore && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} sx={{ textAlign: 'center', py: 1 }}>
                    <CircularProgress size={18} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3, fontSize: 12 }}>
          {hasAnyFilter ? 'No products match your search criteria.' : `No products available for currency: ${currency}`}
        </Typography>
      )}
    </Paper>
  );
}
