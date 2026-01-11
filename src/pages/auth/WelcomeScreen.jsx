import React from 'react';
import { FaPaw } from 'react-icons/fa';
import { FiActivity, FiSearch, FiCalendar, FiShoppingBag } from 'react-icons/fi';

const WelcomeScreen = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto space-y-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-down">
          <div className="bg-white p-4 rounded-full shadow-lg">
            <FaPaw className="text-6xl text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            PAWMATE
            <span className="text-blue-600">.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Your all-in-one companion for pet care, health tracking, and community.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <FiActivity className="text-xl" />
            </div>
            <span className="text-sm font-bold text-gray-700">AI Detection</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <FiSearch className="text-xl" />
            </div>
            <span className="text-sm font-bold text-gray-700">Find Vets</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
              <FiCalendar className="text-xl" />
            </div>
            <span className="text-sm font-bold text-gray-700">Bookings</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <FiShoppingBag className="text-xl" />
            </div>
            <span className="text-sm font-bold text-gray-700">Marketplace</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
          <button 
            onClick={() => onNavigate('register')}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            Get Started
          </button>
          <button 
            onClick={() => onNavigate('login')}
            className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-all"
          >
            I already have an account
          </button>
        </div>
      </div>
      
      <div className="mt-12 text-sm text-gray-400">
        © 2026 PAWMATE. All rights reserved.
      </div>
    </div>
  );
};

export default WelcomeScreen;
