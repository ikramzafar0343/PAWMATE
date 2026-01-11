import React from 'react';
import { FiEye } from 'react-icons/fi';
import { FaFileMedicalAlt } from 'react-icons/fa';
import RecordActionMenu from './RecordActionMenu';

const VetNotesRecord = ({ data, onEdit, onDelete }) => {
  if (!data) return null;
  const { date, time, vetName, clinicName, title, details } = data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 w-full">
          <div className="mt-1 bg-gray-100 p-2 rounded-full h-fit">
            <FaFileMedicalAlt className="text-gray-600 w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-md uppercase">Vet Notes</span>
            </div>
            <div className="mb-3">
              <p className="text-sm font-bold text-gray-900">{vetName || 'Veterinarian'}</p>
              <p className="text-xs font-bold text-gray-700">{clinicName || 'Clinic/Hospital'}</p>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="font-medium text-gray-900">{details.notes || 'No notes available.'}</p>
              </div>
            </div>

            {details.recommendations && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-600 font-bold mb-1">Recommendations</p>
                <p className="text-sm text-blue-800">{details.recommendations}</p>
                </div>
            )}
          </div>
        </div>
        <div className="text-right whitespace-nowrap ml-4">
          <div className="text-sm font-bold text-gray-900 mb-1">{date}</div>
          <div className="text-xs text-gray-500">{time}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <button className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
          <FiEye /> View Full Notes
        </button>
        <RecordActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default VetNotesRecord;
