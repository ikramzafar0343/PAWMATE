import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { addPrescription } from '../../utils/prescriptionStore';
import { addMedicalRecord, MEDICAL_RECORD_TYPES } from '../../utils/medicalRecordStore';
import { getPets } from '../../utils/petStore';

const AddPrescriptionModal = ({ isOpen, onClose, consultationData, petId }) => {
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    const loadPet = async () => {
      if (isOpen) {
        // Reset form when modal opens
        setMedicines([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        
        // Set selected pet
        try {
          if (petId) {
            const pets = await getPets();
            const pet = pets.find(p => (p._id || p.id) === petId);
            setSelectedPet(pet || null);
          } else if (consultationData?.petId) {
            const pets = await getPets();
            const pet = pets.find(p => (p._id || p.id) === consultationData.petId || p.name === consultationData.petName);
            setSelectedPet(pet || null);
          } else if (consultationData?.petName) {
            const pets = await getPets();
            const pet = pets.find(p => p.name === consultationData.petName);
            setSelectedPet(pet || null);
          }
        } catch (error) {
          console.error("Error loading pet", error);
          setSelectedPet(null);
        }
      }
    };
    
    loadPet();
  }, [isOpen, petId, consultationData]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index, field, value) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPet) {
      alert('Please select a pet.');
      return;
    }

    if (!medicines.length) {
      alert('Please add at least one medicine.');
      return;
    }

    const invalid = medicines.find(m => !m.name || !m.dosage || !m.frequency || !m.duration);
    if (invalid) {
      alert('Please fill all required fields (Medicine Name, Dosage, Frequency, Duration) for all entries.');
      return;
    }

    const vetName = localStorage.getItem('userFirstName') 
      ? `Dr. ${localStorage.getItem('userFirstName')} ${localStorage.getItem('userLastName') || ''}`.trim()
      : 'Dr. Johnson';
    const clinicName = localStorage.getItem('clinicName') || 'Veterinary Clinic';
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Add each medicine as a prescription
    try {
      for (const med of medicines) {
        const prescriptionData = {
          petId: selectedPet._id || selectedPet.id,
          medication: `${med.name} ${med.dosage}`,
          dosage: med.frequency,
          duration: med.duration,
          instructions: med.instructions || `Take as prescribed by ${vetName}.`,
          date: currentDate
        };

        // Add to prescription store
        await addPrescription(prescriptionData);

        // Also add to medical records
        await addMedicalRecord({
          petId: selectedPet._id || selectedPet.id,
          type: MEDICAL_RECORD_TYPES.PRESCRIPTION,
          date: currentDate,
          time: currentTime,
          title: `${med.name} ${med.dosage}`,
          details: {
            medication: `${med.name} ${med.dosage}`,
            dosage: med.frequency,
            duration: med.duration,
            instructions: med.instructions || `Take as prescribed by ${vetName}.`,
            quantity: med.duration,
            refills: '0'
          }
        });
      }

      alert('Prescription issued successfully!');
      onClose();
    } catch (error) {
      alert('Error issuing prescription. Please try again.');
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Issue Prescription</h2>
            {selectedPet && (
              <p className="text-sm text-gray-500 mt-1">For {selectedPet.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Patient Info */}
          {selectedPet && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Pet Name</label>
                  <p className="font-medium text-gray-900">{selectedPet.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Breed</label>
                  <p className="font-medium text-gray-900">{selectedPet.breed || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Age</label>
                  <p className="font-medium text-gray-900">{selectedPet.age || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Weight</label>
                  <p className="font-medium text-gray-900">{selectedPet.weight || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Medicines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Medications</h3>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <FiPlus className="text-sm" />
                Add Medicine
              </button>
            </div>

            {medicines.map((med, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative group">
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove medicine"
                  >
                    <FiTrash2 />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      placeholder="e.g. Amoxicillin"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                      required
                    >
                      <option value="">Select Frequency</option>
                      <option value="Once daily">Once daily</option>
                      <option value="2x Daily">2x Daily</option>
                      <option value="3x Daily">3x Daily</option>
                      <option value="Every 4 hours">Every 4 hours</option>
                      <option value="Every 6 hours">Every 6 hours</option>
                      <option value="Every 8 hours">Every 8 hours</option>
                      <option value="Every 12 hours">Every 12 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      placeholder="e.g. 7 Days"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={med.instructions}
                    onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                    placeholder="e.g. Take with food. Complete the full course as prescribed."
                    rows="2"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <FiSave />
              Issue Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPrescriptionModal;

