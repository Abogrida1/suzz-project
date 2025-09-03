import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../contexts/CallContext';
import { 
  FaPhone, 
  FaPhoneSlash, 
  FaMicrophone, 
  FaMicrophoneSlash,
  FaVolumeUp,
  FaVolumeMute,
  FaVideo,
  FaVideoSlash
} from 'react-icons/fa';

const VoiceCallModal = () => {
  const {
    callState,
    localStream,
    remoteStream,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    acceptCall,
    rejectCall,
    endCall,
    formatCallDuration
  } = useCall();

  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(true);
  const [isVideoOn, setIsVideoOn] = React.useState(true);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Implement speaker toggle logic
  };

  const toggleVideo = () => {
    if (localStream && callState.callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(!videoTrack.enabled);
      }
    }
  };

  if (!callState.isInCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Call Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">
                {callState.callWith?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {callState.callWith?.displayName || 'Unknown User'}
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400">
              {callState.isCallIncoming && 'Incoming call...'}
              {callState.isCallOutgoing && 'Calling...'}
              {callState.isCallActive && formatCallDuration(callDuration)}
            </p>
          </div>

          {/* Video Streams (for video calls) */}
          {callState.callType === 'video' && callState.isCallActive && (
            <div className="mb-6 space-y-4">
              {/* Remote Video */}
              {remoteStream && (
                <div className="relative">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-48 bg-gray-900 rounded-lg object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {callState.callWith?.displayName}
                  </div>
                </div>
              )}

              {/* Local Video */}
              {localStream && (
                <div className="relative w-32 h-24 ml-auto">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full bg-gray-900 rounded-lg object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white px-1 py-0.5 rounded text-xs">
                    You
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isMuted ? <FaMicrophoneSlash className="w-6 h-6" /> : <FaMicrophone className="w-6 h-6" />}
            </button>

            {/* Speaker */}
            <button
              onClick={toggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isSpeakerOn 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isSpeakerOn ? <FaVolumeUp className="w-6 h-6" /> : <FaVolumeMute className="w-6 h-6" />}
            </button>

            {/* Video Toggle (for video calls) */}
            {callState.callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isVideoOn 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isVideoOn ? <FaVideo className="w-6 h-6" /> : <FaVideoSlash className="w-6 h-6" />}
              </button>
            )}

            {/* End Call */}
            <button
              onClick={endCall}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <FaPhoneSlash className="w-6 h-6" />
            </button>
          </div>

          {/* Incoming Call Actions */}
          {callState.isCallIncoming && (
            <div className="flex justify-center space-x-6 mt-8">
              <button
                onClick={rejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <FaPhoneSlash className="w-8 h-8" />
              </button>
              
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <FaPhone className="w-8 h-8" />
              </button>
            </div>
          )}

          {/* Outgoing Call Actions */}
          {callState.isCallOutgoing && (
            <div className="text-center mt-8">
              <div className="flex justify-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Waiting for answer...
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceCallModal;
