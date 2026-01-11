import { getPets } from './petStore';
import { getMedicalRecords, deleteMedicalRecord } from './medicalRecordStore';
import { getVetById } from './vetStore';

export const getVaccinations = async () => {
  try {
    const startTime = performance.now();
    const pets = await getPets();
    
    // Fetch all medical records in parallel for all pets (much faster)
    const allRecordsPromises = pets.map(pet => 
      getMedicalRecords(pet._id || pet.id).catch(() => [])
    );
    const allRecordsArrays = await Promise.all(allRecordsPromises);
    const recordsTime = performance.now();
    console.log(`[Performance] getVaccinations - Records fetched: ${(recordsTime - startTime).toFixed(2)}ms`);
    
    let allVaccinations = [];
    
    // Process records for each pet
    pets.forEach((pet, index) => {
        const records = allRecordsArrays[index] || [];
        const vaccinations = records
            .filter(r => r.type === 'Vaccination')
            .map((r) => {
                // Handle Map or Object for details
                const details = r.details || {};
                const nextDueDate = details.nextDue || (details.get && details.get('nextDue'));
                const vaccineName = details.vaccine || (details.get && details.get('vaccine')) || r.title;

                let status = 'Completed';
                let statusColor = 'bg-gray-100 text-gray-700';
                
                let dueDate = r.date; // Default to record date

                if (nextDueDate) {
                    dueDate = nextDueDate;
                    const due = new Date(nextDueDate);
                    const today = new Date();
                    // Reset time for both dates to ensure accurate comparison
                    due.setHours(0,0,0,0);
                    today.setHours(0,0,0,0);
                    
                    // Compare dates - if due date is before today, it's overdue
                    if (due.getTime() < today.getTime()) {
                        status = 'Overdue';
                        statusColor = 'bg-red-100 text-red-700';
                    } else {
                        status = 'Upcoming';
                        statusColor = 'bg-blue-100 text-blue-700';
                    }
                }

                // Extract vet and clinic information from record (fast, no API calls)
                // Skip vet fetching to avoid blocking - show what's in the record immediately
                const vetName = r.vetName || details.vetName || '';
                const clinicName = r.clinicName || details.clinicName || '';
                
                // Note: Vet details from vetId are skipped in initial load for performance
                // If vet info is missing, it will show "Unknown Clinic" but vaccinations load instantly

                return {
                    id: r._id || r.id,
                    petName: pet.name,
                    vaccineName: vaccineName || 'Unknown Vaccine',
                    dueDate: dueDate,
                    status,
                    statusColor,
                    vetName: vetName || '',
                    clinicName: clinicName || ''
                };
            });
        allVaccinations = [...allVaccinations, ...vaccinations];
    });
    const endTime = performance.now();
    console.log(`[Performance] getVaccinations - Total: ${(endTime - startTime).toFixed(2)}ms`);
    return allVaccinations;
  } catch (error) {
    console.error("Error fetching vaccinations", error);
    return [];
  }
};

export const markVaccinationAsDone = async (id) => {
    // This would likely involve creating a new medical record or updating an appointment
    console.warn("markVaccinationAsDone not fully implemented with backend");
};

export const deleteVaccination = async (id) => {
    try {
        await deleteMedicalRecord(id);
        return true;
    } catch (error) {
        console.error("Error deleting vaccination", error);
        throw error;
    }
};

export const resetVaccinations = () => {
    // No-op for backend
}
