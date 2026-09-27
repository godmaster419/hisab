// ============================================
// HISAB - Export Utilities (CSV / Excel / JSON)
// ============================================

import { HisabEvent, MoneyReceived, Expense } from '@/types';
import { formatDate, CATEGORY_LABELS, PAYMENT_LABELS } from '@/utils/helpers';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export money received as CSV
 */
export function exportMoneyReceivedCSV(event: HisabEvent, data: MoneyReceived[]) {
  const headers = ['Date,Given By,Amount,Deposited With,Purpose,Payment Mode,Note'];
  const rows = data.map((m) =>
    [
      formatDate(m.date),
      `"${m.givenBy}"`,
      m.amount,
      `"${m.depositedWith}"`,
      `"${m.purpose}"`,
      PAYMENT_LABELS[m.paymentMethod]?.en || m.paymentMethod,
      `"${m.note}"`,
    ].join(',')
  );
  const csv = [...headers, ...rows].join('\n');
  downloadFile(csv, `${event.name}_MoneyReceived.csv`, 'text/csv');
}

/**
 * Export expenses as CSV
 */
export function exportExpensesCSV(event: HisabEvent, data: Expense[]) {
  const headers = ['Date,Spent By,Paid To,Amount,Category,Purpose,Payment Mode,Note,Items'];
  const rows = data.map((e) => {
    const itemsStr = e.items.map((it) => `${it.itemName}(${it.quantity}×${it.rate}=${it.total})`).join('; ');
    return [
      formatDate(e.date),
      `"${e.spentBy}"`,
      `"${e.paidTo}"`,
      e.amount,
      CATEGORY_LABELS[e.category]?.en || e.category,
      `"${e.purpose}"`,
      PAYMENT_LABELS[e.paymentMethod]?.en || e.paymentMethod,
      `"${e.note}"`,
      `"${itemsStr}"`,
    ].join(',');
  });
  const csv = [...headers, ...rows].join('\n');
  downloadFile(csv, `${event.name}_Expenses.csv`, 'text/csv');
}

/**
 * Export complete event data as Excel (using xlsx)
 */
export async function exportEventExcel(
  event: HisabEvent,
  moneyReceived: MoneyReceived[],
  expenses: Expense[]
) {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['HISAB - Event Report'],
    [''],
    ['Event Name', event.name],
    ['Start Date', formatDate(event.startDate)],
    ['End Date', event.endDate ? formatDate(event.endDate) : '-'],
    ['Responsible Person', event.responsiblePerson || '-'],
    ['Opening Balance', event.openingBalance],
    [''],
    ['Total Received', moneyReceived.reduce((s, m) => s + m.amount, 0)],
    ['Total Spent', expenses.reduce((s, e) => s + e.amount, 0)],
    ['Balance', event.openingBalance + moneyReceived.reduce((s, m) => s + m.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Money Received sheet
  const moneyData = [
    ['Date', 'Given By', 'Amount (₹)', 'Deposited With', 'Purpose', 'Payment Mode', 'Note'],
    ...moneyReceived.map((m) => [
      formatDate(m.date), m.givenBy, m.amount, m.depositedWith, m.purpose,
      PAYMENT_LABELS[m.paymentMethod]?.en || m.paymentMethod, m.note,
    ]),
  ];
  const wsMoney = XLSX.utils.aoa_to_sheet(moneyData);
  XLSX.utils.book_append_sheet(wb, wsMoney, 'Money Received');

  // Expenses sheet
  const expenseData = [
    ['Date', 'Spent By', 'Paid To', 'Amount (₹)', 'Category', 'Purpose', 'Payment Mode', 'Note'],
    ...expenses.map((e) => [
      formatDate(e.date), e.spentBy, e.paidTo, e.amount,
      CATEGORY_LABELS[e.category]?.en || e.category, e.purpose,
      PAYMENT_LABELS[e.paymentMethod]?.en || e.paymentMethod, e.note,
    ]),
  ];
  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // Items sheet
  const allItems = expenses.flatMap((e) =>
    e.items.map((it) => ({
      expenseDate: formatDate(e.date),
      spentBy: e.spentBy,
      paidTo: e.paidTo,
      ...it,
    }))
  );
  if (allItems.length > 0) {
    const itemData = [
      ['Date', 'Spent By', 'Paid To', 'Item', 'Quantity', 'Unit', 'Rate (₹)', 'Total (₹)'],
      ...allItems.map((it) => [
        it.expenseDate, it.spentBy, it.paidTo, it.itemName, it.quantity, it.unit, it.rate, it.total,
      ]),
    ];
    const wsItems = XLSX.utils.aoa_to_sheet(itemData);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Items');
  }

  XLSX.writeFile(wb, `HISAB_${event.name.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Export all app data as JSON backup
 */
export function exportBackupJSON(data: object) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `HISAB_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}
