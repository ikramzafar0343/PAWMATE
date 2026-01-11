import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import VetNavbar from './components/VetNavbar';
import AdminNavbar from './components/AdminNavbar';
import AddPet from './pages/AddPet';
import AiDiagnosisResult from './pages/AiDiagnosisResult';
import AiDiseaseDetection from './pages/AiDiseaseDetection';
import AiDetectionHistory from './pages/AiDetectionHistory';
import PetMedicalRecords from './pages/PetMedicalRecords';
import PetProfile from './pages/PetProfile';
import VaccinationManagement from './pages/VaccinationManagement';
import PetManagement from './pages/PetManagement';
import VetListing from './pages/VetListing';
import AppointmentBooking from './pages/AppointmentBooking';
import ConsultationScreen from './pages/ConsultationScreen';
import ConsultationHistory from './pages/ConsultationHistory';
import PrescriptionManagement from './pages/PrescriptionManagement';
import MedicineSuggestions from './pages/MedicineSuggestions';
import BreedingManagement from './pages/BreedingManagement';
import Marketplace from './pages/Marketplace';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import WelcomeScreen from './pages/auth/WelcomeScreen';
import LoginScreen from './pages/auth/LoginScreen';
import RegisterScreen from './pages/auth/RegisterScreen';
import ForgotPasswordScreen from './pages/auth/ForgotPasswordScreen';
import PetOwnerDashboard from './pages/PetOwnerDashboard';
import VeterinarianDashboard from './pages/VeterinarianDashboard';
import VetProfile from './pages/VetProfile';
import VetAppointments from './pages/VetAppointments';
import PetOwnerPrescriptions from './pages/PetOwnerPrescriptions';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine if we are on an auth page to hide Navbar
  const isAuthPage = ['/welcome', '/login', '/register', '/forgot-password', '/reset-password'].some(path => location.pathname.startsWith(path));
  const isVetPage = location.pathname.startsWith('/vet');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isProtected = location.pathname.startsWith('/vet') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/pet-owner');

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    if (!role && isProtected && !isAuthPage) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Enhanced role-based access control
    if (role && isProtected && !isAuthPage) {
      const isPetOwnerRoute = location.pathname.startsWith('/pet-owner');
      const isVetRoute = location.pathname.startsWith('/vet');
      const isAdminRoute = location.pathname.startsWith('/admin');
      
      // Prevent cross-role access
      if (role === 'pet-owner' && (isVetRoute || isAdminRoute)) {
        navigate('/pet-owner/dashboard', { replace: true });
      } else if (role === 'vet' && (isPetOwnerRoute || isAdminRoute)) {
        navigate('/vet/dashboard', { replace: true });
      } else if (role === 'admin' && (isPetOwnerRoute || isVetRoute)) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
    
    // Trigger data refresh when authenticated user loads the app
    if (token && role && isProtected && !isAuthPage) {
      // Small delay to ensure components are mounted
      setTimeout(() => {
        window.dispatchEvent(new Event('appLoad'));
        window.dispatchEvent(new Event('petUpdate'));
        window.dispatchEvent(new Event('appointmentUpdate'));
        window.dispatchEvent(new Event('medicalRecordUpdate'));
      }, 100);
    }
  }, [location.pathname, isProtected, isAuthPage, navigate]);

  // Logic to determine active page ID for Navbar highlighting
  const getPageIdFromPath = (path) => {
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/add')) return 'addPet';
    if (path.includes('/ai/result')) return 'diagnosis';
    if (path.includes('/ai/history')) return 'history';
    if (path.includes('/ai')) return 'detection';
    if (path.includes('/edit')) return 'editPet';
    if (path.includes('/medical-records') || path.includes('/records')) return 'records';
    if (path.includes('/vaccinations')) return 'vaccination';
    if (path.includes('/vets')) return 'vetListing';
    if (path.includes('/appointments/history')) return 'consultationHistory';
    if (path.includes('/appointments')) return 'appointment';
    if (path.includes('/consultation')) return 'consultation';
    if (path.includes('/prescriptions')) return 'prescription';
    if (path.includes('/medicine')) return 'medicine';
    if (path.includes('/breeding')) return 'breeding';
    if (path.includes('/marketplace')) return 'marketplace';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/admin')) return 'admin';
    return 'dashboard';
  };

  const currentPage = getPageIdFromPath(location.pathname);

  // Handler for Navbar navigation
  const handleNavigate = (pageId, data) => {
    switch (pageId) {
      case 'dashboard': navigate('/pet-owner/dashboard'); break;
      case 'addPet': navigate('/pet-owner/pets/add'); break;
      case 'petDetails': {
        const petId = data?._id || data?.id;
        if (!petId) {
          // If no pet ID, navigate to pets list instead
          navigate('/pet-owner/pets');
          break;
        }
        navigate(`/pet-owner/pets/${petId}`, { state: { pet: data } }); 
        break;
      }
      case 'detection': {
        if (location.pathname.startsWith('/vet')) {
          navigate('/vet/patients');
        } else {
          navigate('/pet-owner/ai');
        }
        break;
      }
      case 'diagnosis': {
        const scanId = data?.scanId || 'latest';
        navigate(`/pet-owner/ai/result/${scanId}`);
        break;
      }
      case 'history': navigate('/pet-owner/ai/history'); break;
      case 'editPet': {
        const petId = data?._id || data?.id || localStorage.getItem('pawmate_selected_pet_id');
        if (!petId) {
          navigate('/pet-owner/pets');
          break;
        }
        navigate(`/pet-owner/pets/${petId}/edit`);
        break;
      }
      case 'records': {
        if (location.pathname.startsWith('/vet')) {
          navigate('/vet/patients?section=records');
        } else {
          const petId = data?._id || data?.id || localStorage.getItem('pawmate_selected_pet_id');
          if (!petId) {
            navigate('/pet-owner/pets');
            break;
          }
          navigate(`/pet-owner/pets/${petId}/medical-records`);
        }
        break;
      }
      case 'vaccination': {
        const petId = data?._id || data?.id || localStorage.getItem('pawmate_selected_pet_id');
        if (!petId) {
          navigate('/pet-owner/pets');
          break;
        }
        navigate(`/pet-owner/pets/${petId}/vaccinations`);
        break;
      }
      case 'vetListing': navigate('/pet-owner/vets'); break;
      case 'appointment': {
        if (location.pathname.startsWith('/vet')) {
          navigate('/vet/appointments');
        } else {
          const vetId = data?.vetId || data?.vet?.id || 'general';
          navigate(`/pet-owner/appointments/book/${vetId}`, { state: data });
        }
        break;
      }
      case 'vetProfile': {
        const id = data?.vetId || data?.id;
        navigate(`/pet-owner/vets/${id || '1'}`);
        break;
      }
      case 'consultation': {
        const consultationId = data?.id || 'general';
        if (location.pathname.startsWith('/vet')) {
          navigate(`/vet/consultation/${consultationId}`);
        } else {
          navigate(`/pet-owner/appointments/${consultationId}`, { state: { consultation: data } });
        }
        break;
      }
      case 'consultationHistory': navigate('/pet-owner/appointments/history'); break;
      case 'prescription': {
        if (location.pathname.startsWith('/vet')) {
          navigate('/vet/prescriptions');
        } else {
          navigate('/pet-owner/prescriptions');
        }
        break;
      }
      case 'medicine': {
        const scanId = data?.scanId || 'latest';
        navigate(`/pet-owner/ai/medicine-suggestions/${scanId}`);
        break;
      }
      case 'breeding': navigate('/pet-owner/breeding'); break;
      case 'marketplace': navigate('/pet-owner/marketplace'); break;
      case 'notifications': {
        if (location.pathname.startsWith('/vet')) {
          navigate('/vet/notifications');
        } else {
          navigate('/pet-owner/notifications');
        }
        break;
      }
      case 'profile': {
        if (location.pathname.startsWith('/vet')) {
          navigate('/vet/profile');
        } else {
          navigate('/pet-owner/profile');
        }
        break;
      }
      case 'admin': navigate('/admin/dashboard'); break;
      case 'welcome': navigate('/welcome'); break;
      case 'login': navigate('/login'); break;
      case 'register': navigate('/register'); break;
      case 'forgot-password': navigate('/forgot-password'); break;
      case 'home': {
        if (location.pathname.startsWith('/vet')) {
          navigate('/vet/dashboard');
        } else {
          navigate('/pet-owner/dashboard');
        }
        break;
      }
      default: navigate('/pet-owner/dashboard');
    }
  };

  // Helper to pass props to legacy components
  const commonProps = {
    onNavigate: handleNavigate,
    currentPage: currentPage
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthPage && !isVetPage && !isAdminPage && <Navbar />}
      {!isAuthPage && isVetPage && <VetNavbar />}
      {!isAuthPage && isAdminPage && <AdminNavbar />}
      
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<WelcomeScreen onNavigate={(page) => navigate('/' + page)} />} />
        <Route path="/login" element={<LoginScreen onNavigate={(page) => navigate(page.startsWith('/') ? page : (page === 'dashboard' ? '/pet-owner/dashboard' : '/' + page))} />} />
        <Route path="/register/*" element={<RegisterScreen onNavigate={(page) => navigate(page.startsWith('/') ? page : '/' + page)} />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen onNavigate={(page) => navigate('/' + page)} />} />
        <Route path="/reset-password" element={<ForgotPasswordScreen onNavigate={(page) => navigate('/' + page)} />} />

        {/* Pet Owner Routes */}
        <Route path="/pet-owner/dashboard" element={<PetOwnerDashboard {...commonProps} />} />
        <Route path="/pet-owner/notifications" element={<NotificationsPage {...commonProps} />} />
        <Route path="/pet-owner/notification-settings" element={<NotificationsPage {...commonProps} />} />
        
        <Route path="/pet-owner/pets" element={<PetManagement {...commonProps} />} />
        <Route path="/pet-owner/pets/add" element={<AddPet {...commonProps} />} />
        <Route path="/pet-owner/pets/:petId" element={<PetProfile {...commonProps} />} />
        <Route path="/pet-owner/pets/:petId/edit" element={<AddPet {...commonProps} />} />
        <Route path="/pet-owner/pets/:petId/medical-records" element={<PetMedicalRecords {...commonProps} />} />
        <Route path="/pet-owner/pets/:petId/vaccinations" element={<VaccinationManagement {...commonProps} />} />
        <Route path="/pet-owner/pets/:petId/breeding" element={<BreedingManagement {...commonProps} />} />

        <Route path="/pet-owner/ai" element={<AiDiseaseDetection {...commonProps} />} />
        <Route path="/pet-owner/ai/upload" element={<AiDiseaseDetection {...commonProps} />} />
        <Route path="/pet-owner/ai/result/:scanId" element={<AiDiagnosisResult {...commonProps} />} />
        <Route path="/pet-owner/ai/history" element={<AiDetectionHistory {...commonProps} />} />
        <Route path="/pet-owner/ai/medicine-suggestions/:scanId" element={<MedicineSuggestions {...commonProps} />} />

        <Route path="/pet-owner/vets" element={<VetListing {...commonProps} />} />
        <Route path="/pet-owner/vets/:vetId" element={<VetProfile {...commonProps} />} />
        <Route path="/pet-owner/appointments/book/:vetId" element={<AppointmentBooking {...commonProps} />} />
        <Route path="/pet-owner/appointments/:appointmentId" element={<ConsultationScreen {...commonProps} />} />
        <Route path="/pet-owner/appointments/history" element={<ConsultationHistory {...commonProps} />} />
        <Route path="/pet-owner/prescriptions" element={<PetOwnerPrescriptions {...commonProps} />} />

        <Route path="/pet-owner/marketplace/*" element={<Marketplace {...commonProps} />} />
        
        <Route path="/pet-owner/breeding/*" element={<BreedingManagement {...commonProps} />} />

        <Route path="/pet-owner/profile/*" element={<ProfilePage {...commonProps} />} />

        {/* Vet Routes */}
        <Route path="/vet/dashboard" element={<VeterinarianDashboard {...commonProps} />} />
        <Route path="/vet/appointments" element={<VetAppointments {...commonProps} />} />
        <Route path="/vet/appointments/:appointmentId" element={<VetAppointments {...commonProps} />} />
        <Route path="/vet/consultation/:appointmentId" element={<ConsultationScreen {...commonProps} />} />
        <Route path="/vet/patients" element={<VeterinarianDashboard {...commonProps} />} />
        <Route path="/vet/patients/:petId/medical-records" element={<PetMedicalRecords {...commonProps} />} />
        <Route path="/vet/prescriptions" element={<PrescriptionManagement {...commonProps} />} />
        <Route path="/vet/notifications" element={<NotificationsPage {...commonProps} />} />
        <Route path="/vet/profile/*" element={<ProfilePage {...commonProps} />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard {...commonProps} />} />
        <Route path="/admin/users" element={<AdminDashboard {...commonProps} />} />
        <Route path="/admin/reported-content" element={<AdminDashboard {...commonProps} />} />
        <Route path="/admin/marketplace-moderation" element={<AdminDashboard {...commonProps} />} />
        <Route path="/admin/system-logs" element={<AdminDashboard {...commonProps} />} />
        <Route path="/admin/analytics" element={<AdminDashboard {...commonProps} />} />
        <Route path="/admin/profile" element={<ProfilePage {...commonProps} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/pet-owner/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
