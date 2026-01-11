import React from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';

const VetFilters = ({ 
  selectedSpecs = [], 
  onToggleSpec, 
  availableToday = false, 
  availableWeekend = false, 
  onToggleAvailableToday, 
  onToggleAvailableWeekend, 
  sortBy = 'Recommended', 
  onSortChange 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-fit sticky top-24">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <FiFilter className="text-gray-500" />
        <h3 className="font-bold text-gray-900">Filters</h3>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
          <div className="space-y-2">
            {['General Practice', 'Dermatology', 'Surgery', 'Dentistry', 'Behavioral'].map((spec) => {
              const checked = selectedSpecs.includes(spec);
              return (
                <label key={spec} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={checked}
                    onChange={() => onToggleSpec?.(spec)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-sm text-gray-600">{spec}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={availableToday}
                onChange={() => onToggleAvailableToday?.(!availableToday)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
              />
              <span className="text-sm text-gray-600">Available Today</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={availableWeekend}
                onChange={() => onToggleAvailableWeekend?.(!availableWeekend)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
              />
              <span className="text-sm text-gray-600">Available This Weekend</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select 
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Recommended">Recommended</option>
            <option value="Highest Rated">Highest Rated</option>
            <option value="Distance: Low to High">Distance: Low to High</option>
            <option value="Price: Low to High">Price: Low to High</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default VetFilters;
