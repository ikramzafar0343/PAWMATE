import { 
  PetProfileCard, 
  QuickActionsCard, 
  MedicalRecordsCard, 
  VaccinationHistoryCard, 
  BreedingMonitorCard, 
  UpcomingAppointmentsCard, 
  HealthReportCard
} from '../components/pet-profile/PetProfileComponents'

import { FaUser, FaFileAlt, FaCalendarCheck, FaClinicMedical, FaEllipsisH } from 'react-icons/fa'
import { useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPetById } from '../utils/petStore';

export default function PetProfile({ onNavigate }) {
  const location = useLocation();
  const { petId } = useParams();
  const [petData, setPetData] = useState(location.state?.pet || null);
  const [loading, setLoading] = useState(!location.state?.pet);
  
  useEffect(() => {
    const loadPet = async () => {
      if (location.state?.pet) {
        setPetData(location.state.pet);
        setLoading(false);
        return;
      }
      
      if (petId) {
        try {
          const pet = await getPetById(petId);
          setPetData(pet);
          if (pet) {
            localStorage.setItem('pawmate_selected_pet_id', pet._id || pet.id);
          }
        } catch (error) {
          console.error("Error loading pet", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadPet();
    
    const handleUpdate = () => {
      loadPet();
    };
    
    window.addEventListener('petUpdate', handleUpdate);
    return () => window.removeEventListener('petUpdate', handleUpdate);
  }, [petId, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading pet profile...</p>
      </div>
    );
  }

  if (!petData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pet not found</p>
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Section: Pet Profile */}
        <PetProfileCard pet={petData} onNavigate={onNavigate} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-6">
            <MedicalRecordsCard onNavigate={onNavigate} petId={petData?._id || petData?.id} />
            <VaccinationHistoryCard onNavigate={onNavigate} petId={petData?._id || petData?.id} />
            <HealthReportCard onNavigate={onNavigate} petId={petData?._id || petData?.id} />
          </div>
          
          {/* Right Column (Sidebar/Actions) */}
          <div className="space-y-6">
            <QuickActionsCard onNavigate={onNavigate} />
            <BreedingMonitorCard onNavigate={onNavigate} pet={petData} />
            <UpcomingAppointmentsCard onNavigate={onNavigate} pet={petData} />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Optional, visible only on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-50">
        <button 
          onClick={() => onNavigate && onNavigate('profile')}
          className="flex flex-col items-center gap-1 text-blue-600"
        >
          <FaUser />
          <span className="text-[10px]">Profile</span>
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('records', petData)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600"
        >
          <FaFileAlt />
          <span className="text-[10px]">Records</span>
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('appointment')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600"
        >
          <FaCalendarCheck />
          <span className="text-[10px]">Appts</span>
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('detection')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600"
        >
          <FaClinicMedical />
          <span className="text-[10px]">Health</span>
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600"
        >
          <FaEllipsisH />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    </div>
  )
}
