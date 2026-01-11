import API from '../api/client';

// Request deduplication cache
const requestCache = new Map();
const pendingRequests = new Map(); // Track in-flight requests
const CACHE_TTL = 2000; // 2 second cache

export const getPets = async () => {
  const cacheKey = 'getPets';
  const cached = requestCache.get(cacheKey);
  const now = Date.now();
  
  // Return cached result if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  // If a request is already in flight, wait for it instead of making a new one
  // Use synchronous check and set to prevent race conditions
  if (pendingRequests.has(cacheKey)) {
    const existingPromise = pendingRequests.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }
  }
  
  // Create the request promise and set it immediately to prevent race conditions
  const requestPromise = (async () => {
    try {
      const startTime = performance.now();
      const { data } = await API.get('/pets');
      const endTime = performance.now();
      console.log(`[Performance] getPets API: ${(endTime - startTime).toFixed(2)}ms`);
      
      // Cache the result
      requestCache.set(cacheKey, { data, timestamp: Date.now() });
      
      // Clear cache after TTL
      setTimeout(() => requestCache.delete(cacheKey), CACHE_TTL);
      
      return data;
    } catch (error) {
      // If 401, the interceptor will handle redirect
      if (error.response?.status === 401) {
        return [];
      }
      console.error("Error fetching pets", error);
      return [];
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store the pending request IMMEDIATELY to prevent race conditions
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
};

export const addPet = async (pet) => {
  try {
    const { data } = await API.post('/pets', pet);
    return data;
  } catch (error) {
    console.error("Error adding pet", error);
    throw error;
  }
};

export const updatePet = async (updatedPet) => {
  try {
    const { data } = await API.put(`/pets/${updatedPet._id || updatedPet.id}`, updatedPet);
    // Clear cache on update
    requestCache.delete('getPets');
    window.dispatchEvent(new Event('petUpdate'));
    return data;
  } catch (error) {
    console.error("Error updating pet", error);
    throw error;
  }
};

export const deletePet = async (id) => {
  try {
    const { data } = await API.delete(`/pets/${id}`);
    // Clear cache on update
    requestCache.delete('getPets');
    window.dispatchEvent(new Event('petUpdate'));
    return data;
  } catch (error) {
    console.error("Error deleting pet", error);
    throw error;
  }
};

export const getPetById = async (id) => {
  try {
    // Normalize ID to string
    const idStr = id ? String(id).trim() : '';
    
    // Validate ID - MongoDB ObjectIds are 24 hex characters
    if (!idStr || idStr.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(idStr)) {
      // Return null silently for invalid IDs - no need to log
      return null;
    }
    
    const { data } = await API.get(`/pets/${idStr}`);
    return data;
  } catch (error) {
    // Silently handle 404/400/401/403 - pet doesn't exist or user doesn't have access
    // These are expected scenarios, not errors
    if (error.response?.status === 404 || 
        error.response?.status === 400 || 
        error.response?.status === 401 || 
        error.response?.status === 403) {
      // Return null silently - don't log these as errors
      return null;
    }
    // Only log unexpected errors (network issues, 500 errors, etc.)
    if (error.response?.status >= 500 || !error.response) {
      console.error("Error fetching pet by ID:", error.response?.status || error.message);
    }
    return null;
  }
};

export const getBreedingMatches = async () => {
  try {
    const { data } = await API.get('/pets/matches');
    return data;
  } catch (error) {
    console.error("Error fetching breeding matches", error);
    return [];
  }
};
