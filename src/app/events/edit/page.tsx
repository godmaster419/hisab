'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Save } from 'lucide-react';
import { getEvent, updateEvent } from '@/store';

function EditEventContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '', startDate: '', endDate: '', description: '', responsiblePerson: '', openingBalance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      router.push('/events');
      return;
    }
    const event = getEvent(id);
    if (!event) { router.push('/events'); return; }
    setForm({
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate || '',
      description: event.description || '',
      responsiblePerson: event.responsiblePerson || '',
      openingBalance: event.openingBalance ? event.openingBalance.toString() : '',
    });
  }, [id, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'कृपया Event का नाम दर्ज करें';
    if (!form.startDate) errs.startDate = 'कृपया तारीख चुनें';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updateEvent(id, {
      name: form.name.trim(),
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
      <div className="page-container" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 12 }}>
            <ArrowLeft size={16} /> वापस जाएँ
          </button>
          <h1 className="page-title">✏️ Event एडिट करें</h1>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Event का नाम *</label>
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
                <label className="form-label">जिम्मेदार व्यक्ति</label>
                <input type="text" className="form-input" value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">शुरुआती राशि (₹)</label>
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
