import React, { useState } from 'react';
import { FaPaw } from 'react-icons/fa';
import { FiUser, FiMail, FiLock, FiUpload, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import API from '../../api/client';

const RegisterScreen = ({ onNavigate }) => {
  const [role, setRole] = useState('pet-owner');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    license: null
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, license: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const passOk = formData.password && formData.password.length >= 6;
    const confirmOk = formData.password === formData.confirmPassword;
    
    if (!emailOk) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!passOk) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!confirmOk) {
        setError('Passwords do not match.');
        return;
    }

    setIsLoading(true);
    try {
        const { data } = await API.post('/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: role
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('email', data.email);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userId', data._id);

        const dashboard = data.role === 'vet' ? '/vet/dashboard' : '/pet-owner/dashboard';
        onNavigate(dashboard);
    } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <button 
          onClick={() => onNavigate('welcome')}
          className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm font-medium"
        >
          <FiArrowLeft /> Back
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join the PAWMATE community</p>
        </div>

        {/* Role Selection */}
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button
            type="button"
            onClick={() => setRole('pet-owner')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              role === 'pet-owner' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pet Owner
          </button>
          <button
            type="button"
            onClick={() => setRole('vet')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              role === 'vet' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Veterinarian
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
            <FiAlertCircle />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>
          </div>

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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
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
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Vet Specific Fields */}
          {role === 'vet' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vet License / ID</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.png"
                />
                <FiUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {formData.license ? formData.license.name : 'Click to upload license document'}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || (role === 'vet' && !formData.license)}
            className={`w-full py-3 ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold rounded-xl shadow-lg transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('login')}
            className="font-bold text-blue-600 hover:text-blue-500"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
