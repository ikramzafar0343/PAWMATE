import React from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCamera } from 'react-icons/fi';
import { getCurrentUser } from '../../utils/userStore';
import { getQuickStats } from '../../utils/adminStore';
import { getPets } from '../../utils/petStore';
import { getAppointments } from '../../utils/appointmentStore';

const UserProfile = ({ onNavigate }) => {
  const [userData, setUserData] = React.useState({
    name: '',
    firstName: localStorage.getItem('userFirstName') || '',
    lastName: localStorage.getItem('userLastName') || '',
    email: localStorage.getItem('userEmail') || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    profileImage: localStorage.getItem('userProfileImage') || null,
    role: localStorage.getItem('role') || 'pet-owner'
  });

  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    let mounted = true;
    
    // Load from localStorage first (instant display)
    const nameParts = (localStorage.getItem('userFirstName') || '').split(' ');
    setUserData(prev => ({
      ...prev,
      firstName: localStorage.getItem('userFirstName') || prev.firstName,
      lastName: localStorage.getItem('userLastName') || prev.lastName,
      email: localStorage.getItem('userEmail') || prev.email,
      profileImage: localStorage.getItem('userProfileImage') || prev.profileImage
    }));
    
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted || !user) return;
        
        const nameParts = (user.name || '').split(' ');
        setUserData({
          name: user.name || '',
          firstName: nameParts[0] || localStorage.getItem('userFirstName') || '',
          lastName: nameParts.slice(1).join(' ') || localStorage.getItem('userLastName') || '',
          email: user.email || localStorage.getItem('userEmail') || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          zipCode: user.zipCode || '',
          profileImage: user.image || localStorage.getItem('userProfileImage') || null,
          role: user.role || localStorage.getItem('role') || 'pet-owner'
        });
        
        // Update localStorage for backward compatibility
        if (nameParts.length > 0) {
          localStorage.setItem('userFirstName', nameParts[0]);
          localStorage.setItem('userLastName', nameParts.slice(1).join(' ') || '');
        }
        if (user.email) {
          localStorage.setItem('userEmail', user.email);
        }
        if (user.image) {
          localStorage.setItem('userProfileImage', user.image);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Keep localStorage fallback
      }
    };

    loadUserData();

    const handleProfileUpdate = async () => {
      if (mounted) await loadUserData();
    };

    window.addEventListener('userProfileUpdate', handleProfileUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('userProfileUpdate', handleProfileUpdate);
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        localStorage.setItem('userProfileImage', base64String);
        window.dispatchEvent(new Event('userProfileUpdate'));
      };
      reader.readAsDataURL(file);
    }
  };

  const fullName = userData.name || `${userData.firstName} ${userData.lastName}`.trim() || 'User';
  const fullAddress = userData.address && userData.city && userData.zipCode 
    ? `${userData.address}, ${userData.city}, ${userData.zipCode}`
    : userData.address || 'Not provided';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="w-24 h-24 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border border-gray-200">
            {userData.profileImage ? (
              <img 
                src={userData.profileImage} 
                alt="User Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="text-4xl text-blue-500" />
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700 transition-colors"
          >
            <FiCamera className="text-sm" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
        <p className="text-gray-500">
          {userData.role === 'vet' ? 'Veterinarian' : 
           userData.role === 'admin' ? 'Administrator' : 
           'Pet Owner'}
        </p>
      </div>

      {/* Info Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 mb-2">Personal Information</h3>
        
        <div className="flex items-center gap-4 text-gray-600">
          <FiUser className="text-xl text-gray-400" />
          <div>
            <div className="text-xs text-gray-400">Full Name</div>
            <div className="text-gray-900">{fullName}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <FiMail className="text-xl text-gray-400" />
          <div>
            <div className="text-xs text-gray-400">Email Address</div>
            <div className="text-gray-900">{userData.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <FiPhone className="text-xl text-gray-400" />
          <div>
            <div className="text-xs text-gray-400">Phone Number</div>
            <div className="text-gray-900">{userData.phone || 'Not provided'}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <FiMapPin className="text-xl text-gray-400" />
          <div>
            <div className="text-xs text-gray-400">Address</div>
            <div className="text-gray-900">{fullAddress}</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <Counts role={userData.role} onNavigate={onNavigate} />
    </div>
  );
};

export default UserProfile;

function Counts({ role, onNavigate }) {
  const [petsCount, setPetsCount] = React.useState(null);
  const [apptCount, setApptCount] = React.useState(null);
  
  const loadCounts = React.useCallback(async () => {
    try {
      if (role === 'admin') {
        const qs = await getQuickStats();
        setPetsCount(qs.totalPets || 0);
        setApptCount(qs.totalAppointments || 0);
      } else {
        const [pets, appts] = await Promise.all([getPets(), getAppointments()]);
        setPetsCount(Array.isArray(pets) ? pets.length : 0);
        setApptCount(Array.isArray(appts) ? appts.length : 0);
      }
    } catch (e) {
      setPetsCount(0);
      setApptCount(0);
    }
  }, [role]);
  
  React.useEffect(() => {
    loadCounts();
    const onPet = () => loadCounts();
    const onAppt = () => loadCounts();
    window.addEventListener('petUpdate', onPet);
    window.addEventListener('appointmentUpdate', onAppt);
    return () => {
      window.removeEventListener('petUpdate', onPet);
      window.removeEventListener('appointmentUpdate', onAppt);
    };
  }, [loadCounts]);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div 
        onClick={() => onNavigate && onNavigate('dashboard')}
        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center cursor-pointer hover:border-blue-300 transition-colors"
      >
        <div className="text-2xl font-bold text-blue-600">{petsCount === null ? '...' : petsCount}</div>
        <div className="text-xs text-gray-500">Pets</div>
      </div>
      <div 
        onClick={() => onNavigate && onNavigate('appointment')}
        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center cursor-pointer hover:border-purple-300 transition-colors"
      >
        <div className="text-2xl font-bold text-purple-600">{apptCount === null ? '...' : apptCount}</div>
        <div className="text-xs text-gray-500">Appointments</div>
      </div>
    </div>
  );
}
