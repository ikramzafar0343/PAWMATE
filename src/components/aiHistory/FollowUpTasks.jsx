import React, { useEffect, useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { getPrescriptions } from '../../utils/prescriptionStore';

const FollowUpTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const all = await getPrescriptions(null, 'active');
        const mapped = all.slice(0, 6).map(p => ({
          id: p._id || p.id,
          text: `Take ${p.medication} • ${p.dosage} (${p.duration})`
        }));
        setTasks(mapped);
      } catch (e) {
        console.error('Error loading follow-up tasks', e);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
    window.addEventListener('prescriptionUpdate', loadTasks);
    return () => window.removeEventListener('prescriptionUpdate', loadTasks);
  }, []);

  return (
    <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FiAlertCircle className="text-amber-500" />
        <h3 className="font-bold text-gray-900">Pending Follow-ups</h3>
      </div>
      
      <div className="space-y-3">
        {!loading && tasks.map((task) => (
          <label key={task.id} className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700 leading-tight">{task.text}</span>
          </label>
        ))}
        {loading && <div className="text-center text-xs text-gray-500">Loading...</div>}
        {!loading && tasks.length === 0 && <div className="text-center text-xs text-gray-500">No active tasks</div>}
      </div>
    </div>
  );
};

export default FollowUpTasks;
