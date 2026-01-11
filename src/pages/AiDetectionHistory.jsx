import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsOverview from '../components/aiHistory/StatsOverview';
import HistoryList from '../components/aiHistory/HistoryList';
import SummaryChart from '../components/aiHistory/SummaryChart';
import RecentPets from '../components/aiHistory/RecentPets';
import { FaChevronLeft } from 'react-icons/fa';
import { getPets } from '../utils/petStore';

const AiDetectionHistory = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [pets, setPets] = useState([]);

  useEffect(() => {
    // Get selected pet from localStorage (don't auto-select if not set)
    const storedPetId = localStorage.getItem('pawmate_selected_pet_id');
    if (storedPetId) {
      setSelectedPetId(storedPetId);
    }

    // Load pets
    const loadPets = async () => {
      try {
        const petsData = await getPets();
        setPets(petsData);
      } catch (error) {
        console.error('Error loading pets:', error);
      }
    };
    
    loadPets();

    // Listen for pet selection changes
    const handlePetUpdate = () => {
      const newPetId = localStorage.getItem('pawmate_selected_pet_id');
      if (newPetId !== selectedPetId) {
        setSelectedPetId(newPetId || null);
      }
    };

    // Listen for diagnosis updates to refresh the page
    const handleDiagnosisUpdate = () => {
      console.log('[AiDetectionHistory] Diagnosis update received, page will refresh on next render');
      // Force a re-render by updating state
      setSelectedPetId(prev => prev);
    };

    window.addEventListener('petUpdate', handlePetUpdate);
    window.addEventListener('diagnosisUpdate', handleDiagnosisUpdate);
    window.addEventListener('medicalRecordUpdate', handleDiagnosisUpdate);
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[AiDetectionHistory] Page became visible, refreshing data');
        setSelectedPetId(prev => prev);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('petUpdate', handlePetUpdate);
      window.removeEventListener('diagnosisUpdate', handleDiagnosisUpdate);
      window.removeEventListener('medicalRecordUpdate', handleDiagnosisUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedPetId]);

  const selectedPet = selectedPetId ? pets.find(p => (p._id || p.id) === selectedPetId) : null;

  const handlePetSelect = (petId) => {
    setSelectedPetId(petId);
    if (petId) {
      localStorage.setItem('pawmate_selected_pet_id', petId);
      // Dispatch event to update other components
      window.dispatchEvent(new Event('petUpdate'));
    } else {
      localStorage.removeItem('pawmate_selected_pet_id');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => onNavigate ? onNavigate('dashboard') : navigate('/pet-owner/dashboard')}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
            title="Go back"
          >
            <FaChevronLeft />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">AI Detection History</h1>
            <p className="text-gray-600 mt-1">View and manage all previous AI health screenings</p>
          </div>
          
          {/* Pet Selector */}
          {pets.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Select Pet
              </label>
              <select
                value={selectedPetId || ''}
                onChange={(e) => handlePetSelect(e.target.value || null)}
                className="w-full appearance-none border border-gray-200 rounded-lg p-2 pl-10 bg-white hover:border-blue-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Pets</option>
                {pets.map(pet => (
                  <option key={pet.id || pet._id} value={pet.id || pet._id}>
                    {pet.name} ({pet.breed})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <StatsOverview selectedPetId={selectedPetId} pets={pets} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - History List */}
          <div className="lg:col-span-2">
            <HistoryList onNavigate={onNavigate} selectedPetId={selectedPetId} pets={pets} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <SummaryChart selectedPetId={selectedPetId} pets={pets} />
            <RecentPets />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiDetectionHistory;
