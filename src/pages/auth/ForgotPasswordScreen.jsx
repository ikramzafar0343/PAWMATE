import React, { useState } from 'react';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const ForgotPasswordScreen = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <button 
          onClick={() => onNavigate('login')}
          className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm font-medium"
        >
          <FiArrowLeft /> Back to Login
        </button>

        {!isSubmitted ? (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
              <p className="text-gray-500 mt-2">Enter your email to receive reset instructions</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
              >
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle className="text-4xl text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
              <p className="text-gray-500 mt-2">
                We've sent password reset instructions to <span className="font-semibold text-gray-900">{email}</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
