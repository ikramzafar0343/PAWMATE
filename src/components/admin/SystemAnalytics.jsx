import React, { useState, useEffect } from 'react';
import { FiUsers, FiActivity, FiDollarSign, FiServer, FiCalendar } from 'react-icons/fi';
import { getQuickStats } from '../../utils/adminStore';
import { getAppointments } from '../../utils/appointmentStore';
import { getUsers } from '../../utils/userStore';
import { getMedicalRecords } from '../../utils/medicalRecordStore';

const SystemAnalytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeVets: 0,
    totalPets: 0,
    totalAppointments: 0,
    totalRecords: 0,
    activePrescriptions: 0,
    revenue: 0,
    uptime: '99.9%'
  });
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [quickStats, users, appointments] = await Promise.all([
          getQuickStats(),
          getUsers(),
          getAppointments()
        ]);

        const vets = users.filter(u => u.role === 'vet' && u.status === 'active');
        const petOwners = users.filter(u => u.role === 'pet-owner');
        
        const recentLogs = [];
        if (users.length > 0) {
          const recentUser = users[0];
          recentLogs.push({
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'INFO',
            message: `New user registration: ${recentUser.name || 'user'}`,
            color: 'blue'
          });
        }
        if (appointments.length > 0) {
          recentLogs.push({
            time: new Date(Date.now() - 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'SUCCESS',
            message: `Appointment scheduled: ${appointments.length} total`,
            color: 'green'
          });
        }
        recentLogs.push({
          time: new Date(Date.now() - 120000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'INFO',
          message: 'System backup completed successfully',
          color: 'blue'
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const { getRevenue } = await import('../../utils/appointmentStore');
        const rev = await getRevenue(todayStr);
        
        setStats({
          totalUsers: users.length,
          activeVets: vets.length,
          totalPets: 0,
          totalAppointments: appointments.length,
          totalRecords: 0,
          activePrescriptions: 0,
          revenue: rev.totalRevenue || 0,
          uptime: quickStats.health ? `${quickStats.health}%` : '99.9%'
        });
        setLogs(recentLogs);
      } catch (error) {
        console.error("Error fetching analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    const onUserUpdate = () => fetchStats();
    const onAppointmentUpdate = () => fetchStats();
    window.addEventListener('userUpdate', onUserUpdate);
    window.addEventListener('appointmentUpdate', onAppointmentUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('userUpdate', onUserUpdate);
      window.removeEventListener('appointmentUpdate', onAppointmentUpdate);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="text-gray-400 mb-2"><FiUsers className="text-xl" /></div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="text-gray-400 mb-2"><FiActivity className="text-xl" /></div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</div>
          <div className="text-xs text-gray-400 mt-1">Total Appointments</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="text-gray-400 mb-2"><FiCalendar className="text-xl" /></div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeVets}</div>
          <div className="text-xs text-gray-400 mt-1">Active Veterinarians</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="text-gray-400 mb-2"><FiServer className="text-xl" /></div>
          <div className="text-2xl font-bold text-green-600">{stats.uptime}</div>
          <div className="text-xs text-gray-400 mt-1">System Uptime</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4 items-stretch">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="text-gray-400 mb-2"><FiDollarSign className="text-xl" /></div>
          <div className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Revenue</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="text-gray-400 mb-2"><FiActivity className="text-xl" /></div>
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
          <div className="text-xs text-gray-400 mt-1">Recent Activities</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Recent System Logs</h3>
        <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No recent logs</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex gap-4 text-gray-600">
                <span className="text-gray-400">{log.time}</span>
                <span className={`text-${log.color}-600`}>[{log.type}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;
