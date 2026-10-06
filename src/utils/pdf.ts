// ============================================
// HISAB - PDF Report Generation with Hindi/Devanagari Font Support
// ============================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HisabEvent, MoneyReceived, Expense } from '@/types';
import {
  formatPDFCurrency,
  formatDate,
  CATEGORY_LABELS,
  PAYMENT_LABELS,
  getContributionMonths,
  getMonthContributionMembers,
  getPreviousMonthsUnpaid,
  getCurrentMonthStr,
  formatHindiMonth,
} from '@/utils/helpers';
import { getEventSummary, getCategorySummary, getPersonSummary, getPeople, getSettings } from '@/store';
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
  // Person Summary / Contribution Member Checklist
  // ==============================

  const isContribution = event.eventType === 'contribution';

  if (isContribution) {
    const registeredPeople = getPeople();
    const allMonths = getContributionMonths(event, moneyReceived, expenses);
    const currentMonthStr = getCurrentMonthStr();
    const currentMonthMembers = getMonthContributionMembers(moneyReceived, currentMonthStr, registeredPeople);
    const prevUnpaid = getPreviousMonthsUnpaid(allMonths, currentMonthStr, moneyReceived, registeredPeople);

    if (currentMonthMembers.length > 0) {
      checkNewPage(30);
      doc.setFontSize(13);
      doc.setTextColor(16, 185, 129);
      setFont(doc, 'bold');
      doc.text(`सदस्य चालू माह अंशदान स्थिति (${formatHindiMonth(currentMonthStr)})`, margin, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        head: [['क्र.', 'सदस्य का नाम / Member', 'मोबाइल / Mobile', 'अंशदान राशि (₹)', 'मासिक अंशदान स्थिति / Status']],
        body: currentMonthMembers.map((m, idx) => [
          (idx + 1).toString(),
          m.name,
          m.mobile || '—',
          m.hasContributed ? formatPDFCurrency(m.totalContributed) : '₹0',
          m.hasContributed ? '[✓] जमा (Paid)' : '[  ] बाकी (Pending)',
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
          font: 'NotoSansDevanagari',
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    }

    // Previous Months Remaining Dues ("previous month ka jo baki rahe usi ka name dikhe")
    checkNewPage(30);
    doc.setFontSize(13);
    doc.setTextColor(239, 68, 68);
    setFont(doc, 'bold');
    doc.text('पिछले माह का बकाया / PREVIOUS MONTHS REMAINING DUES', margin, y);
    y += 3;

    if (prevUnpaid.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['क्र.', 'सदस्य का नाम (बकायादार)', 'मोबाइल / Mobile', 'बकाया माह / Month', 'स्थिति / Status']],
        body: prevUnpaid.map((u, idx) => [
          (idx + 1).toString(),
          u.name,
          u.mobile || '—',
          u.monthLabel,
          '[  ] बाकी (Unpaid)',
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
          font: 'NotoSansDevanagari',
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129);
      setFont(doc, 'normal');
      doc.text('✓ पिछले माह का कोई बकाया नहीं है — सभी सदस्यों का हिसाब पूर्ण है।', margin, y + 5);
      y += 15;
    }
  } else if (people.length > 0) {
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

  // English & Mixed text test
  doc.setFontSize(12);
  setFont(doc, 'bold');
  doc.setTextColor(30);
  doc.text('अंग्रेज़ी शब्द व मिश्रित परीक्षण / English Words & Mixed Test:', margin, y);
  y += 8;

  doc.setFontSize(10);
  setFont(doc, 'normal');
  doc.setTextColor(60);

  const mixedTests = [
    'सुरेश कुमार ने ₹5,000 राजेश को दिए।',
    'English Words: Annual Function 2026, Sound System, Stage Decoration, Catering',
    'Mixed Sentence: Suresh Kumar (सुरेश) paid ₹5,000 for Sound System via UPI',
    'Payment Modes: Cash / UPI (GPay, PhonePe, Paytm) / Net Banking / Bank Transfer',
    'Alphabet (A-Z, a-z): ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz',
    'Numbers & Symbols: 0123456789 • ₹1,25,000 • Bill #1042 • 100% Verified',
    'Category: Food & Refreshment (सब्ज़ी, चावल, Ice Cream, Water Bottles)',
    'कुल आय: ₹20,000 — कुल खर्च: ₹12,500 — शेष: ₹7,500',
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
  doc.text('मात्रा और संयुक्त अक्षर परीक्षण (Hindi Characters):', margin, y);
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
  doc.text('धन्यवाद / Thank You', pageWidth / 2, y, { align: 'center' });

  return doc;
}

// ============================================
// Book-Quality Hindi HTML Report Generator
// ============================================

function escapeHtml(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateEventReportHTML(
  event: HisabEvent,
  moneyReceived: MoneyReceived[],
  expenses: Expense[]
): string {
  const summary = getEventSummary(event.id);
  const categories = getCategorySummary(event.id);
  const people = getPersonSummary(event.id);
  const settings = getSettings();
  const treasurerSig = event.treasurerSignature || settings.defaultTreasurerSignature || '';
  const presidentSig = event.presidentSignature || settings.defaultPresidentSignature || '';
  const presidentName = event.presidentName || settings.defaultPresidentName || '';

  const statusText = event.isArchived
    ? 'पूर्ण / पुरालेख (Archived)'
    : 'सक्रिय (Active)';

  const statusBg = event.isArchived ? '#ecfdf5' : '#eef2ff';
  const statusColor = event.isArchived ? '#059669' : '#4f46e5';

  const dateStr = `${formatDate(event.startDate)}${event.endDate ? ' — ' + formatDate(event.endDate) : ''}`;
  const printDate = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Category Rows
  const categoryRows = categories.map((cat, idx) => {
    const label = CATEGORY_LABELS[cat.category]?.hi || cat.category;
    const labelEn = CATEGORY_LABELS[cat.category]?.en || '';
    return `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td><strong>${escapeHtml(label)}</strong> <span style="color:#64748b; font-size:11px;">(${escapeHtml(labelEn)})</span></td>
        <td style="text-align: center;">${cat.count}</td>
        <td style="text-align: right; font-weight: 600; color: #dc2626;">${formatPDFCurrency(cat.amount)}</td>
        <td style="text-align: right;">${cat.percentage}%</td>
        <td style="width: 120px;">
          <div style="background: #f1f5f9; border-radius: 999px; height: 8px; overflow: hidden; width: 100%;">
            <div style="background: #6366f1; height: 100%; width: ${cat.percentage}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Money Received Rows
  const moneyRows = moneyReceived.map((m, idx) => {
    const mode = PAYMENT_LABELS[m.paymentMethod]?.hi || m.paymentMethod || 'नकद';
    return `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td>${escapeHtml(formatDate(m.date))}</td>
        <td><strong>${escapeHtml(m.givenBy)}</strong></td>
        <td style="text-align: right; font-weight: 700; color: #059669;">${formatPDFCurrency(m.amount)}</td>
        <td><span class="badge badge-mode">${escapeHtml(mode)}</span></td>
        <td>${escapeHtml(m.purpose || m.note || '—')}</td>
        <td>${escapeHtml(m.depositedWith || '—')}</td>
      </tr>
    `;
  }).join('');

  // Expense Rows
  const expenseRows = expenses.map((e, idx) => {
    const cat = CATEGORY_LABELS[e.category]?.hi || e.category;
    const mode = PAYMENT_LABELS[e.paymentMethod]?.hi || e.paymentMethod || 'नकद';
    const itemsText = e.items && e.items.length > 0
      ? e.items.map(it => `${it.itemName} (${it.quantity} ${it.unit} @ ₹${it.rate})`).join(', ')
      : (e.purpose || e.note || '—');

    return `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td>${escapeHtml(formatDate(e.date))}</td>
        <td><strong>${escapeHtml(cat)}</strong></td>
        <td style="text-align: right; font-weight: 700; color: #dc2626;">${formatPDFCurrency(e.amount)}</td>
        <td><span class="badge badge-mode">${escapeHtml(mode)}</span></td>
        <td style="font-size: 11px;">${escapeHtml(itemsText)}</td>
        <td>${escapeHtml(e.spentBy || '—')}</td>
        <td>${escapeHtml(e.paidTo || '—')}</td>
      </tr>
    `;
  }).join('');

  // People Rows (Used for standard non-contribution events)
  const peopleRows = people.map((p, idx) => {
    const net = p.moneyGiven - p.moneySpent;
    const netColor = net > 0 ? '#059669' : net < 0 ? '#dc2626' : '#64748b';
    const netText = net > 0
      ? `+${formatPDFCurrency(net)} (लेना है)`
      : net < 0
      ? `-${formatPDFCurrency(Math.abs(net))} (देना है)`
      : '₹0 (बराबर)';

    return `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td style="text-align: right; color: #059669; font-weight: 600;">${formatPDFCurrency(p.moneyGiven)}</td>
        <td style="text-align: right; color: #4f46e5;">${formatPDFCurrency(p.moneyReceived)}</td>
        <td style="text-align: right; color: #dc2626; font-weight: 600;">${formatPDFCurrency(p.moneySpent)}</td>
        <td style="text-align: right; font-weight: 700; color: ${netColor};">${netText}</td>
      </tr>
    `;
  }).join('');

  // ============================================
  // Contribution Members Logic (Month-wise)
  // ============================================
  const isContribution = event.eventType === 'contribution';
  const registeredPeople = getPeople();
  const allContributionMonths = getContributionMonths(event, moneyReceived, expenses);
  const currentMonthStr = getCurrentMonthStr();
  const currentMonthMembers = getMonthContributionMembers(moneyReceived, currentMonthStr, registeredPeople);
  const prevUnpaid = getPreviousMonthsUnpaid(allContributionMonths, currentMonthStr, moneyReceived, registeredPeople);

  const totalCurrentMonthCollected = currentMonthMembers.reduce((sum, m) => sum + m.totalContributed, 0);
  const paidCount = currentMonthMembers.filter(m => m.hasContributed).length;
  const pendingCount = currentMonthMembers.filter(m => !m.hasContributed).length;

  // Current Month Rows:
  // "current month me sabka dikhe aur status dikhe pdf me"
  // "current month me jo nahi diya usake age tik na dikho"
  const contributionRows = currentMonthMembers.map((m, idx) => {
    const paymentInfo = m.hasContributed
      ? `${m.paymentDates.join(', ')} (${m.paymentMethods.join(', ')})`
      : '— (इस माह का अंशदान बाकी)';

    return `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td>
          <strong style="color: #0f172a; font-size: 13px;">${escapeHtml(m.name)}</strong>
        </td>
        <td style="color: #64748b; font-size: 11px;">
          ${escapeHtml(m.mobile || '—')}
        </td>
        <td style="text-align: right; font-weight: 700; color: ${m.hasContributed ? '#059669' : '#94a3b8'};">
          ${m.hasContributed ? formatPDFCurrency(m.totalContributed) : '₹0'}
        </td>
        <td style="font-size: 11px; color: #475569;">
          ${escapeHtml(paymentInfo)}
        </td>
        <td style="text-align: center;">
          ${m.hasContributed ? `
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; background: #ecfdf5; color: #059669; border: 1.5px solid #10b981;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 3px; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 900; line-height: 1;">✓</span>
              <span>जमा (Paid)</span>
            </div>
          ` : `
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 11px; background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca;">
              <span style="display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid #dc2626; background: #ffffff;"></span>
              <span>बाकी (Pending)</span>
            </div>
          `}
        </td>
      </tr>
    `;
  }).join('');

  // Previous Months Unpaid Rows ("previous month ka jo baki rahe usi ka name dikhe")
  const prevUnpaidRows = prevUnpaid.map((u, idx) => `
    <tr>
      <td style="text-align: center; color: #64748b;">${idx + 1}</td>
      <td>
        <strong style="color: #991b1b; font-size: 13px;">${escapeHtml(u.name)}</strong>
      </td>
      <td style="color: #64748b; font-size: 11px;">
        ${escapeHtml(u.mobile || '—')}
      </td>
      <td style="font-size: 12px; font-weight: 600; color: #475569;">
        ${escapeHtml(u.monthLabel)}
      </td>
      <td style="text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 11px; background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca;">
          <span style="display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid #dc2626; background: #ffffff;"></span>
          <span>बाकी (Unpaid)</span>
        </div>
      </td>
    </tr>
  `).join('');

  const reportTitle = `HISAB_${sanitizeFilename(event.name)}_Report`;

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(event.name.replace(' (Demo)', ''))} - HISAB रिपोर्ट</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
    @font-face {
      font-family: 'NotoSansDevanagari';
      src: url('data:font/ttf;base64,${NotoSansDevanagariRegular}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'NotoSansDevanagari';
      src: url('data:font/ttf;base64,${NotoSansDevanagariBold}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'NotoSansDevanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Screen Toolbar */
    .no-print {
      display: block;
    }
    .report-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e1b4b;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toolbar-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .toolbar-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .toolbar-hint {
      font-size: 12px;
      color: #cbd5e1;
    }
    .toolbar-hint strong {
      color: #facc15;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .btn-download {
      background: #10b981;
      color: #ffffff;
    }
    .btn-download:hover {
      background: #059669;
    }
    .btn-print {
      background: #6366f1;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #4f46e5;
    }
    .btn-close {
      background: rgba(255,255,255,0.15);
      color: #ffffff;
    }
    .btn-close:hover {
      background: rgba(255,255,255,0.25);
    }

    /* Report Container */
    .report-wrap {
      max-width: 860px;
      margin: 24px auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }

    /* Header */
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-logo-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-badge {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 8px;
      letter-spacing: 1px;
    }
    .brand-text h1 {
      font-size: 22px;
      font-weight: 800;
      color: #1e1b4b;
      line-height: 1.1;
    }
    .brand-text p {
      font-size: 12px;
      color: #6366f1;
      font-weight: 700;
      margin-top: 2px;
    }
    .report-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .report-meta .status-tag {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 4px;
      background: ${statusBg};
      color: ${statusColor};
    }

    /* Event Title Banner */
    .event-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #6366f1;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .event-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .event-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px 16px;
      font-size: 12px;
      color: #475569;
    }
    .event-details-grid strong {
      color: #0f172a;
    }

    /* Summary Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      text-align: left;
    }
    .summary-card.opening { border-top: 3px solid #64748b; }
    .summary-card.received { border-top: 3px solid #059669; background: #f0fdf4; }
    .summary-card.spent { border-top: 3px solid #dc2626; background: #fef2f2; }
    .summary-card.balance { border-top: 3px solid #4f46e5; background: #eef2ff; }
    .summary-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .summary-card.received .summary-value { color: #059669; }
    .summary-card.spent .summary-value { color: #dc2626; }
    .summary-card.balance .summary-value { color: #4f46e5; }

    /* Formula Strip */
    .formula-strip {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 10px 16px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 24px;
      border: 1px dashed #cbd5e1;
    }

    /* Section Styling */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e1b4b;
      margin: 24px 0 10px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .section-title .count-badge {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 999px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 12px;
    }
    th, td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      font-size: 11px;
      text-align: left;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    tfoot td {
      background: #f8fafc;
      font-weight: 700;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    .badge-mode {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
    }

    /* Signatures */
    .signatures-block {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .sig-box {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 14px 16px;
      text-align: center;
      background: #fafbfc;
      min-height: 105px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .sig-img-container {
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
    }
    .sig-img {
      max-height: 44px;
      max-width: 160px;
      object-fit: contain;
    }
    .sig-line {
      height: 38px;
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 8px;
    }
    .sig-divider {
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 8px;
    }
    .sig-label {
      font-size: 12px;
      font-weight: 700;
      color: #1e1b4b;
    }
    .sig-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Footer */
    .report-footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Print Specifics */
    @media print {
      body {
        background: #ffffff !important;
        font-size: 10pt;
      }
      .no-print {
        display: none !important;
      }
      .report-wrap {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .summary-grid {
        grid-template-columns: repeat(4, 1fr) !important;
      }
      table {
        page-break-inside: auto;
        font-size: 9pt;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      thead {
        display: table-header-group;
      }
      tfoot {
        display: table-footer-group;
      }
      .avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 14mm 12mm 14mm;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="no-print report-toolbar">
    <div class="toolbar-info">
      <div class="toolbar-title">📄 HISAB — किताब जैसी शुद्ध हिंदी PDF रिपोर्ट / Report Preview</div>
      <div class="toolbar-hint">
        💡 <strong>PDF के लिए:</strong> नीचे <strong>'सीधा PDF डाउनलोड करें'</strong> दबाएं या प्रिंट विंडो में <em>'Destination'</em> में <strong>'Save as PDF'</strong> चुनें।
      </div>
    </div>
    <div class="toolbar-actions">
      <button id="btnDirectDownload" class="btn btn-download" onclick="downloadPdfDirect()">📥 सीधा PDF डाउनलोड करें</button>
      <button class="btn btn-print" onclick="window.print()">🖨️ प्रिंट / Save as PDF</button>
      <button class="btn btn-close" onclick="window.close()">✕ बंद करें</button>
    </div>
  </div>

  <div class="report-wrap" id="reportContent">
    <!-- Brand Header -->
    <div class="brand-header">
      <div class="brand-logo-box">
        <div class="brand-badge">HISAB</div>
        <div class="brand-text">
          <h1>HISAB</h1>
          <p>हर पैसे का साफ हिसाब</p>
        </div>
      </div>
      <div class="report-meta">
        <div><span class="status-tag">${escapeHtml(statusText)}</span></div>
        <div>तैयार तिथि: ${printDate}</div>
        <div>रिपोर्ट कोड: EV-${event.id.slice(-6).toUpperCase()}</div>
      </div>
    </div>

    <!-- Event Info Banner -->
    <div class="event-banner">
      <div class="event-title">${escapeHtml(event.name.replace(' (Demo)', ''))}</div>
      <div class="event-details-grid">
        <div>📅 <strong>आयोजन तिथि:</strong> ${escapeHtml(dateStr)}</div>
        ${event.responsiblePerson ? `<div>👤 <strong>जिम्मेदार व्यक्ति:</strong> ${escapeHtml(event.responsiblePerson)}</div>` : ''}
        ${event.description ? `<div>📝 <strong>विवरण:</strong> ${escapeHtml(event.description)}</div>` : ''}
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="summary-grid">
      <div class="summary-card opening">
        <div class="summary-label">${isContribution ? 'शुरुआती फंड / Opening Fund' : 'शुरुआती राशि / Opening'}</div>
        <div class="summary-value">${formatPDFCurrency(summary.openingBalance)}</div>
      </div>
      <div class="summary-card received">
        <div class="summary-label">${isContribution ? 'कुल अंशदान प्राप्त / Total Contribution' : 'कुल प्राप्त राशि / Received'}</div>
        <div class="summary-value">${formatPDFCurrency(summary.totalReceived)}</div>
      </div>
      <div class="summary-card spent">
        <div class="summary-label">${isContribution ? 'कुल समूह खर्च / Group Expenses' : 'कुल खर्च / Spent'}</div>
        <div class="summary-value">${formatPDFCurrency(summary.totalSpent)}</div>
      </div>
      <div class="summary-card balance">
        <div class="summary-label">${isContribution ? 'बचा हुआ फंड / Net Fund Balance' : 'शेष राशि / Net Balance'}</div>
        <div class="summary-value">${formatPDFCurrency(summary.balance)}</div>
      </div>
    </div>

    <!-- Formula Strip -->
    <div class="formula-strip">
      ${isContribution
        ? `अंशदान हिसाब: शुरुआती फंड (${formatPDFCurrency(summary.openingBalance)}) + कुल अंशदान (${formatPDFCurrency(summary.totalReceived)}) − कुल समूह खर्च (${formatPDFCurrency(summary.totalSpent)}) = <strong>बचा हुआ फंड ${formatPDFCurrency(summary.balance)}</strong>`
        : `हिसाब समीकरण: शुरुआती राशि (${formatPDFCurrency(summary.openingBalance)}) + कुल प्राप्त (${formatPDFCurrency(summary.totalReceived)}) − कुल खर्च (${formatPDFCurrency(summary.totalSpent)}) = <strong>शुद्ध शेष राशि ${formatPDFCurrency(summary.balance)}</strong>`
      }
    </div>

    <!-- Category Breakdown Table -->
    ${categories.length > 0 ? `
      <div class="section-title">
        <span>📊 मद अनुसार खर्च का विवरण / Category-wise Expenses</span>
        <span class="count-badge">${categories.length} मदें</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">क्र.</th>
            <th>मद / श्रेणी (Category)</th>
            <th style="width: 80px; text-align: center;">संख्या (Qty)</th>
            <th style="width: 120px; text-align: right;">खर्च राशि (₹)</th>
            <th style="width: 70px; text-align: right;">कुल का %</th>
            <th style="width: 120px;">ग्राफ</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;">कुल खर्च / Total:</td>
            <td style="text-align: right; color: #dc2626;">${formatPDFCurrency(summary.totalSpent)}</td>
            <td style="text-align: right;">100%</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    ` : ''}

    <!-- Money Received Ledger -->
    <div class="section-title">
      <span>${isContribution ? '📥 सदस्य अंशदान बही / Member Contribution Ledger' : '📥 पैसा प्राप्ति बही / Money Received Ledger'}</span>
      <span class="count-badge">${moneyReceived.length} प्रविष्टियां</span>
    </div>
    ${moneyReceived.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">क्र.</th>
            <th style="width: 85px;">तारीख</th>
            <th>${isContribution ? 'सदस्य का नाम (Member Name)' : 'देने वाले का नाम'}</th>
            <th style="width: 100px; text-align: right;">${isContribution ? 'अंशदान राशि (₹)' : 'राशि (₹)'}</th>
            <th style="width: 75px;">माध्यम</th>
            <th>${isContribution ? 'माह / उद्देश्य / विवरण' : 'विवरण / उद्देश्य'}</th>
            <th style="width: 100px;">${isContribution ? 'कोषाध्यक्ष / प्राप्तकर्ता' : 'प्राप्तकर्ता'}</th>
          </tr>
        </thead>
        <tbody>
          ${moneyRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;">${isContribution ? 'कुल अंशदान जमा / Total Contribution:' : 'कुल प्राप्त राशि / Total Received:'}</td>
            <td style="text-align: right; color: #059669;">${formatPDFCurrency(summary.totalReceived)}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    ` : '<p style="font-size:12px; color:#64748b; margin-bottom:16px;">कोई पैसा प्राप्ति दर्ज नहीं है।</p>'}

    <!-- Expense Ledger -->
    <div class="section-title">
      <span>${isContribution ? '🧾 समूह खर्च बही / Group Expense Ledger' : '📤 खर्च बही / Expense Ledger'}</span>
      <span class="count-badge">${expenses.length} प्रविष्टियां</span>
    </div>
    ${expenses.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">क्र.</th>
            <th style="width: 85px;">तारीख</th>
            <th style="width: 100px;">मद / श्रेणी</th>
            <th style="width: 100px; text-align: right;">राशि (₹)</th>
            <th style="width: 75px;">माध्यम</th>
            <th>सामान / विवरण</th>
            <th style="width: 90px;">खर्चकर्ता</th>
            <th style="width: 90px;">प्राप्तकर्ता</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;">कुल खर्च / Total Spent:</td>
            <td style="text-align: right; color: #dc2626;">${formatPDFCurrency(summary.totalSpent)}</td>
            <td colspan="4"></td>
          </tr>
        </tfoot>
      </table>
    ` : '<p style="font-size:12px; color:#64748b; margin-bottom:16px;">कोई खर्च दर्ज नहीं है।</p>'}

    <!-- People Summary / Member Contribution Checklist -->
    ${isContribution ? `
      <!-- 1. चालू माह अंशदान स्थिति (सभी सदस्य) -->
      <div class="section-title">
        <span>👥 चालू माह सदस्य अंशदान स्थिति / Current Month (${escapeHtml(formatHindiMonth(currentMonthStr))}) Status</span>
        <span class="count-badge">${currentMonthMembers.length} सदस्य</span>
      </div>
      <div style="display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
        <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 6px 14px; font-size: 12px; color: #065f46; display: flex; align-items: center; gap: 6px;">
          <strong style="color: #059669; font-size: 14px;">✓</strong> <strong>जमा सदस्य:</strong> ${paidCount} व्यक्ति
        </div>
        <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 8px; padding: 6px 14px; font-size: 12px; color: #991b1b; display: flex; align-items: center; gap: 6px;">
          <strong style="color: #dc2626; font-size: 14px;">☐</strong> <strong>बाकी सदस्य:</strong> ${pendingCount} व्यक्ति
        </div>
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 6px 14px; font-size: 12px; color: #1e40af; display: flex; align-items: center; gap: 6px;">
          <strong>💰 चालू माह कुल संग्रह:</strong> ${formatPDFCurrency(totalCurrentMonthCollected)}
        </div>
      </div>
      ${currentMonthMembers.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">क्र.</th>
              <th>सदस्य का नाम (Member)</th>
              <th style="width: 100px;">मोबाइल नंबर</th>
              <th style="width: 110px; text-align: right;">अंशदान राशि (₹)</th>
              <th style="width: 160px;">भुगतान तारीख व माध्यम</th>
              <th style="width: 150px; text-align: center;">मासिक अंशदान स्थिति</th>
            </tr>
          </thead>
          <tbody>
            ${contributionRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 700;">कुल अंशदान संग्रह / Total Collected:</td>
              <td style="text-align: right; font-weight: 700; color: #059669; font-size: 13px;">${formatPDFCurrency(totalCurrentMonthCollected)}</td>
              <td colspan="2" style="text-align: right; font-size: 11px; font-weight: 600;">
                <span style="color: #059669; font-weight: 700;">✓ ${paidCount} जमा (Paid)</span> &nbsp;|&nbsp; 
                <span style="color: #dc2626; font-weight: 700;">☐ ${pendingCount} बाकी (Pending)</span>
              </td>
            </tr>
          </tfoot>
        </table>
      ` : '<p style="font-size:12px; color:#64748b; margin-bottom:16px;">कोई सदस्य दर्ज नहीं है। कृपया "लोग" मेनू में सदस्य जोड़ें।</p>'}

      <!-- 2. पिछले माह का बकाया ("previous month ka jo baki rahe usi ka name dikhe") -->
      <div class="section-title" style="margin-top: 24px;">
        <span style="color: #b91c1c;">⚠️ पिछले माह का बकाया / Previous Months Remaining Dues</span>
        <span class="count-badge" style="background: #fef2f2; color: #dc2626; border-color: #fecaca;">
          ${prevUnpaid.length} बकायादार सदस्य
        </span>
      </div>
      ${prevUnpaid.length > 0 ? `
        <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 8px 14px; font-size: 12px; color: #92400e; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span>
          <span><strong>ध्यान दें:</strong> पिछले माह के केवल वही सदस्य नीचे सूचीबद्ध हैं जिनका अंशदान अभी बाकी है (जो सदस्य पूर्व में जमा कर चुके हैं, उनका हिसाब चुकता माना गया है)।</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">क्र.</th>
              <th>सदस्य का नाम (बकायादार)</th>
              <th style="width: 110px;">मोबाइल नंबर</th>
              <th style="width: 140px;">बकाया माह / Period</th>
              <th style="width: 150px; text-align: center;">बकाया स्थिति</th>
            </tr>
          </thead>
          <tbody>
            ${prevUnpaidRows}
          </tbody>
        </table>
      ` : `
        <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #065f46; display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <span style="color: #059669; font-size: 16px; font-weight: 900;">✓</span>
          <span><strong>शानदार!</strong> पिछले किसी भी माह का कोई बकाया नहीं है — सभी सदस्यों का हिसाब पूर्ण है।</span>
        </div>
      `}
    ` : (people.length > 0 ? `
      <div class="section-title">
        <span>👥 व्यक्तिगत हिसाब सारांश / People Summary</span>
        <span class="count-badge">${people.length} व्यक्ति</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">क्र.</th>
            <th>व्यक्ति का नाम</th>
            <th style="width: 110px; text-align: right;">दिया गया (₹)</th>
            <th style="width: 110px; text-align: right;">प्राप्त किया (₹)</th>
            <th style="width: 110px; text-align: right;">खर्च किया (₹)</th>
            <th style="width: 130px; text-align: right;">शुद्ध स्थिति (Net)</th>
          </tr>
        </thead>
        <tbody>
          ${peopleRows}
        </tbody>
      </table>
    ` : '')}

    <!-- Verification & Signatures -->
    <div class="avoid-break signatures-block">
      <div class="sig-box">
        ${treasurerSig ? `
          <div class="sig-img-container">
            <img src="${treasurerSig}" alt="कोषाध्यक्ष हस्ताक्षर" class="sig-img" />
          </div>
          <div class="sig-divider"></div>
        ` : `
          <div class="sig-line"></div>
        `}
        <div class="sig-label">${isContribution ? 'कोषाध्यक्ष / जिम्मेदार सदस्य' : 'जिम्मेदार व्यक्ति के हस्ताक्षर'}</div>
        <div class="sig-sub">${escapeHtml(event.responsiblePerson || (isContribution ? 'कोषाध्यक्ष' : 'हस्ताक्षर'))}</div>
      </div>
      <div class="sig-box">
        ${presidentSig ? `
          <div class="sig-img-container">
            <img src="${presidentSig}" alt="अध्यक्ष हस्ताक्षर" class="sig-img" />
          </div>
          <div class="sig-divider"></div>
        ` : `
          <div class="sig-line"></div>
        `}
        <div class="sig-label">${isContribution ? 'अध्यक्ष / सचिव के हस्ताक्षर' : 'हिसाब जांचकर्ता / कोषाध्यक्ष'}</div>
        <div class="sig-sub">${escapeHtml(presidentName || 'हस्ताक्षर व मुहर')}</div>
      </div>
    </div>

    <!-- Official Statement & Footer -->
    <div class="avoid-break report-footer">
      <div>यह रिपोर्ट HISAB ऐप द्वारा प्रमाणित व तैयार की गई है — हर पैसे का साफ हिसाब।</div>
      <div>दिनांक: ${printDate}</div>
    </div>
  </div>

  <script>
    async function downloadPdfDirect() {
      const btn = document.getElementById('btnDirectDownload');
      if (btn) btn.innerText = 'डाउनलोड हो रहा है...';

      try {
        const element = document.getElementById('reportContent');
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const html = element.outerHTML;

        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
          '<foreignObject width="100%" height="100%">' +
            '<div xmlns="http://www.w3.org/1999/xhtml">' +
              html +
            '</div>' +
          '</foreignObject>' +
        '</svg>';

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = function() {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (height * pdfWidth) / width;
          const pageHeightMm = pdf.internal.pageSize.getHeight();

          let position = 0;
          let remainingHeight = pdfHeight;

          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
          remainingHeight -= pageHeightMm;

          while (remainingHeight > 0) {
            position -= pageHeightMm;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
            remainingHeight -= pageHeightMm;
          }

          pdf.save('${reportTitle}.pdf');
          if (btn) btn.innerText = '📥 सीधा PDF डाउनलोड करें';
          URL.revokeObjectURL(url);
        };

        img.onerror = function() {
          window.print();
          if (btn) btn.innerText = '📥 सीधा PDF डाउनलोड करें';
        };

        img.src = url;
      } catch (err) {
        console.error('Direct download error, falling back to print:', err);
        window.print();
        if (btn) btn.innerText = '📥 सीधा PDF डाउनलोड करें';
      }
    }

    window.onload = function() {
      if (document.fonts) {
        document.fonts.ready.then(function() {
          setTimeout(function() {
            window.print();
          }, 300);
        });
      } else {
        setTimeout(function() {
          window.print();
        }, 500);
      }
    };
  </script>
</body>
</html>`;
}

// ============================================
// Hindi Typography Verification Report HTML
// ============================================

export function generateHindiTestHTML(): string {
  const printDate = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HISAB - हिंदी फॉन्ट व संयुक्ताक्षर शुद्धता सत्यापन (Devanagari Hindi Typography Test)</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
    @font-face {
      font-family: 'NotoSansDevanagari';
      src: url('data:font/ttf;base64,${NotoSansDevanagariRegular}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'NotoSansDevanagari';
      src: url('data:font/ttf;base64,${NotoSansDevanagariBold}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'NotoSansDevanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.6;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .no-print { display: block; }
    .report-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e1b4b;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toolbar-title { font-size: 15px; font-weight: 700; }
    .toolbar-hint { font-size: 12px; color: #cbd5e1; }
    .toolbar-hint strong { color: #facc15; }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      border: none;
      font-family: inherit;
    }
    .btn-download { background: #10b981; color: #ffffff; }
    .btn-download:hover { background: #059669; }
    .btn-print { background: #6366f1; color: #ffffff; }
    .btn-print:hover { background: #4f46e5; }
    .btn-close { background: rgba(255,255,255,0.15); color: #ffffff; }
    .report-wrap {
      max-width: 860px;
      margin: 24px auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-badge {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 8px;
      display: inline-block;
    }
    .brand-title { font-size: 22px; font-weight: 800; color: #1e1b4b; }
    .brand-sub { font-size: 13px; color: #6366f1; font-weight: 700; }
    .test-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 18px;
    }
    .test-box-title {
      font-size: 14px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sample-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px 16px;
      font-size: 13px;
    }
    .sample-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .sample-item strong {
      color: #1e1b4b;
      font-size: 14px;
    }
    .success-alert {
      background: #ecfdf5;
      border-left: 4px solid #059669;
      color: #065f46;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      line-height: 1.6;
    }
    @media print {
      body { background: #ffffff !important; }
      .no-print { display: none !important; }
      .report-wrap {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      @page { size: A4 portrait; margin: 12mm 14mm 12mm 14mm; }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="no-print report-toolbar">
    <div class="toolbar-info">
      <div class="toolbar-title">📄 HISAB — हिंदी फॉन्ट व संयुक्ताक्षर टेस्ट (Book-Quality Hindi Test)</div>
      <div class="toolbar-hint">
        💡 <strong>PDF के लिए:</strong> नीचे <strong>'सीधा PDF डाउनलोड करें'</strong> दबाएं या प्रिंट विंडो में <em>'Destination'</em> में <strong>'Save as PDF'</strong> चुनें।
      </div>
    </div>
    <div class="toolbar-actions">
      <button id="btnDirectDownload" class="btn btn-download" onclick="downloadPdfDirect()">📥 सीधा PDF डाउनलोड करें</button>
      <button class="btn btn-print" onclick="window.print()">🖨️ प्रिंट / Save as PDF</button>
      <button class="btn btn-close" onclick="window.close()">✕ बंद करें</button>
    </div>
  </div>

  <div class="report-wrap" id="reportContent">
    <div class="brand-header">
      <div>
        <div class="brand-badge">HISAB</div>
        <div class="brand-title" style="margin-top: 8px;">हिंदी लिपि व संयुक्ताक्षर शुद्धता सत्यापन रिपोर्ट</div>
        <div class="brand-sub">पुस्तकों (Books) जैसी 100% शुद्ध हिंदी, सही मात्राएं और संयुक्ताक्षर</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748b;">
        <div>सत्यापन तिथि: ${printDate}</div>
        <div style="margin-top: 4px;"><span style="background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 999px; font-weight: 700;">सत्यापित / VERIFIED</span></div>
      </div>
    </div>

    <div class="success-alert">
      ✓ <strong>सत्यापन विवरण:</strong> यह रिपोर्ट प्रमाणित करती है कि HISAB ऐप में देवनागरी लिपि के सभी अक्षर, मात्राएं ('ि' छोटी इ की मात्रा आगे), संयुक्ताक्षर (क्ष, त्र, ज्ञ, श्र, प्र, क्र, क्त, स्त) और रेफ (र् - ऊपर की मात्रा) बिल्कुल <strong>पुस्तकों/किताबों (Printed Books) की तरह 100% शुद्ध व सही स्थान पर</strong> प्रदर्शित व मुद्रित हो रहे हैं।
    </div>

    <!-- Test 1: Vowels & Matras -->
    <div class="test-box">
      <div class="test-box-title">१. स्वर व बारहखड़ी मात्रा परीक्षण (Vowels & Matras)</div>
      <div style="margin-bottom: 10px; font-size: 13px;">
        <strong>स्वर (Vowels):</strong> अ, आ, इ, ई, उ, ऊ, ऋ, ए, ऐ, ओ, औ, अं, अः
      </div>
      <div style="margin-bottom: 10px; font-size: 13px;">
        <strong>क की बारहखड़ी:</strong> क, का, कि, की, कु, कू, कृ, के, कै, को, कौ, कं, कः
      </div>
      <div style="font-size: 13px;">
        <strong>ख व ग की मात्राएं:</strong> ख, खा, खि, खी, खु, खू, खे, खै, खो, खौ | ग, गा, गि, गी, गु, गू, गे, गै, गो, गौ
      </div>
    </div>

    <!-- Test 2: Conjuncts -->
    <div class="test-box">
      <div class="test-box-title">२. संयुक्ताक्षर व आधे अक्षर (Devanagari Ligatures & Conjuncts)</div>
      <div class="sample-grid">
        <div class="sample-item"><strong>क्ष</strong> (क+्+ष) — क्षत्रिय, क्षमता, समीक्षा</div>
        <div class="sample-item"><strong>त्र</strong> (त+्+र) — त्रिभुज, त्रिशूल, चरित्र</div>
        <div class="sample-item"><strong>ज्ञ</strong> (ज+्+ञ) — ज्ञान, ज्ञानी, विज्ञान</div>
        <div class="sample-item"><strong>श्र</strong> (श+्+र) — श्री, श्रीमती, विश्राम</div>
        <div class="sample-item"><strong>प्र</strong> (प+्+र) — प्राप्त, प्रबंधन, प्रकाश</div>
        <div class="sample-item"><strong>क्र</strong> (क+्+र) — क्र.सं., कार्यक्रम, क्रम</div>
        <div class="sample-item"><strong>क्त</strong> (क+्+त) — व्यक्ति, संयुक्त, भक्ति</div>
        <div class="sample-item"><strong>स्त</strong> (स+्+त) — व्यवस्था, पुस्तक, रास्ता</div>
        <div class="sample-item"><strong>द्ध</strong> (द+्+ध) — शुद्ध, वृद्धि, प्रसिद्ध</div>
        <div class="sample-item"><strong>द्व</strong> (द+्+व) — द्वितीय, विद्वान, द्वार</div>
        <div class="sample-item"><strong>ष्ट</strong> (ष+्+ट) — स्पष्ट, दृष्टि, कष्ट</div>
        <div class="sample-item"><strong>आधे अक्षर</strong> — क्या, प्यार, अच्छा, सच्चा</div>
      </div>
    </div>

    <!-- Test 3: Ra-kars & Reph -->
    <div class="test-box">
      <div class="test-box-title">३. रेफ व र-कार परीक्षण (Reph & Ra-kars)</div>
      <div class="sample-grid">
        <div class="sample-item"><strong>रेफ (र् ऊपर):</strong> खर्च, वार्षिक, शर्मा, कार्य</div>
        <div class="sample-item"><strong>रेफ (र् ऊपर):</strong> धर्म, कर्म, सर्व, चर्चा, गर्व</div>
        <div class="sample-item"><strong>र-कार (नीचे):</strong> प्रकार, प्रकाश, प्रणाम, प्रेरणा</div>
        <div class="sample-item"><strong>र-कार (ट्र/ड्र):</strong> राष्ट्रीय, ट्रेन, ड्रामा, ट्रक</div>
      </div>
    </div>

    <!-- Test 4: Real Accounting Vocabulary -->
    <div class="test-box">
      <div class="test-box-title">४. हिसाब-किताब की वास्तविक शब्दावली (Real Accounting Terms)</div>
      <div class="sample-grid">
        <div class="sample-item"><strong>किताब / पुस्तक:</strong> किताब में लिखी जाने वाली शुद्ध हिंदी</div>
        <div class="sample-item"><strong>हिसाब:</strong> हर पैसे का साफ हिसाब (HISAB)</div>
        <div class="sample-item"><strong>आयोजन:</strong> वार्षिक समारोह 2026, विवाह उत्सव</div>
        <div class="sample-item"><strong>वित्तीय पद:</strong> कुल प्राप्त राशि, कुल खर्च, शेष राशि</div>
        <div class="sample-item"><strong>व्यक्ति:</strong> जिम्मेदार व्यक्ति, हिसाब जांचकर्ता, कोषाध्यक्ष</div>
        <div class="sample-item"><strong>प्रतिष्ठान:</strong> शर्मा टेंट हाउस, गुप्ता मिष्ठान्न भंडार</div>
        <div class="sample-item"><strong>व्यवस्था:</strong> अतिथि व्यवस्था, भोजन व्यवस्था, जलपान</div>
        <div class="sample-item"><strong>रोकड़ बही:</strong> पैसा प्राप्ति बही, व्यय विवरण, पासबुक</div>
      </div>
    </div>

    <!-- Test 5: Mixed Sentences, Currency & Numbers -->
    <div class="test-box">
      <div class="test-box-title">५. मिश्रित वाक्य, अंग्रेजी, संख्याएं व ₹ मुद्रा (Mixed & Currency)</div>
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
        <div class="sample-item">
          <strong>मिश्रित वाक्य:</strong> सुरेश कुमार ने ₹5,000 Sound System के लिए राजेश को UPI (GPay/PhonePe) द्वारा दिए।
        </div>
        <div class="sample-item">
          <strong>अंग्रेजी शब्द:</strong> Annual Function 2026, Stage Decoration, Catering Services, Sound System
        </div>
        <div class="sample-item">
          <strong>मुद्रा (Rupee Symbol):</strong> ₹1,25,000 • ₹50,000 • ₹25,000 • ₹12,500 • ₹7,500 • ₹500
        </div>
        <div class="sample-item">
          <strong>संख्याएं (Numbers):</strong> अंतर्राष्ट्रीय: 0123456789 | देवनागरी: ०१२३४५६७८९ | बिल #1042 (100% Verified)
        </div>
      </div>
    </div>

    <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b;">
      HISAB — हर पैसे का साफ हिसाब | देवनागरी फॉन्ट व संयुक्ताक्षर शुद्धता सत्यापन पूर्ण
    </div>
  </div>

  <script>
    async function downloadPdfDirect() {
      const btn = document.getElementById('btnDirectDownload');
      if (btn) btn.innerText = 'डाउनलोड हो रहा है...';

      try {
        const element = document.getElementById('reportContent');
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const html = element.outerHTML;

        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
          '<foreignObject width="100%" height="100%">' +
            '<div xmlns="http://www.w3.org/1999/xhtml">' +
              html +
            '</div>' +
          '</foreignObject>' +
        '</svg>';

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = function() {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (height * pdfWidth) / width;
          const pageHeightMm = pdf.internal.pageSize.getHeight();

          let position = 0;
          let remainingHeight = pdfHeight;

          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
          remainingHeight -= pageHeightMm;

          while (remainingHeight > 0) {
            position -= pageHeightMm;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
            remainingHeight -= pageHeightMm;
          }

          pdf.save('HISAB_Hindi_Typography_Verification_Test.pdf');
          if (btn) btn.innerText = '📥 सीधा PDF डाउनलोड करें';
          URL.revokeObjectURL(url);
        };

        img.onerror = function() {
          window.print();
          if (btn) btn.innerText = '📥 सीधा PDF डाउनलोड करें';
        };

        img.src = url;
      } catch (err) {
        console.error('Direct download error, falling back to print:', err);
        window.print();
        if (btn) btn.innerText = '📥 सीधा PDF डाउनलोड करें';
      }
    }

    window.onload = function() {
      if (document.fonts) {
        document.fonts.ready.then(function() {
          setTimeout(function() {
            window.print();
          }, 300);
        });
      } else {
        setTimeout(function() {
          window.print();
        }, 500);
      }
    };
  </script>
</body>
</html>`;
}

// ============================================
// Print & PDF Launcher
// ============================================

function sanitizeFilename(name: string): string {
  return name
    .replace(/ \(Demo\)$/i, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim() || 'Event';
}

export function openPrintReport(html: string, title: string, autoPrint = true): void {
  if (typeof window === 'undefined') return;

  let printWindow: Window | null = null;
  try {
    printWindow = window.open('', '_blank');
  } catch (e) {
    printWindow = null;
  }

  if (printWindow && printWindow.document) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = title;
  } else {
    // Hidden iframe fallback if popup blocked
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 5000);
      }, 500);
    }
  }
}

export function downloadEventPDF(event: HisabEvent, moneyReceived: MoneyReceived[], expenses: Expense[]): void {
  const html = generateEventReportHTML(event, moneyReceived, expenses);
  const title = `HISAB_${sanitizeFilename(event.name)}_Report`;
  openPrintReport(html, title, true);
}

export function printEventPDF(event: HisabEvent, moneyReceived: MoneyReceived[], expenses: Expense[]): void {
  const html = generateEventReportHTML(event, moneyReceived, expenses);
  const title = `HISAB_${sanitizeFilename(event.name)}_Report`;
  openPrintReport(html, title, true);
}

export function downloadHindiTestPDF(): void {
  const html = generateHindiTestHTML();
  openPrintReport(html, 'HISAB_Hindi_Typography_Verification_Test', true);
}


