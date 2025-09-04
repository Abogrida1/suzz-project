import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaStop, 
  FaPlay, 
  FaPause,
  FaTrash,
  FaCheck,
  FaTimes,
  FaWaveformLines
} from 'react-icons/fa';

const VoiceRecorder = ({ onSend, onCancel, className = '' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Generate waveform data
  const generateWaveform = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const newWaveform = Array.from(dataArrayRef.current).slice(0, 20);
      setWaveformData(newWaveform);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Set up audio context for waveform
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      source.connect(analyserRef.current);

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const audioChunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        generateWaveform();
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('لا يمكن الوصول للميكروفون. يرجى السماح بالوصول للميكروفون.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        intervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
          generateWaveform();
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }
  };

  // Play recorded audio
  const playAudio = () => {
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

  // Send recording
  const sendRecording = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
      resetRecorder();
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    resetRecorder();
    onCancel?.();
  };

  // Reset recorder
  const resetRecorder = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setWaveformData([]);
    setIsPlaying(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className={`voice-recorder ${className}`}>
      <AnimatePresence mode="wait">
        {!isRecording && !audioBlob && (
          <motion.div
            key="record-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center"
          >
            <button
              onClick={startRecording}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <FaMicrophone size={24} />
            </button>
          </motion.div>
        )}

        {isRecording && (
          <motion.div
            key="recording-controls"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex-1">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                
                {/* Waveform visualization */}
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {waveformData.length > 0 ? (
                    waveformData.map((value, index) => (
                      <div
                        key={index}
                        className="w-1 bg-blue-500 rounded-full transition-all duration-100"
                        style={{
                          height: `${(value / 255) * 20 + 2}px`
                        }}
                      />
                    ))
                  ) : (
                    [...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gray-300 rounded-full"
                        style={{
                          height: `${Math.random() * 10 + 2}px`
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={togglePause}
                  className="w-10 h-10 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPaused ? <FaPlay size={14} /> : <FaPause size={14} />}
                </button>
                <button
                  onClick={stopRecording}
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <FaStop size={14} />
                </button>
                <button
                  onClick={cancelRecording}
                  className="w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {audioBlob && (
          <motion.div
            key="playback-controls"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={playAudio}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <FaWaveformLines className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                
                {/* Static waveform for playback */}
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-500 rounded-full"
                      style={{
                        height: `${Math.random() * 15 + 3}px`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={sendRecording}
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <FaCheck size={14} />
                </button>
                <button
                  onClick={cancelRecording}
                  className="w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>
            
            {/* Hidden audio element */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRecorder;
