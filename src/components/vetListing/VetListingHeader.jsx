import React from 'react';
import { FiSearch, FiMapPin } from 'react-icons/fi';

const VetListingHeader = ({ query, location, onQueryChange, onLocationChange, onSearch }) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Find a Veterinarian</h1>
      <p className="text-gray-500 mb-6">Book appointments with top-rated vets near you</p>
      
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, clinic, or specialization" 
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-none focus:ring-0 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div className="w-px bg-gray-200 hidden md:block"></div>
        <div className="flex-1 relative">
          <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Zip code or city" 
            value={location}
            onChange={(e) => onLocationChange?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-none focus:ring-0 text-gray-900 placeholder-gray-400"
          />
        </div>
        <button 
          onClick={() => onSearch?.()}
          className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default VetListingHeader;
