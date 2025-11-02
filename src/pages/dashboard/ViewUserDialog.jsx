import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Avatar,
  Chip,
  Divider,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import { Icon } from 'iconsax-react'; // CHẠY ĐƯỢC MỌI PHIÊN BẢN
import { API_BASE_URL } from '../../config.js';

export default function ViewUserDialog({ open, onClose, user }) {
  const theme = useTheme();

  // Format date từ mảng [year, month, day, hour, minute, second]
  const formatDate = (dateArray) => {
    if (!dateArray || dateArray.length < 6) return 'N/A';
    const [y, m, d, h, min] = dateArray;
    const date = new Date(y, m - 1, d, h, min);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Màu cho role
  const getRoleColor = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'error';
    if (r.includes('manager') || r.includes('mod')) return 'warning';
    if (r.includes('user') || r.includes('member')) return 'success';
    return 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1, position: 'relative' }}>
        <Typography variant="h6" fontWeight={600}>
          User Profile
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Icon name="close" size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3} alignItems="center">
          {/* Avatar + Online Status */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={
                user?.profileImageUrl
                  ? `${API_BASE_URL}${user.profileImageUrl}`
                  : `${API_BASE_URL}/Uploads/users/default-user.png`
              }
              alt={user?.username}
              sx={{
                width: 110,
                height: 110,
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              onError={(e) => {
                e.target.src = `${API_BASE_URL}/Uploads/users/default-user.png`;
              }}
            />
            {/* Online dot */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 16,
                height: 16,
                bgcolor: user?.isActive ? 'success.main' : 'grey.400',
                border: '3px solid',
                borderColor: 'background.paper',
                borderRadius: '50%',
              }}
            />
          </Box>

          {/* Username */}
          <Typography variant="h5" fontWeight={700}>
            {user?.username || 'N/A'}
          </Typography>

          {/* Role Chip – ĐÃ CĂN GIỮA */}
          <Chip
            icon={<Icon name="shield-tick" size={16} />}
            label={user?.role || 'Unknown'}
            color={getRoleColor(user?.role)}
            size="small"
            sx={{
              fontWeight: 600,
              textTransform: 'capitalize',
              alignSelf: 'center', // ĐÃ SỬA: CĂN GIỮA HOÀN HẢO
            }}
          />

          <Divider sx={{ width: '100%', my: 1 }} />

          {/* Info List */}
          <Stack spacing={2} width="100%">
            {[
              { icon: <Icon name="mail" size={18} />, label: 'Email', value: user?.email },
              { icon: <Icon name="call" size={18} />, label: 'Phone', value: user?.phone },
              { icon: <Icon name="location" size={18} />, label: 'Address', value: user?.address },
              { icon: <Icon name="calendar-1" size={18} />, label: 'Created', value: formatDate(user?.createdAt) },
            ].map((item, idx) => (
              <Stack direction="row" spacing={1.5} key={idx} alignItems="flex-start">
                <Box sx={{ color: 'primary.main', mt: 0.5 }}>{item.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {item.label}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {item.value || '—'}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}