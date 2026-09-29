'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  Plus, Search, Calendar, TrendingUp, TrendingDown, Wallet,
  MoreVertical, Edit, Trash2, Archive, Eye, Filter,
} from 'lucide-react';
import { getEvents, getEventSummary, deleteEvent, archiveEvent, unarchiveEvent } from '@/store';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { HisabEvent } from '@/types';

export default function EventsPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<HisabEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, []);

  const refreshData = () => {
    setEvents(getEvents());
  };

  const filteredEvents = events.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.responsiblePerson || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'active') return matchSearch && !e.isArchived;
    if (filter === 'archived') return matchSearch && e.isArchived;
    return matchSearch;
  });

  const handleDelete = (id: string) => {
    deleteEvent(id);
    setDeleteConfirm(null);
    refreshData();
    showToast('Event सफलतापूर्वक हटा दिया गया।');
  };

  const handleArchive = (id: string, archived: boolean) => {
    if (archived) {
      unarchiveEvent(id);
      showToast('Event restore किया गया।');
    } else {
      archiveEvent(id);
      showToast('Event archive किया गया।');
    }
    refreshData();
    setOpenMenu(null);
  };

  if (!mounted) return <AppLayout><div /></AppLayout>;

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">📅 इवेंट / Events</h1>
            <p className="page-subtitle">अपने सभी इवेंट यहाँ देखें और प्रबंधित करें</p>
          </div>
          <Link href="/events/new" className="btn btn-primary">
            <Plus size={18} />
            <span>नया Event बनाएँ</span>
          </Link>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="search-input" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Event खोजें... / Search Events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div className="tabs">
            {(['all', 'active', 'archived'] as const).map((f) => (
              <button
                key={f}
                className={`tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'सभी / All' : f === 'active' ? 'Active' : 'Archived'}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar size={36} />
              </div>
              <h3 className="empty-state-title">
                {searchQuery ? 'कोई Event नहीं मिला' : 'अभी कोई Event नहीं है'}
              </h3>
              <p className="empty-state-text">
                {searchQuery
                  ? 'कृपया अलग कीवर्ड से खोजें'
                  : 'नया Event बनाकर पैसों का हिसाब रखना शुरू करें'}
              </p>
              {!searchQuery && (
                <Link href="/events/new" className="btn btn-primary">
                  <Plus size={18} /> नया Event बनाएँ
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filteredEvents.map((event) => {
              const summary = getEventSummary(event.id);
              return (
                <div key={event.id} className="card card-interactive" style={{ position: 'relative' }}>
                  {event.isArchived && (
                    <div style={{
                      position: 'absolute', top: 12, right: 52,
                      background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)',
                      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                    }}>
                      Archived
                    </div>
                  )}

                  {event.isDemo && (
                    <div style={{
                      position: 'absolute', top: 12, right: event.isArchived ? 120 : 52,
                      background: 'rgba(245, 158, 11, 0.15)', color: '#d97706',
                      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    }}>
                      Demo Event
                    </div>
                  )}

                  {/* Menu */}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <button
                      className="btn btn-icon btn-ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenMenu(openMenu === event.id ? null : event.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenu === event.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: 36,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
                        minWidth: 180, zIndex: 10, overflow: 'hidden',
                      }}>
                        <Link
                          href={`/events/detail?id=${event.id}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', color: 'var(--text-primary)',
                            textDecoration: 'none', fontSize: 13,
                          }}
                          onClick={() => setOpenMenu(null)}
                        >
                          <Eye size={15} /> देखें / View
                        </Link>
                        <Link
                          href={`/events/edit?id=${event.id}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', color: 'var(--text-primary)',
                            textDecoration: 'none', fontSize: 13,
                          }}
                          onClick={() => setOpenMenu(null)}
                        >
                          <Edit size={15} /> एडिट / Edit
                        </Link>
                        <button
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', color: 'var(--text-primary)',
                            width: '100%', background: 'none', border: 'none',
                            cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                            textAlign: 'left',
                          }}
                          onClick={() => handleArchive(event.id, event.isArchived)}
                        >
                          <Archive size={15} /> {event.isArchived ? 'Restore' : 'Archive'}
                        </button>
                        <button
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', color: 'var(--expense-color)',
                            width: '100%', background: 'none', border: 'none',
                            cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                            textAlign: 'left',
                          }}
                          onClick={() => { setDeleteConfirm(event.id); setOpenMenu(null); }}
                        >
                          <Trash2 size={15} /> हटाएँ / Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <Link href={`/events/detail?id=${event.id}`} style={{ textDecoration: 'none', display: 'block', padding: 20 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, paddingRight: 40 }}>
                      {event.name}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                      📆 {formatDate(event.startDate)}
                      {event.responsiblePerson && ` • 👤 ${event.responsiblePerson}`}
                    </p>

                    {/* Mini Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--income-bg)', borderRadius: 8 }}>
                        <p style={{ fontSize: 11, color: 'var(--income-color)', fontWeight: 500 }}>आय / Received</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--income-color)', marginTop: 2 }}>
                          {formatCurrency(summary.totalReceived)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--expense-bg)', borderRadius: 8 }}>
                        <p style={{ fontSize: 11, color: 'var(--expense-color)', fontWeight: 500 }}>खर्च / Spent</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--expense-color)', marginTop: 2 }}>
                          {formatCurrency(summary.totalSpent)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--brand-primary-light)', borderRadius: 8 }}>
                        <p style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 500 }}>शेष / Balance</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-primary)', marginTop: 2 }}>
                          {formatCurrency(summary.balance)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-neutral">
                        {summary.totalTransactions} transactions
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--brand-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        View Details →
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="क्या आप इस Event को हटाना चाहते हैं?"
          message="इस Event को हटाने पर इससे जुड़े सभी पैसे, खर्च, सामान और transactions भी हट जाएंगे। यह कार्रवाई वापस नहीं की जा सकती।"
          confirmText="Delete Event"
          cancelText="Cancel"
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />

        {/* Click outside to close menu */}
        {openMenu && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 5 }}
            onClick={() => setOpenMenu(null)}
          />
        )}

        <style jsx>{`
          @media (max-width: 640px) {
            div[style*="grid-template-columns: repeat(auto-fill"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
