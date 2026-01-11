import React, { useState } from 'react';
import { FiLock, FiShield, FiSmartphone } from 'react-icons/fi';

const SecuritySettings = () => {
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiLock className="text-blue-600" />
          Change Password
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button 
            onClick={() => alert('Password updated successfully!')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Update Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FiShield className="text-green-600" />
            Two-Factor Authentication
          </h3>
          <button 
            onClick={() => setTwoFactor(!twoFactor)}
            className={`w-12 h-6 rounded-full transition-colors relative ${twoFactor ? 'bg-green-600' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your account by enabling 2FA. We'll send a code to your phone when you log in.
        </p>
        {twoFactor && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
            <FiSmartphone />
            2FA is currently enabled for +1 (555) ***-4567
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
