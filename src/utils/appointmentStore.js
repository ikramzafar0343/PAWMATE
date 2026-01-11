import API from '../api/client';

// Request deduplication cache
const requestCache = new Map();
const pendingRequests = new Map(); // Track in-flight requests
const CACHE_TTL = 2000; // 2 second cache for appointments

// Helper to get all appointments
export const getAppointments = async (filters = {}) => {
  const cacheKey = `getAppointments_${JSON.stringify(filters)}`;
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
      const { data } = await API.get('/appointments', { params: filters });
      const endTime = performance.now();
      console.log(`[Performance] getAppointments API: ${(endTime - startTime).toFixed(2)}ms`);
      
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
      console.error("Error fetching appointments", error);
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

export const getRevenue = async (date = null) => {
  try {
    const { data } = await API.get('/appointments/revenue', { params: date ? { date } : {} });
    return data;
  } catch (error) {
    console.error("Error fetching revenue", error);
    return { date: date || new Date().toISOString().split('T')[0], count: 0, totalRevenue: 0, breakdown: {} };
  }
};

// Add a new appointment
export const addAppointment = async (appointment) => {
  try {
    const { data } = await API.post('/appointments', appointment);
    // Clear cache on update
    requestCache.clear();
    window.dispatchEvent(new Event('appointmentUpdate'));
    return data;
  } catch (error) {
    console.error("Error adding appointment", error);
    throw error;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (id, status) => {
  try {
    const { data } = await API.put(`/appointments/${id}/status`, { status });
    // Clear cache on update
    requestCache.clear();
    window.dispatchEvent(new Event('appointmentUpdate'));
    return data;
  } catch (error) {
    console.error("Error updating appointment status", error);
    throw error;
  }
};

// Delete appointment
export const deleteAppointment = async (id) => {
  try {
    const { data } = await API.delete(`/appointments/${id}`);
    // Clear cache on update
    requestCache.clear();
    window.dispatchEvent(new Event('appointmentUpdate'));
    return data;
  } catch (error) {
    // If 404, it's already deleted, so consider it success
    if (error.response && error.response.status === 404) {
      console.warn("Appointment already deleted (404), treating as success");
      requestCache.clear();
      window.dispatchEvent(new Event('appointmentUpdate'));
      return { id };
    }
    console.error("Error deleting appointment", error);
    throw error;
  }
};

// Get booked slots for a specific date and vet
// Note: This logic should ideally be backend side, but for now we can fetch all and filter client side
// or create a specific API endpoint. For simplicity, we fetch all and filter here, but 
// in a real large app, you'd want `GET /api/appointments?date=...&vetId=...`
export const getBookedSlots = async (dateString, vetId) => {
  try {
      if (!dateString || !vetId) {
        return [];
      }
      
      // Convert dateString to match API format (YYYY-MM-DD)
      let targetDateStr = dateString;
      try {
        // If dateString is in format "Jan 5, 2026", convert to YYYY-MM-DD
        const dateObj = new Date(dateString);
        if (!isNaN(dateObj.getTime())) {
          targetDateStr = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        // If conversion fails, use original
      }
      
      const appointments = await getAppointments();
      
      // Ensure appointments is an array
      if (!Array.isArray(appointments)) {
        return [];
      }
      
      return appointments
        .filter(appt => {
            if (!appt.date) return false;
            
            // Handle both populated and non-populated vetId
            const apptVetId = appt.vetId?._id || appt.vetId || appt.vetId?.id;
            const targetVetId = vetId?._id || vetId || vetId?.id;
            
            if (apptVetId?.toString() !== targetVetId?.toString()) {
              return false;
            }
            
            // Match date - try multiple formats
            let apptDateStr = appt.date;
            try {
              const apptDate = new Date(appt.date);
              if (!isNaN(apptDate.getTime())) {
                apptDateStr = apptDate.toISOString().split('T')[0];
              }
            } catch (e) {
              // Use original if conversion fails
            }
            
            return apptDateStr === targetDateStr && appt.status !== 'Cancelled' && appt.status !== 'cancelled';
        })
        .map(appt => appt.time)
        .filter(Boolean); // Remove any undefined/null times
  } catch (error) {
      console.error("Error fetching booked slots", error);
      return [];
  }
};

// Check if a specific slot is booked
export const isSlotBooked = async (dateString, time, vetId) => {
  const bookedSlots = await getBookedSlots(dateString, vetId);
  return bookedSlots.includes(time);
};

// Standard time slots definition
export const ALL_TIME_SLOTS = [
  '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM',
  '02:00 AM', '02:30 AM', '03:00 AM', '03:30 AM',
  '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

// Check if a date is fully booked
export const isDateFullyBooked = async (dateString, vetId) => {
  const bookedSlots = await getBookedSlots(dateString, vetId);
  return Array.isArray(bookedSlots) && bookedSlots.length >= ALL_TIME_SLOTS.length;
};
