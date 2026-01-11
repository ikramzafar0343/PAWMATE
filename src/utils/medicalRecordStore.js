import API from '../api/client';

export const MEDICAL_RECORD_TYPES = {
  VACCINATION: 'Vaccination',
  TREATMENT: 'Treatment',
  PRESCRIPTION: 'Prescription',
  LAB_RESULT: 'Lab Result',
  VET_NOTE: 'Vet Note',
  AI_DIAGNOSIS: 'AI Diagnosis'
};

// Request deduplication cache
const requestCache = new Map();
const pendingRequests = new Map(); // Track in-flight requests
const CACHE_TTL = 2000; // 2 second cache

export const getMedicalRecords = async (petId = null) => {
  try {
    if (
      !petId ||
      petId === 'null' ||
      petId === 'undefined' ||
      petId === '1' ||
      typeof petId !== 'string' ||
      !/^[0-9a-fA-F]{24}$/.test(petId)
    ) {
      return [];
    }
    
    const cacheKey = `getMedicalRecords_${petId}`;
    const cached = requestCache.get(cacheKey);
    const now = Date.now();
    
    // Return cached result if still valid
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }
    
    // Atomic check-and-set to prevent race conditions
    // If a request is already in flight, wait for it instead of making a new one
    let requestPromise = pendingRequests.get(cacheKey);
    if (requestPromise) {
      return requestPromise;
    }
    
    // Create the request promise synchronously and set it immediately
    // This ensures no two calls can both pass the check above
    requestPromise = (async () => {
      try {
        const startTime = performance.now();
        const { data } = await API.get(`/medical-records/${petId}`);
        const endTime = performance.now();
        console.log(`[Performance] getMedicalRecords API: ${(endTime - startTime).toFixed(2)}ms`);
        
        // Cache the result
        requestCache.set(cacheKey, { data, timestamp: Date.now() });
        setTimeout(() => requestCache.delete(cacheKey), CACHE_TTL);
        
        return data;
      } catch (error) {
        // Don't log errors for invalid IDs
        if (error.response?.status !== 400 && error.response?.status !== 404) {
          console.error("Error fetching medical records", error);
        }
        return [];
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
      }
    })();
    
    // Store the pending request SYNCHRONOUSLY before async execution starts
    // This is the critical part - set it immediately so subsequent calls see it
    pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  } catch (error) {
    // Outer catch for validation errors
    return [];
  }
};

export const addMedicalRecord = async (record) => {
  try {
    const { data } = await API.post('/medical-records', record);
    // Clear cache for this pet's records
    if (record.petId) {
      requestCache.delete(`getMedicalRecords_${record.petId}`);
    }
    requestCache.clear(); // Clear all to be safe
    window.dispatchEvent(new Event('medicalRecordUpdate'));
    return data;
  } catch (error) {
    console.error("Error adding medical record", error);
    throw error;
  }
};

export const deleteMedicalRecord = async (id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            throw new Error('Authentication required');
        }
        await API.delete(`/medical-records/${id}`);
        // Clear all medical record caches (we don't know which pet)
        requestCache.clear();
        window.dispatchEvent(new Event('medicalRecordUpdate'));
        return true;
    } catch (error) {
        if (error.response?.status === 403) {
            const msg = error.response?.data?.message || 'You are not allowed to delete this record.';
            console.warn('[deleteMedicalRecord] Forbidden:', msg);
            throw error; // UI will show this message
        }
        if (error.response?.status === 401) {
            const code = error.response?.data?.code;
            if (code === 'NO_TOKEN' || code === 'TOKEN_INVALID' || code === 'AUTH_FAILED' || code === 'USER_NOT_FOUND') {
                window.location.href = '/login';
            }
        }
        console.error("Error deleting medical record", error);
        throw error;
    }
};

export const updateMedicalRecord = async (updatedRecord) => {
    try {
        const { id, ...recordData } = updatedRecord;
        if (!id) {
            throw new Error('Record ID is required for update');
        }
        const { data } = await API.put(`/medical-records/${id}`, recordData);
        // Clear cache
        if (recordData.petId) {
          requestCache.delete(`getMedicalRecords_${recordData.petId}`);
        }
        requestCache.clear();
        window.dispatchEvent(new Event('medicalRecordUpdate'));
        return data;
    } catch (error) {
        console.error("Error updating medical record", error);
        throw error;
    }
};
