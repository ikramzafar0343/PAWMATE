import React, { useState } from 'react';
import { FiArrowRight, FiLoader } from 'react-icons/fi';
import { analyzeSymptoms } from '../../utils/predictionStore';

const SymptomCheckTab = ({ onNavigate, uploadedImage, selectedPetId, onAnalysisStart, onAnalysisProgress, onAnalysisComplete }) => {
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError('Please describe the symptoms before analyzing.');
      return;
    }

    if (!selectedPetId) {
      setError('Please select a pet first.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    
    // Notify parent that analysis started
    if (onAnalysisStart) {
      onAnalysisStart();
    }
    
    // Simulate progress steps (similar to image analysis)
    const progressSteps = [
      { progress: 15, step: 0, delay: 400 },  // Processing symptoms
      { progress: 40, step: 1, delay: 900 },  // Pattern matching
      { progress: 70, step: 2, delay: 1100 }, // Disease identification
      { progress: 90, step: 3, delay: 600 },  // Generating recommendation
    ];
    
    // Simulate progress
    const simulateProgress = async () => {
      for (const step of progressSteps) {
        if (onAnalysisProgress) {
          onAnalysisProgress(step.progress, step.step);
        }
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }
    };
    
    try {
      console.log(`[SymptomCheckTab] Starting analysis for petId: ${selectedPetId}`);
      
      // Start progress simulation and API call in parallel
      const [result] = await Promise.all([
        analyzeSymptoms(symptoms.trim(), selectedPetId, duration),
        simulateProgress()
      ]);
      
      console.log('[SymptomCheckTab] Analysis result:', result);
      console.log('[SymptomCheckTab] Prediction ID:', result.predictionId || result._id || result.id);
      
      // Complete progress
      if (onAnalysisProgress) {
        onAnalysisProgress(100, 4);
      }
      
      // Notify parent that analysis completed
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
      
      // Wait a bit longer to ensure backend has saved the prediction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dispatch events again to ensure refresh
      console.log('[SymptomCheckTab] Dispatching refresh events after analysis');
      window.dispatchEvent(new Event('diagnosisUpdate'));
      window.dispatchEvent(new Event('medicalRecordUpdate'));
      
      // Navigate to results page with analysis data
      if (onNavigate) {
        onNavigate('diagnosis', { 
          scanId: result.predictionId || result._id || result.id || 'latest',
          predictionData: {
            ...result,
            imageUrl: uploadedImage?.url || null, // Include uploaded image if available
            petId: selectedPetId
          }
        });
      }
    } catch (err) {
      console.error('Symptom analysis error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to analyze symptoms. Please try again.');
      
      // Reset progress on error
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {uploadedImage && (
        <div className="mb-6">
          <img src={uploadedImage.url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
        </div>
      )}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Describe Symptoms</label>
          <textarea 
            rows={6}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 resize-none"
            placeholder="Describe what your pet is experiencing (e.g., scratching ears, limping, loss of appetite...)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <select 
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          >
            <option value="">Select duration</option>
            <option value="Less than 24 hours">Less than 24 hours</option>
            <option value="1-3 days">1-3 days</option>
            <option value="1 week">1 week</option>
            <option value="More than 1 week">More than 1 week</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button 
        onClick={handleAnalyze}
        disabled={!symptoms.trim() || analyzing || !selectedPetId}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {analyzing ? (
          <>
            <FiLoader className="animate-spin" size={20} />
            Analyzing Symptoms...
          </>
        ) : (
          <>
            Analyze Symptoms with AI
            <FiArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  );
};

export default SymptomCheckTab;
