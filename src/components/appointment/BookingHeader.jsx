import React from 'react';
import { FiArrowLeft, FiStar, FiMapPin } from 'react-icons/fi';
import { vets as mockVets } from '../../utils/vetData';

const BookingHeader = ({ onBack, vet }) => {
  if (!vet) return null;
  const mockVet = mockVets.find(m => m.name === vet.name);
  const vetImage = vet.image || mockVet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name || 'Vet')}&background=random`;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-xl text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Book Appointment</h1>
        </div>

        <div className="flex gap-4 items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
          <img 
            src={vetImage} 
            alt={vet.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{vet.name}</h2>
            <p className="text-blue-600 font-medium text-sm mb-1">{vet.specialization}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FiStar className="text-yellow-400 fill-current" /> {vet.rating} ({vet.reviews})
              </span>
              <span className="flex items-center gap-1">
                <FiMapPin /> {vet.location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingHeader;
