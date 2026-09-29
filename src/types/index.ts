// ============================================
// HISAB - Type Definitions
// ============================================

export interface HisabEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  responsiblePerson: string;
  openingBalance: number;
  isArchived: boolean;
  isDemo?: boolean; // Flag to identify demo/sample events
  createdAt: string;
  updatedAt: string;
}

export interface MoneyReceived {
  id: string;
  eventId: string;
  amount: number;
  givenBy: string;
  depositedWith: string;
  date: string;
  purpose: string;
  paymentMethod: PaymentMethod;
  note: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  eventId: string;
  amount: number;
  spentBy: string;
  paidTo: string;
  date: string;
  category: ExpenseCategory;
  purpose: string;
  paymentMethod: PaymentMethod;
  note: string;
  items: ExpenseItem[];
  isDemo?: boolean;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

// ============================================
// PEOPLE MANAGEMENT
// ============================================

export interface HisabPerson {
  id: string;
  name: string;
  mobile: string;
  note: string;
  status: 'active' | 'inactive';
  eventIds: string[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  name: string;
  eventIds: string[];
  totalGiven: number;
  totalReceived: number;
  totalSpent: number;
  transactionCount: number;
}

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

export type ExpenseCategory =
  | 'food'
  | 'decoration'
  | 'transportation'
  | 'printing'
  | 'equipment'
  | 'shopping'
  | 'refreshment'
  | 'miscellaneous'
  | 'other';

export interface Transaction {
  id: string;
  eventId: string;
  type: 'income' | 'expense';
  amount: number;
  from: string;
  to: string;
  date: string;
  purpose: string;
  category?: ExpenseCategory;
  paymentMethod: PaymentMethod;
  note: string;
  createdAt: string;
}

export interface EventSummary {
  totalReceived: number;
  totalSpent: number;
  balance: number;
  openingBalance: number;
  incomeCount: number;
  expenseCount: number;
  totalTransactions: number;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amount: number;
  count: number;
  percentage: number;
}

export interface PersonSummary {
  name: string;
  moneyGiven: number;
  moneyReceived: number;
  moneySpent: number;
  transactionCount: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'hi' | 'en' | 'both';
  currency: string;
  currencySymbol: string;
  demoDataLoaded?: boolean;
  demoDataDeleted?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'both',
  currency: 'INR',
  currencySymbol: '₹',
  demoDataLoaded: false,
  demoDataDeleted: false,
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; labelHi: string }[] = [
  { value: 'cash', label: 'Cash', labelHi: 'नकद' },
  { value: 'upi', label: 'UPI', labelHi: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer', labelHi: 'बैंक ट्रांसफर' },
  { value: 'other', label: 'Other', labelHi: 'अन्य' },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; labelHi: string; icon: string }[] = [
  { value: 'food', label: 'Food', labelHi: 'खाना', icon: '🍽️' },
  { value: 'decoration', label: 'Decoration', labelHi: 'सजावट', icon: '🎨' },
  { value: 'transportation', label: 'Transportation', labelHi: 'यातायात', icon: '🚗' },
  { value: 'printing', label: 'Printing', labelHi: 'प्रिंटिंग', icon: '🖨️' },
  { value: 'equipment', label: 'Equipment', labelHi: 'उपकरण', icon: '🔧' },
  { value: 'shopping', label: 'Shopping', labelHi: 'खरीदारी', icon: '🛍️' },
  { value: 'refreshment', label: 'Refreshment', labelHi: 'जलपान', icon: '🥤' },
  { value: 'miscellaneous', label: 'Miscellaneous', labelHi: 'विविध', icon: '📦' },
  { value: 'other', label: 'Other', labelHi: 'अन्य', icon: '📋' },
];

export const ITEM_UNITS = [
  'piece', 'kg', 'gram', 'litre', 'ml', 'meter', 'feet',
  'box', 'packet', 'bundle', 'dozen', 'pair', 'set', 'bottle', 'plate', 'bag',
];

export const PURPOSE_SUGGESTIONS = [
  'Event Fund', 'Decoration', 'Food', 'Transportation', 'General Expense',
  'Guest Arrangement', 'Printing', 'Equipment', 'Refreshment', 'Venue',
  'Sound System', 'Photography', 'Gifts', 'Cleaning', 'Security',
];
