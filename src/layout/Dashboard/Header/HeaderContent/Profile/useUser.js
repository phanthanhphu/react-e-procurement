import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../../../config'; // Đã sửa đường dẫn dựa trên cấu trúc thư mục

export function useUser() {
  const [username, setUsername] = useState('John Doe');
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User data from localStorage:', user); // Thêm log để kiểm tra
      if (user && user.username) {
        setUsername(user.username);
        setEditedUsername(user.username);
      }
      if (user && user.profileImageUrl) {
        setProfileImageUrl(user.profileImageUrl);
      }
      if (user && user.id) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
  }, []);

  const handleSaveUsername = async () => {
    if (editedUsername.trim()) {
      setUsername(editedUsername);
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.username = editedUsername;
        localStorage.setItem('user', JSON.stringify(user));

        const token = localStorage.getItem('token');
        if (token && userId) {
          await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username: editedUsername }),
          });
        }

        setIsEditing(false);
        toast.success('Username updated successfully');
      } catch (error) {
        console.error('Error saving user data:', error);
        toast.error('Error saving username');
      }
    }
  };

  return {
    username,
    profileImageUrl,
    isEditing,
    editedUsername,
    setEditedUsername,
    setIsEditing,
    handleSaveUsername,
    userId,
  };
}