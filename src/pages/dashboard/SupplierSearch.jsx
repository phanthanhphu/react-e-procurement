import React from 'react';
import { Paper, TextField, Button, Stack, Grid, useTheme } from '@mui/material';

export default function SupplierSearch({
  searchSupplierCode,
  setSearchSupplierCode,
  searchSupplierName,
  setSearchSupplierName,
  searchSapCode,
  setSearchSapCode,
  searchItemNo, // Đổi tên đây từ productFullName thành itemNo
  setSearchItemNo, // Đổi tên setter
  searchProductShortName,
  setSearchProductShortName,
  searchFullDescription, // Trường mới Full Description
  setSearchFullDescription, // Setter mới
  searchGroupItem1, // Trường mới Group Item 1
  setSearchGroupItem1, // Setter mới
  searchGroupItem2, // Trường mới Group Item 2
  setSearchGroupItem2, // Setter mới
  setPage,
  onSearch,
  onReset,
}) {
  const theme = useTheme();

  const fields = [
    { label: 'Supplier Code', value: searchSupplierCode, setter: setSearchSupplierCode },
    { label: 'Supplier Name', value: searchSupplierName, setter: setSearchSupplierName },
    { label: 'SAP Code', value: searchSapCode, setter: setSearchSapCode },
    { label: 'Item No', value: searchItemNo, setter: setSearchItemNo }, // Thay Item Description thành Item No
    { label: 'Short Item Desc', value: searchProductShortName, setter: setSearchProductShortName },
    { label: 'Full Description', value: searchFullDescription, setter: setSearchFullDescription }, // Full Description
    { label: 'Group Item 1', value: searchGroupItem1, setter: setSearchGroupItem1 }, // Group Item 1
    { label: 'Group Item 2', value: searchGroupItem2, setter: setSearchGroupItem2 }, // Group Item 2
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
        overflowX: 'auto', // cho phép cuộn ngang nếu quá nhỏ
      }}
    >
      <Grid
        container
        spacing={2}
        wrap="nowrap" // không xuống dòng
        alignItems="center"
      >
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

        {/* Buttons */}
        <Grid item sx={{ display: 'flex', gap: 8 }}>
          <Button
            variant="contained"
            onClick={() => { setPage(0); onSearch(); }}
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
            onClick={() => { setPage(0); onReset(); }}
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
