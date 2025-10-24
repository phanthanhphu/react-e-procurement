import React, { useEffect, useState } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Box, 
  useTheme, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Snackbar, 
  Alert 
} from '@mui/material';
import { API_BASE_URL } from '../../config';

export default function UserSearch({
  searchUsername,
  setSearchUsername,
  searchAddress,
  setSearchAddress,
  searchPhone,
  setSearchPhone,
  searchEmail,
  setSearchEmail,
  searchRole,
  setSearchRole,
  setPage,
  onSearch,
  onReset,
}) {
  const theme = useTheme();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle role change
  const handleRoleChange = (event) => {
    const value = event.target.value;
    setSearchRole(value);
    setPage(0);
  };

  // Handle username change
  const handleUsernameChange = (event) => {
    const value = event.target.value;
    setSearchUsername(value);
    setPage(0);
  };

  // Handle address change
  const handleAddressChange = (event) => {
    const value = event.target.value;
    setSearchAddress(value);
    setPage(0);
  };

  // Handle phone change
  const handlePhoneChange = (event) => {
    const value = event.target.value;
    setSearchPhone(value);
    setPage(0);
  };

  // Handle email change
  const handleEmailChange = (event) => {
    const value = event.target.value;
    setSearchEmail(value);
    setPage(0);
  };

  // Handle search
  const handleSearch = async () => {
    setLoading(true);
    setPage(0);
    try {
      await onSearch();
    } catch (error) {
      setError('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setPage(0);
    setSearchUsername('');
    setSearchAddress('');
    setSearchPhone('');
    setSearchEmail('');
    setSearchRole('');
    onReset();
  };

  // Close error Snackbar
  const handleCloseError = () => {
    setError(null);
  };

  // Validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        mb: 1.5,
        background: 'linear-gradient(to right, #f7faff, #ffffff)',
        borderRadius: 2,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        border: `1px solid ${theme.palette.divider}`,
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%', fontSize: '0.65rem' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Single Row: Username, Email, Phone, Role, Address, Search, Reset */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {/* Username - 12.5% */}
        <Box sx={{ width: '12.5%', minWidth: 120 }}>
          <TextField
            label="Username"
            variant="outlined"
            size="small"
            value={searchUsername}
            onChange={handleUsernameChange}
            placeholder="Username"
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>

        {/* Email - 12.5% */}
        <Box sx={{ width: '12.5%', minWidth: 130 }}>
          <TextField
            label="Email"
            variant="outlined"
            size="small"
            value={searchEmail}
            onChange={handleEmailChange}
            placeholder="Email"
            error={searchEmail && !isValidEmail(searchEmail)}
            helperText={searchEmail && !isValidEmail(searchEmail) ? "Invalid email" : ""}
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>

        {/* Phone - 12.5% */}
        <Box sx={{ width: '12.5%', minWidth: 120 }}>
          <TextField
            label="Phone"
            variant="outlined"
            size="small"
            value={searchPhone}
            onChange={handlePhoneChange}
            placeholder="Phone"
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>

        {/* Role Select - 12.5% */}
        <Box sx={{ width: '12.5%', minWidth: 110 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="role-label" sx={{ fontSize: '0.55rem', top: '-6px' }}>
              Role
            </InputLabel>
            <Select
              labelId="role-label"
              value={searchRole || ''}
              label="Role"
              onChange={handleRoleChange}
              sx={{
                height: '30px',
                borderRadius: '6px',
                fontSize: '0.55rem',
              }}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Leader">Leader</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Address - 25% (wider for better input) */}
        <Box sx={{ width: '25%', minWidth: 200 }}>
          <TextField
            label="Address"
            variant="outlined"
            size="small"
            value={searchAddress}
            onChange={handleAddressChange}
            placeholder="Address"
            sx={{
              '& .MuiInputBase-root': { height: '30px', borderRadius: '6px', fontSize: '0.55rem' },
              '& .MuiInputLabel-root': { fontSize: '0.55rem', top: '-6px' },
              width: '100%',
            }}
          />
        </Box>

        {/* Search Button - 12.5% */}
        <Box sx={{ width: '12.5%', minWidth: 100 }}>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              background: loading 
                ? theme.palette.action.disabledBackground 
                : 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              px: 1,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.65rem',
              height: '30px',
              width: '100%',
              whiteSpace: 'nowrap',
              '&:hover': {
                background: 'linear-gradient(to right, #027aff, #4cb8ff)',
              },
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>

        {/* Reset Button - 12.5% */}
        <Box sx={{ width: '12.5%', minWidth: 100 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 1,
              py: 0.3,
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: theme.palette.grey[800],
              borderColor: theme.palette.grey[400],
              height: '30px',
              width: '100%',
              whiteSpace: 'nowrap',
              '&:hover': {
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                backgroundColor: theme.palette.error.lighter,
              },
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}