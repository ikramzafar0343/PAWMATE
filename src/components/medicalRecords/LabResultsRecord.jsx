import React, { useEffect, useState } from 'react';
import { FiDownload, FiCheckCircle } from 'react-icons/fi';
import { FaFlask } from 'react-icons/fa';
import RecordActionMenu from './RecordActionMenu';
import { getVetById } from '../../utils/vetStore';

const LabResultsRecord = ({ data, onEdit, onDelete }) => {
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
          <div className="mt-1 bg-purple-100 p-2 rounded-full h-fit">
            <FaFlask className="text-purple-600 w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-md uppercase">Lab Results</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                <FaFlask className="text-white w-3 h-3" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{displayVet || 'External Laboratory'}</p>
                <p className="text-xs font-bold text-gray-700">{displayClinic || 'Lab'}</p>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 p-4">
               <p className="text-sm text-gray-900">{details.results || details.notes || 'No results available.'}</p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium">
              <FiCheckCircle /> Results available
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
          <button className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
            View Full Report
          </button>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
            <FiDownload /> Download PDF
          </button>
        </div>
        <RecordActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default LabResultsRecord;
