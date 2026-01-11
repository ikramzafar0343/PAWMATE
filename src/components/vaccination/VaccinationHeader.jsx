import React from 'react';
import { FiChevronRight, FiPlus, FiArrowLeft } from 'react-icons/fi';

const VaccinationHeader = ({ onNavigate, onAddRecord, pet }) => {
  const petName = pet?.name || 'Pet';
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-start gap-4">
        <button 
            onClick={() => onNavigate ? onNavigate('petDetails', pet) : window.history.back()}
            className="mt-1 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
        >
            <FiArrowLeft size={24} />
        </button>
        <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span className="cursor-pointer hover:text-blue-600" onClick={() => onNavigate && onNavigate('dashboard')}>My Pets</span>
              <FiChevronRight className="w-4 h-4" />
              <span className="cursor-pointer hover:text-blue-600" onClick={() => onNavigate && onNavigate('petDetails', pet)}>{petName}</span>
              <FiChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Vaccination Records</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vaccination Management</h1>
            <p className="text-gray-600 text-sm mt-1">Track vaccination history and upcoming immunizations for {petName}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={onAddRecord}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <FiPlus />
          Add Vaccination
        </button>
      </div>
    </div>
  );
};

export default VaccinationHeader;
