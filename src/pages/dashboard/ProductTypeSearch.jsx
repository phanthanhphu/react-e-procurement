import React, { useState } from 'react';
import { Paper, Grid, TextField, Button, useTheme } from '@mui/material';

export default function ProductTypeSearch({
  type1NameValue,
  type2NameValue,
  onType1NameChange,
  onType2NameChange,
  onSearch,
  onReset,
}) {
  const theme = useTheme();
  const [type1NameSearch, setType1NameSearch] = useState(type1NameValue || '');
  const [type2NameSearch, setType2NameSearch] = useState(type2NameValue || '');

  const handleType1NameChange = (e) => {
    const value = e.target.value;
    setType1NameSearch(value);
    onType1NameChange(value); // Updates Parent Type name (maps to API's 'type1Name' parameter)
    
    // If both inputs are empty after change, trigger search to reload all data
    if (value === '' && type2NameSearch === '') {
      onSearch({ type1Name: '', type2Name: '' });
    }
  };

  const handleType2NameChange = (e) => {
    const value = e.target.value;
    setType2NameSearch(value);
    onType2NameChange(value); // Updates Sub-Type name (maps to API's 'type2Name' parameter)
    
    // If both inputs are empty after change, trigger search to reload all data
    if (value === '' && type1NameSearch === '') {
      onSearch({ type1Name: '', type2Name: '' });
    }
  };

  const handleSearch = () => {
    onSearch({ type1Name: type1NameSearch, type2Name: type2NameSearch }); // Triggers search with type1Name and type2Name
  };

  const handleReset = () => {
    setType1NameSearch('');
    setType2NameSearch('');
    onType1NameChange('');
    onType2NameChange('');
    onReset(); // Resets search inputs and triggers parent reset
  };

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
        maxWidth: 800,
        overflowX: 'auto',
      }}
    >
      <Grid
        container
        spacing={1.5}
        alignItems="center"
        justifyContent="flex-start"
        wrap="nowrap"
      >
        <Grid item>
          <TextField
            label="Parent Type Name"
            variant="outlined"
            size="small"
            value={type1NameSearch}
            onChange={handleType1NameChange}
            sx={{ width: 200 }}
            placeholder="Search Parent Type"
          />
        </Grid>
        <Grid item>
          <TextField
            label="Sub-Type Name (Code)"
            variant="outlined"
            size="small"
            value={type2NameSearch}
            onChange={handleType2NameChange}
            sx={{ width: 200 }}
            placeholder="Search Sub-Type"
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
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
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
              px: 3,
              borderRadius: '8px',
              fontSize: '0.875rem',
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