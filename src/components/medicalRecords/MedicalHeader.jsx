import React from 'react';
import { FiChevronRight, FiPlus, FiArrowLeft, FiDownload } from 'react-icons/fi';
import { getMedicalRecords } from '../../utils/medicalRecordStore';
import { generateMedicalReport } from '../../utils/pdfGenerator';

const MedicalHeader = ({ pet, onAddRecord }) => {
  const handleDownloadReport = async () => {
    const petId = pet?._id || pet?.id || null;
    let records = [];
    try {
      if (petId) {
        records = await getMedicalRecords(petId);
      }
    } catch {
      records = [];
    }
    generateMedicalReport(records || []);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-start gap-4">
        <button 
            onClick={() => window.history.back()}
            className="mt-1 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
        >
            <FiArrowLeft size={24} />
        </button>
        <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>My Pets</span>
            <FiChevronRight className="w-4 h-4" />
            <span>{pet?.name || 'Pet'}</span>
            <FiChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Medical Records</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-600 text-sm mt-1">Complete health history and treatment records for {pet?.name || 'your pet'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
        >
          <FiDownload />
          Download Report
        </button>
        <button 
          onClick={onAddRecord}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <FiPlus />
          Add Record
        </button>
      </div>
    </div>
  );
};

export default MedicalHeader;
