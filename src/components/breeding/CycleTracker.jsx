import React, { useState, useEffect } from 'react';
import { FiCalendar, FiActivity, FiClock, FiHeart, FiSave } from 'react-icons/fi';
import { getCycleData, updateCycleData, calculateCycleStatus } from '../../utils/breedingStore';

const CycleTracker = ({ petId }) => {
  const [lastHeatDate, setLastHeatDate] = useState('2024-12-01');
  const [cycleLength, setCycleLength] = useState(180); // Default 6 months
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(true);
  
  // Derived state
  const cycleInfo = calculateCycleStatus(lastHeatDate, cycleLength);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getCycleData(petId);
        if (data) {
          setLastHeatDate(data.lastHeatDate || '2024-12-01');
          setCycleLength(data.cycleLength || 180);
          setStatus(data.status || 'Active');
        }
      } catch (error) {
        console.error("Error loading cycle data", error);
      } finally {
        setLoading(false);
      }
    };
    if (petId) {
        loadData();
    }
  }, [petId]);

  const handleSave = async () => {
    try {
        await updateCycleData(petId, {
            lastHeatDate,
            cycleLength,
            status
        });
        alert('Cycle details updated successfully!');
    } catch (error) {
        alert('Failed to update cycle details');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading cycle data...</div>;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Cycle Status: {status}</h2>
            <p className="text-pink-100 opacity-90">Current Phase: {cycleInfo.phase} (Day {cycleInfo.dayOfCycle})</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <FiActivity className="text-2xl" />
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-black/10 rounded-lg p-3">
            <p className="text-xs font-medium text-pink-100 uppercase mb-1">Last Heat</p>
            <p className="font-bold">{new Date(lastHeatDate).toLocaleDateString()}</p>
          </div>
          <div className="bg-black/10 rounded-lg p-3">
            <p className="text-xs font-medium text-pink-100 uppercase mb-1">Next Expected</p>
            <p className="font-bold">{cycleInfo.nextHeatDate}</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <FiClock className="text-pink-500" />
          Update Cycle Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Heat Start Date</label>
            <input 
              type="date" 
              value={lastHeatDate}
              onChange={(e) => setLastHeatDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Average Cycle Length (Days)</label>
            <input 
              type="number" 
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors"
          >
            <FiSave />
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CycleTracker;
