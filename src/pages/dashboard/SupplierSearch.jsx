import React from 'react';
import { Paper, TextField, Button, Box, useTheme } from '@mui/material';

export default function SupplierSearch({
  searchSupplierCode,
  setSearchSupplierCode,
  searchSupplierName,
  setSearchSupplierName,
  searchSapCode,
  setSearchSapCode,
  searchItemNo,
  setSearchItemNo,
  searchProductShortName,
  setSearchProductShortName,
  searchFullDescription,
  setSearchFullDescription,
  searchGroupItem1,
  setSearchGroupItem1,
  searchGroupItem2,
  setSearchGroupItem2,
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
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`,
        overflowX: 'auto',
      }}
    >
      {/* Hàng 1: 4 input + nút Search */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          label="Supplier Code"
          variant="outlined"
          size="small"
          value={searchSupplierCode}
          onChange={(e) => {
            setPage(0);
            setSearchSupplierCode(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <TextField
          label="Supplier Name"
          variant="outlined"
          size="small"
          value={searchSupplierName}
          onChange={(e) => {
            setPage(0);
            setSearchSupplierName(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <TextField
          label="SAP Code"
          variant="outlined"
          size="small"
          value={searchSapCode}
          onChange={(e) => {
            setPage(0);
            setSearchSapCode(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <TextField
          label="Item No"
          variant="outlined"
          size="small"
          value={searchItemNo}
          onChange={(e) => {
            setPage(0);
            setSearchItemNo(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />

        <Box sx={{ flexShrink: 0 }}>
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
              height: 40,
              whiteSpace: 'nowrap',
            }}
          >
            Search
          </Button>
        </Box>
      </Box>

      {/* Hàng 2: 4 input + nút Reset */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          label="Short Item Desc"
          variant="outlined"
          size="small"
          value={searchProductShortName}
          onChange={(e) => {
            setPage(0);
            setSearchProductShortName(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <TextField
          label="Full Description"
          variant="outlined"
          size="small"
          value={searchFullDescription}
          onChange={(e) => {
            setPage(0);
            setSearchFullDescription(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <TextField
          label="Group Item 1"
          variant="outlined"
          size="small"
          value={searchGroupItem1}
          onChange={(e) => {
            setPage(0);
            setSearchGroupItem1(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <TextField
          label="Group Item 2"
          variant="outlined"
          size="small"
          value={searchGroupItem2}
          onChange={(e) => {
            setPage(0);
            setSearchGroupItem2(e.target.value);
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />

        <Box sx={{ flexShrink: 0 }}>
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
              height: 40,
              whiteSpace: 'nowrap',
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
