import React, { useState, useRef } from 'react';
import { FaCamera, FaTimes, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ProfilePictureUpload = ({ 
  currentAvatar, 
  onUpload, 
  onRemove, 
  size = 'large',
  className = '' 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    xlarge: 'w-40 h-40'
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صالح');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setShowOptions(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files[0]) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', fileInputRef.current.files[0]);

      const response = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onUpload(data.avatarUrl);
        setPreview(null);
        setShowOptions(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('فشل في رفع الصورة');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setShowOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    try {
      const response = await fetch('/api/users/remove-avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onRemove();
      } else {
        throw new Error('فشل في حذف الصورة');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('حدث خطأ أثناء حذف الصورة');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Profile Picture */}
      <div className={`${sizeClasses[size]} relative group cursor-pointer`}>
        <div className="w-full h-full rounded-full overflow-hidden shadow-lg border-4 border-white dark:border-gray-800">
          <img
            src={preview || currentAvatar || `https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <FaCamera className="text-white text-xl" />
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors"
        >
          <FaCamera size={12} />
        </button>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Options Modal */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                تأكيد رفع الصورة
              </h3>
              
              {/* Preview */}
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 rtl:space-x-reverse">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaTimes className="inline ml-2" />
                  إلغاء
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    <>
                      <FaCheck className="inline ml-2" />
                      رفع
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Button (if avatar exists) */}
      {currentAvatar && !preview && (
        <button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
        >
          <FaTimes size={10} />
        </button>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
