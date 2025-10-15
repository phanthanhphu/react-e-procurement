import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../../../config.js'; // Adjusted for D:\Project\React\react\config.js

export const useUser = () => {
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  const [username, setUsername] = useState(storedUser.username || '');
  const [email, setEmail] = useState(storedUser.email || '');
  const [address, setAddress] = useState(storedUser.address || '');
  const [phone, setPhone] = useState(storedUser.phone || '');
  const [role, setRole] = useState(storedUser.role || '');
  const [profileImage, setProfileImage] = useState(storedUser.profileImageUrl || null);
  const [userId, setUserId] = useState(storedUser.id || '');
  const [createdAt, setCreatedAt] = useState(storedUser.createdAt || null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    setUsername(user.username || '');
    setEmail(user.email || '');
    setAddress(user.address || '');
    setPhone(user.phone || '');
    setRole(user.role || '');
    setProfileImage(user.profileImageUrl || null);
    setUserId(user.id || '');
    setCreatedAt(user.createdAt || null);
  }, []);

  const fetchUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          accept: '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const data = await response.json();
      const user = data.data || {};
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      setPhone(user.phone || '');
      setRole(user.role || '');
      setProfileImage(user.profileImageUrl || null);
      setUserId(user.id || '');
      setCreatedAt(user.createdAt || null);
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess('User data fetched successfully');
      setError('');
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleUpdateUser = (data) => {
    const updatedUser = data.user || {
      id: userId,
      username: data.username || username,
      email: data.email || email,
      address: data.address || address,
      phone: data.phone || phone,
      role: data.role || role,
      profileImageUrl: data.profileImageUrl || profileImage,
      createdAt: data.createdAt || createdAt,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUsername(updatedUser.username);
    setEmail(updatedUser.email);
    setAddress(updatedUser.address);
    setPhone(updatedUser.phone);
    setRole(updatedUser.role);
    setProfileImage(updatedUser.profileImageUrl);
    setCreatedAt(updatedUser.createdAt);
    setIsEditing(false);
    setSuccess('Profile updated successfully');
    setError('');
  };

  const handleUpdatePassword = (data) => {
    setSuccess(data.message || 'Password changed successfully');
    setError('');
  };

  return {
    username,
    email,
    address,
    phone,
    role,
    profileImage,
    userId,
    createdAt,
    isEditing,
    error,
    success,
    setIsEditing,
    fetchUser,
    handleUpdateUser,
    handleUpdatePassword,
  };
};