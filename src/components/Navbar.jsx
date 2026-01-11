import React, { useState, useEffect } from 'react';
import { FaPaw, FaPills } from 'react-icons/fa';
import { FiSearch, FiBell, FiUser, FiLogOut, FiHome, FiActivity, FiBriefcase, FiShoppingCart, FiShoppingBag, FiCalendar, FiUserCheck, FiPlus, FiList, FiDroplet, FiShield, FiCpu, FiClock, FiPackage, FiMessageCircle } from 'react-icons/fi';
import { getCartCount } from '../utils/cartStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPets } from '../utils/petStore';
import { getAppointments } from '../utils/appointmentStore';
import { getMedicalRecords } from '../utils/medicalRecordStore';
import CartModal from './cart/CartModal';
import CheckoutModal from './cart/CheckoutModal';
import MessagesModal from './messages/MessagesModal';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCategory, setOpenCategory] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [_pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(localStorage.getItem('pawmate_selected_pet_id') || '');
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [bellCount, setBellCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const [profileImage, setProfileImage] = useState(localStorage.getItem('userProfileImage') || null);

  const logout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/login', { replace: true });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      alert(`Searching for: ${searchQuery}`);
      // In a real app, you would navigate to search results:
      // navigate(`/pet-owner/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // Load pets only once on mount, not on selectedPetId change
  useEffect(() => {
    let mounted = true;
    const loadPets = async () => {
      try {
        const list = await getPets();
        if (!mounted) return;
        setPets(list);
        if (!selectedPetId && list.length > 0) {
          const firstPetId = list[0]._id || list[0].id;
          setSelectedPetId(firstPetId);
          localStorage.setItem('pawmate_selected_pet_id', firstPetId);
          window.dispatchEvent(new Event('selectedPetUpdate'));
        }
      } catch (error) {
        console.error("Error loading pets in Navbar", error);
      }
    };
    loadPets();
    
    const onUpdate = () => {
      if (mounted) loadPets();
    };
    window.addEventListener('petUpdate', onUpdate);
    
    const updateCart = () => setCartCount(getCartCount());
    updateCart();
    window.addEventListener('cartUpdate', updateCart);
    
    const updateProfileImage = () => {
      if (mounted) setProfileImage(localStorage.getItem('userProfileImage') || null);
    };
    window.addEventListener('userProfileUpdate', updateProfileImage);
    
    return () => {
      mounted = false;
      window.removeEventListener('petUpdate', onUpdate);
      window.removeEventListener('cartUpdate', updateCart);
      window.removeEventListener('userProfileUpdate', updateProfileImage);
    };
  }, []); // Empty deps - only run once on mount

  // Separate effect for bell count - match exactly what NotificationList shows
  useEffect(() => {
    let mounted = true;
    const updateBell = async () => {
      try {
        // Get all pets first to fetch records for all of them
        const pets = _pets && _pets.length > 0 ? _pets : await getPets().catch(() => []);
        if (!mounted) return;
        
        // Fetch appointments and medical records for all pets in parallel
        const [appts, ...recordsArrays] = await Promise.all([
          getAppointments().catch(err => {
            console.error('Error fetching appointments for badge', err);
            return [];
          }),
          // Fetch records for all pets
          ...(pets.map(pet => {
            const petId = pet._id || pet.id;
            return getMedicalRecords(petId).catch(() => []);
          }))
        ]);
        if (!mounted) return;
        
        // Flatten all medical records from all pets
        const allRecords = recordsArrays.flat();
        
        // Get dismissed notification IDs from localStorage
        let dismissedIds = [];
        try {
          const stored = localStorage.getItem('dismissedNotifications');
          dismissedIds = stored ? JSON.parse(stored) : [];
        } catch (err) {
          console.error('Error reading dismissed notifications', err);
        }
        
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // Match NotificationList filtering exactly
        const apptNotices = (appts || [])
          .filter(a => a.status === 'Confirmed' || a.status === 'Scheduled')
          .map(a => `appt-${a._id || a.id}`)
          .filter(id => !dismissedIds.includes(id));
        
        const vaxNotices = (allRecords || [])
          .filter(r => r.type === 'Vaccination')
          .map(r => `vax-${r._id || r.id}`)
          .filter(id => !dismissedIds.includes(id));
        
        const aiNotices = (allRecords || [])
          .filter(r => r.type === 'AI Diagnosis')
          .map(r => `ai-${r._id || r.id}`)
          .filter(id => !dismissedIds.includes(id));
        
        // Count matches exactly what's shown in NotificationList
        const totalCount = apptNotices.length + vaxNotices.length + aiNotices.length;
        
        // Debug logging
        if (totalCount > 0) {
          console.log('[Navbar] Badge count breakdown:', {
            appointments: apptNotices.length,
            vaccinations: vaxNotices.length,
            aiDiagnosis: aiNotices.length,
            total: totalCount,
            dismissedCount: dismissedIds.length,
            petsCount: pets.length,
            recordsCount: allRecords.length
          });
        }
        
        setBellCount(totalCount);
      } catch (e) {
        console.error('Error updating bell count', e);
        if (mounted) setBellCount(0);
      }
    };
    
    // Debounce to avoid rapid calls
    const timeoutId = setTimeout(updateBell, 100);
    
    const handleAppointmentUpdate = () => {
      if (mounted) updateBell();
    };
    const handleMedicalRecordUpdate = () => {
      if (mounted) updateBell();
    };
    const handleNotificationDismissed = () => {
      if (mounted) updateBell();
    };
    
    window.addEventListener('appointmentUpdate', handleAppointmentUpdate);
    window.addEventListener('medicalRecordUpdate', handleMedicalRecordUpdate);
    window.addEventListener('notificationDismissed', handleNotificationDismissed);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener('appointmentUpdate', handleAppointmentUpdate);
      window.removeEventListener('medicalRecordUpdate', handleMedicalRecordUpdate);
      window.removeEventListener('notificationDismissed', handleNotificationDismissed);
    };
  }, [selectedPetId, _pets]);

  // Track unread messages
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
        
        // Get unique vets from appointments
        const vetIds = [...new Set(
          appointments
            .map(a => a.vetId?._id || a.vetId)
            .filter(Boolean)
            .map(id => id.toString())
        )];
        
        if (vetIds.length === 0) {
          setMessageCount(0);
          return;
        }
        
        let totalUnread = 0;
        for (const vetId of vetIds) {
          try {
            const { getMessages } = await import('../utils/messageStore');
            const msgs = await getMessages(vetId, null, true); // Bypass cache for accurate count
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
            console.error(`Error loading messages for vet ${vetId}:`, e);
            // Skip if error loading messages for this vet
          }
        }
        
        console.log(`[Navbar] Message count updated: ${totalUnread} unread messages`);
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
  
  
  
  // onNavigate prop is not strictly needed since Navbar uses useNavigate internally,
  // but we can accept it to align with other components if needed in future refactors.
  // For now, we rely on the hook.

  const navCategories = [
    { name: 'Dashboard', path: '/pet-owner/dashboard', icon: <FiHome />, subnav: [] },
    {
      name: 'My Pets',
      path: '/pet-owner/pets',
      icon: <FaPaw />,
      subnav: [
        { name: 'Add Pet', path: '/pet-owner/pets/add', icon: <FiPlus /> },
        { name: 'My Pets', path: '/pet-owner/pets', icon: <FiList /> },
      ],
    },
    {
      name: 'Health Tools',
      path: '/pet-owner/ai',
      icon: <FiActivity />,
      subnav: [
        { name: 'AI Disease Detection', path: '/pet-owner/ai', icon: <FiCpu /> },
        { name: 'AI History', path: '/pet-owner/ai/history', icon: <FiClock /> },
        { name: 'Medicines', path: null, action: 'medicine', icon: <FiPackage /> },
      ],
    },
    {
      name: 'Services',
      path: '/pet-owner/vets',
      icon: <FiBriefcase />,
      subnav: [
        { name: 'Find a Vet', path: '/pet-owner/vets', icon: <FiUserCheck /> },
        { name: 'Appointments', path: '/pet-owner/appointments/history', icon: <FiCalendar /> },
        { name: 'Prescriptions', path: '/pet-owner/prescriptions', icon: <FaPills /> },
      ],
    },
    { name: 'PawMarket', path: '/pet-owner/marketplace', icon: <FiShoppingBag />, subnav: [] },
  ];

  // Helper to determine active state more loosely for pet owner paths
  const isActive = (path, subnav = []) => {
    if (path === '/pet-owner/dashboard' && location.pathname === '/pet-owner/dashboard') return true;
    if (location.pathname.startsWith(path) && path !== '/pet-owner/dashboard') return true;
    return subnav.some((s) => location.pathname.startsWith(s.path));
  };

  return (
    <header className="sticky top-0 bg-white z-50">
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
            <div
              className="flex-shrink-0 flex items-center gap-2 text-gray-900 font-bold text-xl cursor-pointer"
              onClick={() => navigate('/pet-owner/dashboard')}
            >
              <FaPaw className="text-blue-500 text-2xl" />
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
              onClick={() => setShowCart(true)}
              className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none hidden sm:block"
              aria-label="Cart"
              title="Cart"
            >
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>
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
              onClick={() => navigate('/pet-owner/notifications')}
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
                      navigate('/pet-owner/profile');
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
                        const isActive = sub.path && location.pathname === sub.path;
                        return (
                          <li key={sub.name}>
                            <button
                              onClick={() => {
                                if (sub.action) {
                                  const petId = localStorage.getItem('pawmate_selected_pet_id');
                                  if (!petId) {
                                    alert('Please select a pet first');
                                    navigate('/pet-owner/pets');
                                    return;
                                  }
                                  if (sub.action === 'vaccination') {
                                    navigate(`/pet-owner/pets/${petId}/vaccinations`);
                                  } else if (sub.action === 'medicine') {
                                    navigate(`/pet-owner/ai/medicine-suggestions/latest`);
                                  }
                                } else if (sub.path) {
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
      {showCart && (
        <CartModal
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}
      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
        />
      )}
      {showMessages && (
        <MessagesModal
          isOpen={showMessages}
          onClose={() => setShowMessages(false)}
        />
      )}
    </header>
  );
}
