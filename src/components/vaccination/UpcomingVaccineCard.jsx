import React, { useState, useRef, useEffect } from 'react';
import { FiClock, FiMoreVertical, FiCalendar, FiMapPin, FiBell, FiTrash2 } from 'react-icons/fi';

const UpcomingVaccineCard = ({ data, onNavigate, onMarkDone, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!data) return null;
  
  const isOverdue = data.status === 'Overdue';
  const statusColor = isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
  const iconColor = isOverdue ? 'text-red-600' : 'text-orange-600';
  const bgIconColor = isOverdue ? 'bg-red-100' : 'bg-orange-100';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${isOverdue ? 'border-red-500' : 'border-orange-400'} border-y border-r border-gray-200 p-6 mb-4 relative`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className={`${bgIconColor} p-2.5 rounded-full h-fit`}>
            <FiClock className={`${iconColor} w-5 h-5`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 ${statusColor} text-xs font-bold rounded-md uppercase flex items-center gap-1`}>
                <FiClock className="w-3 h-3" /> {data.status}
              </span>
              <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {data.petName}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{data.vaccineName}</h3>
            <p className={`${iconColor} font-bold text-sm mt-1`}>Due: {formatDate(data.dueDate)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900">{formatDate(data.dueDate)}</div>
        </div>
      </div>

      <div className="pl-0 md:pl-[68px] mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FiMapPin className="w-4 h-4 text-gray-400" />
          <span>
            {data.vetName && data.clinicName 
              ? `${data.vetName} - ${data.clinicName}`
              : data.vetName || data.clinicName || 'Unknown Clinic'
            }
          </span>
        </div>
      </div>

      <div className="pl-0 md:pl-[68px] mb-6">
        <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 inline-flex w-full md:w-auto">
          <FiBell className="w-4 h-4" />
          Reminder active
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 pl-0 md:pl-[68px]">
        <div className="flex gap-4">
          <button 
            onClick={() => onMarkDone && onMarkDone(data.id)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-sm transition-colors shadow-emerald-200"
          >
            Mark as Administered
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('appointment')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Schedule Appointment
          </button>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete && onDelete();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete Record
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingVaccineCard;
