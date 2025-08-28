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
        p: 3,
        mb: 3,
        background: 'linear-gradient(to right, #f7faff, #ffffff)',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
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
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '14.29%', minWidth: 120, flexShrink: 1 }}>
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
            InputProps={{ sx: { borderRadius: '8px' } }}
          />
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 120, flexShrink: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter || ''}
              label="Status"
              onChange={(e) => {
                setPage(0);
                setStatusFilter(e.target.value);
              }}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Not Started">Not Started</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 120, flexShrink: 1 }}>
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
            InputProps={{ sx: { borderRadius: '8px' } }}
          />
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 150, flexShrink: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter || ''}
              label="Type"
              onChange={(e) => {
                setPage(0);
                setTypeFilter(e.target.value);
              }}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Requisition_urgent">Requisition Urgent</MenuItem>
              <MenuItem value="Requisition_monthly">Requisition Monthly</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 200, flexShrink: 1 }}>
          <RangePicker
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              fontSize: '0.875rem',
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
        <Box sx={{ width: '14.29%', minWidth: 100, flexShrink: 1 }}>
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
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
              height: '40px',
              width: '100%',
            }}
          >
            Search
          </Button>
        </Box>
        <Box sx={{ width: '14.29%', minWidth: 100, flexShrink: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setPage(0);
              handleReset();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
              height: '40px',
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