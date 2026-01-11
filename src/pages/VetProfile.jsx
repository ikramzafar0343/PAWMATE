import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVetById } from '../utils/vetStore';
import { vets as mockVets } from '../utils/vetData';
import { FiMapPin, FiCalendar } from 'react-icons/fi';

export default function VetProfile() {
  const { vetId } = useParams();
  const navigate = useNavigate();
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVet = async () => {
      try {
        const vetData = await getVetById(vetId);
        setVet(vetData);
      } catch (error) {
        console.error("Error loading vet", error);
      } finally {
        setLoading(false);
      }
    };
    loadVet();
  }, [vetId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading veterinarian profile...</p>
        </div>
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-700 font-medium">Veterinarian not found.</p>
            <button
              onClick={() => navigate('/pet-owner/vets')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
            >
              Back to Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mockVet = mockVets.find(m => m.name === vet.name);
  const vetImage = vet.image || mockVet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name || 'Vet')}&background=random`;

  const services = [
    'General Checkup',
    'Vaccinations',
    'Dermatology Consultation',
    'Dental Care',
    'Surgery Consultation',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/pet-owner/vets')}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Back
          </button>
          <h1 className="font-bold text-gray-900">Vet Profile</h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-6">
            <img src={vetImage} alt={vet.name} className="w-28 h-28 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{vet.name}</h2>
                  <p className="text-blue-600 font-medium">{vet.specialization}</p>
                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <FiMapPin /> {vet.clinicName || 'Veterinary Clinic'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className={`mt-2 text-xs font-bold px-2 py-1 rounded-full ${vet.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {vet.status === 'active' ? 'Available' : vet.status || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate(`/pet-owner/appointments/book/${vet._id || vet.id}`, { state: { vet } })}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                >
                  <FiCalendar /> Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">About</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Experienced veterinarian specializing in {vet.specialization.toLowerCase()}. Passionate about preventive care, timely diagnosis, and compassionate treatment.
                Provides clear guidance and follows best practices for pet health and wellness.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((s, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">Clinic Details</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between"><span>Clinic</span><span className="font-medium">{vet.clinicName || 'N/A'}</span></div>
                <div className="flex justify-between"><span>Specialization</span><span className="font-medium">{vet.specialization || 'General Practice'}</span></div>
                {vet.experience && (
                  <div className="flex justify-between"><span>Experience</span><span className="font-medium">{vet.experience}</span></div>
                )}
              </div>
            </div>

            {vet.availability && Array.isArray(vet.availability) && vet.availability.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Available Time Slots</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {vet.availability.map((slot, index) => {
                    // Handle both legacy string format and new object format
                    let displayText = '';
                    if (typeof slot === 'string') {
                      displayText = slot;
                    } else if (slot && slot.start && slot.end) {
                      // Convert 24-hour format to 12-hour format for display
                      const formatTime = (time24) => {
                        const [hours, minutes] = time24.split(':');
                        const hour = parseInt(hours);
                        const period = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = hour % 12 || 12;
                        return `${hour12}:${minutes} ${period}`;
                      };
                      displayText = `${formatTime(slot.start)} – ${formatTime(slot.end)}`;
                    }
                    
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{displayText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
