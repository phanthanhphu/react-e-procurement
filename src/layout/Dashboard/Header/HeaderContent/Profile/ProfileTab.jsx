import { useState, useRef } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { useNavigate } from 'react-router-dom';
import { Card, Edit2, Logout, Profile, Profile2User, Save2, Trash } from 'iconsax-react';
import { useUser } from './useUser';

export default function ProfileTab() {
  const navigate = useNavigate();
  const { username, email, password, isEditing, editedUsername, editedEmail, editedPassword, setEditedUsername, setEditedEmail, setEditedPassword, setIsEditing, handleSave, userId } = useUser();
  const [openPopup, setOpenPopup] = useState(false);
  const anchorRef = useRef(null);

  const handleTogglePopup = () => {
    setOpenPopup((prev) => !prev);
  };

  const handleClosePopup = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpenPopup(false);
  };

  const handleEdit = () => {
    setEditedUsername(username);
    setEditedEmail(email);
    setEditedPassword(password);
    setIsEditing(true);
    setOpenPopup(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      // Thêm logic xóa tài khoản (ví dụ: gọi API hoặc redirect)
      console.log('Delete account for userId:', userId);
      setOpenPopup(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
      <ListItemButton ref={anchorRef} onClick={handleTogglePopup}>
        <ListItemIcon>
          <Edit2 variant="Bulk" size={18} />
        </ListItemIcon>
        <ListItemText primary="Edit Profile" />
      </ListItemButton>
      {openPopup && (
        <Popper
          open={openPopup}
          anchorEl={anchorRef.current}
          placement="right"
          disablePortal
          sx={{ zIndex: 1300 }}
        >
          <ClickAwayListener onClickAway={handleClosePopup}>
            <Paper sx={{ p: 1, minWidth: 150 }}>
              <List>
                <ListItemButton onClick={handleEdit}>
                  <ListItemIcon>
                    <Edit2 variant="Bulk" size={18} />
                  </ListItemIcon>
                  <ListItemText primary="Edit" />
                </ListItemButton>
                <ListItemButton onClick={handleDelete}>
                  <ListItemIcon>
                    <Trash variant="Bulk" size={18} />
                  </ListItemIcon>
                  <ListItemText primary="Delete" />
                </ListItemButton>
              </List>
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}
      {isEditing && (
        <ListItemButton>
          <ListItemIcon>
            <Edit2 variant="Bulk" size={18} />
          </ListItemIcon>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
            <TextField
              value={editedUsername}
              onChange={(e) => setEditedUsername(e.target.value)}
              label="Username"
              size="small"
              fullWidth
              autoFocus
            />
            <TextField
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              label="Email"
              size="small"
              fullWidth
            />
            <TextField
              value={editedPassword}
              onChange={(e) => setEditedPassword(e.target.value)}
              label="Password"
              type="password"
              size="small"
              fullWidth
            />
            <IconButton color="primary" onClick={handleSave}>
              <Save2 variant="Bulk" size={18} />
            </IconButton>
          </Stack>
        </ListItemButton>
      )}
      <ListItemButton>
        <ListItemIcon>
          <Profile variant="Bulk" size={18} />
        </ListItemIcon>
        <ListItemText primary="View Profile" />
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <Profile2User variant="Bulk" size={18} />
        </ListItemIcon>
        <ListItemText primary="Social Profile" />
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <Card variant="Bulk" size={18} />
        </ListItemIcon>
        <ListItemText primary="Billing" />
      </ListItemButton>
      <ListItemButton onClick={handleLogout}>
        <ListItemIcon>
          <Logout variant="Bulk" size={18} />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </List>
  );
}