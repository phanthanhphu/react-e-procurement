import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl, Typography } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';

export default function ImportExcelButton({ onImport, groupId }) {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/api/departments/filter?page=0&size=10`)
        .then((res) => {
          const deptData = res.data.content || [];
          setDepartments(deptData);
          if (deptData.length > 0) setSelectedDept(deptData[0].id);
        })
        .catch(() => {
          setDepartments([]);
          setSelectedDept('');
          setError('Failed to load departments. Please try again.');
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setSelectedDept(departments.length > 0 ? departments[0].id : '');
    setError(null);
  };

  const handleFileChange = (e) => {
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

  const handleDeptChange = (e) => {
    setSelectedDept(e.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedDept) {
      setError('Please select a department');
      return;
    }
    if (!file) {
      setError('Please select an Excel file');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const url = `${API_BASE_URL}/api/summary-requisitions/upload-requisition?idPhongBan=${selectedDept}&groupId=${groupId}`;

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
        startIcon={<img src={ExcelIcon} alt="Excel Icon" style={{ width: 20, height: 20 }} />}
        sx={{
          textTransform: 'none',
          borderRadius: 1,
          px: 2,
          py: 0.6,
          fontWeight: 600,
          fontSize: '0.75rem',
          backgroundColor: '#36c080',
          backgroundImage: 'linear-gradient(90deg, #36c080 0%, #25a363 100%)',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#2fa16a',
            backgroundImage: 'linear-gradient(90deg, #2fa16a 0%, #1f7f4f 100%)',
          },
        }}
      >
        Import Excel
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
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
          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel id="dept-select-label">Select Department</InputLabel>
            <Select
              labelId="dept-select-label"
              value={selectedDept}
              label="Select Department"
              onChange={handleDeptChange}
            >
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.departmentName} ({dept.division})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No departments available</MenuItem>
              )}
            </Select>
          </FormControl>

          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Choose Excel File (.xlsx, .xls)
          </Typography>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            style={{ marginTop: 8 }}
            disabled={loading}
          />
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {file.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !file || !selectedDept}
            sx={{
              backgroundColor: 'rgba(70, 128, 255, 0.9)',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(70, 128, 255, 1)',
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