// src/pages/group/EditGroupModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Box,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

import { API_BASE_URL } from '../../config';

/* =========================
   Axios client (same behavior)
   ========================= */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: '*/*', 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const normalizeTypeLabel = (t) =>
  t === 'Requisition_monthly' ? 'Monthly' : t === 'Requisition_weekly' ? 'Weekly' : 'Unknown';

const normalizeCurrency = (c) => (c ? String(c).toUpperCase() : 'VND');

const toDateArray = (isoDate) => {
  if (!isoDate || !dayjs(isoDate).isValid()) return null;
  const d = new Date(isoDate);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
};

const parseAnyDateToDayjs = (dateInput) => {
  if (!dateInput) return null;
  if (Array.isArray(dateInput)) {
    const [y, m, d, h = 0, i = 0, s = 0] = dateInput;
    return dayjs(new Date(y, m - 1, d, h, i, s));
  }
  const d = dayjs(dateInput);
  return d.isValid() ? d : null;
};

export default function EditGroupModal({ open, onCancel, onOk, currentItem }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [name, setName] = useState('');
  const [type, setType] = useState('Requisition_weekly');
  const [currency, setCurrency] = useState('VND');
  const [stockDate, setStockDate] = useState(null); // optional
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const username = storedUser?.username || '';

  const disabledLock = Boolean(currentItem?.used);
  const locked = saving;

  useEffect(() => {
    if (open && currentItem) {
      setName(currentItem.name || '');
      setType(currentItem.type || 'Requisition_weekly');
      setCurrency(normalizeCurrency(currentItem.currency || 'VND'));
      setStockDate(parseAnyDateToDayjs(currentItem.stockDate));
    } else {
      setName('');
      setType('Requisition_weekly');
      setCurrency('VND');
      setStockDate(null);
    }
    setConfirmOpen(false);
    setNotification((p) => ({ ...p, open: false }));
  }, [open, currentItem]);

  const toast = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleClose = () => {
    if (locked) return;
    onCancel?.();
  };

  const validate = () => {
    if (!name.trim()) {
      toast('Group Name is required.', 'error');
      return false;
    }
    if (!type) {
      toast('Type is required.', 'error');
      return false;
    }
    if (!currency) {
      toast('Currency is required.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setSaving(true);

    try {
      if (!currentItem?.id) throw new Error('Group ID missing');

      const payload = {
        id: currentItem.id,
        name: name.trim(),
        type,
        currency: normalizeCurrency(currency),
        createdBy: username || currentItem.createdBy || 'Unknown',
        createdDate: currentItem.createdDate,
        stockDate: stockDate ? toDateArray(stockDate.toISOString()) : null,
        status: currentItem.status || 'Not Started', // giữ đúng như bản cũ
      };

      const { data } = await apiClient.put(`${apiUrl}/${currentItem.id}`, payload);

      toast(data?.message || 'Group updated successfully!', 'success');

      onOk?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update group.';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     UI tokens (copy vibe)
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

  const headerSx = useMemo(
    () => ({
      position: 'relative',
      py: 2,
      px: 2.5,
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
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.common.white, 0.65),
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
      py: 1.1,
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

  const outlineBtnSx = {
    borderRadius: 999,
    px: 2.2,
    py: 1.1,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  };

  const segSx = useMemo(
    () => ({
      borderRadius: 3,
      p: 0.4,
      border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
      bgcolor: alpha(theme.palette.common.white, 0.55),
      backdropFilter: 'blur(10px)',
      '& .MuiToggleButton-root': {
        border: 'none',
        borderRadius: 999,
        textTransform: 'uppercase',
        fontWeight: 800,
        letterSpacing: 0.5,
        px: 1.4,
        py: 0.8,
        fontSize: 12,
        color: alpha(theme.palette.text.primary, 0.8),
      },
      '& .MuiToggleButton-root.Mui-selected': {
        color: theme.palette.common.white,
        backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        boxShadow: `0 10px 22px ${alpha(theme.palette.primary.main, 0.22)}`,
      },
      '& .MuiToggleButton-root.Mui-selected:hover': {
        backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
      },
    }),
    [theme]
  );

  const titleName = name?.trim() || currentItem?.name || 'Unnamed';

  return (
    <>
      {/* Main dialog */}
      <Dialog
        open={open}
        onClose={locked ? undefined : handleClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: paperSx }}
      >
        <DialogTitle sx={headerSx}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  fontSize: { xs: 18, sm: 20 },
                }}
              >
                Edit Request Group
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 13 }}>
                Update name, type and currency
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label="Editing"
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

        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <Box sx={{ ...subtleCardSx, p: 2 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Details</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                Keep naming consistent so searching/filtering stays clean
              </Typography>

              <Divider sx={{ my: 1.6 }} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.8,
                }}
              >
                <TextField
                  label="Group Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={locked}
                  size="small"
                  fullWidth
                  sx={{ ...fieldSx, gridColumn: { xs: '1 / span 1', sm: '1 / span 2' } }}
                  placeholder="e.g., November Requests"
                />

                <FormControl size="small" fullWidth sx={fieldSx}>
                  <InputLabel id="type-label">Type</InputLabel>
                  <Select
                    labelId="type-label"
                    label="Type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={locked || disabledLock}
                  >
                    <MenuItem value="Requisition_weekly">Weekly</MenuItem>
                    <MenuItem value="Requisition_monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.6, mb: 0.7 }}>
                    Currency
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    value={currency}
                    onChange={(_, v) => v && setCurrency(v)}
                    disabled={locked || disabledLock}
                    sx={segSx}
                    fullWidth
                  >
                    <ToggleButton value="VND">VND</ToggleButton>
                    <ToggleButton value="EURO">EURO</ToggleButton>
                    <ToggleButton value="USD">USD</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Optional: Stock date (nếu backend dùng thì mở ra)
                <TextField
                  label="Stock Date"
                  type="date"
                  value={stockDate ? stockDate.format('YYYY-MM-DD') : ''}
                  onChange={(e) => setStockDate(e.target.value ? dayjs(e.target.value) : null)}
                  disabled={locked}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
                */}
              </Box>

              {disabledLock ? (
                <Box
                  sx={{
                    mt: 1.8,
                    p: 1.4,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.warning.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.18)}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <InfoRoundedIcon
                      sx={{ fontSize: 18, mt: '2px', color: alpha(theme.palette.warning.main, 0.9) }}
                    />
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      <b>Locked:</b> This group is already used, so <b>Type/Currency</b> cannot be changed.
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 1.8,
                    p: 1.4,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <InfoRoundedIcon
                      sx={{ fontSize: 18, mt: '2px', color: alpha(theme.palette.primary.main, 0.8) }}
                    />
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      <b>Tip:</b> Use short, consistent names (e.g., “Dec Weekly”, “Q1 Monthly”) to keep reporting tidy.
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={locked} variant="outlined" sx={outlineBtnSx}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={locked} variant="contained" sx={gradientBtnSx}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog (same vibe) */}
      <Dialog
        open={confirmOpen}
        onClose={locked ? undefined : () => setConfirmOpen(false)}
        maxWidth="xs"
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
            Save changes for <b>{titleName}</b>?
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
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Type: <b>{normalizeTypeLabel(type)}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Currency: <b>{normalizeCurrency(currency)}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Status: <b>{currentItem?.status || 'Not Started'}</b>
              </Typography>
            </Stack>
          </Box>

          {disabledLock ? (
            <Typography sx={{ mt: 1.2, fontSize: 12.5, color: 'text.secondary' }}>
              Note: Type/Currency are locked (group already used).
            </Typography>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={locked} variant="outlined" sx={outlineBtnSx}>
            No
          </Button>
          <Button onClick={handleConfirm} disabled={locked} variant="contained" sx={{ ...gradientBtnSx, px: 2.4 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4500}
        onClose={() => setNotification((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification((p) => ({ ...p, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
