import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

const ConfidenceBanner = ({ confidence, date }) => {
  // Determine confidence level text based on percentage
  const getConfidenceLevel = (conf) => {
    if (conf >= 90) return 'Very High Confidence Detection';
    if (conf >= 70) return 'High Confidence Detection';
    if (conf >= 50) return 'Moderate Confidence Detection';
    return 'Low Confidence Detection';
  };

  // Determine banner color based on confidence
  const getBannerColor = (conf) => {
    if (conf >= 90) return 'bg-green-500';
    if (conf >= 70) return 'bg-blue-500';
    if (conf >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const bannerColor = getBannerColor(confidence);
  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div className={`${bannerColor} rounded-xl p-6 text-white shadow-sm relative overflow-hidden`}>
      <div className="relative z-10 flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-full">
          <FiCheckCircle size={32} className="text-white" />
        </div>
        <div>
          <div className="text-4xl font-bold mb-1">{confidence}%</div>
          <div className="text-white/90 font-medium mb-2">{confidenceLevel}</div>
          <div className="text-xs text-white/80">Analyzed on {date}</div>
        </div>
      </div>
      {/* Decorative background circle */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
};

export default ConfidenceBanner;
