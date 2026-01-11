import React from 'react';

const ConditionDetails = ({ condition, severity, description, severityColor = 'yellow' }) => {
  // Map severity color to Tailwind classes
  const severityColorMap = {
    'red': 'bg-red-50 text-red-700 border-red-100',
    'yellow': 'bg-yellow-50 text-yellow-700 border-yellow-100',
    'green': 'bg-green-50 text-green-700 border-green-100',
    'orange': 'bg-orange-50 text-orange-700 border-orange-100'
  };
  
  const colorClass = severityColorMap[severityColor] || severityColorMap['yellow'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3">Probable Condition: {condition}</h2>
      <span className={`inline-block ${colorClass} text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide border`}>
        {severity}
      </span>
      <p className="text-gray-600 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default ConditionDetails;
