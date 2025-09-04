import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaMicrophone, 
  FaMicrophoneSlash,
  FaTrash,
  FaCheck,
  FaTimes,
  FaChartLine
} from 'react-icons/fa';

const VoiceMessage = ({ 
  audioUrl, 
  duration, 
  isOwn = false, 
  timestamp,
  onDelete,
  onSend,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onSendRecording
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isRecordingPaused) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording, isRecordingPaused]);

  // Audio playback
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => setIsLoading(false);

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      const audioChunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      onStartRecording?.();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('لا يمكن الوصول للميكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      onStopRecording?.();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setAudioBlob(null);
    setRecordingTime(0);
    onCancelRecording?.();
  };

  const sendRecording = () => {
    if (audioBlob) {
      onSendRecording?.(audioBlob, recordingTime);
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Recording component
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-xs ${isOwn ? 'ml-auto' : 'mr-auto'}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex-1">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(recordingTime)}
                </span>
              </div>
              
              {/* Waveform visualization */}
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 20 + 4}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 rtl:space-x-reverse">
              <button
                onClick={stopRecording}
                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <FaStop size={12} />
              </button>
              <button
                onClick={cancelRecording}
                className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Recording preview
  if (audioBlob) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-xs ${isOwn ? 'ml-auto' : 'mr-auto'}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex-1">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <FaChartLine className="text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(recordingTime)}
                </span>
              </div>
              
              {/* Waveform preview */}
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full"
                    style={{
                      height: `${Math.random() * 20 + 4}px`
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 rtl:space-x-reverse">
              <button
                onClick={sendRecording}
                className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <FaCheck size={12} />
              </button>
              <button
                onClick={cancelRecording}
                className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Playback component
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`max-w-xs ${isOwn ? 'ml-auto' : 'mr-auto'}`}
    >
      <div className={`rounded-2xl p-4 shadow-lg ${
        isOwn 
          ? 'bg-blue-500 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isOwn 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : isPlaying ? (
              <FaPause size={14} />
            ) : (
              <FaPlay size={14} className="ml-0.5" />
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {formatTime(currentTime)}
              </span>
              <span className="text-sm opacity-75">
                {formatTime(duration)}
              </span>
            </div>
            
            {/* Progress bar */}
            <div 
              className="w-full h-1 bg-white/20 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{ 
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
          
          {isOwn && onDelete && (
            <button
              onClick={handleDelete}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <FaTrash size={12} />
            </button>
          )}
        </div>
        
        {timestamp && (
          <div className="text-xs opacity-75 mt-2 text-right">
            {new Date(timestamp).toLocaleTimeString('ar-EG', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
      
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}
    </motion.div>
  );
};

export default VoiceMessage;
