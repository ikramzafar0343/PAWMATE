import { useLocation } from 'react-router-dom';
import { 
  VetNavbar, 
  WelcomeHeader, 
  TodaySchedule, 
  ActiveConsultations, 
  PendingPrescriptions, 
  QuickActions, 
  RecentRecords, 
  StatsFooter,
  PatientsList
} from '../components/veterinarianDashboard/VeterinarianComponents'

export default function VeterinarianDashboard({ onNavigate }) {
  const location = useLocation();
  const isPatientsPage = location.pathname.includes('/patients');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* <VetNavbar /> */}
      
      <WelcomeHeader onNavigate={onNavigate} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-8">
            {isPatientsPage ? (
              <PatientsList />
            ) : (
              <>
                <TodaySchedule />
                <ActiveConsultations onNavigate={onNavigate} />
              </>
            )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            <PendingPrescriptions />
            <QuickActions />
            {!isPatientsPage && <RecentRecords />}
          </div>
        </div>
      </main>

      <StatsFooter />
    </div>
  )
}
