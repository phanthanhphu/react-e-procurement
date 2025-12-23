import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Stack,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Alert,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';

export default function ImportExcelButtonMonthlySupplement({ onImport, groupId, disabled }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locked = loading || !!disabled;

  // Reset dialog state when opened
  useEffect(() => {
    if (open) {
      setFile(null);
      setError(null);
    }
  }, [open]);

  const handleOpen = () => {
    if (!disabled) setOpen(true);
  };

  const handleClose = () => {
    if (locked) return;
    setOpen(false);
    setFile(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    if (disabled) return;
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (disabled || !file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // ✅ MATCH CURL:
      // POST /requisition-monthly/upload-requisition?groupId=...
      const url = `${API_BASE_URL}/requisition-monthly/upload-requisition?groupId=${encodeURIComponent(
        groupId || ''
      )}`;

      const response = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      handleClose();
      if (onImport) onImport(response.data);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const remark =
          err.response.data?.[0]?.remark ||
          err.response.data?.message ||
          'Upload failed due to invalid/duplicate rows.';
        setError(remark);
      } else {
        setError('Upload failed. Please try again.');
      }
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ====== Style tokens (match the existing UI/UX) - DO NOT change button styles ======
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

  return (
    <>
      {/* ====== BUTTON: KEEP STYLE 100% ====== */}
      <Button
        variant="contained"
        onClick={handleOpen}
        disabled={disabled}
        startIcon={<img src={ExcelIcon} alt="Excel Icon" style={{ width: 20, height: 20 }} />}
        sx={{
          textTransform: 'none',
          borderRadius: 1,
          px: 2,
          py: 0.6,
          fontWeight: 600,
          fontSize: '0.75rem',
          backgroundColor: disabled ? 'grey.300' : '#36c080',
          backgroundImage: disabled ? 'none' : 'linear-gradient(90deg, #36c080 0%, #25a363 100%)',
          color: disabled ? 'grey.700' : '#fff',
          '&:hover': {
            backgroundColor: disabled ? 'grey.300' : '#2fa16a',
            backgroundImage: disabled ? 'none' : 'linear-gradient(90deg, #2fa16a 0%, #1f7f4f 100%)',
          },
        }}
      >
        Import Supplementary
      </Button>

      <Dialog
        open={open && !disabled}
        onClose={locked ? undefined : handleClose}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: paperSx }}
      >
        {/* Header (glass + gradient) */}
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
                Import Excel File
              </Typography>
              <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: 13 }}>
                Upload monthly requisition data (.xlsx / .xls)
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label="Monthly Upload"
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
          <Box sx={{ ...subtleCardSx, p: 2 }}>
            <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>File Selection</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
              Choose an Excel file to upload monthly requisition data.
            </Typography>

            <Divider sx={{ my: 1.6 }} />

            {error ? (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                {error}
              </Alert>
            ) : null}

            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Choose Excel File (.xlsx, .xls)
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2, flexWrap: 'wrap' }}>
              {/* ====== BUTTON: KEEP STYLE 100% ====== */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mr: 2 }}
                disabled={loading || disabled}
              >
                Upload File
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  hidden
                  disabled={loading || disabled}
                />
              </Button>

              {file ? (
                <Chip
                  size="small"
                  label={`Selected: ${file.name}`}
                  sx={{
                    fontWeight: 800,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    borderRadius: 999,
                  }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No file selected
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 1.4,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <InfoRoundedIcon sx={{ fontSize: 18, mt: '2px', color: alpha(theme.palette.primary.main, 0.8) }} />
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                  <b>Tip:</b> Ensure your file matches the template rules to avoid duplicates or invalid rows.
                </Typography>
              </Stack>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 2, gap: 1 }}>
          {/* ====== BUTTON: KEEP STYLE 100% ====== */}
          <Button onClick={handleClose} disabled={loading || disabled}>
            Cancel
          </Button>

          {/* ====== BUTTON: KEEP STYLE 100% ====== */}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !file || disabled}
            sx={{
              backgroundColor: disabled ? 'grey.300' : 'rgba(70, 128, 255, 0.9)',
              color: disabled ? 'grey.700' : '#fff',
              '&:hover': {
                backgroundColor: disabled ? 'grey.300' : 'rgba(70, 128, 255, 1)',
              },
            }}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
