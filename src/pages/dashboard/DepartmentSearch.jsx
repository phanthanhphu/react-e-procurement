import React from 'react';
import { Paper, Grid, TextField, Button, useTheme } from '@mui/material';

export default function DepartmentSearch({ searchValue, onSearchChange, onSearch, onReset }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        mb: 4,
        background: 'linear-gradient(to right, #f7faff, #ffffff)',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`,
        maxWidth: 480,
        // bỏ margin: 'auto' để căn trái
      }}
    >
      <Grid container spacing={1} alignItems="center" justifyContent="flex-start">
        <Grid item>
          <TextField
            label="Department Name"
            variant="outlined"
            size="small"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ width: 200 }}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={onSearch}
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
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            onClick={onReset}
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
