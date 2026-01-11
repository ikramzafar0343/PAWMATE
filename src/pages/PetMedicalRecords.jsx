import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MedicalHeader from '../components/medicalRecords/MedicalHeader';
import PetSummaryCard from '../components/medicalRecords/PetSummaryCard';
import RecordsFilter from '../components/medicalRecords/RecordsFilter';
import VaccinationRecord from '../components/medicalRecords/VaccinationRecord';
import TreatmentRecord from '../components/medicalRecords/TreatmentRecord';
import PrescriptionRecord from '../components/medicalRecords/PrescriptionRecord';
import LabResultsRecord from '../components/medicalRecords/LabResultsRecord';
import VetNotesRecord from '../components/medicalRecords/VetNotesRecord';
import RecordsFooter from '../components/medicalRecords/RecordsFooter';
import AddMedicalRecordModal from '../components/medicalRecords/AddMedicalRecordModal';
import { getMedicalRecords, deleteMedicalRecord } from '../utils/medicalRecordStore';
import { getPetById, getPets } from '../utils/petStore';

const PetMedicalRecords = ({ onNavigate }) => {
  const { petId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pet, setPet] = useState(null);
  const [records, setRecords] = useState([]);
  
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('All Records');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
        let recs = [];
        if (petId) {
            const foundPet = await getPetById(petId);
            setPet(foundPet);
            if (foundPet) {
                recs = await getMedicalRecords(foundPet._id || foundPet.id);
            } else {
                const pets = await getPets();
                if (pets.length > 0) {
                    const fallbackPet = pets[0];
                    setPet(fallbackPet);
                    const fallbackId = fallbackPet._id || fallbackPet.id;
                    if (fallbackId) {
                      localStorage.setItem('pawmate_selected_pet_id', fallbackId);
                    }
                    recs = await getMedicalRecords(fallbackId);
                } else {
                    setRecords([]);
                    return;
                }
            }
        } else {
            const pets = await getPets();
            if (pets.length > 0) {
                setPet(pets[0]);
                recs = await getMedicalRecords(pets[0]._id || pets[0].id);
            } else {
                setRecords([]);
                return;
            }
        }
        
        // Ensure recs is an array
        if (!Array.isArray(recs)) {
            setRecords([]);
            return;
        }
        
        // Remove duplicates based on _id
        const uniqueRecords = [];
        const seenIds = new Set();
        for (const record of recs) {
            const id = record._id || record.id;
            if (id && !seenIds.has(id.toString())) {
                seenIds.add(id.toString());
                uniqueRecords.push(record);
            }
        }
        
        setRecords(uniqueRecords);
    } catch (error) {
        console.error("Error loading medical records", error);
        setRecords([]);
    }
  }, [petId]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [petId, loadData]);
  
  useEffect(() => {
    const onUpdate = () => loadData();
    window.addEventListener('medicalRecordUpdate', onUpdate);
    return () => window.removeEventListener('medicalRecordUpdate', onUpdate);
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    // Ensure records is an array and remove duplicates again (safety check)
    if (!Array.isArray(records)) {
      return [];
    }
    
    // Remove duplicates based on _id (safety check)
    const uniqueRecords = [];
    const seenIds = new Set();
    for (const record of records) {
      const id = record._id || record.id;
      if (id && !seenIds.has(id.toString())) {
        seenIds.add(id.toString());
        uniqueRecords.push(record);
      }
    }
    
    let filtered = [...uniqueRecords];
    if (activeTab !== 'All Records') {
      const typeMap = {
        'Treatments': 'Treatment',
        'Vaccinations': 'Vaccination',
        'Prescriptions': 'Prescription',
        'Lab Results': 'Lab Result',
        'Vet Notes': 'Vet Note'
      };
      const targetType = typeMap[activeTab];
      if (targetType) {
        filtered = filtered.filter(record => record.type === targetType);
      }
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.title?.toLowerCase().includes(lowerQuery) ||
        record.vetName?.toLowerCase().includes(lowerQuery) ||
        record.clinicName?.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(record.details).toLowerCase().includes(lowerQuery)
      );
    }
    return filtered;
  }, [records, activeTab, searchQuery]);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteMedicalRecord(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete record:", error);
        alert(error.response?.data?.message || "Failed to delete record. You may not have permission.");
      }
    }
  };

  const renderRecord = (record) => {
    const recordId = record._id || record.id;
    switch (record.type) {
      case 'Vaccination':
        return <VaccinationRecord key={recordId} data={record} onEdit={() => handleEdit(record)} onDelete={() => handleDelete(recordId)} />;
      case 'Treatment':
        return <TreatmentRecord key={recordId} data={record} onEdit={() => handleEdit(record)} onDelete={() => handleDelete(recordId)} />;
      case 'Prescription':
        return <PrescriptionRecord key={recordId} data={record} onEdit={() => handleEdit(record)} onDelete={() => handleDelete(recordId)} />;
      case 'Lab Result':
        return <LabResultsRecord key={recordId} data={record} onEdit={() => handleEdit(record)} onDelete={() => handleDelete(recordId)} />;
      case 'Vet Note':
        return <VetNotesRecord key={recordId} data={record} onEdit={() => handleEdit(record)} onDelete={() => handleDelete(recordId)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MedicalHeader pet={pet} onNavigate={onNavigate} onAddRecord={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
        }} />
        <PetSummaryCard pet={pet} />
        <RecordsFilter 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
        />
        
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
             <div className="text-center py-10 text-gray-500">
               No medical records found for {pet?.name}.
             </div>
          ) : (
            filteredRecords.map(record => {
              const uniqueId = record._id || record.id || `record-${Date.now()}-${Math.random()}`;
              return (
                <React.Fragment key={uniqueId}>
                  {renderRecord(record)}
                </React.Fragment>
              );
            })
          )}
        </div>

        <RecordsFooter onNavigate={onNavigate} petId={pet?._id || pet?.id} />
      </main>

      {isModalOpen && (
        <AddMedicalRecordModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecord(null);
          }}
          initialData={editingRecord}
          petId={pet?._id || pet?.id}
        />
      )}
    </div>
  );
};

export default PetMedicalRecords;
