// ============================================
// HISAB - PDF Report Generation with Hindi/Devanagari Font Support
// ============================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HisabEvent, MoneyReceived, Expense } from '@/types';
import { formatPDFCurrency, formatDate, CATEGORY_LABELS, PAYMENT_LABELS } from '@/utils/helpers';
import { getEventSummary, getCategorySummary, getPersonSummary } from '@/store';
import { NotoSansDevanagariRegular, NotoSansDevanagariBold } from '@/utils/devanagariFont';

// ============================================
// Font Registration Helper
// ============================================

function registerDevanagariFont(doc: jsPDF): void {
  // Add Noto Sans Devanagari Regular
  doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', NotoSansDevanagariRegular);
  doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');

  // Add Noto Sans Devanagari Bold
  doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', NotoSansDevanagariBold);
  doc.addFont('NotoSansDevanagari-Bold.ttf', 'NotoSansDevanagari', 'bold');
}

function setFont(doc: jsPDF, style: 'normal' | 'bold' = 'normal'): void {
  doc.setFont('NotoSansDevanagari', style);
}

// ============================================
// Main PDF Generator
// ============================================

export function generateEventPDF(
  event: HisabEvent,
  moneyReceived: MoneyReceived[],
  expenses: Expense[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Register Devanagari fonts
  registerDevanagariFont(doc);

  const summary = getEventSummary(event.id);
  const categories = getCategorySummary(event.id);
  const people = getPersonSummary(event.id);

  // Helper: check and add new page
  const checkNewPage = (requiredSpace: number): void => {
    if (y + requiredSpace > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }
  };

  // ==============================
  // PAGE 1: Title & Summary
  // ==============================

  // Brand Title
  doc.setFontSize(28);
  doc.setTextColor(99, 102, 241);
  setFont(doc, 'bold');
  doc.text('HISAB', pageWidth / 2, y + 15, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(120);
  setFont(doc, 'normal');
  doc.text('हर पैसे का साफ हिसाब', pageWidth / 2, y + 23, { align: 'center' });

  // Divider
  y += 30;
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Event Name
  doc.setFontSize(17);
  doc.setTextColor(30);
  setFont(doc, 'bold');
  doc.text(event.name.replace(' (Demo)', ''), pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Event Info
  doc.setFontSize(10);
  doc.setTextColor(100);
  setFont(doc, 'normal');
  const dateStr = `तारीख / Date: ${formatDate(event.startDate)}${event.endDate ? ' — ' + formatDate(event.endDate) : ''}`;
  doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
  y += 5;

  if (event.responsiblePerson) {
    doc.text(`जिम्मेदार व्यक्ति / Responsible: ${event.responsiblePerson}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(150);
  setFont(doc, 'normal');
  doc.text(
    `रिपोर्ट तिथि / Report Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    pageWidth / 2, y, { align: 'center' }
  );
  y += 15;

  // ==============================
  // Financial Summary Box
  // ==============================

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'FD');

  doc.setFontSize(11);
  setFont(doc, 'bold');
  doc.setTextColor(30);
  doc.text('वित्तीय सारांश / FINANCIAL SUMMARY', pageWidth / 2, y + 8, { align: 'center' });

  const boxY = y + 16;
  const colWidth = contentWidth / 4;

  const summaryItems = [
    { label: 'शुरुआती / Opening', value: formatPDFCurrency(summary.openingBalance), color: [100, 100, 100] as [number, number, number] },
    { label: 'कुल प्राप्त / Received', value: formatPDFCurrency(summary.totalReceived), color: [16, 185, 129] as [number, number, number] },
    { label: 'कुल खर्च / Spent', value: formatPDFCurrency(summary.totalSpent), color: [239, 68, 68] as [number, number, number] },
    { label: 'शेष राशि / Balance', value: formatPDFCurrency(summary.balance), color: [99, 102, 241] as [number, number, number] },
  ];

  summaryItems.forEach((item, i) => {
    const x = margin + colWidth * i + colWidth / 2;
    doc.setFontSize(8);
    doc.setTextColor(120);
    setFont(doc, 'normal');
    doc.text(item.label, x, boxY, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(...item.color);
    setFont(doc, 'bold');
    doc.text(item.value, x, boxY + 8, { align: 'center' });
  });

  y += 50;

  // ==============================
  // Money Received Table
  // ==============================

  checkNewPage(30);
  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129);
  setFont(doc, 'bold');
  doc.text('पैसा प्राप्त / MONEY RECEIVED', margin, y);
  y += 3;

  if (moneyReceived.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'तारीख / Date', 'देने वाला / Given By', 'राशि / Amount', 'जमा / Deposited', 'उद्देश्य / Purpose', 'Mode']],
      body: moneyReceived.map((m, i) => [
        (i + 1).toString(),
        formatDate(m.date),
        m.givenBy,
        formatPDFCurrency(m.amount),
        m.depositedWith,
        m.purpose || '-',
        PAYMENT_LABELS[m.paymentMethod]?.hi || m.paymentMethod,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      bodyStyles: {
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      styles: {
        cellPadding: 3,
        overflow: 'linebreak',
        font: 'NotoSansDevanagari',
      },
      margin: { left: margin, right: margin },
      foot: [['', '', 'कुल / Total', formatPDFCurrency(summary.totalReceived), '', '', '']],
      footStyles: {
        fillColor: [236, 253, 245],
        textColor: [16, 185, 129],
        fontStyle: 'bold',
        fontSize: 8,
        font: 'NotoSansDevanagari',
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150);
    setFont(doc, 'normal');
    doc.text('कोई पैसा प्राप्त नहीं हुआ / No money received records.', margin, y + 5);
    y += 15;
  }

  // ==============================
  // Expense Table
  // ==============================

  checkNewPage(30);
  doc.setFontSize(13);
  doc.setTextColor(239, 68, 68);
  setFont(doc, 'bold');
  doc.text('खर्च विवरण / EXPENSE DETAILS', margin, y);
  y += 3;

  if (expenses.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'तारीख / Date', 'खर्च करने वाला', 'प्राप्तकर्ता', 'उद्देश्य', 'श्रेणी / Category', 'राशि / Amount']],
      body: expenses.map((e, i) => [
        (i + 1).toString(),
        formatDate(e.date),
        e.spentBy,
        e.paidTo,
        e.purpose || '-',
        CATEGORY_LABELS[e.category]?.hi || e.category,
        formatPDFCurrency(e.amount),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      bodyStyles: {
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      styles: {
        cellPadding: 3,
        overflow: 'linebreak',
        font: 'NotoSansDevanagari',
      },
      margin: { left: margin, right: margin },
      foot: [['', '', '', '', '', 'कुल / Total', formatPDFCurrency(summary.totalSpent)]],
      footStyles: {
        fillColor: [254, 242, 242],
        textColor: [239, 68, 68],
        fontStyle: 'bold',
        fontSize: 8,
        font: 'NotoSansDevanagari',
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150);
    setFont(doc, 'normal');
    doc.text('कोई खर्च दर्ज नहीं किया गया / No expense records.', margin, y + 5);
    y += 15;
  }

  // ==============================
  // Item Details Table
  // ==============================

  const allItems = expenses.flatMap((e) =>
    e.items.map((it) => ({
      expenseDate: formatDate(e.date),
      spentBy: e.spentBy,
      paidTo: e.paidTo,
      ...it,
    }))
  );

  if (allItems.length > 0) {
    checkNewPage(30);
    doc.setFontSize(13);
    doc.setTextColor(139, 92, 246);
    setFont(doc, 'bold');
    doc.text('सामान विवरण / ITEM DETAILS', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['सामान / Item', 'मात्रा / Qty', 'इकाई / Unit', 'दर / Rate', 'कुल / Total', 'दुकान / Paid To']],
      body: allItems.map((it) => [
        it.itemName,
        it.quantity.toString(),
        it.unit,
        formatPDFCurrency(it.rate),
        formatPDFCurrency(it.total),
        it.paidTo,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      bodyStyles: {
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      styles: {
        cellPadding: 3,
        overflow: 'linebreak',
        font: 'NotoSansDevanagari',
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ==============================
  // Category Summary
  // ==============================

  if (categories.length > 0) {
    checkNewPage(30);
    doc.setFontSize(13);
    doc.setTextColor(99, 102, 241);
    setFont(doc, 'bold');
    doc.text('श्रेणी सारांश / CATEGORY SUMMARY', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['श्रेणी / Category', 'राशि / Amount', 'लेनदेन / Transactions', 'प्रतिशत / %']],
      body: categories.map((c) => [
        `${CATEGORY_LABELS[c.category]?.hi || c.category} / ${CATEGORY_LABELS[c.category]?.en || c.category}`,
        formatPDFCurrency(c.amount),
        c.count.toString(),
        `${c.percentage}%`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      bodyStyles: {
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      styles: {
        cellPadding: 3,
        font: 'NotoSansDevanagari',
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ==============================
  // Person Summary
  // ==============================

  if (people.length > 0) {
    checkNewPage(30);
    doc.setFontSize(13);
    doc.setTextColor(245, 158, 11);
    setFont(doc, 'bold');
    doc.text('व्यक्ति-वार सारांश / PERSON-WISE SUMMARY', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['व्यक्ति / Person', 'दिया / Given', 'प्राप्त / Received', 'खर्च / Spent', 'लेनदेन / Txn']],
      body: people.map((p) => [
        p.name,
        formatPDFCurrency(p.moneyGiven),
        formatPDFCurrency(p.moneyReceived),
        formatPDFCurrency(p.moneySpent),
        p.transactionCount.toString(),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      bodyStyles: {
        fontSize: 7.5,
        font: 'NotoSansDevanagari',
      },
      styles: {
        cellPadding: 3,
        font: 'NotoSansDevanagari',
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ==============================
  // Final Balance Box
  // ==============================

  checkNewPage(40);

  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'FD');

  doc.setFontSize(12);
  setFont(doc, 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('अंतिम शेष / FINAL BALANCE', pageWidth / 2, y + 8, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(80);
  setFont(doc, 'normal');
  const balText = `शुरुआती: ${formatPDFCurrency(summary.openingBalance)}  +  प्राप्त: ${formatPDFCurrency(summary.totalReceived)}  −  खर्च: ${formatPDFCurrency(summary.totalSpent)}`;
  doc.text(balText, pageWidth / 2, y + 16, { align: 'center' });

  doc.setFontSize(16);
  setFont(doc, 'bold');
  doc.setTextColor(summary.balance >= 0 ? 16 : 239, summary.balance >= 0 ? 185 : 68, summary.balance >= 0 ? 129 : 68);
  doc.text(`शेष राशि / Remaining: ${formatPDFCurrency(summary.balance)}`, pageWidth / 2, y + 27, { align: 'center' });

  // ==============================
  // Dhanyawad footer on last page
  // ==============================

  y += 42;
  if (y < pageHeight - 30) {
    doc.setFontSize(9);
    doc.setTextColor(150);
    setFont(doc, 'normal');
    doc.text('धन्यवाद — HISAB हर पैसे का साफ हिसाब', pageWidth / 2, y, { align: 'center' });
  }

  // ==============================
  // Add Headers/Footers to all pages
  // ==============================

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Header line
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.8);
    doc.line(margin, 10, pageWidth - margin, 10);

    // Footer
    setFont(doc, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`HISAB — ${event.name.replace(' (Demo)', '')}`, margin, pageHeight - 8);
    doc.text(
      `पृष्ठ / Page ${i} / ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  }

  return doc;
}

// ============================================
// Test PDF for Hindi verification
// ============================================

export function generateHindiTestPDF() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Register Devanagari fonts
  registerDevanagariFont(doc);

  let y = 25;

  // Title
  doc.setFontSize(28);
  doc.setTextColor(99, 102, 241);
  setFont(doc, 'bold');
  doc.text('HISAB', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(60);
  setFont(doc, 'normal');
  doc.text('हर पैसे का साफ हिसाब', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Divider
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Test content
  const testLines = [
    { label: 'कार्यक्रम का नाम:', value: 'वार्षिक समारोह 2026' },
    { label: 'कुल प्राप्त राशि:', value: '₹20,000' },
    { label: 'कुल खर्च:', value: '₹12,500' },
    { label: 'शेष राशि:', value: '₹7,500' },
    { label: 'पैसा देने वाला:', value: 'सुरेश कुमार' },
    { label: 'पैसा जमा करने वाला:', value: 'राजेश' },
    { label: 'खर्च करने वाला:', value: 'अमित' },
    { label: 'पैसा प्राप्त करने वाला:', value: 'शर्मा टेंट हाउस' },
    { label: 'सामान:', value: 'पानी की बोतल' },
    { label: 'उद्देश्य:', value: 'अतिथि व्यवस्था' },
  ];

  testLines.forEach((line) => {
    doc.setFontSize(11);
    setFont(doc, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(line.label, margin, y);
    setFont(doc, 'normal');
    doc.setTextColor(30);
    doc.text(line.value, margin + 55, y);
    y += 8;
  });

  y += 5;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Mixed text test
  doc.setFontSize(12);
  setFont(doc, 'bold');
  doc.setTextColor(30);
  doc.text('मिश्रित पाठ परीक्षण / Mixed Text Test:', margin, y);
  y += 8;

  doc.setFontSize(10);
  setFont(doc, 'normal');
  doc.setTextColor(60);

  const mixedTests = [
    'सुरेश कुमार ने ₹5,000 राजेश को दिए।',
    'कुल आय: ₹20,000 — कुल खर्च: ₹12,500 — शेष: ₹7,500',
    'Event विवरण: Annual Function 2026 — 25 Sep 2026',
    'भुगतान: नकद / UPI / बैंक ट्रांसफर',
    'श्रेणी: खाना, सजावट, यातायात, उपकरण, जलपान',
    'तारीख: 25/09/2026 — राशि: ₹1,25,000',
  ];

  mixedTests.forEach((text) => {
    doc.text(text, margin, y);
    y += 7;
  });

  y += 5;

  // Matra and conjunct test
  doc.setFontSize(12);
  setFont(doc, 'bold');
  doc.setTextColor(30);
  doc.text('मात्रा और संयुक्त अक्षर परीक्षण:', margin, y);
  y += 8;

  doc.setFontSize(10);
  setFont(doc, 'normal');
  doc.setTextColor(60);

  const specialTests = [
    'मात्रा: कि की कु कू के कै को कौ कं कः',
    'संयुक्त: क्ष त्र ज्ञ श्र श्री प्र क्र',
    'अनुस्वार/विसर्ग: संस्कृत दुःख अंत',
    'पूर्ण शब्द: धन्यवाद, कार्यक्रम, प्रबंधन, विद्यालय',
    'नाम: राजेश, सुरेश, महेश, दिनेश, रमेश',
    'संख्या: ₹1,00,000 ₹50,000 ₹25,000 ₹10,000',
  ];

  specialTests.forEach((text) => {
    doc.text(text, margin, y);
    y += 7;
  });

  y += 10;

  // Thank you
  doc.setFontSize(16);
  setFont(doc, 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('धन्यवाद', pageWidth / 2, y, { align: 'center' });

  return doc;
}

// ============================================
// Download / Print
// ============================================

function sanitizeFilename(name: string): string {
  // Replace Hindi/special characters and spaces for safe filenames
  return name
    .replace(/ \(Demo\)$/i, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim() || 'Event';
}

export function downloadEventPDF(event: HisabEvent, moneyReceived: MoneyReceived[], expenses: Expense[]) {
  const doc = generateEventPDF(event, moneyReceived, expenses);
  const filename = `HISAB_${sanitizeFilename(event.name)}_Report.pdf`;
  doc.save(filename);
}

export function printEventPDF(event: HisabEvent, moneyReceived: MoneyReceived[], expenses: Expense[]) {
  const doc = generateEventPDF(event, moneyReceived, expenses);
  doc.autoPrint();
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url);
}

export function downloadHindiTestPDF() {
  const doc = generateHindiTestPDF();
  doc.save('HISAB_Hindi_Test.pdf');
}
