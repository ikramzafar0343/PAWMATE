import React, { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';

const RecordActionMenu = ({ onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <FiMoreVertical size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
          <button
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FiEdit2 size={14} />
            Edit Record
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <FiTrash2 size={14} />
            Delete Record
          </button>
        </div>
      )}
    </div>
  );
};

export default RecordActionMenu;
