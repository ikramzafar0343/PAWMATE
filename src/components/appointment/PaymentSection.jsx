import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign } from 'react-icons/fi';

const PaymentSection = () => {
  const [method, setMethod] = useState('card');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 text-lg">Payment Method (Optional)</h3>
        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded">Secure</span>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setMethod('card')}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${
            method === 'card'
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FiCreditCard className="text-2xl mb-2" />
          <span className="text-sm font-bold">Credit Card</span>
        </button>
        <button
          onClick={() => setMethod('pay_at_clinic')}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${
            method === 'pay_at_clinic'
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FiDollarSign className="text-2xl mb-2" />
          <span className="text-sm font-bold">Pay at Clinic</span>
        </button>
      </div>

      {method === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input 
              type="text" 
              placeholder="0000 0000 0000 0000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input 
                type="text" 
                placeholder="MM/YY"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
              <input 
                type="text" 
                placeholder="123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSection;
