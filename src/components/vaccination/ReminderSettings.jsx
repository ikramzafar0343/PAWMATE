import React, { useState, useEffect } from 'react';
import { FiGrid, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { getReminderSettings, updateReminderSettings } from '../../utils/reminderStore';

const ReminderSettings = ({ onNavigate }) => {
  const [settings, setSettings] = useState(getReminderSettings());

  useEffect(() => {
    const handleUpdate = () => setSettings(getReminderSettings());
    window.addEventListener('reminderSettingsUpdate', handleUpdate);
    return () => window.removeEventListener('reminderSettingsUpdate', handleUpdate);
  }, []);

  const toggleEnabled = () => {
    updateReminderSettings({ enabled: !settings.enabled });
  };

  const toggleEmail = () => {
    updateReminderSettings({ emailEnabled: !settings.emailEnabled });
  };

  const toggle7DaysBefore = () => {
    updateReminderSettings({ remind7DaysBefore: !settings.remind7DaysBefore });
  };

  const toggleOnDueDate = () => {
    updateReminderSettings({ remindOnDueDate: !settings.remindOnDueDate });
  };

  return (
    <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-blue-800 font-bold text-lg">
          <FiGrid />
          Automatic Reminders
        </div>
        <div 
          className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${settings.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
          onClick={toggleEnabled}
        >
          <span className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${settings.enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
        </div>
      </div>

      <div className={`space-y-2 mb-6 ${!settings.enabled && 'opacity-50 pointer-events-none'}`}>
        <div 
            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-100/50 p-1 rounded transition-colors"
            onClick={toggle7DaysBefore}
        >
          {settings.remind7DaysBefore ? 
            <FiCheckSquare className="text-emerald-500 w-4 h-4" /> : 
            <FiSquare className="text-gray-300 w-4 h-4" />
          }
          <span className={settings.remind7DaysBefore ? 'font-medium text-gray-900' : ''}>7 days before due date</span>
        </div>
        <div 
            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-100/50 p-1 rounded transition-colors"
            onClick={toggleOnDueDate}
        >
          {settings.remindOnDueDate ? 
            <FiCheckSquare className="text-emerald-500 w-4 h-4" /> : 
            <FiSquare className="text-gray-300 w-4 h-4" />
          }
          <span className={settings.remindOnDueDate ? 'font-medium text-gray-900' : ''}>On due date</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700 opacity-75">
          <FiCheckSquare className="text-emerald-500 w-4 h-4" />
          <span>7 days after if overdue (Always active)</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-blue-100">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Email notifications</span>
          <div 
            className={`relative inline-block w-10 h-5 transition duration-200 ease-in-out rounded-full cursor-pointer ${settings.emailEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            onClick={toggleEmail}
          >
            <span className={`absolute left-1 bottom-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out ${settings.emailEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
          </div>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('notifications')}
          className="text-sm text-blue-600 font-medium hover:text-blue-700"
        >
          Manage Notification Settings
        </button>
      </div>
    </div>
  );
};

export default ReminderSettings;
