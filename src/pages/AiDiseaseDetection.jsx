import React, { useState, useEffect } from 'react';
import ImageUploadTab from '../components/aiDiseaseDetection/ImageUploadTab';
import SymptomCheckTab from '../components/aiDiseaseDetection/SymptomCheckTab';
import AnalysisSidebar from '../components/aiDiseaseDetection/AnalysisSidebar';
import { getDetections } from '../utils/aiDiagnosisStore';
import { getPets, getPetById } from '../utils/petStore';
import { getPredictionHistory } from '../utils/predictionStore';

const AiDiseaseDetection = ({ onNavigate, routeParams }) => {
  const [activeTab, setActiveTab] = useState('image');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previousScans, setPreviousScans] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Load pets first - removed loading state to avoid blocking
  useEffect(() => {
    let mounted = true;
    const loadPets = async () => {
      try {
        const data = await getPets();
        if (!mounted) return;
        setPets(data);
        
        // Priority: routeParams > localStorage > first pet
        let petIdToSet = null;
        if (routeParams?.pet) {
          petIdToSet = routeParams.pet.id || routeParams.pet._id;
        } else {
          // Check localStorage for selected pet
          const storedPetId = localStorage.getItem('pawmate_selected_pet_id');
          if (storedPetId && data.some(p => (p._id || p.id) === storedPetId)) {
            petIdToSet = storedPetId;
          } else if (data.length > 0) {
            petIdToSet = data[0]._id || data[0].id;
          }
        }
        
        if (petIdToSet) {
          setSelectedPetId(petIdToSet);
          localStorage.setItem('pawmate_selected_pet_id', petIdToSet);
        }
      } catch (error) {
        console.error("Error loading pets", error);
      }
    };
    loadPets();
    
    // Listen for pet selection changes from other components
    const handlePetUpdate = () => {
      const newPetId = localStorage.getItem('pawmate_selected_pet_id');
      if (newPetId && newPetId !== selectedPetId) {
        setSelectedPetId(newPetId);
      }
    };
    
    window.addEventListener('petUpdate', handlePetUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('petUpdate', handlePetUpdate);
    };
  }, [routeParams?.pet]);

  // Load scans when pet changes or component mounts
  useEffect(() => {
    let mounted = true;
    const loadScans = async () => {
      if (!selectedPetId || !mounted) {
        setPreviousScans([]);
        return;
      }
      
      try {
        console.log(`[AiDiseaseDetection] Loading scans for selected pet: ${selectedPetId}`);
        
        // Add a small delay to ensure backend has saved the prediction
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch both new predictions and old medical records
        const [predictionsData, detections] = await Promise.all([
          getPredictionHistory(selectedPetId, 1, 10).catch(() => {
            console.log('[AiDiseaseDetection] Error fetching predictions, returning empty array');
            return { predictions: [] };
          }),
          getDetections(selectedPetId).catch(() => {
            console.log('[AiDiseaseDetection] Error fetching detections, returning empty array');
            return [];
          })
        ]);
        
        if (!mounted) return;
        
        // Filter predictions to ensure they're for the selected pet
        let allPredictions = Array.isArray(predictionsData?.predictions) ? predictionsData.predictions : [];
        allPredictions = allPredictions.filter(p => {
          const pPetId = p.petId?._id || p.petId?.id || p.petId;
          return String(pPetId) === String(selectedPetId);
        });
        
        // Filter detections to only include AI records (exclude vaccinations, general checkups, etc.)
        let allDetections = Array.isArray(detections) ? detections : [];
        allDetections = allDetections.filter(d => {
          const isAI = (d.type === 'AI Diagnosis') || 
                       (d.title && d.title.toLowerCase().includes('ai detection')) ||
                       (d.details && d.details.diagnosisType);
          // Also ensure it's for the selected pet
          const dPetId = d.petId?._id || d.petId?.id || d.petId;
          return isAI && String(dPetId) === String(selectedPetId);
        });
        
        console.log(`[AiDiseaseDetection] Filtered results - Predictions: ${allPredictions.length}, Detections: ${allDetections.length}`);
        
        // Get the pet info for fallback images and names
        const pet = await getPetById(selectedPetId).catch(() => null);
        const defaultPetImage = pet?.image || pet?.imageUrl || 'https://placehold.co/100x100/d97706/ffffff?text=Pet';
        const defaultPetName = pet?.name || 'Unknown Pet';
        
        // Format predictions (new format) - pet data is already populated from API
        const formattedPredictions = allPredictions.map(p => {
          const date = new Date(p.createdAt || Date.now());
          // Use populated pet data or fallback to default
          const petData = p.petId || {};
          const petImage = petData.image || petData.imageUrl || defaultPetImage;
          const petName = petData.name || defaultPetName;
          
          // Use prediction image if available, otherwise use pet image
          let scanImage = petImage;
          if (p.imageUrl) {
            if (p.imageUrl.startsWith('http') || p.imageUrl.startsWith('data:')) {
              scanImage = p.imageUrl;
            } else if (p.imageUrl.startsWith('/')) {
              // Relative path - prepend server base URL (not /api)
              const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
              scanImage = `${serverBaseUrl}${p.imageUrl}`;
            } else {
              // Just filename - construct full path
              const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
              scanImage = `${serverBaseUrl}/uploads/${p.imageUrl}`;
            }
          } else if (petImage && !petImage.startsWith('http') && !petImage.startsWith('data:')) {
            // Pet image might also need base URL
            const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
            scanImage = petImage.startsWith('/') ? `${serverBaseUrl}${petImage}` : `${serverBaseUrl}/${petImage}`;
          }
          
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: date.getTime(), // Store timestamp for sorting
            condition: p.disease || 'AI Detection',
            confidence: `${Math.round(p.confidence || 85)}% confidence`,
            img: scanImage,
            petName: petName,
            id: p._id || p.id,
            type: 'prediction'
          };
        });
        
        // Format detections (old format from medical records)
        const formattedDetections = allDetections.map(d => {
          const date = new Date(d.date || d.createdAt || Date.now());
          const condition = d.condition || d.title || 'AI Diagnosis';
          const confidence = d.details?.score || d.severityScore || 85;
          
          // Try to get image from details or use pet image
          let scanImage = defaultPetImage;
          if (d.details?.imageUrl) {
            const imgUrl = d.details.imageUrl;
            if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) {
              scanImage = imgUrl;
            } else if (imgUrl.startsWith('/')) {
              const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
              scanImage = `${serverBaseUrl}${imgUrl}`;
            } else {
              const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
              scanImage = `${serverBaseUrl}/uploads/${imgUrl}`;
            }
          } else if (defaultPetImage && !defaultPetImage.startsWith('http') && !defaultPetImage.startsWith('data:')) {
            const serverBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
            scanImage = defaultPetImage.startsWith('/') ? `${serverBaseUrl}${defaultPetImage}` : `${serverBaseUrl}/${defaultPetImage}`;
          }
          
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: date.getTime(), // Store timestamp for sorting
            condition: condition,
            confidence: `${Math.round(confidence)}% confidence`,
            img: scanImage,
            petName: defaultPetName,
            id: d._id || d.id,
            type: 'detection'
          };
        });
        
        // Deduplicate: Remove detections that match predictions (same as history page logic)
        const uniqueDetections = formattedDetections.filter(d => {
          const dTitle = d.condition.replace(/^AI Detection:\s*/i, '').toLowerCase().trim();
          const dTimestamp = d.timestamp;
          
          // Check if any prediction matches
          return !formattedPredictions.some(p => {
            const pTitle = p.condition.replace(/^AI Detection:\s*/i, '').toLowerCase().trim();
            const pTimestamp = p.timestamp;
            
            // Match by same date and same condition (within 30 seconds or same day)
            const timeDiff = Math.abs(dTimestamp - pTimestamp);
            if (timeDiff < 30000 || (timeDiff < 86400000 && pTitle === dTitle)) { // Within 30s or same day with same condition
              return true;
            }
            return false;
          });
        });
        
        // Merge and sort by timestamp (newest first), limit to 3
        const allScans = [...formattedPredictions, ...uniqueDetections]
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 3);
        
        console.log(`[AiDiseaseDetection] Setting ${allScans.length} previous scans for pet ${selectedPetId}`);
        if (mounted) setPreviousScans(allScans);
      } catch (error) {
        console.error("Error loading scans", error);
        if (mounted) setPreviousScans([]);
      }
    };
    loadScans();
    
    // Listen for updates when new scans are created
    const handleUpdate = () => {
      console.log('[AiDiseaseDetection] Update event received, refreshing scans');
      if (selectedPetId) {
        // Add a small delay to ensure backend has processed the update
        setTimeout(() => {
          if (mounted) {
            loadScans();
          }
        }, 1000);
      }
    };
    
    window.addEventListener('diagnosisUpdate', handleUpdate);
    window.addEventListener('medicalRecordUpdate', handleUpdate);
    
    // Also refresh when component becomes visible (user returns to page)
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedPetId && mounted) {
        console.log('[AiDiseaseDetection] Page became visible, refreshing scans');
        setTimeout(() => {
          if (mounted) {
            loadScans();
          }
        }, 500);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      mounted = false;
      window.removeEventListener('diagnosisUpdate', handleUpdate);
      window.removeEventListener('medicalRecordUpdate', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedPetId]);

  const handlePetSelect = (id) => {
    if (id) {
      setSelectedPetId(id);
      localStorage.setItem('pawmate_selected_pet_id', id);
      // Dispatch event to update other components
      window.dispatchEvent(new Event('petUpdate'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Navbar is handled by App.jsx layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Disease Detection</h1>
          <p className="text-gray-500 mt-1">Upload images or describe symptoms for instant AI-powered analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Action Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'image' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('image')}
                >
                  Image Upload
                </button>
                <button 
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'symptom' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('symptom')}
                >
                  Symptom Description
                </button>
              </div>

              {activeTab === 'image' ? (
                <ImageUploadTab 
                  uploadedImage={uploadedImage}
                  selectedPetId={selectedPetId}
                  onNavigate={onNavigate}
                  onImageSelected={(img) => {
                    setUploadedImage(img);
                    // Don't auto-switch to symptom tab - let user click analyze
                  }}
                  onAnalysisStart={() => {
                    setIsAnalyzing(true);
                    setAnalysisProgress(0);
                    setCurrentStep(0);
                  }}
                  onAnalysisProgress={(progress, step) => {
                    setAnalysisProgress(progress);
                    setCurrentStep(step);
                  }}
                  onAnalysisComplete={() => {
                    setIsAnalyzing(false);
                    setAnalysisProgress(100);
                    setCurrentStep(4);
                    // Dispatch events to refresh scans immediately
                    console.log('[AiDiseaseDetection] Analysis completed, dispatching refresh events');
                    window.dispatchEvent(new Event('diagnosisUpdate'));
                    window.dispatchEvent(new Event('medicalRecordUpdate'));
                    // Reset after a brief delay
                    setTimeout(() => {
                      setAnalysisProgress(0);
                      setCurrentStep(0);
                    }, 1000);
                  }}
                />
              ) : (
                <SymptomCheckTab 
                    onNavigate={onNavigate} 
                    uploadedImage={uploadedImage} 
                    selectedPetId={selectedPetId}
                    onAnalysisStart={() => {
                      setIsAnalyzing(true);
                      setAnalysisProgress(0);
                      setCurrentStep(0);
                    }}
                    onAnalysisProgress={(progress, step) => {
                      setAnalysisProgress(progress);
                      setCurrentStep(step);
                    }}
                    onAnalysisComplete={() => {
                      setIsAnalyzing(false);
                      setAnalysisProgress(100);
                      setCurrentStep(4);
                      // Dispatch events to refresh scans immediately
                      console.log('[AiDiseaseDetection] Symptom analysis completed, dispatching refresh events');
                      window.dispatchEvent(new Event('diagnosisUpdate'));
                      window.dispatchEvent(new Event('medicalRecordUpdate'));
                      // Reset after a brief delay
                      setTimeout(() => {
                        setAnalysisProgress(0);
                        setCurrentStep(0);
                      }, 1000);
                    }}
                />
              )}
            </div>

          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
             <AnalysisSidebar 
                previousScans={previousScans} 
                onNavigate={onNavigate} 
                pets={pets}
                selectedPetId={selectedPetId}
                onPetSelect={handlePetSelect}
                isAnalyzing={isAnalyzing}
                analysisProgress={analysisProgress}
                currentStep={currentStep}
             />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiDiseaseDetection;
