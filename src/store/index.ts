// ============================================
// HISAB - localStorage Data Store
// ============================================

import {
  HisabEvent,
  MoneyReceived,
  Expense,
  ExpenseItem,
  EventSummary,
  CategorySummary,
  PersonSummary,
  AppSettings,
  DEFAULT_SETTINGS,
  ExpenseCategory,
} from '@/types';
import { generateId, getTodayDate } from '@/utils/helpers';

const KEYS = {
  EVENTS: 'hisab_events',
  MONEY: 'hisab_money_received',
  EXPENSES: 'hisab_expenses',
  SETTINGS: 'hisab_settings',
  PEOPLE_CACHE: 'hisab_people_cache',
};

// ============================================
// Generic localStorage helpers
// ============================================

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
}

// ============================================
// EVENTS
// ============================================

export function getEvents(): HisabEvent[] {
  return getItem<HisabEvent[]>(KEYS.EVENTS, []);
}

export function getEvent(id: string): HisabEvent | undefined {
  return getEvents().find((e) => e.id === id);
}

export function createEvent(data: Omit<HisabEvent, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>): HisabEvent {
  const event: HisabEvent = {
    ...data,
    id: generateId(),
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const events = getEvents();
  events.unshift(event);
  setItem(KEYS.EVENTS, events);
  return event;
}

export function updateEvent(id: string, data: Partial<HisabEvent>): HisabEvent | null {
  const events = getEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  events[index] = { ...events[index], ...data, updatedAt: new Date().toISOString() };
  setItem(KEYS.EVENTS, events);
  return events[index];
}

export function deleteEvent(id: string): void {
  const events = getEvents().filter((e) => e.id !== id);
  setItem(KEYS.EVENTS, events);
  // Also delete associated transactions
  const money = getAllMoneyReceived().filter((m) => m.eventId !== id);
  setItem(KEYS.MONEY, money);
  const expenses = getAllExpenses().filter((e) => e.eventId !== id);
  setItem(KEYS.EXPENSES, expenses);
}

export function archiveEvent(id: string): void {
  updateEvent(id, { isArchived: true });
}

export function unarchiveEvent(id: string): void {
  updateEvent(id, { isArchived: false });
}

// ============================================
// MONEY RECEIVED
// ============================================

export function getAllMoneyReceived(): MoneyReceived[] {
  return getItem<MoneyReceived[]>(KEYS.MONEY, []);
}

export function getMoneyReceivedByEvent(eventId: string): MoneyReceived[] {
  return getAllMoneyReceived()
    .filter((m) => m.eventId === eventId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addMoneyReceived(data: Omit<MoneyReceived, 'id' | 'createdAt'>): MoneyReceived {
  const entry: MoneyReceived = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const all = getAllMoneyReceived();
  all.unshift(entry);
  setItem(KEYS.MONEY, all);
  cachePerson(data.givenBy);
  cachePerson(data.depositedWith);
  return entry;
}

export function updateMoneyReceived(id: string, data: Partial<MoneyReceived>): MoneyReceived | null {
  const all = getAllMoneyReceived();
  const index = all.findIndex((m) => m.id === id);
  if (index === -1) return null;
  all[index] = { ...all[index], ...data };
  setItem(KEYS.MONEY, all);
  return all[index];
}

export function deleteMoneyReceived(id: string): void {
  const all = getAllMoneyReceived().filter((m) => m.id !== id);
  setItem(KEYS.MONEY, all);
}

// ============================================
// EXPENSES
// ============================================

export function getAllExpenses(): Expense[] {
  return getItem<Expense[]>(KEYS.EXPENSES, []);
}

export function getExpensesByEvent(eventId: string): Expense[] {
  return getAllExpenses()
    .filter((e) => e.eventId === eventId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const entry: Expense = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const all = getAllExpenses();
  all.unshift(entry);
  setItem(KEYS.EXPENSES, all);
  cachePerson(data.spentBy);
  cachePerson(data.paidTo);
  return entry;
}

export function updateExpense(id: string, data: Partial<Expense>): Expense | null {
  const all = getAllExpenses();
  const index = all.findIndex((e) => e.id === id);
  if (index === -1) return null;
  all[index] = { ...all[index], ...data };
  setItem(KEYS.EXPENSES, all);
  return all[index];
}

export function deleteExpense(id: string): void {
  const all = getAllExpenses().filter((e) => e.id !== id);
  setItem(KEYS.EXPENSES, all);
}

// ============================================
// CALCULATIONS
// ============================================

export function getEventSummary(eventId: string): EventSummary {
  const event = getEvent(eventId);
  const money = getMoneyReceivedByEvent(eventId);
  const expenses = getExpensesByEvent(eventId);

  const openingBalance = event?.openingBalance || 0;
  const totalReceived = money.reduce((sum, m) => sum + m.amount, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    totalReceived,
    totalSpent,
    balance: openingBalance + totalReceived - totalSpent,
    openingBalance,
    incomeCount: money.length,
    expenseCount: expenses.length,
    totalTransactions: money.length + expenses.length,
  };
}

export function getGlobalSummary() {
  const events = getEvents();
  const allMoney = getAllMoneyReceived();
  const allExpenses = getAllExpenses();

  const totalReceived = allMoney.reduce((sum, m) => sum + m.amount, 0);
  const totalSpent = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOpening = events.reduce((sum, e) => sum + (e.openingBalance || 0), 0);

  return {
    totalEvents: events.length,
    activeEvents: events.filter((e) => !e.isArchived).length,
    totalReceived,
    totalSpent,
    totalBalance: totalOpening + totalReceived - totalSpent,
    totalOpening,
  };
}

export function getCategorySummary(eventId: string): CategorySummary[] {
  const expenses = getExpensesByEvent(eventId);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap: Record<string, { amount: number; count: number }> = {};
  expenses.forEach((e) => {
    if (!categoryMap[e.category]) {
      categoryMap[e.category] = { amount: 0, count: 0 };
    }
    categoryMap[e.category].amount += e.amount;
    categoryMap[e.category].count += 1;
  });

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category: category as ExpenseCategory,
      amount: data.amount,
      count: data.count,
      percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getPersonSummary(eventId: string): PersonSummary[] {
  const money = getMoneyReceivedByEvent(eventId);
  const expenses = getExpensesByEvent(eventId);

  const personMap: Record<string, PersonSummary> = {};

  const ensurePerson = (name: string) => {
    if (!name) return;
    if (!personMap[name]) {
      personMap[name] = { name, moneyGiven: 0, moneyReceived: 0, moneySpent: 0, transactionCount: 0 };
    }
  };

  money.forEach((m) => {
    ensurePerson(m.givenBy);
    personMap[m.givenBy].moneyGiven += m.amount;
    personMap[m.givenBy].transactionCount += 1;

    ensurePerson(m.depositedWith);
    personMap[m.depositedWith].moneyReceived += m.amount;
    personMap[m.depositedWith].transactionCount += 1;
  });

  expenses.forEach((e) => {
    ensurePerson(e.spentBy);
    personMap[e.spentBy].moneySpent += e.amount;
    personMap[e.spentBy].transactionCount += 1;
  });

  return Object.values(personMap).sort((a, b) => b.transactionCount - a.transactionCount);
}

export function getTransactionHistory(eventId: string) {
  const money = getMoneyReceivedByEvent(eventId);
  const expenses = getExpensesByEvent(eventId);

  const transactions = [
    ...money.map((m) => ({
      id: m.id,
      type: 'income' as const,
      amount: m.amount,
      from: m.givenBy,
      to: m.depositedWith,
      date: m.date,
      purpose: m.purpose,
      paymentMethod: m.paymentMethod,
      note: m.note,
      category: undefined as ExpenseCategory | undefined,
      createdAt: m.createdAt,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      amount: e.amount,
      from: e.spentBy,
      to: e.paidTo,
      date: e.date,
      purpose: e.purpose,
      paymentMethod: e.paymentMethod,
      note: e.note,
      category: e.category,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}

export function getRecentTransactions(limit: number = 10) {
  const allMoney = getAllMoneyReceived();
  const allExpenses = getAllExpenses();
  const events = getEvents();
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.name]));

  const transactions = [
    ...allMoney.map((m) => ({
      id: m.id,
      eventId: m.eventId,
      eventName: eventMap[m.eventId] || 'Unknown',
      type: 'income' as const,
      amount: m.amount,
      from: m.givenBy,
      to: m.depositedWith,
      date: m.date,
      purpose: m.purpose,
      createdAt: m.createdAt,
    })),
    ...allExpenses.map((e) => ({
      id: e.id,
      eventId: e.eventId,
      eventName: eventMap[e.eventId] || 'Unknown',
      type: 'expense' as const,
      amount: e.amount,
      from: e.spentBy,
      to: e.paidTo,
      date: e.date,
      purpose: e.purpose,
      createdAt: e.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return transactions;
}

// ============================================
// PEOPLE CACHE (for autocomplete)
// ============================================

function cachePerson(name: string): void {
  if (!name) return;
  const people = getPeopleCache();
  if (!people.includes(name)) {
    people.push(name);
    setItem(KEYS.PEOPLE_CACHE, people);
  }
}

export function getPeopleCache(): string[] {
  return getItem<string[]>(KEYS.PEOPLE_CACHE, []);
}

export function searchPeople(query: string): string[] {
  if (!query) return getPeopleCache().slice(0, 10);
  const lower = query.toLowerCase();
  return getPeopleCache().filter((p) => p.toLowerCase().includes(lower));
}

// ============================================
// SETTINGS
// ============================================

export function getSettings(): AppSettings {
  return getItem<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function updateSettings(data: Partial<AppSettings>): void {
  const settings = getSettings();
  setItem(KEYS.SETTINGS, { ...settings, ...data });
}

// ============================================
// EXPORT / BACKUP
// ============================================

export function exportAllData() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    events: getEvents(),
    moneyReceived: getAllMoneyReceived(),
    expenses: getAllExpenses(),
    settings: getSettings(),
    peopleCache: getPeopleCache(),
  };
}

export function importData(data: ReturnType<typeof exportAllData>): boolean {
  try {
    if (data.events) setItem(KEYS.EVENTS, data.events);
    if (data.moneyReceived) setItem(KEYS.MONEY, data.moneyReceived);
    if (data.expenses) setItem(KEYS.EXPENSES, data.expenses);
    if (data.settings) setItem(KEYS.SETTINGS, data.settings);
    if (data.peopleCache) setItem(KEYS.PEOPLE_CACHE, data.peopleCache);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// SAMPLE DATA
// ============================================

export function loadSampleData(): void {
  // Check if data already exists
  if (getEvents().length > 0) return;

  const eventId = generateId();
  const event: HisabEvent = {
    id: eventId,
    name: 'Annual Function 2026',
    startDate: '2026-09-25',
    endDate: '2026-09-27',
    description: 'School Annual Function and Cultural Program',
    responsiblePerson: 'Rajesh Kumar',
    openingBalance: 2000,
    isArchived: false,
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  };

  const event2Id = generateId();
  const event2: HisabEvent = {
    id: event2Id,
    name: 'Sports Day 2026',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    description: 'Annual Sports Day Competition',
    responsiblePerson: 'Amit Singh',
    openingBalance: 0,
    isArchived: false,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  };

  setItem(KEYS.EVENTS, [event, event2]);

  const moneyEntries: MoneyReceived[] = [
    {
      id: generateId(), eventId, amount: 5000, givenBy: 'Suresh', depositedWith: 'Rajesh',
      date: '2026-09-25', purpose: 'Event Fund', paymentMethod: 'cash', note: '', createdAt: '2026-09-25T10:00:00Z',
    },
    {
      id: generateId(), eventId, amount: 3000, givenBy: 'Ramesh', depositedWith: 'Rajesh',
      date: '2026-09-25', purpose: 'Event Fund', paymentMethod: 'cash', note: '', createdAt: '2026-09-25T10:30:00Z',
    },
    {
      id: generateId(), eventId, amount: 2000, givenBy: 'Amit', depositedWith: 'Rajesh',
      date: '2026-09-25', purpose: 'Event Fund', paymentMethod: 'upi', note: 'UPI से भेजा', createdAt: '2026-09-25T11:00:00Z',
    },
    {
      id: generateId(), eventId, amount: 4000, givenBy: 'Vikram', depositedWith: 'Rajesh',
      date: '2026-09-26', purpose: 'Decoration', paymentMethod: 'cash', note: '', createdAt: '2026-09-26T09:00:00Z',
    },
    {
      id: generateId(), eventId, amount: 6000, givenBy: 'Manoj', depositedWith: 'Amit',
      date: '2026-09-26', purpose: 'Food Arrangement', paymentMethod: 'bank_transfer', note: 'Bank से transfer किया', createdAt: '2026-09-26T10:00:00Z',
    },
    // Sports Day entries
    {
      id: generateId(), eventId: event2Id, amount: 3000, givenBy: 'Rahul', depositedWith: 'Amit',
      date: '2026-10-10', purpose: 'Sports Fund', paymentMethod: 'cash', note: '', createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: generateId(), eventId: event2Id, amount: 2000, givenBy: 'Deepak', depositedWith: 'Amit',
      date: '2026-10-10', purpose: 'Sports Fund', paymentMethod: 'upi', note: '', createdAt: '2026-10-10T11:00:00Z',
    },
  ];
  setItem(KEYS.MONEY, moneyEntries);

  const expenses: Expense[] = [
    {
      id: generateId(), eventId, amount: 2500, spentBy: 'Rajesh', paidTo: 'Sharma Tent House',
      date: '2026-09-26', category: 'decoration', purpose: 'Stage Decoration',
      paymentMethod: 'cash', note: '', createdAt: '2026-09-26T11:00:00Z',
      items: [
        { id: generateId(), itemName: 'Tent', quantity: 1, unit: 'piece', rate: 1500, total: 1500 },
        { id: generateId(), itemName: 'Curtains', quantity: 5, unit: 'piece', rate: 200, total: 1000 },
      ],
    },
    {
      id: generateId(), eventId, amount: 3000, spentBy: 'Amit', paidTo: 'Sharma Sweets',
      date: '2026-09-26', category: 'food', purpose: 'Guest Arrangement',
      paymentMethod: 'cash', note: 'Lunch ke liye', createdAt: '2026-09-26T12:00:00Z',
      items: [
        { id: generateId(), itemName: 'Rice', quantity: 25, unit: 'kg', rate: 50, total: 1250 },
        { id: generateId(), itemName: 'Vegetables', quantity: 20, unit: 'kg', rate: 40, total: 800 },
        { id: generateId(), itemName: 'Oil', quantity: 5, unit: 'litre', rate: 150, total: 750 },
      ],
    },
    {
      id: generateId(), eventId, amount: 500, spentBy: 'Amit', paidTo: 'Gupta Store',
      date: '2026-09-26', category: 'refreshment', purpose: 'Guest Arrangement',
      paymentMethod: 'cash', note: '', createdAt: '2026-09-26T13:00:00Z',
      items: [
        { id: generateId(), itemName: 'Water Bottles', quantity: 100, unit: 'bottle', rate: 5, total: 500 },
      ],
    },
    {
      id: generateId(), eventId, amount: 700, spentBy: 'Rajesh', paidTo: 'Digital Print Shop',
      date: '2026-09-26', category: 'printing', purpose: 'Invitation Cards',
      paymentMethod: 'upi', note: '', createdAt: '2026-09-26T14:00:00Z',
      items: [
        { id: generateId(), itemName: 'Invitation Cards', quantity: 200, unit: 'piece', rate: 3.5, total: 700 },
      ],
    },
    {
      id: generateId(), eventId, amount: 1800, spentBy: 'Rajesh', paidTo: 'Sound System Rental',
      date: '2026-09-27', category: 'equipment', purpose: 'Stage Sound System',
      paymentMethod: 'cash', note: 'Mike + speakers', createdAt: '2026-09-27T08:00:00Z',
      items: [
        { id: generateId(), itemName: 'Sound System', quantity: 1, unit: 'set', rate: 1500, total: 1500 },
        { id: generateId(), itemName: 'Microphone', quantity: 2, unit: 'piece', rate: 150, total: 300 },
      ],
    },
    {
      id: generateId(), eventId, amount: 2000, spentBy: 'Amit', paidTo: 'Auto Stand',
      date: '2026-09-27', category: 'transportation', purpose: 'Guest Transportation',
      paymentMethod: 'cash', note: '', createdAt: '2026-09-27T09:00:00Z',
      items: [],
    },
    // Sports Day expenses
    {
      id: generateId(), eventId: event2Id, amount: 1500, spentBy: 'Amit', paidTo: 'Sports Shop',
      date: '2026-10-14', category: 'equipment', purpose: 'Sports Equipment',
      paymentMethod: 'cash', note: '', createdAt: '2026-10-14T10:00:00Z',
      items: [
        { id: generateId(), itemName: 'Cricket Ball', quantity: 6, unit: 'piece', rate: 100, total: 600 },
        { id: generateId(), itemName: 'Bat', quantity: 2, unit: 'piece', rate: 450, total: 900 },
      ],
    },
  ];
  setItem(KEYS.EXPENSES, expenses);

  // Cache people
  const people = ['Suresh', 'Ramesh', 'Amit', 'Rajesh', 'Vikram', 'Manoj', 'Rahul', 'Deepak',
    'Sharma Tent House', 'Sharma Sweets', 'Gupta Store', 'Digital Print Shop', 'Sound System Rental',
    'Auto Stand', 'Sports Shop'];
  setItem(KEYS.PEOPLE_CACHE, people);
}
