import React, { useEffect, useState, useRef } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiMaximize, FiMinimize } from 'react-icons/fi';

const VideoCallOverlay = ({ onEndCall, vet, selfImage, isVoiceOnly = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(isVoiceOnly);
  const [seconds, setSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize camera and microphone
  useEffect(() => {
    let mounted = true;

    const initializeMedia = async () => {
      try {
        if (mounted) {
          setIsLoading(true);
          setError(null);
          setVideoReady(false);
        }

        // Request camera and microphone access
        const constraints = {
          video: !isVoiceOnly ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } : false,
          audio: true // Always request audio, we'll control it with track.enabled
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          // Component unmounted, cleanup
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        localStreamRef.current = stream;

        // Display local video stream
        if (localVideoRef.current && !isVoiceOnly) {
          localVideoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          localVideoRef.current.onloadedmetadata = () => {
            if (mounted) {
              setVideoReady(true);
              setIsLoading(false);
            }
          };
          
          localVideoRef.current.onplaying = () => {
            if (mounted) {
              setVideoReady(true);
              setIsLoading(false);
            }
          };
          
          // Fallback: if metadata doesn't fire, set ready after a short delay
          setTimeout(() => {
            if (mounted && !videoReady) {
              setVideoReady(true);
              setIsLoading(false);
            }
          }, 2000);
        } else {
            if (mounted) {
                setVideoReady(true);
                setIsLoading(false);
            }
        }

        // Handle audio tracks
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = !isMuted;
        });
      } catch (err) {
        console.error('Error accessing media devices:', err);
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
          
          // Show user-friendly error message
          if (err.name === 'NotAllowedError') {
            setError('Camera and microphone access denied. Please allow access in your browser settings.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera or microphone found. Please connect a device and try again.');
          } else {
            setError('Failed to access camera/microphone. Please check your device permissions.');
          }
        }
      }
    };

    if (!isVoiceOnly) {
      initializeMedia();
    } else {
      // Async state update to avoid lint error
      const timer = setTimeout(() => {
        setIsLoading(false);
        setVideoReady(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Cleanup function
    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      const videoEl = localVideoRef.current;
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [isVoiceOnly]);

  // Update video track when video is toggled
  useEffect(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoOff && !isVoiceOnly;
      });
      
      // Update video element visibility
      if (localVideoRef.current) {
        if (isVideoOff || isVoiceOnly) {
          localVideoRef.current.srcObject = null;
        } else {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
    }
  }, [isVideoOff, isVoiceOnly]);

  // Update audio track when mute is toggled
  useEffect(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    onEndCall();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <FiVideoOff className="text-red-400 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-white">Camera Access Error</h3>
          </div>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleEndCall}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              End Call
            </button>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Loading State - Only show if truly loading and not voice only */}
        {isLoading && !isVoiceOnly && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white font-medium text-lg">Connecting camera...</p>
              <p className="text-gray-400 text-sm mt-2">Please allow camera access when prompted</p>
            </div>
          </div>
        )}

        {/* Remote Video (Partner) - Main Display */}
        {isVoiceOnly || isVideoOff ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900">
            <div className="w-40 h-40 rounded-full border-4 border-blue-500 p-2 mb-6 relative">
              <img 
                src={vet.image} 
                alt={vet.name} 
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 w-4 h-4 rounded-full border-2 border-gray-900"></div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{vet.name}</h2>
            <p className="text-blue-400 font-medium text-lg">Voice Call Active</p>
            <p className="text-gray-400 text-sm mt-2">{formatTime(seconds)}</p>
          </div>
        ) : (
          <>
            {/* Remote video stream would go here in a real implementation */}
            <div className="w-full h-full bg-gray-900 flex items-center justify-center relative overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: 'none' }} // Hidden until remote stream is available
              />
              {/* Fallback to image if no remote stream - with blur effect for professional look */}
              <div className="absolute inset-0 w-full h-full">
                {vet.image ? (
                  <img 
                    src={vet.image} 
                    alt={`${vet.name} Video`} 
                    className="w-full h-full object-cover"
                    style={{ filter: 'blur(2px)' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">{vet.name || 'Veterinarian'}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gray-900/20"></div>
              </div>
            </div>
          </>
        )}
        
        {/* Partner Name & Timer Overlay - Professional styling */}
        <div className="absolute top-6 left-6 bg-amber-900/80 backdrop-blur-md px-4 py-2.5 rounded-lg text-white shadow-xl z-30">
          <p className="font-bold text-sm mb-0.5">{vet.name}</p>
          <p className="text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="font-mono">{formatTime(seconds)}</span>
          </p>
        </div>

        {/* Self Video (PiP) - Hide in Voice Mode */}
        {!isVoiceOnly && (
          <div className="absolute top-6 right-6 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
            {videoReady && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
            ) : (
                <img 
                  src={selfImage || "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"}
                  alt="My Video" 
                  className="w-full h-full object-cover opacity-80"
                />
            )}
            
            {/* Status Indicator */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${videoReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span>You</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar - Professional styling */}
      <div className="bg-gray-800/95 backdrop-blur-md px-6 py-5 flex justify-center items-center gap-4 border-t border-gray-700/50">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition-all duration-200 ${
            isMuted 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          } shadow-lg hover:scale-105 active:scale-95`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FiMicOff className="text-xl" /> : <FiMic className="text-xl" />}
        </button>
        
        {!isVoiceOnly && (
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-full transition-all duration-200 ${
              isVideoOff 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } shadow-lg hover:scale-105 active:scale-95`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <FiVideoOff className="text-xl" /> : <FiVideo className="text-xl" />}
          </button>
        )}

        <button 
          onClick={handleEndCall}
          className="p-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-xl shadow-red-900/50 transform hover:scale-105 active:scale-95 transition-all duration-200 mx-2 ring-2 ring-red-500/30"
          title="End call"
        >
          <FiPhoneOff className="text-2xl" />
        </button>

        {!isVoiceOnly && (
          <button 
            onClick={toggleFullscreen}
            className="p-4 bg-gray-700 text-white hover:bg-gray-600 rounded-full transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCallOverlay;
