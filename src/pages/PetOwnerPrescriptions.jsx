import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiCalendar, FiUser } from 'react-icons/fi';
import { FaPills } from 'react-icons/fa';
import { getPrescriptions } from '../utils/prescriptionStore';
import { getPets } from '../utils/petStore';

const PetOwnerPrescriptions = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'active', 'completed', 'cancelled'

  useEffect(() => {
    const loadData = async () => {
      try {
        const petsData = await getPets();
        setPets(petsData);
        
        // Load all prescriptions for user's pets
        const allPrescriptions = [];
        for (const pet of petsData) {
          const petPrescriptions = await getPrescriptions(pet._id || pet.id);
          allPrescriptions.push(...petPrescriptions.map(p => ({
            ...p,
            petName: pet.name,
            petImage: pet.image
          })));
        }
        
        setPrescriptions(allPrescriptions);
      } catch (error) {
        console.error("Error loading prescriptions", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    window.addEventListener('prescriptionUpdate', loadData);
    return () => window.removeEventListener('prescriptionUpdate', loadData);
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => {
    const petMatch = selectedPetId === 'all' || (p.petId?._id || p.petId) === selectedPetId;
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    return petMatch && statusMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate ? onNavigate('dashboard') : navigate('/pet-owner/dashboard')} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="text-xl text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Prescriptions</h1>
                <p className="text-sm text-gray-500">View all prescriptions from veterinarians</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Pet</label>
              <select
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Pets</option>
                {pets.map(pet => (
                  <option key={pet._id || pet.id} value={pet._id || pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading prescriptions...</div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <FaPills className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Prescriptions Found</h3>
            <p className="text-gray-500 mb-6">
              {selectedPetId !== 'all' || filterStatus !== 'all' 
                ? 'No prescriptions match your filters.'
                : 'You don\'t have any prescriptions yet. Prescriptions will appear here after consultations with veterinarians.'}
            </p>
            {selectedPetId !== 'all' || filterStatus !== 'all' ? (
              <button
                onClick={() => {
                  setSelectedPetId('all');
                  setFilterStatus('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => onNavigate ? onNavigate('vetListing') : navigate('/pet-owner/vets')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Find a Veterinarian
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription._id || prescription.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Pet Info */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <img
                      src={prescription.petImage || prescription.petId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.petName || 'P')}&background=random`}
                      alt={prescription.petName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{prescription.petName}</h3>
                      <p className="text-xs text-gray-500">{prescription.petId?.breed || 'Pet'}</p>
                    </div>
                  </div>

                  {/* Prescription Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FaPills className="text-orange-600" />
                          <h4 className="font-bold text-lg text-gray-900">{prescription.medication}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(prescription.status)}`}>
                            {prescription.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <FaPills className="text-gray-400" />
                            <span><strong>Dosage:</strong> {prescription.dosage}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiCalendar className="text-gray-400" />
                            <span><strong>Duration:</strong> {prescription.duration}</span>
                          </div>
                        </div>
                        {prescription.instructions && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Instructions:</strong> {prescription.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Vet Info & Date */}
                    <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiUser className="text-gray-400" />
                        <span>
                          <strong>Prescribed by:</strong> {prescription.vetId?.name || prescription.vetName || 'Dr. Unknown'}
                        </span>
                      </div>
                      {prescription.vetId?.clinicName && (
                        <span>{prescription.vetId.clinicName}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <FiCalendar className="text-gray-400" />
                        <span>
                          <strong>Date Issued:</strong> {formatDate(prescription.dateIssued || prescription.date || prescription.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PetOwnerPrescriptions;

