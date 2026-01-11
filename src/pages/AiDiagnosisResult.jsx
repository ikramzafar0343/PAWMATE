import React, { useState, useEffect } from 'react';
import { FiDroplet } from 'react-icons/fi';
import { FaPills, FaNotesMedical, FaSyringe } from 'react-icons/fa';
import ConfidenceBanner from '../components/aiDiagnosis/ConfidenceBanner';
import ConditionDetails from '../components/aiDiagnosis/ConditionDetails';
import SymptomGrid from '../components/aiDiagnosis/SymptomGrid';
import ImageAnalysis from '../components/aiDiagnosis/ImageAnalysis';
import Sidebar from '../components/aiDiagnosis/Sidebar';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getDetections } from '../utils/aiDiagnosisStore';
import { getPetById } from '../utils/petStore';
import { getPredictionById } from '../utils/predictionStore';
import { getPets } from '../utils/petStore';
import API from '../api/client';

// Helper function to get care steps based on disease
const getCareStepsForDisease = (disease) => {
  const careStepsMap = {
    'Skin Allergy': [
      "Keep the affected area clean and dry",
      "Prevent pet from scratching or licking the area",
      "Remove potential allergens from environment",
      "Monitor for worsening symptoms",
      "Consult veterinarian for allergy testing"
    ],
    'Flea Infestation': [
      "Apply flea treatment immediately",
      "Clean pet's environment thoroughly (bedding, carpets)",
      "Wash all pet accessories in hot water",
      "Vacuum regularly to remove flea eggs",
      "Treat all pets in household simultaneously"
    ],
    'Ringworm': [
      "Isolate pet from other animals immediately",
      "Keep area clean and dry",
      "Wear gloves when handling affected areas",
      "Disinfect all surfaces and bedding",
      "Seek veterinary treatment - highly contagious"
    ],
    'Hot Spots': [
      "Keep area clean and dry",
      "Prevent pet from scratching or licking",
      "Trim hair around affected area if possible",
      "Apply cool compress to reduce inflammation",
      "Veterinary treatment may include antibiotics"
    ],
    'Mange': [
      "Requires immediate veterinary attention",
      "Isolate from other pets - highly contagious",
      "Follow veterinarian's treatment plan strictly",
      "Clean all bedding and accessories",
      "Monitor for improvement and side effects"
    ],
    'Ear Infection': [
      "Clean ears gently with veterinarian-recommended solution",
      "Avoid inserting objects into ear canal",
      "Keep ears dry during baths",
      "Monitor for head shaking or scratching",
      "Veterinary examination recommended for proper treatment"
    ],
    'Dermatitis': [
      "Identify and remove irritant if possible",
      "Keep affected area clean",
      "Prevent pet from scratching",
      "Apply veterinarian-recommended topical treatment",
      "Monitor for signs of infection"
    ],
    'Healthy': [
      "Continue regular checkups",
      "Maintain good hygiene practices",
      "Monitor for any changes",
      "Keep up with vaccinations",
      "Provide balanced nutrition"
    ]
  };
  
  return careStepsMap[disease] || [
    "Keep the affected area clean and dry",
    "Prevent pet from scratching or licking",
    "Isolate from other pets if contagious",
    "Monitor for worsening symptoms",
    "Consult a veterinarian for proper diagnosis and treatment"
  ];
};

// Helper function to get treatments based on disease
const getTreatmentsForDisease = (disease) => {
  const treatmentsMap = {
    'Skin Allergy': [
      { name: "Antihistamine Tablets", dosage: "One tablet daily", duration: "5-7 days", icon: <FaPills className="text-blue-500" /> },
      { name: "Hydrocortisone Cream 1%", dosage: "Apply twice daily", duration: "7-10 days", icon: <FaSyringe className="text-blue-500" /> },
      { name: "Hypoallergenic Shampoo", dosage: "Bathe every 3 days", duration: "2-3 weeks", icon: <FaNotesMedical className="text-blue-500" /> }
    ],
    'Flea Infestation': [
      { name: "Flea Treatment (Topical)", dosage: "Apply as directed", duration: "Monthly", icon: <FaSyringe className="text-blue-500" /> },
      { name: "Flea Shampoo", dosage: "Bathe immediately", duration: "As needed", icon: <FaNotesMedical className="text-blue-500" /> },
      { name: "Environmental Spray", dosage: "Spray all surfaces", duration: "Weekly", icon: <FaPills className="text-blue-500" /> }
    ],
    'Ringworm': [
      { name: "Antifungal Cream", dosage: "Apply twice daily", duration: "2-4 weeks", icon: <FaSyringe className="text-blue-500" /> },
      { name: "Antifungal Shampoo", dosage: "Bathe twice weekly", duration: "4-6 weeks", icon: <FaNotesMedical className="text-blue-500" /> },
      { name: "Oral Antifungal", dosage: "As prescribed by vet", duration: "4-6 weeks", icon: <FaPills className="text-blue-500" /> }
    ],
    'Hot Spots': [
      { name: "Antibiotic Cream", dosage: "Apply twice daily", duration: "7-10 days", icon: <FaSyringe className="text-blue-500" /> },
      { name: "Antihistamine", dosage: "One tablet daily", duration: "5-7 days", icon: <FaPills className="text-blue-500" /> },
      { name: "Medicated Shampoo", dosage: "Bathe every 3 days", duration: "2-3 weeks", icon: <FaNotesMedical className="text-blue-500" /> }
    ],
    'Mange': [
      { name: "Ivermectin (Prescription)", dosage: "As prescribed by vet", duration: "4-8 weeks", icon: <FaPills className="text-blue-500" /> },
      { name: "Medicated Dip", dosage: "Weekly treatment", duration: "4-6 weeks", icon: <FaNotesMedical className="text-blue-500" /> },
      { name: "Antibiotic (if secondary infection)", dosage: "As prescribed", duration: "10-14 days", icon: <FaSyringe className="text-blue-500" /> }
    ],
    'Ear Infection': [
      { name: "Ear Drops", dosage: "2-3 drops twice daily", duration: "7-10 days", icon: <FaSyringe className="text-blue-500" /> },
      { name: "Oral Antibiotic", dosage: "As prescribed by vet", duration: "10-14 days", icon: <FaPills className="text-blue-500" /> },
      { name: "Ear Cleaner", dosage: "Clean before medication", duration: "As needed", icon: <FaNotesMedical className="text-blue-500" /> }
    ],
    'Dermatitis': [
      { name: "Hydrocortisone Cream 1%", dosage: "Apply twice daily", duration: "7-10 days", icon: <FaSyringe className="text-blue-500" /> },
      { name: "Antihistamine Tablets", dosage: "One tablet daily", duration: "5-7 days", icon: <FaPills className="text-blue-500" /> },
      { name: "Medicated Shampoo", dosage: "Bathe every 3 days", duration: "2-3 weeks", icon: <FaNotesMedical className="text-blue-500" /> }
    ]
  };
  
  return treatmentsMap[disease] || [
    { name: "Hydrocortisone Cream 1%", dosage: "Apply twice daily", duration: "7-10 days", icon: <FaSyringe className="text-blue-500" /> },
    { name: "Antihistamine Tablets", dosage: "One tablet daily", duration: "5-7 days", icon: <FaPills className="text-blue-500" /> },
    { name: "Medicated Shampoo", dosage: "Bathe every 3 days", duration: "2-3 weeks", icon: <FaNotesMedical className="text-blue-500" /> }
  ];
};

const AiDiagnosisResult = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { scanId } = useParams();
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let detection = null;
        let pet = null;
        
        // Check if predictionData was passed via navigation state
        const predictionData = location.state?.predictionData;
        
        if (predictionData) {
          // Use prediction data from navigation - fully dynamic
          const pets = await getPets();
          const petId = predictionData.petId || localStorage.getItem('pawmate_selected_pet_id');
          pet = pets.find(p => (p._id || p.id) === petId) || pets[0];
          
          const date = new Date();
          const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          
          // Calculate severity based on confidence
          const confidence = predictionData.confidence || 85;
          let severity = "Moderate Severity";
          let severityColor = "yellow";
          if (confidence >= 90) {
            severity = "High Severity";
            severityColor = "red";
          } else if (confidence >= 70) {
            severity = "Moderate Severity";
            severityColor = "yellow";
          } else {
            severity = "Low Severity";
            severityColor = "green";
          }
          
          // Generate dynamic care steps and treatments based on disease
          const diseaseCareSteps = getCareStepsForDisease(predictionData.disease);
          const diseaseTreatments = getTreatmentsForDisease(predictionData.disease);
          
          setDiagnosisData({
            petName: pet?.name || "Unknown Pet",
            breed: pet?.breed || "Unknown Breed",
            date: formattedDate,
            confidence: confidence,
            condition: predictionData.disease || "Unknown Condition",
            severity: severity,
            severityColor: severityColor,
            description: predictionData.recommendation || "This condition requires attention. Please consult with a veterinarian for proper diagnosis and treatment.",
            imageUrl: predictionData.imageUrl || null,
            predictionId: predictionData.predictionId,
            detectionRegions: predictionData.detectionRegions || [],
            symptoms: predictionData.detectedSymptoms ? predictionData.detectedSymptoms.map((symptom, idx) => ({
              name: symptom,
              percentage: Math.max(70, 100 - (idx * 5)),
              icon: <FiDroplet className="text-blue-500" />
            })) : [],
            careSteps: diseaseCareSteps,
            treatments: diseaseTreatments
          });
        } else {
          // Try to get from prediction API first
          if (scanId && scanId !== 'latest' && scanId !== 'null' && scanId !== 'undefined') {
            try {
              const prediction = await getPredictionById(scanId);
              if (prediction) {
                // Handle populated petId (object) or just ID (string)
                if (prediction.petId && typeof prediction.petId === 'object') {
                  pet = prediction.petId;
                } else {
                  pet = await getPetById(prediction.petId);
                }
                
                const date = new Date(prediction.createdAt || Date.now());
                const formattedDate = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                });
                
                // Calculate severity based on confidence
                const confidence = prediction.confidence || 85;
                let severity = "Moderate Severity";
                let severityColor = "yellow";
                if (confidence >= 90) {
                  severity = "High Severity";
                  severityColor = "red";
                } else if (confidence >= 70) {
                  severity = "Moderate Severity";
                  severityColor = "yellow";
                } else {
                  severity = "Low Severity";
                  severityColor = "green";
                }
                
                // Generate dynamic care steps and treatments based on disease
                const diseaseCareSteps = getCareStepsForDisease(prediction.disease);
                const diseaseTreatments = getTreatmentsForDisease(prediction.disease);
                
                setDiagnosisData({
                  petName: pet?.name || prediction.petId?.name || "Unknown Pet",
                  breed: pet?.breed || prediction.petId?.breed || "Unknown Breed",
                  date: formattedDate,
                  confidence: confidence,
                  condition: prediction.disease || "Unknown Condition",
                  severity: severity,
                  severityColor: severityColor,
                  description: prediction.recommendation || "This condition requires attention. Please consult with a veterinarian for proper diagnosis and treatment.",
                  imageUrl: prediction.imageUrl || null,
                  predictionId: prediction._id || prediction.id,
                  detectionRegions: prediction.detectionRegions || [],
                  symptoms: prediction.detectedSymptoms ? prediction.detectedSymptoms.map((symptom, idx) => ({
                    name: symptom,
                    percentage: Math.max(70, 100 - (idx * 5)),
                    icon: <FiDroplet className="text-blue-500" />
                  })) : [],
                  careSteps: diseaseCareSteps,
                  treatments: diseaseTreatments
                });
                setLoading(false);
                return;
              }
            } catch (err) {
              console.log('Prediction not found, trying medical records...', err);
            }
          }
          
          // Fallback to medical records (AI Diagnosis type)
          const petId = localStorage.getItem('pawmate_selected_pet_id');
          if (!petId) {
            console.error('No pet ID available');
            setLoading(false);
            return;
          }
          
          const detections = await getDetections(petId);
          
          // Ensure detections is an array
          if (!Array.isArray(detections)) {
            console.error('Detections is not an array:', detections);
            setLoading(false);
            return;
          }
          
          detection = scanId === 'latest' 
            ? detections[0] 
            : detections.find(d => String(d._id || d.id) === String(scanId)) || detections[0];
          
          if (detection) {
            pet = await getPetById(detection.petId || petId);
            const date = new Date(detection.date || detection.createdAt || Date.now());
            const formattedDate = date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            });
            
            const severityLabels = {
              'Low': 'Low Severity',
              'Moderate': 'Moderate Severity',
              'High': 'High Severity',
              'Critical': 'Critical Severity'
            };
            
            // Parse symptoms from details if available
            let symptoms = [];
            if (detection.details?.symptoms) {
              try {
                symptoms = typeof detection.details.symptoms === 'string' 
                  ? JSON.parse(detection.details.symptoms) 
                  : detection.details.symptoms;
              } catch (e) {
                symptoms = Array.isArray(detection.details.symptoms) ? detection.details.symptoms : [];
              }
            } else if (detection.symptoms) {
              symptoms = Array.isArray(detection.symptoms) ? detection.symptoms : [detection.symptoms];
            }

            setDiagnosisData({
              petName: pet?.name || "Unknown Pet",
              breed: pet?.breed || "Unknown Breed",
              date: formattedDate,
              confidence: parseInt(detection.details?.score || detection.severityScore || 85),
              condition: detection.condition || detection.title || "Unknown Condition",
              severity: severityLabels[detection.risk] || "Moderate Severity",
              description: detection.details?.recommendation || "This condition requires attention. Please consult with a veterinarian for proper diagnosis and treatment. Early intervention is essential for your pet's health and comfort.",
              symptoms: symptoms.map((symptom, idx) => ({
                name: symptom,
                percentage: Math.max(70, 100 - (idx * 5)),
                icon: <FiDroplet className="text-blue-500" />
              })),
              careSteps: [
                "Keep the affected area clean and dry",
                "Prevent pet from scratching or licking",
                "Isolate from other pets if contagious",
                "Monitor for worsening symptoms",
                "Avoid applying home remedies without consultation"
              ],
              treatments: [
                { name: "Hydrocortisone Cream 1%", dosage: "Apply twice daily", duration: "7-10 days", icon: <FaSyringe className="text-blue-500" /> },
                { name: "Antihistamine Tablets", dosage: "One tablet daily", duration: "5-7 days", icon: <FaPills className="text-blue-500" /> },
                { name: "Medicated Shampoo", dosage: "Bathe every 3 days", duration: "2-3 weeks", icon: <FaNotesMedical className="text-blue-500" /> },
              ]
            });
          }
        }
      } catch (error) {
        console.error('Error loading diagnosis data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('diagnosisUpdate', handleUpdate);
    return () => window.removeEventListener('diagnosisUpdate', handleUpdate);
  }, [scanId, location.state]);

  if (loading || !diagnosisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading diagnosis data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Navbar is handled by App.jsx layout */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Go Back"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Diagnosis Results</h1>
            <p className="text-gray-500 mt-1">Analysis completed for {diagnosisData.petName} - {diagnosisData.breed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            <ConfidenceBanner confidence={diagnosisData.confidence} date={diagnosisData.date} />

            <ConditionDetails 
              condition={diagnosisData.condition} 
              severity={diagnosisData.severity} 
              description={diagnosisData.description}
              severityColor={diagnosisData.severityColor}
            />

            <SymptomGrid symptoms={diagnosisData.symptoms} />

            <ImageAnalysis 
              imageUrl={diagnosisData.imageUrl} 
              detectionRegions={diagnosisData.detectionRegions || []}
            />
          </div>

          {/* Right Column (1/3 width) */}
          <Sidebar diagnosisData={diagnosisData} onNavigate={onNavigate} />
        </div>
      </main>
    </div>
  );
};

export default AiDiagnosisResult;
