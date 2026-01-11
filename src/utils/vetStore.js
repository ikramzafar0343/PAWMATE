// src/utils/vetStore.js

import API from '../api/client';

// Cache for vets list to avoid repeated API calls
const vetsCache = {
  data: null,
  timestamp: null,
  TTL: 60000 // 1 minute cache
};

export const getVets = async (forceRefresh = false) => {
  try {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && vetsCache.data && vetsCache.timestamp && (now - vetsCache.timestamp) < vetsCache.TTL) {
      return vetsCache.data;
    }
    
    const { data } = await API.get('/users/vets');
    
    // Update cache
    vetsCache.data = data;
    vetsCache.timestamp = now;
    
    return data;
  } catch (error) {
    console.error("Error fetching vets", error);
    // Return cached data if available, even if expired
    if (vetsCache.data) {
      return vetsCache.data;
    }
    return [];
  }
};

// Request deduplication for getVetById
const pendingVetRequests = new Map();

export const getVetById = async (id, forceRefresh = false) => {
  if (!id) return null;
  
  // Normalize ID to string
  const vetId = String(id).trim();
  
  // Check if request is already in flight (only if not forcing refresh)
  if (!forceRefresh && pendingVetRequests.has(vetId)) {
    return pendingVetRequests.get(vetId);
  }
  
  // Create request promise
  const requestPromise = (async () => {
    try {
      // Always use the vets list (public endpoint, no auth required)
      // This is more reliable than trying /users/:id which requires admin auth
      const vets = await getVets(forceRefresh);
      const vet = vets.find(v => {
        const vId = String(v._id || v.id || '').trim();
        return vId === vetId || vId === String(vetId);
      });
      
      return vet || null;
    } catch (error) {
      // Don't log 401 errors - they're expected if user is not admin
      if (error.response?.status !== 401) {
        console.error("Error fetching vet", error);
      }
      return null;
    } finally {
      // Remove from pending requests
      pendingVetRequests.delete(vetId);
    }
  })();
  
  // Store pending request
  pendingVetRequests.set(vetId, requestPromise);
  
  return requestPromise;
};

