import React, { useState } from 'react';
import { FiBell, FiMail, FiMessageSquare, FiSmartphone } from 'react-icons/fi';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    push: {
      vaccinations: true,
      appointments: true,
      promotions: false,
      community: true
    },
    email: {
      vaccinations: true,
      appointments: true,
      newsletters: false
    },
    sms: {
      vaccinations: false,
      appointments: true
    }
  });

  const toggleSetting = (channel, type) => {
    setSettings({
      ...settings,
      [channel]: {
        ...settings[channel],
        [type]: !settings[channel][type]
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <FiBell className="text-blue-600" />
          Push Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(settings.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <button 
                onClick={() => toggleSetting('push', key)}
                className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Email Notifications Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <FiMail className="text-purple-600" />
          Email Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(settings.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <button 
                onClick={() => toggleSetting('email', key)}
                className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Notifications Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <FiSmartphone className="text-green-600" />
          SMS Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(settings.sms).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <button 
                onClick={() => toggleSetting('sms', key)}
                className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
