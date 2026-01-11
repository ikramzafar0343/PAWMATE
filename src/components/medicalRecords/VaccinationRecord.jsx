import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiEye, FiDownload } from 'react-icons/fi';
import { FaSyringe } from 'react-icons/fa';
import RecordActionMenu from './RecordActionMenu';
import { getVetById } from '../../utils/vetStore';

const VaccinationRecord = ({ data, onEdit, onDelete }) => {
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
  const imageAttachments = Array.isArray(data?.attachments)
    ? data.attachments.filter(a => typeof a === 'string' && a.startsWith('data:image'))
    : [];

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="mt-1 bg-emerald-100 p-2 rounded-full">
            <FaSyringe className="text-emerald-600 w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase">Vaccination</span>
            </div>
            <div className="mb-3">
              <p className="text-sm font-bold text-gray-900">{displayVet || 'Veterinarian'}</p>
              <p className="text-xs font-bold text-gray-700">{displayClinic || 'Clinic/Hospital'}</p>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Vaccine</p>
                <p className="font-medium text-gray-900">{details.vaccine || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Batch Number</p>
                <p className="font-medium text-gray-900">{details.batchNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Next Due</p>
                <p className="font-medium text-gray-900">{details.nextDue || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Side Effects</p>
                <p className="font-medium text-gray-900">{details.sideEffects || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900 mb-1">{date}</div>
          <div className="text-xs text-gray-500">{time}</div>
        </div>
      </div>

      {imageAttachments.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageAttachments.map((img, idx) => (
              <a
                key={idx}
                href={img}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-200 hover:shadow"
              >
                <img src={img} alt="Attachment" className="w-full h-24 object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex gap-4">
          {/* <button className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
            <FiEye /> View Certificate
          </button>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
            <FiDownload /> Download
          </button> */}
        </div>
        <RecordActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default VaccinationRecord;
