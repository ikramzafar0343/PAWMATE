import React from 'react';
import { FiFileText } from 'react-icons/fi';

const AdditionalNotesSection = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <FiFileText className="text-blue-500 text-lg" />
        <h2 className="text-lg font-bold text-gray-900">Additional Notes</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Behavioral Notes</label>
          <textarea 
            rows="3"
            defaultValue="Friendly with other dogs, anxious during thunderstorms, loves swimming"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner Notes</label>
          <textarea 
            rows="3"
            defaultValue="Prefers morning walks, responds well to positive reinforcement"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalNotesSection;
