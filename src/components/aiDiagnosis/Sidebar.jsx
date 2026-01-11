import React from 'react';
import { useParams } from 'react-router-dom';
import { BsShieldCheck, BsClipboardCheck } from 'react-icons/bs';
import { FiActivity, FiAlertCircle, FiChevronRight } from 'react-icons/fi';

const Sidebar = ({ diagnosisData, onNavigate }) => {
  const { scanId } = useParams();
  return (
    <div className="space-y-6">
      {/* Circular Confidence - Simplified implementation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
          {/* SVG Circle Progress */}
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#EFF6FF"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#3B82F6"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray="351.86"
              strokeDashoffset={351.86 * (1 - (diagnosisData.confidence / 100))}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-3xl font-bold text-gray-900">{diagnosisData.confidence}%</span>
        </div>
        <h3 className="font-bold text-gray-900 mb-1">AI Confidence Level</h3>
        <p className="text-xs text-gray-400">Based on 50,000+ trained disease patterns</p>
      </div>

      {/* Immediate Care Steps */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <BsShieldCheck className="text-blue-600" />
          <h3 className="font-bold text-gray-900">Immediate Care Steps</h3>
        </div>
        <ul className="space-y-4">
          {diagnosisData.careSteps.map((step, index) => (
            <li key={index} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-gray-700">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Suggested Treatments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiActivity className="text-blue-500" />
          <h3 className="font-bold text-gray-900">Suggested Treatments</h3>
        </div>
        <div className="space-y-3">
          {diagnosisData.treatments.map((treatment, index) => (
            <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-gray-400 shrink-0">
                {treatment.icon}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{treatment.name}</div>
                <div className="text-xs text-gray-500 mt-1">{treatment.dosage}</div>
                <div className="text-xs text-gray-400">{treatment.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BsClipboardCheck className="text-green-500" />
          <h3 className="font-bold text-gray-900">Recommended Actions</h3>
        </div>
        <div className="space-y-3">
          <button 
            onClick={() => {
              // Use scanId from URL params or 'latest' as fallback
              const currentScanId = scanId || 'latest';
              onNavigate && onNavigate('medicine', { scanId: currentScanId });
            }}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            View Suggested Medicines
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('appointment')}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            Book Vet Consultation
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('records')}
            className="w-full py-2.5 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 font-medium rounded-lg text-sm transition-colors"
          >
            Save Report to Records
          </button>
        </div>
      </div>

      
    </div>
  );
};

export default Sidebar;
