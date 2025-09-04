import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPhone, 
  FaPhoneSlash, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVolumeUp, 
  FaVolumeMute,
  FaUser,
  FaClock,
  FaVideo
} from 'react-icons/fa';

const VoiceCall = ({ 
  isIncoming = false, 
  callerName = 'مجهول', 
  callerAvatar = null,
  onAccept, 
  onReject, 
  onEnd,
  onMute,
  onUnmute,
  onSpeakerOn,
  onSpeakerOff,
  isMuted = false,
  isSpeakerOn = false,
  callDuration = 0
}) => {
  const [isAccepted, setIsAccepted] = useState(!isIncoming);
  const [callTime, setCallTime] = useState(callDuration);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMutedState, setIsMutedState] = useState(isMuted);
  const [isSpeakerOnState, setIsSpeakerOnState] = useState(isSpeakerOn);
  const intervalRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (isAccepted) {
      intervalRef.current = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAccepted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsAccepted(true);
      setIsConnecting(false);
      onAccept?.();
    }, 1000);
  };

  const handleReject = () => {
    onReject?.();
  };

  const handleEnd = () => {
    onEnd?.();
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMutedState;
    setIsMutedState(newMutedState);
    
    if (newMutedState) {
      onMute?.();
    } else {
      onUnmute?.();
    }
  };

  const handleSpeakerToggle = () => {
    const newSpeakerState = !isSpeakerOnState;
    setIsSpeakerOnState(newSpeakerState);
    
    if (newSpeakerState) {
      onSpeakerOn?.();
    } else {
      onSpeakerOff?.();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-sm w-full">
          {/* Caller Info */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src={callerAvatar || `https://ui-avatars.com/api/?name=${callerName}&background=3b82f6&color=fff&size=128`}
                alt={callerName}
                className="w-full h-full object-cover"
              />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{callerName}</h2>
            
            {isAccepted ? (
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <FaClock className="text-green-400" />
                <span className="text-green-400 font-mono text-lg">
                  {formatTime(callTime)}
                </span>
              </div>
            ) : (
              <p className="text-white/80">
                {isIncoming ? 'مكالمة واردة' : 'جاري الاتصال...'}
              </p>
            )}
          </motion.div>

          {/* Connection Status */}
          {isConnecting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex justify-center space-x-1 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-white/80 mt-2">جاري الاتصال...</p>
            </motion.div>
          )}

          {/* Call Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {!isAccepted ? (
              // Incoming call controls
              <div className="flex justify-center space-x-8 rtl:space-x-reverse">
                <button
                  onClick={handleReject}
                  className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                >
                  <FaPhoneSlash size={24} />
                </button>
                <button
                  onClick={handleAccept}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
                >
                  <FaPhone size={24} />
                </button>
              </div>
            ) : (
              // Active call controls
              <div className="space-y-4">
                {/* Main controls */}
                <div className="flex justify-center space-x-6 rtl:space-x-reverse">
                  <button
                    onClick={handleMuteToggle}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105 ${
                      isMutedState 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    {isMutedState ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                  </button>
                  
                  <button
                    onClick={handleSpeakerToggle}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105 ${
                      isSpeakerOnState 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    {isSpeakerOnState ? <FaVolumeUp size={20} /> : <FaVolumeMute size={20} />}
                  </button>
                </div>

                {/* End call button */}
                <button
                  onClick={handleEnd}
                  className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 mx-auto"
                >
                  <FaPhoneSlash size={24} />
                </button>
              </div>
            )}
          </motion.div>

          {/* Call Status */}
          {isAccepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-white/80 text-sm"
            >
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>متصل</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceCall;
