import React from 'react';

const VaccinationHero = ({ onNavigate, stats, pet }) => {
  const avatarSrc = pet?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pet?.name || 'Pet')}&background=random`;
  const petName = pet?.name || 'Pet';
  const breed = pet?.breed || 'Unknown Breed';
  const gender = pet?.gender || 'Unknown';
  const age = pet?.age || 'Unknown Age';
  const weight = pet?.weight || 'Unknown Weight';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative cursor-pointer" onClick={() => onNavigate && onNavigate('petDetails', pet)}>
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-50 shadow-sm">
            <img src={avatarSrc} alt={petName} className="w-full h-full object-cover" />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onNavigate && onNavigate('petDetails', pet)}
          >
            {petName}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{breed} • {gender} • {age} • {weight}</p>
        </div>

        <div className="flex gap-8 md:border-l md:border-gray-100 md:pl-8">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Total Vaccines</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Up to Date</p>
            <p className="text-2xl font-bold text-emerald-500">{stats?.completed || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Overdue</p>
            <p className={`text-2xl font-bold ${stats?.overdue > 0 ? 'text-red-500' : 'text-gray-900'}`}>{stats?.overdue || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationHero;
