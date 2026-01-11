import React, { useState, useEffect } from 'react';
import { FaStethoscope } from 'react-icons/fa';
import { FiSearch, FiBell, FiUser, FiLogOut, FiHome, FiCalendar, FiUsers, FiFileText, FiMessageCircle } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAppointments } from '../utils/appointmentStore';
import MessagesModal from './messages/MessagesModal';

export default function VetNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCategory, setOpenCategory] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bellCount, setBellCount] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [profileImage, setProfileImage] = useState(localStorage.getItem('userProfileImage') || null);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('userName');
    localStorage.removeItem('userImage');
    localStorage.removeItem('userProfileImage');
    navigate('/login', { replace: true });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/vet/patients?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const updateNotifications = async () => {
      try {
        const appts = await getAppointments();
        const now = new Date();
        
        // Get stored notification state
        const storageKey = 'vet_notifications_state';
        const readNotificationsKey = 'vet_read_notifications';
        const lastState = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const readNotifications = new Set(JSON.parse(localStorage.getItem(readNotificationsKey) || '[]'));
        
        // Store current state for next comparison
        const currentState = {};
        appts.forEach(appt => {
          const id = appt._id || appt.id;
          if (id) {
            currentState[id] = {
              status: appt.status,
              date: appt.date,
              time: appt.time,
              petName: appt.petId?.name || appt.petName || 'Pet'
            };
          }
        });
        
        const newNotifications = [];
        
        // Detect new appointments and active consultations
        appts.forEach(appt => {
          const id = appt._id || appt.id;
          if (!id) return;
          
          const prevAppt = lastState[id];
          const isNewAppointment = !prevAppt && (appt.status === 'Scheduled' || appt.status === 'Confirmed');
          
          // Check if appointment became active (time-based, not status-based)
          let becameActive = false;
          if (prevAppt && appt.status !== 'Cancelled' && appt.status !== 'Completed') {
            try {
              // Parse appointment date and time
              const dateStr = appt.date;
              const [year, month, day] = dateStr ? dateStr.split('-').map(Number) : [0, 0, 0];
              let hours = 0, minutes = 0;
              
              if (appt.time && appt.time.includes(' ')) {
                const [timePart, period] = appt.time.split(' ');
                const [h, m] = timePart.split(':').map(Number);
                hours = h;
                minutes = m;
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
              } else if (appt.time) {
                const [h, m] = appt.time.split(':').map(Number);
                hours = h;
                minutes = m;
              }
              
              const start = new Date(year, month - 1, day, hours, minutes);
              const end = new Date(start.getTime() + 30 * 60000); // 30 min duration
              
              // Check if appointment is currently active (wasn't active before)
              const wasActiveBefore = prevAppt.wasActive || false;
              const isActiveNow = start <= now && now < end;
              becameActive = !wasActiveBefore && isActiveNow;
              
              // Update current state with active status
              currentState[id].wasActive = isActiveNow;
            } catch (e) {
              // If date/time parsing fails, skip active check
            }
          }
          
          if (isNewAppointment || becameActive) {
            const notificationId = `notif-${id}-${isNewAppointment ? 'new' : 'active'}`;
            if (!readNotifications.has(notificationId)) {
              newNotifications.push({
                id: notificationId,
                type: isNewAppointment ? 'new_appointment' : 'active_consultation',
                appointmentId: id,
                petName: appt.petId?.name || appt.petName || 'Pet',
                date: appt.date,
                time: appt.time,
                message: isNewAppointment 
                  ? `New appointment scheduled for ${appt.petId?.name || appt.petName || 'Pet'}`
                  : `Consultation started for ${appt.petId?.name || appt.petName || 'Pet'}`,
                timestamp: Date.now()
              });
              
              // Show browser alert
              if (isNewAppointment) {
                alert(`🔔 New Appointment!\n\n${appt.petId?.name || appt.petName || 'Pet'} has scheduled an appointment for ${appt.date} at ${appt.time}`);
              } else if (becameActive) {
                alert(`🔔 Active Consultation!\n\nConsultation has started for ${appt.petId?.name || appt.petName || 'Pet'}`);
              }
            }
          }
        });
        
        // Save new notifications to localStorage
        if (newNotifications.length > 0) {
          const existingNotifications = JSON.parse(localStorage.getItem('vet_notifications') || '[]');
          const updatedNotifications = [...newNotifications, ...existingNotifications]
            .filter((n, idx, arr) => arr.findIndex(x => x.id === n.id) === idx) // Remove duplicates
            .slice(0, 50); // Keep last 50 notifications
          localStorage.setItem('vet_notifications', JSON.stringify(updatedNotifications));
        }
        
        // Update bell count with unread notifications excluding dismissed
        const allNotifications = JSON.parse(localStorage.getItem('vet_notifications') || '[]');
        let dismissedIds = [];
        try {
          dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
        } catch {}
        const unreadCount = allNotifications
          .filter(n => !readNotifications.has(n.id))
          .filter(n => !dismissedIds.includes(n.id))
          .length;
        setBellCount(unreadCount);
        
        // Save current state for next comparison
        localStorage.setItem(storageKey, JSON.stringify(currentState));
        
      } catch (e) {
        console.error('Error updating notifications:', e);
        setBellCount(0);
      }
    };
    
    updateNotifications();
    const interval = setInterval(updateNotifications, 30000); // Check every 30 seconds
    window.addEventListener('appointmentUpdate', updateNotifications);
    
    // Listen for notification read/dismiss events to update bell count
    const handleNotificationRead = (e) => {
      setBellCount(e.detail.count || 0);
    };
    window.addEventListener('notificationRead', handleNotificationRead);
    const handleNotificationDismissed = () => {
      // Recompute from storage to ensure consistency
      const allNotifications = JSON.parse(localStorage.getItem('vet_notifications') || '[]');
      const readNotifications = new Set(JSON.parse(localStorage.getItem('vet_read_notifications') || '[]'));
      let dismissedIds = [];
      try {
        dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      } catch {}
      const unreadCount = allNotifications
        .filter(n => !readNotifications.has(n.id))
        .filter(n => !dismissedIds.includes(n.id))
        .length;
      setBellCount(unreadCount);
    };
    window.addEventListener('notificationDismissed', handleNotificationDismissed);
    
    const updateProfileImage = () => {
      setProfileImage(localStorage.getItem('userProfileImage') || null);
    };
    window.addEventListener('userProfileUpdate', updateProfileImage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointmentUpdate', updateNotifications);
      window.removeEventListener('notificationRead', handleNotificationRead);
      window.removeEventListener('notificationDismissed', handleNotificationDismissed);
      window.removeEventListener('userProfileUpdate', updateProfileImage);
    };
  }, []);

  // Track unread messages for vets
  useEffect(() => {
    const updateMessageCount = async () => {
      try {
        const appointments = await getAppointments();
        const readMessagesRaw = localStorage.getItem('read_messages') || '[]';
        const readMessages = JSON.parse(readMessagesRaw);
        // Convert to Set of strings for faster lookup and consistent comparison
        const readMessagesSet = new Set(readMessages.map(id => id?.toString()));
        
        const currentUserId = localStorage.getItem('userId') || localStorage.getItem('_id');
        
        if (!currentUserId) {
          setMessageCount(0);
          return;
        }
        
        // Get unique pet owners from appointments
        const ownerIds = [...new Set(
          appointments
            .map(a => a.ownerId?._id || a.ownerId)
            .filter(Boolean)
            .map(id => id.toString())
        )];
        
        if (ownerIds.length === 0) {
          setMessageCount(0);
          return;
        }
        
        let totalUnread = 0;
        for (const ownerId of ownerIds) {
          try {
            const { getMessages } = await import('../utils/messageStore');
            const msgs = await getMessages(ownerId, null, true); // Bypass cache for accurate count
            const unread = msgs.filter(m => {
              const msgId = (m._id || m.id)?.toString();
              if (!msgId) return false;
              
              // Get sender ID properly
              let senderId = null;
              if (m.sender) {
                senderId = (m.sender._id || m.sender.id || m.sender)?.toString();
              } else if (m.senderId) {
                senderId = (m.senderId._id || m.senderId.id || m.senderId)?.toString();
              }
              
              if (!senderId) return false;
              
              const isMe = senderId === currentUserId.toString();
              const isRead = readMessagesSet.has(msgId);
              
              // Count only unread messages from others
              return !isMe && !isRead;
            });
            totalUnread += unread.length;
          } catch (e) {
            console.error(`Error loading messages for owner ${ownerId}:`, e);
            // Skip if error loading messages for this owner
          }
        }
        
        console.log(`[VetNavbar] Message count updated: ${totalUnread} unread messages`);
        setMessageCount(totalUnread);
      } catch (e) {
        console.error('Error updating message count', e);
        setMessageCount(0);
      }
    };
    
    updateMessageCount();
    const interval = setInterval(updateMessageCount, 30000); // Check every 30 seconds
    
    const handleMessageRead = () => {
      updateMessageCount();
    };
    window.addEventListener('messageRead', handleMessageRead);
    window.addEventListener('appointmentUpdate', updateMessageCount);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('messageRead', handleMessageRead);
      window.removeEventListener('appointmentUpdate', updateMessageCount);
    };
  }, []);

  const navCategories = [
    { name: 'Dashboard', path: '/vet/dashboard', icon: <FiHome />, subnav: [] },
    {
      name: 'Patient Care',
      path: '/vet/appointments',
      icon: <FaStethoscope />,
      subnav: [
        { name: 'Appointments', path: '/vet/appointments', icon: <FiCalendar /> },
        { name: 'Patients', path: '/vet/patients', icon: <FiUsers /> },
        { name: 'Prescriptions', path: '/vet/prescriptions', icon: <FiFileText /> },
      ],
    },
  ];

  // Helper to determine active state
  const isActive = (path, subnav = []) => {
    if (path === '/vet/dashboard' && location.pathname === '/vet/dashboard') return true;
    if (location.pathname.startsWith(path) && path !== '/vet/dashboard') return true;
    return subnav.some((s) => s.path && location.pathname.startsWith(s.path));
  };

  return (
    <header className="sticky top-0 bg-white z-50">
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
            <div
              className="flex-shrink-0 flex items-center gap-2 text-gray-900 font-bold text-xl cursor-pointer"
              onClick={() => navigate('/vet/dashboard')}
            >
              <FaStethoscope className="text-blue-500 text-2xl" />
              <span className="text-gray-800 hidden sm:inline">PAWMATE</span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
            <div className="relative hidden sm:block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-1.5 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button 
              onClick={() => setShowMessages(true)}
              className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <FiMessageCircle size={20} />
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white">
                  {messageCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/vet/notifications')}
              className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <FiBell size={20} />
              {bellCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white">
                  {bellCount}
                </span>
              )}
            </button>
            
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer bg-blue-100 flex items-center justify-center text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiUser />
                )}
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/vet/profile');
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiUser className="mr-3" /> Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-3" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* NAVIGATION BAR */}
      <div className="bg-white border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-center">
          <nav className="flex gap-8 text-sm font-medium text-gray-700">

            {navCategories.map((item, idx) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.subnav?.length && setOpenCategory(idx)}
                onMouseLeave={() => setOpenCategory(null)}
              >
                {/* MAIN NAV BUTTON */}
                <button
                  onClick={() => !item.subnav?.length && navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 ${
                    isActive(item.path, item.subnav)
                      ? 'text-blue-600 font-semibold'
                      : 'hover:text-blue-600'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </button>

                {/* DROPDOWN MENU */}
                {item.subnav?.length > 0 && openCategory === idx && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-lg rounded-md z-50"
                    onMouseEnter={() => setOpenCategory(idx)}
                    onMouseLeave={() => setOpenCategory(null)}
                  >
                    <ul className="py-2">
                      {item.subnav.map((sub) => {
                        const isActive = sub.path && location.pathname.startsWith(sub.path);
                        return (
                          <li key={sub.name}>
                            <button
                              onClick={() => {
                                if (sub.path) {
                                  navigate(sub.path);
                                }
                                setOpenCategory(null);
                              }}
                              className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${
                                isActive
                                  ? 'text-blue-600 font-semibold bg-blue-50 border-l-4 border-blue-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {sub.icon ? (
                                <span 
                                  className="mr-3 text-base flex-shrink-0"
                                  style={{ 
                                    color: isActive ? '#2563eb' : '#6b7280' 
                                  }}
                                >
                                  {sub.icon}
                                </span>
                              ) : (
                                <span className="mr-3 w-5 flex-shrink-0"></span>
                              )}
                              <span>{sub.name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}

          </nav>
        </div>
      </div>
      {showMessages && (
        <MessagesModal
          isOpen={showMessages}
          onClose={() => setShowMessages(false)}
        />
      )}
    </header>
  );
}
