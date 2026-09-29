'use client';

import React from 'react';
import { X, Phone, FileText, Calendar, IndianRupee, ShoppingCart, TrendingUp, Tag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { HisabPerson } from '@/types';
import { getPersonFullSummary, getPersonTransactions, getEvents } from '@/store';
import { formatCurrency, formatDate } from '@/utils/helpers';

interface PersonDetailModalProps {
  person: HisabPerson | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (person: HisabPerson) => void;
}

export default function PersonDetailModal({
  person,
  isOpen,
  onClose,
  onEdit,
}: PersonDetailModalProps) {
  if (!isOpen || !person) return null;

  const summary = getPersonFullSummary(person.name);
  const transactions = getPersonTransactions(person.name);
  const events = getEvents();
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.name]));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 650, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: person.status === 'active'
                  ? 'linear-gradient(135deg, var(--brand-primary), #8b5cf6)'
                  : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{person.name}</h2>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontWeight: 600,
                    background: person.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                    color: person.status === 'active' ? '#059669' : '#64748b',
                  }}
                >
                  {person.status === 'active' ? 'Active / सक्रिय' : 'Inactive / निष्क्रीय'}
                </span>
                {person.isDemo && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#d97706',
                    }}
                  >
                    Demo
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                {person.mobile ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} /> {person.mobile}
                  </span>
                ) : (
                  <span>मोबाइल नंबर उपलब्ध नहीं</span>
                )}
                {person.note && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileText size={13} /> {person.note}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {/* Associated Events */}
          {person.eventIds && person.eventIds.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 6 }}>
                संबंधित Event / Associated Events:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {person.eventIds.map((eid) => (
                  <span
                    key={eid}
                    style={{
                      fontSize: 12,
                      padding: '3px 10px',
                      borderRadius: 8,
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Calendar size={12} /> {eventMap[eid] || 'Event'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            <div style={{ textAlign: 'center', padding: '12px 6px', background: 'var(--income-bg)', borderRadius: 10 }}>
              <TrendingUp size={16} style={{ color: 'var(--income-color)', marginBottom: 4 }} />
              <p style={{ fontSize: 10, color: 'var(--income-color)', fontWeight: 600 }}>कुल दिया / Given</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--income-color)', marginTop: 2 }}>
                {formatCurrency(summary.totalGiven)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 6px', background: 'var(--brand-primary-light)', borderRadius: 10 }}>
              <IndianRupee size={16} style={{ color: 'var(--brand-primary)', marginBottom: 4 }} />
              <p style={{ fontSize: 10, color: 'var(--brand-primary)', fontWeight: 600 }}>कुल मिला / Received</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-primary)', marginTop: 2 }}>
                {formatCurrency(summary.totalReceived)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 6px', background: 'var(--expense-bg)', borderRadius: 10 }}>
              <ShoppingCart size={16} style={{ color: 'var(--expense-color)', marginBottom: 4 }} />
              <p style={{ fontSize: 10, color: 'var(--expense-color)', fontWeight: 600 }}>कुल खर्च / Spent</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--expense-color)', marginTop: 2 }}>
                {formatCurrency(summary.totalSpent)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 6px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <Tag size={16} style={{ color: 'var(--text-secondary)', marginBottom: 4 }} />
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>कुल लेनदेन</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {summary.transactionCount}
              </p>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              📜 लेनदेन इतिहास / Transaction History ({transactions.length})
            </h3>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', background: 'var(--bg-tertiary)', borderRadius: 10, color: 'var(--text-tertiary)', fontSize: 13 }}>
                इस व्यक्ति का अभी कोई लेनदेन दर्ज नहीं है।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 10,
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: t.type === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: t.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)',
                          flexShrink: 0,
                        }}
                      >
                        {t.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {t.role}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>•</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {t.from} → {t.to}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11, color: 'var(--text-tertiary)' }}>
                          <span>📅 {formatDate(t.date)}</span>
                          <span>•</span>
                          <span>🎪 {t.eventName}</span>
                          {t.purpose && (
                            <>
                              <span>•</span>
                              <span>{t.purpose}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: t.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)',
                        }}
                      >
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 24px' }}>
          <button className="btn btn-secondary" onClick={() => { onEdit(person); onClose(); }}>
            एडिट करें / Edit
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            बंद करें / Close
          </button>
        </div>
      </div>
    </div>
  );
}
