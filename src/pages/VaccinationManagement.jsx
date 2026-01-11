import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import VaccinationHeader from '../components/vaccination/VaccinationHeader';
import VaccinationHero from '../components/vaccination/VaccinationHero';
import VaccinationQuickStats from '../components/vaccination/VaccinationQuickStats';
import VaccinationFilters from '../components/vaccination/VaccinationFilters';
import CompletedVaccineCard from '../components/vaccination/CompletedVaccineCard';
import UpcomingVaccineCard from '../components/vaccination/UpcomingVaccineCard';
import SeriesVaccineCard from '../components/vaccination/SeriesVaccineCard';
import HistoryVaccineCard from '../components/vaccination/HistoryVaccineCard';
import ReminderSettings from '../components/vaccination/ReminderSettings';
import VaccinationFooter from '../components/vaccination/VaccinationFooter';
import { getVaccinations, markVaccinationAsDone, deleteVaccination } from '../utils/vaccinationStore';
import { getMedicalRecords, MEDICAL_RECORD_TYPES, addMedicalRecord, deleteMedicalRecord, updateMedicalRecord } from '../utils/medicalRecordStore';
import { getPets, getPetById } from '../utils/petStore';
import { getCurrentUser } from '../utils/userStore';
import AddMedicalRecordModal from '../components/medicalRecords/AddMedicalRecordModal';

const VaccinationManagement = ({ onNavigate }) => {
  const { petId: routePetId } = useParams();
  const [refreshTick, setRefreshTick] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mergedVaccinations, setMergedVaccinations] = useState([]);
  const [pet, setPet] = useState(null);
  const [resolvedPetId, setResolvedPetId] = useState(null);

  useEffect(() => {
    const computeMerged = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        let targetPetId = routePetId || localStorage.getItem('pawmate_selected_pet_id') || null;
        let targetPet = null;
        
        // First, get all pets to validate the targetPetId
        const petsList = await getPets();
        const validPetsList = Array.isArray(petsList) ? petsList : [];
        
        // If we have a targetPetId, try to find it in the pets list first
        if (targetPetId) {
          // Normalize the targetPetId for comparison
          const normalizedTargetId = String(targetPetId).trim();
          
          // Validate ID format before using it
          const isValidObjectId = normalizedTargetId.length === 24 && /^[0-9a-fA-F]{24}$/.test(normalizedTargetId);
          
          if (isValidObjectId) {
            // First, try to find pet in the list (avoids unnecessary API call)
            targetPet = validPetsList.find(p => {
              const petId = p._id || p.id;
              if (!petId) return false;
              return String(petId).trim() === normalizedTargetId;
            });
            
            // Only make API call if:
            // 1. Pet not found in list
            // 2. We have a routePetId (from URL parameter, not localStorage)
            // 3. The ID format is valid
            // This handles the case where a pet might exist but not be in the current user's list
            if (!targetPet && routePetId && routePetId === normalizedTargetId) {
              // Make API call only for route-based pet IDs
              const fetchedPet = await getPetById(normalizedTargetId);
              if (fetchedPet) {
                targetPet = fetchedPet;
                targetPetId = fetchedPet._id || fetchedPet.id || targetPetId;
              }
            }
          } else {
            // Invalid ID format - clear it and use first available pet
            console.warn(`Invalid pet ID format: ${normalizedTargetId}. Clearing from localStorage.`);
            targetPetId = null;
            localStorage.removeItem('pawmate_selected_pet_id');
          }
        }
        
        // If no valid pet found, use first available pet
        if (!targetPet && validPetsList.length > 0) {
          targetPet = validPetsList[0];
          targetPetId = targetPet._id || targetPet.id || null;
        }
        
        // Update localStorage only if we have a valid pet
        if (targetPetId && targetPet) {
          localStorage.setItem('pawmate_selected_pet_id', String(targetPetId).trim());
        } else {
          // Clear invalid pet ID from localStorage
          localStorage.removeItem('pawmate_selected_pet_id');
        }
        
        setResolvedPetId(targetPetId);
        setPet(targetPet);

        let medicalRecords = [];
        if (targetPetId) {
          medicalRecords = await getMedicalRecords(targetPetId);
          if (!Array.isArray(medicalRecords)) medicalRecords = [];
        }

        // Remove duplicates from medical records based on _id
        const uniqueMedicalRecords = [];
        const seenRecordIds = new Set();
        for (const record of medicalRecords) {
          const recordId = record._id || record.id;
          if (recordId && !seenRecordIds.has(String(recordId))) {
            seenRecordIds.add(String(recordId));
            uniqueMedicalRecords.push(record);
          }
        }

        const vaxRecords = uniqueMedicalRecords
          .filter(r => r.type === MEDICAL_RECORD_TYPES.VACCINATION)
          .map(r => {
            const details = r.details || {};
            const nextDue = details.nextDue || null;
            const vaccineName = details.vaccine || r.title;
            const baseDate = r.date;
            let status = 'Completed';
            let statusColor = 'bg-emerald-100 text-emerald-700';
            let dueDate = baseDate;
            if (nextDue) {
              dueDate = nextDue;
              const d = new Date(nextDue);
              const t = new Date();
              // Reset time for both dates to ensure accurate comparison
              d.setHours(0,0,0,0);
              t.setHours(0,0,0,0);
              // Compare dates - if due date is before today, it's overdue
              if (d.getTime() < t.getTime()) {
                status = 'Overdue';
                statusColor = 'bg-red-100 text-red-700';
              } else {
                status = 'Upcoming';
                statusColor = 'bg-blue-100 text-blue-700';
              }
            }
            return {
              id: r._id || r.id,
              petName: targetPet?.name || 'Pet',
              vaccineName,
              completedDate: baseDate, 
              dueDate,
              clinicName: r.clinicName || details.clinicName || '',
              status,
              statusColor,
              vetName: r.vetName || details.vetName || '',
              batchNumber: details.batchNumber || '',
              nextDue: nextDue || '',
              source: 'medicalRecordStore',
              originalRecord: r
            };
          });
        
        // Remove duplicates from vaxRecords based on id (in case same record appears multiple times)
        const uniqueVaxRecords = [];
        const seenVaxIds = new Set();
        for (const vax of vaxRecords) {
          const vaxId = vax.id;
          if (vaxId && !seenVaxIds.has(String(vaxId))) {
            seenVaxIds.add(String(vaxId));
            uniqueVaxRecords.push(vax);
          }
        }
        
        const merged = [...uniqueVaxRecords];
        merged.sort((a, b) => {
          const isCompletedA = a.status === 'Completed';
          const isCompletedB = b.status === 'Completed';
          if (isCompletedA && !isCompletedB) return 1;
          if (!isCompletedA && isCompletedB) return -1;
          const dateA = new Date(a.dueDate || a.completedDate);
          const dateB = new Date(b.dueDate || b.completedDate);
          if (!isCompletedA && !isCompletedB) {
            return dateA - dateB;
          } else {
            return dateB - dateA;
          }
        });
        
        console.log(`[VaccinationManagement] Loaded ${uniqueMedicalRecords.length} unique medical records, ${uniqueVaxRecords.length} unique vaccinations, ${merged.length} after merge`);
        setMergedVaccinations(merged);
      } catch (error) {
        console.error("Error computing merged vaccinations", error);
        setMergedVaccinations([]);
      }
    };
    
    computeMerged();
  }, [refreshTick, routePetId]);

  useEffect(() => {
    const handleUpdate = () => setRefreshTick(t => t + 1);
    window.addEventListener('vaccinationUpdate', handleUpdate);
    window.addEventListener('medicalRecordUpdate', handleUpdate);
    
    return () => {
      window.removeEventListener('vaccinationUpdate', handleUpdate);
      window.removeEventListener('medicalRecordUpdate', handleUpdate);
    };
  }, []);

  const filteredVaccinations = useMemo(() => {
    let data = [...mergedVaccinations];
    if (activeTab !== 'All') {
      data = data.filter(v => v.status === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(v => 
        v.vaccineName?.toLowerCase().includes(q) ||
        v.clinicName?.toLowerCase().includes(q) ||
        v.vetName?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [mergedVaccinations, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = mergedVaccinations.length;
    const completed = mergedVaccinations.filter(v => v.status === 'Completed').length;
    const active = mergedVaccinations.filter(v => v.status !== 'Completed');
    const overdue = active.filter(v => v.status === 'Overdue' || (v.dueDate && v.dueDate < today)).length;
    const sortedActive = [...active].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const nextDueItem = sortedActive[0];
    return {
      total,
      completed,
      overdue,
      nextDueDate: nextDueItem?.dueDate,
      nextDueName: nextDueItem?.vaccineName
    };
  }, [mergedVaccinations]);

  const handleAddRecord = () => {
    setIsModalOpen(true);
  };

  const handleMarkDone = (id) => {
    const vaccine = mergedVaccinations.find(v => v.id === id);
    if (!vaccine) return;

    if (window.confirm(`Mark ${vaccine.vaccineName} as administered?`)) {
      getCurrentUser().then(user => {
        const vetName = user?.role === 'vet'
          ? ['Dr.', user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
          : (vaccine.vetName || '');
        const payload = {
          petId: resolvedPetId,
          type: MEDICAL_RECORD_TYPES.VACCINATION,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: vaccine.vaccineName,
          vetName,
          clinicName: vaccine.clinicName || '',
          details: {
            vaccine: vaccine.vaccineName,
            batchNumber: vaccine.batchNumber || '',
            nextDue: '',
            notes: 'Marked as administered from vaccination page'
          }
        };
        const promiseAdd = addMedicalRecord(payload);
        
        // Also update the original record to remove nextDue
        let promiseUpdate = Promise.resolve();
        if (vaccine.originalRecord) {
           const originalDetails = vaccine.originalRecord.details || {};
           const updatedDetails = { ...originalDetails, nextDue: null };
           // We need to send the full record data usually, or at least details
           // Using spread to be safe with existing fields
           promiseUpdate = updateMedicalRecord({
             id: vaccine.id,
             ...vaccine.originalRecord,
             details: updatedDetails
           });
        }

        Promise.all([promiseAdd, promiseUpdate]).then(() => {
          window.dispatchEvent(new Event('vaccinationUpdate'));
          window.dispatchEvent(new Event('medicalRecordUpdate'));
        }).catch(() => {});
      }).catch(() => {});
    }
  };

  const handleDeleteVaccine = async (id, source) => {
    if (window.confirm('Are you sure you want to delete this vaccination record?')) {
      try {
        if (source === 'vaccinationStore') {
          await deleteVaccination(id);
        } else if (source === 'medicalRecordStore') {
          await deleteMedicalRecord(id);
        }
        window.dispatchEvent(new Event('vaccinationUpdate'));
        window.dispatchEvent(new Event('medicalRecordUpdate'));
      } catch (error) {
        console.error("Failed to delete vaccination record", error);
        alert("Failed to delete record. Please try again.");
      }
    }
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="p-4 max-w-7xl mx-auto">
        <VaccinationHeader onNavigate={onNavigate} onAddRecord={handleAddRecord} pet={pet} />
        <VaccinationHero onNavigate={onNavigate} stats={stats} pet={pet} />
        <VaccinationQuickStats stats={stats} />
        <VaccinationFilters 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <div className="space-y-4">
          {filteredVaccinations.length > 0 ? (
            filteredVaccinations.map((v, index) => {
              // Create a unique key combining id and index to prevent React key conflicts
              const uniqueKey = `${v.id || 'vaccine'}-${index}-${v.vaccineName || ''}`;
              return v.status === 'Completed' ? 
                <CompletedVaccineCard 
                  key={uniqueKey} 
                  data={v} 
                  onNavigate={onNavigate} 
                  onDelete={() => handleDeleteVaccine(v.id, v.source)}
                /> :
                <UpcomingVaccineCard 
                  key={uniqueKey} 
                  data={v} 
                  onNavigate={onNavigate} 
                  onMarkDone={handleMarkDone} 
                  onDelete={() => handleDeleteVaccine(v.id, v.source)}
                />
            })
          ) : (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
               <p className="text-gray-500">No vaccination records found matching your filters.</p>
             </div>
          )}
        </div>

        <ReminderSettings onNavigate={onNavigate} />
        
        <VaccinationFooter onNavigate={onNavigate} vaccinations={mergedVaccinations} />
      </div>

      <AddMedicalRecordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={{ type: MEDICAL_RECORD_TYPES.VACCINATION }}
        title="Schedule Vaccination"
        petId={localStorage.getItem('pawmate_selected_pet_id')}
      />
    </div>
  );
};

export default VaccinationManagement;
