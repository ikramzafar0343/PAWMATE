import React from 'react';
import { FiSearch } from 'react-icons/fi';

const VaccinationFilters = ({ activeTab, onTabChange, searchQuery, onSearchChange }) => {
  const tabs = ['All', 'Upcoming', 'Overdue', 'Completed'];

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto border-b border-gray-200 md:border-none px-2 md:px-0">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`font-medium whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-2 md:pb-0' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search vaccines..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default VaccinationFilters;
