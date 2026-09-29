// ============================================
// HISAB - localStorage Data Store
// ============================================

import {
  HisabEvent,
  HisabPerson,
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
  PEOPLE: 'hisab_people',
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
  // Cascade delete: remove all associated transactions
  const money = getAllMoneyReceived().filter((m) => m.eventId !== id);
  setItem(KEYS.MONEY, money);
  const expenses = getAllExpenses().filter((e) => e.eventId !== id);
  setItem(KEYS.EXPENSES, expenses);
  // Remove event from people's eventIds
  const people = getPeople();
  people.forEach((p) => {
    p.eventIds = p.eventIds.filter((eid) => eid !== id);
  });
  setItem(KEYS.PEOPLE, people);
}

export function archiveEvent(id: string): void {
  updateEvent(id, { isArchived: true });
}

export function unarchiveEvent(id: string): void {
  updateEvent(id, { isArchived: false });
}

// ============================================
// DEMO DATA MANAGEMENT
// ============================================

export function deleteDemoData(): void {
  // Remove demo events
  const events = getEvents().filter((e) => !e.isDemo);
  setItem(KEYS.EVENTS, events);
  // Remove demo money records
  const money = getAllMoneyReceived().filter((m) => !m.isDemo);
  setItem(KEYS.MONEY, money);
  // Remove demo expenses
  const expenses = getAllExpenses().filter((e) => !e.isDemo);
  setItem(KEYS.EXPENSES, expenses);
  // Remove demo people
  const people = getPeople().filter((p) => !p.isDemo);
  setItem(KEYS.PEOPLE, people);
  // Mark demo data as deleted so it won't be recreated
  const settings = getSettings();
  updateSettings({ ...settings, demoDataDeleted: true });
}

export function hasDemoData(): boolean {
  return getEvents().some((e) => e.isDemo);
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
// PEOPLE MANAGEMENT (Full CRUD)
// ============================================

export function getPeople(): HisabPerson[] {
  return getItem<HisabPerson[]>(KEYS.PEOPLE, []);
}

export function getActivePeople(): HisabPerson[] {
  return getPeople().filter((p) => p.status === 'active');
}

export function getPerson(id: string): HisabPerson | undefined {
  return getPeople().find((p) => p.id === id);
}

export function getPersonByName(name: string): HisabPerson | undefined {
  return getPeople().find((p) => p.name.toLowerCase() === name.toLowerCase());
}

export function addPerson(data: { name: string; mobile?: string; note?: string; eventIds?: string[]; isDemo?: boolean }): HisabPerson {
  const person: HisabPerson = {
    id: generateId(),
    name: data.name.trim(),
    mobile: (data.mobile || '').trim(),
    note: (data.note || '').trim(),
    status: 'active',
    eventIds: data.eventIds || [],
    isDemo: data.isDemo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const people = getPeople();
  people.unshift(person);
  setItem(KEYS.PEOPLE, people);
  // Also add to cache for autocomplete
  cachePerson(person.name);
  return person;
}

export function updatePerson(id: string, data: Partial<HisabPerson>): HisabPerson | null {
  const people = getPeople();
  const index = people.findIndex((p) => p.id === id);
  if (index === -1) return null;
  
  const oldName = people[index].name;
  people[index] = { ...people[index], ...data, updatedAt: new Date().toISOString() };
  setItem(KEYS.PEOPLE, people);
  
  // If name changed, update all transactions referencing the old name
  const newName = people[index].name;
  if (oldName !== newName && newName) {
    updatePersonNameInTransactions(oldName, newName);
    // Update people cache
    const cache = getPeopleCache();
    const cacheIndex = cache.indexOf(oldName);
    if (cacheIndex !== -1) {
      cache[cacheIndex] = newName;
      setItem(KEYS.PEOPLE_CACHE, cache);
    }
  }
  
  return people[index];
}

function updatePersonNameInTransactions(oldName: string, newName: string): void {
  // Update money received records
  const money = getAllMoneyReceived();
  let moneyChanged = false;
  money.forEach((m) => {
    if (m.givenBy === oldName) { m.givenBy = newName; moneyChanged = true; }
    if (m.depositedWith === oldName) { m.depositedWith = newName; moneyChanged = true; }
  });
  if (moneyChanged) setItem(KEYS.MONEY, money);
  
  // Update expense records
  const expenses = getAllExpenses();
  let expensesChanged = false;
  expenses.forEach((e) => {
    if (e.spentBy === oldName) { e.spentBy = newName; expensesChanged = true; }
    if (e.paidTo === oldName) { e.paidTo = newName; expensesChanged = true; }
  });
  if (expensesChanged) setItem(KEYS.EXPENSES, expenses);
}

export function deactivatePerson(id: string): HisabPerson | null {
  return updatePerson(id, { status: 'inactive' });
}

export function activatePerson(id: string): HisabPerson | null {
  return updatePerson(id, { status: 'active' });
}

export function deletePerson(id: string): boolean {
  const person = getPerson(id);
  if (!person) return false;
  
  // Check if person has transactions
  const txnCount = getPersonTransactionCount(person.name);
  if (txnCount > 0) return false; // Cannot delete person with transactions
  
  const people = getPeople().filter((p) => p.id !== id);
  setItem(KEYS.PEOPLE, people);
  
  // Remove from cache
  const cache = getPeopleCache().filter((n) => n !== person.name);
  setItem(KEYS.PEOPLE_CACHE, cache);
  
  return true;
}

export function getPersonTransactionCount(name: string): number {
  const money = getAllMoneyReceived();
  const expenses = getAllExpenses();
  let count = 0;
  money.forEach((m) => {
    if (m.givenBy === name || m.depositedWith === name) count++;
  });
  expenses.forEach((e) => {
    if (e.spentBy === name || e.paidTo === name) count++;
  });
  return count;
}

export function getPersonTransactions(name: string) {
  const money = getAllMoneyReceived();
  const expenses = getAllExpenses();
  const events = getEvents();
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.name]));
  
  const transactions = [
    ...money.filter((m) => m.givenBy === name || m.depositedWith === name).map((m) => ({
      id: m.id,
      eventId: m.eventId,
      eventName: eventMap[m.eventId] || 'Unknown',
      type: 'income' as const,
      amount: m.amount,
      from: m.givenBy,
      to: m.depositedWith,
      date: m.date,
      purpose: m.purpose,
      role: m.givenBy === name ? 'गया / Given' : 'जमा किया / Received',
      createdAt: m.createdAt,
    })),
    ...expenses.filter((e) => e.spentBy === name || e.paidTo === name).map((e) => ({
      id: e.id,
      eventId: e.eventId,
      eventName: eventMap[e.eventId] || 'Unknown',
      type: 'expense' as const,
      amount: e.amount,
      from: e.spentBy,
      to: e.paidTo,
      date: e.date,
      purpose: e.purpose,
      role: e.spentBy === name ? 'खर्च किया / Spent' : 'प्राप्त किया / Received',
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return transactions;
}

export function getPersonFullSummary(name: string) {
  const money = getAllMoneyReceived();
  const expenses = getAllExpenses();
  
  let totalGiven = 0;
  let totalReceived = 0;
  let totalSpent = 0;
  let transactionCount = 0;
  const eventIds = new Set<string>();
  
  money.forEach((m) => {
    if (m.givenBy === name) {
      totalGiven += m.amount;
      transactionCount++;
      eventIds.add(m.eventId);
    }
    if (m.depositedWith === name) {
      totalReceived += m.amount;
      transactionCount++;
      eventIds.add(m.eventId);
    }
  });
  
  expenses.forEach((e) => {
    if (e.spentBy === name) {
      totalSpent += e.amount;
      transactionCount++;
      eventIds.add(e.eventId);
    }
    if (e.paidTo === name) {
      transactionCount++;
      eventIds.add(e.eventId);
    }
  });
  
  return { totalGiven, totalReceived, totalSpent, transactionCount, eventCount: eventIds.size };
}

export function addPersonToEvent(personId: string, eventId: string): void {
  const person = getPerson(personId);
  if (!person) return;
  if (!person.eventIds.includes(eventId)) {
    updatePerson(personId, { eventIds: [...person.eventIds, eventId] });
  }
}

export function searchPeopleRecords(query: string): HisabPerson[] {
  const people = getActivePeople();
  if (!query) return people;
  const lower = query.toLowerCase();
  return people.filter((p) =>
    p.name.toLowerCase().includes(lower) ||
    (p.mobile || '').includes(query)
  );
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
    people: getPeople(),
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
    if ((data as { people?: HisabPerson[] }).people) setItem(KEYS.PEOPLE, (data as { people: HisabPerson[] }).people);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// SAMPLE DATA
// ============================================

export function loadSampleData(): void {
  // Don't load if demo data was explicitly deleted by user
  const settings = getSettings();
  if (settings.demoDataDeleted) return;
  
  // Check if data already exists
  if (getEvents().length > 0) return;

  const eventId = generateId();
  const event: HisabEvent = {
    id: eventId,
    name: 'Annual Function 2026 (Demo)',
    startDate: '2026-09-25',
    endDate: '2026-09-27',
    description: 'School Annual Function and Cultural Program',
    responsiblePerson: 'राजेश कुमार',
    openingBalance: 2000,
    isArchived: false,
    isDemo: true,
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  };

  const event2Id = generateId();
  const event2: HisabEvent = {
    id: event2Id,
    name: 'Sports Day 2026 (Demo)',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    description: 'Annual Sports Day Competition',
    responsiblePerson: 'अमित सिंह',
    openingBalance: 0,
    isArchived: false,
    isDemo: true,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  };

  setItem(KEYS.EVENTS, [event, event2]);

  const moneyEntries: MoneyReceived[] = [
    {
      id: generateId(), eventId, amount: 5000, givenBy: 'सुरेश कुमार', depositedWith: 'राजेश कुमार',
      date: '2026-09-25', purpose: 'Event Fund', paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-09-25T10:00:00Z',
    },
    {
      id: generateId(), eventId, amount: 3000, givenBy: 'रमेश प्रसाद', depositedWith: 'राजेश कुमार',
      date: '2026-09-25', purpose: 'Event Fund', paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-09-25T10:30:00Z',
    },
    {
      id: generateId(), eventId, amount: 2000, givenBy: 'अमित सिंह', depositedWith: 'राजेश कुमार',
      date: '2026-09-25', purpose: 'Event Fund', paymentMethod: 'upi', note: 'UPI से भेजा', isDemo: true, createdAt: '2026-09-25T11:00:00Z',
    },
    {
      id: generateId(), eventId, amount: 4000, givenBy: 'विक्रम शर्मा', depositedWith: 'राजेश कुमार',
      date: '2026-09-26', purpose: 'सजावट / Decoration', paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-09-26T09:00:00Z',
    },
    {
      id: generateId(), eventId, amount: 6000, givenBy: 'मनोज गुप्ता', depositedWith: 'अमित सिंह',
      date: '2026-09-26', purpose: 'अतिथि व्यवस्था', paymentMethod: 'bank_transfer', note: 'Bank से transfer किया', isDemo: true, createdAt: '2026-09-26T10:00:00Z',
    },
    // Sports Day entries
    {
      id: generateId(), eventId: event2Id, amount: 3000, givenBy: 'राहुल वर्मा', depositedWith: 'अमित सिंह',
      date: '2026-10-10', purpose: 'Sports Fund', paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: generateId(), eventId: event2Id, amount: 2000, givenBy: 'दीपक जायसवाल', depositedWith: 'अमित सिंह',
      date: '2026-10-10', purpose: 'Sports Fund', paymentMethod: 'upi', note: '', isDemo: true, createdAt: '2026-10-10T11:00:00Z',
    },
  ];
  setItem(KEYS.MONEY, moneyEntries);

  const expenses: Expense[] = [
    {
      id: generateId(), eventId, amount: 2500, spentBy: 'राजेश कुमार', paidTo: 'शर्मा टेंट हाउस',
      date: '2026-09-26', category: 'decoration', purpose: 'मंच सजावट / Stage Decoration',
      paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-09-26T11:00:00Z',
      items: [
        { id: generateId(), itemName: 'टेंट / Tent', quantity: 1, unit: 'piece', rate: 1500, total: 1500 },
        { id: generateId(), itemName: 'पर्दे / Curtains', quantity: 5, unit: 'piece', rate: 200, total: 1000 },
      ],
    },
    {
      id: generateId(), eventId, amount: 3000, spentBy: 'अमित सिंह', paidTo: 'शर्मा स्वीट्स',
      date: '2026-09-26', category: 'food', purpose: 'अतिथि व्यवस्था / Guest Arrangement',
      paymentMethod: 'cash', note: 'दोपहर के भोजन के लिए', isDemo: true, createdAt: '2026-09-26T12:00:00Z',
      items: [
        { id: generateId(), itemName: 'चावल / Rice', quantity: 25, unit: 'kg', rate: 50, total: 1250 },
        { id: generateId(), itemName: 'सब्ज़ी / Vegetables', quantity: 20, unit: 'kg', rate: 40, total: 800 },
        { id: generateId(), itemName: 'तेल / Oil', quantity: 5, unit: 'litre', rate: 150, total: 750 },
      ],
    },
    {
      id: generateId(), eventId, amount: 500, spentBy: 'अमित सिंह', paidTo: 'गुप्ता स्टोर',
      date: '2026-09-26', category: 'refreshment', purpose: 'अतिथि व्यवस्था / Guest Arrangement',
      paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-09-26T13:00:00Z',
      items: [
        { id: generateId(), itemName: 'पानी की बोतल / Water Bottles', quantity: 100, unit: 'bottle', rate: 5, total: 500 },
      ],
    },
    {
      id: generateId(), eventId, amount: 700, spentBy: 'राजेश कुमार', paidTo: 'डिजिटल प्रिंट शॉप',
      date: '2026-09-26', category: 'printing', purpose: 'निमंत्रण पत्र / Invitation Cards',
      paymentMethod: 'upi', note: '', isDemo: true, createdAt: '2026-09-26T14:00:00Z',
      items: [
        { id: generateId(), itemName: 'निमंत्रण पत्र / Invitation Cards', quantity: 200, unit: 'piece', rate: 3.5, total: 700 },
      ],
    },
    {
      id: generateId(), eventId, amount: 1800, spentBy: 'राजेश कुमार', paidTo: 'साउंड सिस्टम रेंटल',
      date: '2026-09-27', category: 'equipment', purpose: 'मंच साउंड सिस्टम',
      paymentMethod: 'cash', note: 'Mike + speakers', isDemo: true, createdAt: '2026-09-27T08:00:00Z',
      items: [
        { id: generateId(), itemName: 'साउंड सिस्टम', quantity: 1, unit: 'set', rate: 1500, total: 1500 },
        { id: generateId(), itemName: 'माइक्रोफोन', quantity: 2, unit: 'piece', rate: 150, total: 300 },
      ],
    },
    {
      id: generateId(), eventId, amount: 2000, spentBy: 'अमित सिंह', paidTo: 'ऑटो स्टैंड',
      date: '2026-09-27', category: 'transportation', purpose: 'अतिथि यातायात / Guest Transportation',
      paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-09-27T09:00:00Z',
      items: [],
    },
    // Sports Day expenses
    {
      id: generateId(), eventId: event2Id, amount: 1500, spentBy: 'अमित सिंह', paidTo: 'स्पोर्ट्स शॉप',
      date: '2026-10-14', category: 'equipment', purpose: 'खेल उपकरण / Sports Equipment',
      paymentMethod: 'cash', note: '', isDemo: true, createdAt: '2026-10-14T10:00:00Z',
      items: [
        { id: generateId(), itemName: 'क्रिकेट बॉल', quantity: 6, unit: 'piece', rate: 100, total: 600 },
        { id: generateId(), itemName: 'बैट', quantity: 2, unit: 'piece', rate: 450, total: 900 },
      ],
    },
  ];
  setItem(KEYS.EXPENSES, expenses);

  // Cache people and create people records
  const peopleNames = [
    'सुरेश कुमार', 'रमेश प्रसाद', 'अमित सिंह', 'राजेश कुमार', 'विक्रम शर्मा', 'मनोज गुप्ता',
    'राहुल वर्मा', 'दीपक जायसवाल', 'शर्मा टेंट हाउस', 'शर्मा स्वीट्स', 'गुप्ता स्टोर',
    'डिजिटल प्रिंट शॉप', 'साउंड सिस्टम रेंटल', 'ऑटो स्टैंड', 'स्पोर्ट्स शॉप',
  ];
  setItem(KEYS.PEOPLE_CACHE, peopleNames);
  
  // Create HisabPerson records for demo people
  const demoPeople: HisabPerson[] = peopleNames.map((name) => ({
    id: generateId(),
    name,
    mobile: '',
    note: '',
    status: 'active' as const,
    eventIds: [],
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  setItem(KEYS.PEOPLE, demoPeople);
  
  // Mark that demo data has been loaded
  updateSettings({ demoDataLoaded: true });
}
