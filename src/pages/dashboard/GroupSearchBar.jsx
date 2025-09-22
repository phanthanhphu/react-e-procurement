import React from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  useTheme
} from '@mui/material';
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

export default function GroupSearchBar({
  nameFilter,
  statusFilter,
  createdByFilter,
  typeFilter,
  dateRange,
  setNameFilter,
  setStatusFilter,
  setCreatedByFilter,
  setTypeFilter,
  setDateRange,
  setPage,
  handleSearch,
  handleReset,
}) {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        mb: 1.5,
        background: 'linear-gradient(to right, #f7faff, #ffffff)',
        borderRadius: 2,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        border: `1px solid ${theme.palette.divider}`,
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      {/* Row 1: 4 inputs + Search/Reset buttons */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          alignItems: 'center',
          minHeight: '60px', // Tăng chiều cao của toàn bộ thẻ body chứa input
        }}
      >
        <Box sx={{ width: '14.29%', minWidth: 100, flexShrink: 1 }}>
          <TextField
            fullWidth
            label="Request Group Name"
            variant="outlined"
            size="small"
            value={nameFilter || ''}
            onChange={(e) => {
              setPage(0);
              setNameFilter(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 100, flexShrink: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.55rem', top: '-6px' }}>Status</InputLabel>
            <Select
              value={statusFilter || ''}
              label="Status"
              onChange={(e) => {
                setPage(0);
                setStatusFilter(e.target.value);
              }}
              sx={{
                height: '30px',
                borderRadius: '6px',
                fontSize: '0.55rem',
                '& .MuiSelect-select': { padding: '8px' },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.55rem' }}>All</MenuItem>
              <MenuItem value="Not Started" sx={{ fontSize: '0.55rem' }}>Not Started</MenuItem>
              <MenuItem value="In Progress" sx={{ fontSize: '0.55rem' }}>In Progress</MenuItem>
              <MenuItem value="Completed" sx={{ fontSize: '0.55rem' }}>Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 100, flexShrink: 1 }}>
          <TextField
            fullWidth
            label="Created By (User)"
            variant="outlined"
            size="small"
            value={createdByFilter || ''}
            onChange={(e) => {
              setPage(0);
              setCreatedByFilter(e.target.value);
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
            }}
          />
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 100, flexShrink: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.55rem', top: '-6px' }}>Type</InputLabel>
            <Select
              value={typeFilter || ''}
              label="Type"
              onChange={(e) => {
                setPage(0);
                setTypeFilter(e.target.value);
              }}
              sx={{
                height: '30px',
                borderRadius: '6px',
                fontSize: '0.55rem',
                '& .MuiSelect-select': { padding: '8px' },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.55rem' }}>All</MenuItem>
              <MenuItem value="Requisition_urgent" sx={{ fontSize: '0.55rem' }}>Requisition Urgent</MenuItem>
              <MenuItem value="Requisition_monthly" sx={{ fontSize: '0.55rem' }}>Requisition Monthly</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 150, flexShrink: 1 }}>
          <RangePicker
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: '6px',
              fontSize: '0.55rem',
              height: '30px',
            }}
            value={dateRange}
            onChange={(dates) => {
              setPage(0);
              setDateRange(dates || []);
            }}
            format="YYYY-MM-DD"
            placeholder={['Start Date', 'End Date']}
          />
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 80, flexShrink: 1 }}>
          <Button
            variant="contained"
            onClick={() => {
              setPage(0);
              handleSearch();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 1.5,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.65rem',
              height: '30px',
              width: '100%',
            }}
          >
            Search
          </Button>
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 80, flexShrink: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setPage(0);
              handleReset();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 1.5,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
              height: '30px',
              width: '100%',
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}