import { 
  FaSearch, FaBell, FaPaw, FaUserMd, FaCalendarAlt, FaClock, 
  FaExclamationCircle, FaPrescriptionBottleAlt, FaFileMedical,
  FaPlus, FaFlask, FaCommentDots, FaChevronRight, FaCheck
} from 'react-icons/fa'
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConsultations, getActiveConsultations, completeConsultation } from '../../utils/consultationStore';
import { getAppointments, updateAppointmentStatus, getRevenue } from '../../utils/appointmentStore';
import { getPets } from '../../utils/petStore';
import { getMedicalRecords } from '../../utils/medicalRecordStore';
import { getPendingPrescriptions, approvePrescription, getPrescriptions } from '../../utils/prescriptionStore';

// 1. Navbar
export function VetNavbar() {
  const [bellCount, setBellCount] = useState(0);
  useEffect(() => {
    const load = async () => {
      try {
        const appointments = await getAppointments();
        const today = new Date().toISOString().split('T')[0];
        const overdue = appointments.filter(a => {
          const d = a.date ? new Date(a.date).toISOString().split('T')[0] : null;
          return a.status === 'Scheduled' && d && d < today;
        }).length;
        const emergencies = appointments.filter(a => a.type === 'Emergency' && a.status === 'Scheduled').length;
        setBellCount(overdue + emergencies);
      } catch (e) {
        setBellCount(0);
      }
    };
    load();
    window.addEventListener('appointmentUpdate', load);
    return () => window.removeEventListener('appointmentUpdate', load);
  }, []);
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <FaPaw className="text-blue-600 text-2xl" />
        <span className="text-xl font-bold text-gray-800">PetCare Pro</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
        <span className="text-blue-600">Dashboard</span>
        <span className="text-gray-600">Appointments</span>
        <span className="text-gray-600">Patients</span>
        <span className="text-gray-600">Prescriptions</span>
        <span className="text-gray-600">Reports</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            className="bg-gray-50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none w-64"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full">
          <FaBell />
          {bellCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white">
              {bellCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
            <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="Dr" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{localStorage.getItem('vetName') || 'Dr. Johnson'}</span>
        </div>
      </div>
    </nav>
  )
}

// 2. Welcome Header
export function WelcomeHeader({ onNavigate }) {
  const [vetName, setVetName] = useState(() => {
    // Try to get name from various localStorage keys or API
    return localStorage.getItem('userName') || 
           localStorage.getItem('userFirstName') || 
           localStorage.getItem('vetName') || 
           'Dr.';
  });
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    const loadVetName = async () => {
      try {
        // Try to get name from getCurrentUser API
        const { getCurrentUser } = await import('../../utils/userStore');
        const user = await getCurrentUser();
        if (user && user.name) {
          setVetName(user.name);
          // Update localStorage for consistency
          localStorage.setItem('userName', user.name);
          if (user.name.split(' ').length > 0) {
            localStorage.setItem('userFirstName', user.name.split(' ')[0]);
          }
        } else {
          // Fallback to localStorage
          const name = localStorage.getItem('userName') || 
                      localStorage.getItem('userFirstName') || 
                      localStorage.getItem('vetName');
          if (name) setVetName(name);
        }
      } catch (error) {
        console.error('Error loading vet name', error);
        // Fallback to localStorage
        const name = localStorage.getItem('userName') || 
                    localStorage.getItem('userFirstName') || 
                    localStorage.getItem('vetName');
        if (name) setVetName(name);
      }
    };

    loadVetName();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const appointments = await getAppointments();
        // Count total bookings (excluding cancelled and completed)
        const totalBookings = appointments.filter(appt => 
          appt.status !== 'Cancelled' && appt.status !== 'Completed'
        );
        const urgent = appointments.filter(appt => appt.status === 'Scheduled' && appt.type === 'Emergency');
        
        setAppointmentCount(totalBookings.length);
        setUrgentCount(urgent.length);
      } catch (error) {
        console.error("Error loading appointment data", error);
      }
    };
    
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('appointmentUpdate', handleUpdate);
    return () => window.removeEventListener('appointmentUpdate', handleUpdate);
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      // Reload name when profile is updated
      const name = localStorage.getItem('userName') || 
                   localStorage.getItem('userFirstName') || 
                   localStorage.getItem('vetName');
      if (name) setVetName(name);
      
      // Also try to fetch from API
      const loadVetName = async () => {
        try {
          const { getCurrentUser } = await import('../../utils/userStore');
          const user = await getCurrentUser();
          if (user && user.name) {
            setVetName(user.name);
            localStorage.setItem('userName', user.name);
          }
        } catch (error) {
          // Ignore errors, use localStorage fallback
        }
      };
      loadVetName();
    };
    window.addEventListener('userProfileUpdate', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdate', handleProfileUpdate);
  }, []);

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-6 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{getGreeting()}, {vetName}</h1>
          <p className="text-gray-500 text-sm mt-1">{dateStr} • {timeStr}</p>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('appointment')}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg"
          >
            <FaCalendarAlt />
            <span>{appointmentCount} total bookings</span>
          </button>
          {urgentCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('appointment')}
              className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-lg"
            >
              <FaExclamationCircle />
              <span>{urgentCount} urgent cases</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// 3. Today's Schedule
export function TodaySchedule() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [revenueToday, setRevenueToday] = useState(0);
  const [revenueLoading, setRevenueLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // Get today's date in local YYYY-MM-DD format
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        // Pass date to API to filter on backend for efficiency
        const todayAppointments = await getAppointments({ date: todayStr });
        
        console.log('Fetched todayAppointments:', todayAppointments);

        // Map data
        const mapped = todayAppointments
          // .filter(appt => appt.date === todayStr) // REMOVED: Backend already handles filtering
          .map(appt => {
            let status = 'pending';
            // Backend now provides dynamic status: Pending, In Progress, Completed
            const rawStatus = appt.status || 'Scheduled';
            
            if (rawStatus === 'In Progress') status = 'in-progress';
            else if (rawStatus === 'Completed') status = 'completed';
            else if (rawStatus === 'Cancelled') status = 'cancelled';
            else if (rawStatus === 'Pending') status = 'pending';
            else status = 'pending'; // Scheduled, Confirmed, etc.
            
            const petName = appt.petId?.name || appt.petName || 'Unknown Pet';
            const ownerName = appt.ownerId?.name || 'Pet Owner';
            
            return {
              id: appt._id || appt.id,
              time: appt.time,
              date: appt.date,
              pet: petName,
              owner: ownerName, 
              details: `${appt.type || 'Consultation'}`,
              type: appt.type || 'Routine',
              status: status,
              rawStatus: rawStatus,
              image: appt.petId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(petName)}&background=random`,
              petId: appt.petId?._id || appt.petId || appt.petId
            };
          });

        // Sort: Pending -> In Progress -> Completed
        // Secondary sort: Time
        const statusOrder = { 'pending': 1, 'in-progress': 2, 'completed': 3, 'cancelled': 4 };
        mapped.sort((a, b) => {
             const orderA = statusOrder[a.status] || 99;
             const orderB = statusOrder[b.status] || 99;
             if (orderA !== orderB) return orderA - orderB;
             
             // Sort by time
             const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
             const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
             return timeA - timeB;
        });
        
        setSchedule(mapped);
      } catch (error) {
        console.error("Error fetching schedule", error);
        setSchedule([]);
      }
    };

    fetchSchedule();
    const fetchRevenue = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const rev = await getRevenue(todayStr);
        setRevenueToday((rev?.totalRevenue || 0));
      } catch (e) {
        setRevenueToday(0);
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenue();
    const handleUpdate = () => fetchSchedule();
    window.addEventListener('appointmentUpdate', handleUpdate);
    return () => window.removeEventListener('appointmentUpdate', handleUpdate);
  }, []);

  const filteredSchedule = schedule.filter(item => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return item.status === 'pending';
    if (activeTab === 'In Progress') return item.status === 'in-progress';
    if (activeTab === 'Completed') return item.status === 'completed';
    return true;
  });

  const getTypeColor = (type) => {
    switch(type) {
      case 'Routine': return 'bg-green-100 text-green-700'
      case 'Treatment': return 'bg-blue-100 text-blue-700'
      case 'Emergency': return 'bg-red-100 text-red-700'
      case 'Follow-up': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800">Today's Schedule</h3>
        <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
          {['All', 'Pending', 'In Progress', 'Completed'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'} px-3 py-1 rounded-md transition-all`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {filteredSchedule.length > 0 ? (
          filteredSchedule.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition border border-gray-50 hover:border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img src={item.image} alt={item.pet} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{item.pet}</h4>
                    <span className="text-xs text-gray-400 font-normal">{item.time}</span>
                  </div>
                  <p className="text-xs text-gray-500">{item.owner}</p>
                  <p className="text-xs text-gray-400">{item.details}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeColor(item.type)}`}>
                  {item.type}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50 border border-gray-100">
                    <span className={`w-2 h-2 rounded-full ${
                      item.status === 'in-progress' ? 'bg-blue-500' : 
                      item.status === 'completed' ? 'bg-green-500' : 
                      'bg-gray-400'
                    }`}></span>
                    <span className={`text-xs font-bold ${
                      item.status === 'in-progress' ? 'text-blue-600' : 
                      item.status === 'completed' ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {item.status === 'in-progress' ? 'In Progress' : 
                       item.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4 text-sm">No appointments found.</p>
        )}
      </div>
      <button 
        onClick={() => navigate('/vet/appointments')}
        className="w-full mt-4 text-center text-blue-600 text-xs font-bold hover:underline"
      >
        View All Records
      </button>
    </div>
  )
}

// 4. Active Consultations
export function ActiveConsultations() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActive = async () => {
    try {
      const active = await getActiveConsultations();
      setConsultations(active);
    } catch (error) {
      console.error("Error loading active consultations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
    
    // Auto-refresh every minute to check if consultation time has passed
    const interval = setInterval(fetchActive, 60000);
    
    const handleUpdate = () => fetchActive();
    window.addEventListener('consultationUpdate', handleUpdate);
    window.addEventListener('appointmentUpdate', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('consultationUpdate', handleUpdate);
      window.removeEventListener('appointmentUpdate', handleUpdate);
    };
  }, []);

  const handleComplete = async (id) => {
    if (window.confirm('Are you sure you want to mark this consultation as completed?')) {
      try {
        await completeConsultation(id);
        fetchActive(); // Update local list immediately
        window.dispatchEvent(new Event('consultationUpdate'));
        window.dispatchEvent(new Event('appointmentUpdate'));
      } catch (error) {
        console.error("Error completing consultation", error);
      }
    }
  };

  if (consultations.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800 mb-6">Active Consultations</h3>
        <p className="text-gray-500 text-sm">No active consultations at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg text-gray-800 mb-6">Active Consultations</h3>
      <div className="space-y-4">
        {consultations.map((consultation) => (
          <div key={consultation.id} className="bg-orange-50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-200 shrink-0">
                <img src={consultation.petImage || consultation.image || `https://ui-avatars.com/api/?name=${(consultation.petName || 'P').replace(' ', '+')}&background=random`} alt={consultation.petName} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{consultation.petName}</h4>
                <p className="text-xs text-gray-500">{consultation.ownerName}</p>
                <p className="text-xs text-gray-600 mt-1">{consultation.description || consultation.reason}</p>
              </div>
            </div>
            <div className="text-right w-full sm:w-auto">
              <div className="flex items-center justify-end gap-1 text-orange-600 text-xs font-bold mb-2">
                <FaClock /> {consultation.time} {consultation.date === new Date().toISOString().split('T')[0] ? '' : `(${consultation.date})`}
              </div>
              <div className="w-full sm:w-24 bg-orange-200 h-1.5 rounded-full mb-3 ml-auto">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: '70%' }}></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => handleComplete(consultation.id)}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition flex items-center gap-1"
                >
                  <FaCheck /> Complete
                </button>
                <button 
                  onClick={() => navigate(`/vet/consultation/${consultation.id}`)}
                  className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 5. Urgent Attention
export function UrgentAttention() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const appointments = await getAppointments();
        
        const urgentAlerts = [];
        
        // Check for overdue appointments
        const today = new Date().toISOString().split('T')[0];
        const overdueAppts = appointments.filter(appt => {
          const apptDate = appt.date ? new Date(appt.date).toISOString().split('T')[0] : null;
          if (appt.status === 'Scheduled' && apptDate && apptDate < today) {
            return true;
          }
          return false;
        });
        
        overdueAppts.slice(0, 2).forEach(appt => {
          const petName = appt.petId?.name || appt.petName || 'Pet';
          urgentAlerts.push({
            text: `${petName} - Appointment overdue`,
            color: 'red',
            action: () => navigate(`/vet/patients?query=${petName}`)
          });
        });
        
        // Check for emergency appointments
        const emergencyAppts = appointments.filter(appt => appt.type === 'Emergency' && appt.status === 'Scheduled');
        emergencyAppts.slice(0, 1).forEach(appt => {
          const petName = appt.petId?.name || appt.petName || 'Pet';
          urgentAlerts.push({
            text: `${petName} - Emergency case`,
            color: 'red',
            action: () => navigate(`/vet/consultation/${appt._id || appt.id}`)
          });
        });
      
      // If no alerts, show placeholder
      if (urgentAlerts.length === 0) {
        urgentAlerts.push({
          text: 'All systems normal',
          color: 'green',
          action: () => {}
        });
      }
      
        setAlerts(urgentAlerts);
      } catch (error) {
        console.error("Failed to load urgent alerts:", error);
      }
    };
    
    loadAlerts();
    window.addEventListener('appointmentUpdate', loadAlerts);
    return () => window.removeEventListener('appointmentUpdate', loadAlerts);
  }, [navigate]);

  return (
    <div className="bg-orange-50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 text-orange-700 font-bold">
        <FaExclamationCircle />
        <h3>Urgent Attention Required</h3>
      </div>
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert, idx) => (
            <button key={idx} onClick={alert.action} className="bg-white p-3 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition w-full text-left">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${alert.color === 'red' ? 'bg-red-500' : alert.color === 'orange' ? 'bg-orange-500' : alert.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                <p className="text-sm text-gray-700 font-medium">{alert.text}</p>
              </div>
              <FaChevronRight className="text-gray-300 text-xs" />
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">No urgent alerts</p>
        )}
      </div>
    </div>
  )
}

// 6. Recent Prescriptions (Active/Shared to Pet Owners)
export function PendingPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecentPrescriptions = async () => {
    try {
      setLoading(true);
      // Fetch active prescriptions (status='active' means approved and shared to pet owners)
      const all = await getPrescriptions(null, 'active');
      
      // Sort by creation date (most recent first) and limit to 3
      const sorted = all
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA;
        })
        .slice(0, 3);
      
      const list = sorted.map(p => {
        // Get owner name from populated petId.ownerId or fallback
        const ownerName = p.petId?.ownerId?.name || 
                         (p.petId?.ownerId?.constructor?.name === 'ObjectId' ? 'Owner' : p.petId?.ownerId) ||
                         'Owner';
        
        return {
          id: p._id || p.id,
          pet: p.petId?.name || 'Pet',
          owner: ownerName,
          med: p.medication,
          dose: `${p.dosage} • ${p.duration}`,
          image: p.petId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.petId?.name || 'P')}&background=random`,
          prescriptionId: p._id || p.id,
          date: p.date || p.createdAt
        };
      });
      setPrescriptions(list);
    } catch (e) {
      console.error('Error loading recent prescriptions', e);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentPrescriptions();
    window.addEventListener('prescriptionUpdate', loadRecentPrescriptions);
    return () => window.removeEventListener('prescriptionUpdate', loadRecentPrescriptions);
  }, []);

  const viewPrescription = (id) => {
    navigate('/vet/prescriptions');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">Recent Prescriptions</h3>
        <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{prescriptions.length}</span>
      </div>
      <div className="space-y-3">
        {!loading && prescriptions.length > 0 && prescriptions.map((item) => (
          <div 
            key={item.id} 
            onClick={() => viewPrescription(item.prescriptionId || item.id)}
            className="bg-gray-50 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <img src={item.image} alt={item.pet} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">{item.pet}</h4>
                <p className="text-xs text-gray-600 font-medium truncate">{item.med}</p>
                <p className="text-xs text-gray-500 truncate">{item.dose}</p>
              </div>
              <FaChevronRight className="text-gray-400 text-xs shrink-0" />
            </div>
          </div>
        ))}
        {!loading && prescriptions.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">No recent prescriptions</div>
        )}
        {loading && (
          <div className="text-center text-gray-500 text-sm py-4">Loading...</div>
        )}
      </div>
    </div>
  )
}

// 7. Quick Actions
export function QuickActions() {
  const navigate = useNavigate();
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const dropdownRef = useRef(null);

  // Load patients when dropdown opens
  useEffect(() => {
    if (showMessageDropdown) {
      const loadPatients = async () => {
        try {
          setLoadingPatients(true);
          const appointments = await getAppointments();
          const pets = await getPets();
          
          // Create a map of petId to pet
          const petMapById = new Map();
          pets.forEach(pet => {
            const petId = pet._id || pet.id;
            if (petId) {
              petMapById.set(petId.toString(), pet);
            }
          });
          
          // Get unique pets from appointments with their owner info
          const patientMap = new Map();
          appointments.forEach(appt => {
            const petId = appt.petId?._id || appt.petId;
            if (petId && !patientMap.has(petId)) {
              const apptPet = appt.petId;
              const petFromList = petMapById.get(petId.toString());
              const pet = petFromList || apptPet;
              
              // Get owner name
              let ownerName = 'Pet Owner';
              if (appt.ownerId && typeof appt.ownerId === 'object' && appt.ownerId.name) {
                ownerName = appt.ownerId.name;
              }
              
              const recentAppt = appointments
                .filter(a => {
                  const aPetId = a.petId?._id || a.petId;
                  return aPetId && aPetId.toString() === petId.toString();
                })
                .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
              
              patientMap.set(petId, {
                _id: petId,
                id: petId,
                name: pet?.name || apptPet?.name || 'Unknown Pet',
                ownerName: ownerName,
                image: pet?.image || apptPet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pet?.name || apptPet?.name || 'Pet')}&background=random`,
                appointmentId: recentAppt ? (recentAppt._id || recentAppt.id) : null
              });
            }
          });
          
          setPatients(Array.from(patientMap.values()));
        } catch (error) {
          console.error("Error loading patients", error);
          setPatients([]);
        } finally {
          setLoadingPatients(false);
        }
      };
      
      loadPatients();
    }
  }, [showMessageDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMessageDropdown(false);
      }
    };

    if (showMessageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMessageDropdown]);

  const handleSendMessage = (patient) => {
    if (patient.appointmentId) {
      navigate(`/vet/consultation/${patient.appointmentId}`);
    } else {
      navigate('/vet/consultation/general', { 
        state: { 
          petId: patient._id || patient.id,
          petName: patient.name 
        } 
      });
    }
    setShowMessageDropdown(false);
  };

  const actions = [
    { icon: FaFileMedical, label: 'Add Patient Record', color: 'purple', onClick: () => navigate('/vet/patients') },
    { 
      icon: FaCommentDots, 
      label: 'Send Message', 
      color: 'orange', 
      onClick: () => setShowMessageDropdown(!showMessageDropdown),
      hasDropdown: true
    }
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative" ref={dropdownRef}>
      <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, idx) => (
          <div key={idx} className="relative">
            <button 
              onClick={action.onClick} 
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition border border-gray-50 hover:border-gray-100 w-full"
            >
              <div className={`text-${action.color}-500 text-xl`}>
                <action.icon />
              </div>
              <span className="text-xs font-bold text-gray-600 text-center">{action.label}</span>
            </button>
            
            {/* Dropdown for Send Message */}
            {action.hasDropdown && showMessageDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                {loadingPatients ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Loading patients...</div>
                ) : patients.length > 0 ? (
                  <div className="py-2">
                    {patients.map((patient) => (
                      <button
                        key={patient._id || patient.id}
                        onClick={() => handleSendMessage(patient)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                          <img 
                            src={patient.image} 
                            alt={patient.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-sm truncate">{patient.name}</div>
                          <div className="text-xs text-gray-500 truncate">{patient.ownerName}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No patients found</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// 8. Recent Medical Records
export function RecentRecords() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const pets = await getPets();
        const rows = [];
        for (const p of pets.slice(0, 6)) {
          const recs = await getMedicalRecords(p._id || p.id);
          if (recs && recs.length > 0) {
            const r = recs[0];
            rows.push({
              id: r._id || r.id,
              pet: p.name,
              date: r.date || '',
              desc: r.title || r.type,
              image: p.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'P')}&background=random`
            });
          }
        }
        setItems(rows);
      } catch (e) {
        console.error('Error loading recent records', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.addEventListener('medicalRecordUpdate', load);
    return () => window.removeEventListener('medicalRecordUpdate', load);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg text-gray-800 mb-4">Recent Medical Records</h3>
      <div className="space-y-4">
        {!loading && items.map((item, idx) => (
          <button key={idx} onClick={() => navigate(`/vet/patients?query=${encodeURIComponent(item.pet)}&section=records`)} className="flex items-start gap-3 w-full text-left hover:bg-gray-50 p-2 rounded-xl transition">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <img src={item.image} alt={item.pet} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center justify-between w-full">
                <h4 className="font-bold text-gray-900 text-sm">{item.pet}</h4>
                <span className="text-[10px] text-gray-400">{item.date}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
        {loading && <div className="text-center text-xs text-gray-500">Loading...</div>}
        {!loading && items.length === 0 && <div className="text-center text-xs text-gray-500">No recent records</div>}
      </div>
      <button onClick={() => navigate('/vet/patients?section=records')} className="w-full mt-4 text-center text-blue-600 text-xs font-bold hover:underline">
        View All Records
      </button>
    </div>
  )
}

// 9. Patients List (New)
export function PatientsList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      try {
        // Get all appointments for this vet to extract pet information
        const appointments = await getAppointments();
        // Get all pets to fetch additional pet information
        const pets = await getPets();
        
        // Create a map of petId to pet for quick lookup
        const petMapById = new Map();
        pets.forEach(pet => {
          const petId = pet._id || pet.id;
          if (petId) {
            petMapById.set(petId.toString(), pet);
          }
        });
        
        // Get unique pets from appointments
        const patientMap = new Map();
        appointments.forEach(appt => {
          const petId = appt.petId?._id || appt.petId;
          if (petId && !patientMap.has(petId)) {
            // Get pet from appointments first (might have populated data)
            const apptPet = appt.petId;
            // Get pet from pets list (has additional information)
            const petFromList = petMapById.get(petId.toString());
            const pet = petFromList || apptPet;
            
            const lastAppt = appointments
              .filter(a => {
                const aPetId = a.petId?._id || a.petId;
                return aPetId && aPetId.toString() === petId.toString();
              })
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
            // Find the most recent appointment for this pet (for messaging)
            const recentAppt = appointments
              .filter(a => {
                const aPetId = a.petId?._id || a.petId;
                return aPetId && aPetId.toString() === petId.toString();
              })
              .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
            
            patientMap.set(petId, {
              _id: petId,
              id: petId,
              name: pet?.name || apptPet?.name || 'Unknown Pet',
              breed: pet?.breed || apptPet?.breed || 'Unknown',
              age: pet?.age || apptPet?.age || 'Unknown',
              image: pet?.image || apptPet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pet?.name || apptPet?.name || 'Pet')}&background=random`,
              lastVisit: lastAppt ? new Date(lastAppt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never',
              appointmentId: recentAppt ? (recentAppt._id || recentAppt.id) : null
            });
          }
        });
        
        setPatients(Array.from(patientMap.values()));
      } catch (error) {
        console.error("Error loading patients", error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Ensuring navigate is used or acknowledged if strictly required by lint, 
    // but typically navigate usage in event handlers doesn't require useEffect dependency
  }, [navigate]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="font-bold text-lg text-gray-800">Patients</h3>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none w-64"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="pb-3 pl-2">Patient</th>
              <th className="pb-3">Breed</th>
              <th className="pb-3">Last Visit</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">Loading patients...</td>
              </tr>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr 
                  key={patient._id || patient.id} 
                  onClick={() => navigate(`/vet/patients?query=${encodeURIComponent(patient.name)}`)}
                  className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src={patient.image} alt={patient.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-gray-900">{patient.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{patient.breed}</td>
                  <td className="py-3 text-gray-500 font-medium">{patient.lastVisit}</td>
                  <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/vet/patients/${patient._id || patient.id}/medical-records`)}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent hover:border-blue-100 transition"
                      >
                        Records
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            // If we have an appointment ID, navigate directly to that consultation
                            if (patient.appointmentId) {
                              navigate(`/vet/consultation/${patient.appointmentId}`);
                              return;
                            }
                            
                            // Otherwise, try to find an appointment for this pet
                            const appointments = await getAppointments();
                            const petAppointment = appointments.find(a => {
                              const aPetId = a.petId?._id || a.petId;
                              const patientId = patient._id || patient.id;
                              return aPetId && aPetId.toString() === patientId.toString();
                            });
                            
                            if (petAppointment) {
                              navigate(`/vet/consultation/${petAppointment._id || petAppointment.id}`);
                            } else {
                              // If no appointment exists, navigate to general consultation
                              navigate('/vet/consultation/general', { 
                                state: { 
                                  petId: patient._id || patient.id,
                                  petName: patient.name 
                                } 
                              });
                            }
                          } catch (error) {
                            console.error("Error opening chat", error);
                            // Fallback to general consultation
                            navigate('/vet/consultation/general');
                          }
                        }}
                        className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent hover:border-green-100 transition"
                      >
                        Message
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">No patients found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 10. Stats Footer
export function StatsFooter() {
  const [slotStats, setSlotStats] = useState({ booked: 0, total: 0 });
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revenueToday, setRevenueToday] = useState(0);
  const [revenueLoading, setRevenueLoading] = useState(true);

  useEffect(() => {
    const loadSlotStats = async () => {
      try {
        // Get current vet's availability and today's appointments
        const { getCurrentUser } = await import('../../utils/userStore');
        const user = await getCurrentUser();
        const appointments = await getAppointments();
        const prescriptions = await getPrescriptions();
        setPrescriptionCount(prescriptions.length);
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Calculate total available slots based on vet's availability
        let totalSlots = 0;
        if (user && user.availability && Array.isArray(user.availability) && user.availability.length > 0) {
          // Count slots based on availability
          // Each availability entry represents a 30-minute slot in the new format
          const hasNewFormat = user.availability.some(a => typeof a === 'object' && a.start && a.end);
          
          if (hasNewFormat) {
            // New format: { start: "HH:mm", end: "HH:mm" } - each object is one slot
            totalSlots = user.availability.filter(a => typeof a === 'object' && a.start && a.end).length;
          } else {
            // Legacy format: "Morning (9 AM - 12 PM)" - estimate slots
            const slotCounts = {
              morning: 6,    // 9 AM - 12 PM = 3 hours = 6 slots (30 min intervals)
              afternoon: 10, // 12 PM - 5 PM = 5 hours = 10 slots
              evening: 6     // 5 PM - 8 PM = 3 hours = 6 slots
            };
            
            let countedSlots = 0;
            user.availability.forEach(avail => {
              if (typeof avail === 'string') {
                const lower = avail.toLowerCase();
                if (lower.includes('morning') && !countedSlots.toString().includes('morning')) {
                  countedSlots += slotCounts.morning;
                }
                if (lower.includes('afternoon') && !countedSlots.toString().includes('afternoon')) {
                  countedSlots += slotCounts.afternoon;
                }
                if (lower.includes('evening') && !countedSlots.toString().includes('evening')) {
                  countedSlots += slotCounts.evening;
                }
              }
            });
            totalSlots = countedSlots;
          }
          
          // Fallback: if still 0, use all 48 slots
          if (totalSlots === 0) {
            totalSlots = 48;
          }
        } else {
          // If no availability set, use all 48 slots (24 hours * 2 slots per hour)
          totalSlots = 48;
        }
        
        // Count booked slots for today (non-cancelled, non-completed appointments)
        const todayAppointments = appointments.filter(appt => {
          if (!appt.date) return false;
          const apptDate = appt.date.toString().split('T')[0]; // Get YYYY-MM-DD part
          return apptDate === todayStr && 
                 appt.status !== 'Cancelled' && 
                 appt.status !== 'Completed';
        });
        
        setSlotStats({
          booked: todayAppointments.length,
          total: totalSlots
        });
      } catch (error) {
        console.error('Error loading slot stats', error);
        setSlotStats({ booked: 0, total: 48 }); // Default fallback
      } finally {
        setLoading(false);
      }
    };

    loadSlotStats();
    const fetchRevenue = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const rev = await getRevenue(todayStr);
        setRevenueToday((rev?.totalRevenue || 0));
      } catch (e) {
        setRevenueToday(0);
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenue();
    
    const handleUpdate = () => { loadSlotStats(); fetchRevenue(); };
    window.addEventListener('appointmentUpdate', handleUpdate);
    window.addEventListener('userProfileUpdate', handleUpdate);
    
    return () => {
      window.removeEventListener('appointmentUpdate', handleUpdate);
      window.removeEventListener('userProfileUpdate', handleUpdate);
    };
  }, []);

  const percentage = slotStats.total > 0 ? Math.round((slotStats.booked / slotStats.total) * 100) : 0;

  return (
    <div className="bg-white border-t border-gray-100 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-between gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-xl font-bold text-gray-800">
                {loading ? '...' : `${slotStats.booked}/${slotStats.total}`}
              </h4>
              <span className="text-xs text-gray-500">Slots Booked Today</span>
            </div>
            <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaClock className="text-gray-400" />
            <div>
              <h4 className="font-bold text-gray-800">30 min</h4>
              <p className="text-xs text-gray-500">Average Consultation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaPrescriptionBottleAlt className="text-gray-400" />
            <div>
              <h4 className="font-bold text-gray-800">{loading ? '...' : prescriptionCount}</h4>
              <p className="text-xs text-gray-500">Prescriptions Issued</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-bold">$</span>
            <div>
              <h4 className="font-bold text-gray-800">${revenueLoading ? '...' : revenueToday.toLocaleString()}</h4>
              <p className="text-xs text-gray-500">Revenue Today</p>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-8 border-t border-gray-50 text-xs text-gray-400">
          <p>© 2024 PetCare Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-600">Terms</a>
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#" className="hover:text-gray-600">Support</a>
            <a href="#" className="hover:text-gray-600">Admin Panel</a>
          </div>
        </div>
      </div>
    </div>
  )
}
