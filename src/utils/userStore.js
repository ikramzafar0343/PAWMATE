// src/utils/userStore.js

import API from '../api/client';

// Request deduplication cache
const requestCache = new Map();
const CACHE_TTL = 5000; // 5 second cache for user data

export const getCurrentUser = async () => {
  const cacheKey = 'getCurrentUser';
  const cached = requestCache.get(cacheKey);
  const now = Date.now();
  
  // Return cached result if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const startTime = performance.now();
    const { data } = await API.get('/auth/me');
    const endTime = performance.now();
    console.log(`[Performance] getCurrentUser API: ${(endTime - startTime).toFixed(2)}ms`);
    
    // Cache the result
    requestCache.set(cacheKey, { data, timestamp: now });
    setTimeout(() => requestCache.delete(cacheKey), CACHE_TTL);
    
    return data;
  } catch (error) {
    console.error("Error fetching current user", error);
    return null;
  }
};

export const updateCurrentUser = async (userData) => {
  try {
    const { data } = await API.put('/users/me', userData);
    window.dispatchEvent(new Event('userProfileUpdate'));
    return data;
  } catch (error) {
    console.error("Error updating user", error);
    throw error;
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (filters = {}) => {
  try {
    const params = {};
    if (filters.role) params.role = filters.role;
    if (filters.status) params.status = filters.status;
    
    const { data } = await API.get('/users', { params });
    return data;
  } catch (error) {
    console.error("Error fetching users", error);
    return [];
  }
};

// @desc    Get pending users (Admin only)
// @route   GET /api/users?status=pending
// @access  Private/Admin
export const getPendingUsers = async () => {
  try {
    const { data } = await API.get('/users', { params: { status: 'pending' } });
    return data;
  } catch (error) {
    console.error("Error fetching pending users", error);
    return [];
  }
};

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUserStatus = async (userId, status) => {
  try {
    const { data } = await API.put(`/users/${userId}`, { status });
    window.dispatchEvent(new Event('userUpdate'));
    return data;
  } catch (error) {
    console.error("Error updating user status", error);
    throw error;
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (userId, userData) => {
  try {
    const { data } = await API.put(`/users/${userId}`, userData);
    window.dispatchEvent(new Event('userUpdate'));
    return data;
  } catch (error) {
    console.error("Error updating user", error);
    throw error;
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (userId) => {
  try {
    const { data } = await API.delete(`/users/${userId}`);
    window.dispatchEvent(new Event('userUpdate'));
    return data;
  } catch (error) {
    console.error("Error deleting user", error);
    throw error;
  }
};
