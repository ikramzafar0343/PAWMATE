import React, { useState, useEffect } from 'react';
import { FiX, FiDownload, FiFile, FiImage, FiFileText } from 'react-icons/fi';

const SharedFilesModal = ({ isOpen, onClose, messages }) => {
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    if (isOpen && messages) {
      // Extract all files and images from messages
      const files = messages.filter(msg => msg.type === 'file' || msg.type === 'image');
      setSharedFiles(files);
    }
  }, [isOpen, messages]);

  const handleDownload = (message) => {
    try {
      let url, fileName, blob;
      
      if (message.type === 'file') {
        if (message.file) {
          blob = message.file;
          fileName = message.content || 'download';
        } else if (message.fileData) {
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
        if (message.imageUrl) {
          if (message.imageUrl.startsWith('data:')) {
            fetch(message.imageUrl)
              .then(res => res.blob())
              .then(blobData => {
                url = URL.createObjectURL(blobData);
                fileName = message.content || 'image.png';
                downloadFile(url, fileName);
              })
              .catch(() => {
                downloadFromDataUrl(message.imageUrl, message.content || 'image.png');
              });
            return;
          } else {
            fetch(message.imageUrl)
              .then(res => res.blob())
              .then(blobData => {
                url = URL.createObjectURL(blobData);
                fileName = message.content || 'image.png';
                downloadFile(url, fileName);
              })
              .catch(() => {
                downloadFromDataUrl(message.imageUrl, message.content || 'image.png');
              });
            return;
          }
        }
      }
      
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

  const getFileIcon = (type) => {
    if (type === 'image') return <FiImage className="text-xl" />;
    if (type === 'file') return <FiFile className="text-xl" />;
    return <FiFileText className="text-xl" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Shared Files</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sharedFiles.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files shared yet</p>
              <p className="text-sm text-gray-400 mt-2">Files and images shared in this conversation will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedFiles.map((file) => (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {file.type === 'image' ? (
                    <div className="space-y-3">
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={file.imageUrl}
                          alt={file.content || 'Shared image'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{file.content || 'image.png'}</p>
                          <p className="text-xs text-gray-500">{file.time}</p>
                        </div>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors ml-2"
                          title="Download"
                        >
                          <FiDownload />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{file.content}</p>
                        <p className="text-xs text-gray-500">{file.fileSize} MB • {file.time}</p>
                      </div>
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Download"
                      >
                        <FiDownload />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {sharedFiles.length} {sharedFiles.length === 1 ? 'file' : 'files'} shared in this conversation
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedFilesModal;

