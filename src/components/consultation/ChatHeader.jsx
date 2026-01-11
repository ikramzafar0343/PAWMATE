import React, { useEffect, useRef } from 'react';
import { FiPhone, FiVideo, FiMoreVertical, FiArrowLeft } from 'react-icons/fi';

const ChatHeader = ({ 
  onBack, 
  vet, 
  onVideoCall, 
  onVoiceCall, 
  onMoreOptions, 
  showMoreOptions,
  onViewProfile,
  onSharedFiles,
  onEndConsultation
}) => {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (showMoreOptions) {
          onMoreOptions();
        }
      }
    };

    if (showMoreOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreOptions, onMoreOptions]);

  const handleViewProfile = () => {
    onMoreOptions(); // Close dropdown
    if (onViewProfile) {
      onViewProfile();
    }
  };

  const handleSharedFiles = () => {
    onMoreOptions(); // Close dropdown
    if (onSharedFiles) {
      onSharedFiles();
    }
  };

  const handleEndConsultation = () => {
    onMoreOptions(); // Close dropdown
    if (onEndConsultation) {
      onEndConsultation();
    } else {
      // Fallback to onBack if no specific handler
      onBack();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full md:hidden" aria-label="Back">
          <FiArrowLeft className="text-xl text-gray-600" />
        </button>
        <div className="relative">
          <img 
            src={vet.image} 
            alt={vet.name} 
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm md:text-base">{vet.name}</h3>
          <p className="text-xs text-green-600 font-medium">Online</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 md:gap-3 relative" ref={dropdownRef}>
        <button 
          onClick={onVoiceCall}
          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Voice Call"
          aria-label="Start Voice Call"
        >
          <FiPhone className="text-xl" />
        </button>
        <button 
          onClick={onVideoCall}
          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Video Call"
          aria-label="Start Video Call"
        >
          <FiVideo className="text-xl" />
        </button>
        <button 
          onClick={onMoreOptions}
          className={`p-2.5 rounded-full transition-colors ${showMoreOptions ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
          title="More Options"
          aria-label="More Options"
        >
          <FiMoreVertical className="text-xl" />
        </button>
        
        {/* More Options Dropdown */}
        {showMoreOptions && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
            <button 
              onClick={handleViewProfile}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              View Profile
            </button>
            <button 
              onClick={handleSharedFiles}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              Shared Files
            </button>
            <div className="h-px bg-gray-100 my-1"></div>
            <button 
              onClick={handleEndConsultation}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              End Consultation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
