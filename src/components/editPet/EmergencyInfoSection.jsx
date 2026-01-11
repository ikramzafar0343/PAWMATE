import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const EmergencyInfoSection = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <FiAlertCircle className="text-red-500 text-lg" />
        <h2 className="text-lg font-bold text-gray-900">Emergency Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
          <input 
            type="text" 
            defaultValue="John Smith"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
          <input 
            type="text" 
            defaultValue="+1 (555) 987-6543"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
          <input 
            type="text" 
            defaultValue="Owner"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Emergency Contact</label>
          <input 
            type="text" 
            defaultValue="Jane Smith - +1 (555) 234-5678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Special Medical Instructions</label>
        <textarea 
          rows="2"
          defaultValue="Contact owner immediately if temperature exceeds 103°F. Max requires sedation for examinations."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default EmergencyInfoSection;
