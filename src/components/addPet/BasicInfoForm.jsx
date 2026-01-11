import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

const BasicInfoForm = ({ formData, handleInputChange, handleGenderSelect }) => {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name*</label>
          <input
            type="text"
            name="petName"
            value={formData.petName}
            onChange={handleInputChange}
            placeholder="Enter your pet's name"
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Species*</label>
          <div className="relative">
            <select
              name="species"
              value={formData.species}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 appearance-none text-gray-500"
            >
              <option value="">Select species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="other">Other</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleInputChange}
            placeholder="Enter breed"
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age*</label>
          <div className="relative">
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">years</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender*</label>
          <div className="flex gap-2">
            {['Male', 'Female', 'Unknown'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGenderSelect(g)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                  formData.gender === g
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
          <div className="flex">
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 border-r-0"
            />
            <select 
              name="weightUnit"
              value={formData.weightUnit}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-200 rounded-r-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color/Markings</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            placeholder="Describe appearance"
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </div>
    </section>
  );
};

export default BasicInfoForm;
