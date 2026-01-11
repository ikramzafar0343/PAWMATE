import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import BookingHeader from '../components/appointment/BookingHeader';
import DateTimeSelection from '../components/appointment/DateTimeSelection';
import ConsultationType from '../components/appointment/ConsultationType';
import PaymentSection from '../components/appointment/PaymentSection';
import { getVets, getVetById } from '../utils/vetStore';
import { vets as mockVets } from '../utils/vetData';
import { addAppointment } from '../utils/appointmentStore';
import { getPets } from '../utils/petStore';
import { FaMapMarkerAlt, FaStar, FaChevronLeft, FaPaw } from 'react-icons/fa';

const AppointmentBooking = ({ onNavigate }) => {
  const location = useLocation();
  const { vetId } = useParams();
  const initialPet = location.state?.pet;
  const initialVet = location.state?.vet;
  
  const [selectedVet, setSelectedVet] = useState(initialVet || null);
  const [vets, setVets] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(initialPet || null);
  const [loading, setLoading] = useState(false);
  const [loadingVets, setLoadingVets] = useState(true);
  const [selectedConsultationType, setSelectedConsultationType] = useState('video');
  const [consultationPrice, setConsultationPrice] = useState(45);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load pets
        const petsData = await getPets();
        setPets(petsData);
        if (!initialPet && petsData.length > 0) {
          setSelectedPet(petsData[0]);
        }
        
        // Load vet if vetId is provided
        if (vetId && vetId !== 'general') {
          // Use initial data for immediate render if available
          if (initialVet && !selectedVet) {
            setSelectedVet(initialVet);
          }

          // Always fetch fresh data to ensure latest fees
          const vet = await getVetById(vetId, true);
          if (vet) setSelectedVet(vet);
        }
        
        // Load all vets for selection
        const vetsData = await getVets();
        setVets(vetsData);
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoadingVets(false);
      }
    };
    loadData();
  }, [initialPet, initialVet, vetId]);

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  const handleDateTimeSelect = (date, time) => {
    setBookingDate(date);
    setBookingTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!selectedPet) {
        alert('Please add a pet before booking.');
        return;
    }
    if (!bookingDate || !bookingTime) {
      alert('Please select a date and time for your appointment.');
      return;
    }
    
    setLoading(true);

    const newAppointment = {
      vetId: selectedVet._id || selectedVet.id,
      petId: selectedPet._id || selectedPet.id,
      date: bookingDate,
      time: bookingTime,
      type: selectedConsultationType, 
      price: consultationPrice,
      reason: 'Regular Checkup' // Hardcoded for now or add field
    };

    try {
        await addAppointment(newAppointment);
        alert(`Appointment Confirmed!\n\nVet: ${selectedVet.name}\nDate: ${bookingDate}\nTime: ${bookingTime}`);
        // Navigate to dashboard to see the new appointment
        onNavigate('dashboard');
    } catch (error) {
        alert('Booking failed: ' + (error.response?.data?.message || error.message));
    } finally {
        setLoading(false);
    }
  };

  if (!selectedVet) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header for selection */}
        <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button 
              onClick={() => onNavigate && onNavigate('vetListing')} 
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaChevronLeft />
            </button>
            <h1 className="text-lg font-bold flex-1 text-center pr-10">Select Veterinarian</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Available Veterinarians</h2>
          {loadingVets ? (
            <div className="text-center py-8 text-gray-500">Loading veterinarians...</div>
          ) : vets.length > 0 ? (
            vets.map(vet => {
              const mockVet = mockVets.find(m => m.name === vet.name);
              const vetImage = vet.image || mockVet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name || 'Vet')}&background=random`;
              
              return (
            <div 
              key={vet._id || vet.id} 
              onClick={() => setSelectedVet(vet)} 
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <img src={vetImage} alt={vet.name} className="w-16 h-16 rounded-full object-cover bg-gray-100 border border-gray-200" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{vet.name}</h3>
                <p className="text-blue-600 text-sm font-medium mb-1">{vet.specialization || 'General Practice'}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FaMapMarkerAlt className="text-gray-400" /> {vet.clinicName || 'Veterinary Clinic'}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between py-1">
                {vet.rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold border border-yellow-100">
                    <FaStar className="text-yellow-500" /> {vet.rating}
                  </div>
                )}
                <button className="text-blue-600 text-sm font-bold bg-blue-50 px-3 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                  Select
                </button>
              </div>
            </div>
          );
        })
          ) : (
            <div className="text-center py-8 text-gray-500">No veterinarians available.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BookingHeader onBack={() => setSelectedVet(null)} vet={selectedVet} />
      
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Pet Selection / Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white flex items-center justify-center">
              {selectedPet ? (
                  <img src={selectedPet.image} alt={selectedPet.name} className="w-full h-full object-cover" />
              ) : (
                  <FaPaw className="text-gray-400" />
              )}
          </div>
          <div className="flex-1">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Booking for</p>
              {selectedPet ? (
                  <p className="text-lg font-bold text-gray-900">{selectedPet.name}</p>
              ) : (
                  <select 
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    onChange={async (e) => {
                        const petId = e.target.value;
                        const pet = pets.find(p => (p._id || p.id) === petId);
                        setSelectedPet(pet);
                    }}
                  >
                    <option value="">Select a pet...</option>
                    {pets.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                    ))}
                  </select>
              )}
          </div>
          {selectedPet && (
             <button 
                onClick={() => setSelectedPet(null)}
                className="ml-auto text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50"
             >
                Change Pet
             </button>
          )}
        </div>

        <DateTimeSelection selectedVet={selectedVet} onDateTimeSelect={handleDateTimeSelect} />
        <ConsultationType 
          vet={selectedVet}
          selectedType={selectedConsultationType}
          onSelect={(type, price) => {
            setSelectedConsultationType(type);
            setConsultationPrice(price);
          }}
        />
        <PaymentSection />

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-20 md:static md:bg-transparent md:border-0 md:shadow-none md:p-0">
           <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
             <div className="md:hidden">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">${consultationPrice.toFixed(2)}</p>
             </div>
             <button 
                className={`flex-1 text-white py-3.5 rounded-xl font-bold text-lg transition-colors shadow-lg ${
                  bookingDate && bookingTime && selectedPet
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                disabled={!bookingDate || !bookingTime || !selectedPet}
                onClick={handleConfirmBooking}
              >
                Confirm Booking
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
