import API from '../api/client';

/**
 * Prediction Store - Handles AI disease detection API calls
 */

/**
 * Predict disease from uploaded image
 * @param {File} imageFile - Image file to analyze
 * @param {string} petId - Pet ID for the prediction
 * @returns {Promise<Object>} Prediction result with disease, confidence, recommendation
 */
export const predictDisease = async (imageFile, petId) => {
  try {
    if (!imageFile) {
      throw new Error('Image file is required');
    }
    
    if (!petId) {
      throw new Error('Pet ID is required');
    }
    
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('petId', petId);
    
    // Make API call
    const { data } = await API.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Dispatch events for real-time updates
    console.log('[predictDisease] Prediction completed, dispatching update events');
    window.dispatchEvent(new Event('medicalRecordUpdate'));
    window.dispatchEvent(new Event('diagnosisUpdate'));
    window.dispatchEvent(new Event('appointmentUpdate'));
    
    return data;
  } catch (error) {
    console.error('Error predicting disease:', error);
    throw error;
  }
};

/**
 * Get prediction history
 * @param {string} petId - Optional pet ID to filter by
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @returns {Promise<Object>} Predictions with pagination info
 */
export const getPredictionHistory = async (petId = null, page = 1, limit = 20) => {
  try {
    const params = { page, limit };
    if (petId) {
      // Ensure petId is a valid string and not null/undefined
      const petIdStr = String(petId).trim();
      if (petIdStr && petIdStr !== 'null' && petIdStr !== 'undefined') {
        params.petId = petIdStr;
        console.log(`[getPredictionHistory] Fetching predictions for petId: ${petIdStr}`);
      } else {
        console.warn(`[getPredictionHistory] Invalid petId provided: ${petId}, fetching all predictions`);
      }
    } else {
      console.log(`[getPredictionHistory] Fetching all predictions (no petId filter)`);
    }
    
    const { data } = await API.get('/predictions', { params });
    console.log(`[getPredictionHistory] Received ${data?.predictions?.length || 0} predictions`);
    
    // Log the actual URL that was called for debugging
    const url = `/predictions?${new URLSearchParams(params).toString()}`;
    console.log(`[getPredictionHistory] API URL: ${url}`);
    
    return data;
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    throw error;
  }
};

/**
 * Get single prediction by ID
 * @param {string} predictionId - Prediction ID
 * @returns {Promise<Object>} Prediction details
 */
export const getPredictionById = async (predictionId) => {
  try {
    const { data } = await API.get(`/predictions/${predictionId}`);
    return data;
  } catch (error) {
    console.error('Error fetching prediction:', error);
    throw error;
  }
};

/**
 * Get prediction statistics
 * @param {string} petId - Optional pet ID to filter by
 * @returns {Promise<Object>} Statistics object
 */
export const getPredictionStats = async (petId = null) => {
  try {
    const params = {};
    if (petId) {
      const petIdStr = String(petId).trim();
      if (petIdStr && petIdStr !== 'null' && petIdStr !== 'undefined') {
        params.petId = petIdStr;
      }
    }
    
    const { data } = await API.get('/predictions/stats', { params });
    return data;
  } catch (error) {
    console.error('Error fetching prediction stats:', error);
    // Return default empty stats on error
    return {
      totalScans: 0,
      scansThisMonth: 0,
      avgConfidence: 0
    };
  }
};

/**
 * Delete prediction by ID
 * @param {string} predictionId - Prediction ID
 * @returns {Promise<Object>} Deleted prediction result
 */
export const deletePrediction = async (predictionId) => {
  try {
    // Strip any prefix if present
    let cleanId = String(predictionId).replace(/^prediction_/, '').trim();
    
    // Remove any whitespace or invalid characters
    cleanId = cleanId.replace(/[^a-fA-F0-9]/g, '');
    
    if (!cleanId || cleanId === 'null' || cleanId === 'undefined' || cleanId.length !== 24) {
      console.error('[deletePrediction] Invalid prediction ID format:', { 
        original: predictionId, 
        cleaned: cleanId,
        length: cleanId?.length 
      });
      throw new Error(`Invalid prediction ID: ${predictionId}`);
    }
    
    console.log(`[deletePrediction] Attempting to delete prediction with ID: ${cleanId}`);
    
    const { data } = await API.delete(`/predictions/${cleanId}`);
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new Event('medicalRecordUpdate'));
    window.dispatchEvent(new Event('diagnosisUpdate'));
    
    return data;
  } catch (error) {
    // If 404, treat as already deleted (idempotent delete)
    if (error.response?.status === 404 || error.isIdempotentDelete) {
      // Silently handle 404 - prediction already deleted or doesn't exist
      // Don't log as error since this is expected behavior
      // Still dispatch events to refresh the UI
      window.dispatchEvent(new Event('medicalRecordUpdate'));
      window.dispatchEvent(new Event('diagnosisUpdate'));
      // Return success so UI doesn't show error
      return { id: predictionId, message: 'Prediction already deleted or not found' };
    }
    // Only log actual errors (not 404s)
    console.error('Error deleting prediction:', error);
    throw error;
  }
};

/**
 * Analyze symptoms text and predict disease
 * @param {string} symptoms - Symptom description text
 * @param {string} petId - Pet ID for the analysis
 * @param {string} duration - Duration of symptoms (optional)
 * @returns {Promise<Object>} Analysis result with disease, confidence, recommendation
 */
export const analyzeSymptoms = async (symptoms, petId, duration = '') => {
  try {
    if (!symptoms || !symptoms.trim()) {
      throw new Error('Symptom description is required');
    }
    
    if (!petId) {
      throw new Error('Pet ID is required');
    }
    
    // Make API call
    const { data } = await API.post('/predict/symptoms', {
      symptoms: symptoms.trim(),
      petId: petId,
      duration: duration
    });
    
    // Dispatch events for real-time updates
    console.log('[analyzeSymptoms] Analysis completed, dispatching update events');
    window.dispatchEvent(new Event('medicalRecordUpdate'));
    window.dispatchEvent(new Event('diagnosisUpdate'));
    window.dispatchEvent(new Event('appointmentUpdate'));
    
    return data;
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    throw error;
  }
};

