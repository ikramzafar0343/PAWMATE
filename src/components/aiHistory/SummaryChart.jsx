import React, { useState, useEffect } from 'react';
import { getDetections } from '../../utils/aiDiagnosisStore';
import { getPredictionHistory } from '../../utils/predictionStore';
import { getPets } from '../../utils/petStore';

const SummaryChart = ({ selectedPetId, pets = [] }) => {
  const [categories, setCategories] = useState({
    skinConditions: 0,
    infections: 0,
    dental: 0,
    other: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        
        let allPredictions = [];
        let allDetections = [];
        
        if (selectedPetId) {
          // Single pet selected - fetch only that pet's data
          console.log(`[SummaryChart] Fetching data for selected pet: ${selectedPetId}`);
          const [predictionsData, detections] = await Promise.all([
            getPredictionHistory(selectedPetId, 1, 100).catch(() => {
              console.log('[SummaryChart] Error fetching predictions, returning empty array');
              return { predictions: [] };
            }),
            getDetections(selectedPetId).catch(() => {
              console.log('[SummaryChart] Error fetching detections, returning empty array');
              return [];
            })
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
          
          console.log(`[SummaryChart] Filtered results - Predictions: ${allPredictions.length}, Detections: ${allDetections.length}`);
        } else {
          // All pets selected - fetch data for all pets
          const petsList = pets.length > 0 ? pets : await getPets().catch(() => []);
          
          const promises = (Array.isArray(petsList) ? petsList : []).map(async (pet) => {
            const petId = pet._id || pet.id;
            if (!petId) return { predictions: [], detections: [] };
            
            try {
              const [predictionsData, detections] = await Promise.all([
                getPredictionHistory(petId, 1, 100).catch(() => {
                  console.log(`[SummaryChart] Error fetching predictions for pet ${petId}, returning empty array`);
                  return { predictions: [] };
                }),
                getDetections(petId).catch(() => {
                  console.log(`[SummaryChart] Error fetching detections for pet ${petId}, returning empty array`);
                  return [];
                })
              ]);
              return {
                predictions: Array.isArray(predictionsData?.predictions) ? predictionsData.predictions : [],
                detections: Array.isArray(detections) ? detections : []
              };
            } catch (error) {
              console.error(`Error loading data for pet ${petId}:`, error);
              return { predictions: [], detections: [] };
            }
          });
          
          const results = await Promise.all(promises);
          allPredictions = results.flatMap(r => Array.isArray(r.predictions) ? r.predictions : []);
          allDetections = results.flatMap(r => Array.isArray(r.detections) ? r.detections : []);
        }

        // Filter detections to only include AI records (exclude vaccinations, general checkups, etc.)
        allDetections = allDetections.filter(d => {
            const isAI = (d.type === 'AI Diagnosis') || 
                         (d.title && d.title.toLowerCase().includes('ai detection')) ||
                         (d.details && d.details.diagnosisType);
            return isAI;
        });
        
        // Deduplicate: Remove detections that match predictions
        // Strategy: Prefer predictions over detections, and remove detections that match predictions
        const uniqueDetections = allDetections.filter(d => {
           // Use createdAt if available for better precision
           const dTime = d.createdAt ? new Date(d.createdAt).getTime() : new Date(d.date).getTime();
           const dCondition = (d.condition || d.title || d.details?.diagnosisType || '').replace(/^AI Detection:\s*/i, '').toLowerCase().trim();
           
           // Check if any prediction matches
           return !allPredictions.some(p => {
             const pTime = new Date(p.createdAt).getTime();
             const pCondition = (p.disease || '').toLowerCase().trim();
             
             // 1. Strict timestamp match (< 30s)
             const timeDiff = Math.abs(dTime - pTime);
             if (timeDiff < 30000) return true;
             
             // 2. Loose date match (fallback)
             const pDateStr = new Date(pTime).toISOString().split('T')[0];
             // Fix: dTime comes from timestamp calculation above, which might be UTC midnight for date-only records
             const dDateStr = new Date(dTime).toISOString().split('T')[0];
             
             if (pDateStr === dDateStr && pCondition === dCondition) {
                 return true;
             }
             
             return false;
           });
        });

        // Combine predictions and detections
        const allData = [
          ...allPredictions.map(p => ({
            condition: p.disease,
            title: p.disease,
            details: { diagnosisType: 'AI Detection' }
          })),
          ...uniqueDetections
        ];

        // Categorize detections
        const categoryCounts = {
          skinConditions: 0,
          infections: 0,
          dental: 0,
          other: 0
        };

        allData.forEach(d => {
          const condition = (d.condition || d.title || '').toLowerCase();
          const details = d.details || {};
          const diagnosisType = (details.diagnosisType || '').toLowerCase();
          const combined = `${condition} ${diagnosisType}`;

          if (combined.includes('skin') || combined.includes('dermatitis') || 
              combined.includes('rash') || combined.includes('allergy') ||
              combined.includes('mange') || combined.includes('flea') || 
              combined.includes('ringworm') || combined.includes('hot spot') ||
              combined.includes('eczema') || combined.includes('pyoderma')) {
            categoryCounts.skinConditions++;
          } else if (combined.includes('infection') || combined.includes('bacterial') || 
                     combined.includes('viral') || combined.includes('fungal')) {
            categoryCounts.infections++;
          } else if (combined.includes('dental') || combined.includes('tooth') || 
                     combined.includes('gum') || combined.includes('oral')) {
            categoryCounts.dental++;
          } else {
            categoryCounts.other++;
          }
        });

        setCategories(categoryCounts);
      } catch (error) {
        console.error("Error loading detection summary", error);
        setCategories({ skinConditions: 0, infections: 0, dental: 0, other: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
    
    // Reload when detections are updated or pet changes
    const handleUpdate = () => loadSummary();
    window.addEventListener('diagnosisUpdate', handleUpdate);
    window.addEventListener('petUpdate', handleUpdate);
    return () => {
      window.removeEventListener('diagnosisUpdate', handleUpdate);
      window.removeEventListener('petUpdate', handleUpdate);
    };
  }, [selectedPetId, pets]);

  // Calculate percentages
  const total = categories.skinConditions + categories.infections + categories.dental + categories.other;
  const percentages = {
    skinConditions: total > 0 ? Math.round((categories.skinConditions / total) * 100) : 0,
    infections: total > 0 ? Math.round((categories.infections / total) * 100) : 0,
    dental: total > 0 ? Math.round((categories.dental / total) * 100) : 0,
    other: total > 0 ? Math.round((categories.other / total) * 100) : 0
  };

  // Calculate conic gradient positions
  const skinEnd = percentages.skinConditions;
  const infectionsEnd = skinEnd + percentages.infections;
  const dentalEnd = infectionsEnd + percentages.dental;
  const otherEnd = dentalEnd + percentages.other;

  const gradientStyle = total > 0
    ? {
        background: `conic-gradient(
          #3b82f6 0% ${skinEnd}%,
          #10b981 ${skinEnd}% ${infectionsEnd}%,
          #f59e0b ${infectionsEnd}% ${dentalEnd}%,
          #9ca3af ${dentalEnd}% 100%
        )`
      }
    : {
        background: '#e5e7eb' // Gray for no data
      };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h3 className="font-bold text-gray-900 mb-6">Detection Summary</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center py-8">
          <div className="relative w-40 h-40 mb-8">
            <div className="w-full h-full rounded-full bg-gray-200"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-500 text-sm">No detections yet</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Donut Chart */}
          <div className="relative w-40 h-40 mb-8">
            <div 
              className="w-full h-full rounded-full"
              style={gradientStyle}
            ></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white rounded-full"></div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">Skin Conditions</span>
              </div>
              <span className="font-bold text-gray-900">{percentages.skinConditions}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-gray-600">Infections</span>
              </div>
              <span className="font-bold text-gray-900">{percentages.infections}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-gray-600">Dental</span>
              </div>
              <span className="font-bold text-gray-900">{percentages.dental}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span className="text-gray-600">Other</span>
              </div>
              <span className="font-bold text-gray-900">{percentages.other}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryChart;
