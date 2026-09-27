// ============================================
// HISAB - PDF Report Generation
// ============================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HisabEvent, MoneyReceived, Expense } from '@/types';
import { formatCurrency, formatDate, CATEGORY_LABELS, PAYMENT_LABELS } from '@/utils/helpers';
import { getEventSummary, getCategorySummary, getPersonSummary } from '@/store';

export function generateEventPDF(
  event: HisabEvent,
  moneyReceived: MoneyReceived[],
  expenses: Expense[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  const summary = getEventSummary(event.id);
  const categories = getCategorySummary(event.id);
  const people = getPersonSummary(event.id);

  // Helper to add header/footer
  const addHeaderFooter = (pageNum: number, totalPages: number) => {
    // Header line
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.8);
    doc.line(margin, 10, pageWidth - margin, 10);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`HISAB - ${event.name}`, margin, doc.internal.pageSize.getHeight() - 8);
    doc.text(
      `Page ${pageNum} / ${totalPages}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    );
    doc.line(margin, doc.internal.pageSize.getHeight() - 12, pageWidth - margin, doc.internal.pageSize.getHeight() - 12);
  };

  // ==============================
  // Title Page / Header
  // ==============================

  // Brand
  doc.setFontSize(28);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.text('HISAB', pageWidth / 2, y + 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.setFont('helvetica', 'normal');
  doc.text('Har Paise Ka Saaf Hisab', pageWidth / 2, y + 22, { align: 'center' });

  // Divider
  y += 30;
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Event Name
  doc.setFontSize(18);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.text(event.name, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Event dates
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(event.startDate)}${event.endDate ? ' - ' + formatDate(event.endDate) : ''}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  if (event.responsiblePerson) {
    doc.text(`Responsible: ${event.responsiblePerson}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Report Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // ==============================
  // Financial Summary Box
  // ==============================

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('FINANCIAL SUMMARY', pageWidth / 2, y + 8, { align: 'center' });

  const boxY = y + 16;
  const colWidth = (pageWidth - 2 * margin) / 4;

  const summaryItems = [
    { label: 'Opening', value: formatCurrency(summary.openingBalance), color: [100, 100, 100] as [number, number, number] },
    { label: 'Received', value: formatCurrency(summary.totalReceived), color: [16, 185, 129] as [number, number, number] },
    { label: 'Spent', value: formatCurrency(summary.totalSpent), color: [239, 68, 68] as [number, number, number] },
    { label: 'Balance', value: formatCurrency(summary.balance), color: [99, 102, 241] as [number, number, number] },
  ];

  summaryItems.forEach((item, i) => {
    const x = margin + colWidth * i + colWidth / 2;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x, boxY, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(...item.color);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, boxY + 7, { align: 'center' });
  });

  y += 45;

  // ==============================
  // Money Received Table
  // ==============================

  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('MONEY RECEIVED', margin, y);
  y += 3;

  if (moneyReceived.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Date', 'Given By', 'Amount', 'Deposited With', 'Purpose', 'Mode']],
      body: moneyReceived.map((m, i) => [
        (i + 1).toString(),
        formatDate(m.date),
        m.givenBy,
        formatCurrency(m.amount),
        m.depositedWith,
        m.purpose || '-',
        PAYMENT_LABELS[m.paymentMethod]?.en || m.paymentMethod,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 3, overflow: 'linebreak' },
      margin: { left: margin, right: margin },
      foot: [['', '', 'Total', formatCurrency(summary.totalReceived), '', '', '']],
      footStyles: { fillColor: [236, 253, 245], textColor: [16, 185, 129], fontStyle: 'bold', fontSize: 9 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text('No money received records.', margin, y + 5);
    y += 15;
  }

  // Check if we need a new page
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // ==============================
  // Expense Table
  // ==============================

  doc.setFontSize(13);
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPENSE DETAILS', margin, y);
  y += 3;

  if (expenses.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Date', 'Spent By', 'Paid To', 'Purpose', 'Category', 'Amount']],
      body: expenses.map((e, i) => [
        (i + 1).toString(),
        formatDate(e.date),
        e.spentBy,
        e.paidTo,
        e.purpose || '-',
        CATEGORY_LABELS[e.category]?.en || e.category,
        formatCurrency(e.amount),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 3, overflow: 'linebreak' },
      margin: { left: margin, right: margin },
      foot: [['', '', '', '', '', 'Total', formatCurrency(summary.totalSpent)]],
      footStyles: { fillColor: [254, 242, 242], textColor: [239, 68, 68], fontStyle: 'bold', fontSize: 9 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text('No expense records.', margin, y + 5);
    y += 15;
  }

  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // ==============================
  // Category Summary
  // ==============================

  if (categories.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.text('CATEGORY SUMMARY', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount', 'Transactions', 'Percentage']],
      body: categories.map((c) => [
        CATEGORY_LABELS[c.category]?.en || c.category,
        formatCurrency(c.amount),
        c.count.toString(),
        `${c.percentage}%`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // ==============================
  // Person Summary
  // ==============================

  if (people.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSON-WISE SUMMARY', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Person', 'Money Given', 'Money Received', 'Money Spent', 'Transactions']],
      body: people.map((p) => [
        p.name,
        formatCurrency(p.moneyGiven),
        formatCurrency(p.moneyReceived),
        formatCurrency(p.moneySpent),
        p.transactionCount.toString(),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ==============================
  // Final Balance Box
  // ==============================

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('FINAL BALANCE', pageWidth / 2, y + 8, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont('helvetica', 'normal');
  const balText = `Opening: ${formatCurrency(summary.openingBalance)}  +  Received: ${formatCurrency(summary.totalReceived)}  -  Spent: ${formatCurrency(summary.totalSpent)}`;
  doc.text(balText, pageWidth / 2, y + 15, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(summary.balance >= 0 ? 16 : 239, summary.balance >= 0 ? 185 : 68, summary.balance >= 0 ? 129 : 68);
  doc.text(`Remaining: ${formatCurrency(summary.balance)}`, pageWidth / 2, y + 24, { align: 'center' });

  // Add headers/footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  return doc;
}

export function downloadEventPDF(event: HisabEvent, moneyReceived: MoneyReceived[], expenses: Expense[]) {
  const doc = generateEventPDF(event, moneyReceived, expenses);
  doc.save(`HISAB_${event.name.replace(/\s+/g, '_')}_Report.pdf`);
}

export function printEventPDF(event: HisabEvent, moneyReceived: MoneyReceived[], expenses: Expense[]) {
  const doc = generateEventPDF(event, moneyReceived, expenses);
  doc.autoPrint();
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url);
}
