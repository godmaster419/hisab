'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Calendar, Save, Check } from 'lucide-react';
import { createEvent, getSettings } from '@/store';
import { getTodayDate } from '@/utils/helpers';
import { HisabEventType, EVENT_TYPES } from '@/types';
import SignatureUpload from '@/components/SignatureUpload';

export default function NewEventPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    eventType: 'len_den' as HisabEventType,
    startDate: getTodayDate(),
    endDate: '',
    description: '',
    responsiblePerson: '',
    openingBalance: '',
    treasurerSignature: '',
    presidentSignature: '',
    presidentName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const settings = getSettings();
    if (settings.defaultTreasurerSignature || settings.defaultPresidentSignature || settings.defaultPresidentName) {
      setForm((prev) => ({
        ...prev,
        treasurerSignature: prev.treasurerSignature || settings.defaultTreasurerSignature || '',
        presidentSignature: prev.presidentSignature || settings.defaultPresidentSignature || '',
        presidentName: prev.presidentName || settings.defaultPresidentName || '',
      }));
    }
  }, []);

  const selectedTypeConfig = EVENT_TYPES.find((t) => t.value === form.eventType) || EVENT_TYPES[1];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = 'कृपया नाम दर्ज करें';
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
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      responsiblePerson: form.responsiblePerson.trim(),
      openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
      treasurerSignature: form.treasurerSignature,
      presidentSignature: form.presidentSignature,
      presidentName: form.presidentName.trim(),
    });

    showToast('Event सफलतापूर्वक बनाया गया!');
    router.push(`/events/detail?id=${event.id}`);
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div className="page-header">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.back()}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={16} /> वापस जाएँ / Back
          </button>
          <h1 className="page-title">📅 नया Event / खाता बनाएँ</h1>
          <p className="page-subtitle">प्रकार चुनें और आवश्यक जानकारी भरें</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            {/* 1. Event Type Selector */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                Event का प्रकार चुनें (Select Event Type) *
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {EVENT_TYPES.map((typeOption) => {
                  const isSelected = form.eventType === typeOption.value;
                  return (
                    <div
                      key={typeOption.value}
                      onClick={() => setForm({ ...form, eventType: typeOption.value })}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        border: `2px solid ${isSelected ? typeOption.badgeColor : 'var(--border-color)'}`,
                        background: isSelected ? typeOption.badgeBg : 'var(--bg-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 24 }}>{typeOption.icon}</span>
                        {isSelected && (
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: typeOption.badgeColor,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? typeOption.badgeColor : 'var(--text-primary)' }}>
                        {typeOption.shortHi}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                        {typeOption.descHi}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Name */}
            <div className="form-group">
              <label className="form-label">
                {form.eventType === 'dukandar_diary'
                  ? 'दुकान / खाते का नाम / Shop or Diary Name *'
                  : form.eventType === 'contribution'
                  ? 'समिति / फंड का नाम / Committee or Fund Name *'
                  : 'Event का नाम / Event Name *'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  form.eventType === 'dukandar_diary'
                    ? 'जैसे: रमेश किराना स्टोर - ग्राहक डायरी'
                    : form.eventType === 'contribution'
                    ? 'जैसे: समाज सेवा कल्याण समिति 2026'
                    : 'जैसे: Annual Function 2026'
                }
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
                <label className="form-label">{selectedTypeConfig.personRole}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={
                    form.eventType === 'dukandar_diary'
                      ? 'जैसे: रमेश किराना स्टोर / संचालक'
                      : form.eventType === 'contribution'
                      ? 'जैसे: अमित सिंह (कोषाध्यक्ष)'
                      : 'जैसे: Rajesh Kumar'
                  }
                  value={form.responsiblePerson}
                  onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                />
              </div>

              {/* Opening Balance */}
              <div className="form-group">
                <label className="form-label">
                  {form.eventType === 'dukandar_diary'
                    ? 'प्रारंभिक उधारी / पुराना बकाया (₹)'
                    : form.eventType === 'contribution'
                    ? 'शुरुआती फंड राशि / Opening Fund (₹)'
                    : 'शुरुआती राशि / Opening Balance (₹)'}
                </label>
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

            {/* Digital Signatures Section */}
            <div
              style={{
                marginTop: 24,
                marginBottom: 20,
                padding: '20px',
                background: 'var(--bg-secondary, #f8fafc)',
                borderRadius: 12,
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  ✍️ डिजिटल हस्ताक्षर (Digital Signatures - Optional)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  कोषाध्यक्ष और अध्यक्ष के हस्ताक्षर (PNG इमेज) अपलोड करें। यह रिपोर्ट और PDF में खाली लाइन की जगह सीधे दिखाई देगा।
                </p>
              </div>

              <div className="grid-2">
                <div>
                  <SignatureUpload
                    label={form.eventType === 'contribution' ? 'कोषाध्यक्ष / जिम्मेदार सदस्य' : 'कोषाध्यक्ष / जिम्मेदार व्यक्ति'}
                    subLabel="पारदर्शी (Transparent) PNG हस्ताक्षर अपलोड करें"
                    value={form.treasurerSignature}
                    onChange={(val) => setForm({ ...form, treasurerSignature: val })}
                    onClear={() => setForm({ ...form, treasurerSignature: '' })}
                    placeholderText="कोषाध्यक्ष का PNG हस्ताक्षर अपलोड करें"
                  />
                </div>
                <div>
                  <SignatureUpload
                    label={form.eventType === 'contribution' ? 'अध्यक्ष / सचिव का हस्ताक्षर' : 'हिसाब जांचकर्ता / अध्यक्ष का हस्ताक्षर'}
                    subLabel="पारदर्शी (Transparent) PNG हस्ताक्षर अपलोड करें"
                    value={form.presidentSignature}
                    onChange={(val) => setForm({ ...form, presidentSignature: val })}
                    onClear={() => setForm({ ...form, presidentSignature: '' })}
                    placeholderText="अध्यक्ष / सचिव का PNG हस्ताक्षर अपलोड करें"
                  />
                  <div className="form-group" style={{ marginTop: 8 }}>
                    <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
                      अध्यक्ष / सचिव का नाम या पद (वैकल्पिक)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="जैसे: श्री रमेश कुमार (अध्यक्ष)"
                      value={form.presidentName}
                      onChange={(e) => setForm({ ...form, presidentName: e.target.value })}
                    />
                  </div>
                </div>
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
