import React, { useState, useRef } from 'react';
import { FiSend, FiPaperclip, FiImage } from 'react-icons/fi';

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage({
        content: message.trim(),
        type: 'text'
      });
      setMessage('');
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
      
      // Convert file to base64 for persistence
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage({
          content: file.name,
          file: file, // Keep original file object for immediate download
          fileData: reader.result, // Base64 for persistence
          fileType: file.type,
          fileSize: fileSize,
          type: 'file'
        });
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        e.target.value = '';
        return;
      }
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage({
          content: file.name,
          imageUrl: reader.result,
          file: file,
          type: 'image'
        });
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-4 max-w-4xl mx-auto">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
        />
        <input 
            type="file" 
            accept="image/*" 
            ref={imageInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
        />
        
        <button 
          type="button"
          onClick={handleFileClick}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Attach file"
        >
          <FiPaperclip className="text-xl" />
        </button>
        <button 
          type="button"
          onClick={handleImageClick}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
          title="Attach image"
        >
          <FiImage className="text-xl" />
        </button>
        
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..." 
            className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!message.trim()}
          >
            <FiSend className="text-sm" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
