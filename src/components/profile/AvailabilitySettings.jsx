import React, { useState, useEffect, useRef } from 'react';
import { FiSave, FiClock } from 'react-icons/fi';
import { getCurrentUser, updateCurrentUser } from '../../utils/userStore';
import { 
  generateTimeSlots, 
  groupSlotsByPeriod, 
  availabilityToSlotIds, 
  slotIdsToAvailability 
} from '../../utils/timeSlots';

const AvailabilitySettings = ({ onNavigate }) => {
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  
  // Generate all time slots (48 slots for 30-minute intervals)
  const allSlots = generateTimeSlots(30);
  const groupedSlots = groupSlotsByPeriod(allSlots);

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.availability) {
          // Convert saved availability to slot IDs
          const slotIds = availabilityToSlotIds(user.availability);
          setSelectedSlots(slotIds);
        }
      } catch (error) {
        console.error('Error loading availability', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const handleSlotToggle = (slotId) => {
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slotId)) {
        newSet.delete(slotId);
      } else {
        newSet.add(slotId);
      }
      return newSet;
    });
  };

  const handleSlotMouseDown = (slotId, e) => {
    if (e.button !== 0) return; // Only handle left mouse button
    setIsDragging(true);
    dragStartRef.current = slotId;
    handleSlotToggle(slotId);
  };

  const handleSlotMouseEnter = (slotId) => {
    if (isDragging && dragStartRef.current) {
      // Select all slots between start and current
      const startIndex = allSlots.findIndex(s => s.id === dragStartRef.current);
      const currentIndex = allSlots.findIndex(s => s.id === slotId);
      
      if (startIndex !== -1 && currentIndex !== -1) {
        const minIndex = Math.min(startIndex, currentIndex);
        const maxIndex = Math.max(startIndex, currentIndex);
        
        setSelectedSlots(prev => {
          const newSet = new Set(prev);
          // Determine if we're selecting or deselecting based on start slot
          const startSelected = prev.has(dragStartRef.current);
          
          for (let i = minIndex; i <= maxIndex; i++) {
            if (startSelected) {
              newSet.add(allSlots[i].id);
            } else {
              newSet.delete(allSlots[i].id);
            }
          }
          return newSet;
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  const handleSelectAll = (periodSlots) => {
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      const allSelected = periodSlots.every(slot => prev.has(slot.id));
      
      periodSlots.forEach(slot => {
        if (allSelected) {
          newSet.delete(slot.id);
        } else {
          newSet.add(slot.id);
        }
      });
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert selected slot IDs to availability format
      const availability = slotIdsToAvailability(selectedSlots, allSlots);
      
      await updateCurrentUser({ availability });
      
      alert('Availability updated successfully!');
      window.dispatchEvent(new Event('userProfileUpdate'));
    } catch (error) {
      console.error('Error saving availability', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading availability settings...</p>
        </div>
      </div>
    );
  }

  const periodLabels = {
    'Early Morning': { color: 'bg-indigo-50 border-indigo-200', textColor: 'text-indigo-700' },
    'Morning': { color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
    'Afternoon': { color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
    'Evening/Night': { color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FiClock className="text-blue-600 text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Availability (Time Slots)</h2>
          <p className="text-sm text-gray-500">Select your available consultation time slots (30-minute intervals)</p>
        </div>
      </div>

      <div className="space-y-6 mb-6">
        {Object.entries(groupedSlots).map(([period, slots]) => {
          const periodInfo = periodLabels[period] || { color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700' };
          const allSelected = slots.every(slot => selectedSlots.has(slot.id));
          const someSelected = slots.some(slot => selectedSlots.has(slot.id));
          
          return (
            <div key={period} className={`${periodInfo.color} border-2 rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold ${periodInfo.textColor}`}>{period}</h3>
                <button
                  onClick={() => handleSelectAll(slots)}
                  className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                    allSelected 
                      ? 'bg-white text-gray-700 hover:bg-gray-50' 
                      : 'bg-white/70 text-gray-600 hover:bg-white'
                  }`}
                  aria-label={`${allSelected ? 'Deselect' : 'Select'} all ${period} slots`}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlots.has(slot.id);
                  return (
                    <label
                      key={slot.id}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-blue-600 text-white border-2 border-blue-700' 
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }
                        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1
                      `}
                      onMouseDown={(e) => handleSlotMouseDown(slot.id, e)}
                      onMouseEnter={() => handleSlotMouseEnter(slot.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSlotToggle(slot.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        aria-label={`Select time slot ${slot.display}`}
                      />
                      <span className="text-xs font-medium select-none">{slot.display}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">
          Selected: <strong className="text-gray-900">{selectedSlots.size}</strong> of {allSlots.length} slots
        </span>
        <button
          onClick={() => {
            if (selectedSlots.size === allSlots.length) {
              setSelectedSlots(new Set());
            } else {
              setSelectedSlots(new Set(allSlots.map(s => s.id)));
            }
          }}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
        >
          {selectedSlots.size === allSlots.length ? 'Clear All' : 'Select All Day'}
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || selectedSlots.size === 0}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Save availability changes"
      >
        <FiSave />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

export default AvailabilitySettings;
