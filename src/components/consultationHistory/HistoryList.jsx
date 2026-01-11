import React, { useState, useEffect } from 'react';
import HistoryCard from './HistoryCard';
import { getAppointments } from '../../utils/appointmentStore';
import { getConsultations } from '../../utils/consultationStore';
import { getVetById } from '../../utils/vetStore';

// Helper to parse various date/time formats into a Date object (matches DashboardComponents)
const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    return new Date(0); // Return epoch to indicate failure
  }
  
  const cleanDate = dateStr.toString().trim();
  const cleanTime = timeStr.toString().trim();

  // Try combining string first for robust parsing (handles "Jan 5, 2026 12:30 AM")
  const combinedStr = `${cleanDate} ${cleanTime}`;
  const combinedDate = new Date(combinedStr);
  
  if (!isNaN(combinedDate.getTime()) && combinedDate.getTime() > 0) {
    return combinedDate;
  }

  // Handle YYYY-MM-DD format (backend format)
  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    // Backend format: YYYY-MM-DD
    date = new Date(cleanDate);
  } else {
    // Frontend format: "Jan 5, 2026"
    date = new Date(cleanDate);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime()) || date.getTime() === 0) {
    return new Date(0);
  }
  
  // Handle various time formats (with/without space, e.g., "07:30 PM" or "7:30PM" or "01:00 AM")
  let time = cleanTime;
  let period = '';
  
  const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    time = `${timeMatch[1]}:${timeMatch[2]}`;
    period = timeMatch[3] ? timeMatch[3].toUpperCase() : '';
  }

  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  
  if (isNaN(hours) || isNaN(minutes)) {
    return new Date(0);
  }
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  // Set time on the date
  date.setHours(hours, minutes, 0, 0);
  
  // Final validation
  if (isNaN(date.getTime()) || date.getTime() === 0) {
    return new Date(0);
  }
  
  return date;
};

const HistoryList = ({ onNavigate }) => {
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const appointments = await getAppointments();
        const activeConsultations = await getConsultations();
        const now = new Date();
        
        const allConsultations = [...appointments, ...activeConsultations]
          .filter(c => {
            // Skip cancelled appointments
            if (c.status === 'Cancelled' || c.status === 'cancelled') return false;
            
            // Already completed - show in history
            if (c.status === 'Completed' || c.status === 'completed') return true;
            
            // Check if appointment time has passed (appointment slot + 30 min consultation window)
            if (c.status === 'Confirmed' || c.status === 'Scheduled' || c.status === 'In Progress') {
                if (!c.date || !c.time) return false;
                
                const apptDate = parseDateTime(c.date, c.time);
                
                // If parsing failed, skip
                if (apptDate.getTime() === 0) {
                  console.warn('[HistoryList] Failed to parse date/time:', c.date, c.time);
                  return false;
                }
                
                // Consultation window is 30 minutes after appointment time
                const endTime = new Date(apptDate);
                endTime.setMinutes(endTime.getMinutes() + 30);
                
                // If current time is past the consultation end time, show in history
                const isPast = now >= endTime;
                
                if (isPast) {
                  console.log(`[HistoryList] Appointment ${c._id || c.id} is past (${c.date} ${c.time}), adding to history`);
                }
                
                return isPast;
            }
            return false;
          });
        
        const formatted = await Promise.all(
          allConsultations.map(async (c) => {
            let vetData = null;
            const vetId = c.vetId?._id || c.vetId?.id || c.vetId;
            
            // Try to get vet data if we have a vetId
            if (vetId) {
              try {
                vetData = await getVetById(vetId);
              } catch (error) {
                console.warn(`[HistoryList] Failed to fetch vet data for ${vetId}:`, error);
              }
            }
            
            const date = c.date ? new Date(c.date) : new Date();
            const vetName = c.vetName || c.doctorName || c.vetId?.name || vetData?.name || "Dr. Unknown";
            
            // Extract image from multiple possible sources
            const vetImage = 
              c.vetId?.image ||           // Direct from populated vetId object
              c.doctorImage ||            // From appointment data
              vetData?.image ||           // From fetched vet data
              null;                       // Will use fallback in component
            
            console.log(`[HistoryList] Consultation ${c._id || c.id}: vetName=${vetName}, vetImage=${vetImage ? 'found' : 'not found'}, vetId=${vetId}`);
            
            return {
              id: c._id || c.id,
              vetName: vetName,
              vetImage: vetImage, // Will use fallback in component if null
              specialization: vetData?.specialization || c.vetId?.specialization || "General Practice",
              status: "Completed",
              type: c.type || "Video Call",
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: c.time || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              diagnosis: c.description || c.reason || "General Consultation",
              notes: c.details || "Consultation completed successfully.",
              prescription: false,
              rating: 4.8
            };
          })
        );
        
        formatted.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateB - dateA;
        });
        
        setConsultations(formatted);
      } catch (error) {
        console.error("Error loading consultation history", error);
        setConsultations([]);
      }
    };
    
    loadHistory();
    
    // Refresh every 60 seconds to pick up appointments that have passed their time
    const interval = setInterval(loadHistory, 60000);
    
    const handleUpdate = () => loadHistory();
    window.addEventListener('appointmentUpdate', handleUpdate);
    window.addEventListener('consultationUpdate', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointmentUpdate', handleUpdate);
      window.removeEventListener('consultationUpdate', handleUpdate);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {consultations.length > 0 ? (
        consultations.map((consultation) => (
          <HistoryCard key={consultation.id} consultation={consultation} onNavigate={onNavigate} />
        ))
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          <p>No consultation history available yet.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
