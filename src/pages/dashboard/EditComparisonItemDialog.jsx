// src/components/EditComparisonItemDialog.jsx
import React, { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const EditComparisonItemDialog = ({ open, onClose, item: initialItem, onSaved }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    statusBestPrice: '',
    remarkComparison: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const toast = (msg, severity = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const locked = saving; // có thể mở rộng thêm nếu parent truyền disabled

  // ====== fetch latest data when open ======
  useEffect(() => {
    const fetchLatestData = async () => {
      if (!initialItem?.id || !open) return;

      setLoading(true);
      try {
        const { data: latestItem } = await axios.get(
          `${API_BASE_URL}/requisition-monthly/${initialItem.id}/status`
        );

        setFormData({
          statusBestPrice:
            latestItem.statusBestPrice === 'Yes'
              ? 'Yes'
              : latestItem.statusBestPrice === 'No'
              ? 'No'
              : '',
          remarkComparison: latestItem.remarkComparison || '',
        });
      } catch (err) {
        console.error('Failed to fetch latest item data:', err);
        // fallback to initial item
        setFormData({
          statusBestPrice:
            initialItem.statusBestPrice === 'Yes'
              ? 'Yes'
              : initialItem.statusBestPrice === 'No'
              ? 'No'
              : '',
          remarkComparison: initialItem.remarkComparison || '',
        });
        toast('Could not fetch latest data. Using cached item.', 'warning');
      } finally {
        setLoading(false);
        setConfirmOpen(false);
        setSnackbarOpen(false);
      }
    };

    fetchLatestData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItem?.id, open]);

  const handleClose = () => {
    if (locked) return;
    setConfirmOpen(false);
    onClose?.();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.statusBestPrice) return toast('Please select Best Price status (Yes/No).', 'error');
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setSaving(true);

    try {
      await axios.patch(`${API_BASE_URL}/requisition-monthly/${initialItem.id}/best-price`, {
        statusBestPrice: formData.statusBestPrice,
        remarkComparison: formData.remarkComparison.trim() || null,
      });

      toast('Updated successfully!', 'success');
      onSaved?.();
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update.';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ====== Style tokens (copy vibe from EditDepartmentDialog) ======
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

  if (!initialItem) return null;

  const titleName = initialItem?.itemName || initialItem?.name || `Item #${initialItem?.id || '—'}`;
  const statusLabel =
    formData.statusBestPrice === 'Yes'
      ? 'Yes - Best price'
      : formData.statusBestPrice === 'No'
      ? 'No - Not best'
      : 'Not selected';

  return (
    <>
      <Dialog
        open={open}
        onClose={locked ? undefined : handleClose}
        fullScreen={fullScreen}
        maxWidth="sm"
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
                  fontSize: { xs: 18, sm: 20 },
                }}
              >
                Edit Best Price
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 13 }}>
                Update best price status & remark
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Box sx={{ ...subtleCardSx, p: 2 }}>
                <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>Details</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
                  Item: <b>{titleName}</b>
                </Typography>

                <Divider sx={{ my: 1.6 }} />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr' },
                    gap: 1.8,
                  }}
                >
                  {/* Best Price Status */}
                  <Box>
                    <InputLabel sx={{ mb: 0.8, fontWeight: 800, letterSpacing: 0.3 }}>
                      Best Price Status
                    </InputLabel>

                    <FormControl size="small" fullWidth sx={fieldSx}>
                      <Select
                        name="statusBestPrice"
                        value={formData.statusBestPrice}
                        onChange={handleChange}
                        displayEmpty
                        disabled={locked}
                      >
                        <MenuItem value="" disabled>
                          <em>Select status</em>
                        </MenuItem>
                        <MenuItem value="Yes">Yes - This is the best price</MenuItem>
                        <MenuItem value="No">No - Not the best price</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Remark */}
                  <Box>
                    <InputLabel sx={{ mb: 0.8, fontWeight: 800, letterSpacing: 0.3 }}>
                      Remark Comparison
                    </InputLabel>

                    <TextField
                      name="remarkComparison"
                      value={formData.remarkComparison}
                      onChange={handleChange}
                      multiline
                      minRows={5}
                      placeholder="Enter reason or note..."
                      fullWidth
                      size="small"
                      disabled={locked}
                      sx={fieldSx}
                    />
                  </Box>
                </Box>

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
                      <b>Tip:</b> If you choose <b>No</b>, leave a short reason so the team can audit later.
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={locked || loading} variant="outlined" sx={outlineBtnSx}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={locked || loading || !formData.statusBestPrice}
            variant="contained"
            sx={gradientBtnSx}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Dialog>

      {/* Confirm dialog (same vibe) */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
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
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Best Price: <b>{statusLabel}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Remark:{' '}
                <b>{formData.remarkComparison?.trim() ? formData.remarkComparison.trim() : '—'}</b>
              </Typography>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={locked} variant="outlined" sx={outlineBtnSx}>
            No
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={locked}
            variant="contained"
            sx={{ ...gradientBtnSx, px: 2.4 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditComparisonItemDialog;
