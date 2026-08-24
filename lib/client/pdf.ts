import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfOptions {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  companyProfile: {
    displayName: string;
    address: string;
    phone: string;
  };
  filename: string;
}

export function exportTableToPDF(options: PdfOptions) {
  const { title, columns, rows, companyProfile, filename } = options;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  // Draw header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.text(companyProfile.displayName, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(companyProfile.address, pageWidth / 2, 26, { align: "center" });
  if (companyProfile.phone) {
    doc.text(companyProfile.phone, pageWidth / 2, 31, { align: "center" });
  }

  // Draw document title
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), pageWidth / 2, 42, { align: "center" });
  
  // Date and Time
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(`Generated on ${new Date().toLocaleString("en-NG")}`, 14, 52);

  // Auto table
  autoTable(doc, {
    startY: 56,
    head: [columns],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [16, 36, 61], textColor: 255 }, // matches brand color
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 10 },
  });

  doc.save(`${filename}.pdf`);
}
