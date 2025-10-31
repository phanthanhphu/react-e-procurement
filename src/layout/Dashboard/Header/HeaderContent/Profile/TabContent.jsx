import PropTypes from 'prop-types';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Snackbar, Alert, Tooltip, Portal } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useUser } from './useUser';
import { User, Edit2, Lock, Logout } from 'iconsax-react';
import EditUserDialog from '../../../../../pages/dashboard/EditUserDialog';
import ChangePasswordDialog from '../../../../../pages/dashboard/ChangePasswordDialog';
import ViewUserDialog from '../../../../../pages/dashboard/ViewUserDialog';
import { API_BASE_URL } from '../../../../../config';

function TabContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cacheBust = useMemo(() => Date.now(), []);
  const imageCacheRef = useRef(new Map());
  const [imageErrors, setImageErrors] = useState({});
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openChangePassDialog, setOpenChangePassDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const {
    username,
    email,
    address,
    phone,
    role,
    profileImage,
    userId,
    createdAt,
    error,
    success,
    firstLetter,
    fetchUser,
    handleUpdateUser,
    handleUpdatePassword
  } = useUser();

  useEffect(() => {
    if (error || success) {
      setSnackbarOpen(true);
    }
  }, [error, success]);

  const normalizeImageUrl = useCallback((url) => {
    if (!url) return null;
    const cacheKey = `url_${url}`;
    if (imageCacheRef.current.has(cacheKey)) return imageCacheRef.current.get(cacheKey);
    let normalized = url.replace(/\\/g, '/');
    let finalUrl;
    const DEFAULT_IMAGE_URL = `/Uploads/users/default-user.png`;

    normalized = normalized.split('?')[0];

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      finalUrl = normalized.replace(/^https?:\/\/[^\/]+/, '');
    } else if (normalized.startsWith('/uploads/users/') || normalized.startsWith('/Uploads/users/')) {
      finalUrl = normalized;
    } else {
      const cleanPath = normalized.replace(/^\/?uploads\/users\//i, '');
      finalUrl = `/Uploads/users/${cleanPath}`;
    }
    imageCacheRef.current.set(cacheKey, finalUrl || DEFAULT_IMAGE_URL);
    return finalUrl || DEFAULT_IMAGE_URL;
  }, []);

  const processedUser = useMemo(() => {
    const imageUrl = normalizeImageUrl(profileImage);
    const finalImageUrl = imageUrl || `/Uploads/users/default-user.png`;
    return { id: userId, username, profileImageUrl: imageUrl, displayImageUrl: finalImageUrl };
  }, [profileImage, userId, username, normalizeImageUrl]);

  const handleImageError = useCallback((userId) => {
    if (imageErrors[userId]) return;
    setImageErrors((prev) => ({ ...prev, [userId]: true }));
  }, [imageErrors]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'DELETE',
        headers: {
          'accept': '*/*',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.href = '/react/login';
      }, 1000);
    } catch (err) {
      console.error('Logout error:', err);
      setSnackbarOpen(true);
    }
  };

  const UserImage = () => {
    const { id, username, displayImageUrl } = processedUser;
    const hasError = imageErrors[id];

    const renderContent = () => {
      if (displayImageUrl && !hasError) {
        return (
          <img
            src={`${API_BASE_URL}${displayImageUrl}`}
            alt={username}
            width={48}
            height={48}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              border: '2px solid',
              borderColor: theme.palette.primary.main,
            }}
            loading="lazy"
            onError={(e) => {
              console.error(`Failed to load image: ${displayImageUrl}`);
              handleImageError(id);
            }}
          />
        );
      }

      return (
        <Box
          sx={{
            bgcolor: '#f5f5f5',
            width: 48,
            height: 48,
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
      <Tooltip
        title={
          <Box>
            <Box
              sx={{
                bgcolor: '#f5f5f5',
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              {firstLetter || '?'}
            </Box>
            <Typography
              variant="caption"
              sx={{ mt: 0.5, display: 'block', textAlign: 'center', fontSize: '0.8rem' }}
            >
              {username}
            </Typography>
          </Box>
        }
        arrow
        sx={{
          '& .MuiTooltip-tooltip': {
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
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
      </Tooltip>
    );
  };

  const handleView = () => {
    setOpenViewDialog(true);
    setOpenEditDialog(false);
    setOpenChangePassDialog(false);
    if (userId) fetchUser(userId);
  };

  const handleEdit = () => {
    setOpenViewDialog(false);
    setOpenEditDialog(true);
    setOpenChangePassDialog(false);
  };

  const handleChangePassword = () => {
    setOpenViewDialog(false);
    setOpenEditDialog(false);
    setOpenChangePassDialog(true);
  };

  const handleCloseViewDialog = () => setOpenViewDialog(false);
  const handleCloseEditDialog = () => setOpenEditDialog(false);
  const handleCloseChangePassDialog = () => setOpenChangePassDialog(false);

  return (
    <>
      <Card
        sx={{
          mb: 1,
          boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 1 }}>
          <UserImage />
          <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5, mb: 0.5 }}>
            {username || 'User'}
          </Typography>
          <Chip
            label={role?.toUpperCase() || 'USER'}
            size="small"
            color="primary"
            sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem', py: 0.75, height: '24px' }}
          />
          <Box sx={{ mt: 0.5, minWidth: 160, backgroundColor: theme.palette.background.paper, padding: 0.5, textAlign: 'left' }}>
            <MenuItem onClick={handleView} sx={{ py: 0.75 }}>
              <ListItemIcon>
                <User size={16} color={theme.palette.primary.main} />
              </ListItemIcon>
              <ListItemText primary="View" sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }} />
            </MenuItem>
            <Divider sx={{ my: 0.25 }} />
            <MenuItem onClick={handleEdit} sx={{ py: 0.75 }}>
              <ListItemIcon>
                <Edit2 size={16} color={theme.palette.warning.main} />
              </ListItemIcon>
              <ListItemText primary="Edit" sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }} />
            </MenuItem>
            <Divider sx={{ my: 0.25 }} />
            <MenuItem onClick={handleChangePassword} sx={{ py: 0.75 }}>
              <ListItemIcon>
                <Lock size={16} color={theme.palette.info.main} />
              </ListItemIcon>
              <ListItemText primary="Change Password" sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }} />
            </MenuItem>
            <Divider sx={{ my: 0.25 }} />
            <MenuItem onClick={handleLogout} sx={{ py: 0.75 }}>
              <ListItemIcon>
                <Logout size={16} color={theme.palette.error.main} />
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { fontSize: '0.85rem' } }} />
            </MenuItem>
          </Box>
        </CardContent>
      </Card>
      <ViewUserDialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        user={{ username, email, address, phone, role, profileImageUrl: profileImage, createdAt }}
      />
      <EditUserDialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        onUpdate={handleUpdateUser}
        user={{ id: userId, username, email, address, phone, role, profileImageUrl: profileImage }}
      />
      <ChangePasswordDialog
        open={openChangePassDialog}
        onClose={handleCloseChangePassDialog}
        onUpdate={handleUpdatePassword}
        user={{ email }}
      />
      <Portal>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%', fontSize: '0.85rem', py: 1 }}
          >
            {error || success || 'Logout successful'}
          </Alert>
        </Snackbar>
      </Portal>
    </>
  );
}

TabContent.propTypes = { children: PropTypes.node };
export default TabContent;