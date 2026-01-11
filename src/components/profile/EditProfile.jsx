import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { getCurrentUser, updateCurrentUser } from '../../utils/userStore';

const EditProfile = () => {
  const role = localStorage.getItem('role') || 'pet-owner';
  const isVet = role === 'vet';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    // Vet-specific fields
    specialization: '',
    clinicName: '',
    experience: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (user) {
          const nameParts = (user.name || '').split(' ');
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            zipCode: user.zipCode || '',
            specialization: user.specialization || '',
            clinicName: user.clinicName || '',
            experience: user.experience || ''
          });
          
          // Update localStorage for backward compatibility
          if (nameParts.length > 0) {
            localStorage.setItem('userFirstName', nameParts[0]);
            localStorage.setItem('userLastName', nameParts.slice(1).join(' ') || '');
          }
          localStorage.setItem('userEmail', user.email || '');
          localStorage.setItem('userImage', user.image || '');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // Fallback to localStorage
        const savedName = localStorage.getItem('userFirstName') || '';
        const savedLastName = localStorage.getItem('userLastName') || '';
        setFormData(prev => ({
          ...prev,
          name: `${savedName} ${savedLastName}`.trim() || 'User',
          email: localStorage.getItem('userEmail') || '',
        }));
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!emailOk) {
      alert('Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
      };

      if (isVet) {
        updateData.specialization = formData.specialization;
        updateData.clinicName = formData.clinicName;
        updateData.experience = formData.experience;
      }

      await updateCurrentUser(updateData);
      
      // Update localStorage
      const nameParts = formData.name.split(' ');
      if (nameParts.length > 0) {
        localStorage.setItem('userFirstName', nameParts[0]);
        localStorage.setItem('userLastName', nameParts.slice(1).join(' ') || '');
      }
      localStorage.setItem('userEmail', formData.email);
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading profile...</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 mb-4">Edit Details</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. +1 234 567 8900"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 123 Pet Street"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. New York"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="e.g. 10001"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {isVet && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select Specialization</option>
                <option value="General Practice">General Practice</option>
                <option value="Surgery">Surgery</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Oncology">Oncology</option>
                <option value="Neurology">Neurology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
                <option value="Behavioral Medicine">Behavioral Medicine</option>
                <option value="Exotic Animals">Exotic Animals</option>
                <option value="Large Animal Medicine">Large Animal Medicine</option>
                <option value="Small Animal Medicine">Small Animal Medicine</option>
                <option value="Avian Medicine">Avian Medicine</option>
                <option value="Reptile Medicine">Reptile Medicine</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
              <input
                type="text"
                name="clinicName"
                value={formData.clinicName}
                onChange={handleChange}
                placeholder="e.g. Animal Care Clinic"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g. 10 years"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default EditProfile;
