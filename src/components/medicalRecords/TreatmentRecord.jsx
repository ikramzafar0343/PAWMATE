import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiEye, FiDownload, FiFileText, FiImage } from 'react-icons/fi';
import { FaStethoscope } from 'react-icons/fa';
import RecordActionMenu from './RecordActionMenu';
import { getVetById } from '../../utils/vetStore';

const TreatmentRecord = ({ data, onEdit, onDelete }) => {
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
          <div className="mt-1 bg-blue-100 p-2 rounded-full h-fit">
            <FaStethoscope className="text-blue-600 w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase">Treatment</span>
            </div>
            <div className="mb-3">
              <p className="text-sm font-bold text-gray-900">{displayVet || 'Veterinarian'}</p>
              <p className="text-xs font-bold text-gray-700">{displayClinic || 'Clinic/Hospital'}</p>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            
            {details.diagnosis && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Diagnosis</p>
                <p className="text-sm text-gray-900">{details.diagnosis}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Treatment Provided</p>
              <p className="text-sm text-gray-900">{details.treatment || details.notes || 'No details provided'}</p>
            </div>
            
            {details.notes && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 italic">
                    {details.notes}
                </p>
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
        <div className="flex gap-4">
          {/* <button className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
            <FiEye /> View Details
          </button>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
            <FiDownload /> Download All
          </button> */}
        </div>
        <RecordActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default TreatmentRecord;
