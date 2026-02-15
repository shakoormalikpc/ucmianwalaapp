import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportConfig {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

export const exportToPDF = ({ title, headers, rows, filename }: ExportConfig) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}`, 14, 28);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 82],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    doc.text("UC Membership & Fund Management", 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`${filename}.pdf`);
};

export const exportToExcel = ({ title, headers, rows, filename }: ExportConfig) => {
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 15) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
