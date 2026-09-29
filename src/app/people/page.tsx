'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import AddPersonModal from '@/components/AddPersonModal';
import PersonDetailModal from '@/components/PersonDetailModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  Users, UserPlus, Search, Phone, Edit, Trash2, Eye, UserX, UserCheck,
  TrendingUp, IndianRupee, ShoppingCart, Tag, Filter,
} from 'lucide-react';
import {
  getPeople, getPersonFullSummary, getPersonTransactionCount,
  deletePerson, deactivatePerson, activatePerson,
} from '@/store';
import { formatCurrency } from '@/utils/helpers';
import { HisabPerson } from '@/types';

export default function PeoplePage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [people, setPeople] = useState<HisabPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<HisabPerson | null>(null);
  const [viewingPerson, setViewingPerson] = useState<HisabPerson | null>(null);

  // Delete / Deactivate dialog state
  const [deleteTarget, setDeleteTarget] = useState<HisabPerson | null>(null);
  const [hasTxnWarning, setHasTxnWarning] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, []);

  const refreshData = () => {
    setPeople(getPeople());
  };

  const handleStartDelete = (person: HisabPerson) => {
    const txnCount = getPersonTransactionCount(person.name);
    setDeleteTarget(person);
    setHasTxnWarning(txnCount > 0);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (hasTxnWarning) {
      // Deactivate person if they have transactions
      deactivatePerson(deleteTarget.id);
      showToast(`${deleteTarget.name} को निष्क्रीय (Deactivated) कर दिया गया। पुराने हिसाब सुरक्षित हैं।`);
    } else {
      // Safe permanent delete since 0 transactions
      const success = deletePerson(deleteTarget.id);
      if (success) {
        showToast(`${deleteTarget.name} को सफलतापूर्वक हटा दिया गया।`);
      } else {
        showToast('हटाने में समस्या आई।', 'error');
      }
    }

    setDeleteTarget(null);
    setHasTxnWarning(false);
    refreshData();
  };

  const handleToggleStatus = (person: HisabPerson) => {
    if (person.status === 'active') {
      deactivatePerson(person.id);
      showToast(`${person.name} को निष्क्रीय (Deactivated) किया गया`);
    } else {
      activatePerson(person.id);
      showToast(`${person.name} को सक्रिय (Activated) किया गया`);
    }
    refreshData();
  };

  const filtered = people.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.mobile || '').includes(searchQuery);

    if (statusFilter === 'active') return matchesSearch && p.status === 'active';
    if (statusFilter === 'inactive') return matchesSearch && p.status === 'inactive';
    return matchesSearch;
  });

  if (!mounted) return <AppLayout><div /></AppLayout>;

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">👥 लोग / People</h1>
            <p className="page-subtitle">सभी इवेंट से जुड़े लोगों की सूची, हिसाब और प्रबंधन</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} />
            <span>+ व्यक्ति जोड़ें / Add Person</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="search-input" style={{ flex: 1, minWidth: 240 }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="नाम या मोबाइल नंबर खोजें... / Search Name or Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div className="tabs">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                className={`tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'सभी / All' : s === 'active' ? 'Active / सक्रिय' : 'Inactive / निष्क्रीय'}
              </button>
            ))}
          </div>
        </div>

        {/* People List */}
        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={36} /></div>
              <h3 className="empty-state-title">
                {searchQuery ? 'कोई व्यक्ति नहीं मिला' : 'अभी कोई व्यक्ति नहीं है'}
              </h3>
              <p className="empty-state-text">
                {searchQuery
                  ? 'कृपया अलग नाम या नंबर से खोजें'
                  : 'नया व्यक्ति जोड़ने के लिए ऊपर दिए बटन का उपयोग करें'}
              </p>
              {!searchQuery && (
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  <UserPlus size={18} /> + व्यक्ति जोड़ें
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
            {filtered.map((p) => {
              const summary = getPersonFullSummary(p.name);
              return (
                <div
                  key={p.id}
                  className="card card-interactive"
                  style={{
                    padding: 20,
                    opacity: p.status === 'inactive' ? 0.75 : 1,
                    position: 'relative',
                  }}
                >
                  {/* Top section: Avatar, Info, Status badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}
                      onClick={() => setViewingPerson(p)}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          background: p.status === 'active'
                            ? 'linear-gradient(135deg, var(--brand-primary), #8b5cf6)'
                            : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                            {p.name}
                          </h3>
                          {p.isDemo && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontWeight: 600 }}>
                              Demo
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {p.mobile ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={11} /> {p.mobile}
                            </span>
                          ) : (
                            'मोबाइल: —'
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 600,
                        background: p.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                        color: p.status === 'active' ? '#059669' : '#64748b',
                        flexShrink: 0,
                      }}
                    >
                      {p.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Summary badges */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--income-bg)', borderRadius: 8 }}>
                      <p style={{ fontSize: 10, color: 'var(--income-color)', fontWeight: 600 }}>दिया / Given</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--income-color)', marginTop: 2 }}>
                        {formatCurrency(summary.totalGiven)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--brand-primary-light)', borderRadius: 8 }}>
                      <p style={{ fontSize: 10, color: 'var(--brand-primary)', fontWeight: 600 }}>मिला / Got</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-primary)', marginTop: 2 }}>
                        {formatCurrency(summary.totalReceived)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--expense-bg)', borderRadius: 8 }}>
                      <p style={{ fontSize: 10, color: 'var(--expense-color)', fontWeight: 600 }}>खर्च / Spent</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--expense-color)', marginTop: 2 }}>
                        {formatCurrency(summary.totalSpent)}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Txn count & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      📊 {summary.transactionCount} लेनदेन ({summary.eventCount} Events)
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        title="विवरण देखें / View Details"
                        onClick={() => setViewingPerson(p)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        title="एडिट करें / Edit"
                        onClick={() => setEditingPerson(p)}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        style={{ color: p.status === 'active' ? 'var(--expense-color)' : '#059669' }}
                        title={p.status === 'active' ? 'हटाएँ / Deactivate' : 'सक्रिय करें / Activate'}
                        onClick={() => {
                          if (p.status === 'inactive') {
                            handleToggleStatus(p);
                          } else {
                            handleStartDelete(p);
                          }
                        }}
                      >
                        {p.status === 'active' ? <Trash2 size={15} /> : <UserCheck size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Person Modal */}
        <AddPersonModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPersonAdded={() => {
            refreshData();
          }}
        />

        {/* Edit Person Modal */}
        {editingPerson && (
          <AddPersonModal
            isOpen={Boolean(editingPerson)}
            editPerson={editingPerson}
            onClose={() => setEditingPerson(null)}
            onPersonUpdated={() => {
              refreshData();
              setEditingPerson(null);
            }}
          />
        )}

        {/* Person Details Modal */}
        <PersonDetailModal
          person={viewingPerson}
          isOpen={Boolean(viewingPerson)}
          onClose={() => setViewingPerson(null)}
          onEdit={(person) => {
            setEditingPerson(person);
            setViewingPerson(null);
          }}
        />

        {/* Safe Delete / Deactivate Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title={
            hasTxnWarning
              ? 'व्यक्ति को निष्क्रीय (Deactivate) करें?'
              : 'क्या आप इस व्यक्ति को हटाना चाहते हैं?'
          }
          message={
            hasTxnWarning
              ? 'यह व्यक्ति पहले से कई transactions में उपयोग किया गया है। इसे delete करने से पुराने हिसाब की जानकारी प्रभावित हो सकती है। इसे निष्क्रीय (Deactivate) किया जाएगा ताकि पुराने हिसाब सुरक्षित रहें और आगे नए फॉर्म में यह नाम न दिखे।'
              : 'क्या आप वाकई इस व्यक्ति को हटाना चाहते हैं? इसका कोई लेनदेन नहीं है, इसलिए इसे सुरक्षित रूप से हटाया जा सकता है।'
          }
          confirmText={hasTxnWarning ? 'निष्क्रीय करें / Deactivate' : 'हाँ, हटाएँ / Delete'}
          cancelText="रद्द करें / Cancel"
          variant={hasTxnWarning ? 'warning' : 'danger'}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteTarget(null);
            setHasTxnWarning(false);
          }}
        />
      </div>
    </AppLayout>
  );
}
