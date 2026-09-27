'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import AddMoneyModal from '@/components/AddMoneyModal';
import AddExpenseModal from '@/components/AddExpenseModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  ArrowLeft, Plus, IndianRupee, ShoppingCart, Download, Printer,
  Edit, Trash2, Eye, MoreVertical, FileText, FileSpreadsheet, AlertTriangle,
  Users, BarChart3, Clock, TrendingUp, TrendingDown, Wallet,
} from 'lucide-react';
import {
  getEvent, getEventSummary, getMoneyReceivedByEvent, getExpensesByEvent,
  getTransactionHistory, getCategorySummary, getPersonSummary,
  deleteMoneyReceived, deleteExpense,
} from '@/store';
import { formatCurrency, formatDate, CATEGORY_LABELS, PAYMENT_LABELS, getCategoryColor } from '@/utils/helpers';
import { HisabEvent, MoneyReceived, Expense, ExpenseCategory } from '@/types';
import { downloadEventPDF, printEventPDF } from '@/utils/pdf';
import { exportMoneyReceivedCSV, exportExpensesCSV, exportEventExcel } from '@/utils/export';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

function EventDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const router = useRouter();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [event, setEvent] = useState<HisabEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'history' | 'people' | 'categories'>('overview');

  // Modals
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editMoney, setEditMoney] = useState<MoneyReceived | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'income' | 'expense'; id: string } | null>(null);

  // Data
  const [money, setMoney] = useState<MoneyReceived[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ totalReceived: 0, totalSpent: 0, balance: 0, openingBalance: 0, incomeCount: 0, expenseCount: 0, totalTransactions: 0 });
  const [categories, setCategories] = useState<ReturnType<typeof getCategorySummary>>([]);
  const [people, setPeople] = useState<ReturnType<typeof getPersonSummary>>([]);
  const [transactions, setTransactions] = useState<ReturnType<typeof getTransactionHistory>>([]);

  useEffect(() => {
    setMounted(true);
    const ev = getEvent(id);
    if (!ev) {
      router.push('/events');
      return;
    }
    setEvent(ev);
    refreshData();
  }, [id, router]);

  const refreshData = () => {
    setMoney(getMoneyReceivedByEvent(id));
    setExpenses(getExpensesByEvent(id));
    setSummary(getEventSummary(id));
    setCategories(getCategorySummary(id));
    setPeople(getPersonSummary(id));
    setTransactions(getTransactionHistory(id));
  };

  const handleDeleteTransaction = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'income') {
      deleteMoneyReceived(deleteConfirm.id);
    } else {
      deleteExpense(deleteConfirm.id);
    }
    setDeleteConfirm(null);
    refreshData();
    showToast('लेनदेन सफलतापूर्वक हटा दिया गया।');
  };

  const handleDownloadPDF = () => {
    if (!event) return;
    downloadEventPDF(event, money, expenses);
    showToast('PDF डाउनलोड हो रहा है...');
  };

  const handlePrintPDF = () => {
    if (!event) return;
    printEventPDF(event, money, expenses);
  };

  const handleExportExcel = async () => {
    if (!event) return;
    await exportEventExcel(event, money, expenses);
    showToast('Excel डाउनलोड हो रहा है...');
  };

  if (!mounted || !event) return <AppLayout><div /></AppLayout>;

  const chartData = categories.map((c) => ({
    name: CATEGORY_LABELS[c.category]?.en || c.category,
    value: c.amount,
  }));

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/events')} style={{ marginBottom: 8 }}>
              <ArrowLeft size={16} /> Events
            </button>
            <h1 className="page-title">{event.name}</h1>
            <p className="page-subtitle">
              📆 {formatDate(event.startDate)}
              {event.endDate && ` — ${formatDate(event.endDate)}`}
              {event.responsiblePerson && ` • 👤 ${event.responsiblePerson}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-income btn-sm" onClick={() => setShowAddMoney(true)}>
              <IndianRupee size={15} /> पैसा जोड़ें
            </button>
            <button className="btn btn-expense btn-sm" onClick={() => setShowAddExpense(true)}>
              <ShoppingCart size={15} /> खर्च जोड़ें
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>
              <Download size={15} /> PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handlePrintPDF}>
              <Printer size={15} /> Print
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}>
              <FileSpreadsheet size={15} /> Excel
            </button>
            <Link href={`/events/edit?id=${id}`} className="btn btn-secondary btn-sm">
              <Edit size={15} /> इवेंट एडिट
            </Link>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid-summary" style={{ marginBottom: 24 }}>
          {summary.openingBalance > 0 && (
            <div className="card summary-card events">
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
                शुरुआती राशि / Opening
              </p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(summary.openingBalance)}</p>
            </div>
          )}
          <div className="card summary-card income">
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
              कुल आय / Total Received
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--income-color)' }}>{formatCurrency(summary.totalReceived)}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{summary.incomeCount} entries</p>
          </div>
          <div className="card summary-card expense">
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
              कुल खर्च / Total Spent
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--expense-color)' }}>{formatCurrency(summary.totalSpent)}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{summary.expenseCount} entries</p>
          </div>
          <div className="card summary-card balance">
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
              शेष राशि / Balance
            </p>
            <p style={{
              fontSize: 24, fontWeight: 700,
              color: summary.balance >= 0 ? 'var(--brand-primary)' : 'var(--expense-color)',
            }}>
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>

        {/* Balance Warning */}
        {summary.balance < 0 && (
          <div className="warning-banner" style={{ marginBottom: 20 }}>
            <AlertTriangle size={18} />
            ध्यान दें: खर्च उपलब्ध राशि से अधिक है! / Warning: Expenses exceed available balance!
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          {[
            { key: 'overview', label: '📊 सारांश', labelEn: 'Overview' },
            { key: 'income', label: '💰 आय', labelEn: 'Income' },
            { key: 'expenses', label: '🧾 खर्च', labelEn: 'Expenses' },
            { key: 'history', label: '🔄 इतिहास', labelEn: 'History' },
            { key: 'people', label: '👥 लोग', labelEn: 'People' },
            { key: 'categories', label: '📈 श्रेणी', labelEn: 'Categories' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* === OVERVIEW === */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Category Chart */}
            {chartData.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📊 श्रेणी अनुसार खर्च</h3>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {chartData.map((_, i) => <Cell key={i} fill={getCategoryColor(i)} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {chartData.map((item, i) => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: getCategoryColor(i) }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top People */}
            {people.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>👥 प्रमुख लोग / Key People</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {people.slice(0, 6).map((p) => (
                    <div key={p.name} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8,
                    }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.transactionCount} transactions</p>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', gap: 12 }}>
                        {p.moneyGiven > 0 && <span style={{ fontSize: 12, color: 'var(--income-color)' }}>↑{formatCurrency(p.moneyGiven)}</span>}
                        {p.moneySpent > 0 && <span style={{ fontSize: 12, color: 'var(--expense-color)' }}>↓{formatCurrency(p.moneySpent)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="card" style={{ gridColumn: 'span 2', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔄 हाल के लेनदेन</h3>
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>कोई लेनदेन नहीं है</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {transactions.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="transaction-card">
                      <div className={`transaction-icon ${txn.type}`}>
                        {txn.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: 13, fontWeight: 500 }}>{txn.from} → {txn.to}</p>
                          <span className={`transaction-amount ${txn.type}`}>{txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {formatDate(txn.date)} • {txn.purpose || CATEGORY_LABELS[txn.category || '']?.en || '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <style jsx>{`
              @media (max-width: 768px) {
                div[style*="grid-template-columns: 1fr 1fr"] {
                  grid-template-columns: 1fr !important;
                }
                div[style*="grid-column: span 2"] {
                  grid-column: span 1 !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* === INCOME === */}
        {activeTab === 'income' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>💰 पैसा प्राप्त / Money Received</h3>
              <button className="btn btn-income btn-sm" onClick={() => { setEditMoney(null); setShowAddMoney(true); }}>
                <Plus size={15} /> पैसा जोड़ें
              </button>
            </div>

            {money.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><IndianRupee size={32} /></div>
                  <h3 className="empty-state-title">अभी कोई पैसा दर्ज नहीं किया गया है</h3>
                  <p className="empty-state-text">पैसे का रिकॉर्ड जोड़ने के लिए ऊपर बटन दबाएँ</p>
                  <button className="btn btn-income" onClick={() => setShowAddMoney(true)}>
                    <Plus size={16} /> पैसा जोड़ें
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="card responsive-table" style={{ overflow: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>तारीख / Date</th>
                        <th>देने वाला / Given By</th>
                        <th>राशि / Amount</th>
                        <th>जमा करने वाला / Deposited With</th>
                        <th>उद्देश्य / Purpose</th>
                        <th>Mode</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {money.map((m) => (
                        <tr key={m.id}>
                          <td>{formatDate(m.date)}</td>
                          <td style={{ fontWeight: 500 }}>{m.givenBy}</td>
                          <td style={{ fontWeight: 700, color: 'var(--income-color)' }}>{formatCurrency(m.amount)}</td>
                          <td>{m.depositedWith}</td>
                          <td>{m.purpose || '-'}</td>
                          <td><span className="badge badge-neutral">{PAYMENT_LABELS[m.paymentMethod]?.en || m.paymentMethod}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditMoney(m); setShowAddMoney(true); }} title="Edit">
                                <Edit size={14} />
                              </button>
                              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'income', id: m.id })} title="Delete" style={{ color: 'var(--expense-color)' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} style={{ fontWeight: 700 }}>कुल / Total</td>
                        <td style={{ fontWeight: 700, color: 'var(--income-color)', fontSize: 15 }}>{formatCurrency(summary.totalReceived)}</td>
                        <td colSpan={4}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="mobile-cards">
                  {money.map((m) => (
                    <div key={m.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--income-color)' }}>+{formatCurrency(m.amount)}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditMoney(m); setShowAddMoney(true); }}><Edit size={14} /></button>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'income', id: m.id })} style={{ color: 'var(--expense-color)' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        <strong>{m.givenBy}</strong> → {m.depositedWith}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {formatDate(m.date)} • {m.purpose || '-'} • {PAYMENT_LABELS[m.paymentMethod]?.en}
                      </p>
                      {m.note && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontStyle: 'italic' }}>📝 {m.note}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* === EXPENSES === */}
        {activeTab === 'expenses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>🧾 खर्च / Expenses</h3>
              <button className="btn btn-expense btn-sm" onClick={() => { setEditExpense(null); setShowAddExpense(true); }}>
                <Plus size={15} /> खर्च जोड़ें
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><ShoppingCart size={32} /></div>
                  <h3 className="empty-state-title">अभी कोई खर्च दर्ज नहीं किया गया है</h3>
                  <p className="empty-state-text">खर्च का रिकॉर्ड जोड़ने के लिए ऊपर बटन दबाएँ</p>
                  <button className="btn btn-expense" onClick={() => setShowAddExpense(true)}>
                    <Plus size={16} /> खर्च जोड़ें
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="card responsive-table" style={{ overflow: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>तारीख / Date</th>
                        <th>खर्च करने वाला / Spent By</th>
                        <th>प्राप्तकर्ता / Paid To</th>
                        <th>राशि / Amount</th>
                        <th>श्रेणी / Category</th>
                        <th>उद्देश्य / Purpose</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id}>
                          <td>{formatDate(e.date)}</td>
                          <td style={{ fontWeight: 500 }}>{e.spentBy}</td>
                          <td>{e.paidTo}</td>
                          <td style={{ fontWeight: 700, color: 'var(--expense-color)' }}>{formatCurrency(e.amount)}</td>
                          <td><span className="badge badge-neutral">{CATEGORY_LABELS[e.category]?.en || e.category}</span></td>
                          <td>{e.purpose || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditExpense(e); setShowAddExpense(true); }}><Edit size={14} /></button>
                              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'expense', id: e.id })} style={{ color: 'var(--expense-color)' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ fontWeight: 700 }}>कुल / Total</td>
                        <td style={{ fontWeight: 700, color: 'var(--expense-color)', fontSize: 15 }}>{formatCurrency(summary.totalSpent)}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="mobile-cards">
                  {expenses.map((e) => (
                    <div key={e.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--expense-color)' }}>-{formatCurrency(e.amount)}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditExpense(e); setShowAddExpense(true); }}><Edit size={14} /></button>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'expense', id: e.id })} style={{ color: 'var(--expense-color)' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{e.purpose || CATEGORY_LABELS[e.category]?.hi}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        <strong>{e.spentBy}</strong> → {e.paidTo}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {formatDate(e.date)} • {CATEGORY_LABELS[e.category]?.en} • {PAYMENT_LABELS[e.paymentMethod]?.en}
                      </p>
                      {e.items.length > 0 && (
                        <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 12 }}>
                          <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>📦 सामान / Items:</p>
                          {e.items.map((it) => (
                            <p key={it.id} style={{ color: 'var(--text-secondary)' }}>
                              {it.itemName} — {it.quantity} {it.unit} × ₹{it.rate} = {formatCurrency(it.total)}
                            </p>
                          ))}
                        </div>
                      )}
                      {e.note && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontStyle: 'italic' }}>📝 {e.note}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* === TRANSACTION HISTORY === */}
        {activeTab === 'history' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🔄 लेनदेन इतिहास / Transaction History</h3>
            {transactions.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><Clock size={32} /></div>
                  <h3 className="empty-state-title">कोई लेनदेन नहीं है</h3>
                  <p className="empty-state-text">पैसा या खर्च जोड़ने पर यहाँ इतिहास दिखेगा</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {transactions.map((txn) => (
                  <div key={txn.id} className="transaction-card">
                    <div className={`transaction-icon ${txn.type}`}>
                      {txn.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500 }}>
                            {txn.from} → {txn.to}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {formatDate(txn.date)} • {txn.purpose || CATEGORY_LABELS[txn.category || '']?.en || '-'} •{' '}
                            {PAYMENT_LABELS[txn.paymentMethod]?.en}
                          </p>
                          {txn.note && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontStyle: 'italic' }}>📝 {txn.note}</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`transaction-amount ${txn.type}`}>
                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </span>
                          <span className={`badge ${txn.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                            {txn.type === 'income' ? 'आय' : 'खर्च'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === PEOPLE === */}
        {activeTab === 'people' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>👥 लोग / People</h3>
            {people.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><Users size={32} /></div>
                  <h3 className="empty-state-title">कोई व्यक्ति नहीं है</h3>
                  <p className="empty-state-text">लेनदेन जोड़ने पर लोगों की जानकारी यहाँ दिखेगी</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {people.map((p) => (
                  <div key={p.name} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'var(--brand-primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--brand-primary)', fontWeight: 700, fontSize: 18,
                      }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.transactionCount} transactions</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div style={{ textAlign: 'center', padding: 8, background: 'var(--income-bg)', borderRadius: 8 }}>
                        <p style={{ fontSize: 10, color: 'var(--income-color)', fontWeight: 500 }}>दिया / Given</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--income-color)' }}>{formatCurrency(p.moneyGiven)}</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: 8, background: 'var(--brand-primary-light)', borderRadius: 8 }}>
                        <p style={{ fontSize: 10, color: 'var(--brand-primary)', fontWeight: 500 }}>मिला / Got</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-primary)' }}>{formatCurrency(p.moneyReceived)}</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: 8, background: 'var(--expense-bg)', borderRadius: 8 }}>
                        <p style={{ fontSize: 10, color: 'var(--expense-color)', fontWeight: 500 }}>खर्च / Spent</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--expense-color)' }}>{formatCurrency(p.moneySpent)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === CATEGORIES === */}
        {activeTab === 'categories' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📈 श्रेणी अनुसार / Category-wise Report</h3>
            {categories.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><BarChart3 size={32} /></div>
                  <h3 className="empty-state-title">कोई श्रेणी डेटा नहीं है</h3>
                  <p className="empty-state-text">खर्च जोड़ने पर श्रेणी विश्लेषण यहाँ दिखेगा</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categories.map((c, i) => (
                  <div key={c.category} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 36, borderRadius: 4, background: getCategoryColor(i) }} />
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 600 }}>
                            {CATEGORY_LABELS[c.category]?.hi} / {CATEGORY_LABELS[c.category]?.en}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.count} transactions</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(c.amount)}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.percentage}%</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${c.percentage}%`, height: '100%',
                        background: getCategoryColor(i), borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
                <div className="card" style={{ padding: 16, background: 'var(--bg-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>कुल खर्च / Total Expense</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--expense-color)' }}>{formatCurrency(summary.totalSpent)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <AddMoneyModal
          isOpen={showAddMoney}
          onClose={() => { setShowAddMoney(false); setEditMoney(null); }}
          eventId={id}
          editData={editMoney}
          onSaved={refreshData}
        />

        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => { setShowAddExpense(false); setEditExpense(null); }}
          eventId={id}
          editData={editExpense}
          onSaved={refreshData}
        />

        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="लेनदेन हटाएँ?"
          message="क्या आप वाकई इस लेनदेन को हटाना चाहते हैं? यह कार्य पूर्ववत नहीं किया जा सकता।"
          onConfirm={handleDeleteTransaction}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    </AppLayout>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>लोड हो रहा है...</p>
        </div>
      </AppLayout>
    }>
      <EventDetailContent />
    </Suspense>
  );
}
