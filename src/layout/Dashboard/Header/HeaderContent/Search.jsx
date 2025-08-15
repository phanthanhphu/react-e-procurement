// material-ui
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Box from '@mui/material/Box';

// assets
import { SearchNormal1 } from 'iconsax-reactjs';

// ==============================|| HEADER CONTENT - SEARCH ||============================== //

export default function Search() {
  return (
    <Box sx={{ width: '100%', ml: { xs: 0, md: 2 } }}>
      <FormControl sx={{ width: { xs: '100%', md: 560  } }}>
        <OutlinedInput
          id="header-search"
          startAdornment={
            <InputAdornment position="start" sx={{ mr: 1, color: 'text.secondary' }}>
              <SearchNormal1 size={20} />
            </InputAdornment>
          }
          aria-describedby="header-search-text"
          slotProps={{ input: { 'aria-label': 'search' } }}
          placeholder="Search ..."
          sx={{
            borderRadius: 2,          // bo tròn góc
            boxShadow: '0 2px 6px rgb(0 0 0 / 0.1)',  // đổ bóng nhẹ
            backgroundColor: 'background.paper',
            '& .MuiOutlinedInput-input': {
              p: '10px 12px',
              fontSize: 14,
              color: 'text.primary'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              borderWidth: 2
            }
          }}
        />
      </FormControl>
    </Box>
  );
}
