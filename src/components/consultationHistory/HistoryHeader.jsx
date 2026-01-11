import React from 'react';
import { FiCalendar, FiFilter, FiSearch } from 'react-icons/fi';

const HistoryHeader = () => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consultation History</h1>
            <p className="text-gray-500 mt-1">Track and review past veterinary consultations</p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
              <FiCalendar className="text-gray-400" />
              <span>Date Range</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
              <FiFilter className="text-gray-400" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text" 
            placeholder="Search by doctor name, diagnosis, or pet name..." 
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default HistoryHeader;
