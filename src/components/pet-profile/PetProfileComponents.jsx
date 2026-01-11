import { FaSearch, FaBell, FaUserCircle, FaCalendarAlt, FaEdit, FaShareAlt, FaFileMedical, FaDownload, FaSyringe, FaPhoneAlt, FaUpload, FaPills, FaHeartbeat, FaExclamationTriangle, FaChevronRight, FaTrash, FaPaw, FaWeight, FaBrain, FaSnowflake } from 'react-icons/fa'
import { getAverageHealthScore } from '../../utils/aiDiagnosisStore';
import { getAppointments } from '../../utils/appointmentStore';
import { getVaccinations } from '../../utils/vaccinationStore';
import { getMedicalRecords, MEDICAL_RECORD_TYPES } from '../../utils/medicalRecordStore';
import { getCycleData, calculateCycleStatus } from '../../utils/breedingStore';
import { getDetections, deleteDetection, getLastScanDate } from '../../utils/aiDiagnosisStore';
import { getPets } from '../../utils/petStore';
import { getVetById } from '../../utils/vetStore';
import { generateMedicalReport } from '../../utils/pdfGenerator';
import { useState, useEffect } from 'react';

export function PetProfileHeader({ onNavigate }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">PawMate</span>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-gray-600 font-medium">
            <button onClick={() => onNavigate && onNavigate('dashboard')} className="hover:text-blue-600">Overview</button>
            <button onClick={() => onNavigate && onNavigate('dashboard')} className="text-blue-600">My Pets</button>
            <button onClick={() => onNavigate && onNavigate('vetListing')} className="hover:text-blue-600">Services</button>
            <button onClick={() => onNavigate && onNavigate('records')} className="hover:text-blue-600">Health Records</button>
            <button onClick={() => onNavigate && onNavigate('marketplace')} className="hover:text-blue-600">Community</button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500 w-64"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('notifications')}
            className="relative text-gray-600 hover:text-blue-600"
          >
            <FaBell className="text-xl" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('profile')}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:opacity-80"
          >
            <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function PetProfileCard({ pet, onNavigate }) {
  const [fallbackPet, setFallbackPet] = useState({
      name: 'No Pet Selected',
      breed: 'Please add a pet',
      gender: '',
      age: '',
      weight: '',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  });
  
  const displayPet = pet || fallbackPet;
  
  useEffect(() => {
    let mounted = true;
    const fetchPet = async () => {
      if (!pet && mounted) {
        try {
            const pets = await getPets();
            if (!mounted) return;
            const selectedPetId = localStorage.getItem('pawmate_selected_pet_id');
            const selectedPet = selectedPetId ? pets.find(p => (p.id === selectedPetId || p._id === selectedPetId)) : pets[0];
            if (selectedPet && mounted) setFallbackPet(selectedPet);
        } catch (e) { console.error(e); }
      }
    };
    fetchPet();
    const handleUpdate = () => {
      if (mounted) fetchPet();
    };
    window.addEventListener('petUpdate', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('petUpdate', handleUpdate);
    };
  }, [pet]);

  // Health Score Logic
  const [score, setScore] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchScore = async () => {
      const petId = displayPet.id || displayPet._id;
      if (petId && mounted) {
          const s = await getAverageHealthScore(petId);
          if (mounted) setScore(s);
      }
    };
    fetchScore();
    const handleUpdate = () => {
      if (mounted) fetchScore();
    };
    window.addEventListener('diagnosisUpdate', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('diagnosisUpdate', handleUpdate);
    };
  }, [displayPet]);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0 bg-gray-100 flex items-center justify-center">
        {displayPet.image ? (
          <img src={displayPet.image} alt={displayPet.name} className="w-full h-full object-cover" />
        ) : (
          <FaPaw className="text-gray-400 text-4xl" />
        )}
      </div>
      
      <div className="flex-1 text-center md:text-left z-10">
        <h1 className="text-3xl font-bold text-gray-900">{displayPet.name}</h1>
        <p className="text-gray-500 mt-1">{displayPet.breed} • {displayPet.gender || 'Male'} • {displayPet.age}</p>
        
        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
            <FaWeight className="text-gray-500" />
            <span>{displayPet.weight}</span>
          </div>

        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
          <button 
            onClick={() => onNavigate && onNavigate('appointment', { pet: displayPet })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Schedule Appointment
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('editPet', displayPet)}
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Edit Profile
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Profile link copied to clipboard!");
            }}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Share Profile
          </button>
        </div>
      </div>
      
      {/* AI Health Score Circle */}
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
        <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-full p-1 shadow-lg">
           <div className="relative w-24 h-24">
             {/* Background Circle */}
             <svg className="w-full h-full transform -rotate-90">
               <circle
                 cx="48" cy="48" r={radius}
                 stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="transparent"
               />
               {/* Progress Circle */}
               <circle
                 cx="48" cy="48" r={radius}
                 stroke="white" strokeWidth="6" fill="transparent"
                 strokeDasharray={circumference}
                 strokeDashoffset={offset}
                 strokeLinecap="round"
                 className="transition-all duration-1000 ease-out"
               />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center flex-col pt-1 text-white">
               <span className="text-3xl font-bold leading-none">{score}</span>
               <span className="text-[9px] uppercase opacity-90 font-medium tracking-wide">Avg Score</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export function QuickActionsCard({ onNavigate }) {
  const actions = [
    { icon: FaCalendarAlt, label: "Schedule Checkup", color: "text-blue-600", bg: "bg-blue-50", action: 'appointment' },
    { icon: FaPills, label: "Order Medication", color: "text-green-600", bg: "bg-green-50", action: 'medicine' },
    { icon: FaUpload, label: "Upload Records", color: "text-purple-600", bg: "bg-purple-50", action: 'records' },
    { icon: FaPhoneAlt, label: "Contact Vet", color: "text-orange-600", bg: "bg-orange-50", action: 'vetListing' },
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, idx) => (
          <button 
            key={idx} 
            onClick={() => onNavigate && onNavigate(action.action)}
            className={`${action.bg} p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-opacity h-32`}
          >
            <action.icon className={`text-2xl ${action.color}`} />
            <span className={`text-sm font-medium ${action.color}`}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function MedicalRecordsCard({ onNavigate, petId = null }) {
  const [records, setRecords] = useState([]);
  const [currentPetId, setCurrentPetId] = useState(petId || null);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        // Get petId from prop, localStorage, or first pet
        let targetPetId = petId || localStorage.getItem('pawmate_selected_pet_id');
        
        // If still no petId, get first pet
        if (!targetPetId) {
          const pets = await getPets();
          if (pets.length > 0) {
            targetPetId = pets[0]._id || pets[0].id;
          }
        }
        
        if (!targetPetId || targetPetId === 'null' || targetPetId === 'undefined') {
          console.log('[MedicalRecordsCard] No valid petId, clearing records');
          setRecords([]);
          return;
        }
        
        // Normalize petId to string for comparison
        const normalizedPetId = String(targetPetId);
        setCurrentPetId(normalizedPetId);
        
        console.log(`[MedicalRecordsCard] Loading records for pet: ${normalizedPetId}`);
        const medicalRecords = await getMedicalRecords(normalizedPetId);
        
        // Ensure medicalRecords is an array
        if (!Array.isArray(medicalRecords)) {
          console.warn('[MedicalRecordsCard] getMedicalRecords returned non-array:', medicalRecords);
          setRecords([]);
          return;
        }
        
        console.log(`[MedicalRecordsCard] Loaded ${medicalRecords.length} records from API`);
        
        // Remove duplicates based on _id
        const uniqueRecords = [];
        const seenIds = new Set();
        for (const record of medicalRecords) {
          const id = record._id || record.id;
          if (id && !seenIds.has(id.toString())) {
            seenIds.add(id.toString());
            // Verify petId matches (safety check)
            const recordPetId = String(record.petId?._id || record.petId || record.petId?.id || '');
            if (recordPetId && recordPetId !== normalizedPetId) {
              console.warn(`[MedicalRecordsCard] Record ${id} has mismatched petId: ${recordPetId} vs ${normalizedPetId}`);
            }
            uniqueRecords.push(record);
          }
        }
        
        console.log(`[MedicalRecordsCard] After deduplication: ${uniqueRecords.length} unique records`);
        
        // Filter to show only standard medical record types (same as medical records screen)
        // Exclude Breeding, AI Diagnosis, and other non-standard types that appear in different sections
        const standardTypes = [
          MEDICAL_RECORD_TYPES.VACCINATION,
          MEDICAL_RECORD_TYPES.TREATMENT,
          MEDICAL_RECORD_TYPES.PRESCRIPTION,
          MEDICAL_RECORD_TYPES.LAB_RESULT,
          MEDICAL_RECORD_TYPES.VET_NOTE
        ];
        
        const filteredRecords = uniqueRecords.filter(r => {
          const recordType = r.type || '';
          const isStandardType = standardTypes.includes(recordType);
          if (!isStandardType) {
            console.log(`[MedicalRecordsCard] Filtering out non-standard record type: ${recordType} - ${r.title || 'No title'}`);
          }
          return isStandardType;
        });
        
        console.log(`[MedicalRecordsCard] After filtering standard types: ${filteredRecords.length} records`);
        
        // Backend already sorts by createdAt: -1 (newest first), but ensure frontend matches
        // Sort by createdAt (newest first) - same as medical records screen
        filteredRecords.sort((a, b) => {
          // Use createdAt if available (backend default), otherwise fallback to date or updatedAt
          const dateA = a.createdAt ? new Date(a.createdAt) : (a.updatedAt ? new Date(a.updatedAt) : (a.date ? new Date(a.date) : new Date(0)));
          const dateB = b.createdAt ? new Date(b.createdAt) : (b.updatedAt ? new Date(b.updatedAt) : (b.date ? new Date(b.date) : new Date(0)));
          return dateB.getTime() - dateA.getTime(); // Newest first (matches backend sort)
        });
        
        // Show most recent 3 records (matching medical records screen order)
        // These should be the same 3 records shown at the top of the medical records screen
        const recordsToShow = filteredRecords.slice(0, 3);
        console.log(`[MedicalRecordsCard] Showing top 3 records:`, recordsToShow.map(r => ({ id: r._id || r.id, title: r.title, type: r.type, createdAt: r.createdAt })));
        
        const formatted = await Promise.all(
          recordsToShow.map(async (r) => {
            // Use createdAt if available (matches backend), otherwise use date field
            const dateObj = r.createdAt ? new Date(r.createdAt) : (r.updatedAt ? new Date(r.updatedAt) : (r.date ? new Date(r.date) : new Date()));
            let doctorName = r.vetName || r.details?.vetName || r.vetId?.name || '';
            let clinicName = r.clinicName || r.details?.clinicName || r.vetId?.clinicName || '';
            let doctorImage = r.vetId?.image || '';
            let attachmentImage = '';
            const vetId = r.vetId?._id || r.vetId?.id || r.vetId;
            if (Array.isArray(r.attachments) && r.attachments.length > 0) {
              const img = r.attachments.find(a => typeof a === 'string' && (a.startsWith('data:image') || /\.(png|jpg|jpeg|gif|webp)$/i.test(a)));
              if (img) attachmentImage = img;
            }
            if ((!doctorName || doctorName.trim() === '') && vetId) {
              const v = await getVetById(String(vetId)).catch(() => null);
              if (v) {
                doctorName = v.name || v.fullName || v.email || doctorName || '';
                clinicName = clinicName || v.clinicName || '';
                doctorImage = doctorImage || v.image || '';
              }
            }
            const imgSrc =
              attachmentImage ||
              doctorImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent((doctorName || 'Dr').replace(' ', '+'))}&background=random`;
            return {
              id: r._id || r.id,
              title: r.title || 'Medical Record',
              doctor: doctorName || 'Dr. Unknown',
              date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: r.type === 'Prescription' ? 'In Progress' : 'Completed',
              statusColor: r.type === 'Prescription' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700',
              img: imgSrc,
              raw: { ...r, vetName: doctorName, clinicName }
            };
          })
        );
        setRecords(formatted);
      } catch (error) {
        console.error("Error loading medical records", error);
        setRecords([]);
      }
    };
    loadRecords();
    window.addEventListener('medicalRecordUpdate', loadRecords);
    return () => window.removeEventListener('medicalRecordUpdate', loadRecords);
  }, [petId]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Medical Records</h3>
        <button 
          onClick={() => onNavigate && onNavigate('records', { id: currentPetId })}
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          View All
        </button>
      </div>
      <div className="space-y-4">
        {records.length > 0 ? (
          records.map((record) => {
            const uniqueId = record.id || `record-${Date.now()}-${Math.random()}`;
            return (
              <div key={uniqueId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-50">
                <div className="flex items-center gap-4">
                  <img src={record.img} alt={record.doctor} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{record.title} - {record.doctor}</h4>
                    <p className="text-sm text-gray-500">{record.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${record.statusColor}`}>
                    {record.status}
                  </span>
                  <button 
                    onClick={() => generateMedicalReport([record.raw])}
                    className="text-gray-400 hover:text-gray-600"
                    title="Download Record"
                  >
                    <FaDownload />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 text-sm py-4">No medical records found.</p>
        )}
      </div>
    </div>
  )
}

export function VaccinationHistoryCard({ onNavigate, petId = null }) {
  const [vaccines, setVaccines] = useState([]);

  useEffect(() => {
    const fetchVaccines = async () => {
      try {
        const allVax = await getVaccinations();
        const scheduledVax = allVax.filter(v => v.status !== 'Completed');
        
        // Get completed from medicalRecordStore
        const today = new Date().toISOString().split('T')[0];
        
        // Get petId from prop, localStorage, or first pet
        let targetPetId = petId || localStorage.getItem('pawmate_selected_pet_id');
        if (!targetPetId) {
          const pets = await getPets();
          if (pets.length > 0) {
            targetPetId = pets[0]._id || pets[0].id;
          }
        }
        
        let medicalRecords = [];
        if (targetPetId && targetPetId !== '1' && targetPetId !== 'null' && targetPetId !== 'undefined') {
          medicalRecords = await getMedicalRecords(targetPetId);
          // Ensure it's an array
          if (!Array.isArray(medicalRecords)) {
            medicalRecords = [];
          }
        }

        const vaxRecords = medicalRecords
            .filter(r => r.type === MEDICAL_RECORD_TYPES.VACCINATION)
            .map(r => {
            // Use date from record, or createdAt if date is not available
            const recordDate = r.date || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : today);
            const recordDateObj = new Date(recordDate);
            const todayObj = new Date(today);
            
            // Compare dates properly (reset time components)
            recordDateObj.setHours(0, 0, 0, 0);
            todayObj.setHours(0, 0, 0, 0);
            
            const isUpcoming = recordDateObj > todayObj;
            const isPast = recordDateObj < todayObj;
            const status = isUpcoming ? 'Upcoming' : (isPast ? 'Completed' : 'Upcoming');
            
            return {
                name: r.title || 'Vaccination',
                date: recordDate,
                status: status,
                color: status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            };
            });

        // Combine and sort (Upcoming/Overdue first, then by date)
        const allVaccines = [...scheduledVax.map(v => ({
            name: v.vaccineName,
            date: v.dueDate,
            status: v.status,
            color: v.statusColor
        })), ...vaxRecords];

        // Sort: Overdue > Due Soon > Upcoming > Completed
        const statusOrder = { 'Overdue': 0, 'Due Soon': 1, 'Upcoming': 2, 'Completed': 3 };
        
        allVaccines.sort((a, b) => {
            const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
            if (statusDiff !== 0) return statusDiff;
            return new Date(a.date) - new Date(b.date);
        });

        setVaccines(allVaccines.slice(0, 4)); // Show top 4
      } catch (e) { console.error(e); }
    };

    fetchVaccines();
    window.addEventListener('vaccinationUpdate', fetchVaccines);
    window.addEventListener('medicalRecordUpdate', fetchVaccines);
    return () => {
      window.removeEventListener('vaccinationUpdate', fetchVaccines);
      window.removeEventListener('medicalRecordUpdate', fetchVaccines);
    };
  }, [petId]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Vaccination History</h3>
        <button 
            onClick={() => {
              // Get petId from prop, localStorage, or first pet
              const targetPetId = petId || localStorage.getItem('pawmate_selected_pet_id');
              if (targetPetId && onNavigate) {
                // Pass petId to navigation handler
                onNavigate('vaccination', { _id: targetPetId, id: targetPetId });
              } else if (onNavigate) {
                // Fallback: try to get first pet
                getPets().then(pets => {
                  if (pets.length > 0) {
                    const firstPetId = pets[0]._id || pets[0].id;
                    if (firstPetId) {
                      onNavigate('vaccination', { _id: firstPetId, id: firstPetId });
                    } else {
                      onNavigate('vaccination');
                    }
                  } else {
                    onNavigate('vaccination');
                  }
                });
              }
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
            View All <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-4">
        {vaccines.length > 0 ? (
            vaccines.map((vax, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100/50 group">
                <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                    vax.status === 'Overdue' ? 'bg-red-500' : 
                    vax.status === 'Due Soon' ? 'bg-orange-500' : 
                    vax.status === 'Upcoming' ? 'bg-emerald-500' : 'bg-gray-400'
                }`}></div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{vax.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(vax.date)}</p>
                </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${vax.color}`}>
                {vax.status}
                </span>
            </div>
            ))
        ) : (
            <p className="text-center text-gray-500 text-sm py-4">No vaccination records found.</p>
        )}
      </div>
      
      {vaccines.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Next due: {vaccines.find(v => v.status !== 'Completed') ? formatDate(vaccines.find(v => v.status !== 'Completed').date) : 'None'}</span>
                <span className="flex items-center gap-1 text-blue-600 cursor-pointer hover:underline" onClick={() => {
                  // Get petId from prop, localStorage, or first pet
                  const targetPetId = petId || localStorage.getItem('pawmate_selected_pet_id');
                  if (targetPetId && onNavigate) {
                    // Pass petId to navigation handler
                    onNavigate('vaccination', { _id: targetPetId, id: targetPetId });
                  } else if (onNavigate) {
                    // Fallback: try to get first pet
                    getPets().then(pets => {
                      if (pets.length > 0) {
                        const firstPetId = pets[0]._id || pets[0].id;
                        if (firstPetId) {
                          onNavigate('vaccination', { _id: firstPetId, id: firstPetId });
                        } else {
                          onNavigate('vaccination');
                        }
                      } else {
                        onNavigate('vaccination');
                      }
                    });
                  }
                }}>
                    Manage Schedule
                </span>
            </div>
          </div>
      )}
    </div>
  )
}

export function BreedingMonitorCard({ onNavigate, pet }) {
  const [cycleInfo, setCycleInfo] = useState(null);
  const [petName, setPetName] = useState('Pet');

  useEffect(() => {
    const loadData = async () => {
      const petId = pet?.id || pet?._id || localStorage.getItem('pawmate_selected_pet_id');
      if (petId) {
          try {
            const data = await getCycleData(petId);
            if (data) {
                const info = calculateCycleStatus(data.lastHeatDate, data.cycleLength);
                setCycleInfo(info);
                if (data.petName) setPetName(data.petName);
            } else {
                setCycleInfo(null);
            }
          } catch (e) { console.error(e); }
      }
      if (pet && pet.name) setPetName(pet.name);
    };
    loadData();
    window.addEventListener('breedingCycleUpdate', loadData);
    return () => window.removeEventListener('breedingCycleUpdate', loadData);
  }, [pet]);

  if (!cycleInfo) {
    return (
      <div className="bg-pink-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <FaHeartbeat className="text-xl" />
          <h3 className="font-bold text-lg">Breeding Cycle Monitor</h3>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">{petName}</span>
          <FaPaw className="text-xl" />
        </div>

        <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm text-center">
          <p className="text-sm opacity-90 mb-2">No breeding cycle data available.</p>
          <p className="text-xs opacity-80">Track your pet's reproductive health.</p>
        </div>

        <button 
          onClick={() => onNavigate && onNavigate('breeding')}
          className="w-full mt-4 border border-white/40 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Start Tracking
        </button>
      </div>
    );
  }

  return (
    <div className="bg-pink-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <FaHeartbeat className="text-xl" />
        <h3 className="font-bold text-lg">Breeding Cycle Monitor</h3>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium">{petName}</span>
        <FaPaw className="text-xl" />
      </div>

      <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex justify-between text-sm mb-2 opacity-90">
          <span>Current Phase: {cycleInfo.phase || 'N/A'}</span>
          <span className="text-green-300 font-bold text-xs">Day {cycleInfo.dayOfCycle || 0}</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2 mb-2">
          <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${Math.min(Math.max(cycleInfo.progress || 0, 0), 100)}%` }}></div>
        </div>
        <p className="text-xs opacity-80">Day {cycleInfo.dayOfCycle || 0} of cycle</p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
        <FaCalendarAlt />
        <span>Next cycle: {cycleInfo.nextHeatDate || 'N/A'}</span>
      </div>

      <button 
        onClick={() => onNavigate && onNavigate('breeding')}
        className="w-full mt-4 border border-white/40 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors"
      >
        View Details
      </button>
    </div>
  )
}

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

export function UpcomingAppointmentsCard({ onNavigate, pet }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const all = await getAppointments();
        
        // Ensure all is an array
        if (!Array.isArray(all)) {
          setAppointments([]);
          return;
        }
        
        // Remove duplicates based on _id
        const uniqueAppointments = [];
        const seenIds = new Set();
        for (const appt of all) {
          const id = appt._id || appt.id;
          if (id && !seenIds.has(id.toString())) {
            seenIds.add(id.toString());
            uniqueAppointments.push(appt);
          }
        }
        
        // Filter for this pet if pet prop is provided
        let filtered = uniqueAppointments;
        if (pet) {
          const petId = pet._id || pet.id;
          filtered = uniqueAppointments.filter(appt => {
            const apptPetId = appt.petId?._id || appt.petId || appt.petId?.id;
            return apptPetId?.toString() === petId?.toString();
          });
        }
        
        // Filter for upcoming appointments (not completed or cancelled)
        filtered = filtered.filter(appt => 
          appt.status !== 'Completed' && 
          appt.status !== 'Cancelled' && 
          appt.status !== 'completed' && 
          appt.status !== 'cancelled'
        );
        
        // Filter out past appointments - only show future appointments
        const now = new Date();
        filtered = filtered.filter(appt => {
          if (!appt.date || !appt.time) return false;
          
          const apptDate = parseDateTime(appt.date, appt.time);
          
          // Skip if date parsing failed
          if (apptDate.getTime() === 0) {
            console.warn('[UpcomingAppointmentsCard] Failed to parse date/time:', appt.date, appt.time);
            return false;
          }
          
          // Calculate time difference
          const timeDiff = apptDate.getTime() - now.getTime();
          const minutesUntilAppt = timeDiff / (1000 * 60);
          
          // Only show appointments that are in the future
          // Past appointments should appear in Consultation History
          if (minutesUntilAppt <= 0) {
            console.log(`[UpcomingAppointmentsCard] Appointment ${appt._id || appt.id} is in the past (${apptDate.toLocaleString()}), will show in Consultation History`);
            return false;
          }
          
          return true;
        });
        
        // Sort by date/time (upcoming first)
        filtered.sort((a, b) => {
          const dateA = parseDateTime(a.date, a.time);
          const dateB = parseDateTime(b.date, b.time);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Limit to 3 most upcoming
        setAppointments(filtered.slice(0, 3));
      } catch (e) { 
        console.error("Error fetching appointments", e);
        setAppointments([]);
      }
    };

    fetchAppointments();
    
    // Refresh every 60 seconds to remove past appointments
    const interval = setInterval(fetchAppointments, 60000);
    
    window.addEventListener('appointmentUpdate', fetchAppointments);
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointmentUpdate', fetchAppointments);
    };
  }, [pet]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Appointments</h3>
      <div className="space-y-4">
        {appointments.length > 0 ? (
          appointments.map((appt) => {
            // Get vet name from populated object or direct field
            const vetName = appt.vetId?.name || appt.vetName || 'Veterinarian';
            const vetImage = appt.vetId?.image || null;
            const uniqueId = appt._id || appt.id || `appt-${Date.now()}-${Math.random()}`;
            
            // Format date
            let formattedDate = appt.date;
            if (appt.date) {
              try {
                const dateObj = new Date(appt.date);
                if (!isNaN(dateObj.getTime())) {
                  formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
              } catch {
                // Use original if conversion fails
              }
            }
            
            // Format time
            const formattedTime = appt.time || 'N/A';
            
            return (
              <div key={uniqueId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {vetImage ? (
                    <img 
                      src={vetImage} 
                      alt={vetName} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                  ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(vetName)}&background=random`} 
                      alt={vetName} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">{vetName}</p>
                    <p className="text-xs text-gray-500">{formattedDate} at {formattedTime}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  appt.status === 'Scheduled' || appt.status === 'scheduled' 
                    ? 'bg-green-100 text-green-700' 
                    : appt.status === 'In Progress' || appt.status === 'in progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {appt.status || 'Scheduled'}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
        )}
      </div>
      <button 
        onClick={() => onNavigate && onNavigate('appointment', { pet })}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        Book New Appointment
      </button>
    </div>
  )
}

export function HealthReportCard({ onNavigate, petId = null }) {
  const [detections, setDetections] = useState([]);
  const [lastScanDate, setLastScanDate] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Get petId from prop, localStorage, or first pet
        let targetPetId = petId || localStorage.getItem('pawmate_selected_pet_id');
        if (!targetPetId) {
          const pets = await getPets();
          if (pets.length > 0) {
            targetPetId = pets[0]._id || pets[0].id;
          }
        }
        
        if (!targetPetId || targetPetId === '1' || targetPetId === 'null' || targetPetId === 'undefined') {
          setDetections([]);
          setLastScanDate(null);
          return;
        }
        
        const list = await getDetections(targetPetId);
        setDetections(Array.isArray(list) ? list : []);
        const date = await getLastScanDate(targetPetId);
        setLastScanDate(date);
      } catch (e) { 
        console.error("Error loading health reports", e);
        setDetections([]);
        setLastScanDate(null);
      }
    };
    load();
    window.addEventListener('diagnosisUpdate', load);
    return () => window.removeEventListener('diagnosisUpdate', load);
  }, [petId]);

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this report?")) {
        try {
            await deleteDetection(id);
            // Reload
            const targetPetId = petId || localStorage.getItem('pawmate_selected_pet_id');
            if (targetPetId && targetPetId !== '1' && targetPetId !== 'null' && targetPetId !== 'undefined') {
              const list = await getDetections(targetPetId);
              setDetections(Array.isArray(list) ? list : []);
              const date = await getLastScanDate(targetPetId);
              setLastScanDate(date);
            }
        } catch (e) {
            console.error("Failed to delete", e);
        }
    }
  };

  return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <FaBrain className="text-purple-600 text-xl" />
        <h3 className="text-lg font-bold text-gray-900">AI Disease Reports</h3>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
        <p className="text-xs opacity-80 mb-4">
          Last Health Scan: {lastScanDate ? new Date(lastScanDate).toLocaleDateString() : 'No recent scan'}
        </p>
        
        {detections.length > 0 ? (
          <div className="space-y-4">
            {detections.slice(0, 3).map((d) => (
              <div key={d.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{d.condition}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${d.risk === 'High' ? 'text-red-300' : d.risk === 'Moderate' ? 'text-yellow-200' : 'text-green-200'}`}>
                      {d.risk}
                    </span>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
                      title="Delete detection"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className={`${d.risk === 'High' ? 'bg-red-400' : d.risk === 'Moderate' ? 'bg-yellow-400' : 'bg-green-400'} h-2 rounded-full`}
                    style={{ width: `${Math.min(Math.max(d.severityScore, 0), 100)}%` }}
                  ></div>
                </div>
                {d.symptoms && d.symptoms.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {d.symptoms.map((s, idx) => (
                      <span key={idx} className="text-xs bg-white/15 text-white px-2 py-1 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-80">No detected conditions for the selected pet.</p>
        )}
      </div>
      
      <button 
        onClick={() => onNavigate && onNavigate('detection')}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <FaSnowflake /> Generate New Report
      </button>
      {detections.length > 0 ? (
        <button 
          onClick={() => {
            // Navigate to latest diagnosis
            const latestDetection = detections[0];
            onNavigate && onNavigate('diagnosis', { scanId: latestDetection.id });
          }}
          className="w-full mt-2 text-blue-600 text-sm font-medium hover:underline"
        >
          View Detailed Analysis
        </button>
      ) : (
        <button 
          onClick={() => onNavigate && onNavigate('detection')}
          className="w-full mt-2 text-blue-600 text-sm font-medium hover:underline"
        >
          Start First Health Scan
        </button>
      )}
    </div>
  )
}
