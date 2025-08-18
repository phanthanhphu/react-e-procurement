import React from 'react';
import { Paper, TextField, Button, Grid, useTheme } from '@mui/material';
import { DatePicker } from 'antd';

const { RangePicker } = DatePicker;

export default function GroupSearchBar({
  nameFilter,
  statusFilter,
  createdByFilter,
  dateRange,
  setNameFilter,
  setStatusFilter,
  setCreatedByFilter,
  setDateRange,
  setPage,
  handleSearch,
  handleReset,
}) {
  const theme = useTheme();

  const fields = [
    { label: 'Request Group Name', value: nameFilter, setter: setNameFilter },
    { label: 'Request Status', value: statusFilter, setter: setStatusFilter },
    { label: 'Created By (User)', value: createdByFilter, setter: setCreatedByFilter },
  ];

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
      <Grid
        container
        spacing={2}
        wrap="nowrap"
        alignItems="center"
      >
        {/* Request Group Name, Request Status, Created By */}
        {fields.map((field, idx) => (
          <Grid item key={idx} sx={{ flex: 1, minWidth: 150 }}>
            <TextField
              fullWidth
              label={field.label}
              variant="outlined"
              size="small"
              value={field.value}
              onChange={(e) => {
                setPage(0);
                field.setter(e.target.value);
              }}
            />
          </Grid>
        ))}

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
            onChange={(dates) => setDateRange(dates || [])}
          />
        </Grid>

        {/* Buttons: Search and Reset */}
        <Grid item sx={{ display: 'flex', gap: 8 }}>
          <Button
            variant="contained"
            onClick={() => { setPage(0); handleSearch(); }}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
            }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={() => { setPage(0); handleReset(); }}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
