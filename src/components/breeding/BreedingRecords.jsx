import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiPlus, FiTrash2 } from 'react-icons/fi';
import { getBreedingRecords, addBreedingRecord, deleteBreedingRecord } from '../../utils/breedingStore';

const BreedingRecords = ({ petId }) => {
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newRecord, setNewRecord] = useState({
    partner: '',
    date: new Date().toISOString().split('T')[0],
    outcome: 'Success',
    litterSize: 0,
    notes: ''
  });

  const loadRecords = async () => {
    if (!petId) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
        console.log(`[BreedingRecords] Loading records for pet: ${petId}`);
        const records = await getBreedingRecords(petId);
        console.log(`[BreedingRecords] Loaded ${records.length} breeding records`);
        setHistory(records);
    } catch (error) {
        console.error("Error loading records", error);
        setHistory([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    
    // Listen for breeding record updates from other components
    const handleBreedingUpdate = () => {
      console.log('[BreedingRecords] Breeding update event received, refreshing records...');
      loadRecords();
    };
    
    window.addEventListener('breedingRecordUpdate', handleBreedingUpdate);
    window.addEventListener('medicalRecordUpdate', handleBreedingUpdate); // Also listen to medical record updates since breeding records are stored as medical records
    
    return () => {
      window.removeEventListener('breedingRecordUpdate', handleBreedingUpdate);
      window.removeEventListener('medicalRecordUpdate', handleBreedingUpdate);
    };
  }, [petId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
        await addBreedingRecord(petId, newRecord);
        setShowForm(false);
        setNewRecord({
            partner: '',
            date: new Date().toISOString().split('T')[0],
            outcome: 'Success',
            litterSize: 0,
            notes: ''
        });
        // Reload records and dispatch event for other components
        await loadRecords();
        window.dispatchEvent(new Event('breedingRecordUpdate'));
        window.dispatchEvent(new Event('medicalRecordUpdate')); // Also dispatch medical record update since breeding records are stored as medical records
    } catch (error) {
        console.error("Error adding breeding record", error);
        alert("Failed to add record. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
          await deleteBreedingRecord(id);
          // Reload records and dispatch event for other components
          await loadRecords();
          window.dispatchEvent(new Event('breedingRecordUpdate'));
          window.dispatchEvent(new Event('medicalRecordUpdate')); // Also dispatch medical record update
      } catch (error) {
          console.error("Error deleting breeding record", error);
          alert("Failed to delete record. Please try again.");
      }
    }
  };

  if (loading && !showForm) return <div className="p-10 text-center">Loading records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Breeding Records</h2>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            // Refresh records when opening form to ensure latest data
            if (!showForm) {
              loadRecords();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
        >
          <FiPlus />
          Add Record
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">New Breeding Record</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                <input 
                  type="text" 
                  required
                  value={newRecord.partner}
                  onChange={e => setNewRecord({...newRecord, partner: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="e.g. Max"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={newRecord.date}
                  onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select 
                  value={newRecord.outcome}
                  onChange={e => setNewRecord({...newRecord, outcome: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Litter Size</label>
                <input 
                  type="number" 
                  min="0"
                  value={newRecord.litterSize}
                  onChange={e => setNewRecord({...newRecord, litterSize: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea 
                value={newRecord.notes}
                onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 outline-none h-24"
                placeholder="Additional details..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {history.map((record) => (
          <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative group">
            <button 
              onClick={() => handleDelete(record.id)}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <FiTrash2 />
            </button>
            <div className="flex items-start justify-between mb-3 pr-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{record.partner}</h3>
                  {record.outcome === 'Success' ? (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiCheckCircle /> Success
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiXCircle /> Failed
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <FiClock className="text-gray-400" />
                  {new Date(record.date).toLocaleDateString()}
                </p>
              </div>
              {record.litterSize > 0 && (
                <div className="text-center bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="block text-xl font-bold text-gray-900">{record.litterSize}</span>
                  <span className="text-xs text-gray-500 uppercase">Puppies</span>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Notes: </span>
              {record.notes}
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No breeding records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreedingRecords;
