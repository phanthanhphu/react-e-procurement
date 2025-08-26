import React from 'react';
import { Paper, Grid, TextField, Button, useTheme, Box } from '@mui/material';

export default function RequisitionSearch({ searchValues, onSearchChange, onSearch, onReset }) {
  const theme = useTheme();

  const handleInputChange = (field) => (e) => {
    onSearchChange({ ...searchValues, [field]: e.target.value });
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
        width: '100%',
        maxWidth: '1200px',
        boxSizing: 'border-box',
      }}
    >
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* First Row: 4 Input Fields + Search Button */}
        <Grid item md={3}>
          <TextField
            label="Product Type 1 Name"
            variant="outlined"
            size="small"
            value={searchValues.productType1Name || ''}
            onChange={handleInputChange('productType1Name')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item md={3}>
          <TextField
            label="Product Type 2 Name"
            variant="outlined"
            size="small"
            value={searchValues.productType2Name || ''}
            onChange={handleInputChange('productType2Name')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item md={3}>
          <TextField
            label="English Name"
            variant="outlined"
            size="small"
            value={searchValues.englishName || ''}
            onChange={handleInputChange('englishName')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item md={3}>
          <TextField
            label="Vietnamese Name"
            variant="outlined"
            size="small"
            value={searchValues.vietnameseName || ''}
            onChange={handleInputChange('vietnameseName')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item sx={{ display: 'flex', justifyContent: 'flex-end', flexGrow: 1 }}>
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push button to the right */}
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
              height: '40px',
              minWidth: '100px',
              mr: 1.5, // 12px margin-right to match Paper's padding
            }}
          >
            Search
          </Button>
        </Grid>

        {/* Second Row: 4 Input Fields + Reset Button */}
        <Grid item md={3}>
          <TextField
            label="Old SAP Code"
            variant="outlined"
            size="small"
            value={searchValues.oldSapCode || ''}
            onChange={handleInputChange('oldSapCode')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item md={3}>
          <TextField
            label="New SAP Code"
            variant="outlined"
            size="small"
            value={searchValues.newSapCode || ''}
            onChange={handleInputChange('newSapCode')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item md={3}>
          <TextField
            label="Unit"
            variant="outlined"
            size="small"
            value={searchValues.unit || ''}
            onChange={handleInputChange('unit')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item md={3}>
          <TextField
            label="Department Name"
            variant="outlined"
            size="small"
            value={searchValues.departmentName || ''}
            onChange={handleInputChange('departmentName')}
            fullWidth
            sx={{ '& .MuiInputBase-root': { height: '40px', borderRadius: '8px' } }}
          />
        </Grid>
        <Grid item sx={{ display: 'flex', justifyContent: 'flex-end', flexGrow: 1 }}>
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push button to the right */}
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
              height: '40px',
              minWidth: '100px',
              mr: 1.5, // 12px margin-right to match Paper's padding
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}