import React, { useState, useRef, useEffect } from 'react';
import { FiCheckCircle, FiMoreVertical, FiCalendar, FiTrash2 } from 'react-icons/fi';

const CompletedVaccineCard = ({ data, onDelete }) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="bg-emerald-100 p-2.5 rounded-full h-fit">
            <FiCheckCircle className="text-emerald-600 w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" /> Completed
              </span>
              <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {data.petName}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{data.vaccineName}</h3>
            <div className="flex items-center gap-2 mt-2">
              <img src="https://placehold.co/100x100/e2e8f0/1e293b?text=Vet" className="w-6 h-6 rounded-full" alt="Vet" />
              <div>
                <p className="text-xs font-bold text-gray-900">{data.vetName || 'Unknown Doctor'}</p>
                <p className="text-[10px] text-gray-500">{data.clinicName || 'Unknown Clinic'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900">{formatDate(data.completedDate || new Date())}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">Vaccine Type</p>
          <p className="font-bold text-gray-900 text-sm">{data.vaccineName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Batch Number</p>
          <p className="font-medium text-gray-900 text-sm">{data.batchNumber || `RB-${new Date().getFullYear()}-${data.id}`}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Administered</p>
          <p className="font-medium text-gray-900 text-sm">{formatDate(data.completedDate || new Date())}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Next Due</p>
          <div className="flex items-center gap-1.5 font-medium text-gray-900 text-sm">
            <FiCalendar className="text-gray-400 w-3.5 h-3.5" />
            {data.nextDue ? formatDate(data.nextDue) : 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-gray-100">
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

export default CompletedVaccineCard;
