import React from 'react';
import { FiChevronRight } from 'react-icons/fi';

const EditHeader = ({ onNavigate }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>My Pets</span>
          <FiChevronRight className="w-4 h-4" />
          <span>Max</span>
          <FiChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Edit Details</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Pet Details</h1>
        <p className="text-gray-600 text-sm mt-1">Update Max's information and medical records</p>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditHeader;
