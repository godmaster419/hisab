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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Coins,
  Share2,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  getMonthlyEntries,
  saveMonthlyEntries,
  calculatePreviousMonthBalance,
  getMonthlySummary,
} from '@/store';
import {
  formatMonthYear,
  formatHindiMonth,
  getPreviousMonthStr,
  getNextMonthStr,
} from '@/utils/helpers';
import { MonthlyEntry, MonthlyEntryType, MonthlyContributionStatus } from '@/types';

export default function MonthlyContributionManager() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [entries, setEntries] = useState<MonthlyEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    return getMonthlyEntries();
  });

  // Filters & Month state
  const [typeFilter, setTypeFilter] = useState<'all' | 'paid' | 'unpaid' | 'expenses'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10'); // Default October 2026
  const [searchQuery, setSearchQuery] = useState('');
  const [includePreviousBalance, setIncludePreviousBalance] = useState(true);
  const [activeViewTab, setActiveViewTab] = useState<'register' | 'members'>('register');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'contribution' as MonthlyEntryType,
    memberName: '',
    title: '',
    status: 'paid' as MonthlyContributionStatus,
    amount: '',
    collectedBy: '',
    spentBy: '',
    location: '',
    date: '2026-10-03',
    note: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Helper to persist entries
  const saveToStorage = (updatedEntries: MonthlyEntry[]) => {
    setEntries(updatedEntries);
    saveMonthlyEntries(updatedEntries);
  };

  // Available unique months list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.substring(0, 7)); // 'YYYY-MM'
      }
    });
    set.add('2026-10');
    set.add('2026-11'); // next month option ready
    if (selectedMonth && selectedMonth !== 'all') {
      set.add(selectedMonth);
    }
    return Array.from(set).sort().reverse();
  }, [entries, selectedMonth]);

  // Previous month remaining balance calculation
  const prevMonthInfo = useMemo(() => {
    if (selectedMonth === 'all') {
      return { balance: 0, previousMonthStr: '', previousMonthLabel: '', hasPriorData: false };
    }
    return calculatePreviousMonthBalance(selectedMonth, entries);
  }, [selectedMonth, entries]);

  // Summary for selected month
  const summary = useMemo(() => {
    return getMonthlySummary(selectedMonth, includePreviousBalance, entries);
  }, [selectedMonth, includePreviousBalance, entries]);

  // Filtered entries for the table
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Month Filter
      if (selectedMonth !== 'all') {
        if (!entry.date || !entry.date.startsWith(selectedMonth)) return false;
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

  // Distinct members for Member Status view
  const memberList = useMemo(() => {
    const map = new Map<string, { memberName: string; totalContributed: number; latestStatus: MonthlyContributionStatus }>();
    entries.forEach((e) => {
      if (e.type === 'contribution' && e.memberName && e.memberName !== '-') {
        const existing = map.get(e.memberName) || { memberName: e.memberName, totalContributed: 0, latestStatus: 'unpaid' };
        if (e.status === 'paid') {
          existing.totalContributed += e.amount;
        }
        if (selectedMonth === 'all' || (e.date && e.date.startsWith(selectedMonth))) {
          existing.latestStatus = e.status;
        }
        map.set(e.memberName, existing);
      }
    });
    return Array.from(map.values());
  }, [entries, selectedMonth]);

  // Status Toggle (Paid <-> Unpaid)
  const toggleStatus = (id: string) => {
    const updated = entries.map((item) => {
      if (item.id === id && item.type === 'contribution') {
        const newStatus: MonthlyContributionStatus = item.status === 'paid' ? 'unpaid' : 'paid';
        return { ...item, status: newStatus };
      }
      return item;
    });
    saveToStorage(updated);
  };

  // Delete Entry
  const handleDelete = (id: string) => {
    if (window.confirm('क्या आप वाकई इस एंट्री को हटाना चाहते हैं?')) {
      const updated = entries.filter((e) => e.id !== id);
      saveToStorage(updated);
    }
  };

  // Open Edit Form
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

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    const defaultDate = selectedMonth !== 'all' ? `${selectedMonth}-01` : '2026-10-01';
    setFormData({
      type: 'contribution',
      memberName: '',
      title: selectedMonth !== 'all' ? `${formatHindiMonth(selectedMonth)} मासिक अंशदान` : 'मासिक अंशदान',
      status: 'paid',
      amount: '',
      collectedBy: '',
      spentBy: '',
      location: '',
      date: defaultDate,
      note: '',
    });
    setFormErrors({});
  };

  // Month navigation: previous month
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth('2026-10');
      return;
    }
    const prev = getPreviousMonthStr(selectedMonth);
    setSelectedMonth(prev);
  };

  // Month navigation: next month
  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth('2026-10');
      return;
    }
    const next = getNextMonthStr(selectedMonth);
    setSelectedMonth(next);
  };

  // "अगले महीने का हिसाब शुरू करें / Start Next Month" button
  const handleStartNextMonth = () => {
    const next = selectedMonth !== 'all' ? getNextMonthStr(selectedMonth) : '2026-11';
    setSelectedMonth(next);
    setIncludePreviousBalance(true);
  };

  // Form Submit
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

  // Copy WhatsApp Reminder for Unpaid Member
  const copyReminder = (memberName: string, amount: number) => {
    const monthText = selectedMonth !== 'all' ? formatHindiMonth(selectedMonth) : 'मासिक';
    const text = `नमस्ते ${memberName} जी! ${monthText} का समिति अंशदान ₹${amount.toLocaleString('en-IN')} अभी पेंडिंग है। कृपया समय पर जमा कराने की कृपा करें। धन्यवाद!`;
    navigator.clipboard.writeText(text);
    setCopiedId(memberName);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isHydrated) return null;

  return (
    <div className="contribution-manager" style={{ width: '100%' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coins size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                मासिक कंट्रीब्यूशन व खर्च प्रबंधन
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
                सदस्यों का मासिक अंशदान, समूह के खर्चे और पिछले महीने का बचा बैलेंस
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selectedMonth !== 'all' && (
            <button
              onClick={handleStartNextMonth}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                borderColor: 'var(--brand-primary)',
                color: 'var(--brand-primary)',
              }}
              title="अगले महीने में जाएँ और पिछले महीने की बची राशि कैरी फॉरवर्ड देखें"
            >
              <Sparkles size={16} />
              <span>अगला महीना शुरू करें</span>
              <ArrowRight size={14} />
            </button>
          )}

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
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            <span>+ नई एंट्री जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Month Navigation & Switcher Toolbar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          marginBottom: 20,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Month Selector with Prev/Next buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            महीना चुनें:
          </span>

          <button
            onClick={handlePrevMonth}
            className="btn btn-sm btn-secondary"
            style={{ padding: '6px 10px', borderRadius: 8 }}
            title="पिछला महीना देखें"
          >
            <ChevronLeft size={16} />
            <span>पिछला</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color="var(--brand-primary)" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">सभी महीने / All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="btn btn-sm btn-secondary"
            style={{ padding: '6px 10px', borderRadius: 8 }}
            title="अगला महीना देखें"
          >
            <span>अगला</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Option Checkbox: Include Previous Month Balance */}
        {selectedMonth !== 'all' && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              background: includePreviousBalance ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
              border: `1px solid ${includePreviousBalance ? 'var(--brand-primary)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: includePreviousBalance ? 'var(--brand-primary)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="checkbox"
              checked={includePreviousBalance}
              onChange={(e) => setIncludePreviousBalance(e.target.checked)}
              style={{ accentColor: 'var(--brand-primary)', width: 16, height: 16, cursor: 'pointer' }}
            />
            <span>💰 पिछले महीने की बची हुई राशि शामिल करें</span>
          </label>
        )}
      </div>

      {/* Summary Cards Section (5 Cards: Previous Balance, Collected, Total Available, Spent, Net Balance) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Previous Month Remaining Balance (Only if not 'all' and carryover enabled) */}
        {selectedMonth !== 'all' && includePreviousBalance && (
          <div
            className="card summary-card"
            style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              borderTop: '4px solid #6366f1',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)' }}>
                  💼 पिछले महीने की बची राशि
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                  {prevMonthInfo.previousMonthLabel ? `${prevMonthInfo.previousMonthLabel} का शेष` : 'प्रारंभिक शेष'}
                </p>
              </div>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontWeight: 700,
                  background: summary.previousRemainingBalance >= 0 ? 'rgba(99,102,241,0.12)' : 'rgba(239,68,68,0.12)',
                  color: summary.previousRemainingBalance >= 0 ? '#6366f1' : '#ef4444',
                }}
              >
                कैरी फारवर्ड
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: summary.previousRemainingBalance >= 0 ? '#6366f1' : '#ef4444' }}>
                ₹{summary.previousRemainingBalance.toLocaleString('en-IN')}
              </span>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
                अगले महीने में स्वतः जोड़ी गई
              </p>
            </div>
          </div>
        )}

        {/* Card 2: This Month Collected */}
        <div
          className="card summary-card income"
          style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: '4px solid #10b981',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
              📥 इस महीने का जमा
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
              ₹{summary.totalCollected.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
              {summary.paidCount} सदस्यों का अंशदान प्राप्त
            </p>
          </div>
        </div>

        {/* Card 3: Total Available Funds (Previous + Collected) */}
        {selectedMonth !== 'all' && includePreviousBalance && (
          <div
            className="card summary-card"
            style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              borderTop: '4px solid #0ea5e9',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
                💳 कुल उपलब्ध फंड
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#f0f9ff',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Coins size={18} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#0ea5e9' }}>
                ₹{summary.totalAvailable.toLocaleString('en-IN')}
              </span>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
                पिछली बचत + नया जमा
              </p>
            </div>
          </div>
        )}

        {/* Card 4: This Month Total Spent */}
        <div
          className="card summary-card expense"
          style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: '4px solid #ef4444',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
              📤 इस महीने का खर्च
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>
              ₹{summary.totalSpent.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
              {summary.expenseCount} खर्चे दर्ज
            </p>
          </div>
        </div>

        {/* Card 5: Net Balance In Hand (Available - Spent) */}
        <div
          className="card summary-card"
          style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: `4px solid ${summary.netBalance >= 0 ? '#10b981' : '#ef4444'}`,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: summary.netBalance >= 0 ? '#059669' : '#dc2626' }}>
              🏦 वर्तमान शुद्ध शेष बचत
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 6,
                fontWeight: 700,
                background: summary.netBalance >= 0 ? '#ecfdf5' : '#fef2f2',
                color: summary.netBalance >= 0 ? '#059669' : '#dc2626',
              }}
            >
              {summary.netBalance >= 0 ? 'बचत' : 'घाटा'}
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: summary.netBalance >= 0 ? '#10b981' : '#ef4444' }}>
              ₹{summary.netBalance.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
              हाथ में उपलब्ध शेष फंड
            </p>
          </div>
        </div>

        {/* Card 6: Pending Contributions */}
        <div
          className="card summary-card"
          style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: '4px solid #f59e0b',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>
              ⏳ पेंडिंग अंशदान
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
              ₹{summary.totalUnpaid.toLocaleString('en-IN')}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, margin: 0 }}>
              {summary.unpaidCount} सदस्यों का बकाया
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher & Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
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
        {/* View Tabs: Register vs Member Matrix */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setActiveViewTab('register')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeViewTab === 'register' ? 'var(--brand-primary)' : 'transparent',
              color: activeViewTab === 'register' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            📋 मासिक रजिस्टर (Ledger)
          </button>
          <button
            onClick={() => setActiveViewTab('members')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeViewTab === 'members' ? 'var(--brand-primary)' : 'transparent',
              color: activeViewTab === 'members' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            👥 सदस्य अंशदान स्थिति ({memberList.length})
          </button>
        </div>

        {/* Status Filter Tabs (for register view) */}
        {activeViewTab === 'register' && (
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
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
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
        )}

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

      {/* VIEW 1: Main Register / Ledger Table */}
      {activeViewTab === 'register' && (
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
                  <th style={{ padding: '12px 14px' }}>
                    सदस्य का नाम<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Member Name</span>
                  </th>
                  <th style={{ padding: '12px 14px' }}>
                    विवरण/शीर्षक<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Title / Purpose</span>
                  </th>
                  <th style={{ padding: '12px 14px' }}>
                    कंट्रीब्यूशन स्टेटस<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Status</span>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>
                    रकम<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Amount</span>
                  </th>
                  <th style={{ padding: '12px 14px' }}>
                    जमा हुआ / रिसीवर<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Collected By</span>
                  </th>
                  <th style={{ padding: '12px 14px' }}>
                    मुख्य खर्चकर्ता<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Spent By</span>
                  </th>
                  <th style={{ padding: '12px 14px' }}>
                    कहां खर्च किया<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Location / Paid To</span>
                  </th>
                  <th style={{ padding: '12px 14px' }}>
                    तारीख<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Date</span>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                    एक्शन<br />
                    <span style={{ fontSize: 11, fontWeight: 400 }}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ========================================================
                    CRITICAL REQUIREMENT:
                    "jab agle month aa jaye to pichhale month ka bacha hua
                     rashi agale month likhakar aaye na ki sabka name"
                    Opening Row: Shows "पिछले महीने की बची हुई राशि"
                    instead of listing all individual members' names!
                    ======================================================== */}
                {selectedMonth !== 'all' &&
                  includePreviousBalance &&
                  typeFilter !== 'expenses' &&
                  typeFilter !== 'unpaid' &&
                  (prevMonthInfo.hasPriorData || prevMonthInfo.balance !== 0) && (
                    <tr
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(99, 102, 241, 0.09) 0%, rgba(16, 185, 129, 0.06) 100%)',
                        borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {/* 1. Member Name: Shows generic Opening Balance badge instead of repeating names */}
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>💼</span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--brand-primary)',
                              fontWeight: 700,
                            }}
                          >
                            प्रारंभिक शेष / Opening
                          </span>
                        </div>
                      </td>

                      {/* 2. Title: "पिछले महीने की बची हुई राशि" */}
                      <td style={{ padding: '14px', color: 'var(--text-primary)' }}>
                        <div style={{ fontWeight: 800, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>💰 पिछले महीने की बची हुई राशि</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {prevMonthInfo.previousMonthLabel
                            ? `${prevMonthInfo.previousMonthLabel} से आगे लाई गई शेष राशि (Carry Forward Balance)`
                            : 'पिछले महीने का बचा हुआ शेष फंड'}
                        </div>
                      </td>

                      {/* 3. Status */}
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: prevMonthInfo.balance >= 0 ? '#ecfdf5' : '#fef2f2',
                            color: prevMonthInfo.balance >= 0 ? '#059669' : '#dc2626',
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>बची हुई राशि / Carried Forward</span>
                        </span>
                      </td>

                      {/* 4. Amount */}
                      <td
                        style={{
                          padding: '14px',
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: 15,
                          color: prevMonthInfo.balance >= 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {prevMonthInfo.balance >= 0 ? '+' : ''}₹{prevMonthInfo.balance.toLocaleString('en-IN')}
                      </td>

                      {/* 5. Collected By */}
                      <td style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                        पिछला बचत फंड (Prior Fund)
                      </td>

                      {/* 6. Spent By */}
                      <td style={{ padding: '14px', color: 'var(--text-tertiary)' }}>—</td>

                      {/* 7. Location */}
                      <td style={{ padding: '14px', color: 'var(--text-tertiary)' }}>—</td>

                      {/* 8. Date */}
                      <td style={{ padding: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {selectedMonth}-01
                      </td>

                      {/* 9. Actions */}
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                          title="यह पिछले महीने के कुल जमा और खर्च की बची हुई राशि से स्वतः निर्धारित है"
                        >
                          🔒 स्वतः शेष
                        </span>
                      </td>
                    </tr>
                  )}

                {/* Regular Entries for the Selected Month */}
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-tertiary)' }}
                    >
                      {selectedMonth !== 'all' && prevMonthInfo.balance !== 0
                        ? `इस महीने (${formatHindiMonth(selectedMonth)}) की नई प्रविष्टियाँ अभी दर्ज नहीं हुई हैं। पिछले महीने की बची हुई राशि (₹${prevMonthInfo.balance.toLocaleString('en-IN')}) ऊपर उपलब्ध है।`
                        : "कोई रिकॉर्ड नहीं मिला। नई एंट्री जोड़ने के लिए '+ नई एंट्री जोड़ें' बटन दबाएँ।"}
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
      )}

      {/* VIEW 2: Member Status Matrix */}
      {activeViewTab === 'members' && (
        <div
          className="card"
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              👥 {formatHindiMonth(selectedMonth)} — सदस्य कंट्रीब्यूशन स्थिति
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              यहाँ आप सभी सदस्यों का अंशदान देख सकते हैं तथा पेंडिंग होने पर सीधे याद दिलाने का संदेश कॉपी कर सकते हैं।
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {memberList.map((member) => {
              const currentMonthEntry = entries.find(
                (e) =>
                  e.type === 'contribution' &&
                  e.memberName === member.memberName &&
                  (selectedMonth === 'all' || (e.date && e.date.startsWith(selectedMonth)))
              );

              const isPaid = currentMonthEntry?.status === 'paid';
              const amount = currentMonthEntry?.amount || 1000;

              return (
                <div
                  key={member.memberName}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: isPaid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                    border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        👤 {member.memberName}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                        कुल जमा: ₹{member.totalContributed.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: isPaid ? '#ecfdf5' : '#fffbeb',
                        color: isPaid ? '#059669' : '#d97706',
                      }}
                    >
                      {isPaid ? '✅ जमा (Paid)' : '⏳ बाकी (Unpaid)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: isPaid ? '#10b981' : '#f59e0b' }}>
                      ₹{amount.toLocaleString('en-IN')}
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {currentMonthEntry && (
                        <button
                          onClick={() => toggleStatus(currentMonthEntry.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          <RotateCcw size={12} /> स्थिति बदलें
                        </button>
                      )}

                      {!isPaid && (
                        <button
                          onClick={() => copyReminder(member.memberName, amount)}
                          className="btn btn-sm btn-secondary"
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            color: copiedId === member.memberName ? '#10b981' : 'var(--text-secondary)',
                          }}
                          title="व्हाट्सएप रिमांडर संदेश कॉपी करें"
                        >
                          {copiedId === member.memberName ? (
                            <>
                              <Check size={12} color="#10b981" /> कॉपीड!
                            </>
                          ) : (
                            <>
                              <Share2 size={12} /> रिमांडर
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          ADD / EDIT ENTRY MODAL
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
              {/* Entry Type Selector */}
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

              {/* Dynamic Field: Member Name */}
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
                      ? 'उदा. नवंबर 2026 मासिक कंट्रीब्यूशन'
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

              {/* Amount & Date Grid */}
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
                        setFormData({ ...formData, status: e.target.value as MonthlyContributionStatus })
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
