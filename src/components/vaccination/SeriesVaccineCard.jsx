import React from 'react';
import { FiShield, FiCheck, FiCalendar } from 'react-icons/fi';

const SeriesVaccineCard = ({ onNavigate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase flex items-center gap-1">
          <FiShield className="w-3 h-3" /> Core Vaccine
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-6">DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)</h3>

      <div className="relative pl-4 border-l-2 border-emerald-500 space-y-8 mb-6 ml-2">
        {/* Dose 1 */}
        <div className="relative">
          <div className="absolute -left-[23px] top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
            <FiCheck className="text-white w-3 h-3" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-900 text-sm">Dose 1</p>
              <p className="text-xs text-gray-500">Mar 10, 2022 • Completed</p>
            </div>
          </div>
        </div>

        {/* Dose 2 */}
        <div className="relative">
          <div className="absolute -left-[23px] top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
            <FiCheck className="text-white w-3 h-3" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Dose 2</p>
            <p className="text-xs text-gray-500">Apr 12, 2022 • Completed</p>
          </div>
        </div>

        {/* Dose 3 */}
        <div className="relative">
          <div className="absolute -left-[23px] top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
            <FiCheck className="text-white w-3 h-3" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Dose 3</p>
            <p className="text-xs text-gray-500">May 10, 2022 • Completed</p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-emerald-800">Progress</span>
          <span className="text-emerald-800">3/3 doses completed</span>
        </div>
        <div className="w-full bg-emerald-200 rounded-full h-1.5">
          <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-900 font-medium mb-4">
        <FiCalendar className="text-gray-400" />
        Next booster: <span className="font-bold">May 10, 2025</span>
      </div>

      <button 
        onClick={() => onNavigate && onNavigate('records')}
        className="text-blue-600 text-sm font-medium hover:text-blue-700"
      >
        View all 3 certificates
      </button>
    </div>
  );
};

export default SeriesVaccineCard;
