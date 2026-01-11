import React from 'react';
import { FiShare2, FiDownload } from 'react-icons/fi';
import { getMedicalRecords } from '../../utils/medicalRecordStore';
import { generateMedicalReport } from '../../utils/pdfGenerator';

const RecordsFooter = ({ onNavigate, petId = null }) => {
  const handleDownload = async () => {
    let records = [];
    try {
      if (petId) {
        records = await getMedicalRecords(petId);
      }
    } catch (e) {
      records = [];
    }
    generateMedicalReport(records || []);
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-8 mb-12">
      <div className="flex gap-4 w-full md:w-auto justify-center w-full">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <FiDownload />
          Download All Records
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('vetListing')}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors shadow-blue-200"
        >
          <FiShare2 />
          Share with Vet
        </button>
      </div>
    </div>
  );
};

export default RecordsFooter;
