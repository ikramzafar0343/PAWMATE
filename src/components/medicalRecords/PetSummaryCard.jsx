import React from 'react';
import { FaPaw } from 'react-icons/fa';

const PetSummaryCard = ({ pet }) => {
  if (!pet) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-gray-100 flex items-center justify-center">
          {pet.image ? (
            <img 
                src={pet.image} 
                alt={pet.name} 
                className="w-full h-full object-cover"
            />
          ) : (
            <FaPaw className="text-gray-400 text-3xl" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{pet.name}</h2>
          <p className="text-sm text-gray-600 mb-2">{pet.breed || 'Unknown Breed'} • {pet.gender || 'Unknown'} • {pet.age || 'Unknown Age'} • {pet.weight || 'Unknown Weight'}</p>
        </div>
      </div>

      
    </div>
  );
};

export default PetSummaryCard;
