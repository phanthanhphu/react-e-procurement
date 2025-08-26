import React from 'react';
import {
  Paper,
  TextField,
  Button,
  Grid,
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
      }}
    >
      <Grid container spacing={2} wrap="nowrap" alignItems="center">

        {/* Request Group Name */}
        <Grid item sx={{ flex: 1, minWidth: 150 }}>
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
        </Grid>

        {/* Request Status - Select */}
        <Grid item sx={{ flex: 1, minWidth: 150 }}>
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
        </Grid>

        {/* Created By */}
        <Grid item sx={{ flex: 1, minWidth: 150 }}>
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
        </Grid>

        {/* Type - Select */}
        <Grid item sx={{ flex: 1, minWidth: 180 }}>
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
        </Grid>

        {/* Date Range Picker */}
        <Grid item sx={{ flex: 1, minWidth: 250 }}>
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
        </Grid>

        {/* Buttons */}
        <Grid item sx={{ display: 'flex', gap: 8 }}>
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
            }}
          >
            Search
          </Button>
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
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
