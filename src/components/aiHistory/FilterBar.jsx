import React from 'react';
import { FiCalendar, FiFilter, FiDownload, FiChevronDown } from 'react-icons/fi';
import { FaPaw } from 'react-icons/fa';

const FilterBar = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Date Range */}
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
          <FiCalendar className="text-gray-500" />
          Last 30 Days
          <FiChevronDown className="text-gray-400" />
        </button>

        {/* Pet Filter */}
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
          <FaPaw className="text-gray-500" />
          All Pets
          <FiChevronDown className="text-gray-400" />
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

        {/* Status Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm">
            All
          </button>
          <button className="px-4 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900">
            Completed
          </button>
          <button className="px-4 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900">
            Pending
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex-1 md:flex-none">
          <FiDownload />
          Export Records
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 flex-1 md:flex-none">
          Most Recent
          <FiChevronDown className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
