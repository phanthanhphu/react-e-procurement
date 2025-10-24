import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import Avatar from 'components/@extended/Avatar';
import ClickAwayListener from '@mui/material/ClickAwayListener';

// project-imports
import Transitions from 'components/@extended/Transitions';
import MainCard from 'components/MainCard';
import { useUser } from './useUser';
import { User } from 'iconsax-react'; // Thay 'Profile' bằng 'User'
import TabContent from './ProfileTab'; // Đổi tên import để tránh nhầm lẫn

function a11yProps(index) {
  return {
    id: `tab-${index}`, // Loại bỏ 'profile-' từ id
    'aria-controls': `tabpanel-${index}`, // Loại bỏ 'profile-' từ aria-controls
  };
}

export default function UserPage() { // Đổi tên từ ProfilePage thành UserPage
  const theme = useTheme();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);

  const { profileImage } = useUser();

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={(theme) => ({
          p: 0.25,
          borderRadius: 1,
          '&:hover': { bgcolor: 'secondary.lighter' },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.secondary.dark}`,
            outlineOffset: 2,
          },
        })}
        aria-label="open user" // Thay 'profile' bằng 'user'
        ref={anchorRef}
        aria-controls={open ? 'user-grow' : undefined} // Thay 'profile-grow' bằng 'user-grow'
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Avatar alt="user" src={profileImage} /> {/* Thay 'profile user' bằng 'user' */}
      </ButtonBase>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper
              sx={(theme) => ({
                boxShadow: theme.customShadows.z1,
                width: 290,
                minWidth: 240,
                maxWidth: 290,
                [theme.breakpoints.down('md')]: { maxWidth: 250 },
                borderRadius: 1.5,
              })}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard border={false} content={false}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                      variant="fullWidth"
                      value={value}
                      onChange={handleChange}
                      aria-label="user tabs" // Thay 'profile tabs' bằng 'user tabs'
                    >
                      <Tab
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 600,
                        }}
                        icon={<User size={18} />} // Thay 'Profile' bằng 'User'
                        label="User" // Thay 'Profile' bằng 'User'
                        {...a11yProps(0)}
                      />
                    </Tabs>
                  </Box>

                  <Box sx={{ p: 1 }}>
                    <TabContent />
                  </Box>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}