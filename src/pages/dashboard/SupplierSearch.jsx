import React from 'react';
import {
  Paper,
  TextField,
  Button,
  Stack,
  Grid,
  useTheme,
} from '@mui/material';

export default function SupplierSearch({
  searchSupplierCode,
  setSearchSupplierCode,
  searchSupplierName,
  setSearchSupplierName,
  searchSapCode,
  setSearchSapCode,
  searchProductFullName,
  setSearchProductFullName,
  searchProductShortName,
  setSearchProductShortName,
  setPage,
  onSearch,
  onReset,
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
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Supplier Code"
            variant="outlined"
            size="small"
            value={searchSupplierCode}
            onChange={(e) => {
              setPage(0);
              setSearchSupplierCode(e.target.value);
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Supplier Name"
            variant="outlined"
            size="small"
            value={searchSupplierName}
            onChange={(e) => {
              setPage(0);
              setSearchSupplierName(e.target.value);
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="SAP Code"
            variant="outlined"
            size="small"
            value={searchSapCode}
            onChange={(e) => {
              setPage(0);
              setSearchSapCode(e.target.value);
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Item Description"
            variant="outlined"
            size="small"
            value={searchProductFullName}
            onChange={(e) => {
              setPage(0);
              setSearchProductFullName(e.target.value);
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Short Item Desc"
            variant="outlined"
            size="small"
            value={searchProductShortName}
            onChange={(e) => {
              setPage(0);
              setSearchProductShortName(e.target.value);
            }}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={9}
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
        >
          <Stack direction="row" spacing={2}>
            {/* Nút Search với giao diện gradient xanh dương hiện đại */}
            <Button
              variant="contained"
              onClick={() => {
                setPage(0);
                onSearch();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                background: 'linear-gradient(to right, #4cb8ff, #027aff)',
                color: '#fff',
                px: 3,
                borderRadius: '8px',
                fontSize: '0.875rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  background: 'linear-gradient(to right, #3ca4e6, #0167d3)',
                },
              }}
            >
              Search
            </Button>

            {/* Nút Reset với giao diện nhẹ nhàng, trung tính */}
            <Button
              variant="outlined"
              onClick={() => {
                setPage(0);
                onReset();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: theme.palette.grey[800],
                borderColor: theme.palette.grey[400],
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: theme.palette.grey[600],
                },
              }}
            >
              Reset
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}
