import React, { useState, useEffect } from 'react';
import { FiVideo, FiMessageSquare, FiMapPin } from 'react-icons/fi';

const ConsultationType = ({ vet, selectedType, onSelect }) => {
  const [internalSelected, setInternalSelected] = useState('video');
  const currentSelected = selectedType || internalSelected;

  // Default fees
  const defaultFees = { video: 45, chat: 30, visit: 60 };
  const fees = vet?.consultationFees || defaultFees;

  const types = [
    {
      id: 'video',
      icon: FiVideo,
      title: 'Video Consultation',
      description: 'Connect with the vet via video call',
      price: fees.video || defaultFees.video
    },
    {
      id: 'chat',
      icon: FiMessageSquare,
      title: 'Chat Consultation',
      description: 'Text-based consultation with media sharing',
      price: fees.chat || defaultFees.chat
    },
    {
      id: 'visit',
      icon: FiMapPin,
      title: 'In-Clinic Visit',
      description: 'Visit the clinic physically',
      price: fees.visit || defaultFees.visit
    }
  ];

  // Update parent when vet data (fees) changes
  useEffect(() => {
    if (onSelect) {
       const type = types.find(t => t.id === currentSelected);
       if (type) {
         onSelect(type.id, type.price);
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vet]);

  const handleTypeClick = (type) => {
    if (onSelect) {
      onSelect(type.id, type.price);
    } else {
      setInternalSelected(type.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 text-lg mb-6">Consultation Type</h3>
      <div className="space-y-3">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeClick(type)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
              currentSelected === type.id
                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                : 'bg-white border-gray-200 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                currentSelected === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                <type.icon className="text-xl" />
              </div>
              <div>
                <h4 className={`font-bold ${currentSelected === type.id ? 'text-blue-900' : 'text-gray-900'}`}>
                  {type.title}
                </h4>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
            </div>
            <span className={`font-bold ${currentSelected === type.id ? 'text-blue-700' : 'text-gray-900'}`}>
              ${type.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConsultationType;
