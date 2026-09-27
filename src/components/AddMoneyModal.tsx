'use client';

import React, { useState, useEffect } from 'react';
import { X, IndianRupee } from 'lucide-react';
import { MoneyReceived, PAYMENT_METHODS, PURPOSE_SUGGESTIONS } from '@/types';
import { addMoneyReceived, updateMoneyReceived } from '@/store';
import { getTodayDate } from '@/utils/helpers';
import { useToast } from '@/components/Toast';
import AutocompleteInput from '@/components/AutocompleteInput';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  editData?: MoneyReceived | null;
  onSaved: () => void;
}

export default function AddMoneyModal({ isOpen, onClose, eventId, editData, onSaved }: AddMoneyModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    amount: '',
    givenBy: '',
    depositedWith: '',
    date: getTodayDate(),
    purpose: '',
    paymentMethod: 'cash' as MoneyReceived['paymentMethod'],
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editData) {
      setForm({
        amount: editData.amount.toString(),
        givenBy: editData.givenBy,
        depositedWith: editData.depositedWith,
        date: editData.date,
        purpose: editData.purpose,
        paymentMethod: editData.paymentMethod,
        note: editData.note,
      });
    } else {
      setForm({
        amount: '',
        givenBy: '',
        depositedWith: '',
        date: getTodayDate(),
        purpose: '',
        paymentMethod: 'cash',
        note: '',
      });
    }
    setErrors({});
  }, [editData, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      errs.amount = 'कृपया सही राशि दर्ज करें (Amount must be > 0)';
    }
    if (!form.givenBy.trim()) {
      errs.givenBy = 'कृपया नाम दर्ज करें (Name is required)';
    }
    if (!form.depositedWith.trim()) {
      errs.depositedWith = 'कृपया नाम दर्ज करें (Name is required)';
    }
    if (!form.date) {
      errs.date = 'कृपया तारीख चुनें (Date is required)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      eventId,
      amount: parseFloat(form.amount),
      givenBy: form.givenBy.trim(),
      depositedWith: form.depositedWith.trim(),
      date: form.date,
      purpose: form.purpose.trim(),
      paymentMethod: form.paymentMethod,
      note: form.note.trim(),
    };

    if (editData) {
      updateMoneyReceived(editData.id, data);
      showToast('रिकॉर्ड सफलतापूर्वक अपडेट किया गया।');
    } else {
      addMoneyReceived(data);
      showToast('पैसे का रिकॉर्ड सफलतापूर्वक जोड़ दिया गया।');
    }

    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            {editData ? '✏️ पैसा एडिट करें' : '💰 पैसा जोड़ें / Add Money'}
          </h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">राशि / Amount *</label>
              <div style={{ position: 'relative' }}>
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  className="form-input form-input-currency"
                  placeholder="5000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="1"
                  step="any"
                />
              </div>
              {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>

            {/* Given By */}
            <div className="form-group">
              <label className="form-label">पैसा देने वाला / Given By *</label>
              <AutocompleteInput
                value={form.givenBy}
                onChange={(val) => setForm({ ...form, givenBy: val })}
                placeholder="जैसे: Suresh"
              />
              {errors.givenBy && <div className="form-error">{errors.givenBy}</div>}
            </div>

            {/* Deposited With */}
            <div className="form-group">
              <label className="form-label">पैसा जमा करने वाला / Deposited With *</label>
              <AutocompleteInput
                value={form.depositedWith}
                onChange={(val) => setForm({ ...form, depositedWith: val })}
                placeholder="जैसे: Rajesh"
              />
              {errors.depositedWith && <div className="form-error">{errors.depositedWith}</div>}
            </div>

            <div className="grid-2">
              {/* Date */}
              <div className="form-group">
                <label className="form-label">तारीख / Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label">भुगतान का तरीका / Payment Mode</label>
                <select
                  className="form-input"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as MoneyReceived['paymentMethod'] })}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.labelHi} / {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div className="form-group">
              <label className="form-label">उद्देश्य / Purpose</label>
              <input
                type="text"
                className="form-input"
                placeholder="जैसे: Event Fund"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                list="purpose-suggestions"
              />
              <datalist id="purpose-suggestions">
                {PURPOSE_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label">नोट / Note (वैकल्पिक)</label>
              <textarea
                className="form-input"
                placeholder="कोई अतिरिक्त जानकारी..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              रद्द करें / Cancel
            </button>
            <button type="submit" className="btn btn-income">
              <IndianRupee size={16} />
              {editData ? 'अपडेट करें / Update' : 'जोड़ें / Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
