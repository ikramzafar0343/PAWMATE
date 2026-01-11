import React from 'react';
import HistoryHeader from '../components/consultationHistory/HistoryHeader';
import HistoryList from '../components/consultationHistory/HistoryList';

const ConsultationHistory = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <HistoryHeader />
      <HistoryList onNavigate={onNavigate} />
    </div>
  );
};

export default ConsultationHistory;
