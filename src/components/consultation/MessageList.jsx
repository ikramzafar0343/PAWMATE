import React from 'react';
import { FiFileText, FiDownload, FiImage, FiFile } from 'react-icons/fi';

const MessageList = ({ messages }) => {
  const handleDownload = (message) => {
    try {
      let url, fileName, blob;
      
      if (message.type === 'file') {
        // Handle file download
        if (message.file) {
          // If file object exists, use it directly
          blob = message.file;
          fileName = message.content || 'download';
        } else if (message.fileUrl) {
          // If fileUrl exists, fetch and convert to blob
          fetch(message.fileUrl)
            .then(res => res.blob())
            .then(blobData => {
              url = URL.createObjectURL(blobData);
              fileName = message.content || 'download';
              downloadFile(url, fileName);
            })
            .catch(err => {
              console.error('Error downloading file:', err);
              alert('Failed to download file. Please try again.');
            });
          return;
        } else if (message.fileData) {
          // If base64 data exists, convert to blob
          const byteCharacters = atob(message.fileData.split(',')[1] || message.fileData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: message.fileType || 'application/octet-stream' });
          fileName = message.content || 'download';
        } else {
          alert('File data not available for download.');
          return;
        }
      } else if (message.type === 'image') {
        // Handle image download
        if (message.imageUrl) {
          // Convert data URL or blob URL to downloadable format
          if (message.imageUrl.startsWith('data:')) {
            // Data URL - convert to blob
            const response = fetch(message.imageUrl);
            response.then(res => res.blob())
              .then(blobData => {
                url = URL.createObjectURL(blobData);
                fileName = message.content || 'image.png';
                downloadFile(url, fileName);
              })
              .catch(err => {
                console.error('Error downloading image:', err);
                // Fallback: direct download from data URL
                downloadFromDataUrl(message.imageUrl, message.content || 'image.png');
              });
            return;
          } else {
            // Blob URL or regular URL
            fetch(message.imageUrl)
              .then(res => res.blob())
              .then(blobData => {
                url = URL.createObjectURL(blobData);
                fileName = message.content || 'image.png';
                downloadFile(url, fileName);
              })
              .catch(err => {
                console.error('Error downloading image:', err);
                // Fallback: try direct link
                downloadFromDataUrl(message.imageUrl, message.content || 'image.png');
              });
            return;
          }
        } else {
          alert('Image data not available for download.');
          return;
        }
      }
      
      // Download file blob
      if (blob) {
        url = URL.createObjectURL(blob);
        downloadFile(url, fileName);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const downloadFile = (url, fileName) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup after a short delay
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const downloadFromDataUrl = (dataUrl, fileName) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
      <div className="text-center text-xs text-gray-400 my-4">Today, 10:30 AM</div>
      
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.isMe ? 'ml-auto flex-row-reverse' : ''}`}
        >
          {!msg.isMe && (
            <img 
              src={msg.senderImage} 
              alt={msg.sender} 
              className="w-8 h-8 rounded-full object-cover self-end mb-1"
            />
          )}
          
          <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            <div 
              className={`rounded-2xl shadow-sm text-sm ${
                msg.isMe 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              } ${msg.type === 'image' ? 'p-0 overflow-hidden max-w-sm' : 'p-3.5'}`}
            >
              {msg.type === 'text' && <p>{msg.content}</p>}
              
              {msg.type === 'image' && (
                <div className="flex flex-col">
                  <div className="relative group">
                    {msg.imageUrl ? (
                      <img 
                        src={msg.imageUrl} 
                        alt={msg.content || 'Shared image'} 
                        className="w-full max-w-sm h-auto object-cover"
                      />
                    ) : (
                      <div className="w-full max-w-sm h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        Image not available
                      </div>
                    )}
                    <button
                      onClick={() => handleDownload(msg)}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Download image"
                    >
                      <FiDownload className="text-sm" />
                    </button>
                  </div>
                  {msg.content && (
                    <div className="px-3 py-2 flex items-center justify-between">
                      <p className="text-xs opacity-90">{msg.content}</p>
                      <button
                        onClick={() => handleDownload(msg)}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        title="Download image"
                      >
                        <FiDownload className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {msg.type === 'file' && (
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className={`p-2 rounded-lg ${msg.isMe ? 'bg-white/20' : 'bg-blue-50'}`}>
                    <FiFile className={`text-xl ${msg.isMe ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${msg.isMe ? 'text-white' : 'text-gray-900'}`}>
                      {msg.content}
                    </p>
                    <p className={`text-xs ${msg.isMe ? 'opacity-80 text-white' : 'text-gray-500'}`}>
                      {msg.fileSize} MB
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDownload(msg)}
                    className={`p-2 rounded-full transition-colors ${
                      msg.isMe 
                        ? 'hover:bg-white/20 text-white' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="Download file"
                  >
                    <FiDownload />
                  </button>
                </div>
              )}
              
              {msg.type === 'prescription' && (
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FiFileText className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Prescription.pdf</p>
                    <p className="text-xs opacity-80">2.4 MB</p>
                  </div>
                  <button className="p-2 hover:bg-white/20 rounded-full">
                    <FiDownload />
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
