import React from 'react';
import { FiVideo, FiMessageSquare, FiMapPin, FiFileText, FiClock, FiStar } from 'react-icons/fi';

const HistoryCard = ({ consultation, onNavigate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      case 'Follow-up': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video Call': return <FiVideo />;
      case 'Chat': return <FiMessageSquare />;
      case 'In-Clinic': return <FiMapPin />;
      default: return <FiFileText />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex gap-4">
          <img 
            src={consultation.vetImage || `https://ui-avatars.com/api/?name=${encodeURIComponent((consultation.vetName || 'Dr').replace(/\s+/g, '+'))}&background=random&size=128`} 
            alt={consultation.vetName} 
            className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
            onError={(e) => {
              // Fallback to avatar if image fails to load
              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent((consultation.vetName || 'Dr').replace(/\s+/g, '+'))}&background=random&size=128`;
              if (e.target.src !== fallbackUrl) {
                e.target.src = fallbackUrl;
              }
            }}
          />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{consultation.vetName}</h3>
            <p className="text-sm text-blue-600 font-medium">{consultation.specialization}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 font-medium ${getStatusColor(consultation.status)}`}>
                {consultation.status}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {getTypeIcon(consultation.type)}
                {consultation.type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-bold text-gray-900">Diagnosis: {consultation.diagnosis}</p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <FiClock className="text-gray-400" />
                {consultation.date} • {consultation.time}
              </p>
            </div>
            {consultation.rating && (
              <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-50 px-2 py-1 rounded-md">
                <FiStar className="fill-current" />
                {consultation.rating}
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {consultation.notes}
          </p>

          {consultation.prescription && (
            <div className="mt-4">
              <button 
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('prescription');
                  } else {
                    window.location.href = '/pet-owner/prescriptions';
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiFileText />
                Prescription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
