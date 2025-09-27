import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';

export default function ImportExcelButton({ onImport, groupId, disabled }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setFile(null); // Reset file when dialog opens
      setError(null); // Reset error when dialog opens
    }
  }, [open]);

  const handleOpen = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    if (disabled) return; // Prevent file selection if disabled
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          console.log('Parsed Excel data:', jsonData);
        } catch (err) {
          setError('Failed to read Excel file. Please ensure it is valid.');
        }
      };
      reader.onerror = () => setError('Error reading file. Please try again.');
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (disabled) return; // Prevent submission if disabled
    if (!file) {
      setError('Please select an Excel file');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const url = `${API_BASE_URL}/api/summary-requisitions/upload-requisition?groupId=${groupId}`;

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOpen(false);
      setFile(null);
      if (onImport) onImport(response.data);
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 400) {
        const remark = error.response.data[0]?.remark || 'Upload failed due to duplicate entry.';
        setError(remark);
      } else {
        setError('Upload failed. Please try again.');
      }
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleOpen}
        disabled={disabled} // Disable the button
        startIcon={<img src={ExcelIcon} alt="Excel Icon" style={{ width: 20, height: 20 }} />}
        sx={{
          textTransform: 'none',
          borderRadius: 1,
          px: 2,
          py: 0.6,
          fontWeight: 600,
          fontSize: '0.75rem',
          backgroundColor: disabled ? 'grey.300' : '#36c080',
          backgroundImage: disabled
            ? 'none'
            : 'linear-gradient(90deg, #36c080 0%, #25a363 100%)',
          color: disabled ? 'grey.700' : '#fff',
          '&:hover': {
            backgroundColor: disabled ? 'grey.300' : '#2fa16a',
            backgroundImage: disabled
              ? 'none'
              : 'linear-gradient(90deg, #2fa16a 0%, #1f7f4f 100%)',
          },
        }}
      >
        Import Excel
      </Button>

      <Dialog open={open && !disabled} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            backgroundColor: 'rgba(70, 128, 255, 0.9)',
            color: '#fff',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          Import Excel File
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Choose Excel File (.xlsx, .xls)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
            {file && (
              <Typography variant="body2">
                Selected file: {file.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading || disabled}>
            Cancel
          </Button>
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