import React from 'react';
import { FiCheckCircle, FiClock } from 'react-icons/fi';

const AnalysisProgress = ({ progress = 0, currentStep = 0 }) => {
  // Define analysis steps
  const steps = [
    { id: 0, name: 'Image preprocessing', completed: currentStep > 0 },
    { id: 1, name: 'Pattern recognition', completed: currentStep > 1 },
    { id: 2, name: 'Disease identification', completed: currentStep > 2 },
    { id: 3, name: 'Generating report', completed: currentStep > 3 }
  ];

  // Calculate estimated time remaining (decreases as progress increases)
  const estimatedSeconds = Math.max(1, Math.ceil((100 - progress) / 6.67)); // ~15 seconds total

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full relative"></div>
        </div>
        <h3 className="font-bold text-gray-900">AI Analysis in Progress</h3>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-blue-600">Analyzing...</span>
          <span className="text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = step.completed;
          const isPending = currentStep < index;

          return (
            <div 
              key={step.id} 
              className={`flex gap-3 items-center transition-opacity ${isPending ? 'opacity-50' : ''}`}
            >
              {isCompleted ? (
                <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} />
              ) : isActive ? (
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0"></div>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
              )}
              <span className={`text-sm ${isActive ? 'text-gray-900 font-medium' : isCompleted ? 'text-gray-600' : 'text-gray-500'}`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>

      {progress < 100 && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
          <FiClock />
          <span>About {estimatedSeconds} second{estimatedSeconds !== 1 ? 's' : ''} left</span>
        </div>
      )}
    </div>
  );
};

export default AnalysisProgress;
