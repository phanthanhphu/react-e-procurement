import React, { useState } from 'react';
import { Paper, Grid, TextField, Button, useTheme } from '@mui/material';

export default function ProductTypeSearch({
  type1NameValue,
  onType1NameChange,
  onSearch,
  onReset,
}) {
  const theme = useTheme();
  const [type1NameSearch, setType1NameSearch] = useState(type1NameValue || '');

  const handleType1NameChange = (e) => {
    const value = e.target.value;
    setType1NameSearch(value);
    onType1NameChange(value);
    // Trigger search immediately when input changes; if empty, reload all data
    onSearch({ name: value });
  };

  const handleSearch = () => {
    onSearch({ name: type1NameSearch }); // Trigger search with name parameter
  };

  const handleReset = () => {
    setType1NameSearch('');
    onType1NameChange('');
    onReset(); // Reset input and trigger parent reset
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
        width: '100%',
        overflowX: 'auto',
        display: 'flex', // Use flex to center content
        justifyContent: 'center', // Center content horizontally
        alignItems: 'center', // Center content vertically
      }}
    >
      <Grid
        container
        spacing={1}
        alignItems="center"
        justifyContent="center" // Center items horizontally
        wrap="nowrap"
        sx={{
          width: '100%',
          maxWidth: 500, // Limit Grid width for better centering
          boxSizing: 'border-box',
          minHeight: '60px',
        }}
      >
        <Grid item xs={12} sm={6} sx={{ minWidth: { xs: '100%', sm: 300 } }}>
          <TextField
            label="Product Type 1 Name"
            variant="outlined"
            size="small"
            value={type1NameSearch}
            onChange={handleType1NameChange}
            sx={{
              width: '100%',
              '& .MuiInputBase-input': { fontSize: '0.9rem' },
              '& .MuiInputLabel-root': { fontSize: '0.9rem' },
            }}
            placeholder="Search Parent Type"
          />
        </Grid>
        <Grid item xs={6} sm={3} sx={{ minWidth: 100 }}>
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
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            Search
          </Button>
        </Grid>
        <Grid item xs={6} sm={3} sx={{ minWidth: 100 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 1.5,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}