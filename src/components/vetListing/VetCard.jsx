import React from 'react';
import { FiStar, FiMapPin, FiClock, FiCalendar } from 'react-icons/fi';
import { vets as mockVets } from '../../utils/vetData';

const VetCard = ({ vet, onNavigate }) => {
  const mockVet = mockVets.find(m => m.name === vet.name);
  const vetImage = vet.image || mockVet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name || 'Vet')}&background=random`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <img 
          src={vetImage} 
          alt={vet.name} 
          className="w-24 h-24 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{vet.name}</h3>
              <p className="text-blue-600 text-sm font-medium">{vet.specialization || 'General Practice'}</p>
            </div>
            {(vet.rating || vet.reviews) && (
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <FiStar className="text-yellow-400 fill-current w-4 h-4" />
                <span className="font-bold text-gray-900 text-sm">{vet.rating || '4.5'}</span>
                {vet.reviews && <span className="text-gray-400 text-xs">({vet.reviews})</span>}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiMapPin className="w-4 h-4" />
              <span>{vet.clinicName || 'Veterinary Clinic'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiClock className="w-4 h-4" />
              <span className={vet.status === 'active' ? "text-emerald-600 font-medium" : "text-gray-500"}>
                {vet.status === 'active' ? "Available" : vet.status || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button 
          onClick={() => onNavigate && onNavigate('appointment', { vet })}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Book Appointment
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('vetProfile', { vetId: vet._id || vet.id })}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default VetCard;
