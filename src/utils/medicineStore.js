// src/utils/medicineStore.js

import API from '../api/client';

export const getMedicines = async (category = null, recommendedBy = null) => {
  try {
    const params = {};
    if (category) params.category = category;
    if (recommendedBy) params.recommendedBy = recommendedBy;
    
    const { data } = await API.get('/medicines', { params });
    return data;
  } catch (error) {
    console.error("Error fetching medicines", error);
    return [];
  }
};

export const getMedicineById = async (id) => {
  try {
    const { data } = await API.get(`/medicines/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching medicine", error);
    return null;
  }
};

export const addMedicine = async (newMedicine) => {
  try {
    const { data } = await API.post('/medicines', newMedicine);
    window.dispatchEvent(new Event('medicineUpdate'));
    return data;
  } catch (error) {
    console.error("Error adding medicine", error);
    throw error;
  }
};

export const updateMedicine = async (id, updates) => {
  try {
    const { data } = await API.put(`/medicines/${id}`, updates);
    window.dispatchEvent(new Event('medicineUpdate'));
    return data;
  } catch (error) {
    console.error("Error updating medicine", error);
    throw error;
  }
};

export const deleteMedicine = async (id) => {
  try {
    await API.delete(`/medicines/${id}`);
    window.dispatchEvent(new Event('medicineUpdate'));
    return true;
  } catch (error) {
    console.error("Error deleting medicine", error);
    throw error;
  }
};
