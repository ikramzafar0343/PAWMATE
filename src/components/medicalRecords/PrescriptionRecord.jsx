import React, { useEffect, useState } from 'react';
import { FiEye } from 'react-icons/fi';
import { FaPills } from 'react-icons/fa';
import RecordActionMenu from './RecordActionMenu';
import { getVetById } from '../../utils/vetStore';

const PrescriptionRecord = ({ data, onEdit, onDelete }) => {
  const date = data?.date;
  const time = data?.time;
  const title = data?.title;
  const details = data?.details || {};
  const [displayVet, setDisplayVet] = useState(data?.vetName || details?.vetName || '');
  const [displayClinic, setDisplayClinic] = useState(data?.clinicName || details?.clinicName || '');

  useEffect(() => {
    const id = data?.vetId?._id || data?.vetId?.id || data?.vetId;
    if ((!displayVet || !displayClinic) && id) {
      getVetById(String(id)).then(v => {
        if (v) {
          setDisplayVet(v.name || v.fullName || v.email || displayVet);
          setDisplayClinic(v.clinicName || displayClinic);
        }
      }).catch(() => {});
    }
  }, [data, displayVet, displayClinic]);

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 w-full">
          <div className="mt-1 bg-orange-100 p-2 rounded-full h-fit">
            <FaPills className="text-orange-600 w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-md uppercase">Prescription</span>
            </div>
            <div className="mb-3">
              <p className="text-sm font-bold text-gray-900">{displayVet || 'Veterinarian'}</p>
              <p className="text-xs font-bold text-gray-700">{displayClinic || 'Pharmacy'}</p>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            
            <div className="bg-orange-50 rounded-xl p-4 mb-4 flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <FaPills className="text-orange-500 w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{details.medication || title}</h4>
                    <p className="text-sm text-gray-600">{details.dosage} {details.instructions && `- ${details.instructions}`}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-2 text-sm">
                   <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{details.duration || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div className="text-right whitespace-nowrap ml-4">
          <div className="text-sm font-bold text-gray-900 mb-1">{date}</div>
          <div className="text-xs text-gray-500">{time}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="flex gap-4">
          {/* <button className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
            Request Refill
          </button>
          <button className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Set Reminder
          </button>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 ml-2">
            <FiEye /> View Details
          </button> */}
        </div>
        <RecordActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default PrescriptionRecord;
