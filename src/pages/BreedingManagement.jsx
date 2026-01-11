import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiActivity, FiSearch, FiFileText } from 'react-icons/fi';
import CycleTracker from '../components/breeding/CycleTracker';
import MatchFinder from '../components/breeding/MatchFinder';
import BreedingRecords from '../components/breeding/BreedingRecords';
import { getPets } from '../utils/petStore';

const BreedingManagement = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('cycle');
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPets = async () => {
      try {
        const data = await getPets();
        setPets(data);
        if (data.length > 0) {
          setSelectedPetId(data[0]._id || data[0].id);
        }
      } catch (error) {
        console.error("Error loading pets", error);
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiArrowLeft className="text-xl text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Breeding Management</h1>
              <p className="text-sm text-gray-500">Track cycles, find matches & records</p>
            </div>
            {/* Pet Selector */}
            <div className="w-48">
                {loading ? (
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                ) : (
                    <select
                        value={selectedPetId || ''}
                        onChange={(e) => setSelectedPetId(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                        {pets.map(pet => (
                            <option key={pet.id || pet._id} value={pet.id || pet._id}>
                                {pet.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveTab('cycle')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'cycle' 
                  ? 'border-pink-600 text-pink-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiActivity /> Cycle Tracking
            </button>
            <button 
              onClick={() => setActiveTab('match')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'match' 
                  ? 'border-pink-600 text-pink-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiSearch /> Match Finder
            </button>
            <button 
              onClick={() => setActiveTab('records')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'records' 
                  ? 'border-pink-600 text-pink-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiFileText /> Records
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!selectedPetId && !loading && (
            <div className="text-center py-10 text-gray-500">
                Please select a pet to manage breeding details.
            </div>
        )}
        {selectedPetId && (
            <>
                {activeTab === 'cycle' && <CycleTracker petId={selectedPetId} onNavigate={onNavigate} />}
                {activeTab === 'match' && <MatchFinder petId={selectedPetId} onNavigate={onNavigate} />}
                {activeTab === 'records' && <BreedingRecords petId={selectedPetId} onNavigate={onNavigate} />}
            </>
        )}
      </div>
    </div>
  );
};

export default BreedingManagement;
