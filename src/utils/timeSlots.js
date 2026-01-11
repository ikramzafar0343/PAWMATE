/**
 * Generate time slots in specified interval (in minutes)
 * @param {number} interval - Interval in minutes (default: 30)
 * @returns {Array} Array of time slot objects with start and end times
 */
export const generateTimeSlots = (interval = 30) => {
  const slots = [];
  const totalMinutes = 24 * 60; // 24 hours in minutes
  
  for (let minutes = 0; minutes < totalMinutes; minutes += interval) {
    const startHours = Math.floor(minutes / 60);
    const startMins = minutes % 60;
    const endMinutes = minutes + interval;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    
    const startTime = formatTime(startHours, startMins);
    const endTime = formatTime(endHours, endMins);
    
    slots.push({
      start: startTime,
      end: endTime,
      id: `${startTime}-${endTime}`,
      display: formatDisplayTime(startHours, startMins, endHours, endMins)
    });
  }
  
  return slots;
};

/**
 * Format time as HH:mm
 */
const formatTime = (hours, minutes) => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Format time for display (e.g., "12:00 AM – 12:30 AM")
 */
const formatDisplayTime = (startHours, startMins, endHours, endMins) => {
  const start = format12Hour(startHours, startMins);
  const end = format12Hour(endHours, endMins);
  return `${start} – ${end}`;
};

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 */
const format12Hour = (hours, minutes) => {
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  const displayMins = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMins} ${period}`;
};

/**
 * Group time slots by time period
 */
export const groupSlotsByPeriod = (slots) => {
  const groups = {
    'Early Morning': [], // 12 AM - 6 AM
    'Morning': [],       // 6 AM - 12 PM
    'Afternoon': [],     // 12 PM - 6 PM
    'Evening/Night': []  // 6 PM - 12 AM
  };
  
  slots.forEach(slot => {
    const [hours, minutes] = slot.start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes >= 0 && totalMinutes < 6 * 60) {
      groups['Early Morning'].push(slot);
    } else if (totalMinutes >= 6 * 60 && totalMinutes < 12 * 60) {
      groups['Morning'].push(slot);
    } else if (totalMinutes >= 12 * 60 && totalMinutes < 18 * 60) {
      groups['Afternoon'].push(slot);
    } else {
      groups['Evening/Night'].push(slot);
    }
  });
  
  return groups;
};

/**
 * Convert availability array to slot IDs for easy checking
 */
export const availabilityToSlotIds = (availability) => {
  if (!Array.isArray(availability)) return new Set();
  
  const slotIds = new Set();
  availability.forEach(slot => {
    if (typeof slot === 'string') {
      // Legacy format: "Morning (9 AM - 12 PM)" -> skip, will be migrated
      return;
    }
    if (slot.start && slot.end) {
      slotIds.add(`${slot.start}-${slot.end}`);
    }
  });
  
  return slotIds;
};

/**
 * Convert selected slot IDs to availability array format
 */
export const slotIdsToAvailability = (slotIds, allSlots) => {
  const availability = [];
  slotIds.forEach(slotId => {
    const slot = allSlots.find(s => s.id === slotId);
    if (slot) {
      availability.push({
        start: slot.start,
        end: slot.end
      });
    }
  });
  return availability;
};

