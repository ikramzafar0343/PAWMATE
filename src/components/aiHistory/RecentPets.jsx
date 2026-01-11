import React, { useEffect, useState } from 'react';
import { FaPaw } from 'react-icons/fa';
import { getPets } from '../../utils/petStore';
import { getMedicalRecords, MEDICAL_RECORD_TYPES } from '../../utils/medicalRecordStore';

const RecentPets = () => {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const pets = await getPets();
        const results = [];
        for (const p of pets) {
          const records = await getMedicalRecords(p._id || p.id);
          const ai = (records || []).find(r => r.type === MEDICAL_RECORD_TYPES.AI_DIAGNOSIS);
          if (ai) {
            results.push({
              id: ai._id || ai.id,
              name: p.name,
              type: p.breed || 'Pet',
              time: ai.date || '',
              img: p.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'P')}&background=random`
            });
          }
        }
        setRecent(results.slice(0, 4));
      } catch (e) {
        console.error('Error loading recent pets', e);
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    window.addEventListener('medicalRecordUpdate', loadData);
    return () => window.removeEventListener('medicalRecordUpdate', loadData);
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FaPaw className="text-blue-500" />
        <h3 className="font-bold text-gray-900">Recently Analyzed Pets</h3>
      </div>
      
      <div className="space-y-4">
        {!loading && recent.map((pet) => (
          <div key={pet.id} className="flex items-center gap-3">
            <img src={pet.img} alt={pet.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900">{pet.name}</h4>
              <p className="text-xs text-gray-500">{pet.type}</p>
            </div>
            <span className="text-xs text-gray-400">{pet.time}</span>
          </div>
        ))}
        {loading && <div className="text-center text-xs text-gray-500">Loading...</div>}
        {!loading && recent.length === 0 && <div className="text-center text-xs text-gray-500">No recent AI analyses</div>}
      </div>
    </div>
  );
};

export default RecentPets;
