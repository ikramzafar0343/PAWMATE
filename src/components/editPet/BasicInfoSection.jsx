import React from 'react';
import { FaPaw } from 'react-icons/fa';
import { FiCalendar, FiInfo } from 'react-icons/fi';

const BasicInfoSection = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <FaPaw className="text-blue-500 text-lg" />
        <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
      </div>

      {/* Photo Upload */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative mb-3">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 shadow-inner">
            <img 
              src="https://placehold.co/150x150/e2e8f0/1e293b?text=Max" 
              alt="Pet" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <button className="text-blue-600 font-medium hover:text-blue-700">Change Photo</button>
          <span className="text-gray-300">|</span>
          <button className="text-red-500 font-medium hover:text-red-600">Remove</button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name*</label>
          <input 
            type="text" 
            defaultValue="Max"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Species*</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option>Dog</option>
            <option>Cat</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <input 
            type="text" 
            defaultValue="Golden Retriever"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender*</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gender" defaultChecked className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Male</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gender" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Female</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gender" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Unknown</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth*</label>
          <div className="relative">
            <input 
              type="text" 
              defaultValue="March 15, 2021"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color/Markings</label>
          <input 
            type="text" 
            defaultValue="Golden cream coat"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              defaultValue="32"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <select className="w-20 px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
              <option>kg</option>
              <option>lbs</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            Microchip ID <FiInfo className="text-gray-400" />
          </label>
          <input 
            type="text" 
            defaultValue="982000123456789"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
