import React from 'react';
import { FiPhone, FiPlus } from 'react-icons/fi';
import { FaTrashAlt } from 'react-icons/fa';

const VetContactsSection = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <FiPhone className="text-blue-500 text-lg" />
          <h2 className="text-lg font-bold text-gray-900">Veterinary Contacts</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <FiPlus />
          Add New Contact
        </button>
      </div>

      <div className="space-y-6">
        {/* Primary Contact */}
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex justify-between items-start mb-4">
            <span className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-md uppercase">Primary</span>
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <FaTrashAlt size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Clinic Name</label>
              <input type="text" defaultValue="Sunshine Animal Hospital" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Doctor Name</label>
              <input type="text" defaultValue="Dr. Sarah Johnson" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input type="text" defaultValue="+1 (555) 123-4567" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <input type="text" defaultValue="123 Pet Street, San Francisco, CA 94102" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Secondary Contact */}
        <div className="p-4 border border-gray-200 rounded-xl bg-white">
          <div className="flex justify-between items-start mb-4">
            <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-md uppercase">Secondary</span>
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <FaTrashAlt size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Clinic Name</label>
              <input type="text" defaultValue="City Veterinary Center" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Doctor Name</label>
              <input type="text" defaultValue="Dr. Michael Chen" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input type="text" defaultValue="+1 (555) 987-6543" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <input type="text" defaultValue="456 Health Ave, San Francisco, CA 94103" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetContactsSection;
