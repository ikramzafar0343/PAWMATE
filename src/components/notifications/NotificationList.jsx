import React, { useEffect, useState } from 'react';
import { FiBell, FiCalendar, FiActivity, FiInfo, FiX } from 'react-icons/fi';
import { getAppointments } from '../../utils/appointmentStore';
import { getMedicalRecords } from '../../utils/medicalRecordStore';
import { getPets } from '../../utils/petStore';

const NotificationList = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    // Load dismissed notification IDs from localStorage
    try {
      const stored = localStorage.getItem('dismissedNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const role = localStorage.getItem('role') || 'pet-owner';
        const isVet = role === 'vet';
        
        if (isVet) {
          // Load vet-specific notifications from localStorage
          const vetNotifications = JSON.parse(localStorage.getItem('vet_notifications') || '[]');
          const readNotifications = new Set(JSON.parse(localStorage.getItem('vet_read_notifications') || '[]'));
          
          const formattedNotifications = vetNotifications
            .filter(n => !dismissedIds.includes(n.id))
            .map(n => ({
              id: n.id,
              type: n.type,
              title: n.type === 'new_appointment' ? 'New Appointment Scheduled' : 'Active Consultation Started',
              message: n.message,
              time: n.date ? new Date(n.date).toLocaleDateString() : new Date(n.timestamp).toLocaleString(),
              read: readNotifications.has(n.id),
              iconType: n.type === 'new_appointment' ? 'calendar' : 'activity',
              action: 'appointment',
              appointmentId: n.appointmentId,
              timestamp: n.timestamp
            }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          
          setNotifications(formattedNotifications);
        } else {
          // Pet owner notifications (existing logic)
          const pets = await getPets().catch(() => []);
          
          const [appointments, ...recordsArrays] = await Promise.all([
            getAppointments().catch(err => {
              console.error('Error fetching appointments', err);
              return [];
            }),
            ...(pets.map(pet => {
              const petId = pet._id || pet.id;
              return getMedicalRecords(petId).catch(() => []);
            }))
          ]);
          
          const records = recordsArrays.flat();
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];

          const apptNotices = (appointments || [])
            .filter(a => a.status === 'Confirmed' || a.status === 'Scheduled')
            .map(a => ({
              id: `appt-${a._id || a.id}`,
              type: 'appointment',
              title: a.status === 'Confirmed' ? 'Appointment Confirmed' : 'Upcoming Appointment',
              message: `${a.petId?.name || a.petName || 'Pet'} • ${a.date || ''} ${a.time || ''}`,
              time: a.date || '',
              read: true,
              iconType: 'calendar',
              action: 'appointment'
            }));

          const vaxNotices = (records || [])
            .filter(r => r.type === 'Vaccination')
            .map(r => ({
              id: `vax-${r._id || r.id}`,
              type: 'vaccine',
              title: 'Vaccination Reminder',
              message: `${r.title} for ${r.petId?.name || 'Pet'} ${r.date >= todayStr ? 'is upcoming' : 'was due'}`,
              time: r.date,
              read: false,
              iconType: 'activity',
              action: 'vaccination'
            }));

          const aiNotices = (records || [])
            .filter(r => r.type === 'AI Diagnosis')
            .map(r => ({
              id: `ai-${r._id || r.id}`,
              type: 'system',
              title: 'AI Analysis Complete',
              message: `Analysis for ${r.petId?.name || 'Pet'} is ready`,
              time: r.date,
              read: true,
              iconType: 'info',
              action: 'detection'
            }));

          const merged = [...apptNotices, ...vaxNotices, ...aiNotices]
            .filter(n => !dismissedIds.includes(n.id))
            .sort((a, b) => {
              const ad = new Date(a.time || 0);
              const bd = new Date(b.time || 0);
              return bd - ad;
            });

          setNotifications(merged);
        }
      } catch (e) {
        console.error('Error loading notifications', e);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    
    // Refresh notifications when data updates
    const handleAppointmentUpdate = () => loadNotifications();
    const handleMedicalRecordUpdate = () => loadNotifications();
    
    window.addEventListener('appointmentUpdate', handleAppointmentUpdate);
    window.addEventListener('medicalRecordUpdate', handleMedicalRecordUpdate);
    
    // Refresh every 30 seconds to get latest notifications
    const interval = setInterval(loadNotifications, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointmentUpdate', handleAppointmentUpdate);
      window.removeEventListener('medicalRecordUpdate', handleMedicalRecordUpdate);
    };
  }, [dismissedIds]);

  const handleNotificationClick = (action, notification, e) => {
    // Don't navigate if clicking the dismiss button
    if (e && e.target.closest('.dismiss-btn')) {
      return;
    }
    
    if (!action) return;
    
    const role = localStorage.getItem('role') || 'pet-owner';
    const isVet = role === 'vet';
    
    // Mark notification as read for vets
    if (isVet && notification.id) {
      const readNotifications = new Set(JSON.parse(localStorage.getItem('vet_read_notifications') || '[]'));
      readNotifications.add(notification.id);
      localStorage.setItem('vet_read_notifications', JSON.stringify(Array.from(readNotifications)));
      
      // Update bell count
      const allNotifications = JSON.parse(localStorage.getItem('vet_notifications') || '[]');
      const unreadCount = allNotifications.filter(n => !readNotifications.has(n.id)).length;
      window.dispatchEvent(new CustomEvent('notificationRead', { detail: { count: unreadCount } }));
    }
    
    // Navigate based on action type
    if (onNavigate) {
      if (action === 'appointment') {
        if (isVet && notification.appointmentId) {
          // Navigate to specific consultation for vets
          window.location.href = `/vet/consultation/${notification.appointmentId}`;
        } else {
          // Navigate to consultation history for pet owners
          onNavigate('consultationHistory');
        }
      } else if (action === 'vaccination') {
        onNavigate('vaccination');
      } else if (action === 'detection') {
        onNavigate('detection');
      } else {
        onNavigate(action);
      }
    } else {
      // Fallback navigation
      if (isVet && notification.appointmentId) {
        window.location.href = `/vet/consultation/${notification.appointmentId}`;
      } else {
        const routes = {
          'appointment': '/pet-owner/appointments/history',
          'vaccination': '/pet-owner/vaccination',
          'detection': '/pet-owner/ai/history'
        };
        const route = routes[action];
        if (route) {
          window.location.href = route;
        }
      }
    }
  };

  const handleDismiss = (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    const newDismissedIds = [...dismissedIds, notificationId];
    setDismissedIds(newDismissedIds);
    
    // Save to localStorage
    try {
      localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissedIds));
    } catch (err) {
      console.error('Error saving dismissed notifications', err);
    }
    
    // Remove from current notifications immediately
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Dispatch event to update badge count in Navbar
    window.dispatchEvent(new CustomEvent('notificationDismissed', { detail: { notificationId } }));
  };

  return (
    <div className="space-y-4">
      {!loading && notifications.map((notification) => (
        <div 
          key={notification.id} 
          onClick={(e) => handleNotificationClick(notification.action, notification, e)}
          className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors relative pr-10 ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
        >
          <div className="p-3 bg-gray-50 rounded-full h-fit flex-shrink-0">
            {notification.iconType === 'calendar' && <FiCalendar className="text-blue-500" />}
            {notification.iconType === 'activity' && <FiActivity className="text-red-500" />}
            {notification.iconType === 'info' && <FiInfo className="text-purple-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-bold text-gray-900 flex-1">{notification.title}</h4>
              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{notification.time}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          </div>
          {/* Dismiss button in top right corner */}
          <button
            onClick={(e) => handleDismiss(notification.id, e)}
            className="dismiss-btn absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 z-10 flex-shrink-0"
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      {!loading && notifications.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FiBell className="mx-auto text-4xl mb-4 text-gray-300" />
          <p>No notifications yet</p>
        </div>
      )}
      {loading && (
        <div className="text-center py-6 text-gray-500 text-sm">
          Loading notifications...
        </div>
      )}
    </div>
  );
};

export default NotificationList;
