'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { getEvent, updateEvent } from '@/store';
import { HisabEventType, EVENT_TYPES, getEventTypeConfig } from '@/types';

function EditEventContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    eventType: 'len_den' as HisabEventType,
    startDate: '',
    endDate: '',
    description: '',
    responsiblePerson: '',
    openingBalance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTypeConfig = getEventTypeConfig(form.eventType);

  useEffect(() => {
    if (!id) {
      router.push('/events');
      return;
    }
    const event = getEvent(id);
    if (!event) { router.push('/events'); return; }
    setForm({
      name: event.name,
      eventType: event.eventType || 'len_den',
      startDate: event.startDate,
      endDate: event.endDate || '',
      description: event.description || '',
      responsiblePerson: event.responsiblePerson || '',
      openingBalance: event.openingBalance ? event.openingBalance.toString() : '',
    });
  }, [id, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'कृपया नाम दर्ज करें';
    if (!form.startDate) errs.startDate = 'कृपया तारीख चुनें';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updateEvent(id, {
      name: form.name.trim(),
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      responsiblePerson: form.responsiblePerson.trim(),
      openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
    });
    showToast('Event सफलतापूर्वक अपडेट किया गया!');
    router.push(`/events/detail?id=${id}`);
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 12 }}>
            <ArrowLeft size={16} /> वापस जाएँ
          </button>
          <h1 className="page-title">✏️ Event / खाता एडिट करें</h1>
          <p className="page-subtitle">Event का प्रकार और विवरण अपडेट करें</p>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            {/* Event Type Selector */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <label className="form-label" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                  Event का प्रकार बदलें (Change Event Type):
                </label>
                <span style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 600, background: 'var(--brand-primary-light)', padding: '2px 8px', borderRadius: 6 }}>
                  🔄 कभी भी बदल सकते हैं (डेटा सुरक्षित रहेगा)
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                प्रकार बदलने से आपका कोई भी लेनदेन नहीं हटेगा — केवल लेबल्स (जैसे जमा/उधारी/अंशदान) और व्यू बदलेंगे।
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                }}
              >
                {EVENT_TYPES.map((typeOption) => {
                  const isSelected = form.eventType === typeOption.value;
                  return (
                    <div
                      key={typeOption.value}
                      onClick={() => setForm({ ...form, eventType: typeOption.value })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? typeOption.badgeColor : 'var(--border-color)'}`,
                        background: isSelected ? typeOption.badgeBg : 'var(--bg-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>{typeOption.icon}</span>
                        {isSelected && (
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: typeOption.badgeColor,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={11} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? typeOption.badgeColor : 'var(--text-primary)' }}>
                        {typeOption.shortHi}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {typeOption.descHi}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {form.eventType === 'dukandar_diary'
                  ? 'दुकान / खाते का नाम *'
                  : form.eventType === 'contribution'
                  ? 'समिति / फंड का नाम *'
                  : 'Event का नाम *'}
              </label>
              <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">शुरू होने की तारीख *</label>
                <input type="date" className="form-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                {errors.startDate && <div className="form-error">{errors.startDate}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">समाप्ति तारीख</label>
                <input type="date" className="form-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">विवरण</label>
              <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{selectedTypeConfig.personRole}</label>
                <input type="text" className="form-input" value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {form.eventType === 'dukandar_diary'
                    ? 'प्रारंभिक उधारी / पुराना बकाया (₹)'
                    : form.eventType === 'contribution'
                    ? 'शुरुआती फंड राशि (₹)'
                    : 'शुरुआती राशि (₹)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="currency-symbol">₹</span>
                  <input type="number" className="form-input form-input-currency" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} min="0" step="any" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>रद्द करें</button>
              <button type="submit" className="btn btn-primary btn-lg"><Save size={18} /> अपडेट करें / Update</button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

export default function EditEventPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>लोड हो रहा है...</p>
        </div>
      </AppLayout>
    }>
      <EditEventContent />
    </Suspense>
  );
}
