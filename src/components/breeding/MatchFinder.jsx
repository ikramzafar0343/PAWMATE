import React, { useState, useEffect } from 'react';
import { FiFilter, FiMapPin, FiHeart, FiMessageCircle, FiSearch } from 'react-icons/fi';
import { getBreedingMatches, getPetById } from '../../utils/petStore';

const MatchFinder = ({ petId, onNavigate }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMatches = async () => {
        if (!petId) return;
        setLoading(true);
        try {
            const myPet = await getPetById(petId);
            if (!myPet) {
                setLoading(false);
                return;
            }

            // Fetch all potential matches from API
            const candidates = await getBreedingMatches();
            
            // Filter logic:
            // 1. Same breed (case-insensitive)
            // 2. Exclude self
            // 3. Opposite gender (optional, but good practice if gender is known) - For now strict breed match
            
            const myBreed = (myPet.breed || '').toLowerCase().trim();

            const compatible = candidates.filter(candidate => {
                // Exclude self
                if ((candidate._id || candidate.id) === (myPet._id || myPet.id)) return false;

                const candBreed = (candidate.breed || '').toLowerCase().trim();
                
                // Strict breed matching for "Same Breed List"
                return myBreed && candBreed && (myBreed === candBreed || myBreed.includes(candBreed) || candBreed.includes(myBreed));
            });

            setMatches(compatible);
        } catch (error) {
            console.error("Error loading matches", error);
        } finally {
            setLoading(false);
        }
    };
    loadMatches();
  }, [petId]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
              <FiSearch />
              <span className="text-sm">{loading ? 'Finding perfect matches...' : 'Searching for matches nearby...'}</span>
          </div>
          <button className="text-pink-600 font-medium text-sm flex items-center gap-1">
              <FiFilter /> Filters
          </button>
      </div>

      {loading ? (
          <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Analyzing compatibility...</p>
          </div>
      ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="inline-block p-4 bg-pink-50 rounded-full text-pink-500 mb-4">
                  <FiHeart className="text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Matches Found</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                  We couldn't find any suitable breeding matches for your pet nearby. Try expanding your search radius.
              </p>
          </div>
      ) : (
      /* Grid */
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <div key={match._id || match.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48">
              <img src={match.image || 'https://via.placeholder.com/300'} alt={match.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{match.name}</h3>
                  <p className="text-sm text-gray-500">{match.breed} • {match.age}</p>
                </div>
                <button 
                  onClick={() => alert(`Added ${match.name} to favorites!`)}
                  className="p-2 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors"
                >
                  <FiHeart className="fill-current" />
                </button>
              </div>

              <button 
                onClick={() => onNavigate && onNavigate('consultation')}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <FiMessageCircle />
                Contact Owner
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default MatchFinder;
