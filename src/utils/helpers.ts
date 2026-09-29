// ============================================
// HISAB - Utility Functions
// ============================================

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
  food: { en: 'Food', hi: 'खाना' },
  decoration: { en: 'Decoration', hi: 'सजावट' },
  transportation: { en: 'Transportation', hi: 'यातायात' },
  printing: { en: 'Printing', hi: 'प्रिंटिंग' },
  equipment: { en: 'Equipment', hi: 'उपकरण' },
  shopping: { en: 'Shopping', hi: 'खरीदारी' },
  refreshment: { en: 'Refreshment', hi: 'जलपान' },
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
