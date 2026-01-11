import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  SystemOverview,
  SystemAnalytics as AnalyticsCard,
  RealTimeActivity,
  QuickStatsAndActions,
  MarketplaceModeration
} from '../components/adminDashboard/AdminComponents';
import UserManagement from '../components/admin/UserManagement';
import ReportedContent from '../components/admin/ReportedContent';
import SystemAnalytics from '../components/admin/SystemAnalytics';

const AdminDashboard = () => {
  const { pathname } = useLocation();

  if (pathname.includes('/users')) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">User Management</h1>
          <UserManagement />
        </div>
      </div>
    );
  }

  if (pathname.includes('/reported-content')) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Reported Content</h1>
          <ReportedContent />
        </div>
      </div>
    );
  }

  if (pathname.includes('/marketplace-moderation')) {
    return <Navigate to="/admin/users" replace />;
  }

  if (pathname.includes('/system-logs')) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">System Logs & Analytics</h1>
          <SystemAnalytics />
        </div>
      </div>
    );
  }

  if (pathname.includes('/analytics')) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Analytics</h1>
          <AnalyticsCard />
          <div className="mt-8">
            <QuickStatsAndActions />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SystemOverview />
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnalyticsCard />
          <RealTimeActivity />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mt-8">
          <QuickStatsAndActions />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
