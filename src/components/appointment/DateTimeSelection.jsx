import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FiCalendar, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getBookedSlots, isDateFullyBooked, ALL_TIME_SLOTS } from '../../utils/appointmentStore';

const DateTimeSelection = ({ selectedVet, onDateTimeSelect }) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1); // Start at the beginning of the current month
    return d;
  });
 
  const generateDates = (currentDate) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      // Use YYYY-MM-DD format for consistency with backend and DB
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      // Note: isDateFullyBooked is async, but we can't await in generateDates
      // For now, we'll mark as available and let the slot filtering handle it
      const isFull = false; // Will be checked asynchronously when slots load
      const today = new Date();
      today.setHours(0,0,0,0);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      let isTodayFullyPassed = false;
      if (isToday) {
        const now = new Date();
        const hasFutureSlots = ALL_TIME_SLOTS.some(slot => {
            const [time, period] = slot.split(' ');
            const [hours, minutes] = time.split(':');
            let slotHour = parseInt(hours);
            if (period === 'PM' && slotHour !== 12) slotHour += 12;
            if (period === 'AM' && slotHour === 12) slotHour = 0;
            const slotDate = new Date();
            slotDate.setHours(slotHour, parseInt(minutes), 0, 0);
            return slotDate > now;
        });
        isTodayFullyPassed = !hasFutureSlots;
      }
      dates.push({
        fullDate: date,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        dateStr: dateStr,
        available: !isFull && !isPast && !isTodayFullyPassed,
        isToday: isToday,
        isPast: isPast
      });
    }
    return dates;
  };
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    const initDates = generateDates(d);
    const firstAvailable = initDates.find(x => x.available);
    return firstAvailable ? firstAvailable.dateStr : '';
  });
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState(ALL_TIME_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12Hour) => {
    const [time, period] = time12Hour.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    const mins = parseInt(minutes) || 0;
    
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    return `${String(hour24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Helper function to check if a time slot matches vet's availability
  const isSlotInAvailability = (slot, vetAvailability, selectedDate) => {
    if (!vetAvailability || !Array.isArray(vetAvailability) || vetAvailability.length === 0) {
      return true; // If no availability set, show all slots
    }

    // Convert slot from 12-hour format (e.g., "9:00 AM") to 24-hour format (e.g., "09:00")
    const slotTime24 = convertTo24Hour(slot);
    
    // Parse hour for legacy format checking
    const [time, period] = slot.split(' ');
    const [hours] = time.split(':');
    let slotHour = parseInt(hours);
    if (period === 'PM' && slotHour !== 12) slotHour += 12;
    if (period === 'AM' && slotHour === 12) slotHour = 0;

    // Check if any availability range includes this slot
    for (const avail of vetAvailability) {
      if (typeof avail === 'string') {
        // Legacy format: "Morning (9 AM - 12 PM)" - handle for backward compatibility
        const lower = avail.toLowerCase();
        if (lower.includes('weekend')) {
          const dayOfWeek = selectedDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            // Weekend day - check if time matches other periods
            if ((lower.includes('morning') && slotHour >= 9 && slotHour < 12) ||
                (lower.includes('afternoon') && slotHour >= 12 && slotHour < 17) ||
                (lower.includes('evening') && slotHour >= 17 && slotHour < 20)) {
              return true;
            }
          }
        } else {
          // Check time periods for weekdays
          if ((lower.includes('morning') && slotHour >= 9 && slotHour < 12) ||
              (lower.includes('afternoon') && slotHour >= 12 && slotHour < 17) ||
              (lower.includes('evening') && slotHour >= 17 && slotHour < 20)) {
            return true;
          }
        }
      } else if (avail && typeof avail === 'object' && avail.start && avail.end) {
        // New format: { start: "HH:mm", end: "HH:mm" }
        // Check if slotTime24 falls within this range
        const startTime = avail.start;
        const endTime = avail.end;
        
        // Handle normal case (e.g., "09:00" - "12:00")
        if (startTime <= endTime) {
          if (slotTime24 >= startTime && slotTime24 < endTime) {
            return true;
          }
        } else {
          // Handle wrap-around (e.g., "23:30" - "00:00") - shouldn't happen in our case but handle it
          if (slotTime24 >= startTime || slotTime24 < endTime) {
            return true;
          }
        }
      }
    }

    return false; // Slot not in any availability range
  };

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedDateStr || !selectedVet) {
        setAvailableSlots(ALL_TIME_SLOTS);
        return;
      }

      setLoadingSlots(true);
      try {
        const booked = await getBookedSlots(selectedDateStr, selectedVet._id || selectedVet.id);
        
        // Ensure booked is an array
        const bookedArray = Array.isArray(booked) ? booked : [];
        
        // Parse selected date
        const [year, month, day] = selectedDateStr.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        
        // Get vet availability
        const vetAvailability = selectedVet.availability || [];
        
        // Filter by vet availability first, then by booked slots
        let available = ALL_TIME_SLOTS.filter(slot => {
          // Check if slot is in vet's availability
          if (!isSlotInAvailability(slot, vetAvailability, selectedDate)) {
            return false;
          }
          // Check if slot is not booked
          return !bookedArray.includes(slot);
        });
        
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;
        
        if (selectedDateStr === todayStr) {
          const now = new Date();
          available = available.filter(slot => {
            const [time, period] = slot.split(' ');
            const [hours, minutes] = time.split(':');
            let slotHour = parseInt(hours);
            if (period === 'PM' && slotHour !== 12) slotHour += 12;
            if (period === 'AM' && slotHour === 12) slotHour = 0;
            const slotDate = new Date();
            slotDate.setHours(slotHour, parseInt(minutes), 0, 0);
            return slotDate > now;
          });
        }
        
        setAvailableSlots(available);
      } catch (error) {
        console.error("Error loading available slots", error);
        setAvailableSlots(ALL_TIME_SLOTS);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [selectedDateStr, selectedVet]);


  const dates = generateDates(viewDate);

  const handleNextMonth = () => {
    const nextMonth = new Date(viewDate);
    nextMonth.setMonth(viewDate.getMonth() + 1);
    // Ensure we start at the 1st to avoid skipping months if today is 31st
    nextMonth.setDate(1); 
    setViewDate(nextMonth);
  };

  const handlePrevMonth = () => {
    const prevMonth = new Date(viewDate);
    prevMonth.setMonth(viewDate.getMonth() - 1);
    prevMonth.setDate(1);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    today.setDate(1); // Compare month start to month start
    
    if (prevMonth < today) {
        // Don't allow going back further than current month
        setViewDate(today);
    } else {
        setViewDate(prevMonth);
    }
  };

  // Determine if we are in the current month to disable "Prev" button
  const isCurrentMonth = (() => {
      const today = new Date();
      return viewDate.getMonth() === today.getMonth() && 
             viewDate.getFullYear() === today.getFullYear();
  })();

  const handleDateSelect = useCallback((dateStr) => {
    setSelectedDateStr(dateStr);
    setSelectedTime('');
    onDateTimeSelect && onDateTimeSelect(dateStr, '');
  }, [onDateTimeSelect]);
 

  // Update slots when date or vet changes
  // Available slots are derived; avoid setState within effects

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    onDateTimeSelect && onDateTimeSelect(selectedDateStr, time);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
        <FiCalendar className="text-blue-600" />
        Select Date & Time
      </h3>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-gray-700">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevMonth}
              disabled={isCurrentMonth}
              className={`p-1 rounded-full transition-colors ${
                  isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiChevronLeft />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {dates.map((item) => (
            <button
              key={item.dateStr}
              disabled={!item.available}
              onClick={() => handleDateSelect(item.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[60px] p-3 rounded-xl border transition-all ${
                selectedDateStr === item.dateStr
                  ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                  : item.available
                  ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                  : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <span className="text-xs font-medium mb-1 opacity-80">{item.day}</span>
              <span className="text-lg font-bold">{item.date}</span>
              {!item.available && (
                  <span className={`text-[10px] font-bold ${item.isPast ? 'text-gray-400' : 'text-red-400'}`}>
                      {item.isPast ? 'PAST' : 'FULL'}
                  </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm">
          <FiClock /> Available Slots 
          {loadingSlots && <span className="text-gray-400 text-xs">(Loading...)</span>}
          {!loadingSlots && availableSlots.length === 0 && <span className="text-red-500 text-xs">(None Available)</span>}
        </h4>
        
        {loadingSlots ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
            Loading available slots...
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {availableSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`py-2 px-1 text-sm font-medium rounded-lg border transition-colors ${
                  selectedTime === time
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
            No slots available for this date. Please select another day.
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimeSelection;
