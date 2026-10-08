'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowRight,
  IndianRupee,
  ShoppingCart,
  BarChart3,
  Trash2,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  getGlobalSummary,
  getEvents,
  getRecentTransactions,
  loadSampleData,
  getCategorySummary,
  getEventSummary,
  hasDemoData,
  deleteDemoData,
} from '@/store';
import {
  formatCurrency,
  formatDate,
  CATEGORY_LABELS,
  getCategoryColor,
} from '@/utils/helpers';
import { HisabEvent, getEventTypeConfig } from '@/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalReceived: 0,
    totalSpent: 0,
    totalBalance: 0,
    totalOpening: 0,
  });
  const [events, setEvents] = useState<HisabEvent[]>([]);
  const [recentTxns, setRecentTxns] = useState<ReturnType<typeof getRecentTransactions>>([]);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [demoActive, setDemoActive] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  useEffect(() => {
    loadSampleData();
    refreshData();
    setMounted(true);
  }, []);

  const refreshData = () => {
    setSummary(getGlobalSummary());
    setEvents(getEvents().filter((e) => !e.isArchived).slice(0, 4));
    setRecentTxns(getRecentTransactions(8));
    setDemoActive(hasDemoData());

    // Get category data from all events
    const allEvents = getEvents();
    const categoryMap: Record<string, number> = {};
    allEvents.forEach((ev) => {
      const cats = getCategorySummary(ev.id);
      cats.forEach((c) => {
        categoryMap[c.category] = (categoryMap[c.category] || 0) + c.amount;
      });
    });
    setChartData(
      Object.entries(categoryMap).map(([key, value]) => ({
        name: CATEGORY_LABELS[key]?.en || key,
        value,
      }))
    );
  };

  const handleDeleteDemo = () => {
    deleteDemoData();
    setShowDemoConfirm(false);
    refreshData();
    showToast('सभी Demo Data सफलतापूर्वक हटा दिया गया।');
  };

  if (!mounted) return <AppLayout><div /></AppLayout>;

  return (
    <AppLayout>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">डैशबोर्ड / Dashboard</h1>
            <p className="page-subtitle">सभी इवेंट्स, लेन-देन और हिसाब-किताब का संक्षिप्त विवरण</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/people" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Users size={16} />
              <span>सदस्य / लोग</span>
            </Link>
            <Link href="/events/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={18} />
              <span>नया Event</span>
            </Link>
          </div>
        </div>

        {/* Demo Data Banner */}
        {demoActive && (
          <div
            style={{
              padding: '12px 18px',
              marginBottom: 20,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f59e0b', color: 'white', fontWeight: 700 }}>
                Demo Data
              </span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                यह सैंपल डेटा है। आप ऐप समझने के बाद इसे कभी भी एक क्लिक में हटा सकते हैं।
              </p>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              style={{ color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.4)' }}
              onClick={() => setShowDemoConfirm(true)}
            >
              <Trash2 size={14} /> Delete Demo Data
            </button>
          </div>
        )}


        {/* EVENTS SUMMARY CARDS */}
        <div className="grid-summary" style={{ marginBottom: 28 }}>
              <div className="card summary-card events">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
                      कुल Event / Total Events
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {summary.totalEvents}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {summary.activeEvents} Active
                    </p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(245,158,11,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#f59e0b',
                  }}>
                    <Calendar size={22} />
                  </div>
                </div>
              </div>

              <div className="card summary-card income">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
                      कुल Event आय / Received
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--income-color)' }}>
                      {formatCurrency(summary.totalReceived)}
                    </p>
                    {summary.totalOpening > 0 && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        +{formatCurrency(summary.totalOpening)} Opening
                      </p>
                    )}
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--income-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--income-color)',
                  }}>
                    <TrendingUp size={22} />
                  </div>
                </div>
              </div>

              <div className="card summary-card expense">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
                      कुल Event खर्च / Spent
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--expense-color)' }}>
                      {formatCurrency(summary.totalSpent)}
                    </p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--expense-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--expense-color)',
                  }}>
                    <TrendingDown size={22} />
                  </div>
                </div>
              </div>

              <div className="card summary-card balance">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>
                      Event शेष राशि / Balance
                    </p>
                    <p style={{
                      fontSize: 28, fontWeight: 700,
                      color: summary.totalBalance >= 0 ? 'var(--brand-primary)' : 'var(--expense-color)',
                    }}>
                      {formatCurrency(summary.totalBalance)}
                    </p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--brand-primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--brand-primary)',
                  }}>
                    <Wallet size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
              <Link href="/events/new" className="btn btn-sm btn-secondary">
                <Calendar size={15} /> नया Event बनाएँ
              </Link>
              <Link href="/people" className="btn btn-sm btn-secondary">
                <Users size={15} /> सदस्य / लोग
              </Link>
              <Link href="/reports" className="btn btn-sm btn-secondary">
                <BarChart3 size={15} /> रिपोर्ट देखें
              </Link>
            </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Events */}
          <div className="card" style={{ gridColumn: 'span 1' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>📅 इवेंट / Events</h3>
              <Link href="/events" style={{ fontSize: 13, color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                सभी देखें <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ padding: 12 }}>
              {events.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <p className="empty-state-text">अभी कोई Event नहीं है</p>
                  <Link href="/events/new" className="btn btn-primary btn-sm">
                    <Plus size={15} /> नया Event बनाएँ
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {events.map((event) => {
                    const evSummary = getEventSummary(event.id);
                    const typeConfig = getEventTypeConfig(event.eventType);
                    const isDukandar = event.eventType === 'dukandar_diary';
                    const isContribution = event.eventType === 'contribution';
                    const isPersonal = event.eventType === 'personal_expense';

                    return (
                      <Link
                        key={event.id}
                        href={`/events/detail?id=${event.id}`}
                        className="card card-interactive"
                        style={{ padding: '14px 16px', textDecoration: 'none', display: 'block' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                {event.name}
                              </h4>
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '1px 6px',
                                  borderRadius: 6,
                                  background: typeConfig.badgeBg,
                                  color: typeConfig.badgeColor,
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                <span>{typeConfig.icon}</span>
                                <span>{typeConfig.shortHi}</span>
                              </span>
                              {event.isDemo && (
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontWeight: 600 }}>
                                  Demo
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                              {formatDate(event.startDate)}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-primary)' }}>
                              {formatCurrency(evSummary.balance)}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                              {evSummary.totalTransactions} {isDukandar ? 'प्रविष्टियाँ' : isPersonal ? 'खर्चे' : 'transactions'}
                            </p>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex', gap: 16, marginTop: 10,
                          fontSize: 12, color: 'var(--text-secondary)',
                        }}>
                          <span style={{ color: 'var(--income-color)' }}>
                            ↑ {isDukandar ? 'जमा ' : isContribution ? 'अंशदान ' : isPersonal ? 'आय ' : ''}{formatCurrency(evSummary.totalReceived)}
                          </span>
                          <span style={{ color: 'var(--expense-color)' }}>
                            ↓ {isDukandar ? 'सामान ' : isContribution ? 'खर्च ' : isPersonal ? 'दैनिक खर्च ' : ''}{formatCurrency(evSummary.totalSpent)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card" style={{ gridColumn: 'span 1' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>🔄 हाल के लेनदेन / Recent Transactions</h3>
            </div>
            <div style={{ padding: 12 }}>
              {recentTxns.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <p className="empty-state-text">कोई लेनदेन नहीं है</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recentTxns.map((txn) => (
                    <Link
                      key={txn.id}
                      href={`/events/detail?id=${txn.eventId}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="transaction-card" style={{ padding: '10px 14px' }}>
                        <div className={`transaction-icon ${txn.type}`}>
                          {txn.type === 'income' ? <IndianRupee size={18} /> : <ShoppingCart size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{
                                fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {txn.from} → {txn.to}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                {txn.eventName} • {formatDate(txn.date)}
                              </p>
                            </div>
                            <span className={`transaction-amount ${txn.type}`} style={{ fontSize: 14, whiteSpace: 'nowrap', marginLeft: 8 }}>
                              {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Chart */}
          {chartData.length > 0 && (
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>📊 श्रेणी अनुसार खर्च / Expense by Category</h3>
              </div>
              <div style={{ padding: 20, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 220, height: 220, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                  {chartData.map((item, index) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: 3,
                          background: getCategoryColor(index),
                        }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Demo Delete Confirm */}
        <ConfirmDialog
          isOpen={showDemoConfirm}
          title="सभी Demo Data हटाएँ?"
          message="क्या आप वाकई सभी Demo Events और Demo डेटा हटाना चाहते हैं? आपके खुद के बनाए Events और डेटा सुरक्षित रहेंगे।"
          confirmText="हाँ, Demo Data हटाएँ"
          cancelText="रद्द करें / Cancel"
          onConfirm={handleDeleteDemo}
          onCancel={() => setShowDemoConfirm(false)}
        />

        {/* Responsive: stack columns on mobile */}
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
    </AppLayout>
  );
}
