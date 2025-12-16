import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  IconButton,
  FormHelperText,
  Box,
  Snackbar,
  Alert,
  Chip,
  Divider,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

import { API_BASE_URL } from '../../config';
import SupplierSelector from './SupplierSelector';
import { debounce } from 'lodash';

/* =========================
   ✅ Helpers: token + email (same pattern as mẫu)
========================= */
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const getAccessToken = () =>
  localStorage.getItem('accessToken') ||
  localStorage.getItem('token') ||
  localStorage.getItem('jwt') ||
  '';

const getUserEmail = () => {
  const direct =
    localStorage.getItem('email') ||
    localStorage.getItem('userEmail') ||
    localStorage.getItem('username');

  if (direct && direct.trim()) return direct.trim();

  const token = getAccessToken();
  const payload = token ? parseJwt(token) : null;

  const email = payload?.email || payload?.preferred_username || payload?.upn || payload?.sub;
  return typeof email === 'string' ? email.trim() : '';
};

const normalizeCurrencyCode = (code) => {
  const valid = ['VND', 'USD', 'EUR', 'JPY', 'GBP'];
  const map = { EURO: 'EUR' };
  if (!code) return 'VND';
  const n = map[String(code).toUpperCase()] || String(code).toUpperCase();
  return valid.includes(n) ? n : 'VND';
};

export default function AddRequisitionMonthly({ open, onClose, onRefresh, groupId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const mountedRef = useRef(false);

  const defaultFormData = useMemo(
    () => ({
      itemDescriptionEN: '',
      itemDescriptionVN: '',
      fullDescription: '',
      oldSAPCode: '',
      hanaSAPCode: '',
      dailyMedInventory: '',
      reason: '',
      remark: '',
      remarkComparison: '',
      supplierId: '',
      groupId: groupId || '',
      productType1Id: '',
      productType2Id: '',
      unit: '',
      supplierPrice: 0,
    }),
    [groupId]
  );

  const [formData, setFormData] = useState(defaultFormData);
  const [deptRows, setDeptRows] = useState([{ id: '', name: '', qty: '', buy: '' }]);
  const [deptErrors, setDeptErrors] = useState(['']);
  const [saving, setSaving] = useState(false);

  const [departmentList, setDepartmentList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [translating, setTranslating] = useState(false);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(true);

  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);

  const [groupCurrency, setGroupCurrency] = useState('VND');
  const [loadingCurrency, setLoadingCurrency] = useState(false);
  const [currencyError, setCurrencyError] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemNoForSearch, setItemNoForSearch] = useState('');

  const locked = saving;

  // ====== UI TOKENS ======
  const paperSx = useMemo(
    () => ({
      borderRadius: fullScreen ? 0 : 4,
      overflow: 'hidden',
      boxShadow: `0 22px 70px ${alpha('#000', 0.25)}`,
      border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
      background:
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.72)
          : alpha('#FFFFFF', 0.92),
      backdropFilter: 'blur(14px)',
    }),
    [fullScreen, theme]
  );

  const headerSx = useMemo(
    () => ({
      position: 'relative',
      py: 1.6,
      px: 2.2,
      color: 'common.white',
      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    }),
    [theme]
  );

  const subtleCardSx = useMemo(
    () => ({
      borderRadius: 4,
      border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
      background: alpha(theme.palette.common.white, 0.6),
      backdropFilter: 'blur(10px)',
      boxShadow: `0 10px 30px ${alpha('#000', 0.08)}`,
    }),
    [theme]
  );

  const fieldSx = useMemo(
    () => ({
      '& .MuiInputLabel-root': { fontSize: 12.5 },
      '& .MuiFormHelperText-root': { marginLeft: 0, fontSize: 12 },
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.common.white, 0.65),
        minHeight: 36,
        '& input': { padding: '8px 12px', fontSize: 13.5, lineHeight: 1.25 },
        '& textarea': { padding: '8px 12px', fontSize: 13.5, lineHeight: 1.35 },
        '& .MuiSelect-select': { padding: '8px 36px 8px 12px', fontSize: 13.5, lineHeight: 1.25 },
        '& fieldset': { borderColor: alpha(theme.palette.divider, 0.7) },
        '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.5) },
        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 2 },
      },
    }),
    [theme]
  );

  const gradientBtnSx = useMemo(
    () => ({
      borderRadius: 999,
      px: 2.2,
      py: 1,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.28)}`,
      transform: 'translateY(0)',
      transition: 'transform .15s ease, box-shadow .15s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 14px 30px ${alpha(theme.palette.primary.main, 0.34)}`,
        backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
      },
    }),
    [theme]
  );

  const outlineBtnSx = useMemo(
    () => ({
      borderRadius: 999,
      px: 2.2,
      py: 1,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    }),
    []
  );

  const toast = useCallback((msg, severity = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // ====== itemNo debounce ======
  useEffect(() => {
    const timer = setTimeout(() => {
      const v = (formData.itemDescriptionVN || '').trim();
      if (mountedRef.current) setItemNoForSearch(v);
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.itemDescriptionVN]);

  const totalRequestQty = useMemo(
    () => deptRows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0),
    [deptRows]
  );

  const totalBuyQty = useMemo(
    () => deptRows.reduce((sum, row) => sum + (parseFloat(row.buy) || 0), 0),
    [deptRows]
  );

  const orderQtyError = useMemo(() => {
    const confirmed = Number(formData.dailyMedInventory);
    if (formData.dailyMedInventory === '' || totalRequestQty <= 0) return '';
    if (!Number.isFinite(confirmed)) return '';
    return confirmed > totalRequestQty
      ? `Confirmed MED Quantity cannot exceed total request (${totalRequestQty})`
      : '';
  }, [formData.dailyMedInventory, totalRequestQty]);

  const validateDeptDuplicates = useCallback((rows) => {
    const errors = rows.map((row, idx) => {
      if (!row.id) return '';
      const dup = rows.some((r, i) => String(r.id) === String(row.id) && i !== idx);
      return dup ? 'This department is already selected' : '';
    });
    setDeptErrors(errors);
    return errors;
  }, []);

  const autoAllocateBuy = useCallback(
    (rows, confirmedInput) => {
      const confirmed = parseFloat(confirmedInput);
      if (!Number.isFinite(confirmed) || confirmed <= 0 || totalRequestQty === 0) {
        return rows.map((r) => ({ ...r, buy: '' }));
      }

      const effective = Math.min(confirmed, totalRequestQty);

      const sorted = rows
        .map((r, i) => ({ ...r, idx: i }))
        .filter((r) => r.id && (parseFloat(r.qty) || 0) > 0)
        .sort((a, b) => (parseFloat(a.qty) || 0) - (parseFloat(b.qty) || 0) || a.idx - b.idx);

      const allocated = {};
      let remain = effective;

      for (const row of sorted) {
        if (remain <= 0) break;
        const req = parseFloat(row.qty) || 0;
        const give = Math.min(req, remain);
        allocated[String(row.id)] = give;
        remain -= give;
      }

      return rows.map((row) => ({
        ...row,
        buy: row.id && allocated[String(row.id)] !== undefined ? String(allocated[String(row.id)]) : '',
      }));
    },
    [totalRequestQty]
  );

  useEffect(() => {
    if (orderQtyError) {
      setDeptRows((prev) => prev.map((r) => ({ ...r, buy: '' })));
      return;
    }

    if (formData.dailyMedInventory === '' || formData.dailyMedInventory === null || formData.dailyMedInventory === undefined) {
      setDeptRows((prev) => prev.map((r) => ({ ...r, buy: '' })));
      return;
    }

    setDeptRows((prev) => autoAllocateBuy(prev, formData.dailyMedInventory));
  }, [formData.dailyMedInventory, autoAllocateBuy, orderQtyError]);

  /**
   * ✅ fetch currency + departments (email + token giống mẫu)
   */
  const fetchData = useCallback(async () => {
    if (!groupId) {
      if (mountedRef.current) {
        setGroupCurrency('VND');
        setDepartmentList([]);
      }
      return;
    }

    const email = getUserEmail();
    const token = getAccessToken();

    setLoadingCurrency(true);
    setLoadingDepartments(true);
    setCurrencyError(null);

    try {
      const currencyUrl =
        `${API_BASE_URL}/api/group-summary-requisitions/${groupId}` +
        (email ? `?email=${encodeURIComponent(email)}` : '');

      const [currencyRes, deptRes] = await Promise.all([
        fetch(currencyUrl, {
          method: 'GET',
          headers: {
            accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE_URL}/api/departments`, {
          method: 'GET',
          headers: {
            accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      if (mountedRef.current) {
        if (currencyRes.ok) {
          const c = await currencyRes.json().catch(() => ({}));
          setGroupCurrency(normalizeCurrencyCode(c.currency));
        } else {
          setGroupCurrency('VND');
          setCurrencyError('Cannot load currency, fallback to VND');
        }

        if (deptRes.ok) {
          const d = await deptRes.json().catch(() => []);
          setDepartmentList(d || []);
        } else {
          setDepartmentList([]);
        }
      }
    } catch (err) {
      console.error(err);
      if (mountedRef.current) {
        setGroupCurrency('VND');
        setCurrencyError('Cannot load currency, fallback to VND');
        setDepartmentList([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingCurrency(false);
        setLoadingDepartments(false);
      }
    }
  }, [groupId]);

  // init/reset when open
  useEffect(() => {
    if (!open) return;

    mountedRef.current = true;

    fetchData();

    setFormData({ ...defaultFormData, groupId: groupId || '' });
    setDeptRows([{ id: '', name: '', qty: '', buy: '' }]);
    setDeptErrors(['']);

    setSelectedSupplier(null);
    setShowSupplierSelector(true);

    setIsEnManuallyEdited(false);
    setItemNoForSearch('');
    setConfirmOpen(false);

    // reset files
    setFiles([]);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });

    return () => {
      mountedRef.current = false;
    };
  }, [open, groupId, fetchData, defaultFormData]);

  // cleanup when component unmount (just in case)
  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ✅ translate kèm token (giống mẫu)
   */
  const translateText = useCallback(
    async (text) => {
      if (!text || isEnManuallyEdited) return;
      setTranslating(true);

      try {
        const token = getAccessToken();
        const res = await fetch(`${API_BASE_URL}/api/translate/vi-to-en`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text }),
        });

        const data = await res.json().catch(() => ({}));

        if (mountedRef.current) {
          setFormData((prev) => ({ ...prev, itemDescriptionEN: data.translatedText || '' }));
        }
      } catch (e) {
        // ignore
      } finally {
        if (mountedRef.current) setTranslating(false);
      }
    },
    [isEnManuallyEdited]
  );

  const debouncedTranslate = useMemo(() => debounce(translateText, 600), [translateText]);

  useEffect(() => {
    if (formData.itemDescriptionVN && !isEnManuallyEdited) debouncedTranslate(formData.itemDescriptionVN);
    return () => debouncedTranslate.cancel?.();
  }, [formData.itemDescriptionVN, debouncedTranslate, isEnManuallyEdited]);

  const handleSelectSupplier = (supplierData) => {
    if (!supplierData) {
      setFormData((prev) => ({
        ...prev,
        oldSAPCode: '',
        supplierId: '',
        unit: '',
        supplierPrice: 0,
        productType1Id: '',
        productType2Id: '',
      }));
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      return;
    }

    const price = parseFloat(supplierData.supplierPrice) || 0;

    setFormData((prev) => ({
      ...prev,
      oldSAPCode: supplierData.oldSapCode || '',
      supplierId: supplierData.supplierId || '',
      unit: supplierData.unit || '',
      supplierPrice: price,
      productType1Id: supplierData.productType1Id || '',
      productType2Id: supplierData.productType2Id || '',
      fullDescription: supplierData.fullItemDescriptionVN || prev.fullDescription || '',
    }));

    setSelectedSupplier({
      supplierName: supplierData.supplierName || 'Unknown',
      sapCode: supplierData.oldSapCode || '',
      price,
      unit: supplierData.unit || '',
      currency: supplierData.currency || groupCurrency,
    });

    setShowSupplierSelector(false);
  };

  // ✅ FIX: nhập số 0 không bị biến thành ''
  const handleChange = (field) => (e) => {
    const raw = e.target.value;

    const numberFields = new Set(['dailyMedInventory', 'supplierPrice']);
    let val = raw;

    if (numberFields.has(field)) {
      if (raw === '' || raw === null || raw === undefined) {
        val = '';
      } else {
        const n = parseFloat(raw);
        val = Number.isFinite(n) ? n : '';
      }
    }

    setFormData((prev) => ({ ...prev, [field]: val }));
    if (field === 'itemDescriptionEN') setIsEnManuallyEdited(true);
    if (field === 'itemDescriptionVN') setIsEnManuallyEdited(false);
  };

  const handleDeptChange = (i, field, val) => {
    setDeptRows((prev) => {
      const updated = [...prev];

      if (field === 'id') {
        const dept = departmentList.find((d) => String(d.id) === String(val));
        updated[i] = { ...updated[i], id: val, name: dept?.departmentName || '' };
      } else {
        updated[i] = { ...updated[i], [field]: val };
      }

      validateDeptDuplicates(updated);
      return updated;
    });
  };

  const handleAddDeptRow = () => {
    setDeptRows((prev) => {
      const next = [...prev, { id: '', name: '', qty: '', buy: '' }];
      setDeptErrors((e) => [...e, '']);
      return next;
    });
  };

  const handleDeleteDeptRow = (i) => {
    setDeptRows((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      const safe = next.length ? next : [{ id: '', name: '', qty: '', buy: '' }];
      validateDeptDuplicates(safe);
      return safe;
    });
  };

  const handleFileChange = (e) => {
    const remain = 10 - files.length;
    const selected = Array.from(e.target.files || []).slice(0, Math.max(0, remain));
    const valid = selected.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);

    if (valid.length < selected.length) toast('Only images ≤ 5MB allowed', 'warning');

    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);

    e.target.value = null;
  };

  const handleRemoveFile = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleClose = () => {
    if (locked) return;
    onClose?.();
  };

  const handleAddClick = () => {
    if (!formData.itemDescriptionVN?.trim()) return toast('Item Description (VN) is required', 'error');
    if (!formData.supplierId) return toast('Supplier is required', 'error');
    if (totalRequestQty === 0) return toast('At least one department must have Qty', 'error');
    if (deptErrors.some(Boolean)) return toast('Please fix duplicate department selections', 'error');

    if (
      formData.dailyMedInventory === '' ||
      formData.dailyMedInventory === null ||
      formData.dailyMedInventory === undefined
    ) {
      return toast('Confirmed MED Quantity is required', 'error');
    }

    if (orderQtyError) return toast(orderQtyError, 'error');

    setConfirmOpen(true);
  };

  /**
   * ✅ CREATE: đúng pattern mẫu (email query param + token + parse response)
   * ✅ gửi đủ field hay bị thiếu (unit, supplierPrice, productType1Id/2Id)
   * ✅ fallback endpoint chỉ khi 404/405
   */
  const handleConfirmAdd = async () => {
    const departmentRequisitions = deptRows
      .filter((r) => r.id && r.qty !== '' && r.qty !== null && r.qty !== undefined)
      .map((r) => ({
        id: r.id,
        name:
          r.name ||
          departmentList.find((d) => String(d.id) === String(r.id))?.departmentName ||
          '',
        qty: parseFloat(r.qty) || 0,
        buy: parseFloat(r.buy) || 0,
      }));

    const fd = new FormData();
    fd.append('itemDescriptionEN', formData.itemDescriptionEN || '');
    fd.append('itemDescriptionVN', formData.itemDescriptionVN || '');
    fd.append('fullDescription', formData.fullDescription || '');

    fd.append('oldSAPCode', formData.oldSAPCode || '');
    fd.append('hanaSAPCode', formData.hanaSAPCode || '');

    fd.append(
      'dailyMedInventory',
      Number.isFinite(+formData.dailyMedInventory) ? String(formData.dailyMedInventory) : '0'
    );

    fd.append('reason', formData.reason || '');
    fd.append('remark', formData.remark || '');
    fd.append('remarkComparison', formData.remarkComparison || '');

    fd.append('supplierId', formData.supplierId || '');
    fd.append('groupId', groupId || '');

    fd.append('productType1Id', formData.productType1Id || '');
    fd.append('productType2Id', formData.productType2Id || '');
    fd.append('unit', formData.unit || '');
    fd.append(
      'supplierPrice',
      Number.isFinite(+formData.supplierPrice) ? String(formData.supplierPrice) : '0'
    );

    fd.append('departmentRequisitions', JSON.stringify(departmentRequisitions));
    files.forEach((f) => fd.append('files', f));

    setSaving(true);

    try {
      const email = getUserEmail();
      if (!email) throw new Error('Missing email. Please login again.');

      const token = getAccessToken();

      const urls = [
        `${API_BASE_URL}/requisition-monthly?email=${encodeURIComponent(email)}`,
        `${API_BASE_URL}/requisition-monthly/create?email=${encodeURIComponent(email)}`,
      ];

      let res = null;
      let usedUrl = '';

      for (const u of urls) {
        usedUrl = u;

        res = await fetch(u, {
          method: 'POST',
          headers: {
            accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        });

        if (res.status !== 404 && res.status !== 405) break;
      }

      if (!res) throw new Error('No response from server');

      let data = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) data = await res.json().catch(() => ({}));
      else data = { message: await res.text().catch(() => '') };

      if (!res.ok) {
        console.error('Create monthly failed:', { usedUrl, status: res.status, data });
        throw new Error(data?.message || `Add failed (${res.status})`);
      }

      toast('Added successfully!', 'success');
      setConfirmOpen(false);
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast(err.message || 'Add failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const titleName = formData.itemDescriptionVN?.trim() || 'this item';

  return (
    <>
      {/* MAIN DIALOG */}
      <Dialog
        open={open}
        onClose={locked ? undefined : handleClose}
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: paperSx }}
      >
        {/* Header */}
        <DialogTitle sx={headerSx}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  fontSize: { xs: 16.5, sm: 18.5 },
                }}
              >
                Add Monthly Requisition
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 12.5 }}>
                Fill item info, supplier, departments, and attachments
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label={loadingCurrency ? 'Loading...' : `Currency: ${groupCurrency}`}
                sx={{
                  color: 'common.white',
                  bgcolor: alpha('#000', 0.18),
                  border: `1px solid ${alpha('#fff', 0.22)}`,
                  fontWeight: 700,
                }}
              />

              <Tooltip title="Close">
                <span>
                  <IconButton
                    onClick={handleClose}
                    disabled={locked}
                    sx={{
                      color: 'common.white',
                      bgcolor: alpha('#000', 0.18),
                      border: `1px solid ${alpha('#fff', 0.22)}`,
                      '&:hover': { bgcolor: alpha('#000', 0.28) },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1.8, sm: 2.2 } }}>
          <Stack spacing={1.4}>
            {currencyError && (
              <Alert severity="warning" sx={{ borderRadius: 3 }}>
                {currencyError}
              </Alert>
            )}

            {/* ITEM INFO */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Item Information</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                VN is required; EN can auto-translate (you can override manually).
              </Typography>

              <Divider sx={{ my: 1.2 }} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.2,
                }}
              >
                <TextField
                  label="Old SAP Code"
                  value={formData.oldSAPCode}
                  onChange={handleChange('oldSAPCode')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                />
                <TextField
                  label="Hana SAP Code"
                  value={formData.hanaSAPCode}
                  onChange={handleChange('hanaSAPCode')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                />

                <TextField
                  label="Item Description (VN) *"
                  value={formData.itemDescriptionVN}
                  onChange={handleChange('itemDescriptionVN')}
                  size="small"
                  fullWidth
                  required
                  disabled={locked}
                  sx={fieldSx}
                />

                <TextField
                  label="Item Description (EN)"
                  value={formData.itemDescriptionEN}
                  onChange={handleChange('itemDescriptionEN')}
                  size="small"
                  fullWidth
                  disabled={locked || translating}
                  sx={fieldSx}
                  InputProps={{
                    endAdornment: translating ? <CircularProgress size={16} /> : null,
                  }}
                />

                <TextField
                  label="Full Description"
                  value={formData.fullDescription}
                  onChange={handleChange('fullDescription')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                  multiline
                  rows={2}
                  style={{ gridColumn: '1 / span 2' }}
                />
              </Box>

              <Box
                sx={{
                  mt: 1.2,
                  p: 1.1,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <InfoRoundedIcon sx={{ fontSize: 18, mt: '2px', color: alpha(theme.palette.primary.main, 0.8) }} />
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    <b>Tip:</b> Use consistent naming so search/duplicate detection is cleaner.
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* SUPPLIER */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Supplier</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                Select supplier to auto-fill unit, price, product type.
              </Typography>

              <Divider sx={{ my: 1.2 }} />

              {showSupplierSelector ? (
                <Box
                  sx={{
                    borderRadius: 4,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.9)}`,
                    background: alpha('#fff', 0.65),
                    p: 1.2,
                  }}
                >
                  <SupplierSelector
                    oldSapCode={formData.oldSAPCode}
                    itemNo={itemNoForSearch}
                    onSelectSupplier={handleSelectSupplier}
                    currency={groupCurrency}
                    disabled={locked || loadingCurrency}
                  />
                </Box>
              ) : selectedSupplier ? (
                <Box
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    background: alpha('#fff', 0.7),
                    p: 1.4,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Selected Supplier</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 14.5, color: '#111827', mt: 0.2 }}>
                    {selectedSupplier.supplierName}
                  </Typography>

                  <Box sx={{ mt: 0.8, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.9 }}>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      SAP Code: <b>{selectedSupplier.sapCode || '—'}</b>
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      Unit: <b>{selectedSupplier.unit || '—'}</b>
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      Price:{' '}
                      <b>
                        {selectedSupplier.price > 0
                          ? selectedSupplier.price.toLocaleString('vi-VN', {
                              style: 'currency',
                              currency: selectedSupplier.currency || groupCurrency,
                            })
                          : '—'}
                      </b>
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      Currency: <b>{selectedSupplier.currency || groupCurrency}</b>
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    disabled={locked}
                    onClick={() => setShowSupplierSelector(true)}
                    sx={{ mt: 1.1, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                  >
                    Change Supplier
                  </Button>
                </Box>
              ) : null}
            </Box>

            {/* DEPARTMENTS */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Department Request Qty</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                Qty per department. Buy auto-allocates based on confirmed MED.
              </Typography>

              <Divider sx={{ my: 1.2 }} />

              <Stack spacing={1}>
                {deptRows.map((row, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' },
                      gap: 1,
                      alignItems: 'center',
                    }}
                  >
                    <FormControl
                      fullWidth
                      size="small"
                      error={!!deptErrors[i]}
                      sx={fieldSx}
                      disabled={locked || loadingDepartments}
                    >
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={row.id}
                        label="Department"
                        onChange={(e) => handleDeptChange(i, 'id', e.target.value)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {departmentList.map((d) => (
                          <MenuItem key={d.id} value={String(d.id)}>
                            {d.departmentName}
                          </MenuItem>
                        ))}
                      </Select>
                      {deptErrors[i] && <FormHelperText>{deptErrors[i]}</FormHelperText>}
                    </FormControl>

                    <TextField
                      label="Qty"
                      type="number"
                      size="small"
                      value={row.qty}
                      disabled={locked}
                      onChange={(e) => handleDeptChange(i, 'qty', e.target.value)}
                      sx={fieldSx}
                      inputProps={{ min: 0 }}
                    />

                    <TextField
                      label="Buy"
                      type="number"
                      size="small"
                      value={row.buy || ''}
                      disabled
                      sx={{
                        ...fieldSx,
                        '& .MuiOutlinedInput-root': {
                          ...(fieldSx['& .MuiOutlinedInput-root'] || {}),
                          backgroundColor: alpha(theme.palette.action.disabledBackground, 0.55),
                        },
                      }}
                    />

                    <Tooltip title="Remove row">
                      <span>
                        <IconButton
                          onClick={() => handleDeleteDeptRow(i)}
                          disabled={locked || deptRows.length <= 1}
                          color="error"
                          size="small"
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                            bgcolor: alpha(theme.palette.error.main, 0.05),
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                ))}

                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddDeptRow}
                  variant="outlined"
                  size="small"
                  disabled={locked}
                  sx={{
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 800,
                    px: 1.6,
                  }}
                >
                  Add Department
                </Button>

                <Box
                  sx={{
                    mt: 0.6,
                    p: 1.2,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="space-between">
                    <Typography sx={{ fontSize: 12.8, color: 'text.secondary' }}>
                      <b>Total Request:</b>{' '}
                      <span style={{ color: theme.palette.primary.main }}>{totalRequestQty}</span>
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, color: 'text.secondary' }}>
                      <b>Total Buy:</b>{' '}
                      <span style={{ color: theme.palette.primary.main }}>{totalBuyQty}</span>
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, color: 'text.secondary' }}>
                      <b>Unit:</b> {formData.unit || '-'}
                    </Typography>
                  </Stack>
                </Box>

                <TextField
                  label="Confirmed MED Quantity *"
                  type="number"
                  value={formData.dailyMedInventory}
                  onChange={handleChange('dailyMedInventory')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  error={!!orderQtyError}
                  helperText={orderQtyError || `Total request: ${totalRequestQty}`}
                  sx={fieldSx}
                  inputProps={{ min: 0 }}
                />
              </Stack>
            </Box>

            {/* NOTES */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Notes</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                Reason, remark, and comparison notes.
              </Typography>

              <Divider sx={{ my: 1.2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                <TextField
                  label="Reason"
                  value={formData.reason}
                  onChange={handleChange('reason')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                  multiline
                  rows={2}
                />
                <TextField
                  label="Remark"
                  value={formData.remark}
                  onChange={handleChange('remark')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                  multiline
                  rows={2}
                />
                <TextField
                  label="Remark Comparison"
                  value={formData.remarkComparison || ''}
                  onChange={handleChange('remarkComparison')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                  multiline
                  rows={2}
                  style={{ gridColumn: '1 / span 2' }}
                />
              </Box>
            </Box>

            {/* IMAGES */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Images</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                Max 10 images, ≤ 5MB each.
              </Typography>

              <Divider sx={{ my: 1.2 }} />

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    disabled={locked || files.length >= 10}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 800,
                      px: 1.6,
                    }}
                  >
                    Choose Images
                    <input hidden multiple accept="image/*" type="file" onChange={handleFileChange} />
                  </Button>

                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    {files.length}/10 selected
                  </Typography>
                </Stack>

                {previews.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                    {previews.map((url, i) => (
                      <Box key={i} sx={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt=""
                          style={{
                            height: 88,
                            width: 132,
                            objectFit: 'cover',
                            borderRadius: 12,
                            border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                          }}
                        />
                        <Tooltip title="Remove">
                          <span>
                            <IconButton
                              size="small"
                              disabled={locked}
                              onClick={() => handleRemoveFile(i)}
                              sx={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                bgcolor: alpha('#fff', 0.85),
                                border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                                width: 30,
                                height: 30,
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.2 }, py: 1.8, gap: 1 }}>
          <Button onClick={handleClose} disabled={locked} variant="outlined" sx={outlineBtnSx}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleAddClick}
            disabled={locked || !!orderQtyError || deptErrors.some(Boolean)}
            sx={gradientBtnSx}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM DIALOG */}
      <Dialog
        open={confirmOpen}
        onClose={() => (!locked ? setConfirmOpen(false) : null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
            background: alpha('#FFFFFF', 0.92),
            backdropFilter: 'blur(14px)',
            boxShadow: `0 22px 70px ${alpha('#000', 0.18)}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm Add</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 13.5 }}>
            Are you sure you want to add <b>{titleName}</b>?
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 1.4,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            }}
          >
            <Stack spacing={0.6}>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Total Request: <b>{totalRequestQty}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Total Buy: <b>{totalBuyQty}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Confirmed MED: <b>{formData.dailyMedInventory === '' ? '—' : formData.dailyMedInventory}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Supplier: <b>{selectedSupplier?.supplierName || '—'}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Images: <b>{files.length}</b>
              </Typography>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={locked} variant="outlined" sx={outlineBtnSx}>
            No
          </Button>
          <Button onClick={handleConfirmAdd} disabled={locked} variant="contained" sx={{ ...gradientBtnSx, px: 2.4 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
