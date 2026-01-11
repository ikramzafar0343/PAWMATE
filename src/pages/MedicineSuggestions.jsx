import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import MedicineList from '../components/medicine/MedicineList';

const MedicineSuggestions = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('dashboard')} // Fallback to dashboard
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="text-xl text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Medicine Suggestions</h1>
                <p className="text-sm text-gray-500">AI & Vet Recommended</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <MedicineList />
    </div>
  );
};

export default MedicineSuggestions;
