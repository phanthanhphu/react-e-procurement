// EditRequisitionMonthly.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

import { debounce } from 'lodash';
import { API_BASE_URL } from '../../config';
import SupplierSelector from './SupplierSelector';

/* =========================
   ✅ Helpers: token + email (same pattern as CREATE)
========================= */
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
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

const withEmailParam = (url, email) => {
  if (!email) return url;
  return url.includes('?')
    ? `${url}&email=${encodeURIComponent(email)}`
    : `${url}?email=${encodeURIComponent(email)}`;
};

const readBodyByContentType = async (res) => {
  const ct = res?.headers?.get?.('content-type') || '';
  if (ct.includes('application/json')) return res.json().catch(() => ({}));
  return { message: await res.text().catch(() => '') };
};

// BE-friendly: sometimes API returns {message,data}, sometimes returns object directly
const unwrapData = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload;
};

/**
 * ✅ IMPORTANT:
 * Intl.NumberFormat / toLocaleString with { style:'currency' } chỉ chấp nhận ISO-4217 (EUR, USD, VND...)
 * Nếu backend trả "EURO" thì KHÔNG được dùng style:'currency' -> sẽ throw RangeError.
 *
 * Theo yêu cầu của bạn: "không map EURO -> EUR", ta sẽ:
 * - normalize: chỉ upper/trim, giữ nguyên EURO
 * - formatMoney: nếu là ISO -> dùng style currency
 *               nếu không (EURO) -> format số + " EURO" (fallback) để không crash UI
 */
const normalizeCurrencyCode = (code) => {
  if (!code) return 'VND';
  return String(code).trim().toUpperCase();
};

const ISO_CURRENCIES = new Set([
  'VND',
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'HKD',
  'KRW',
  'SGD',
]);

const formatMoney = (value, currency, locale = 'vi-VN') => {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  const cur = normalizeCurrencyCode(currency);

  if (ISO_CURRENCIES.has(cur)) {
    try {
      return safe.toLocaleString(locale, { style: 'currency', currency: cur });
    } catch {
      // fallback below
    }
  }

  // Fallback for non-ISO currency code like "EURO"
  return `${safe.toLocaleString(locale)} ${cur}`;
};

// ✅ robust hana sap key
const pickHanaSAPCode = (supplierData) =>
  supplierData?.hanaSapCode ||
  supplierData?.hanaSAPCode ||
  supplierData?.hanaCode ||
  supplierData?.hana ||
  '';

// ✅ PATCH: helper pick first non-empty string
const pickFirst = (...vals) =>
  vals.find((v) => typeof v === 'string' && v.trim() !== '') || '';

export default function EditRequisitionMonthly({ open, item, onClose, onRefresh }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const mountedRef = useRef(false);

  const [formData, setFormData] = useState({
    itemDescriptionEN: '',
    itemDescriptionVN: '',
    fullDescription: '',
    oldSAPCode: '',
    hanaSAPCode: '',
    dailyMedInventory: '',
    safeStock: '',
    reason: '',
    remark: '',
    supplierId: '',
    groupId: '',
    productType1Id: '',
    productType2Id: '',
    unit: '',
    supplierPrice: 0,
  });

  // ✅ NEW: Request Unit (editable, stable when supplier changes)
  const [requestUnit, setRequestUnit] = useState('');

  const [deptRows, setDeptRows] = useState([{ id: '', name: '', qty: '', buy: '' }]);
  const [deptErrors, setDeptErrors] = useState(['']);
  const [saving, setSaving] = useState(false);

  const [departmentList, setDepartmentList] = useState([]);
  const [translating, setTranslating] = useState(false);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierSelector, setShowSupplierSelector] = useState(true);

  // ✅ force reset SupplierSelector UI filters
  const [supplierSelectorKey, setSupplierSelectorKey] = useState(0);

  const [isEnManuallyEdited, setIsEnManuallyEdited] = useState(false);
  const [groupCurrency, setGroupCurrency] = useState('VND');
  const [loadingCurrency, setLoadingCurrency] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const prevConfirmedRef = useRef('');

  // ✅ NEW: Completed lock (cannot leave supplier empty once completed)
  const completedLockRef = useRef(false);
  const initialSupplierRef = useRef({ supplierId: '', supplierName: '' });

  const locked = saving;

  /* =========================
     ✅ UI TOKENS (glass + gradient + compact)
  ========================= */
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

  const paperSxEnhanced = useMemo(
    () => ({
      ...paperSx,
      width: 'min(1680px, 98vw)',
      maxWidth: '98vw',
      maxHeight: fullScreen ? '100vh' : '92vh',
    }),
    [paperSx, fullScreen]
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

  /* =========================
     ✅ computed values
  ========================= */
  const totalRequestQty = useMemo(
    () => deptRows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0),
    [deptRows]
  );

  const totalBuyQty = useMemo(
    () => deptRows.reduce((sum, r) => sum + (parseFloat(r.buy) || 0), 0),
    [deptRows]
  );

  const orderQtyError = useMemo(() => {
    if (formData.dailyMedInventory === '' || totalRequestQty <= 0) return '';
    const confirmed = parseFloat(String(formData.dailyMedInventory));
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

  // ✅ Change supplier: keep requestUnit stable (DO NOT reset unit)
  const changeSupplier = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      supplierId: '',
      unit: requestUnit || prev.unit || '', // ✅ keep requestUnit
      supplierPrice: 0,
      productType1Id: '',
      productType2Id: '',
    }));
    setSelectedSupplier(null);
    setShowSupplierSelector(true);
    setSupplierSelectorKey((k) => k + 1);
  }, [requestUnit]);

  // AUTO ALLOCATE BUY (only when confirmed changes)
  useEffect(() => {
    const currentConfirmedStr =
      formData.dailyMedInventory === null || formData.dailyMedInventory === undefined
        ? ''
        : String(formData.dailyMedInventory);

    const currentConfirmed = parseFloat(currentConfirmedStr);

    if (currentConfirmedStr === prevConfirmedRef.current) return;
    prevConfirmedRef.current = currentConfirmedStr;

    if (
      currentConfirmedStr === '' ||
      !Number.isFinite(currentConfirmed) ||
      currentConfirmed <= 0 ||
      currentConfirmed > totalRequestQty
    ) {
      setDeptRows((prev) => prev.map((r) => ({ ...r, buy: '' })));
      return;
    }

    setDeptRows((prev) => {
      const validRows = prev
        .map((r, i) => ({ ...r, qtyNum: parseFloat(r.qty) || 0, idx: i }))
        .filter((r) => r.qtyNum > 0)
        .sort((a, b) => a.qtyNum - b.qtyNum || a.idx - b.idx);

      if (validRows.length === 0) return prev;

      let remaining = currentConfirmed;
      const newRows = [...prev].map((r) => ({ ...r, buy: '' }));

      validRows.forEach((row) => {
        if (remaining <= 0) return;
        const allocate = Math.min(row.qtyNum, remaining);
        newRows[row.idx].buy = String(allocate);
        remaining -= allocate;
      });

      return newRows;
    });
  }, [formData.dailyMedInventory, totalRequestQty]);

  /* =========================
     ✅ mounted guard + cleanup previews
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     ✅ TRANSLATE
  ========================= */
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

        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const translatedText = json?.translatedText || '';
          if (mountedRef.current) {
            setFormData((prev) => ({ ...prev, itemDescriptionEN: translatedText }));
          }
        }
      } catch {
        // ignore
      } finally {
        if (mountedRef.current) setTranslating(false);
      }
    },
    [isEnManuallyEdited]
  );

  const debouncedTranslate = useMemo(() => debounce(translateText, 600), [translateText]);

  useEffect(() => {
    const vn = (formData.itemDescriptionVN || '').trim();
    const en = (formData.itemDescriptionEN || '').trim();

    if (vn && !isEnManuallyEdited && !en) {
      debouncedTranslate(vn);
    }

    return () => debouncedTranslate.cancel?.();
  }, [formData.itemDescriptionVN, formData.itemDescriptionEN, debouncedTranslate, isEnManuallyEdited]);

  /* =========================
     ✅ LOAD DATA
  ========================= */
  useEffect(() => {
    if (!open || !item?.id) {
      setDeptRows([{ id: '', name: '', qty: '', buy: '' }]);
      setDeptErrors(['']);

      setImageUrls([]);
      setImagesToDelete([]);

      setFiles([]);
      setPreviews((p) => {
        p.forEach(URL.revokeObjectURL);
        return [];
      });

      prevConfirmedRef.current = '';

      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      setSupplierSelectorKey((k) => k + 1);

      setConfirmOpen(false);

      setGroupCurrency('VND');
      setIsEnManuallyEdited(false);

      // ✅ reset completed lock
      completedLockRef.current = false;
      initialSupplierRef.current = { supplierId: '', supplierName: '' };

      setFormData({
        itemDescriptionEN: '',
        itemDescriptionVN: '',
        fullDescription: '',
        oldSAPCode: '',
        hanaSAPCode: '',
        dailyMedInventory: '',
        safeStock: '',
        reason: '',
        remark: '',
        supplierId: '',
        groupId: '',
        productType1Id: '',
        productType2Id: '',
        unit: '',
        supplierPrice: 0,
      });

      setRequestUnit('');
      return;
    }

    const fetchWithFallback = async (urls, token) => {
      let res = null;
      for (const u of urls) {
        res = await fetch(u, {
          method: 'GET',
          headers: {
            accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.status !== 404 && res.status !== 405) break;
      }
      return res;
    };

    const loadData = async () => {
      const email = getUserEmail();
      const token = getAccessToken();

      setLoadingCurrency(true);

      try {
        const reqUrls = [withEmailParam(`${API_BASE_URL}/requisition-monthly/${item.id}`, email)];

        const groupUrls = [
          withEmailParam(`${API_BASE_URL}/api/group-summary-requisitions/${item.groupId || ''}`, email),
        ];

        const [reqRes, deptRes, groupRes] = await Promise.all([
          fetchWithFallback(reqUrls, token),
          fetch(`${API_BASE_URL}/api/departments`, {
            method: 'GET',
            headers: {
              accept: '*/*',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetchWithFallback(groupUrls, token).catch(() => ({ ok: false, status: 0, headers: new Headers() })),
        ]);

        if (!reqRes?.ok) {
          const body = reqRes ? await readBodyByContentType(reqRes) : {};
          throw new Error(body?.message || 'Failed to load requisition');
        }

        const rawReq = await readBodyByContentType(reqRes);
        const data = unwrapData(rawReq) || {};

        // ✅ Completed lock detection (robust)
        const wasCompleted =
          !!data?.completedDate ||
          data?.isCompleted === true ||
          data?.completed === true ||
          String(data?.status || '').toLowerCase() === 'completed';

        completedLockRef.current = wasCompleted;
        initialSupplierRef.current = {
          supplierId: data?.supplierId || '',
          supplierName: data?.supplierName || '',
        };

        if (!mountedRef.current) return;

        setFormData({
          itemDescriptionEN: data.itemDescriptionEN || '',
          itemDescriptionVN: data.itemDescriptionVN || '',
          fullDescription: data.fullDescription || '',
          oldSAPCode: data.oldSapCode || data.oldSAPCode || '',
          hanaSAPCode: data.hanaSapCode || data.hanaSAPCode || '',
          dailyMedInventory:
            data.dailyMedInventory !== undefined && data.dailyMedInventory !== null
              ? String(data.dailyMedInventory)
              : '',
          safeStock: data.safeStock !== undefined && data.safeStock !== null ? String(data.safeStock) : '',
          reason: data.reason || '',
          remark: data.remark || '',
          supplierId: data.supplierId || '',
          groupId: data.groupId || item.groupId || '',
          productType1Id:
            data.productType1Id !== undefined && data.productType1Id !== null ? String(data.productType1Id) : '',
          productType2Id:
            data.productType2Id !== undefined && data.productType2Id !== null ? String(data.productType2Id) : '',
          unit: data.unit || '',
          supplierPrice: Number.isFinite(parseFloat(data.price)) ? parseFloat(data.price) : 0,
        });

        // ✅ NEW: stable requestUnit loaded from saved unit
        setRequestUnit(data.unit || '');

        prevConfirmedRef.current =
          data.dailyMedInventory !== undefined && data.dailyMedInventory !== null
            ? String(data.dailyMedInventory)
            : '';

        const depts = (data.departmentRequisitions || []).map((d) => ({
          id: d.id || '',
          name: d.name || '',
          qty: d.qty !== undefined && d.qty !== null ? String(d.qty) : '',
          buy: d.buy !== undefined && d.buy !== null ? String(d.buy) : '',
        }));

        const nextRows = depts.length > 0 ? depts : [{ id: '', name: '', qty: '', buy: '' }];
        setDeptRows(nextRows);
        setDeptErrors(new Array(nextRows.length).fill(''));
        validateDeptDuplicates(nextRows);

        setImageUrls(Array.isArray(data.imageUrls) ? data.imageUrls : []);
        setImagesToDelete([]);

        setFiles([]);
        setPreviews((p) => {
          p.forEach(URL.revokeObjectURL);
          return [];
        });

        if (data.supplierId) {
          setSelectedSupplier({
            supplierName: data.supplierName || 'Unknown',
            sapCode: data.oldSapCode || data.oldSAPCode || '',
            hanaSapCode: data.hanaSapCode || data.hanaSAPCode || '',
            price: Number.isFinite(parseFloat(data.price)) ? parseFloat(data.price) : 0,
            unit: data.unit || '',
            // ✅ keep EURO as EURO (no mapping)
            currency: normalizeCurrencyCode(data.currency || groupCurrency),
          });
          setShowSupplierSelector(false);
        } else {
          setSelectedSupplier(null);
          setShowSupplierSelector(true);
          setSupplierSelectorKey((k) => k + 1);
        }

        if (deptRes.ok) {
          const deps = await deptRes.json().catch(() => []);
          setDepartmentList(Array.isArray(deps) ? deps : []);
        } else {
          setDepartmentList([]);
        }

        if (groupRes?.ok) {
          const rawG = await readBodyByContentType(groupRes);
          const g = unwrapData(rawG) || {};
          setGroupCurrency(normalizeCurrencyCode(g.currency));
        } else {
          setGroupCurrency('VND');
        }

        setIsEnManuallyEdited(false);

        // ✅ IMPORTANT: reset supplier selector filters with prefill values
        setSupplierSelectorKey((k) => k + 1);
      } catch (err) {
        console.error(err);
        toast(err.message || 'Failed to load data', 'error');
      } finally {
        if (mountedRef.current) setLoadingCurrency(false);
      }
    };

    loadData();
  }, [open, item?.id, item?.groupId, toast, validateDeptDuplicates]);

  /* =========================
     ✅ UI handlers
  ========================= */
  const handleSelectSupplier = (supplierData) => {
    if (supplierData) {
      const price = parseFloat(supplierData.supplierPrice) || 0;
      const hana = pickHanaSAPCode(supplierData);

      // ✅ PATCH: lấy VN/EN từ supplierData (đa key cho chắc)
      const vn = pickFirst(
        supplierData.itemDescriptionVN,
        supplierData.vietnameseName,
        supplierData.descriptionVN,
        supplierData.descriptionVn,
        supplierData.vnDescription,
        supplierData.nameVN,
        supplierData.itemDescription
      );

      const en = pickFirst(
        supplierData.itemDescriptionEN,
        supplierData.englishName,
        supplierData.descriptionEN,
        supplierData.descriptionEn,
        supplierData.enDescription,
        supplierData.nameEN
      );

      setFormData((prev) => ({
        ...prev,
        supplierId: supplierData.supplierId || '',
        // ✅ IMPORTANT: unit NEVER overwritten by supplier -> keep requestUnit
        unit: requestUnit || prev.unit || '',
        supplierPrice: price,
        productType1Id:
          supplierData.productType1Id != null ? String(supplierData.productType1Id) : prev.productType1Id,
        productType2Id:
          supplierData.productType2Id != null ? String(supplierData.productType2Id) : prev.productType2Id,

        // ✅ PATCH: overwrite 4 fields giống CREATE
        oldSAPCode: supplierData.oldSapCode || supplierData.oldSAPCode || '',
        hanaSAPCode: hana || '',
        itemDescriptionVN: vn || '',
        itemDescriptionEN: en || '',
      }));

      setSelectedSupplier({
        supplierName: supplierData.supplierName || 'Unknown',
        sapCode: supplierData.oldSapCode || supplierData.oldSAPCode || '',
        hanaSapCode: hana || '',
        price,
        unit: requestUnit || '',
        // ✅ keep EURO as EURO (no mapping)
        currency: normalizeCurrencyCode(supplierData.currency || groupCurrency),
      });

      // ✅ Supplier overwrite EN => reset manual flag
      setIsEnManuallyEdited(false);

      // ✅ Nếu supplier có VN nhưng không có EN thì auto translate
      if (!en && vn) {
        debouncedTranslate(vn);
      }

      setShowSupplierSelector(false);
    } else {
      // user cleared supplier inside selector

      // ✅ BLOCK: if requisition already completed, supplier cannot be empty
      if (completedLockRef.current) {
        const oldName = initialSupplierRef.current?.supplierName || 'selected supplier';
        toast(
          `Cannot leave the supplier blank because this requisition has been marked as Completed. 
      Please keep ${oldName} or choose another supplier before saving.`,
          'error'
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        supplierId: '',
        unit: requestUnit || prev.unit || '',
        supplierPrice: 0,
        productType1Id: '',
        productType2Id: '',
      }));
      setSelectedSupplier(null);
      setShowSupplierSelector(true);
      setSupplierSelectorKey((k) => k + 1);
    }
  };

  const handleChange = (field) => (e) => {
    const raw = e.target.value;

    if (
      field === 'dailyMedInventory' ||
      field === 'safeStock' ||
      field === 'productType1Id' ||
      field === 'productType2Id'
    ) {
      if (raw === '' || raw === null || raw === undefined) {
        setFormData((prev) => ({ ...prev, [field]: '' }));
      } else {
        const n = parseFloat(raw);
        setFormData((prev) => ({ ...prev, [field]: Number.isFinite(n) ? String(n) : '' }));
      }
    } else if (field === 'supplierPrice') {
      if (raw === '' || raw === null || raw === undefined) {
        setFormData((prev) => ({ ...prev, supplierPrice: 0 }));
      } else {
        const n = parseFloat(raw);
        setFormData((prev) => ({ ...prev, supplierPrice: Number.isFinite(n) ? n : 0 }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: raw }));
    }

    if (field === 'itemDescriptionEN') setIsEnManuallyEdited((raw || '').trim().length > 0);
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

      const errors = updated.map((row, idx) => {
        if (!row.id) return '';
        const dup = updated.some((r, index) => String(r.id) === String(row.id) && index !== idx);
        return dup ? 'This department is already selected' : '';
      });
      setDeptErrors(errors);

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
      const finalRows = next.length ? next : [{ id: '', name: '', qty: '', buy: '' }];
      validateDeptDuplicates(finalRows);
      return finalRows;
    });
  };

  const totalImagesCount = useMemo(() => files.length + imageUrls.length, [files.length, imageUrls.length]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const valid = selected.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length < selected.length) toast('Only image files ≤ 5MB are allowed', 'warning');

    if (totalImagesCount + valid.length > 10) {
      toast('Maximum 10 images allowed', 'warning');
      e.target.value = null;
      return;
    }

    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);

    e.target.value = null;
  };

  const handleRemoveImage = (index) => {
    if (index < imageUrls.length) {
      const removed = imageUrls[index];
      setImageUrls((prev) => prev.filter((_, i) => i !== index));
      setImagesToDelete((prev) => [...prev, removed]);
      return;
    }

    const fileIdx = index - imageUrls.length;
    if (fileIdx >= 0 && fileIdx < previews.length) {
      URL.revokeObjectURL(previews[fileIdx]);
      setFiles((prev) => prev.filter((_, i) => i !== fileIdx));
      setPreviews((prev) => prev.filter((_, i) => i !== fileIdx));
    }
  };

  const handleClose = () => {
    if (locked) return;
    onClose?.();
  };

  const handleSaveClick = () => {
    if (!formData.itemDescriptionVN?.trim()) return toast('Item Description (VN) is required', 'error');
    if (totalRequestQty === 0) return toast('At least one department must have Qty', 'error');
    if (orderQtyError) return toast(orderQtyError, 'error');
    if (deptErrors.some(Boolean)) return toast('Please fix duplicate departments', 'error');

    if (!formData.groupId?.trim()) return toast('groupId is required', 'error');
    if (!formData.oldSAPCode?.trim()) return toast('oldSAPCode is required', 'error');

    // ✅ BLOCK SAVE: completed requisition cannot have empty supplier
    if (completedLockRef.current && !formData.supplierId?.trim()) {
      const oldName = initialSupplierRef.current?.supplierName || 'nhà cung cấp';
      return toast(
        `Requisition này đã Completed nên không thể lưu khi thiếu nhà cung cấp.
Hãy giữ ${oldName} hoặc chọn một nhà cung cấp khác rồi hãy bấm Save.`,
        'error'
      );
    }

    setConfirmOpen(true);
  };

  /* =========================
     ✅ UPDATE: PUT multipart + ?email=...
  ========================= */
  const handleConfirmSave = async () => {
    if (!item?.id) return;

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

    const appendIf = (fd, key, value) => {
      if (value === null || value === undefined) return;
      const s = String(value);
      if (s.trim() === '') return;
      fd.append(key, s);
    };

    const fd = new FormData();

    files.forEach((f) => fd.append('files', f));
    fd.append('requisitionId', String(item.id)); 
    fd.append('imagesToDelete', JSON.stringify(imagesToDelete || []));
    fd.append('departmentRequisitions', JSON.stringify(departmentRequisitions));

    fd.append('remark', formData.remark || '');
    fd.append('itemDescriptionVN', formData.itemDescriptionVN || '');
    fd.append('hanaSAPCode', formData.hanaSAPCode || '');
    fd.append('reason', formData.reason || '');
    fd.append('supplierId', formData.supplierId || '');
    fd.append('oldSAPCode', formData.oldSAPCode || '');
    fd.append('dailyMedInventory', formData.dailyMedInventory || '0');
    fd.append('fullDescription', formData.fullDescription || '');
    fd.append('itemDescriptionEN', formData.itemDescriptionEN || '');
    fd.append('groupId', formData.groupId || '');

    // ✅ IMPORTANT: Always send requestUnit as unit
    fd.append('unit', requestUnit || '');

    if (!formData.supplierId) {
      fd.append('supplierName', '');
      fd.append('price', '0');
    }

    appendIf(fd, 'safeStock', formData.safeStock);
    appendIf(fd, 'productType1Id', formData.productType1Id);
    appendIf(fd, 'productType2Id', formData.productType2Id);

    setSaving(true);

    try {
      const email = getUserEmail();
      if (!email) throw new Error('Missing email. Please login again.');

      const token = getAccessToken();

      const urls = [
        withEmailParam(`${API_BASE_URL}/requisition-monthly/${item.id}`, email),
        withEmailParam(`${API_BASE_URL}/api/requisition-monthly/${item.id}`, email),
      ];

      let res = null;
      let usedUrl = '';

      for (const u of urls) {
        usedUrl = u;
        res = await fetch(u, {
          method: 'PUT',
          headers: {
            accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        });

        if (res.status !== 404 && res.status !== 405) break;
      }

      if (!res) throw new Error('No response from server');

      const raw = await readBodyByContentType(res);
      const body = unwrapData(raw);

      if (!res.ok) {
        console.error('Update monthly failed:', { usedUrl, status: res.status, raw, body });
        throw new Error(raw?.message || `Update failed (${res.status})`);
      }

      toast('Updated successfully!', 'success');
      setConfirmOpen(false);
      onRefresh?.();
      onClose?.();
    } catch (err) {
      toast(err.message || 'Update failed', 'error');
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
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: paperSxEnhanced }}
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
                Edit Monthly Requisition
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 12.5 }}>
                Update item info, supplier, departments, and attachments
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
            {/* ITEM INFO */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Item Information</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                VN is required; EN auto-translates unless you edit it manually. If EN already has value, it won’t translate.
              </Typography>

              <Divider sx={{ my: 1.2 }} />

              {/* ✅ 3 columns: Old SAP | Hana | Request Unit */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
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
                  helperText="Selecting supplier will auto-fill SAP + Hana."
                />

                <TextField
                  label="Hana SAP Code"
                  value={formData.hanaSAPCode}
                  onChange={handleChange('hanaSAPCode')}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                  helperText="Auto-filled when selecting supplier, but you can edit it."
                />

                {/* ✅ NEW: Request Unit editable */}
                <TextField
                  label="Request Unit"
                  value={requestUnit}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRequestUnit(v);
                    setFormData((prev) => ({ ...prev, unit: v }));
                  }}
                  size="small"
                  fullWidth
                  disabled={locked}
                  sx={fieldSx}
                  helperText="Supplier list will filter by Request Unit"
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
                  style={{ gridColumn: '1 / span 2' }}
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
                  style={{ gridColumn: '1 / span 3' }}
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
                    <b>Tip:</b> If you override EN manually, auto-translate will stop. If you clear EN, it can translate again.
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* SUPPLIER */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Supplier</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                    Selecting supplier will auto-fill SAP + Hana. Unit stays as Request Unit.
                  </Typography>
                </Box>

                {!showSupplierSelector && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      if (completedLockRef.current) {
                        toast(
                          'This requisition has been completed. You can change the supplier, but it cannot be left blank when saving.',
                          'warning'
                        );
                      }
                      changeSupplier();
                    }}
                    disabled={locked}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                  >
                    Change supplier
                  </Button>
                )}
              </Stack>

              <Divider sx={{ my: 1.2 }} />

              {showSupplierSelector ? (
                <Box
                  sx={{
                    borderRadius: 4,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.9)}`,
                    background: alpha('#fff', 0.65),
                    p: 1.2,
                    overflowX: 'auto',
                    '& > .MuiPaper-root': { minWidth: 1400 },
                  }}
                >
                  <SupplierSelector
                    key={supplierSelectorKey}
                    onSelectSupplier={handleSelectSupplier}
                    currency={groupCurrency}
                    disabled={locked || loadingCurrency}
                    prefillSapCode={formData.oldSAPCode}
                    prefillHanaCode={formData.hanaSAPCode}
                    prefillItemDescriptionVN={formData.itemDescriptionVN}
                    prefillItemDescriptionEN={formData.itemDescriptionEN}
                    prefillUnit={(requestUnit || '').trim()} // ✅ NEW
                    requisitionId={item?.id || ''}// ✅ FIXED: pass real supplierId so filter-by-sapcode can use it
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

                  <Box
                    sx={{
                      mt: 0.8,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' },
                      gap: 0.9,
                    }}
                  >
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      SAP: <b>{selectedSupplier.sapCode || '—'}</b>
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      Hana: <b>{selectedSupplier.hanaSapCode || '—'}</b>
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      Unit: <b>{requestUnit || '—'}</b>
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      Price:{' '}
                      <b>
                        {formatMoney(
                          selectedSupplier.price || 0,
                          selectedSupplier.currency || groupCurrency,
                          'vi-VN'
                        )}
                      </b>
                    </Typography>
                  </Box>
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
                    <FormControl fullWidth size="small" error={!!deptErrors[i]} sx={fieldSx}>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={row.id}
                        label="Department"
                        disabled={locked}
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
                  sx={{ alignSelf: 'flex-start', borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 1.6 }}
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
                      <b>Total Request:</b> <span style={{ color: theme.palette.primary.main }}>{totalRequestQty}</span>
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, color: 'text.secondary' }}>
                      <b>Total Buy:</b> <span style={{ color: theme.palette.primary.main }}>{totalBuyQty}</span>
                    </Typography>
                    <Typography sx={{ fontSize: 12.8, color: 'text.secondary' }}>
                      <b>Unit:</b> {requestUnit || '-'}
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
                Reason and remark.
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
              </Box>
            </Box>

            {/* IMAGES */}
            <Box sx={{ ...subtleCardSx, p: 1.6 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Images</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.2 }}>
                Max 10 images total. Existing + new uploads.
              </Typography>

              <Divider sx={{ my: 1.2 }} />

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    disabled={locked || totalImagesCount >= 10}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 1.6 }}
                  >
                    Choose Images
                    <input hidden multiple accept="image/*" type="file" onChange={handleFileChange} />
                  </Button>

                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    {totalImagesCount}/10 in view
                  </Typography>

                  {imagesToDelete.length > 0 && (
                    <Chip
                      size="small"
                      label={`${imagesToDelete.length} marked for delete`}
                      sx={{
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.18)}`,
                        color: theme.palette.error.dark,
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>

                {(previews.length > 0 || imageUrls.length > 0) && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                    {imageUrls.map((url, i) => (
                      <Box key={`old-${i}`} sx={{ position: 'relative' }}>
                        <img
                          src={`${API_BASE_URL}${url}`}
                          alt={`Image ${i + 1}`}
                          style={{
                            height: 88,
                            width: 132,
                            objectFit: 'cover',
                            borderRadius: 12,
                            border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Tooltip title="Remove">
                          <span>
                            <IconButton
                              size="small"
                              disabled={locked}
                              onClick={() => handleRemoveImage(i)}
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

                    {previews.map((url, i) => (
                      <Box key={`new-${i}`} sx={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt={`New ${i + 1}`}
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
                              onClick={() => handleRemoveImage(i + imageUrls.length)}
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
            onClick={handleSaveClick}
            disabled={locked || !!orderQtyError || deptErrors.some(Boolean)}
            sx={gradientBtnSx}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
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
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm Update</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 13.5 }}>
            Are you sure you want to update <b>{titleName}</b>?
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
                • Confirmed MED: <b>{formData.dailyMedInventory || 0}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Supplier: <b>{selectedSupplier?.supplierName || '—'}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Unit: <b>{requestUnit || '—'}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Images: <b>{totalImagesCount}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.6, color: 'text.secondary' }}>
                • Will delete: <b>{imagesToDelete.length}</b>
              </Typography>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={locked} variant="outlined" sx={outlineBtnSx}>
            No
          </Button>
          <Button onClick={handleConfirmSave} disabled={locked} variant="contained" sx={{ ...gradientBtnSx, px: 2.4 }}>
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
