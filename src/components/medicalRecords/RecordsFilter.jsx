import React from 'react';
import { FiSearch, FiCalendar } from 'react-icons/fi';

const RecordsFilter = ({ activeTab, onTabChange, searchQuery, onSearchChange }) => {
  const tabs = ['All Records', 'Treatments', 'Vaccinations', 'Prescriptions', 'Lab Results', 'Vet Notes'];

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">
      <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-2 w-full lg:w-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab === 'All Records' ? (
              <span className={activeTab === 'All Records' ? 'border-b-2 border-blue-600 pb-0.5' : ''}>
                All <br className="hidden" /> Records
              </span>
            ) : tab}
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full lg:w-auto">
        <div className="relative flex-1 lg:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search records..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default RecordsFilter;
