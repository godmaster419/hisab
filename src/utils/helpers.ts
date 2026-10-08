// ============================================
// HISAB - Utility Functions
import type { MoneyReceived } from '@/types';

/**
 * Format number in Indian numbering system (₹1,25,000)
 */
export function formatIndianCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const parts = absAmount.toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian numbering: last 3, then groups of 2
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = groups + ',' + last3;
  }

  const formatted = decPart === '00' ? intPart : `${intPart}.${decPart}`;
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Short Indian currency format (no decimals unless needed)
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const parts = absAmount.toString().split('.');
  let intPart = parts[0];

  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = groups + ',' + last3;
  }

  return `${isNegative ? '-' : ''}₹${intPart}`;
}

/**
 * Currency format for PDF generation — uses ₹ symbol (works with embedded Devanagari font)
 */
export function formatPDFCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const parts = absAmount.toString().split('.');
  let intPart = parts[0];

  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = groups + ',' + last3;
  }

  return `${isNegative ? '-' : ''}₹${intPart}`;
}

/**
 * Format date to DD MMM YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get category color for charts
 */
export function getCategoryColor(index: number): string {
  const colors = [
    '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#06b6d4',
  ];
  return colors[index % colors.length];
}

/**
 * Calculate percentage
 */
export function calcPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * CN - classnames utility (simple version)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Category label map
 */
export const CATEGORY_LABELS: Record<string, { en: string; hi: string }> = {
  food: { en: 'Food / Grocery', hi: 'खाना / किराना' },
  decoration: { en: 'Decoration', hi: 'सजावट' },
  transportation: { en: 'Transport / Fuel', hi: 'यातायात / पेट्रोल' },
  printing: { en: 'Printing', hi: 'प्रिंटिंग' },
  equipment: { en: 'Equipment', hi: 'उपकरण' },
  shopping: { en: 'Shopping', hi: 'खरीदारी' },
  refreshment: { en: 'Refreshment / Snacks', hi: 'चाय-नाश्ता' },
  bills: { en: 'Bills / Recharge', hi: 'बिल व मोबाइल रिचार्ज' },
  medical: { en: 'Medical / Health', hi: 'दवा व इलाज' },
  miscellaneous: { en: 'Miscellaneous', hi: 'विविध' },
  other: { en: 'Other', hi: 'अन्य' },
};

/**
 * Payment method label map
 */
export const PAYMENT_LABELS: Record<string, { en: string; hi: string }> = {
  cash: { en: 'Cash', hi: 'नकद' },
  upi: { en: 'UPI', hi: 'UPI' },
  bank_transfer: { en: 'Bank Transfer', hi: 'बैंक ट्रांसफर' },
  other: { en: 'Other', hi: 'अन्य' },
};

/**
 * Format YYYY-MM to readable Hindi & English month name
 */
export function formatMonthYear(yyyyMm: string): string {
  if (!yyyyMm || yyyyMm === 'all') return 'सभी महीने / All Months';
  const [yearStr, monthStr] = yyyyMm.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return yyyyMm;
  const date = new Date(year, month - 1, 1);
  const hiMonth = date.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
  const enMonth = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${hiMonth} (${enMonth})`;
}

/**
 * Get Hindi month title (e.g. "अक्टूबर 2026")
 */
export function formatHindiMonth(yyyyMm: string): string {
  if (!yyyyMm || yyyyMm === 'all') return 'सभी महीने';
  const [yearStr, monthStr] = yyyyMm.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return yyyyMm;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
}

/**
 * Get previous month string in YYYY-MM format
 */
export function getPreviousMonthStr(yyyyMm: string): string {
  if (!yyyyMm || yyyyMm === 'all') return '2026-09';
  const [yearStr, monthStr] = yyyyMm.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Get next month string in YYYY-MM format
 */
export function getNextMonthStr(yyyyMm: string): string {
  if (!yyyyMm || yyyyMm === 'all') return '2026-11';
  const [yearStr, monthStr] = yyyyMm.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Get current month string in YYYY-MM format
 */
export function getCurrentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export interface MonthContributionMember {
  name: string;
  mobile: string;
  totalContributed: number;
  hasContributed: boolean;
  paymentDates: string[];
  paymentMethods: string[];
  transactions: MoneyReceived[];
}

export interface PreviousMonthUnpaidRecord {
  name: string;
  mobile: string;
  month: string;
  monthLabel: string;
}

/**
 * Get sorted distinct YYYY-MM months for a contribution event
 */
export function getContributionMonths(
  event: { startDate?: string; endDate?: string },
  moneyReceived: { date?: string }[],
  expenses?: { date?: string }[]
): string[] {
  const currentMonth = getCurrentMonthStr();
  const set = new Set<string>();
  set.add(currentMonth);

  if (event.startDate && event.startDate.length >= 7) {
    set.add(event.startDate.slice(0, 7));
  }
  if (event.endDate && event.endDate.length >= 7) {
    set.add(event.endDate.slice(0, 7));
  }
  moneyReceived.forEach((m) => {
    if (m.date && m.date.length >= 7) set.add(m.date.slice(0, 7));
  });
  if (expenses) {
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) set.add(e.date.slice(0, 7));
    });
  }

  // Filter valid YYYY-MM format and sort descending (latest first)
  return Array.from(set)
    .filter((m) => /^\d{4}-\d{2}$/.test(m))
    .sort((a, b) => b.localeCompare(a));
}

/**
 * Get member contribution status for a specific month
 * "jo jis month me diya hai wo usi month dikhe"
 */
export function getMonthContributionMembers(
  moneyReceived: MoneyReceived[],
  targetMonth: string,
  registeredPeople: { name: string; mobile?: string }[]
): MonthContributionMember[] {
  const map = new Map<string, MonthContributionMember>();

  // 1. All registered people
  registeredPeople.forEach((p) => {
    const key = p.name.trim().toLowerCase();
    map.set(key, {
      name: p.name.trim(),
      mobile: p.mobile ? p.mobile.trim() : '',
      totalContributed: 0,
      hasContributed: false,
      paymentDates: [],
      paymentMethods: [],
      transactions: [],
    });
  });

  // 2. Only payments belonging to targetMonth ("jo jis month me diya hai wo usi month dikhe")
  const monthTransactions = moneyReceived.filter(
    (m) => m.date && m.date.startsWith(targetMonth)
  );

  monthTransactions.forEach((m) => {
    const key = m.givenBy.trim().toLowerCase();
    let member = map.get(key);
    if (!member) {
      member = {
        name: m.givenBy.trim(),
        mobile: '',
        totalContributed: 0,
        hasContributed: false,
        paymentDates: [],
        paymentMethods: [],
        transactions: [],
      };
      map.set(key, member);
    }
    member.totalContributed += m.amount;
    member.hasContributed = true;
    member.transactions.push(m);

    const mode = PAYMENT_LABELS[m.paymentMethod]?.hi || m.paymentMethod || 'नकद';
    if (!member.paymentMethods.includes(mode)) {
      member.paymentMethods.push(mode);
    }
    const dStr = formatDate(m.date);
    if (!member.paymentDates.includes(dStr)) {
      member.paymentDates.push(dStr);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.hasContributed && !b.hasContributed) return -1;
    if (!a.hasContributed && b.hasContributed) return 1;
    return a.name.localeCompare(b.name, 'hi');
  });
}

/**
 * Get unpaid members from previous months
 * "previous month ka jo baki rahe usi ka name dikhe"
 */
export function getPreviousMonthsUnpaid(
  allMonths: string[],
  currentMonthStr: string,
  moneyReceived: MoneyReceived[],
  registeredPeople: { name: string; mobile?: string }[]
): PreviousMonthUnpaidRecord[] {
  // Only months strictly before the current month, sorted oldest to newest
  const priorMonths = allMonths.filter((m) => m < currentMonthStr).sort();
  const unpaidRecords: PreviousMonthUnpaidRecord[] = [];

  priorMonths.forEach((pm) => {
    const pmTransactions = moneyReceived.filter(
      (m) => m.date && m.date.startsWith(pm)
    );
    const paidNames = new Set(
      pmTransactions.map((m) => m.givenBy.trim().toLowerCase())
    );

    registeredPeople.forEach((p) => {
      const key = p.name.trim().toLowerCase();
      // If person didn't pay in this previous month, they are unpaid ("jo baki rahe")
      if (!paidNames.has(key)) {
        unpaidRecords.push({
          name: p.name.trim(),
          mobile: p.mobile ? p.mobile.trim() : '',
          month: pm,
          monthLabel: formatHindiMonth(pm),
        });
      }
    });
  });

  return unpaidRecords;
}
