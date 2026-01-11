import React, { useState, useEffect } from 'react';
import { getPredictionStats } from '../../utils/predictionStore';
import { getPets } from '../../utils/petStore';

const StatsOverview = ({ selectedPetId, pets = [] }) => {
  const [stats, setStats] = useState({
    totalScans: 0,
    thisMonth: 0,
    avgConfidence: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        console.log(`[StatsOverview] Loading stats for pet: ${selectedPetId || 'All Pets'}`);
        
        // Use the backend API to calculate stats
        const statsData = await getPredictionStats(selectedPetId);
        
        setStats({
          totalScans: statsData.totalScans || 0,
          thisMonth: statsData.scansThisMonth || 0,
          avgConfidence: statsData.avgConfidence || 0
        });
        
        console.log('[StatsOverview] Stats loaded:', statsData);
      } catch (error) {
        console.error("Error calculating stats:", error);
        // Reset stats on error
        setStats({
          totalScans: 0,
          thisMonth: 0,
          avgConfidence: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
    
    // Listen for updates
    const handleUpdate = () => {
      console.log('[StatsOverview] Update event received, refreshing stats');
      // Delay to ensure backend is updated
      setTimeout(() => loadStats(), 1000);
    };
    
    window.addEventListener('diagnosisUpdate', handleUpdate);
    window.addEventListener('medicalRecordUpdate', handleUpdate);
    
    return () => {
      window.removeEventListener('diagnosisUpdate', handleUpdate);
      window.removeEventListener('medicalRecordUpdate', handleUpdate);
    };
  }, [selectedPetId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Scans Card - Blue */}
      <div className="bg-blue-500 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
        <h3 className="text-5xl font-bold mb-1">
          {loading ? '...' : stats.totalScans}
        </h3>
        <p className="text-blue-100 text-sm font-medium">Total Scans</p>
      </div>

      {/* This Month Card - Green */}
      <div className="bg-emerald-500 rounded-xl p-6 text-white shadow-lg shadow-emerald-200">
        <h3 className="text-5xl font-bold mb-1">
          {loading ? '...' : stats.thisMonth}
        </h3>
        <p className="text-emerald-100 text-sm font-medium">This Month</p>
      </div>

      {/* Avg. Confidence Card - Orange */}
      <div className="bg-amber-500 rounded-xl p-6 text-white shadow-lg shadow-amber-200">
        <h3 className="text-5xl font-bold mb-1">
          {loading ? '...' : `${stats.avgConfidence}%`}
        </h3>
        <p className="text-amber-100 text-sm font-medium">Avg. Confidence</p>
      </div>
    </div>
  );
};

export default StatsOverview;
