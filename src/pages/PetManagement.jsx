import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PetCard, 
  QuickServicesFooter, 
  WelcomeSection 
} from '../components/petOwnerDashboard/DashboardComponents';
import { FaPlus } from 'react-icons/fa';
import { getPets, deletePet } from '../utils/petStore';

// Skeleton loader for pet cards
const PetCardSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center animate-pulse">
    <div className="w-24 h-24 rounded-full bg-gray-200 mb-4"></div>
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
    <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
  </div>
);

export default function PetManagement({ onNavigate }) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const loadPets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPets();
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handleDeletePet = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
        try {
          await deletePet(id);
          setPets(prev => prev.filter(p => (p._id || p.id) !== id));
        } catch (error) {
          console.error('Error deleting pet:', error);
          alert('Failed to delete pet. Please try again.');
        }
    }
  }, []);

  // Memoize pet cards to prevent unnecessary re-renders
  const petCards = useMemo(() => {
    return pets.map((pet) => (
      <PetCard 
        key={pet._id || pet.id} 
        {...pet}
        id={pet._id || pet.id}
        onNavigate={onNavigate} 
        onDelete={handleDeletePet}
      />
    ));
  }, [pets, onNavigate, handleDeletePet]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
             <h1 className="text-2xl font-bold text-gray-800">My Pets</h1>
             <p className="text-gray-500 mt-1">Manage your pets profiles and details</p>
          </div>
          
          <button 
            onClick={() => onNavigate && onNavigate('addPet')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm hover:shadow-md"
          >
            <FaPlus />
            Add New Pet
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <PetCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : pets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {petCards}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
              <FaPlus />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No pets added yet</h3>
            <p className="text-gray-500 mb-6">Add your first pet to start tracking their health</p>
            <button 
              onClick={() => onNavigate && onNavigate('addPet')}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Add Pet
            </button>
          </div>
        )}
      </main>

      <QuickServicesFooter onNavigate={onNavigate} />
    </div>
  );
}
