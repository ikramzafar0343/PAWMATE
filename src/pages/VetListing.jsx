import React, { useMemo, useState, useEffect } from 'react';
import VetListingHeader from '../components/vetListing/VetListingHeader';
import VetFilters from '../components/vetListing/VetFilters';
import VetCard from '../components/vetListing/VetCard';
import { getVets } from '../utils/vetStore';

const VetListing = ({ onNavigate }) => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [availableToday, setAvailableToday] = useState(false);
  const [availableWeekend, setAvailableWeekend] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');

  useEffect(() => {
    const loadVets = async () => {
      try {
        const data = await getVets();
        setVets(data);
      } catch (error) {
        console.error("Error loading vets", error);
      } finally {
        setLoading(false);
      }
    };
    loadVets();
  }, []);

  const filtered = useMemo(() => {
    if (loading) return [];
    
    const q = query.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    let result = vets.filter(v => {
      const matchesQuery = !q || [
        v.name, 
        v.specialization || '', 
        v.clinicName || ''
      ].some(field => field.toLowerCase().includes(q));
      const matchesLocation = !loc || (v.clinicName || '').toLowerCase().includes(loc);
      const matchesSpec = selectedSpecs.length === 0 || selectedSpecs.includes(v.specialization) || selectedSpecs.some(s => (v.specialization || '').toLowerCase().includes(s.toLowerCase()));
      // Note: availableToday and availableWeekend filters would need availability data from backend
      return matchesQuery && matchesLocation && matchesSpec;
    });

    if (sortBy === 'Highest Rated') {
      // Would need rating field from backend
      result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'Price: Low to High') {
      // Would need fee field from backend
      result = [...result].sort((a, b) => (a.fee ?? 0) - (b.fee ?? 0));
    }
    return result;
  }, [vets, query, location, selectedSpecs, availableToday, availableWeekend, sortBy, loading]);

  const handleSearch = () => {
    setQuery(query);
    setLocation(location);
  };
  const toggleSpec = (spec) => {
    setSelectedSpecs((prev) => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VetListingHeader 
          query={query}
          location={location}
          onQueryChange={setQuery}
          onLocationChange={setLocation}
          onSearch={handleSearch}
        />
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-64 flex-shrink-0">
            <VetFilters 
              selectedSpecs={selectedSpecs}
              onToggleSpec={toggleSpec}
              availableToday={availableToday}
              availableWeekend={availableWeekend}
              onToggleAvailableToday={setAvailableToday}
              onToggleAvailableWeekend={setAvailableWeekend}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
          
          <div className="flex-1 space-y-4">
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading veterinarians...</div>
            ) : filtered.length > 0 ? (
              filtered.map(vet => (
                <VetCard key={vet._id || vet.id} vet={vet} onNavigate={onNavigate} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">No veterinarians found matching your criteria.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VetListing;
