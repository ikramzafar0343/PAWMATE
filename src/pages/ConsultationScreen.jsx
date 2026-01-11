import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatHeader from '../components/consultation/ChatHeader';
import MessageList from '../components/consultation/MessageList';
import ChatInput from '../components/consultation/ChatInput';
import SharedRecords from '../components/consultation/SharedRecords';
import SharedFilesModal from '../components/consultation/SharedFilesModal';
import VideoCallOverlay from '../components/consultation/VideoCallOverlay';
import { getAppointments, updateAppointmentStatus } from '../utils/appointmentStore';
import { getPets } from '../utils/petStore';
import { getVetById } from '../utils/vetStore';
import { getMessages, sendMessage } from '../utils/messageStore';

const ConsultationScreen = ({ onNavigate }) => {
  const { appointmentId } = useParams();
  const [callType, setCallType] = useState(null); // 'voice' | 'video' | null
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showSharedFiles, setShowSharedFiles] = useState(false);
  const [partner, setPartner] = useState(null);
  const [selfImage, setSelfImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [consultationData, setConsultationData] = useState(null);
  const role = localStorage.getItem('role') || 'pet-owner';
  
  const handleSendMessage = async (messageData) => {
    // Handle both old string format and new object format for backward compatibility
    const content = typeof messageData === 'string' ? messageData : messageData.content;
    const type = typeof messageData === 'string' ? 'text' : (messageData.type || 'text');
    const additionalData = typeof messageData === 'object' ? messageData : {};
    
    const newMessage = {
      id: Date.now(),
      sender: role === 'vet' ? (localStorage.getItem('userFirstName') || 'Dr.') : 'Me',
      senderImage: role === 'vet' 
        ? (localStorage.getItem('userImage') || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80")
        : (selfImage || "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"),
      content: content,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isMe: true,
      type: type,
      ...additionalData // Include imageUrl, file, fileUrl, fileSize, etc.
    };
    
    try {
      if (partner?.id) {
        await sendMessage(partner.id, newMessage.content, newMessage.type, null, appointmentId || consultationData?._id || null);
      }
      setMessages(prev => [...prev, newMessage]);
    } catch (e) {
      console.error('Error sending message', e);
    }
    
    // Remove auto-reply - let vets respond manually
    // Auto-replies are not professional and should be removed
  };

  useEffect(() => {
    const loadConsultation = async () => {
      try {
        const appointments = await getAppointments();
        const activeConsultation = appointments.find(a => (a._id || a.id) === appointmentId);
        
        if (activeConsultation) {
          // Determine chat partner based on user role
          let chatPartner = {};
          let myImage = null;
          
          let consultationInfo = { ...activeConsultation };
          
          if (role === 'vet') {
              // If I am vet, partner is Pet/Owner
              const pets = await getPets();
              const petId = activeConsultation.petId?._id || activeConsultation.petId || activeConsultation.petId;
              const pet = pets.find(p => (p._id || p.id) === petId || p.name === activeConsultation.petName);
              
              chatPartner = {
                  name: activeConsultation.petName || activeConsultation.petId?.name || 'Pet Owner',
                  image: activeConsultation.petImage || activeConsultation.petId?.image || `https://ui-avatars.com/api/?name=${(activeConsultation.petName || 'P').replace(' ', '+')}&background=random`,
                  status: 'Online',
                  role: 'Pet Owner'
              };
              myImage = localStorage.getItem('userImage') || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80";
              
              consultationInfo.petId = pet?._id || pet?.id || activeConsultation.petId?._id || activeConsultation.petId || null;
          } else {
              // If I am pet owner, partner is Vet
              const vetId = activeConsultation.vetId?._id || activeConsultation.vetId || activeConsultation.vetId;
              let vetData = null;
              if (vetId) {
                vetData = await getVetById(vetId);
              }
              chatPartner = {
                  name: activeConsultation.vetName || activeConsultation.vetId?.name || activeConsultation.doctorName || vetData?.name || "Dr. Sarah Johnson",
                  image: vetData?.image || activeConsultation.vetId?.image || activeConsultation.doctorImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
                  status: "Online",
                  role: 'Veterinarian'
              };
              myImage = activeConsultation.petImage || activeConsultation.petId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConsultation.petName || 'P')}&background=random`;
              
              consultationInfo.vetId = vetData?._id || vetData?.id || activeConsultation.vetId?._id || activeConsultation.vetId;
              consultationInfo.petId = activeConsultation.petId?._id || activeConsultation.petId || null;
          }
          
          // Resolve partner id for messaging
          const partnerId = role === 'vet'
              ? (activeConsultation.ownerId?._id || activeConsultation.ownerId || null)
              : (activeConsultation.vetId?._id || activeConsultation.vetId || null);
          
          setPartner({ ...chatPartner, id: partnerId });
          setSelfImage(myImage);
          setConsultationData(consultationInfo);
          
          try {
            // Load real messages
            if (partnerId) {
              const msgs = await getMessages(partnerId, appointmentId || null);
              const normalized = msgs.map(m => ({
                id: m._id || m.id,
                sender: m.sender?.name || 'User',
                senderImage: m.sender?.image || "https://ui-avatars.com/api/?name=U&background=random",
                content: m.content,
                time: new Date(m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                isMe: m.sender?._id ? (localStorage.getItem('userId') === m.sender._id) : false,
                type: m.type || 'text'
              }));
              setMessages(normalized);
            } else {
              setMessages([]);
            }
          } catch (e) {
            console.error('Error loading messages', e);
            setMessages([]);
          }
        } else {
          // Fallback for demo / direct link without ID
          if (role === 'vet') {
            setPartner({
              name: "Pet Owner",
              image: "https://ui-avatars.com/api/?name=PO&background=random",
              status: "Online"
            });
            setSelfImage(localStorage.getItem('userImage') || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80");
          } else {
            const defaultVet = vets[0];
            setPartner({
              name: defaultVet.name,
              image: defaultVet.image,
              status: "Online"
            });
            setSelfImage("https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80");
          }
        }
      } catch (error) {
        console.error("Error loading consultation", error);
        // Fallback for demo / direct link without ID
        if (role === 'vet') {
          setPartner({
            name: "Pet Owner",
            image: "https://ui-avatars.com/api/?name=PO&background=random",
            status: "Online"
          });
          setSelfImage(localStorage.getItem('userImage') || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80");
        } else {
          const defaultVet = vets[0];
          setPartner({
            name: defaultVet.name,
            image: defaultVet.image,
            status: "Online"
          });
          setSelfImage("https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80");
        }
      }
    };
    
    loadConsultation();
    window.addEventListener('appointmentUpdate', loadConsultation);
    window.addEventListener('consultationUpdate', loadConsultation);
    return () => {
      window.removeEventListener('appointmentUpdate', loadConsultation);
      window.removeEventListener('consultationUpdate', loadConsultation);
    };
  }, [appointmentId, role]);

  if (!partner) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-500">Loading consultation...</p>
      </div>
    );
  }

  const handleViewProfile = () => {
    if (!partner || !consultationData) return;
    
    if (role === 'vet') {
      // Vet viewing pet owner's pet profile
      const pets = getPets();
      const pet = pets.find(p => p.name === consultationData.petName || p.id === consultationData.petId);
      if (pet) {
        onNavigate && onNavigate('petDetails', { id: pet.id, name: pet.name, breed: pet.breed, age: pet.age, weight: pet.weight, image: pet.image, status: pet.status, statusColor: pet.statusColor });
      } else {
        // Fallback to dashboard
        onNavigate && onNavigate('dashboard');
      }
    } else {
      // Pet owner viewing vet profile
      const vetId = consultationData.vetId || vets.find(v => v.name === partner.name)?.id;
      if (vetId) {
        onNavigate && onNavigate('vetProfile', { vetId });
      } else {
        onNavigate && onNavigate('vetListing');
      }
    }
  };

  const handleSharedFiles = () => {
    setShowSharedFiles(true);
  };

  const handleEndConsultation = async () => {
    if (window.confirm('Are you sure you want to end this consultation?')) {
      // Check user role - only vets/admins can mark appointments as completed
      const userRole = localStorage.getItem('role');
      if (userRole !== 'vet' && userRole !== 'admin') {
        alert('Only veterinarians can end consultations. Please contact your vet to complete the appointment.');
        return;
      }
      
      // Mark consultation as completed
      try {
        await updateAppointmentStatus(appointmentId, 'Completed');
        // Update consultation status if needed
        window.dispatchEvent(new Event('consultationUpdate'));
        window.dispatchEvent(new Event('appointmentUpdate'));
        
        // Navigate back to dashboard
        onNavigate && onNavigate('dashboard');
      } catch (error) {
        console.error("Error ending consultation", error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to end consultation';
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <ChatHeader 
          onBack={() => onNavigate && onNavigate('dashboard')} 
          vet={partner} 
          onVideoCall={() => setCallType('video')}
          onVoiceCall={() => setCallType('voice')}
          onMoreOptions={() => setShowMoreOptions(!showMoreOptions)}
          showMoreOptions={showMoreOptions}
          onViewProfile={handleViewProfile}
          onSharedFiles={handleSharedFiles}
          onEndConsultation={handleEndConsultation}
        />
        
        <MessageList messages={messages} />
        
        <ChatInput onSendMessage={handleSendMessage} />

        {callType && (
          <VideoCallOverlay 
            vet={partner} 
            selfImage={selfImage}
            onEndCall={() => setCallType(null)} 
            isVoiceOnly={callType === 'voice'}
          />
        )}
      </div>

      {/* Sidebar for Records (Visible on large screens) */}
      <SharedRecords 
        onNavigate={onNavigate} 
        consultationData={consultationData}
        petId={consultationData?.petId}
      />

      {/* Shared Files Modal */}
      <SharedFilesModal
        isOpen={showSharedFiles}
        onClose={() => setShowSharedFiles(false)}
        messages={messages}
      />
    </div>
  );
};

export default ConsultationScreen;
