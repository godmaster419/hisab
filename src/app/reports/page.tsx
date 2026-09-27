'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import {
  BarChart3, Download, FileSpreadsheet, Calendar, TrendingUp, TrendingDown, Wallet,
} from 'lucide-react';
import {
  getEvents, getEventSummary, getGlobalSummary, getCategorySummary, getAllExpenses,
  getMoneyReceivedByEvent, getExpensesByEvent,
} from '@/store';
import { formatCurrency, formatDate, CATEGORY_LABELS, getCategoryColor } from '@/utils/helpers';
import { HisabEvent } from '@/types';
import { downloadEventPDF } from '@/utils/pdf';
import { exportEventExcel } from '@/utils/export';
import { useToast } from '@/components/Toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<HisabEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [globalSummary, setGlobalSummary] = useState({ totalEvents: 0, activeEvents: 0, totalReceived: 0, totalSpent: 0, totalBalance: 0, totalOpening: 0 });

  useEffect(() => {
    setMounted(true);
    setEvents(getEvents());
    setGlobalSummary(getGlobalSummary());
  }, []);

  if (!mounted) return <AppLayout><div /></AppLayout>;

  // Compute data based on selected event
  const allCategories: Record<string, number> = {};
  const eventsToShow = selectedEvent === 'all' ? events : events.filter((e) => e.id === selectedEvent);

  eventsToShow.forEach((ev) => {
    const cats = getCategorySummary(ev.id);
    cats.forEach((c) => {
      allCategories[c.category] = (allCategories[c.category] || 0) + c.amount;
    });
  });

  const chartData = Object.entries(allCategories).map(([key, value]) => ({
    name: CATEGORY_LABELS[key]?.en || key,
    value,
  }));

  // Event comparison data
  const comparisonData = events.map((ev) => {
    const s = getEventSummary(ev.id);
    return { name: ev.name.length > 15 ? ev.name.substring(0, 15) + '...' : ev.name, received: s.totalReceived, spent: s.totalSpent, balance: s.balance };
  });

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">📊 रिपोर्ट / Reports</h1>
          <p className="page-subtitle">सभी Event का विश्लेषण एक जगह देखें</p>
        </div>

        {/* Event Filter */}
        <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0 }}>Event चुनें:</label>
          <select
            className="form-input"
            style={{ maxWidth: 300 }}
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="all">सभी Events / All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          {selectedEvent !== 'all' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  const ev = events.find((e) => e.id === selectedEvent);
                  if (!ev) return;
                  downloadEventPDF(ev, getMoneyReceivedByEvent(ev.id), getExpensesByEvent(ev.id));
                  showToast('PDF डाउनलोड हो रहा है...');
                }}
              >
                <Download size={14} /> PDF Download
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={async () => {
                  const ev = events.find((e) => e.id === selectedEvent);
                  if (!ev) return;
                  await exportEventExcel(ev, getMoneyReceivedByEvent(ev.id), getExpensesByEvent(ev.id));
                  showToast('Excel डाउनलोड हो रहा है...');
                }}
              >
                <FileSpreadsheet size={14} /> Excel Export
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid-summary" style={{ marginBottom: 28 }}>
          <div className="card summary-card income">
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>कुल आय / Received</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--income-color)' }}>
              {formatCurrency(selectedEvent === 'all' ? globalSummary.totalReceived : getEventSummary(selectedEvent).totalReceived)}
            </p>
          </div>
          <div className="card summary-card expense">
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>कुल खर्च / Spent</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--expense-color)' }}>
              {formatCurrency(selectedEvent === 'all' ? globalSummary.totalSpent : getEventSummary(selectedEvent).totalSpent)}
            </p>
          </div>
          <div className="card summary-card balance">
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 4 }}>शेष / Balance</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-primary)' }}>
              {formatCurrency(selectedEvent === 'all' ? globalSummary.totalBalance : getEventSummary(selectedEvent).balance)}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Category Pie Chart */}
          {chartData.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>🍕 श्रेणी अनुसार खर्च / Expense by Category</h3>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {chartData.map((_, i) => <Cell key={i} fill={getCategoryColor(i)} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Event Comparison Bar Chart */}
          {comparisonData.length > 1 && selectedEvent === 'all' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>📊 Event तुलना / Event Comparison</h3>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="received" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {chartData.length > 0 && (
            <div className="card" style={{ padding: 20, gridColumn: chartData.length > 0 && comparisonData.length <= 1 ? 'span 1' : undefined }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📋 श्रेणी विवरण / Category Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chartData.sort((a, b) => b.value - a.value).map((item, i) => {
                  const total = chartData.reduce((s, c) => s + c.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(item.value)} ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: getCategoryColor(i), borderRadius: 3, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Event List with Download */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📑 Event रिपोर्ट डाउनलोड करें</h3>
            {events.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>कोई Event नहीं है</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {events.map((ev) => {
                  const s = getEventSummary(ev.id);
                  return (
                    <div key={ev.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 10,
                    }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{ev.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          Balance: {formatCurrency(s.balance)} • {s.totalTransactions} txns
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            downloadEventPDF(ev, getMoneyReceivedByEvent(ev.id), getExpensesByEvent(ev.id));
                            showToast('PDF डाउनलोड हो रहा है...');
                          }}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        <Link href={`/events/detail?id=${ev.id}`} className="btn btn-sm btn-ghost" title="View Event">
                          <BarChart3 size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 768px) {
            div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
