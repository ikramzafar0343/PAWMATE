import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUser, FiEdit2, FiShield, FiClock, FiDollarSign } from 'react-icons/fi';
import UserProfile from '../components/profile/UserProfile';
import EditProfile from '../components/profile/EditProfile';
import SecuritySettings from '../components/profile/SecuritySettings';
import AvailabilitySettings from '../components/profile/AvailabilitySettings';
import ConsultationFeesSettings from '../components/profile/ConsultationFeesSettings';

const ProfilePage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isVet, setIsVet] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    setIsVet(role === 'vet');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate && onNavigate('home')} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="text-xl text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiUser /> Overview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'edit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiEdit2 /> Edit Profile
            </button>
            {isVet && (
              <>
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'availability'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiClock /> Availability
                </button>
                <button
                  onClick={() => setActiveTab('fees')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'fees'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiDollarSign /> Fees
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'security'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiShield /> Security
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-6">
        {activeTab === 'profile' && <UserProfile onNavigate={onNavigate} />}
        {activeTab === 'edit' && <EditProfile onNavigate={onNavigate} />}
        {activeTab === 'availability' && isVet && <AvailabilitySettings onNavigate={onNavigate} />}
        {activeTab === 'fees' && isVet && <ConsultationFeesSettings />}
        {activeTab === 'security' && <SecuritySettings onNavigate={onNavigate} />}
      </div>
    </div>
  );
};

export default ProfilePage;
