import React, { useState } from 'react';
import { FaBriefcaseMedical } from 'react-icons/fa';

const MedicalInfoSection = () => {
  const [isSpayed, setIsSpayed] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <FaBriefcaseMedical className="text-blue-500 text-lg" />
        <h2 className="text-lg font-bold text-gray-900">Health & Medical Information</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSpayed(!isSpayed)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isSpayed ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isSpayed ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">Spayed/Neutered</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
          <input 
            type="text" 
            defaultValue="PetCare Insurance Plus"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
          <input 
            type="text" 
            defaultValue="PC-2024-789456"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
          <textarea 
            rows="2"
            defaultValue="Allergic to chicken, sensitive to certain grasses"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
          <textarea 
            rows="2"
            defaultValue="Apoquel 16mg - Once daily for skin allergies"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Dietary Needs</label>
          <textarea 
            rows="2"
            placeholder="Any special dietary requirements..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default MedicalInfoSection;
