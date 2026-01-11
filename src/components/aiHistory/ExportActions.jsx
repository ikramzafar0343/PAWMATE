import React from 'react';
import { FiDownload, FiMail } from 'react-icons/fi';

const ExportActions = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4">Export & Share</h3>
      <div className="space-y-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200">
          <FiDownload />
          Download PDF Report
        </button>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-500 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
          <FiMail />
          Email History
        </button>
      </div>
    </div>
  );
};

export default ExportActions;
