import API from '../api/client';

// Helper to calculate cycle status (kept from original)
export const calculateCycleStatus = (lastHeatDate, cycleLength) => {
  const lastHeat = new Date(lastHeatDate);
  const today = new Date();
  
  // Calculate difference in days
  const diffTime = today - lastHeat;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to make start date Day 1
  
  // Simple phase estimation for dogs
  let phase = 'Anestrus';
  let progress = 0; // percentage for progress bar

  if (diffDays <= 9) {
    phase = 'Proestrus';
    progress = (diffDays / 9) * 100;
  } else if (diffDays <= 20) {
    phase = 'Estrus';
    progress = ((diffDays - 9) / 11) * 100;
  } else if (diffDays <= 80) {
    phase = 'Diestrus';
    progress = ((diffDays - 20) / 60) * 100;
  } else {
    phase = 'Anestrus';
    const totalAnestrus = cycleLength - 80;
    progress = ((diffDays - 80) / totalAnestrus) * 100;
  }

  // Cap progress
  progress = Math.min(Math.max(progress, 0), 100);

  const nextHeatDate = new Date(lastHeat);
  nextHeatDate.setDate(nextHeatDate.getDate() + cycleLength);
  
  // Format next heat date properly
  const formattedNextHeatDate = nextHeatDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return {
    dayOfCycle: diffDays > 0 ? diffDays : 0,
    phase,
    progress: Math.min(Math.max(progress, 0), 100), // Ensure progress is between 0-100
    nextHeatDate: formattedNextHeatDate,
    nextHeatDateObj: nextHeatDate, // Keep Date object for calculations
    daysUntilNext: Math.ceil((nextHeatDate - today) / (1000 * 60 * 60 * 24))
  };
};

export const getCycleData = async (petId) => {
  try {
    if (!petId) return null;
    const { data } = await API.get(`/medical-records/${petId}`);
    // Find the latest 'Breeding' record with title 'Breeding Cycle Update'
    const breedingRecords = data.filter(r => r.type === 'Breeding' && r.title === 'Breeding Cycle Update');
    
    if (breedingRecords.length === 0) {
        return null;
    }
    
    // Sort by date descending
    breedingRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = breedingRecords[0];
    
    const lastHeatDate = latest.details?.lastHeatDate || latest.date;
    const cycleLength = parseInt(latest.details?.cycleLength || '180');
    
    return {
        lastHeatDate,
        cycleLength,
        ...latest.details
    };
  } catch (error) {
    console.error("Error fetching breeding cycle data", error);
    return null;
  }
};

export const updateCycleData = async (petId, data) => {
    try {
        const record = {
            petId,
            type: 'Breeding',
            title: 'Breeding Cycle Update',
            date: data.lastHeatDate || new Date().toISOString().split('T')[0],
            details: {
                lastHeatDate: data.lastHeatDate,
                cycleLength: String(data.cycleLength || 180),
                status: data.status || 'Active'
            }
        };
        
        const response = await API.post('/medical-records', record);
        return response.data;
    } catch (error) {
        console.error("Error updating breeding cycle data", error);
        throw error;
    }
};

export const getBreedingRecords = async (petId) => {
    try {
        if (!petId) return [];
        const { data } = await API.get(`/medical-records/${petId}`);
        // Only 'Mating Record'
        return data.filter(r => r.type === 'Breeding' && r.title === 'Mating Record')
                   .map(r => ({
                       id: r._id,
                       date: r.date,
                       ...r.details // partner, outcome, litterSize, notes
                   }));
    } catch (error) {
        console.error("Error fetching breeding records", error);
        return [];
    }
};

export const addBreedingRecord = async (petId, recordData) => {
    try {
        const record = {
            petId,
            type: 'Breeding',
            title: 'Mating Record',
            date: recordData.date,
            details: {
                partner: recordData.partner,
                outcome: recordData.outcome,
                litterSize: recordData.litterSize,
                notes: recordData.notes
            }
        };
        const { data } = await API.post('/medical-records', record);
        // Dispatch events to notify other components
        window.dispatchEvent(new Event('breedingRecordUpdate'));
        window.dispatchEvent(new Event('medicalRecordUpdate'));
        return data;
    } catch (error) {
        console.error("Error adding breeding record", error);
        throw error;
    }
};

export const deleteBreedingRecord = async (id) => {
    try {
        await API.delete(`/medical-records/${id}`);
        // Dispatch events to notify other components
        window.dispatchEvent(new Event('breedingRecordUpdate'));
        window.dispatchEvent(new Event('medicalRecordUpdate'));
    } catch (error) {
         console.error("Error deleting breeding record", error);
         throw error;
    }
};
