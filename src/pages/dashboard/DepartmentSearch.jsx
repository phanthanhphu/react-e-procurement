import React, { useState } from 'react';
import { Paper, TextField, Button, Box, useTheme } from '@mui/material';

export default function DepartmentSearch({ onSearch, onReset }) {
  const [searchName, setSearchName] = useState('');
  const theme = useTheme();

  const handleSearchClick = () => {
    onSearch?.(searchName.trim());
  };

  const handleReset = () => {
    setSearchName('');
    onReset?.();
  };

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
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Input chiếm toàn bộ không gian còn lại */}
      <TextField
        label="Department Name"
        variant="outlined"
        size="medium"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        sx={{ flexGrow: 1 }}
      />

      {/* Container chứa 2 nút */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          onClick={handleSearchClick}
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
          onClick={handleReset}
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
      </Box>
    </Paper>
  );
}
