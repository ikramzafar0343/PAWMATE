// src/utils/prescriptionStore.js

import API from '../api/client';

export const getPrescriptions = async (petId = null, status = null) => {
  try {
    // Don't make API call if petId is invalid
    if (petId && (petId === 'null' || petId === 'undefined' || petId === '1')) {
      return [];
    }
    
    const params = {};
    if (petId) params.petId = petId;
    if (status) params.status = status;
    
    const { data } = await API.get('/prescriptions', { params });
    return data;
  } catch (error) {
    // Don't log errors for invalid IDs
    if (error.response?.status !== 400 && error.response?.status !== 404) {
      console.error("Error fetching prescriptions", error);
    }
    return [];
  }
};

export const getPrescriptionById = async (id) => {
  try {
    const { data } = await API.get(`/prescriptions/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching prescription", error);
    return null;
  }
};

export const addPrescription = async (prescription) => {
  try {
    const { data } = await API.post('/prescriptions', prescription);
    window.dispatchEvent(new Event('prescriptionUpdate'));
    return data;
  } catch (error) {
    console.error("Error adding prescription", error);
    throw error;
  }
};

export const updatePrescription = async (id, updates) => {
  try {
    const { data } = await API.put(`/prescriptions/${id}`, updates);
    window.dispatchEvent(new Event('prescriptionUpdate'));
    return data;
  } catch (error) {
    console.error("Error updating prescription", error);
    throw error;
  }
};

export const completePrescription = async (id) => {
  return await updatePrescription(id, { status: 'completed' });
};

export const approvePrescription = async (id) => {
  try {
    const { data } = await API.put(`/prescriptions/${id}/approve`);
    window.dispatchEvent(new Event('prescriptionUpdate'));
    return data;
  } catch (error) {
    console.error("Error approving prescription", error);
    throw error;
  }
};

export const getPendingPrescriptions = async () => {
  try {
    const { data } = await API.get('/prescriptions/pending');
    return data;
  } catch (error) {
    console.error("Error fetching pending prescriptions", error);
    return [];
  }
};

export const getActivePrescription = async (petId) => {
  try {
    // Don't make API call if petId is invalid
    if (!petId || petId === 'null' || petId === 'undefined' || petId === '1') {
      return null;
    }
    
    const { data } = await API.get(`/prescriptions/pet/${petId}/active`);
    return data;
  } catch (error) {
    // Don't log errors for invalid IDs
    if (error.response?.status !== 400 && error.response?.status !== 404) {
      console.error("Error fetching active prescription", error);
    }
    return null;
  }
};

