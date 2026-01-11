import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateMedicalReport = (records) => {
  const doc = new jsPDF();

  // Add Header
  doc.setFontSize(20);
  doc.text('Pet Medical Records', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Define columns
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Time', dataKey: 'time' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Title', dataKey: 'title' },
    { header: 'Vet / Clinic', dataKey: 'vet' },
    { header: 'Details', dataKey: 'details' },
  ];

  // Format data rows
  const rows = records.map(record => {
    // Format details object into a readable string with newlines
    const detailsStr = record.details 
      ? Object.entries(record.details)
          .map(([key, value]) => {
            // Capitalize first letter of key
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `${label}: ${value}`;
          })
          .join('\n')
      : '';

    return {
      date: record.date,
      time: record.time,
      type: record.type,
      title: record.title,
      vet: `${record.vetName || ''}\n${record.clinicName || ''}`,
      details: detailsStr
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
    columnStyles: {
      5: { cellWidth: 70 } // Make Details column wider
    }
  });

  // Save PDF
  doc.save(`medical_records_${new Date().toISOString().split('T')[0]}.pdf`);
};
