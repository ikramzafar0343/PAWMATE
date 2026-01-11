import React, { useState, useEffect } from 'react';
import HistoryCard from './HistoryCard';
import { getDetections, deleteDetection } from '../../utils/aiDiagnosisStore';
import { getPetById, getPets } from '../../utils/petStore';
import { getPredictionHistory, deletePrediction } from '../../utils/predictionStore';

const HistoryList = ({ onNavigate, selectedPetId, pets = [] }) => {
  const [historyData, setHistoryData] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDelete = async (item) => {
    try {
        console.log('[handleDelete] Item to delete:', item);
        
        // Be defensive: some items may have prefixed `id` values like "prediction_<id>" / "detection_<id>"
        // Priority: predictionId/detectionId (direct) > id (may have prefix)
        let idToDelete = null;
        let deleteType = null;

        const looksLikeObjectId = (v) => {
          const str = String(v || '');
          return /^[a-fA-F0-9]{24}$/.test(str);
        };

        // Check if it's a prediction type
        if (item?.type === 'prediction') {
          // Try predictionId first (most reliable)
          if (item.predictionId) {
            const cleanId = String(item.predictionId).replace(/^prediction_/, '').trim();
            if (looksLikeObjectId(cleanId)) {
              idToDelete = cleanId;
              deleteType = 'prediction';
            }
          }
          
          // Fallback to id with prefix
          if (!idToDelete && item.id) {
            const cleanId = String(item.id).replace(/^prediction_/, '').trim();
            if (looksLikeObjectId(cleanId)) {
              idToDelete = cleanId;
              deleteType = 'prediction';
            }
          }
        } 
        // Check if it's a detection type
        else if (item?.type === 'detection') {
          // Try detectionId first (most reliable)
          if (item.detectionId) {
            const cleanId = String(item.detectionId).replace(/^detection_/, '').trim();
            if (looksLikeObjectId(cleanId)) {
              idToDelete = cleanId;
              deleteType = 'detection';
            }
          }
          
          // Fallback to id with prefix
          if (!idToDelete && item.id) {
            const cleanId = String(item.id).replace(/^detection_/, '').trim();
            if (looksLikeObjectId(cleanId)) {
              idToDelete = cleanId;
              deleteType = 'detection';
            }
          }
        }
        // Try to determine from IDs present
        else {
          // Check for predictionId
          if (item.predictionId) {
            const cleanId = String(item.predictionId).replace(/^prediction_/, '').trim();
            if (looksLikeObjectId(cleanId)) {
              idToDelete = cleanId;
              deleteType = 'prediction';
            }
          }
          // Check for detectionId
          if (!idToDelete && item.detectionId) {
            const cleanId = String(item.detectionId).replace(/^detection_/, '').trim();
            if (looksLikeObjectId(cleanId)) {
              idToDelete = cleanId;
              deleteType = 'detection';
            }
          }
          // Fallback to id
          if (!idToDelete && item.id) {
            const rawIdStr = String(item.id);
            if (rawIdStr.startsWith('prediction_')) {
              const cleanId = rawIdStr.replace(/^prediction_/, '').trim();
              if (looksLikeObjectId(cleanId)) {
                idToDelete = cleanId;
                deleteType = 'prediction';
              }
            } else if (rawIdStr.startsWith('detection_')) {
              const cleanId = rawIdStr.replace(/^detection_/, '').trim();
              if (looksLikeObjectId(cleanId)) {
                idToDelete = cleanId;
                deleteType = 'detection';
              }
            } else if (looksLikeObjectId(rawIdStr)) {
              // Try prediction first, then detection
              idToDelete = rawIdStr;
              deleteType = 'prediction'; // Default to prediction
            }
          }
        }

        if (!idToDelete || !deleteType) {
          console.error('[handleDelete] Could not extract valid ID:', { item, idToDelete, deleteType });
          alert('Cannot delete: Invalid item ID or type');
          return;
        }

        console.log(`[handleDelete] Deleting ${deleteType} with ID: ${idToDelete}`);

        // Optimistically remove from UI immediately for instant feedback
        setHistoryData(prev => {
          const filtered = prev.filter(h => {
            // Check all possible ID fields
            const itemId = h.predictionId || h.detectionId || h.id;
            const normalizedItemId = String(itemId).replace(/^(prediction_|detection_)/, '').trim();
            const normalizedIdToDelete = String(idToDelete).trim();
            return normalizedItemId !== normalizedIdToDelete;
          });
          console.log(`[handleDelete] Removed item from UI. Previous count: ${prev.length}, New count: ${filtered.length}`);
          return filtered;
        });

        // Delete based on type (try both if first fails with 404)
        let deleteSuccess = false;
        try {
          if (deleteType === 'prediction') {
            try {
              await deletePrediction(idToDelete);
              deleteSuccess = true;
              console.log(`[handleDelete] Prediction deleted successfully`);
            } catch (predError) {
              // If prediction delete fails with 404, try as detection (might be stored as medical record)
              if (predError.response?.status === 404 || predError.isIdempotentDelete) {
                console.log(`[handleDelete] Prediction not found (404), trying as detection...`);
                try {
                  await deleteDetection(idToDelete);
                  deleteSuccess = true;
                  console.log(`[handleDelete] Successfully deleted as detection`);
                } catch (detError) {
                  // Both failed with 404 - treat as success (already deleted)
                  if (detError.response?.status === 404 || detError.isIdempotentDelete) {
                    deleteSuccess = true;
                    console.log(`[handleDelete] Both prediction and detection not found - treating as already deleted`);
                  } else {
                    throw detError;
                  }
                }
              } else {
                throw predError;
              }
            }
          } else {
            try {
              await deleteDetection(idToDelete);
              deleteSuccess = true;
              console.log(`[handleDelete] Detection deleted successfully`);
            } catch (detError) {
              // If detection delete fails with 404, try as prediction
              if (detError.response?.status === 404 || detError.isIdempotentDelete) {
                console.log(`[handleDelete] Detection not found (404), trying as prediction...`);
                try {
                  await deletePrediction(idToDelete);
                  deleteSuccess = true;
                  console.log(`[handleDelete] Successfully deleted as prediction`);
                } catch (predError) {
                  // Both failed with 404 - treat as success (already deleted)
                  if (predError.response?.status === 404 || predError.isIdempotentDelete) {
                    deleteSuccess = true;
                    console.log(`[handleDelete] Both detection and prediction not found - treating as already deleted`);
                  } else {
                    throw predError;
                  }
                }
              } else {
                throw detError;
              }
            }
          }
        } catch (deleteError) {
          // If delete fails with non-404 error, restore the item and show error
          if (deleteError.response?.status !== 404 && !deleteError.isIdempotentDelete) {
            console.error(`[handleDelete] Delete failed with error, restoring item:`, deleteError);
            // Restore item by refreshing from backend
            setRefreshTrigger(prev => prev + 1);
            throw deleteError; // Re-throw to show error to user in catch block below
          }
          // For 404, treat as success - item was already deleted (idempotent delete)
          deleteSuccess = true;
          console.log(`[handleDelete] Record not found (404) - treating as success`);
        }
        
        // If we reach here, deletion was successful (including 404 cases)
        // Trigger refresh to ensure UI stays in sync with backend and update stats
        setRefreshTrigger(prev => prev + 1);
        // Dispatch event to update other components (stats, charts, etc.)
        window.dispatchEvent(new Event('medicalRecordUpdate'));
        window.dispatchEvent(new Event('diagnosisUpdate'));
        console.log(`[handleDelete] Delete completed successfully`);
    } catch (error) {
        // If 404, treat as already deleted - just refresh silently
        if (error.response?.status === 404) {
          console.log("Record already deleted or not found, refreshing list");
          setRefreshTrigger(prev => prev + 1);
          window.dispatchEvent(new Event('medicalRecordUpdate'));
          window.dispatchEvent(new Event('diagnosisUpdate'));
          return; // Don't show error for 404
        }
        console.error("Delete failed", error);
        alert("Failed to delete record: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Always start with empty arrays - no hardcoded data
        let allPredictions = [];
        let allDetections = [];
        const petsMap = new Map();
        
        if (selectedPetId) {
          // Single pet selected - fetch only that pet's data
          console.log(`[HistoryList] Fetching data for selected pet: ${selectedPetId}`);
          const [predictionsData, detections, pet] = await Promise.all([
            getPredictionHistory(selectedPetId, 1, 100).catch(() => {
              console.log('[HistoryList] Error fetching predictions, returning empty array');
              return { predictions: [] };
            }),
            getDetections(selectedPetId).catch(() => {
              console.log('[HistoryList] Error fetching detections, returning empty array');
              return [];
            }),
            getPetById(selectedPetId).catch(() => null)
          ]);
          // Ensure we always get arrays, never undefined or null
          allPredictions = Array.isArray(predictionsData?.predictions) ? predictionsData.predictions : [];
          allDetections = Array.isArray(detections) ? detections : [];
          
          // Filter to ensure we only have data for the selected pet
          allPredictions = allPredictions.filter(p => {
            const pPetId = p.petId?._id || p.petId?.id || p.petId;
            return String(pPetId) === String(selectedPetId);
          });
          allDetections = allDetections.filter(d => {
            const dPetId = d.petId?._id || d.petId?.id || d.petId;
            return String(dPetId) === String(selectedPetId);
          });
          
          console.log(`[HistoryList] Filtered results - Predictions: ${allPredictions.length}, Detections: ${allDetections.length}`);
          if (pet) petsMap.set(selectedPetId, pet);
        } else {
          // All pets selected - fetch data for all pets
          const petsList = pets.length > 0 ? pets : await getPets().catch(() => []);
          
          // Build pets map
          if (Array.isArray(petsList)) {
            for (const pet of petsList) {
              const petId = pet._id || pet.id;
              if (petId) petsMap.set(petId, pet);
            }
          }
          
          // Fetch data for all pets in parallel
          const promises = Array.from(petsMap.keys()).map(async (petId) => {
            try {
              const [predictionsData, detections] = await Promise.all([
                getPredictionHistory(petId, 1, 100).catch(() => {
                  console.log(`[HistoryList] Error fetching predictions for pet ${petId}, returning empty array`);
                  return { predictions: [] };
                }),
                getDetections(petId).catch(() => {
                  console.log(`[HistoryList] Error fetching detections for pet ${petId}, returning empty array`);
                  return [];
                })
              ]);
              return {
                petId,
                predictions: Array.isArray(predictionsData?.predictions) ? predictionsData.predictions : [],
                detections: Array.isArray(detections) ? detections : []
              };
            } catch (error) {
              console.error(`Error loading data for pet ${petId}:`, error);
              return { petId, predictions: [], detections: [] };
            }
          });
          
          const results = await Promise.all(promises);
          allPredictions = results.flatMap(r => (Array.isArray(r.predictions) ? r.predictions : []).map(p => ({ ...p, _petId: r.petId })));
          allDetections = results.flatMap(r => (Array.isArray(r.detections) ? r.detections : []).map(d => ({ ...d, petId: r.petId })));
        }

        // Filter detections to only include AI records (exclude vaccinations, general checkups, etc.)
        allDetections = allDetections.filter(d => {
            const isAI = (d.type === 'AI Diagnosis') || 
                         (d.title && d.title.toLowerCase().includes('ai detection')) ||
                         (d.details && d.details.diagnosisType);
            return isAI;
        });
        
        // Format predictions (new format)
        const formattedPredictions = allPredictions.map(p => {
          const date = new Date(p.createdAt || Date.now());
          const petId = p._petId || (p.petId?._id || p.petId?.id || p.petId) || selectedPetId;
          const pet = petsMap.get(petId) || p.petId || {};
          const petData = typeof pet === 'object' && pet !== null ? pet : {};
          
          // Get image URL
          let imageUrl = petData.image || petData.imageUrl || 'https://placehold.co/150x150/d97706/ffffff?text=Pet';
          if (p.imageUrl) {
            if (p.imageUrl.startsWith('http') || p.imageUrl.startsWith('data:')) {
              imageUrl = p.imageUrl;
            } else {
              const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
              imageUrl = p.imageUrl.startsWith('/') ? `${serverBaseUrl}${p.imageUrl}` : `${serverBaseUrl}/uploads/${p.imageUrl}`;
            }
          }
          
          // Ensure ID is a string (ObjectId can be object in some cases)
          const predictionIdStr = String(p._id || p.id || '');
          
          return {
            id: `prediction_${predictionIdStr}`, // Prefix to avoid ID conflicts
            predictionId: predictionIdStr, // Store as string for consistency
            title: p.disease || 'AI Detection',
            severity: p.confidence >= 90 ? 'Critical' : p.confidence >= 70 ? 'Moderate' : 'Low',
            petName: petData.name || pet?.name || 'Unknown Pet',
            petType: petData.breed || pet?.breed || 'Unknown Breed',
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            confidence: Math.round(p.confidence || 85),
            image: imageUrl,
            type: 'prediction',
            timestamp: date.getTime() // Store timestamp for deduplication
          };
        });
        
        // Format detections (old format)
        const formattedDetections = await Promise.all(
          allDetections.map(async (d) => {
            const detectionPetId = d.petId || selectedPetId;
            const petData = d.pet || petsMap.get(detectionPetId) || await getPetById(detectionPetId).catch(() => null) || {};
            // Fix: properly handle date and displayDate
            const dateObj = d.date ? new Date(d.date) : new Date(d.createdAt || Date.now());
            const timestamp = dateObj.getTime();
            
            const severityMap = {
              'Low': 'Low',
              'Moderate': 'Moderate',
              'High': 'Critical',
              'Critical': 'Critical'
            };
            
            // Extract data from details object if it exists
            const details = d.details || {};
            const risk = d.risk || details.risk || 'Moderate';
            const condition = d.condition || d.title || details.diagnosisType || 'Health Issue';
            const severityScore = d.severityScore || details.severityScore || 85;
            
            // Get image URL
            let imageUrl = petData?.image || petData?.imageUrl || 'https://placehold.co/150x150/d97706/ffffff?text=Pet';
            if (details.imageUrl) {
              if (details.imageUrl.startsWith('http') || details.imageUrl.startsWith('data:')) {
                imageUrl = details.imageUrl;
              } else {
                const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
                imageUrl = details.imageUrl.startsWith('/') ? `${serverBaseUrl}${details.imageUrl}` : `${serverBaseUrl}/uploads/${details.imageUrl}`;
              }
            }
            
            // Ensure ID is a string (ObjectId can be object in some cases)
            const detectionIdStr = String(d._id || d.id || '');
            
            return {
              id: `detection_${detectionIdStr}`, // Prefix to avoid ID conflicts
              detectionId: detectionIdStr, // Store as string for consistency
              title: condition,
              severity: severityMap[risk] || 'Moderate',
              petName: petData?.name || pet?.name || 'Unknown Pet',
              petType: petData?.breed || pet?.breed || 'Unknown Breed',
              date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              confidence: parseInt(severityScore) || 85,
              image: imageUrl,
              type: 'detection',
              timestamp: timestamp // Store high-precision timestamp for deduplication
            };
          })
        );
        
        // Deduplicate: Remove duplicates based on timestamp and condition
        // Strategy: Prefer predictions over detections, and remove detections that match predictions
        // Aggressive Deduplication: If a detection is "AI Detection" type and we have a prediction on the same DATE, assume it's a duplicate.
        
        // Filter detections: only keep those that don't match a prediction
        const uniqueDetections = formattedDetections.filter(d => {
          const dTitle = d.title.replace(/^AI Detection:\s*/i, '').toLowerCase().trim();
          // Check if this is an AI detection record
          const isAIRecord = d.title.toLowerCase().includes('ai detection') || (d.type && d.type === 'AI Diagnosis');
          
          // Check if any prediction matches
          const isDuplicate = formattedPredictions.some(p => {
            const pTitle = p.title.replace(/^AI Detection:\s*/i, '').toLowerCase().trim();
            
            // 1. Strict timestamp match (< 30s)
            const timeDiff = Math.abs(d.timestamp - p.timestamp);
            if (timeDiff < 30000) return true;

            // 2. Date Match (Same Day + Same Condition)
            // If it's an AI record, we are more aggressive with matching
            const pDateStr = new Date(p.timestamp).toISOString().split('T')[0];
            const dDateStr = new Date(d.timestamp).toISOString().split('T')[0];
            
            if (pDateStr === dDateStr && pTitle === dTitle) {
                return true;
            }
            
            return false;
          });
          
          return !isDuplicate;
        });
        
        // Combine unique predictions and filtered detections
        const deduplicated = [...formattedPredictions, ...uniqueDetections];
        
        // Sort by date (newest first)
        deduplicated.sort((a, b) => b.timestamp - a.timestamp);
        
        // Always set to array - never undefined or null
        setHistoryData(Array.isArray(deduplicated) ? deduplicated : []);
      } catch (error) {
        console.error("Error loading detection history", error);
        // Always set to empty array on error - no fallback data
        setHistoryData([]);
      }
    };
    
    loadHistory();
    
    // Reload when detections are updated or pet changes
    const handleUpdate = () => loadHistory();
    window.addEventListener('diagnosisUpdate', handleUpdate);
    window.addEventListener('petUpdate', handleUpdate);
    return () => {
      window.removeEventListener('diagnosisUpdate', handleUpdate);
      window.removeEventListener('petUpdate', handleUpdate);
    };
  }, [selectedPetId, pets, refreshTrigger]);

  return (
    <div className="space-y-4">
      {historyData.length > 0 ? (
        historyData.map((item) => (
          <HistoryCard 
            key={item.id} 
            data={item} 
            onNavigate={onNavigate} 
            onDelete={handleDelete}
          />
        ))
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          <p>No detection history available yet.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
