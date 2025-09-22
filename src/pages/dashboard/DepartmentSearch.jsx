import React, { useState } from 'react';
import { Paper, Grid, TextField, Button, useTheme } from '@mui/material';

export default function DepartmentSearch({ searchValue, departmentNameValue, onSearchChange, onDepartmentNameChange, onSearch, onReset }) {
  const theme = useTheme();
  const [departmentNameSearch, setDepartmentNameSearch] = useState(departmentNameValue || '');

  const handleDepartmentNameChange = (e) => {
    const value = e.target.value;
    setDepartmentNameSearch(value);
    onDepartmentNameChange(value); // Pass departmentName changes to parent
  };

  const handleSearch = () => {
    onSearch({ departmentName: departmentNameSearch, division: searchValue });
  };

  const handleReset = () => {
    setDepartmentNameSearch('');
    onSearchChange('');
    onDepartmentNameChange('');
    onReset();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1,
        mb: 1.5,
        background: 'linear-gradient(to right, #f7faff, #ffffff)',
        borderRadius: 2,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`,
        maxWidth: 600,
        overflowX: 'auto',
      }}
    >
      <Grid
        container
        spacing={1}
        alignItems="center"
        justifyContent="flex-start"
        wrap="nowrap"
        sx={{ minHeight: '60px' }} // Giữ minHeight để tăng không gian hiển thị
      >
        <Grid item>
          <TextField
            label="Department Name"
            variant="outlined"
            size="small"
            value={departmentNameSearch}
            onChange={handleDepartmentNameChange}
            sx={{ width: 150, '& .MuiInputBase-root': { fontSize: '0.55rem' }, '& .MuiInputLabel-root': { fontSize: '0.55rem' } }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Division"
            variant="outlined"
            size="small"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ width: 150, '& .MuiInputBase-root': { fontSize: '0.55rem' }, '& .MuiInputLabel-root': { fontSize: '0.55rem' } }}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 1.5,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.55rem',
              whiteSpace: 'nowrap',
            }}
          >
            Search
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 1.5,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.55rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
              whiteSpace: 'nowrap',
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}