import React, { useState, useEffect, useRef } from 'react';
import { FiMaximize2, FiDownload } from 'react-icons/fi';
import API from '../../api/client';

const ImageAnalysis = ({ imageUrl, detectionRegions = [] }) => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  // Get full image URL (handle relative paths)
  const getImageUrl = () => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If relative path, construct full URL
    // Images are served from backend/uploads/, not /api/uploads/
    const apiBaseURL = API.defaults.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove /api from base URL to get server root
    const serverBaseURL = apiBaseURL.replace('/api', '');
    return `${serverBaseURL}${imageUrl}`;
  };

  const fullImageUrl = getImageUrl();

  const handleDownload = async () => {
    if (!fullImageUrl) return;
    
    try {
      const res = await fetch(fullImageUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('Failed to fetch image');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai_analyzed_image.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(fullImageUrl, '_blank');
    }
  };

  const handleMaximize = () => {
    if (fullImageUrl) {
      window.open(fullImageUrl, '_blank');
    }
  };

  // Calculate detection region positions based on image dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (imageRef.current && containerRef.current) {
        const img = imageRef.current;
        const container = containerRef.current;
        
        // Get actual displayed image dimensions
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Calculate aspect ratio
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let displayWidth, displayHeight, offsetX = 0, offsetY = 0;
        
        if (imgAspect > containerAspect) {
          // Image is wider - fit to width
          displayWidth = containerWidth;
          displayHeight = containerWidth / imgAspect;
          offsetY = (containerHeight - displayHeight) / 2;
        } else {
          // Image is taller - fit to height
          displayHeight = containerHeight;
          displayWidth = containerHeight * imgAspect;
          offsetX = (containerWidth - displayWidth) / 2;
        }
        
        setImageDimensions({
          width: displayWidth,
          height: displayHeight,
          offsetX,
          offsetY,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
      }
    };

    if (imageRef.current) {
      if (imageRef.current.complete) {
        updateDimensions();
      } else {
        imageRef.current.addEventListener('load', updateDimensions);
      }
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (imageRef.current) {
        imageRef.current.removeEventListener('load', updateDimensions);
      }
    };
  }, [fullImageUrl, detectionRegions]);

  if (!fullImageUrl) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Uploaded Image Analysis</h3>
        <div className="relative rounded-lg overflow-hidden h-64 w-full bg-gray-100 flex items-center justify-center">
          <p className="text-gray-400">No image available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">Uploaded Image Analysis</h3>
        <div className="flex items-center gap-2 text-gray-500">
          <button 
            onClick={handleMaximize}
            className="p-2 rounded-md hover:bg-gray-100 hover:text-gray-700 focus:outline-none transition-colors"
            title="Maximize"
          >
            <FiMaximize2 className="cursor-pointer" />
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 rounded-md hover:bg-gray-100 hover:text-gray-700 focus:outline-none transition-colors"
            title="Download"
          >
            <FiDownload className="cursor-pointer" />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="relative rounded-lg overflow-hidden h-64 w-full bg-gray-100">
        <img 
          ref={imageRef}
          src={fullImageUrl} 
          alt="AI Analyzed Pet Image" 
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Image load error:', e);
            e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
          }}
        />
        <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg z-20">
          AI Analyzed
        </div>
        
        {/* Detection Regions Overlay */}
        {detectionRegions && detectionRegions.length > 0 && imageDimensions.width > 0 && (
          <>
            {detectionRegions.map((region, index) => {
              // Calculate pixel positions from normalized coordinates
              const x = region.normalized 
                ? imageDimensions.offsetX + (region.x * imageDimensions.width)
                : imageDimensions.offsetX + region.x;
              const y = region.normalized
                ? imageDimensions.offsetY + (region.y * imageDimensions.height)
                : imageDimensions.offsetY + region.y;
              const width = region.normalized
                ? region.width * imageDimensions.width
                : region.width;
              const height = region.normalized
                ? region.height * imageDimensions.height
                : region.height;
              
              return (
                <div
                  key={index}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                  }}
                >
                  {/* Bounding box */}
                  <div className="w-full h-full border-2 border-red-500 rounded-lg shadow-lg bg-red-500/20">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-2 border-red-500 bg-white rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-red-500 bg-white rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-2 border-red-500 bg-white rounded-full"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-red-500 bg-white rounded-full"></div>
                  </div>
                  {/* Label */}
                  <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                    Detected Area
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
