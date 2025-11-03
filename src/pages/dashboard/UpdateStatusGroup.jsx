// src/pages/group/UpdateStatusGroup.jsx
import React, { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  Box,
  CircularProgress,
  FormControl,
  Typography,
} from '@mui/material';
import { API_BASE_URL } from '../../config';

const STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started', color: '#b0bec5' },
  { value: 'In Progress', label: 'In Progress', color: '#42a5f5' },
  { value: 'Completed',   label: 'Completed',   color: '#66bb6a' },
];

export default function UpdateStatusGroup({
  groupId,
  currentStatus = 'Not Started',
  onSuccess,
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (user.role || '').toUpperCase();
  const userId = user.id || '';

  useEffect(() => setStatus(currentStatus), [currentStatus]);

  // ADMIN & LEADER: ĐƯỢC CHỌN TẤT CẢ
  // USER THƯỜNG: ĐƯỢC CHỌN LẠI 1 TRONG 3 (DÙ ĐANG Ở ĐÂU)
  const allowed = (role === 'ADMIN' || role === 'LEADER')
    ? STATUS_OPTIONS
    : STATUS_OPTIONS;   // ← USER CŨNG THẤY ĐỦ 3!

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === status || !groupId) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ groupId, status: newStatus, userId: userId }),
      });
      if (!res.ok) throw new Error('Lỗi server');
      setStatus(newStatus);
      onSuccess?.();
    } catch (err) {
      alert('Cập nhật thất bại!');
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormControl size="small" sx={{ width: 138 }}>
      <Select
        value={status}
        onChange={handleChange}
        disabled={loading || !groupId}
        sx={{
          '& .MuiSelect-select': {
            p: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            borderRadius: '14px',
            bgcolor: 'transparent',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.2s ease',
            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.18)' },
          },
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        }}
        renderValue={() => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: STATUS_OPTIONS.find(o => o.value === status)?.color,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
            <Typography sx={{ fontSize: '0.64rem', fontWeight: 600, color: '#263238' }}>
              {status}
            </Typography>
          </Box>
        )}
      >
        {loading && <MenuItem disabled><CircularProgress size={14} /></MenuItem>}
        {allowed.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ py: 0.7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: opt.color,
                }}
              />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                {opt.label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}