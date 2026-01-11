import React from 'react';
import { FiPlus } from 'react-icons/fi';

const AddRecordCard = ({ onNavigate, onAdd }) => {
  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={() => onAdd ? onAdd() : (onNavigate && onNavigate('records'))}
    >
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
        <FiPlus className="text-gray-400 w-6 h-6 group-hover:text-blue-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Add Previous Vaccination Record</h3>
      <p className="text-gray-500 text-sm mb-4">Import records from previous vet or add manual entry</p>
      <button 
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onAdd ? onAdd() : (onNavigate && onNavigate('records'));
        }}
      >
        Add Record
      </button>
    </div>
  );
};

export default AddRecordCard;
