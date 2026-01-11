import React from 'react';
import { FiShare2, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const VaccinationFooter = ({ onNavigate, vaccinations = [] }) => {
  
  const handleDownload = () => {
    const doc = new jsPDF();

    // Add Header
    doc.setFontSize(20);
    doc.text('Vaccination Records', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Define columns
    const columns = [
      { header: 'Vaccine Name', dataKey: 'name' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Date / Due Date', dataKey: 'date' },
      { header: 'Next Due', dataKey: 'nextDue' },
      { header: 'Vet / Clinic', dataKey: 'vet' },
    ];

    // Format data rows
    const rows = vaccinations.map(v => {
      return {
        name: v.vaccineName,
        status: v.status,
        date: v.completedDate || v.dueDate,
        nextDue: v.nextDue || 'N/A',
        vet: `${v.vetName || ''}\n${v.clinicName || ''}`.trim()
      };
    });

    // Generate table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey])),
      startY: 40,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // Blue header
      alternateRowStyles: { fillColor: [249, 250, 251] }, // Light gray alternate rows
    });

    // Save PDF
    doc.save(`vaccination_records_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex justify-center mt-8 pt-8 border-t border-gray-200 pb-12">
      <div className="flex gap-4">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiDownload className="w-5 h-5" />
          Export
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('vetListing')}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <FiShare2 className="w-5 h-5" />
          Share with Vet
        </button>
      </div>
    </div>
  );
};

export default VaccinationFooter;
