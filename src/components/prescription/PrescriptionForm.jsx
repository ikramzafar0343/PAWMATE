import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { FiPlus, FiTrash2, FiSave, FiUser, FiFileText, FiChevronDown } from 'react-icons/fi';
import { getConsultations } from '../../utils/consultationStore';
import { getAppointments } from '../../utils/appointmentStore';
import { getPets, getPetById } from '../../utils/petStore';
import { addPrescription } from '../../utils/prescriptionStore';

const PrescriptionForm = ({ onNavigate }) => {
  const location = useLocation();
  const { petId: routePetId } = useParams();
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '', notes: '' }
  ]);
  const [patient, setPatient] = useState(null);
  const [availablePets, setAvailablePets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load available pets from appointments
  useEffect(() => {
    const loadAvailablePets = async () => {
      try {
        const appointments = await getAppointments();
        const pets = await getPets();
        
        // Create a map of petId to pet
        const petMapById = new Map();
        pets.forEach(pet => {
          const petId = pet._id || pet.id;
          if (petId) {
            petMapById.set(petId.toString(), pet);
          }
        });
        
        // Get unique pets from appointments
        const petMap = new Map();
        appointments.forEach(appt => {
          const petId = appt.petId?._id || appt.petId;
          if (petId && !petMap.has(petId)) {
            const apptPet = appt.petId;
            const petFromList = petMapById.get(petId.toString());
            const pet = petFromList || apptPet;
            
            // Get owner name
            let ownerName = 'Pet Owner';
            if (appt.ownerId && typeof appt.ownerId === 'object' && appt.ownerId.name) {
              ownerName = appt.ownerId.name;
            }
            
            petMap.set(petId, {
              _id: petId,
              id: petId,
              name: pet?.name || apptPet?.name || 'Unknown Pet',
              owner: ownerName,
              age: pet?.age || 'Unknown',
              weight: pet?.weight || 'Unknown',
              breed: pet?.breed || apptPet?.breed || 'Unknown',
              image: pet?.image || apptPet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pet?.name || apptPet?.name || 'Pet')}&background=random`
            });
          }
        });
        
        setAvailablePets(Array.from(petMap.values()));
      } catch (error) {
        console.error('Error loading available pets:', error);
        setAvailablePets([]);
      }
    };

    loadAvailablePets();
  }, []);

  // Load initial patient
  useEffect(() => {
    const loadPatient = async () => {
      setLoading(true);
      try {
        let targetPetId = routePetId;
        let pet = null;

        // Priority 1: Get from route params
        if (targetPetId) {
          pet = await getPetById(targetPetId);
          if (pet) {
            setSelectedPetId(pet._id || pet.id);
          }
        }

        // Priority 2: Get from location state
        if (!pet) {
          const consultationData = location.state?.consultation || location.state?.appointment;
          if (consultationData) {
            const petId = consultationData.petId?._id || consultationData.petId || consultationData.petId;
            if (petId) {
              pet = await getPetById(petId);
              if (pet) {
                setSelectedPetId(pet._id || pet.id);
              }
            }
          }
        }

        // Priority 3: Get from active consultation
        if (!pet) {
          const consultations = await getConsultations();
          const appointments = await getAppointments();
          const activeConsultation = [...consultations, ...appointments]
            .filter(c => c.status === 'in-progress' || c.status === 'In Progress')
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

          if (activeConsultation) {
            const petId = activeConsultation.petId?._id || activeConsultation.petId || activeConsultation.petId;
            if (petId) {
              pet = await getPetById(petId);
              if (pet) {
                setSelectedPetId(pet._id || pet.id);
              }
            }
          }
        }

        // Priority 4: Get first available pet from list
        if (!pet && availablePets.length > 0) {
          pet = availablePets[0];
          setSelectedPetId(pet.id);
        }

        if (pet) {
          const ownerName = pet.ownerId?.name || (typeof pet.ownerId === 'object' && pet.ownerId?.name) || 'Pet Owner';
          setPatient({
            id: pet._id || pet.id,
            name: pet.name,
            owner: ownerName,
            age: pet.age || 'Unknown',
            weight: pet.weight || 'Unknown'
          });
        } else {
          setPatient({
            id: null,
            name: 'Select a pet',
            owner: 'Unknown Owner',
            age: 'Unknown',
            weight: 'Unknown'
          });
        }
      } catch (error) {
        console.error('Error loading patient:', error);
        setPatient({
          id: null,
          name: 'Select a pet',
          owner: 'Unknown Owner',
          age: 'Unknown',
          weight: 'Unknown'
        });
      } finally {
        setLoading(false);
      }
    };

    if (availablePets.length > 0 || routePetId || location.state) {
      loadPatient();
    }
  }, [routePetId, location.state, availablePets.length]);

  // Handle pet selection from dropdown
  const handlePetSelect = (petId) => {
    setSelectedPetId(petId);
    const selectedPet = availablePets.find(p => (p._id || p.id) === petId);
    if (selectedPet) {
      setPatient({
        id: selectedPet._id || selectedPet.id,
        name: selectedPet.name,
        owner: selectedPet.owner,
        age: selectedPet.age,
        weight: selectedPet.weight
      });
    }
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  };

  const removeMedicine = (index) => {
    const newMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(newMedicines);
  };

  const updateMedicine = (index, field, value) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const handleSubmit = async () => {
    if (!patient?.id) {
      alert('Please select a pet first.');
      return;
    }

    if (!medicines.length) {
      alert('Please add at least one medicine.');
      return;
    }
    
    const invalid = medicines.find(m => !m.name || !m.dosage);
    if (invalid) {
      alert('Please fill medicine name and dosage for all entries.');
      return;
    }

    setSaving(true);
    try {
      // Create prescription for each medicine
      for (const med of medicines) {
        const prescriptionData = {
          petId: patient.id,
          medication: med.name,
          dosage: med.dosage,
          frequency: med.frequency || 'As directed',
          duration: med.duration || 'Until finished',
          instructions: med.notes || med.frequency ? `${med.frequency}. ${med.notes || ''}`.trim() : 'As directed'
          // Status will be set to 'pending' by backend by default, requires approval
        };

        await addPrescription(prescriptionData);
      }

      window.dispatchEvent(new Event('prescriptionUpdate'));
      alert('Prescription issued successfully!');
      
      if (onNavigate) {
        onNavigate('dashboard');
      } else {
        window.history.back();
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to issue prescription. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">Loading patient information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Patient Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <FiUser className="text-blue-600 text-xl" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Patient Details</h2>
            <p className="text-sm text-gray-500">Issue prescription for</p>
          </div>
        </div>
        
        {/* Pet Selection Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Pet</label>
          <div className="relative">
            <select
              value={selectedPetId || ''}
              onChange={(e) => handlePetSelect(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none pr-10"
            >
              <option value="">-- Select a pet --</option>
              {availablePets.map((pet) => (
                <option key={pet._id || pet.id} value={pet._id || pet.id}>
                  {pet.name} {pet.breed ? `(${pet.breed})` : ''} - {pet.owner}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Patient Details */}
        {selectedPetId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Pet Name</label>
              <p className="font-medium text-gray-900">{patient.name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Owner</label>
              <p className="font-medium text-gray-900">{patient.owner}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Age</label>
              <p className="font-medium text-gray-900">{patient.age}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Weight</label>
              <p className="font-medium text-gray-900">{patient.weight}</p>
            </div>
          </div>
        )}
      </div>

      {/* Medicines Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiFileText className="text-blue-600" />
            Prescription Details
          </h2>
          <button 
            onClick={addMedicine}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            <FiPlus />
            Add Medicine
          </button>
        </div>

        <div className="space-y-6">
          {medicines.map((med, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative group">
              <button 
                onClick={() => removeMedicine(index)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <FiTrash2 />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                  <input 
                    type="text" 
                    value={med.name}
                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                  <input 
                    type="text" 
                    value={med.dosage}
                    onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    placeholder="e.g. 250mg"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select 
                    value={med.frequency}
                    onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Select Frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Thrice daily">Thrice daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input 
                    type="text" 
                    value={med.duration}
                    onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                    placeholder="e.g. 5 days"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions / Notes</label>
                <input 
                  type="text" 
                  value={med.notes}
                  onChange={(e) => updateMedicine(index, 'notes', e.target.value)}
                  placeholder="e.g. Give after food"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={saving || !patient?.id}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave />
            {saving ? 'Issuing...' : 'Issue Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionForm;
