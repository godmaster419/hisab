// ============================================
// HISAB - Type Definitions
// ============================================

export type HisabEventType = 'contribution' | 'len_den' | 'dukandar_diary' | 'personal_expense';

export interface EventTypeConfig {
  value: HisabEventType;
  label: string;
  labelHi: string;
  shortHi: string;
  descHi: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
  incomeLabel: string;
  expenseLabel: string;
  balanceLabel: string;
  personRole: string;
}

export const EVENT_TYPES: EventTypeConfig[] = [
  {
    value: 'personal_expense',
    label: 'Personal Expense',
    labelHi: 'पर्सनल खर्च / दैनिक व्यय (Daily Expenses)',
    shortHi: 'पर्सनल खर्च',
    descHi: 'दैनिक व्यक्तिगत खर्च, घर-परिवार, पॉकेट मनी और डेली बजट हिसाब',
    icon: '👛',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    badgeColor: '#ec4899',
    incomeLabel: 'रुपये आए / आय / पॉकेट मनी (Income In)',
    expenseLabel: 'दैनिक खर्च (Daily Expenses)',
    balanceLabel: 'बचा हुआ बैलेंस (Savings / Balance)',
    personRole: 'व्यक्ति का नाम / मेरा नाम (My Name / Person)',
  },
  {
    value: 'contribution',
    label: 'Contribution',
    labelHi: 'कंट्रीब्यूशन / मासिक अंशदान',
    shortHi: 'कंट्रीब्यूशन',
    descHi: 'समिति, चंदा, मासिक कंट्रीब्यूशन या ग्रुप फंड हिसाब',
    icon: '💰',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeColor: '#6366f1',
    incomeLabel: 'अंशदान प्राप्त (Contribution Received)',
    expenseLabel: 'समूह खर्च (Group Expense)',
    balanceLabel: 'बचा हुआ फंड (Fund Balance)',
    personRole: 'कोषाध्यक्ष / जिम्मेदार सदस्य (Treasurer / Member)',
  },
  {
    value: 'len_den',
    label: 'Len-Den',
    labelHi: 'लेन-देन / सामान्य आय-व्यय',
    shortHi: 'लेन-देन',
    descHi: 'आयोजन, शादी-पार्टी, टूर या सामान्य आय-व्यय',
    icon: '🔄',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeColor: '#3b82f6',
    incomeLabel: 'रुपये आए / आय (Money In)',
    expenseLabel: 'रुपये गए / खर्च (Money Out)',
    balanceLabel: 'शेष बचत (Balance)',
    personRole: 'जिम्मेदार व्यक्ति (Person Responsible)',
  },
  {
    value: 'dukandar_diary',
    label: 'Dukandar Diary',
    labelHi: 'दुकानदार डायरी (ग्राहक सामान लेन-देन)',
    shortHi: 'दुकानदार डायरी',
    descHi: 'ग्राहक को सामान देना, उधारी और जमा का हिसाब-किताब',
    icon: '📖',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeColor: '#059669',
    incomeLabel: 'जमा राशि मिली (Jama / Payment)',
    expenseLabel: 'सामान दिया / उधारी (Saman Diya / Udhar)',
    balanceLabel: 'बाकी हिसाब / बैलेंस (Net Balance)',
    personRole: 'दुकानदार / संचालक का नाम (Shop Owner / Vendor)',
  },
];

export function getEventTypeConfig(type?: HisabEventType): EventTypeConfig {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[1];
}

export interface HisabEvent {
  id: string;
  name: string;
  eventType?: HisabEventType;
  startDate: string;
  endDate: string;
  description: string;
  responsiblePerson: string;
  openingBalance: number;
  isArchived: boolean;
  isDemo?: boolean; // Flag to identify demo/sample events
  createdAt: string;
  updatedAt: string;
  treasurerSignature?: string;
  presidentSignature?: string;
  presidentName?: string;
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
  | 'bills'
  | 'medical'
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

export type MonthlyEntryType = 'contribution' | 'expense';
export type MonthlyContributionStatus = 'paid' | 'unpaid';

export interface MonthlyEntry {
  id: string;
  type: MonthlyEntryType;
  memberName: string;
  title: string;
  status: MonthlyContributionStatus;
  amount: number;
  collectedBy: string;
  spentBy: string;
  location: string;
  date: string;
  note?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface MonthlySummary {
  selectedMonth: string;
  previousRemainingBalance: number;
  previousMonthStr: string;
  previousMonthLabel: string;
  totalCollected: number;
  totalUnpaid: number;
  totalSpent: number;
  totalAvailable: number;
  netBalance: number;
  paidCount: number;
  unpaidCount: number;
  expenseCount: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'hi' | 'en' | 'both';
  currency: string;
  currencySymbol: string;
  demoDataLoaded?: boolean;
  demoDataDeleted?: boolean;
  dashboardViewMode?: 'both' | 'events' | 'contributions';
  includePreviousMonthBalance?: boolean;
  defaultTreasurerSignature?: string;
  defaultPresidentSignature?: string;
  defaultPresidentName?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'both',
  currency: 'INR',
  currencySymbol: '₹',
  demoDataLoaded: false,
  demoDataDeleted: false,
  dashboardViewMode: 'both',
  includePreviousMonthBalance: true,
  defaultTreasurerSignature: '',
  defaultPresidentSignature: '',
  defaultPresidentName: '',
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; labelHi: string }[] = [
  { value: 'cash', label: 'Cash', labelHi: 'नकद' },
  { value: 'upi', label: 'UPI', labelHi: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer', labelHi: 'बैंक ट्रांसफर' },
  { value: 'other', label: 'Other', labelHi: 'अन्य' },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; labelHi: string; icon: string }[] = [
  { value: 'food', label: 'Food / Grocery', labelHi: 'खाना / किराना', icon: '🍽️' },
  { value: 'transportation', label: 'Transport / Fuel', labelHi: 'यातायात / पेट्रोल', icon: '🚗' },
  { value: 'shopping', label: 'Shopping', labelHi: 'खरीदारी', icon: '🛍️' },
  { value: 'bills', label: 'Bills / Recharge', labelHi: 'बिल व मोबाइल रिचार्ज', icon: '📱' },
  { value: 'medical', label: 'Medical / Health', labelHi: 'दवा व इलाज', icon: '💊' },
  { value: 'refreshment', label: 'Refreshment / Snacks', labelHi: 'चाय-नाश्ता', icon: '🥤' },
  { value: 'decoration', label: 'Decoration', labelHi: 'सजावट', icon: '🎨' },
  { value: 'printing', label: 'Printing', labelHi: 'प्रिंटिंग', icon: '🖨️' },
  { value: 'equipment', label: 'Equipment', labelHi: 'उपकरण', icon: '🔧' },
  { value: 'miscellaneous', label: 'Miscellaneous', labelHi: 'विविध', icon: '📦' },
  { value: 'other', label: 'Other', labelHi: 'अन्य', icon: '📋' },
];

export const ITEM_UNITS = [
  'piece', 'kg', 'gram', 'litre', 'ml', 'meter', 'feet',
  'box', 'packet', 'bundle', 'dozen', 'pair', 'set', 'bottle', 'plate', 'bag',
];

export const PURPOSE_SUGGESTIONS = [
  'दैनिक खर्च (Daily Expense)', 'सब्जी / फल (Vegetables)', 'दूध व राशन (Milk & Ration)',
  'किराना सामान (Grocery)', 'चाय-नाश्ता (Tea & Snacks)', 'पेट्रोल / यात्रा (Petrol/Travel)',
  'मोबाइल रिचार्ज (Mobile Recharge)', 'बिजली / पानी बिल (Utility Bills)', 'दवा व डॉक्टर (Medicine)',
  'पॉकेट मनी (Pocket Money)', 'मासिक सैलरी (Monthly Salary)', 'Event Fund', 'Decoration',
  'Food', 'Transportation', 'General Expense', 'Guest Arrangement',
  'Printing', 'Equipment', 'Refreshment', 'Venue', 'Sound System',
  'Photography', 'Gifts', 'Cleaning', 'Security',
];
