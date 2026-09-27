'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Calendar, Save } from 'lucide-react';
import { createEvent } from '@/store';
import { getTodayDate } from '@/utils/helpers';

export default function NewEventPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    startDate: getTodayDate(),
    endDate: '',
    description: '',
    responsiblePerson: '',
    openingBalance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = 'कृपया Event का नाम दर्ज करें';
    }
    if (!form.startDate) {
      errs.startDate = 'कृपया तारीख चुनें';
    }
    if (form.openingBalance && (isNaN(Number(form.openingBalance)) || Number(form.openingBalance) < 0)) {
      errs.openingBalance = 'कृपया सही राशि दर्ज करें';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const event = createEvent({
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      responsiblePerson: form.responsiblePerson.trim(),
      openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
    });

    showToast('Event सफलतापूर्वक बनाया गया!');
    router.push(`/events/detail?id=${event.id}`);
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div className="page-header">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.back()}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={16} /> वापस जाएँ / Back
          </button>
          <h1 className="page-title">📅 नया Event बनाएँ</h1>
          <p className="page-subtitle">Event की जानकारी भरें</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            {/* Event Name */}
            <div className="form-group">
              <label className="form-label">Event का नाम / Event Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="जैसे: Annual Function 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="grid-2">
              {/* Start Date */}
              <div className="form-group">
                <label className="form-label">शुरू होने की तारीख / Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
                {errors.startDate && <div className="form-error">{errors.startDate}</div>}
              </div>

              {/* End Date */}
              <div className="form-group">
                <label className="form-label">समाप्ति तारीख / End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">विवरण / Description (वैकल्पिक)</label>
              <textarea
                className="form-input"
                placeholder="Event के बारे में कुछ जानकारी..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid-2">
              {/* Person Responsible */}
              <div className="form-group">
                <label className="form-label">जिम्मेदार व्यक्ति / Person Responsible</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="जैसे: Rajesh Kumar"
                  value={form.responsiblePerson}
                  onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                />
              </div>

              {/* Opening Balance */}
              <div className="form-group">
                <label className="form-label">शुरुआती राशि / Opening Balance</label>
                <div style={{ position: 'relative' }}>
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    className="form-input form-input-currency"
                    placeholder="0"
                    value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    min="0"
                    step="any"
                  />
                </div>
                {errors.openingBalance && <div className="form-error">{errors.openingBalance}</div>}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                रद्द करें / Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-lg">
                <Save size={18} />
                Event बनाएँ / Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
