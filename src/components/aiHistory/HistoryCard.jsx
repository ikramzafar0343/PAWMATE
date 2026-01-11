import React from 'react';
import { FiClock, FiCalendar, FiTrash2 } from 'react-icons/fi';

const HistoryCard = ({ data, onNavigate, onDelete }) => {
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-600';
      case 'moderate':
        return 'bg-amber-100 text-amber-600';
      case 'low':
        return 'bg-emerald-100 text-emerald-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getProgressBarColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'moderate':
        return 'bg-amber-500';
      case 'low':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow relative">
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this scan history?')) {
              onDelete(data);
            }
          }}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
          title="Delete History"
        >
          <FiTrash2 size={18} />
        </button>
      )}

      {/* Image */}
      <div className="w-full md:w-24 h-24 flex-shrink-0">
        <img 
          src={data.image} 
          alt={data.title} 
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Content */}
      <div className="flex-1 w-full">
        <div className="flex flex-wrap items-center gap-3 mb-1 pr-8">
          <h3 className="text-lg font-bold text-gray-900">{data.title}</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getSeverityColor(data.severity)}`}>
            {data.severity}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3">
          {data.petName} - <span className="text-gray-500">{data.petType}</span>
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <FiCalendar />
            {data.date}
          </div>
          <div className="flex items-center gap-1.5">
            <FiClock />
            {data.time}
          </div>
        </div>
      </div>

      {/* Confidence & Action */}
      <div className="w-full md:w-48 flex flex-col items-end gap-2">
        <div className="w-full flex justify-between items-end mb-1">
          <span className={`text-2xl font-bold ${getSeverityColor(data.severity).split(' ')[1]}`}>
            {data.confidence}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${getProgressBarColor(data.severity)}`} 
            style={{ width: `${data.confidence}%` }}
          ></div>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('diagnosis', { scanId: data.id })}
          className="mt-2 px-6 py-2 border border-blue-500 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors w-full md:w-auto"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default HistoryCard;
