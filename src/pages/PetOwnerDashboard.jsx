import { useState, useEffect, useRef } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { 
  WelcomeSection, 
  PetCard, 
  VaccinationReminders, 
  UpcomingAppointments,
  ActiveConsultations, 
  BreedingMonitor, 
  AiHealthCheck, 
  QuickServicesFooter 
} from '../components/petOwnerDashboard/DashboardComponents'
import { getPets } from '../utils/petStore'
import { getAppointments } from '../utils/appointmentStore'

export default function PetOwnerDashboard({ onNavigate }) {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [appointmentsData, setAppointmentsData] = useState(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    // Fetch all data in parallel for maximum performance
    const loadDashboardData = async () => {
      const dashboardStartTime = performance.now();
      
      try {
        // Fetch pets and appointments in parallel
        const [petsData, appointments] = await Promise.all([
          getPets().catch(err => {
            console.error("Error loading pets", err);
            return [];
          }),
          getAppointments().catch(err => {
            console.error("Error loading appointments", err);
            return [];
          })
        ]);

        const dashboardEndTime = performance.now();
        console.log(`[Performance] Dashboard data loaded: ${(dashboardEndTime - dashboardStartTime).toFixed(2)}ms`);

        setPets(petsData || []);
        setAppointmentsData(Array.isArray(appointments) ? appointments : []);
        
        // Don't auto-select first pet - let user choose
      } catch (error) {
        console.error("Error loading dashboard data", error);
        setPets([]);
        setAppointmentsData([]);
      }
    };

    loadDashboardData();
    
    const handlePetUpdate = () => {
      getPets().then(data => {
        setPets(data || []);
        // Don't auto-select first pet - let user choose
      }).catch(err => console.error("Error loading pets", err));
    };
    window.addEventListener('petUpdate', handlePetUpdate);
    
    const handleAppointmentUpdate = () => {
      getAppointments().then(data => {
        setAppointmentsData(Array.isArray(data) ? data : []);
      }).catch(err => console.error("Error loading appointments", err));
    };
    window.addEventListener('appointmentUpdate', handleAppointmentUpdate);
    
    return () => {
      window.removeEventListener('petUpdate', handlePetUpdate);
      window.removeEventListener('appointmentUpdate', handleAppointmentUpdate);
    };
  }, [selectedPet]);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [pets]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeSection />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Pets Section */}
            <section className="relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">My Pets</h2>
                {selectedPet && (
                  <span className="text-sm text-blue-600 font-medium">
                    Viewing: <span className="font-bold">{selectedPet.name}</span>
                  </span>
                )}
              </div>
              
              {pets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No pets added yet.</div>
              ) : (
                <div className="relative">
                  {/* Left Arrow Button */}
                  {pets.length > 1 && canScrollLeft && (
                    <button
                      onClick={scrollLeft}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-gray-200"
                      aria-label="Scroll left"
                    >
                      <FiChevronLeft size={20} />
                    </button>
                  )}

                  {/* Pet Cards Slider */}
                  <div 
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x scroll-smooth"
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {pets.map((pet, idx) => {
                      const isSelected = selectedPet && (selectedPet._id || selectedPet.id) === (pet._id || pet.id);
                      return (
                        <div 
                          key={pet._id || pet.id || idx} 
                          className={`min-w-[280px] snap-center flex-shrink-0 transition-all cursor-pointer ${
                            isSelected ? 'transform scale-[1.02] shadow-2xl shadow-blue-500/20' : 'shadow-md hover:shadow-lg'
                          }`}
                          onClick={() => setSelectedPet(pet)}
                        >
                          <PetCard 
                            {...pet}
                            id={pet._id || pet.id}
                            image={pet.image || pet.imageUrl || 'https://via.placeholder.com/150'}
                            onNavigate={(page) => onNavigate && onNavigate(page, pet)} 
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Arrow Button */}
                  {pets.length > 1 && canScrollRight && (
                    <button
                      onClick={scrollRight}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-gray-200"
                      aria-label="Scroll right"
                    >
                      <FiChevronRight size={20} />
                    </button>
                  )}

                  {/* Hide scrollbar styles */}
                  <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                </div>
              )}
            </section>

            {/* Active Consultations Section - Only show if pet is selected */}
            {selectedPet && (
              <section>
                <UpcomingAppointments 
                  onNavigate={onNavigate} 
                  appointmentsData={appointmentsData} 
                  selectedPet={selectedPet}
                />
                <ActiveConsultations 
                  onNavigate={onNavigate} 
                  appointmentsData={appointmentsData}
                  selectedPet={selectedPet}
                />
              </section>
            )}
          </div>

          {/* Right Sidebar - Only show if pet is selected */}
          {selectedPet && (
            <div className="space-y-6">
              <VaccinationReminders onNavigate={onNavigate} selectedPet={selectedPet} />
              <BreedingMonitor pet={selectedPet} onNavigate={onNavigate} />
              <AiHealthCheck pet={selectedPet} onNavigate={onNavigate} />
            </div>
          )}
        </div>
      </main>

      <QuickServicesFooter onNavigate={onNavigate} />
    </div>
  )
}
