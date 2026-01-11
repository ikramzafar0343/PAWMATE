import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { getAppointments, updateAppointmentStatus, deleteAppointment } from '../utils/appointmentStore';

export default function VetAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getAppointments();
        setAppointments(Array.isArray(all) ? all : []);
      } catch (error) {
        console.error("Error loading appointments", error);
        setAppointments([]);
      }
    };
    load();
    
    // Auto-refresh every 60 seconds to update time-based statuses
    const interval = setInterval(load, 60000);
    
    window.addEventListener('appointmentUpdate', load);
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointmentUpdate', load);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(appointments)) {
      return [];
    }
    return appointments.filter(a => {
      // Handle both API format (populated objects) and old format (strings)
      const petName = a.petId?.name || a.petName || '';
      const vetName = a.vetId?.name || a.vetName || '';
      const type = a.type || '';
      const text = [petName, vetName, type].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesTab =
        activeTab === 'All'
          ? true
          : activeTab === 'Pending'
          ? (a.status === 'Pending' || a.status === 'Scheduled')
          : activeTab === 'In Progress'
          ? a.status === 'In Progress'
          : activeTab === 'Completed'
          ? a.status === 'Completed'
          : true;
      return matchesQuery && matchesTab;
    });
  }, [appointments, activeTab, query]);

  const start = async (id) => {
    try {
      await updateAppointmentStatus(id, 'In Progress');
      navigate(`/vet/consultation/${id}`);
    } catch (error) {
      console.error("Error starting appointment", error);
      alert('Failed to start appointment. Please try again.');
    }
  };

  const continueConsultation = (id) => {
    navigate(`/vet/consultation/${id}`);
  };

  const complete = async (id) => {
    try {
      await updateAppointmentStatus(id, 'Completed');
      window.dispatchEvent(new Event('appointmentUpdate'));
    } catch (error) {
      console.error("Error completing appointment", error);
      alert('Failed to complete appointment. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(id);
      } catch (error) {
        console.error("Error deleting appointment", error);
        alert('Failed to delete appointment. Please try again.');
      }
    }
  };

  const tabs = ['All', 'Pending', 'In Progress', 'Completed'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track ongoing consultations</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 w-full md:w-96">
            <FiSearch className="text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by pet, vet, or type"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex gap-2">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-bold ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-500">
            No appointments found.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered
              .slice()
              .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
              .map(appt => {
                // Handle both API format (populated objects) and old format (strings)
                const apptId = appt._id || appt.id;
                const petName = appt.petId?.name || appt.petName || 'Unknown Pet';
                const petImage = appt.petId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(petName)}&background=random`;
                const vetName = appt.vetId?.name || appt.vetName || 'Unknown Vet';
                const type = appt.type || 'General Consultation';
                
                return (
                  <div
                    key={apptId}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={petImage}
                        alt={petName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{petName}</h4>
                          <span className="text-xs text-gray-400">{appt.time}</span>
                        </div>
                        <p className="text-xs text-gray-500">{vetName}</p>
                        <p className="text-xs text-gray-400">{type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          appt.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : appt.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {appt.status}
                      </span>
                      {appt.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(apptId, 'Confirmed').then(() => window.dispatchEvent(new Event('appointmentUpdate')))}
                            className="text-green-600 border border-green-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to reject this appointment?')) {
                                updateAppointmentStatus(apptId, 'Cancelled').then(() => window.dispatchEvent(new Event('appointmentUpdate')));
                              }
                            }}
                            className="text-red-600 border border-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => start(apptId)}
                            className="text-blue-600 border border-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-50"
                          >
                            Start
                          </button>
                        </>
                      )}
                      {appt.status === 'Confirmed' && (
                        <button
                          onClick={() => start(apptId)}
                          className="text-blue-600 border border-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-50"
                        >
                          Start
                        </button>
                      )}
                      {appt.status === 'In Progress' && (
                        <>
                          <button
                            onClick={() => complete(apptId)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => continueConsultation(apptId)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600"
                          >
                            Continue
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(apptId)}
                        className="text-red-400 hover:text-red-600 p-2"
                        aria-label="Delete"
                      >
                        <FiTrash2 />
                      </button>
                      <button
                        onClick={() => navigate(`/vet/consultation/${apptId}`)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Open"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}
