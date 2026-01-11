import React from 'react';
import { FiCheck } from 'react-icons/fi';

const EditFooter = ({ onNavigate }) => {
  return (
    <div className="flex justify-center gap-4 py-8 border-t border-gray-200 mt-8 relative">
      <button 
        type="button"
        onClick={() => onNavigate && onNavigate('dashboard')}
        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        Discard Changes
      </button>
      <button 
        type="submit"
        onClick={() => onNavigate && onNavigate('dashboard')}
        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors"
      >
        <FiCheck />
        Save All Changes
      </button>
      <div className="text-xs text-gray-400 absolute bottom-4">
        Last saved Dec 15, 2024 at 3:45 PM
      </div>
    </div>
  );
};

export default EditFooter;
