import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [callState, setCallState] = useState({
    isInCall: false,
    isCallActive: false,
    isCallIncoming: false,
    isCallOutgoing: false,
    callType: null, // 'voice' or 'video'
    callWith: null,
    callId: null
  });

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const callDurationIntervalRef = useRef(null);

  const { socket } = useSocket();
  const { user } = useAuth();

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize socket listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    socket.on('call_incoming', handleIncomingCall);
    
    // Call accepted
    socket.on('call_accepted', handleCallAccepted);
    
    // Call rejected
    socket.on('call_rejected', handleCallRejected);
    
    // Call ended
    socket.on('call_ended', handleCallEnded);
    
    // ICE candidate
    socket.on('ice_candidate', handleIceCandidate);
    
    // Offer
    socket.on('offer', handleOffer);
    
    // Answer
    socket.on('answer', handleAnswer);

    return () => {
      socket.off('call_incoming');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('ice_candidate');
      socket.off('offer');
      socket.off('answer');
    };
  }, [socket]);

  // Update call duration
  useEffect(() => {
    if (callState.isCallActive && callStartTimeRef.current) {
      callDurationIntervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }, 1000);
    } else {
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
        callDurationIntervalRef.current = null;
      }
    }

    return () => {
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
    };
  }, [callState.isCallActive]);

  const handleIncomingCall = (data) => {
    setCallState({
      isInCall: true,
      isCallIncoming: true,
      isCallOutgoing: false,
      isCallActive: false,
      callType: data.callType,
      callWith: data.from,
      callId: data.callId
    });
    
    toast.success(`Incoming ${data.callType} call from ${data.from.displayName}`);
  };

  const handleCallAccepted = async (data) => {
    setCallState(prev => ({
      ...prev,
      isCallIncoming: false,
      isCallOutgoing: false,
      isCallActive: true
    }));

    callStartTimeRef.current = Date.now();
    
    // Start local stream
    await startLocalStream(data.callType);
    
    // Create peer connection
    await createPeerConnection();
    
    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStream);
      });
    }
  };

  const handleCallRejected = (data) => {
    setCallState({
      isInCall: false,
      isCallIncoming: false,
      isCallOutgoing: false,
      isCallActive: false,
      callType: null,
      callWith: null,
      callId: null
    });
    
    toast.error('Call rejected');
    stopLocalStream();
  };

  const handleCallEnded = (data) => {
    setCallState({
      isInCall: false,
      isCallIncoming: false,
      isCallOutgoing: false,
      isCallActive: false,
      callType: null,
      callWith: null,
      callId: null
    });
    
    setCallDuration(0);
    stopLocalStream();
    stopRemoteStream();
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    toast.success('Call ended');
  };

  const handleIceCandidate = async (data) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    }
  };

  const handleOffer = async (data) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(data.offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('answer', {
        callId: data.callId,
        answer: answer,
        to: data.from
      });
    }
  };

  const handleAnswer = async (data) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
    }
  };

  const startLocalStream = async (callType) => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video' ? true : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Unable to access camera/microphone');
      throw error;
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  const stopRemoteStream = () => {
    setRemoteStream(null);
  };

  const createPeerConnection = async () => {
    peerConnectionRef.current = new RTCPeerConnection(rtcConfig);

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          callId: callState.callId,
          candidate: event.candidate,
          to: callState.callWith
        });
      }
    };

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    return peerConnectionRef.current;
  };

  const initiateCall = async (callWith, callType = 'voice') => {
    try {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setCallState({
        isInCall: true,
        isCallIncoming: false,
        isCallOutgoing: true,
        isCallActive: false,
        callType,
        callWith,
        callId
      });

      // Start local stream
      await startLocalStream(callType);
      
      // Create peer connection
      await createPeerConnection();
      
      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, localStream);
        });
      }

      // Create offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      // Send call invitation
      socket.emit('call_invite', {
        callId,
        callType,
        offer,
        from: user,
        to: callWith
      });

      toast.success(`Calling ${callWith.displayName}...`);
      
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to start call');
      endCall();
    }
  };

  const acceptCall = async () => {
    try {
      // Start local stream
      await startLocalStream(callState.callType);
      
      // Create peer connection
      await createPeerConnection();
      
      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, localStream);
        });
      }

      // Send call acceptance
      socket.emit('call_accept', {
        callId: callState.callId,
        from: user,
        to: callState.callWith
      });

      setCallState(prev => ({
        ...prev,
        isCallIncoming: false,
        isCallActive: true
      }));

      callStartTimeRef.current = Date.now();
      
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
      rejectCall();
    }
  };

  const rejectCall = () => {
    socket.emit('call_reject', {
      callId: callState.callId,
      from: user,
      to: callState.callWith
    });

    setCallState({
      isInCall: false,
      isCallIncoming: false,
      isCallOutgoing: false,
      isCallActive: false,
      callType: null,
      callWith: null,
      callId: null
    });

    stopLocalStream();
  };

  const endCall = () => {
    socket.emit('call_end', {
      callId: callState.callId,
      from: user,
      to: callState.callWith
    });

    setCallState({
      isInCall: false,
      isCallIncoming: false,
      isCallOutgoing: false,
      isCallActive: false,
      callType: null,
      callWith: null,
      callId: null
    });

    setCallDuration(0);
    stopLocalStream();
    stopRemoteStream();
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    callState,
    localStream,
    remoteStream,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    formatCallDuration
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};
