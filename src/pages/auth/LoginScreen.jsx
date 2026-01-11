import React, { useState } from 'react';
import { FaPaw, FaUser, FaStethoscope, FaShieldAlt } from 'react-icons/fa';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import API from '../../api/client';

const LoginScreen = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data } = await API.post('/auth/login', formData);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', data.email);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userId', data._id);
      if(data.image) localStorage.setItem('userImage', data.image);

      // Trigger data refresh events for all components
      window.dispatchEvent(new Event('userLogin'));
      window.dispatchEvent(new Event('petUpdate'));
      window.dispatchEvent(new Event('appointmentUpdate'));
      window.dispatchEvent(new Event('medicalRecordUpdate'));

      let dashboardRoute = '/dashboard';
      if (data.role === 'vet') dashboardRoute = '/vet/dashboard';
      if (data.role === 'admin') dashboardRoute = '/admin/dashboard';
      
      onNavigate(dashboardRoute);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Invalid email or password. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
     // For demo purposes, we can pre-fill, but we should probably use real login
     // Or we can keep a "Quick Login" that hits the API with hardcoded demo creds if they exist in DB
     // For now, let's just fill the form
     const demoCreds = {
         'pet-owner': { email: 'owner@pawmate.com', password: 'password123' },
         'vet': { email: 'vet@pawmate.com', password: 'password123' },
         'admin': { email: 'admin@pawmate.com', password: 'password123' }
     };
     const creds = demoCreds[role];
     if(creds) {
         setFormData(creds);
     }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <FaPaw className="text-3xl text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to continue to PAWMATE</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
            <FiAlertCircle />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button 
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.email || !formData.password}
            className={`w-full py-3 ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials (Optional) */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            type="button"
            onClick={() => handleDemoLogin('pet-owner')}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            <FaUser className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-gray-600">Owner</span>
          </button>
          <button 
            type="button"
            onClick={() => handleDemoLogin('vet')}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all group"
          >
            <FaStethoscope className="text-green-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-gray-600">Vet</span>
          </button>
          <button 
            type="button"
            onClick={() => handleDemoLogin('admin')}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all group"
          >
            <FaShieldAlt className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-gray-600">Admin</span>
          </button>
        </div>

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button 
            onClick={() => onNavigate('register')}
            className="font-bold text-blue-600 hover:text-blue-500"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
