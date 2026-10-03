'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import {
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Trash2,
  Edit2,
  X,
  MapPin,
} from 'lucide-react';

export type EntryType = 'contribution' | 'expense';
export type ContributionStatus = 'paid' | 'unpaid';

export interface MonthlyEntry {
  id: string;
  type: EntryType;
  memberName: string;
  title: string;
  status: ContributionStatus;
  amount: number;
  collectedBy: string;
  spentBy: string;
  location: string;
  date: string;
  note?: string;
  createdAt: string;
}

const STORAGE_KEY = 'hisab_monthly_entries';

// डिफ़ॉल्ट/डेमो डेटा ताकि शुरू में टेबल खाली न दिखे
const INITIAL_DEMO_DATA: MonthlyEntry[] = [
  {
    id: 'demo-1',
    type: 'contribution',
    memberName: 'राहुल शर्मा',
    title: 'अक्टूबर 2026 मासिक अंशदान',
    status: 'paid',
    amount: 1000,
    collectedBy: 'अमित वर्मा',
    spentBy: '-',
    location: '-',
    date: '2026-10-01',
    note: 'GPay द्वारा भुगतान',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'demo-2',
    type: 'contribution',
    memberName: 'सुरेश पटेल',
    title: 'अक्टूबर 2026 मासिक अंशदान',
    status: 'unpaid',
    amount: 1000,
    collectedBy: 'अमित वर्मा',
    spentBy: '-',
    location: '-',
    date: '2026-10-02',
    note: 'सैलरी आने के बाद देंगे',
    createdAt: '2026-10-02T10:00:00.000Z',
  },
  {
    id: 'demo-3',
    type: 'contribution',
    memberName: 'विकास गुप्ता',
    title: 'अक्टूबर 2026 मासिक अंशदान',
    status: 'paid',
    amount: 1000,
    collectedBy: 'रोहित सिंह',
    spentBy: '-',
    location: '-',
    date: '2026-10-03',
    note: 'नकद जमा',
    createdAt: '2026-10-03T10:00:00.000Z',
  },
  {
    id: 'demo-4',
    type: 'expense',
    memberName: '-',
    title: 'समिति मीटिंग स्नैक्स व चाय',
    status: 'paid',
    amount: 850,
    collectedBy: '-',
    spentBy: 'अमित वर्मा',
    location: 'शर्मा जी चाय कॉर्नर',
    date: '2026-10-02',
    note: 'मासिक योजना बैठक',
    createdAt: '2026-10-02T16:00:00.000Z',
  },
  {
    id: 'demo-5',
    type: 'expense',
    memberName: '-',
    title: 'स्टेशनरी व रजिस्टर खरीदारी',
    status: 'paid',
    amount: 450,
    collectedBy: '-',
    spentBy: 'रोहित सिंह',
    location: 'स्टेशनरी मार्ट',
    date: '2026-10-03',
    note: 'नया हिसाब रजिस्टर',
    createdAt: '2026-10-03T11:00:00.000Z',
  },
];

function loadStoredEntries(): MonthlyEntry[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DATA));
      return INITIAL_DEMO_DATA;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_DATA;
  }
}

export default function MonthlyContributionManager() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [entries, setEntries] = useState<MonthlyEntry[]>(() => loadStoredEntries());

  // Filters state
  const [typeFilter, setTypeFilter] = useState<'all' | 'paid' | 'unpaid' | 'expenses'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10'); // Default October 2026
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'contribution' as EntryType,
    memberName: '',
    title: '',
    status: 'paid' as ContributionStatus,
    amount: '',
    collectedBy: '',
    spentBy: '',
    location: '',
    date: '2026-10-03',
    note: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // LocalStorage में सेव करने का हेल्पर
  const saveToStorage = (updatedEntries: MonthlyEntry[]) => {
    setEntries(updatedEntries);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  };

  // Month Format Helper
  const formatMonthDisplay = (yyyyMm: string) => {
    if (!yyyyMm || yyyyMm === 'all') return 'सभी महीने / All Months';
    const [year, month] = yyyyMm.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
  };

  // Unique months from entries for filter dropdown
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.date) {
        set.add(e.date.substring(0, 7)); // 'YYYY-MM'
      }
    });
    set.add('2026-10');
    return Array.from(set).sort().reverse();
  }, [entries]);

  // फ़िल्टर किया गया डेटा
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Month Filter
      if (selectedMonth !== 'all') {
        if (!entry.date.startsWith(selectedMonth)) return false;
      }

      // Type / Status Filter
      if (typeFilter === 'paid') {
        if (entry.type !== 'contribution' || entry.status !== 'paid') return false;
      } else if (typeFilter === 'unpaid') {
        if (entry.type !== 'contribution' || entry.status !== 'unpaid') return false;
      } else if (typeFilter === 'expenses') {
        if (entry.type !== 'expense') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          entry.memberName?.toLowerCase().includes(q) ||
          entry.title?.toLowerCase().includes(q) ||
          entry.collectedBy?.toLowerCase().includes(q) ||
          entry.spentBy?.toLowerCase().includes(q) ||
          entry.location?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [entries, selectedMonth, typeFilter, searchQuery]);

  // 3 सिंपल कार्ड्स की गणना (मंथ फ़िल्टर के अनुसार)
  const monthSpecificEntries = useMemo(() => {
    if (selectedMonth === 'all') return entries;
    return entries.filter((e) => e.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  const totalCollected = useMemo(() => {
    return monthSpecificEntries
      .filter((e) => e.type === 'contribution' && e.status === 'paid')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthSpecificEntries]);

  const totalUnpaid = useMemo(() => {
    return monthSpecificEntries
      .filter((e) => e.type === 'contribution' && e.status === 'unpaid')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthSpecificEntries]);

  const totalSpent = useMemo(() => {
    return monthSpecificEntries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthSpecificEntries]);

  // स्टेटस टॉगल (Paid <-> Unpaid)
  const toggleStatus = (id: string) => {
    const updated = entries.map((item) => {
      if (item.id === id && item.type === 'contribution') {
        const newStatus: ContributionStatus = item.status === 'paid' ? 'unpaid' : 'paid';
        return { ...item, status: newStatus };
      }
      return item;
    });
    saveToStorage(updated);
  };

  // डिलीट एंट्री
  const handleDelete = (id: string) => {
    if (window.confirm('क्या आप वाकई इस एंट्री को हटाना चाहते हैं?')) {
      const updated = entries.filter((e) => e.id !== id);
      saveToStorage(updated);
    }
  };

  // एडिट फॉर्म खोलना
  const handleEdit = (entry: MonthlyEntry) => {
    setEditingId(entry.id);
    setFormData({
      type: entry.type,
      memberName: entry.memberName === '-' ? '' : entry.memberName,
      title: entry.title,
      status: entry.status,
      amount: entry.amount.toString(),
      collectedBy: entry.collectedBy === '-' ? '' : entry.collectedBy,
      spentBy: entry.spentBy === '-' ? '' : entry.spentBy,
      location: entry.location === '-' ? '' : entry.location,
      date: entry.date,
      note: entry.note || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // फॉर्म रीसेट
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      type: 'contribution',
      memberName: '',
      title: '',
      status: 'paid',
      amount: '',
      collectedBy: '',
      spentBy: '',
      location: '',
      date: '2026-10-03',
      note: '',
    });
    setFormErrors({});
  };

  // फॉर्म सबमिट (Create & Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'कृपया सही राशि दर्ज करें (Amount must be > 0)';
    }

    if (!formData.title.trim()) {
      errors.title = 'विवरण / शीर्षक आवश्यक है (Title is required)';
    }

    if (formData.type === 'contribution') {
      if (!formData.memberName.trim()) {
        errors.memberName = 'सदस्य का नाम आवश्यक है (Member Name is required)';
      }
      if (!formData.collectedBy.trim()) {
        errors.collectedBy = 'रिसीवर / जमाकर्ता का नाम आवश्यक है (Collected By is required)';
      }
    } else {
      if (!formData.spentBy.trim()) {
        errors.spentBy = 'खर्चकर्ता का नाम आवश्यक है (Spent By is required)';
      }
      if (!formData.location.trim()) {
        errors.location = 'खर्च का स्थान / Paid To आवश्यक है';
      }
    }

    if (!formData.date) {
      errors.date = 'तारीख चुनना आवश्यक है';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const entryToSave: MonthlyEntry = {
      id: editingId || 'entry_' + Date.now(),
      type: formData.type,
      memberName: formData.type === 'contribution' ? formData.memberName.trim() : '-',
      title: formData.title.trim(),
      status: formData.type === 'contribution' ? formData.status : 'paid',
      amount: parseFloat(formData.amount),
      collectedBy: formData.type === 'contribution' ? formData.collectedBy.trim() : '-',
      spentBy: formData.type === 'expense' ? formData.spentBy.trim() : '-',
      location: formData.type === 'expense' ? formData.location.trim() : '-',
      date: formData.date,
      note: formData.note.trim(),
      createdAt: editingId
        ? entries.find((x) => x.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    let updatedList: MonthlyEntry[];
    if (editingId) {
      updatedList = entries.map((item) => (item.id === editingId ? entryToSave : item));
    } else {
      updatedList = [entryToSave, ...entries];
    }

    saveToStorage(updatedList);
    setIsModalOpen(false);
    resetForm();
  };

  if (!isHydrated) return null;

  return (
    <div className="contribution-manager" style={{ width: '100%' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            📊 मासिक कंट्रीब्यूशन व खर्च प्रबंधन
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
            सदस्यों का मासिक अंशदान और समूह खर्चों का पूरा हिसाब
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          <span>+ नई एंट्री जोड़ें / Add Entry</span>
        </button>
      </div>

      {/* 3 Simple Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Total Collected */}
        <div
          className="card summary-card income"
          style={{
            padding: 20,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: '4px solid #10b981',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              कुल जमा कंट्रीब्यूशन / Total Collected
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
              {selectedMonth === 'all' ? 'सभी महीने' : formatMonthDisplay(selectedMonth)} में प्राप्त
            </p>
          </div>
        </div>

        {/* Card 2: Total Unpaid */}
        <div
          className="card summary-card"
          style={{
            padding: 20,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: '4px solid #f59e0b',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              कुल पेंडिंग कंट्रीब्यूशन / Total Unpaid
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>
              ₹{totalUnpaid.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
              बकाया अंशदान राशि
            </p>
          </div>
        </div>

        {/* Card 3: Total Spent */}
        <div
          className="card summary-card expense"
          style={{
            padding: 20,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: '4px solid #ef4444',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              कुल हुआ खर्च / Total Spent
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#ef4444' }}>
              ₹{totalSpent.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
              समूह के विविध खर्चे
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Month Selector Toolbar */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 20,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Tabs: All / Paid / Unpaid / Expenses */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-tertiary)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {(
            [
              { key: 'all', label: 'सभी / All' },
              { key: 'paid', label: 'जमा / Paid' },
              { key: 'unpaid', label: 'पेंडिंग / Unpaid' },
              { key: 'expenses', label: 'खर्च / Expenses' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: typeFilter === tab.key ? 'var(--brand-primary)' : 'transparent',
                color: typeFilter === tab.key ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Month Filter & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color="var(--text-secondary)" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <option value="all">सभी महीने / All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthDisplay(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 200 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              type="text"
              placeholder="नाम, विवरण खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-tertiary)',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: '12px 14px' }}>सदस्य का नाम<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Member Name</span></th>
                <th style={{ padding: '12px 14px' }}>विवरण/शीर्षक<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Title / Purpose</span></th>
                <th style={{ padding: '12px 14px' }}>कंट्रीब्यूशन स्टेटस<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Status</span></th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>रकम<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Amount</span></th>
                <th style={{ padding: '12px 14px' }}>जमा हुआ / रिसीवर<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Collected By</span></th>
                <th style={{ padding: '12px 14px' }}>मुख्य खर्चकर्ता<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Spent By</span></th>
                <th style={{ padding: '12px 14px' }}>कहां खर्च किया<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Location / Paid To</span></th>
                <th style={{ padding: '12px 14px' }}>तारीख<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Date</span></th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>एक्शन<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-tertiary)' }}>
                    कोई रिकॉर्ड नहीं मिला। नई एंट्री जोड़ने के लिए &apos;+ नई एंट्री जोड़ें&apos; बटन दबाएँ।
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* 1. Member Name */}
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {row.type === 'contribution' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--brand-primary)' }}>👤</span>
                          <span>{row.memberName}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>

                    {/* 2. Title / Purpose */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                      <div>{row.title}</div>
                      {row.note && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          📝 {row.note}
                        </div>
                      )}
                    </td>

                    {/* 3. Status Toggle / Badge */}
                    <td style={{ padding: '12px 14px' }}>
                      {row.type === 'contribution' ? (
                        <button
                          onClick={() => toggleStatus(row.id)}
                          title="क्लिक करके स्टेटस बदलें (Toggle Status)"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: row.status === 'paid' ? '#ecfdf5' : '#fffbeb',
                            color: row.status === 'paid' ? '#059669' : '#d97706',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {row.status === 'paid' ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Paid (जमा)</span>
                            </>
                          ) : (
                            <>
                              <Clock size={13} />
                              <span>Unpaid (बाकी)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#fef2f2',
                            color: '#dc2626',
                          }}
                        >
                          खर्च / Expense
                        </span>
                      )}
                    </td>

                    {/* 4. Amount */}
                    <td
                      style={{
                        padding: '12px 14px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: 14,
                        color:
                          row.type === 'expense'
                            ? '#ef4444'
                            : row.status === 'paid'
                            ? '#10b981'
                            : '#f59e0b',
                      }}
                    >
                      {row.type === 'expense' ? '-' : '+'}₹{row.amount.toLocaleString('en-IN')}
                    </td>

                    {/* 5. Collected By */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {row.collectedBy && row.collectedBy !== '-' ? row.collectedBy : '—'}
                    </td>

                    {/* 6. Spent By */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {row.spentBy && row.spentBy !== '-' ? row.spentBy : '—'}
                    </td>

                    {/* 7. Location / Paid To */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {row.location && row.location !== '-' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--text-tertiary)" />
                          {row.location}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* 8. Date */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {row.date}
                    </td>

                    {/* 9. Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleEdit(row)}
                          title="Edit"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          title="Delete"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          इनपुट फॉर्म मॉडल (Add / Edit Entry Modal)
          ======================================================== */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            className="card"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: 540,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingId ? '✏️ एंट्री एडिट करें' : '➕ नई एंट्री जोड़ें'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              {/* 1. एंट्री टाइप चुनने का विकल्प (Radio / Switch) */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                  एंट्री का प्रकार चुनें (Select Entry Type):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `2px solid ${
                        formData.type === 'contribution' ? '#10b981' : 'var(--border-color)'
                      }`,
                      background: formData.type === 'contribution' ? '#ecfdf5' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color: formData.type === 'contribution' ? '#065f46' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="entryType"
                      value="contribution"
                      checked={formData.type === 'contribution'}
                      onChange={() => setFormData({ ...formData, type: 'contribution' })}
                      style={{ accentColor: '#10b981' }}
                    />
                    💰 मासिक कंट्रीब्यूशन जमा
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `2px solid ${
                        formData.type === 'expense' ? '#ef4444' : 'var(--border-color)'
                      }`,
                      background: formData.type === 'expense' ? '#fef2f2' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color: formData.type === 'expense' ? '#991b1b' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="entryType"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={() => setFormData({ ...formData, type: 'expense' })}
                      style={{ accentColor: '#ef4444' }}
                    />
                    🧾 समूह का खर्च
                  </label>
                </div>
              </div>

              {/* Dynamic Field: Member Name (अगर कंट्रीब्यूशन है) */}
              {formData.type === 'contribution' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                    सदस्य का नाम (Member Name) *
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. राहुल शर्मा"
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${formErrors.memberName ? '#ef4444' : 'var(--border-color)'}`,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  />
                  {formErrors.memberName && (
                    <span style={{ fontSize: 11, color: '#ef4444' }}>{formErrors.memberName}</span>
                  )}
                </div>
              )}

              {/* Title / Purpose */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                  विवरण / शीर्षक (Title / Purpose) *
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.type === 'contribution'
                      ? 'उदा. अक्टूबर 2026 मासिक कंट्रीब्यूशन'
                      : 'उदा. कम्युनिटी हॉल रेंट / टेंट हाउस'
                  }
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${formErrors.title ? '#ef4444' : 'var(--border-color)'}`,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                />
                {formErrors.title && (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>{formErrors.title}</span>
                )}
              </div>

              {/* Grid 2 Columns: Amount & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                    रकम (Amount ₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${formErrors.amount ? '#ef4444' : 'var(--border-color)'}`,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  />
                  {formErrors.amount && (
                    <span style={{ fontSize: 11, color: '#ef4444' }}>{formErrors.amount}</span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                    तारीख (Date) *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${formErrors.date ? '#ef4444' : 'var(--border-color)'}`,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  />
                  {formErrors.date && (
                    <span style={{ fontSize: 11, color: '#ef4444' }}>{formErrors.date}</span>
                  )}
                </div>
              </div>

              {/* Dynamic Fields for Contribution: Status & Collected By */}
              {formData.type === 'contribution' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                      कंट्रीब्यूशन स्टेटस (Status)
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as ContributionStatus })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                      }}
                    >
                      <option value="paid">✅ Paid (जमा हो चुका)</option>
                      <option value="unpaid">⏳ Unpaid (पेंडिंग / बाकी)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                      किसके पास जमा हुआ (Collected By) *
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. अमित वर्मा"
                      value={formData.collectedBy}
                      onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${formErrors.collectedBy ? '#ef4444' : 'var(--border-color)'}`,
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                      }}
                    />
                    {formErrors.collectedBy && (
                      <span style={{ fontSize: 11, color: '#ef4444' }}>{formErrors.collectedBy}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Fields for Expense: Spent By & Location */}
              {formData.type === 'expense' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                      मुख्य खर्चकर्ता (Spent By) *
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. अमित वर्मा"
                      value={formData.spentBy}
                      onChange={(e) => setFormData({ ...formData, spentBy: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${formErrors.spentBy ? '#ef4444' : 'var(--border-color)'}`,
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                      }}
                    />
                    {formErrors.spentBy && (
                      <span style={{ fontSize: 11, color: '#ef4444' }}>{formErrors.spentBy}</span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                      कहां खर्च किया (Location / Paid To) *
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. टेंट हाउस, सुपरमार्ट"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${formErrors.location ? '#ef4444' : 'var(--border-color)'}`,
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                      }}
                    />
                    {formErrors.location && (
                      <span style={{ fontSize: 11, color: '#ef4444' }}>{formErrors.location}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Note / Remarks */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                  अतिरिक्त नोट (Optional Note)
                </label>
                <input
                  type="text"
                  placeholder="उदा. UPI / कैश / रसीद संख्या"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  रद्द करें / Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {editingId ? 'अपडेट करें / Save Changes' : 'सुरक्षित करें / Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
