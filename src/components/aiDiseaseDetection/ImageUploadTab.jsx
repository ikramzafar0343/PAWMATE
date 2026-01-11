import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiCamera, FiImage, FiArrowRight, FiLoader } from 'react-icons/fi';
import { predictDisease } from '../../utils/predictionStore';

const ImageUploadTab = ({ onImageSelected, uploadedImage, selectedPetId, onNavigate, onAnalysisStart, onAnalysisProgress, onAnalysisComplete }) => {
  const fileInputRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or HEIC)');
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }
    
    setError(null);
    const url = URL.createObjectURL(file);
    onImageSelected({ file, url });
  };

  const handleAnalyze = async () => {
    if (!uploadedImage || !uploadedImage.file) {
      setError('Please upload an image first');
      return;
    }
    
    if (!selectedPetId) {
      setError('Please select a pet first');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    // Notify parent that analysis started
    if (onAnalysisStart) {
      onAnalysisStart();
    }
    
    // Simulate progress steps (runs in parallel with API call)
    const simulateProgress = async () => {
      const progressSteps = [
        { progress: 10, step: 0, delay: 300 },  // Image preprocessing
        { progress: 35, step: 1, delay: 800 },  // Pattern recognition
        { progress: 65, step: 2, delay: 1000 }, // Disease identification
        { progress: 90, step: 3, delay: 500 },  // Generating report
      ];
      
      for (const step of progressSteps) {
        if (onAnalysisProgress) {
          onAnalysisProgress(step.progress, step.step);
        }
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }
    };
    
    try {
      console.log(`[ImageUploadTab] Starting analysis for petId: ${selectedPetId}`);
      
      // Start progress simulation and API call in parallel
      const [result] = await Promise.all([
        predictDisease(uploadedImage.file, selectedPetId),
        simulateProgress()
      ]);
      
      console.log('[ImageUploadTab] Analysis result:', result);
      console.log('[ImageUploadTab] Prediction ID:', result.predictionId || result._id || result.id);
      
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
      console.log('[ImageUploadTab] Dispatching refresh events after analysis');
      window.dispatchEvent(new Event('diagnosisUpdate'));
      window.dispatchEvent(new Event('medicalRecordUpdate'));
      
      // Navigate to results page
      if (onNavigate) {
        onNavigate('diagnosis', { 
          scanId: result.predictionId || result._id || result.id || 'latest',
          predictionData: result
        });
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to analyze image. Please try again.');
      
      // Reset progress on error
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 h-80 flex flex-col items-center justify-center mb-6 cursor-pointer hover:bg-blue-50 transition-colors group overflow-hidden"
      >
        {uploadedImage ? (
          <img src={uploadedImage.url} alt="Uploaded" className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FiUploadCloud size={40} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Drag and drop pet images here</h3>
            <p className="text-sm text-gray-500 mb-2">or click to browse files</p>
            <p className="text-xs text-gray-400">Supports: JPG, PNG, HEIC (Max 10MB)</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <button 
          className="flex items-center justify-center gap-2 py-3 px-4 border border-blue-200 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FiCamera size={20} />
          Take Photo
        </button>
        <button 
          className="flex items-center justify-center gap-2 py-3 px-4 border border-blue-200 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FiImage size={20} />
          Choose from Gallery
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Analyze button - shown when image is uploaded */}
      {uploadedImage && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !selectedPetId}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <FiLoader className="animate-spin" size={20} />
              Analyzing...
            </>
          ) : (
            <>
              <FiArrowRight size={20} />
              Analyze Image with AI
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ImageUploadTab;
