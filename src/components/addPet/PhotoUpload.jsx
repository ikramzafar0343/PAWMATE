import React, { useRef, useState, useEffect } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';
import { FaPaw } from 'react-icons/fa';

const PhotoUpload = ({ onImageChange, initialImage = null }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(initialImage || null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPreview(initialImage);
  }, [initialImage]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG)');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPreview(base64String);
      if (onImageChange) {
        onImageChange(base64String);
      }
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (onImageChange) {
      onImageChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="relative group">
        <div
          onClick={handleClick}
          className="relative w-32 h-32 rounded-full bg-blue-50 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer overflow-hidden"
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Pet preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <FiCamera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
              </div>
            </>
          ) : (
            <>
              <FiCamera size={32} className="mb-2" />
              <span className="text-xs font-medium text-center px-2">Upload Pet Photo</span>
            </>
          )}
        </div>
        
        {preview && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            title="Remove photo"
          >
            <FiX size={14} />
          </button>
        )}
      </div>
      
      <div className="text-center mt-2">
        <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;
