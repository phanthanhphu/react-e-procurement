import PropTypes from 'prop-types';
import { useRef, useState, useMemo, useCallback } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';

// project-imports
import Transitions from 'components/@extended/Transitions';
import MainCard from 'components/MainCard';
import { useUser } from './useUser';
import { User } from 'iconsax-react';
import TabContent from './TabContent';
import { API_BASE_URL } from '../../../../../config';

function a11yProps(index) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

export default function UserPage() {
  const theme = useTheme();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);
  const [imageError, setImageError] = useState(false); // Trạng thái lỗi hình ảnh

  const { profileImage, username, firstLetter, userId } = useUser(); // Lấy thêm firstLetter và userId

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

  const normalizeImageUrl = useCallback((url) => {
    if (!url) return null;
    let normalized = url.replace(/\\/g, '/');
    let finalUrl;

    normalized = normalized.split('?')[0];

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      finalUrl = normalized.replace(/^https?:\/\/[^\/]+/, '');
    } else if (normalized.startsWith('/uploads/users/') || normalized.startsWith('/Uploads/users/')) {
      finalUrl = normalized;
    } else {
      const cleanPath = normalized.replace(/^\/?uploads\/users\//i, '');
      finalUrl = `/uploads/users/${cleanPath}`;
    }
    return finalUrl || null;
  }, []);

  const processedUser = useMemo(() => {
    const imageUrl = normalizeImageUrl(profileImage);
    const finalImageUrl = imageUrl || '/uploads/users/default-user.png';
    return { id: userId, username, profileImageUrl: imageUrl, displayImageUrl: finalImageUrl };
  }, [profileImage, userId, username, normalizeImageUrl]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const UserAvatar = () => {
    const { username, displayImageUrl } = processedUser;

    const renderContent = () => {
      // Nếu có ảnh profile và không có lỗi, hiển thị ảnh
      if (displayImageUrl && !imageError) {
        return (
          <img
            src={`${API_BASE_URL}${displayImageUrl}`}
            alt={username || 'User'}
            width={40}
            height={40}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              border: `2px solid ${theme.palette.primary.main}`,
            }}
            loading="lazy"
            onError={handleImageError}
          />
        );
      }

      // Nếu không có ảnh hoặc có lỗi, hiển thị chữ cái đầu tiên
      return (
        <Box
          sx={{
            bgcolor: '#f5f5f5',
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: theme.palette.primary.main,
            border: `2px solid ${theme.palette.primary.main}`,
          }}
        >
          {firstLetter || '?'}
        </Box>
      );
    };

    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.05)',
            transition: '0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        }}
      >
        {renderContent()}
      </Box>
    );
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
        aria-label="open user"
        ref={anchorRef}
        aria-controls={open ? 'user-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <UserAvatar />
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
                      aria-label="user tabs"
                    >
                      <Tab
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 600,
                        }}
                        icon={<User size={18} />}
                        label="User"
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

UserPage.propTypes = {
  children: PropTypes.node,
};