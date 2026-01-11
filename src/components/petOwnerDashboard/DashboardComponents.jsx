import React, { useState, useEffect, useMemo, memo } from 'react';
import { 
  FaSearch, FaBell, FaPaw, FaSyringe, FaUserMd, 
  FaVenus, FaBrain, FaCamera, FaCalendarPlus, 
  FaPills, 
  FaChevronRight, FaCheck, FaExclamationTriangle, FaTrash
} from 'react-icons/fa'
import API from '../../api/client';
import { getConsultations } from '../../utils/consultationStore';
import { getVaccinations } from '../../utils/vaccinationStore';
import { getAppointments } from '../../utils/appointmentStore';
import { getAverageHealthScore } from '../../utils/aiDiagnosisStore';
import { getCycleData, calculateCycleStatus } from '../../utils/breedingStore';

// Helper to parse various date/time formats into a Date object
const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    console.warn('[parseDateTime] Missing date or time:', dateStr, timeStr);
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
    console.warn('[parseDateTime] Invalid date:', cleanDate);
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
    console.warn('[parseDateTime] Invalid time:', cleanTime);
    return new Date(0);
  }
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  // Set time on the date
  date.setHours(hours, minutes, 0, 0);
  
  // Final validation
  if (isNaN(date.getTime()) || date.getTime() === 0) {
    console.warn('[parseDateTime] Failed to create valid date from:', cleanDate, cleanTime);
    return new Date(0);
  }
  
  return date;
};

// 1. Navbar
export function DashboardNavbar() {
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <FaPaw className="text-blue-600 text-2xl" />
        <span className="text-xl font-bold text-gray-800">PetCare</span>
      </div>

      {/* Nav Links - Note: This component is not used, Navbar handles navigation */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
        <span className="text-blue-600">Dashboard</span>
        <span className="text-gray-600">My Pets</span>
        <span className="text-gray-600">Services</span>
        <span className="text-gray-600">Health Records</span>
        <span className="text-gray-600">Community</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-gray-50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none w-64"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full">
          <FaBell />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </nav>
  )
}

// 2. Welcome Section (Optimized - non-blocking)
export function WelcomeSection() {
  const [userName, setUserName] = useState(localStorage.getItem('userFirstName') || 'Friend');

  useEffect(() => {
    // Fetch in background, don't block UI
    const fetchProfile = async () => {
      try {
        const startTime = performance.now();
        const { data } = await API.get('/auth/me');
        const firstName = data.name.split(' ')[0];
        setUserName(firstName);
        const endTime = performance.now();
        console.log(`[Performance] WelcomeSection API: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error("Error fetching profile", error);
        // Keep fallback from localStorage
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome back, {userName}!
      </h1>
      <p className="text-gray-500 mt-1">Your pets are healthy and happy. Keep up the great care!</p>
    </div>
  )
}

// 3. Pet Card Component (Optimized with lazy loading and memo)
const PetCardComponent = ({ id, name, breed, age, image, status, statusColor, weight, onNavigate, onDelete }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleImageLoad = React.useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = React.useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleClick = React.useCallback(() => {
    if (onNavigate) {
      onNavigate('petDetails', { id, name, breed, age, weight, image, status, statusColor });
    }
  }, [onNavigate, id, name, breed, age, weight, image, status, statusColor]);

  const handleDelete = React.useCallback((e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this pet?')) {
      onDelete(id);
    }
  }, [onDelete, id]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition relative group">
      {onDelete && (
        <button 
          onClick={handleDelete}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Delete Pet"
        >
          <FaTrash />
        </button>
      )}
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-gray-50 bg-gray-100">
        {!imageLoaded && (
          <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        )}
        <img 
          src={imageError ? 'https://via.placeholder.com/200?text=Pet' : image} 
          alt={name} 
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      <h3 className="text-xl font-bold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500 mb-1">{breed}</p>
      <p className="text-xs text-gray-400 mb-4">{age} • {weight}</p>

      <button 
        onClick={handleClick}
        className="w-full py-2.5 rounded-xl bg-red-400 text-white font-medium hover:bg-red-500 transition shadow-sm shadow-red-100"
      >
        View Profile
      </button>
    </div>
  );
};

PetCardComponent.displayName = 'PetCard';

export const PetCard = memo(PetCardComponent);

// 4. Vaccination Reminders (Optimized with performance logging)
export const VaccinationReminders = memo(function VaccinationReminders({ onNavigate, selectedPet }) {
  const [reminders, setReminders] = useState([]);
 
  useEffect(() => {
    const fetchVaccinations = async () => {
      if (!selectedPet) {
        setReminders([]);
        return;
      }
      
      try {
          const startTime = performance.now();
          const all = await getVaccinations();
          
          // Filter by selected pet if provided
          const petId = selectedPet._id || selectedPet.id;
          const filtered = petId ? all.filter(vax => {
            const vaxPetId = vax.petId?._id || vax.petId || vax.petId?.id;
            return vaxPetId?.toString() === petId.toString();
          }) : all;
          
          const sorted = filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          setReminders(sorted.slice(0, 3));
          const endTime = performance.now();
          console.log(`[Performance] VaccinationReminders: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
          console.error("Error fetching vaccinations", error);
          setReminders([]);
      }
    };
    fetchVaccinations();
  }, [selectedPet]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-orange-50 rounded-2xl p-6 relative overflow-hidden">

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3 text-orange-800">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FaSyringe className="text-xl" />
          </div>
          <h3 className="font-bold text-lg">Vaccinations</h3>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('vaccination')}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-white px-3 py-1.5 rounded-full shadow-sm hover:shadow transition"
        >
          View All
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        {reminders.length > 0 ? (
          reminders.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {item.petName}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400 group-hover:text-orange-500 transition-colors">
                  {formatDate(item.dueDate)}
                </span>
              </div>
              
              <h4 className="font-bold text-gray-800 text-sm mb-1">{item.vaccineName}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaUserMd className="text-gray-300" />
                {item.vetName && item.clinicName 
                  ? `${item.vetName} - ${item.clinicName}`
                  : item.vetName || item.clinicName || 'Unknown Clinic'
                }
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 bg-white/50 rounded-xl">
            <p className="text-sm">No upcoming vaccinations</p>
          </div>
        )}
      </div>
    </div>
  )
});

// 5. Upcoming Appointments (Optimized - accepts shared data)
export function UpcomingAppointments({ onNavigate, appointmentsData = null, selectedPet = null }) {
  const [appointments, setAppointments] = useState([]);
 
  useEffect(() => {
    // If no pet is selected, show empty
    if (!selectedPet) {
      setAppointments([]);
      return;
    }
    
    // If data is provided from parent, use it (no API call needed)
    if (appointmentsData && Array.isArray(appointmentsData)) {
      // Filter by selected pet if provided
      const petId = selectedPet._id || selectedPet.id;
      let filteredData = appointmentsData;
      if (petId) {
        filteredData = appointmentsData.filter(appt => {
          const apptPetId = appt.petId?._id || appt.petId || appt.petId?.id;
          return apptPetId?.toString() === petId.toString();
        });
      }
      
      const now = new Date();
      console.log('[UpcomingAppointments] Processing appointments:', filteredData.length, 'for pet:', selectedPet.name);
      
      const upcoming = appointmentsData.filter(appt => {
        // Skip cancelled or completed appointments
        if (appt.status === 'Cancelled' || appt.status === 'cancelled' || appt.status === 'Completed') {
          console.log(`[UpcomingAppointments] Skipping ${appt.status} appointment:`, appt._id || appt.id);
          return false;
        }
        
        // Log raw appointment data for debugging
        console.log('[UpcomingAppointments] Checking appointment:', {
          id: appt._id || appt.id,
          date: appt.date,
          time: appt.time,
          status: appt.status,
          vetName: appt.vetId?.name || appt.vetName
        });
        
        // Parse appointment date/time
        const apptDate = parseDateTime(appt.date, appt.time);
        
        // Check if date parsing failed (returns epoch)
        if (apptDate.getTime() === 0) {
          console.warn('[UpcomingAppointments] Failed to parse appointment date/time:', appt.date, appt.time);
          return false;
        }
        
        // Calculate time difference
        const timeDiff = apptDate.getTime() - now.getTime();
        const minutesUntilAppt = timeDiff / (1000 * 60);
        
        console.log(`[UpcomingAppointments] Appointment ${appt._id || appt.id}: ${appt.date} ${appt.time} - Parsed: ${apptDate.toLocaleString()} - ${minutesUntilAppt.toFixed(1)} minutes away`);
        
        // Show if appointment is in the future
        // If it's more than 30 minutes away, show in Upcoming Appointments
        // If it's within 30 minutes, it will show in Active Consultations
        // If it's in the past, it will show in Consultation History
        if (minutesUntilAppt <= 0) {
          console.log(`[UpcomingAppointments] Appointment is in the past (${apptDate.toLocaleString()}), will show in Consultation History`);
          return false; // Past appointments go to history, not upcoming
        }
        
        const shouldShow = minutesUntilAppt > 30;
        if (!shouldShow) {
          console.log(`[UpcomingAppointments] Appointment is within 30 minutes (${minutesUntilAppt.toFixed(1)} min), will show in Active Consultations instead`);
        }
        return shouldShow;
      });
      
      // Sort by date/time (earliest first)
      upcoming.sort((a, b) => {
        const dateA = parseDateTime(a.date, a.time);
        const dateB = parseDateTime(b.date, b.time);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('[UpcomingAppointments] Filtered to', upcoming.length, 'upcoming appointments');
      
      // Take first 3 upcoming appointments
      setAppointments(upcoming.slice(0, 3));
      return;
    }

    // Fallback: fetch independently if no shared data
    const fetchAppointments = async () => {
      try {
          const startTime = performance.now();
          const all = await getAppointments();
          const endTime = performance.now();
          console.log(`[Performance] UpcomingAppointments API: ${(endTime - startTime).toFixed(2)}ms`);
          
          if (!Array.isArray(all)) {
            setAppointments([]);
            return;
          }
          
          // Filter by selected pet
          const petId = selectedPet._id || selectedPet.id;
          let filtered = all;
          if (petId) {
            filtered = all.filter(appt => {
              const apptPetId = appt.petId?._id || appt.petId || appt.petId?.id;
              return apptPetId?.toString() === petId.toString();
            });
          }
          
          const uniqueAppointments = [];
          const seenIds = new Set();
          for (const appt of filtered) {
            const id = appt._id || appt.id;
            if (id && !seenIds.has(id.toString())) {
              seenIds.add(id.toString());
              uniqueAppointments.push(appt);
            }
          }
          
          const now = new Date();
          const upcoming = uniqueAppointments.filter(appt => {
            // Skip cancelled or completed appointments
            if (appt.status === 'Cancelled' || appt.status === 'cancelled' || appt.status === 'Completed') return false;
            
            // Parse appointment date/time
            const apptDate = parseDateTime(appt.date, appt.time);
            
            // Check if date parsing failed (returns epoch)
            if (apptDate.getTime() === 0) {
              console.warn('Failed to parse appointment date/time:', appt.date, appt.time);
              return false;
            }
            
            // Only show appointments that are more than 30 minutes away
            // Appointments happening soon (within 30 min) should show in Active Consultations
            const timeDiff = apptDate.getTime() - now.getTime();
            const minutesUntilAppt = timeDiff / (1000 * 60);
            
            console.log(`[UpcomingAppointments] Appointment ${appt._id || appt.id}: ${appt.date} ${appt.time} - Parsed: ${apptDate.toLocaleString()} - ${minutesUntilAppt.toFixed(1)} minutes away`);
            
            // Show if appointment is in the future
            // If it's more than 30 minutes away, show in Upcoming Appointments
            // If it's within 30 minutes, it will show in Active Consultations
            if (minutesUntilAppt <= 0) {
              console.log(`[UpcomingAppointments] Appointment is in the past, skipping`);
              return false;
            }
            
            const shouldShow = minutesUntilAppt > 30;
            if (!shouldShow) {
              console.log(`[UpcomingAppointments] Appointment is within 30 minutes (${minutesUntilAppt.toFixed(1)} min), will show in Active Consultations instead`);
            }
            return shouldShow;
          });
          
          // Sort by date/time (earliest first)
          upcoming.sort((a, b) => {
            const dateA = parseDateTime(a.date, a.time);
            const dateB = parseDateTime(b.date, b.time);
            return dateA.getTime() - dateB.getTime();
          });
          
          // Take first 3 upcoming appointments
          setAppointments(upcoming.slice(0, 3)); 
      } catch (error) {
          console.error("Error fetching appointments", error);
          setAppointments([]);
      }
    };
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 60000);
    return () => clearInterval(interval);
  }, [appointmentsData, selectedPet]);

  // Always show the component, even if empty (shows "No upcoming appointments" message)

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">Upcoming Appointments</h3>
        <button 
            onClick={() => onNavigate && onNavigate('consultationHistory')} 
            className="text-sm text-blue-600 font-medium hover:underline"
        >
            View All
        </button>
      </div>
      {appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm mb-4">No upcoming appointments</p>
          <button
            onClick={() => onNavigate && onNavigate('appointment')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Book New Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
             const vetName = (appt.vetId && appt.vetId.name) || appt.vetName || 'Vet';
             const petName = (appt.petId && appt.petId.name) || appt.petName || 'Pet';
             const uniqueId = appt._id || appt.id || `appt-${Date.now()}-${Math.random()}`;
             return (
            <div key={uniqueId} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0 overflow-hidden">
                   <img 
                      src={appt.vetId?.image || `https://ui-avatars.com/api/?name=${vetName.replace(' ', '+')}&background=random`} 
                      alt={vetName}
                      className="w-full h-full object-cover"
                   />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900">{vetName}</h4>
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">{petName}</span>
                      <span className="text-gray-400">•</span>
                      <span>{appt.date} at {appt.time}</span>
                   </div>
                 </div>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  appt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                  {appt.status}
              </span>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

// 6. Active Consultations (Optimized - accepts shared data)
export function ActiveConsultations({ onNavigate, appointmentsData = null, selectedPet = null }) {
  const [consultations, setConsultations] = useState([]);
 
  useEffect(() => {
    // If no pet is selected, show empty
    if (!selectedPet) {
      setConsultations([]);
      return;
    }
    
    // If data is provided from parent, use it (no API call needed)
    if (appointmentsData) {
      // Filter by selected pet
      const petId = selectedPet._id || selectedPet.id;
      let filteredData = appointmentsData;
      if (petId && Array.isArray(appointmentsData)) {
        filteredData = appointmentsData.filter(appt => {
          const apptPetId = appt.petId?._id || appt.petId || appt.petId?.id;
          return apptPetId?.toString() === petId.toString();
        });
      }
      
      const now = new Date();
      const active = filteredData.filter(appt => {
             // Show appointments with Scheduled or Confirmed status
             if (appt.status !== 'Confirmed' && appt.status !== 'Scheduled' && appt.status !== 'In Progress') return false;
             if (appt.status === 'Cancelled' || appt.status === 'cancelled') return false;
             
             if (!appt.date || !appt.time) return false;
             
             const apptDate = parseDateTime(appt.date, appt.time);
             
             // Skip if date parsing failed
             if (apptDate.getTime() === 0) return false;
             
             const endTime = new Date(apptDate);
             endTime.setMinutes(endTime.getMinutes() + 30); // Consultation window is 30 minutes
             
             // Show appointments that:
             // 1. Have started (now >= apptDate) AND are still within consultation window (now < endTime)
             // 2. OR are starting soon (within 30 minutes from now)
             const timeDiff = apptDate.getTime() - now.getTime();
             const minutesUntilAppt = timeDiff / (1000 * 60);
             
             // Active if: started and within window, OR starting within 30 minutes
             // Past appointments (after consultation window) go to history
             const isActive = (now >= apptDate && now < endTime) || (minutesUntilAppt >= 0 && minutesUntilAppt <= 30);
             
             if (!isActive && minutesUntilAppt < 0) {
               console.log(`[ActiveConsultations] Appointment ${appt._id || appt.id} is past consultation window, will show in Consultation History`);
             }
             
             return isActive;
        }).map(appt => {
             const vetName = (appt.vetId && appt.vetId.name) || 'Unknown Vet';
             const petName = (appt.petId && appt.petId.name) || 'Unknown Pet';
             return {
                id: appt._id || appt.id,
                doctorName: vetName,
                details: `${petName} - ${appt.type || 'Consultation'}`,
                startTime: appt.time,
                statusColor: 'bg-green-100 text-green-700',
                statusLabel: 'In Progress',
                doctorImage: (appt.vetId && appt.vetId.image) || `https://ui-avatars.com/api/?name=${vetName.replace(' ', '+')}&background=random`
             };
        });
      setConsultations(active);
      return;
    }

    // Fallback: fetch independently if no shared data
    const fetchConsultations = async () => {
      try {
        if (!selectedPet) {
          setConsultations([]);
          return;
        }
        
        const startTime = performance.now();
        const allAppointments = await getAppointments();
        const endTime = performance.now();
        console.log(`[Performance] ActiveConsultations API: ${(endTime - startTime).toFixed(2)}ms`);
        
        // Filter by selected pet
        const petId = selectedPet._id || selectedPet.id;
        let filtered = allAppointments;
        if (petId) {
          filtered = allAppointments.filter(appt => {
            const apptPetId = appt.petId?._id || appt.petId || appt.petId?.id;
            return apptPetId?.toString() === petId.toString();
          });
        }
        
        const now = new Date();
        const active = filtered.filter(appt => {
             // Show appointments with Scheduled or Confirmed status
             if (appt.status !== 'Confirmed' && appt.status !== 'Scheduled' && appt.status !== 'In Progress') return false;
             if (appt.status === 'Cancelled' || appt.status === 'cancelled') return false;
             
             if (!appt.date || !appt.time) return false;
             
             const apptDate = parseDateTime(appt.date, appt.time);
             
             // Skip if date parsing failed
             if (apptDate.getTime() === 0) return false;
             
             const endTime = new Date(apptDate);
             endTime.setMinutes(endTime.getMinutes() + 30); // Consultation window is 30 minutes
             
             // Show appointments that:
             // 1. Have started (now >= apptDate) AND are still within consultation window (now < endTime)
             // 2. OR are starting soon (within 30 minutes from now)
             const timeDiff = apptDate.getTime() - now.getTime();
             const minutesUntilAppt = timeDiff / (1000 * 60);
             
             // Active if: started and within window, OR starting within 30 minutes
             // Past appointments (after consultation window) go to history
             const isActive = (now >= apptDate && now < endTime) || (minutesUntilAppt >= 0 && minutesUntilAppt <= 30);
             
             if (!isActive && minutesUntilAppt < 0) {
               console.log(`[ActiveConsultations] Appointment ${appt._id || appt.id} is past consultation window, will show in Consultation History`);
             }
             
             return isActive;
        }).map(appt => {
             const vetName = (appt.vetId && appt.vetId.name) || 'Unknown Vet';
             const petName = (appt.petId && appt.petId.name) || 'Unknown Pet';
             return {
                id: appt._id || appt.id,
                doctorName: vetName,
                details: `${petName} - ${appt.type || 'Consultation'}`,
                startTime: appt.time,
                statusColor: 'bg-green-100 text-green-700',
                statusLabel: 'In Progress',
                doctorImage: (appt.vetId && appt.vetId.image) || `https://ui-avatars.com/api/?name=${vetName.replace(' ', '+')}&background=random`
             };
        });
        
        setConsultations(active);
      } catch (error) {
        console.error("Error fetching active consultations", error);
      }
    };
    
    fetchConsultations();
    window.addEventListener('appointmentUpdate', fetchConsultations);
    window.addEventListener('consultationUpdate', fetchConsultations);
    
    const interval = setInterval(fetchConsultations, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointmentUpdate', fetchConsultations);
      window.removeEventListener('consultationUpdate', fetchConsultations);
    };
  }, [appointmentsData, selectedPet]);

  if (consultations.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Active Consultations</h3>
        <p className="text-gray-500 text-sm">No active consultations at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">Active Consultations</h3>
      <div className="space-y-4">
        {consultations.map((consultation) => (
          <div key={consultation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img src={consultation.doctorImage} alt={consultation.doctorName} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{consultation.doctorName}</h4>
                <p className="text-sm text-gray-500">{consultation.details}</p>
                <p className="text-xs text-gray-400 mt-1">{consultation.startTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${consultation.statusColor}`}>
                {consultation.statusLabel}
              </span>
              <button 
                onClick={() => onNavigate && onNavigate('consultation', { id: consultation.id, doctor: consultation.doctorName })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Continue Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 6. Breeding Monitor (Optimized - non-blocking)
export function BreedingMonitor({ pet, onNavigate }) {
  const [cycleInfo, setCycleInfo] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!pet) {
        setCycleInfo(null);
        return;
      }
      try {
        const startTime = performance.now();
        const data = await getCycleData(pet.id || pet._id);
        if (data) {
          const info = calculateCycleStatus(data.lastHeatDate, data.cycleLength);
          setCycleInfo(info);
        } else {
            setCycleInfo(null);
        }
        const endTime = performance.now();
        console.log(`[Performance] BreedingMonitor: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
          console.error("Error loading cycle data", error);
          setCycleInfo(null);
      }
    };
    loadData();
  }, [pet]);

  if (!pet) {
      return null; // Or placeholder
  }

  if (!cycleInfo) {
      return (
        <div className="bg-pink-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-pink-800 font-bold">Breeding Monitor</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
             <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 text-pink-500">
                 <FaVenus />
             </div>
             <p className="text-sm text-gray-500 mb-3">No breeding data tracked for {pet.name}</p>
             <button onClick={() => onNavigate && onNavigate('breeding', { pet })} className="text-pink-600 font-bold text-sm hover:underline">Start Tracking</button>
          </div>
        </div>
      );
  }

  return (
    <div className="bg-pink-50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-pink-800 font-bold">Breeding Cycle Monitor</h3>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-gray-900">{pet.name}</span>
          <FaVenus className="text-pink-500" />
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Current Phase: <span className="text-gray-900 font-medium">{cycleInfo.phase}</span></span>
          <span className="text-green-600 font-bold text-xs">Day {cycleInfo.dayOfCycle || 0}</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full mb-3 overflow-hidden">
          <div className="bg-pink-400 h-full rounded-full transition-all" style={{ width: `${Math.min(Math.max(cycleInfo.progress || 0, 0), 100)}%` }}></div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-500">
            <FaCalendarPlus /> Next cycle: {cycleInfo.nextHeatDate || 'N/A'}
          </span>
          <button 
            onClick={() => onNavigate && onNavigate('breeding', { pet })}
            className="text-pink-600 font-bold hover:underline"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

// 7. AI Health Check (Optimized - non-blocking)
export function AiHealthCheck({ pet, onNavigate }) {
  const [score, setScore] = useState(0);
 
  useEffect(() => {
    const fetchScore = async () => {
      if (!pet) {
          setScore(0);
          return;
      }
      try {
          const startTime = performance.now();
          const s = await getAverageHealthScore(pet.id || pet._id);
          setScore(s);
          const endTime = performance.now();
          console.log(`[Performance] AiHealthCheck: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
          console.error("Error fetching health score", error);
          setScore(0);
      }
    };
    fetchScore();
  }, [pet]);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl p-6 text-white text-center shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative w-24 h-24 mx-auto mb-4">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48" cy="48" r={radius}
            stroke="currentColor" strokeWidth="6" fill="transparent"
            className="text-white/20"
          />
          {/* Progress Circle */}
          <circle
            cx="48" cy="48" r={radius}
            stroke="currentColor" strokeWidth="6" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-white transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
          <span className="text-3xl font-bold leading-none">{score}</span>
          <span className="text-[9px] uppercase opacity-90 font-medium tracking-wide">Avg Score</span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-1">AI Health Check</h3>
      <p className="text-blue-100 text-sm mb-6">{pet ? `Based on recent diagnoses for ${pet.name}` : 'Select a pet to scan'}</p>
      <button 
        onClick={() => onNavigate && onNavigate('detection', { pet })}
        className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-blue-50 transition shadow-sm"
      >
        <FaCamera /> Start Scan
      </button>
    </div>
  )
}

// 8. Footer Quick Services
export function QuickServicesFooter({ onNavigate }) {
  const services = [
    { icon: FaCalendarPlus, label: 'Book Appointment', action: 'appointment' },
    { icon: FaPills, label: 'Order Medication', action: 'medicine' },
  ]

  return (
    <div className="bg-white border-t border-gray-100 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-6 text-center">
        {services.map((svc, idx) => (
          <button 
            key={idx} 
            onClick={() => onNavigate && onNavigate(svc.action)}
            className="flex flex-col items-center gap-4 group w-48 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <svc.icon />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{svc.label}</span>
          </button>
        ))}
      </div>
      <div className="text-center text-xs text-gray-400 mt-12 border-t border-gray-50 pt-8">
        © 2024 PetCare. All rights reserved.
      </div>
    </div>
  )
}
