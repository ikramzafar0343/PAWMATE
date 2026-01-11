import React, { useState, useEffect } from 'react';
import { FiSave, FiDollarSign } from 'react-icons/fi';
import { getCurrentUser, updateCurrentUser } from '../../utils/userStore';

const ConsultationFeesSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState({
    video: 45,
    chat: 30,
    visit: 60
  });

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (user && user.consultationFees) {
          setFees({
            video: user.consultationFees.video || 45,
            chat: user.consultationFees.chat || 30,
            visit: user.consultationFees.visit || 60
          });
        }
      } catch (error) {
        console.error('Error loading fees:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleChange = (e) => {
    setFees({
      ...fees,
      [e.target.name]: parseInt(e.target.value) || 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCurrentUser({
        consultationFees: fees
      });
      alert('Consultation fees updated successfully!');
    } catch (error) {
      console.error('Error updating fees:', error);
      alert('Failed to update fees. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <FiDollarSign className="text-blue-600" />
        Consultation Fees
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Consultation ($)</label>
            <input
              type="number"
              name="video"
              value={fees.video}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chat Consultation ($)</label>
            <input
              type="number"
              name="chat"
              value={fees.chat}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">In-Clinic Visit ($)</label>
            <input
              type="number"
              name="visit"
              value={fees.visit}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FiSave />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultationFeesSettings;
