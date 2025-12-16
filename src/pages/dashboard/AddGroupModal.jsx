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
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { API_BASE_URL } from '../../config';

// React 19 warning
const reactVersion = React.version.split('.')[0];
if (reactVersion >= 19) {
  console.warn(
    'React 19 detected. Ant Design v5.x may have compatibility issues. See https://u.ant.design/v5-for-19 for details.'
  );
}

const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

export default function GroupSummaryRequisitionDialogBase({
  open,
  onCancel,
  onOk,
  currentItem = null,
  mode = 'add', // 'add' | 'edit'
  disabled = false,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const isEditing = mode === 'edit' && !!currentItem?.id;

  const [name, setName] = useState('');
  const [type, setType] = useState('Requisition_weekly');
  const [status, setStatus] = useState('Not Started');
  const [currency, setCurrency] = useState('VND');

  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const username = storedUser.username || '';

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setSnackbarOpen(false);
      setSnackbarMessage('');
      setSnackbarSeverity('success');
      return;
    }

    if (isEditing) {
      setName(currentItem?.name || '');
      setType(currentItem?.type || 'Requisition_weekly');
      setStatus(currentItem?.status || 'Not Started');
      setCurrency((currentItem?.currency || 'VND').toUpperCase());
    } else {
      setName('');
      setType('Requisition_weekly');
      setStatus('Not Started');
      setCurrency('VND');
    }

    setConfirmOpen(false);
    setSnackbarOpen(false);
    setSnackbarMessage('');
    setSnackbarSeverity('success');
  }, [open, isEditing, currentItem]);

  const toast = (msg, severity = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const locked = saving || disabled;

  const toDateArray = (isoDate) => {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ];
  };

  const handleClose = () => {
    if (locked) return;
    onCancel?.();
  };

  const validate = () => {
    if (!name.trim()) return 'Request Group Name is required.';
    if (!type) return 'Type is required.';
    if (!status) return 'Status is required.';
    if (!currency) return 'Currency is required.';
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) return toast(err, 'error');
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        type,
        status,
        currency: (currency || 'VND').toUpperCase(),
        createdBy: username || currentItem?.createdBy || 'Unknown',
        createdDate: isEditing ? currentItem?.createdDate : toDateArray(new Date().toISOString()),
        stockDate: null, // giữ field này để khỏi phá backend nếu có
      };

      const url = isEditing ? `${apiUrl}/${currentItem.id}` : apiUrl;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let responseBody;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = { message: null };
      }

      if (!response.ok) {
        let errorMessage = responseBody?.message || 'An error occurred';
        if (!responseBody?.message) {
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid data provided. Please check your inputs.';
              break;
            case 401:
              errorMessage = 'Unauthorized. Please log in again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = isEditing ? 'Group not found. It may have been deleted.' : 'API endpoint not found.';
              break;
            case 409:
              errorMessage = 'A group with this name and creation date already exists.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = `Failed to ${isEditing ? 'update' : 'add'} group`;
          }
        }
        throw new Error(errorMessage);
      }

      toast(responseBody?.message || (isEditing ? 'Group updated successfully!' : 'Group added successfully!'), 'success');

      // parent refresh + close
      onOk?.();
      onCancel?.();
    } catch (err) {
      console.error(err);
      toast(err?.message || 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ====== Style tokens (copy vibe từ EditDepartmentDialog) ======
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
      '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
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

  const chipLabel = isEditing ? 'Editing' : 'Adding';
  const titleText = isEditing ? 'Edit Request Group' : 'Add Request Group';
  const subtitleText = isEditing ? 'Update details of this group' : 'Create a new requisition group';

  const prettyType = type === 'Requisition_weekly' ? 'Weekly Requisition' : 'Monthly Requisition';

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
                {titleText}
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 13 }}>{subtitleText}</Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label={chipLabel}
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
                Keep naming consistent to reduce duplicates
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
                  label="Request Group Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={locked}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  placeholder="e.g., Weekly Requests – Dec 2025"
                />

                <FormControl size="small" fullWidth sx={fieldSx} disabled={locked}>
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
                    <MenuItem value="Requisition_weekly">Weekly Requisition</MenuItem>
                    <MenuItem value="Requisition_monthly">Monthly Requisition</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={fieldSx} disabled={locked}>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value="Not Started">Not Started</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: 'text.secondary', ml: 0.4 }}>
                    Currency
                  </Typography>

                  <ToggleButtonGroup
                    exclusive
                    value={currency}
                    onChange={(_, v) => v && setCurrency(v)}
                    disabled={locked}
                    sx={{
                      width: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                      background: alpha(theme.palette.common.white, 0.55),
                      '& .MuiToggleButton-root': {
                        flex: 1,
                        border: 0,
                        borderRadius: 0,
                        textTransform: 'uppercase',
                        fontWeight: 900,
                        letterSpacing: 0.6,
                        fontSize: 12,
                        py: 0.9,
                      },
                      '& .Mui-selected': {
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.10),
                      },
                      '& .Mui-selected:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.14),
                      },
                    }}
                  >
                    <ToggleButton value="VND">VND</ToggleButton>
                    <ToggleButton value="EURO">EURO</ToggleButton>
                    <ToggleButton value="USD">USD</ToggleButton>
                  </ToggleButtonGroup>
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
                  <InfoRoundedIcon sx={{ fontSize: 18, mt: '2px', color: alpha(theme.palette.primary.main, 0.8) }} />
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    <b>Tip:</b> Dùng format “Weekly Requests – Dec 2025” để lọc sạch và tránh trùng.
                  </Typography>
                </Stack>
              </Box>

              {/* mini preview */}
              <Box sx={{ mt: 1.6 }}>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                  Preview: <b style={{ color: '#111827' }}>{name.trim() || 'Unknown'}</b> • {prettyType} • {status} •{' '}
                  {(currency || 'VND').toUpperCase()}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={locked} variant="outlined" sx={outlineBtnSx}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={locked} variant="contained" sx={gradientBtnSx}>
            {saving ? <CircularProgress size={20} color="inherit" /> : isEditing ? 'Update' : 'Create'}
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
        <DialogTitle sx={{ fontWeight: 900 }}>
          {isEditing ? 'Confirm Update' : 'Confirm Create'}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 13.5 }}>
            Bạn chắc chắn muốn {isEditing ? 'update' : 'create'} group <b>{name.trim() || 'Unknown'}</b>?
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
                • Type: <b>{prettyType}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Status: <b>{status || '—'}</b>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                • Currency: <b>{(currency || 'VND').toUpperCase()}</b>
              </Typography>
            </Stack>
          </Box>
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
    </>
  );
}
