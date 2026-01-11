import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiCalendar, FiGrid } from 'react-icons/fi';
import { getReminderSettings, updateReminderSettings } from '../../utils/reminderStore';

const VaccinationQuickStats = ({ stats }) => {
  const [reminderSettings, setReminderSettings] = useState(getReminderSettings());

  useEffect(() => {
    const handleUpdate = () => setReminderSettings(getReminderSettings());
    window.addEventListener('reminderSettingsUpdate', handleUpdate);
    return () => window.removeEventListener('reminderSettingsUpdate', handleUpdate);
  }, []);

  const toggleReminders = () => {
    updateReminderSettings({ enabled: !reminderSettings.enabled });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'None';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Current Vaccines */}
      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-600">
          <FiCheckCircle className="w-6 h-6" />
        </div>
        <h3 className="text-3xl font-bold text-emerald-700">{stats?.completed || 0}</h3>
        <p className="text-emerald-800 font-medium text-sm">Current Vaccines</p>
      </div>

      {/* Next Due Date */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-orange-600">
          <FiCalendar className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-orange-700 mb-1">{formatDate(stats?.nextDueDate)}</h3>
        <p className="text-orange-800 font-medium text-sm">Next Due Date</p>
        <p className="text-orange-600/80 text-xs mt-1">{stats?.nextDueName || 'No upcoming vaccines'}</p>
      </div>

      {/* Auto Reminders */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${reminderSettings.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
          <FiGrid className="w-6 h-6" />
        </div>
        <h3 className={`text-lg font-bold mb-1 ${reminderSettings.enabled ? 'text-blue-700' : 'text-gray-500'}`}>
          {reminderSettings.enabled ? 'Auto Reminders Active' : 'Reminders Paused'}
        </h3>
        <p className={`${reminderSettings.enabled ? 'text-blue-600' : 'text-gray-400'} text-xs mb-3`}>
          {reminderSettings.daysBefore} days before
        </p>
        <div 
          className={`relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${reminderSettings.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
          onClick={toggleReminders}
        >
            <span className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${reminderSettings.enabled ? 'translate-x-4' : 'translate-x-0'}`}></span>
        </div>
      </div>
    </div>
  );
};

export default VaccinationQuickStats;
