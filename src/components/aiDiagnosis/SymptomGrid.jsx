import React from 'react';
import { FiAlertCircle, FiDroplet } from 'react-icons/fi';

const SymptomGrid = ({ symptoms }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="font-bold text-gray-900">Detected Symptoms & Indicators</h3>
        <FiAlertCircle className="text-gray-400 text-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {symptoms.map((symptom, index) => (
          <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <div className="mr-4 p-2 bg-white rounded-full shadow-sm">
              {/* Assuming icon is passed or we default to something */}
               <div className="text-blue-500">
                  {symptom.icon || <FiDroplet />}
               </div>
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">{symptom.name}</div>
              <div className="text-blue-600 font-bold text-lg">{symptom.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SymptomGrid;
