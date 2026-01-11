import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiFileText, FiActivity, FiClipboard, FiChevronRight, FiPlus } from 'react-icons/fi';
import { getPrescriptions, getActivePrescription } from '../../utils/prescriptionStore';
import { getPets } from '../../utils/petStore';
import { getMedicalRecords } from '../../utils/medicalRecordStore';
import AddPrescriptionModal from './AddPrescriptionModal';

const SharedRecords = ({ onNavigate, consultationData, petId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role') || 'pet-owner';
  const isVet = role === 'vet';
  
  const [activePrescription, setActivePrescription] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);

  useEffect(() => {
    const loadPrescription = async () => {
      // Determine pet ID
      let targetPetId = petId;
      if (!targetPetId && consultationData) {
        targetPetId = consultationData.petId;
      }
      if (!targetPetId) {
        // Try to get from consultation/appointment
        const pets = await getPets();
        if (pets.length > 0) {
          targetPetId = pets[0]._id || pets[0].id;
        }
      }
      
      setCurrentPetId(targetPetId);
      
      if (targetPetId) {
        const prescription = await getActivePrescription(targetPetId);
        setActivePrescription(prescription);
      }
    };

    loadPrescription();
    
    const handleUpdate = () => loadPrescription();
    window.addEventListener('prescriptionUpdate', handleUpdate);
    
    return () => {
      window.removeEventListener('prescriptionUpdate', handleUpdate);
    };
  }, [petId, consultationData]);

  const [records, setRecords] = useState([]);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        // Determine pet ID similar to prescription
        let targetPetId = petId;
        if (!targetPetId && consultationData) {
          targetPetId = consultationData.petId;
        }
        if (!targetPetId) {
          const pets = await getPets();
          if (pets.length > 0) {
            targetPetId = pets[0]._id || pets[0].id;
          }
        }
        const all = await getMedicalRecords(targetPetId);
        const latest = (all || []).slice(0, 3).map((r, idx) => {
          let icon = FiFileText;
          let color = 'text-purple-600 bg-purple-100';
          if (r.type === 'Vaccination') {
            icon = FiActivity;
            color = 'text-green-600 bg-green-100';
          } else if (r.type === 'Lab Result') {
            icon = FiClipboard;
            color = 'text-blue-600 bg-blue-100';
          }
          return {
            id: r._id || r.id || idx,
            title: r.title,
            date: r.date,
            icon,
            color
          };
        });
        setRecords(latest);
      } catch (e) {
        console.error('Error loading records', e);
        setRecords([]);
      }
    };
    loadRecords();
    window.addEventListener('medicalRecordUpdate', loadRecords);
    return () => window.removeEventListener('medicalRecordUpdate', loadRecords);
  }, [petId, consultationData]);

  const goToRecords = () => {
    if (location.pathname.startsWith('/vet')) {
      navigate('/vet/patients?section=records');
    } else {
      onNavigate && onNavigate('records');
    }
  };

  return (
    <>
      <div className="bg-white border-l border-gray-200 w-80 flex-shrink-0 hidden lg:flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Shared Records</h3>
          <p className="text-xs text-gray-500">Access pet medical history</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {records.map((record) => (
            <div key={record.id} className="group cursor-pointer" onClick={goToRecords}>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors">
                <div className={`p-2.5 rounded-lg ${record.color}`}>
                  <record.icon className="text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{record.title}</h4>
                  <p className="text-xs text-gray-500">{record.date}</p>
                </div>
                <FiChevronRight className="text-gray-400 group-hover:text-gray-600 mt-1" />
              </div>
            </div>
          ))}
          
          <button 
            onClick={goToRecords}
            className="w-full py-2.5 mt-2 border border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            + Share New Record
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-xs text-gray-500 uppercase">Active Prescription</h4>
            {isVet && (
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                title="Add Prescription"
              >
                <FiPlus className="text-sm" />
              </button>
            )}
          </div>
          
          {activePrescription ? (
            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{activePrescription.medication}</p>
                  <p className="text-xs text-gray-500">{activePrescription.dosage} • {activePrescription.duration}</p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                  {activePrescription.status === 'active' ? 'Active' : 'New'}
                </span>
              </div>
              {activePrescription.instructions && (
                <p className="text-xs text-gray-600 leading-relaxed mt-2">
                  {activePrescription.instructions}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Prescribed by {activePrescription.vetId?.name || activePrescription.vetName || 'Vet'}
              </p>
            </div>
          ) : (
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 text-center py-2">
                {isVet ? 'No active prescription' : 'No active prescription available'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Prescription Modal */}
      {isVet && (
        <AddPrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          consultationData={consultationData}
          petId={currentPetId}
        />
      )}
    </>
  );
};

export default SharedRecords;
