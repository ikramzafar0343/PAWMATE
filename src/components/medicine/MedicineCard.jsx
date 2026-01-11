import React from 'react';
import { FiShoppingCart, FiInfo, FiCheck } from 'react-icons/fi';
import { addToCart } from '../../utils/cartStore';
import { BiMicrochip } from 'react-icons/bi'; // Using BiMicrochip as AI icon alternative if needed, or stick to Fi

const MedicineCard = ({ medicine }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="relative h-48 bg-gray-100">
        <img 
          src={medicine.image} 
          alt={medicine.name} 
          className="w-full h-full object-cover"
        />
        {medicine.recommendedBy === 'AI' && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <BiMicrochip className="text-sm" />
            AI Suggested
          </div>
        )}
        {medicine.recommendedBy === 'Vet' && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <FiCheck className="text-sm" />
            Vet Recommended
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{medicine.name}</h3>
          <p className="text-sm text-gray-500">{medicine.category}</p>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
          {medicine.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">{medicine.price}</span>
          <button 
            onClick={() => addToCart({ id: medicine.id, name: medicine.name, price: medicine.price, image: medicine.image })}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            aria-label="Add to cart"
          >
            <FiShoppingCart />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicineCard;
