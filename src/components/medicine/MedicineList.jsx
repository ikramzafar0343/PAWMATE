import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import MedicineCard from './MedicineCard';
import { getMedicines } from '../../utils/medicineStore';

const MedicineList = () => {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const allMedicines = await getMedicines();
        setMedicines(allMedicines);
      } catch (error) {
        console.error("Error loading medicines", error);
        setMedicines([]);
      }
    };
    
    loadMedicines();
    const handleUpdate = () => loadMedicines();
    window.addEventListener('medicineUpdate', handleUpdate);
    return () => window.removeEventListener('medicineUpdate', handleUpdate);
  }, []);

  const categories = ['All', 'Allergy Relief', 'Supplements', 'Parasite Control', 'Joint Health'];

  const filteredMedicines = medicines
    .filter(m => (filter === 'All' ? true : m.category === filter))
    .filter(m => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text" 
            placeholder="Search medicines..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMedicines.map((medicine) => (
          <MedicineCard key={medicine._id || medicine.id} medicine={medicine} />
        ))}
      </div>
    </div>
  );
};

export default MedicineList;
