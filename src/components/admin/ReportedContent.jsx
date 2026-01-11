import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiTrash2, FiEye, FiCheck } from 'react-icons/fi';
import { getReports, resolveReport } from '../../utils/adminStore';

const ReportedContent = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const allReports = await getReports();
      // Transform adminStore reports to match component format
      const transformed = allReports.filter(r => r.status !== 'resolved').map((r, idx) => ({
        id: r._id,
        type: r.targetType || 'Content',
        reporter: `User`, // In real app, populate reporter
        reason: r.priority === 'High' ? 'Urgent' : r.title,
        content: r.title,
        time: new Date(r.createdAt).toLocaleDateString(),
        status: r.status || 'pending'
      }));
      setReports(transformed);
    } catch (error) {
      console.error("Error fetching reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismiss = async (id) => {
    try {
      await resolveReport(id);
      fetchReports();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAction = async (id) => {
    try {
      await resolveReport(id); // For now, just resolve it. In future, delete target content.
      alert(`Action taken on report #${id}`);
      fetchReports();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-6">
      {reports.map((report) => (
        <div key={report.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase tracking-wider">
                {report.type}
              </span>
              <span className="text-xs text-gray-400">{report.time}</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1">
                <FiEye /> View
              </button>
              <button 
                onClick={() => handleAction(report.id)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          </div>
          
          <h4 className="font-bold text-gray-900 mb-2">Reported by {report.reporter}</h4>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
            <div className="text-xs font-medium text-gray-500 mb-1 uppercase">Reason: {report.reason}</div>
            <p className="text-gray-800 text-sm">{report.content}</p>
          </div>
          
          <div className="flex gap-2">
            <button 
                onClick={() => handleDismiss(report.id)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <FiCheck /> Dismiss Report
            </button>
            <button 
                onClick={() => handleAction(report.id)}
                className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <FiAlertTriangle /> Take Action
            </button>
          </div>
        </div>
      ))}
      
      {reports.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FiAlertTriangle className="mx-auto text-4xl mb-4 text-gray-300" />
          <p>No active reports</p>
        </div>
      )}
    </div>
  );
};

export default ReportedContent;
