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
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

export default function GroupSearchBar({
  nameFilter,
  statusFilter,
  createdByFilter,
  typeFilter,
  currencyFilter,
  setNameFilter,
  setStatusFilter,
  setCreatedByFilter,
  setTypeFilter,
  setCurrencyFilter,
  dateRange,
  setDateRange,
  setPage,
  handleSearch,
  handleReset,
}) {
  const theme = useTheme();

  const inputSx = {
    '& .MuiInputBase-root': {
      height: 32,
      borderRadius: 1.2,
      fontSize: '0.8rem',
      backgroundColor: '#fff',
    },
    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
  };

  const selectSx = {
    height: 32,
    borderRadius: 1.2,
    fontSize: '0.8rem',
    backgroundColor: '#fff',
    '& .MuiSelect-select': { py: 0.7, px: 1.2, fontSize: '0.8rem' },
  };

  const labelSx = { fontSize: '0.8rem' };
  const btnSx = { textTransform: 'none', fontWeight: 400, height: 32, borderRadius: 1.2, minWidth: 110 };

  const onSearchClick = () => {
    setPage(0);
    handleSearch();
  };

  const onResetClick = () => {
    setPage(0);
    handleReset();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        mb: 1,
        borderRadius: 1.5,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        overflowX: 'auto',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>Filters</Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Search and refine groups</Typography>
      </Stack>

      {/* ===== Row 1 ===== */}
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          alignItems: 'center',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(160px, 1fr))',
            md: 'repeat(4, minmax(180px, 1fr))',
          },
          mb: 1,
          minWidth: { xs: 0, md: 760 },
        }}
      >
        <TextField
          fullWidth
          label="Name"
          size="small"
          value={nameFilter || ''}
          onChange={(e) => {
            setPage(0);
            setNameFilter(e.target.value);
          }}
          sx={inputSx}
        />

        <FormControl fullWidth size="small">
          <InputLabel sx={labelSx}>Type</InputLabel>
          <Select
            value={typeFilter || ''}
            label="Type"
            onChange={(e) => {
              setPage(0);
              setTypeFilter(e.target.value);
            }}
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All</MenuItem>
            <MenuItem value="Requisition_weekly" sx={{ fontSize: '0.8rem' }}>Weekly Requisition</MenuItem>
            <MenuItem value="Requisition_monthly" sx={{ fontSize: '0.8rem' }}>Monthly Requisition</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel sx={labelSx}>Status</InputLabel>
          <Select
            value={statusFilter || ''}
            label="Status"
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value);
            }}
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All</MenuItem>
            <MenuItem value="Not Started" sx={{ fontSize: '0.8rem' }}>Not Started</MenuItem>
            <MenuItem value="In Progress" sx={{ fontSize: '0.8rem' }}>In Progress</MenuItem>
            <MenuItem value="Completed" sx={{ fontSize: '0.8rem' }}>Completed</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Created By"
          size="small"
          value={createdByFilter || ''}
          onChange={(e) => {
            setPage(0);
            setCreatedByFilter(e.target.value);
          }}
          sx={inputSx}
        />
      </Box>

      {/* ===== Row 2 ===== */}
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          alignItems: 'center',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(180px, 1fr))',
            md: 'minmax(180px, 240px) minmax(260px, 1fr) auto',
          },
          minWidth: { xs: 0, md: 760 },
        }}
      >
        {/* Currency */}
        <FormControl fullWidth size="small">
          <InputLabel sx={labelSx}>Currency</InputLabel>
          <Select
            value={currencyFilter || ''}
            label="Currency"
            onChange={(e) => {
              setPage(0);
              setCurrencyFilter(e.target.value);
            }}
            sx={selectSx}
          >
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All</MenuItem>
            <MenuItem value="VND" sx={{ fontSize: '0.8rem' }}>VND</MenuItem>
            <MenuItem value="EURO" sx={{ fontSize: '0.8rem' }}>EURO</MenuItem>
            <MenuItem value="USD" sx={{ fontSize: '0.8rem' }}>USD</MenuItem>
          </Select>
        </FormControl>

        {/* Date range */}
        <Box sx={{ minWidth: 260 }}>
          <RangePicker
            style={{
              width: '100%',
              height: 32,
              borderRadius: 10,
              fontSize: '0.8rem',
            }}
            value={dateRange}
            onChange={(dates) => {
              setPage(0);
              setDateRange(dates || []);
            }}
            format="YYYY-MM-DD"
            placeholder={['Start', 'End']}
          />
        </Box>

        {/* Buttons right aligned */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: '100%' }}>
          <Button
            variant="contained"
            onClick={onSearchClick}
            sx={{
              ...btnSx,
              backgroundColor: theme.palette.primary.main,
              boxShadow: 'none',
              '&:hover': { backgroundColor: theme.palette.primary.dark, boxShadow: 'none' },
            }}
          >
            Search
          </Button>

          <Button
            variant="outlined"
            onClick={onResetClick}
            sx={{
              ...btnSx,
              borderColor: '#e5e7eb',
              color: '#111827',
              '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
            }}
          >
            Reset
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
