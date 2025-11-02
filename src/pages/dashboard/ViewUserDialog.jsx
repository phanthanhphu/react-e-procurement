import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Stack,
  Avatar,
  Box,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import { Icon } from 'iconsax-react';
import { API_BASE_URL } from '../../config.js';

export default function ViewUserDialog({ open, onClose, user }) {
  const theme = useTheme();

  const getRoleColor = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'error';
    if (r.includes('manager') || r.includes('mod')) return 'warning';
    return 'success';
  };

  const getRoleLabel = (role) => role || 'User';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          p: { xs: 1.5, sm: 2 },
          width: { xs: '90%', sm: 340 },
          maxWidth: 340,
          maxHeight: '80vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 0, position: 'relative' }}>
        <Typography variant="h6" fontWeight={600} align="center">
          User Profile
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 6,
            top: 6,
            color: 'text.secondary',
            p: 0.5,
          }}
        >
          <Icon name="Close" size={18} />
        </IconButton>
      </DialogTitle>

      {/* Body */}
      <DialogContent sx={{ pt: 1.5, pb: 2, px: 2 }}>
        <Stack spacing={2} alignItems="center">
          {/* Avatar + Online Dot */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={
                user?.profileImageUrl
                  ? `${API_BASE_URL}${user.profileImageUrl}`
                  : `${API_BASE_URL}/Uploads/users/default-user.png`
              }
              alt={user?.username}
              sx={{
                width: 72,
                height: 72,
                border: `3px solid ${theme.palette.background.paper}`,
                boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
              }}
              onError={(e) => {
                e.target.src = `${API_BASE_URL}/Uploads/users/default-user.png`;
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 16,
                height: 16,
                bgcolor: '#00C853',
                border: '3px solid',
                borderColor: 'background.paper',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(0,200,83,0.7)',
                animation: user?.isActive ? 'pulse 2s infinite' : 'none',
              }}
            />
          </Box>

          {/* Username */}
          <Typography variant="h6" fontWeight={700} align="center">
            {user?.username || '—'}
          </Typography>

          {/* Info List */}
          <Stack spacing={1.2} width="100%">
            {[
              { icon: 'Mail', label: 'Email', value: user?.email },
              { icon: 'Call', label: 'Phone', value: user?.phone },
              { icon: 'Location', label: 'Address', value: user?.address },
              { icon: 'UserTag', label: 'Role', value: user?.role },
            ].map((item, i) => (
              <Stack direction="row" spacing={1.2} key={i} alignItems="flex-start">
                <Box sx={{ color: 'primary.main', mt: 0.3 }}>
                  <Icon name={item.icon} size={16} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ wordBreak: 'break-word', fontSize: '0.875rem' }}
                  >
                    {item.value || '—'}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DialogContent>

      {/* Pulse Animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(0, 200, 83, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 200, 83, 0); }
        }
      `}</style>
    </Dialog>
  );
}