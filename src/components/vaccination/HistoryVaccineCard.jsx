import React from 'react';
import { FiCheck, FiInfo } from 'react-icons/fi';

const HistoryVaccineCard = ({ onNavigate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 opacity-75 hover:opacity-100 transition-opacity">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="bg-gray-100 p-2.5 rounded-full h-fit">
            <FiCheck className="text-gray-500 w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Jan 20, 2023</div>
            <h3 className="text-lg font-bold text-gray-900">Leptospirosis Vaccine</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-4 pl-[52px]">
        <div>
          <p className="text-xs text-gray-500 mb-1">Batch Number</p>
          <p className="font-medium text-gray-900 text-sm">LP-2023-0892</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Veterinarian</p>
          <p className="font-medium text-gray-900 text-sm">Dr. Sarah Johnson</p>
        </div>
      </div>

      <div className="pl-[52px] mb-4">
        <p className="text-sm text-gray-500 italic">Optional vaccine - Owner requested</p>
      </div>

      <div className="pl-[52px] mb-4">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded text-xs text-gray-500">
          <FiInfo className="w-3.5 h-3.5" />
          Next due: Jun 20, 2024 (Skipped - Optional)
        </div>
      </div>

      <div className="pl-[52px]">
        <button 
          onClick={() => onNavigate && onNavigate('records')}
          className="text-blue-600 text-sm font-medium hover:text-blue-700"
        >
          View Certificate
        </button>
      </div>
    </div>
  );
};

export default HistoryVaccineCard;
