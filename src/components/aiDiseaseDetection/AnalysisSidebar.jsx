import React from 'react';
import { FiChevronDown, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import AnalysisProgress from './AnalysisProgress';

const AnalysisSidebar = ({ previousScans, onNavigate, pets, selectedPetId, onPetSelect, isAnalyzing = false, analysisProgress = 0, currentStep = 0 }) => {
  const selectedPet = pets.find(p => (p.id || p._id) === selectedPetId) || pets[0];
  
  return (
    <div className="space-y-6">
      {/* Select Pet */}
      {selectedPet && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Pet</label>
          <div className="relative">
             <select 
                className="w-full appearance-none border border-gray-200 rounded-lg p-3 pl-12 bg-white hover:border-blue-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedPetId || ''}
                onChange={(e) => onPetSelect && onPetSelect(e.target.value)}
                disabled={isAnalyzing}
             >
                {pets.map(pet => (
                    <option key={pet.id || pet._id} value={pet.id || pet._id}>
                        {pet.name} ({pet.breed})
                    </option>
                ))}
             </select>
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                 <img src={selectedPet.image || selectedPet.imageUrl || 'https://placehold.co/100x100/d97706/ffffff?text=Pet'} alt={selectedPet.name} className="w-6 h-6 rounded-full object-cover" />
             </div>
             <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* AI Analysis Progress - Show only when analyzing */}
      {isAnalyzing && (
        <AnalysisProgress progress={analysisProgress} currentStep={currentStep} />
      )}

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiInfo className="text-blue-500" />
          <h3 className="font-bold text-gray-900">How AI Analysis Works</h3>
        </div>
        <ul className="space-y-3">
          {[
            'Analyzes visual symptoms and patterns',
            'Compares with disease database',
            'Provides confidence-rated results',
            'Suggests next steps and treatments'
          ].map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
              <span className="text-sm text-gray-500 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Best Results Warning */}
      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
        <div className="flex items-center gap-2 mb-4">
          <FiAlertTriangle className="text-yellow-600" />
          <h3 className="font-bold text-gray-900">For Best Results</h3>
        </div>
        <ul className="space-y-3">
          {[
            'Upload clear, well-lit photos',
            'Include multiple angles if possible',
            'Describe symptoms accurately',
            'Note any behavioral changes'
          ].map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></div>
              <span className="text-xs font-medium text-gray-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Previous Scans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Previous Scans</h3>
          <button 
            onClick={() => onNavigate && onNavigate('history')}
            className="text-xs text-blue-600 font-medium hover:text-blue-700"
          >
            View All
          </button>
        </div>
        {previousScans.length > 0 ? (
            <div className="space-y-4">
            {previousScans.map((scan, index) => (
                <div 
                key={index} 
                className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors"
                onClick={() => onNavigate && onNavigate('diagnosis', { scanId: scan.id || 'latest' })}
                >
                <div className="flex items-center gap-3">
                    <img 
                      src={scan.img} 
                      alt={scan.petName || "Scan"} 
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100/d97706/ffffff?text=Pet';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-400">{scan.date}</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{scan.condition}</div>
                      {scan.petName && (
                        <div className="text-[10px] text-gray-500 truncate">{scan.petName}</div>
                      )}
                      <div className="text-[10px] text-blue-500 font-medium">{scan.confidence}</div>
                    </div>
                </div>
                <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-gray-400 text-sm text-center py-4">No previous scans found.</div>
        )}
      </div>
    </div>
  );
};

export default AnalysisSidebar;
