import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiPlus, FiCalendar, FiUser } from 'react-icons/fi';
import { FaPills } from 'react-icons/fa';
import PrescriptionForm from '../components/prescription/PrescriptionForm';
import { getPrescriptions } from '../utils/prescriptionStore';
import { getPets } from '../utils/petStore';

const PrescriptionManagement = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [expandedPrescriptions, setExpandedPrescriptions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Check if we should show form (from route state or query param)
  useEffect(() => {
    if (location.state?.showForm || location.search.includes('issue=true')) {
      setShowForm(true);
    }
  }, [location]);

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        setLoading(true);
        // Get all prescriptions for this vet
        const allPrescriptions = await getPrescriptions();
        setPrescriptions(allPrescriptions);
      } catch (error) {
        console.error("Error loading prescriptions", error);
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (!showForm) {
      loadPrescriptions();
      window.addEventListener('prescriptionUpdate', loadPrescriptions);
      return () => window.removeEventListener('prescriptionUpdate', loadPrescriptions);
    }
  }, [showForm]);

  const toggleDetails = (prescriptionId) => {
    const newExpanded = new Set(expandedPrescriptions);
    if (newExpanded.has(prescriptionId)) {
      newExpanded.delete(prescriptionId);
    } else {
      newExpanded.add(prescriptionId);
    }
    setExpandedPrescriptions(newExpanded);
  };

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

  // If showing form, render the form component
  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="text-xl text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Issue Prescription</h1>
                <p className="text-sm text-gray-500">Veterinary Panel</p>
              </div>
            </div>
          </div>
        </div>
        <PrescriptionForm onNavigate={onNavigate} />
      </div>
    );
  }

  // Show list view
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate ? onNavigate('dashboard') : navigate('/vet/dashboard')} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiArrowLeft className="text-xl text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Prescriptions</h1>
                <p className="text-sm text-gray-500">Manage all prescriptions</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="text-lg" />
              Issue Prescription
            </button>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <FaPills className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Prescriptions Found</h3>
            <p className="text-gray-500 mb-6">You haven't issued any prescriptions yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Issue Your First Prescription
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => {
              const prescriptionId = prescription._id || prescription.id;
              const isExpanded = expandedPrescriptions.has(prescriptionId);
              
              return (
                <div
                  key={prescriptionId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Pet Image */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 shrink-0">
                          <img
                            src={prescription.petId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.petId?.name || 'P')}&background=random`}
                            alt={prescription.petId?.name || 'Pet'}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Prescription Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FaPills className="text-orange-600" />
                            <h3 className="font-bold text-lg text-gray-900">{prescription.medication}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(prescription.status)}`}>
                              {prescription.status?.toUpperCase() || 'PENDING'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Pet:</span>
                              <span>{prescription.petId?.name || 'Unknown Pet'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiCalendar className="text-gray-400" />
                              <span>{formatDate(prescription.date || prescription.createdAt)}</span>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 font-medium">Dosage:</span>
                                  <p className="text-gray-900 font-bold">{prescription.dosage || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-medium">Duration:</span>
                                  <p className="text-gray-900 font-bold">{prescription.duration || 'N/A'}</p>
                                </div>
                              </div>
                              {prescription.instructions && (
                                <div>
                                  <span className="text-gray-500 font-medium text-sm">Instructions:</span>
                                  <p className="text-gray-900 mt-1">{prescription.instructions}</p>
                                </div>
                              )}
                              {prescription.reason && (
                                <div>
                                  <span className="text-gray-500 font-medium text-sm">Reason:</span>
                                  <p className="text-gray-900 mt-1">{prescription.reason}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <FiUser className="text-gray-400" />
                                <span>Prescribed on {formatDate(prescription.createdAt || prescription.date)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detail Button */}
                      <button
                        onClick={() => toggleDetails(prescriptionId)}
                        className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 shrink-0"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details</span>
                            <FiChevronUp />
                          </>
                        ) : (
                          <>
                            <span>Details</span>
                            <FiChevronDown />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PrescriptionManagement;
