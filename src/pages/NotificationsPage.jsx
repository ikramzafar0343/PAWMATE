import React, { useState } from 'react';
import { FiArrowLeft, FiBell, FiSettings } from 'react-icons/fi';
import NotificationList from '../components/notifications/NotificationList';
import NotificationSettings from '../components/notifications/NotificationSettings';

const NotificationsPage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate ? onNavigate('home') : window.history.back()} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="text-xl text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            </div>
          </div>

          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiBell /> Alerts
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiSettings /> Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-6">
        {activeTab === 'list' ? (
          <NotificationList onNavigate={onNavigate} />
        ) : (
          <NotificationSettings />
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
