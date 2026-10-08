'use client';

import React, { useState, useEffect } from 'react';
import { X, IndianRupee } from 'lucide-react';
import { MoneyReceived, PAYMENT_METHODS, PURPOSE_SUGGESTIONS, HisabEventType, getEventTypeConfig } from '@/types';
import { addMoneyReceived, updateMoneyReceived } from '@/store';
import { getTodayDate } from '@/utils/helpers';
import { useToast } from '@/components/Toast';
import AutocompleteInput from '@/components/AutocompleteInput';
import AddPersonModal from '@/components/AddPersonModal';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventType?: HisabEventType;
  editData?: MoneyReceived | null;
  defaultGivenBy?: string;
  defaultDate?: string;
  defaultPurpose?: string;
  defaultDepositedWith?: string;
  onSaved: () => void;
}

export default function AddMoneyModal({
  isOpen,
  onClose,
  eventId,
  eventType,
  editData,
  defaultGivenBy,
  defaultDate,
  defaultPurpose,
  defaultDepositedWith,
  onSaved,
}: AddMoneyModalProps) {
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
  const [addPersonFor, setAddPersonFor] = useState<'givenBy' | 'depositedWith' | null>(null);

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
        givenBy: defaultGivenBy || '',
        depositedWith: defaultDepositedWith || '',
        date: defaultDate || getTodayDate(),
        purpose: defaultPurpose || '',
        paymentMethod: 'cash',
        note: '',
      });
    }
    setErrors({});
  }, [editData, isOpen, defaultGivenBy, defaultDate, defaultPurpose, defaultDepositedWith]);

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

  const handlePersonAdded = (name: string) => {
    if (addPersonFor === 'givenBy') {
      setForm((prev) => ({ ...prev, givenBy: name }));
    } else if (addPersonFor === 'depositedWith') {
      setForm((prev) => ({ ...prev, depositedWith: name }));
    }
    setAddPersonFor(null);
  };

  const isDukandar = eventType === 'dukandar_diary';
  const isContribution = eventType === 'contribution';
  const isPersonal = eventType === 'personal_expense';

  const titleText = editData
    ? (isDukandar ? '✏️ जमा राशि एडिट करें' : isContribution ? '✏️ अंशदान एडिट करें' : isPersonal ? '✏️ आय/पॉकेट मनी एडिट करें' : '✏️ पैसा एडिट करें')
    : (isDukandar ? '💰 ग्राहक से जमा मिला / Received Payment (Jama)' : isContribution ? '💰 अंशदान मिला / Member Contribution' : isPersonal ? '💰 आय / पॉकेट मनी जोड़ें / Add Income' : '💰 पैसा जोड़ें / Add Money');

  const givenByLabel = isDukandar
    ? 'ग्राहक का नाम (पैसा देने वाला) / Customer Name *'
    : isContribution
    ? 'सदस्य का नाम (अंशदान देने वाला) / Member Name *'
    : isPersonal
    ? 'पैसा कहाँ से मिला / स्रोत (Source / Given By) *'
    : 'पैसा देने वाला / Given By *';

  const givenByPlaceholder = isDukandar ? 'जैसे: रमेश कुमार (ग्राहक)' : isContribution ? 'जैसे: सुरेश कुमार (सदस्य)' : isPersonal ? 'जैसे: सैलरी, पापा, बैंक, ट्यूशन' : 'जैसे: सुरेश कुमार';

  const depositedWithLabel = isDukandar
    ? 'दुकानदार / प्राप्तकर्ता / Received By *'
    : isContribution
    ? 'कोषाध्यक्ष / प्राप्तकर्ता / Received By *'
    : isPersonal
    ? 'किसके पास / खाता (Received In / Account) *'
    : 'पैसा जमा करने वाला / Deposited With *';

  const depositedWithPlaceholder = isDukandar ? 'जैसे: दुकानदार / कैशियर' : isContribution ? 'जैसे: कोषाध्यक्ष' : isPersonal ? 'जैसे: स्वयं (Self), बैंक खाता, GooglePay/Paytm' : 'जैसे: राजेश कुमार';

  const purposePlaceholder = isDukandar
    ? 'जैसे: पुरानी उधारी चुकाई, एडवांस जमा'
    : isContribution
    ? 'जैसे: मासिक अंशदान, विशेष सहयोग'
    : isPersonal
    ? 'जैसे: मासिक सैलरी, पॉकेट मनी, घर खर्च के लिए'
    : 'जैसे: Event Fund';

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            {titleText}
          </h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">
                {isDukandar ? 'जमा राशि / Payment Amount (Jama) *' : isContribution ? 'अंशदान राशि / Contribution Amount *' : isPersonal ? 'आय / प्राप्त राशि (Income Amount) *' : 'राशि / Amount *'}
              </label>
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
              <label className="form-label">{givenByLabel}</label>
              <AutocompleteInput
                value={form.givenBy}
                onChange={(val) => setForm({ ...form, givenBy: val })}
                placeholder={givenByPlaceholder}
                onAddNew={() => setAddPersonFor('givenBy')}
              />
              {errors.givenBy && <div className="form-error">{errors.givenBy}</div>}
            </div>

            {/* Deposited With */}
            <div className="form-group">
              <label className="form-label">{depositedWithLabel}</label>
              <AutocompleteInput
                value={form.depositedWith}
                onChange={(val) => setForm({ ...form, depositedWith: val })}
                placeholder={depositedWithPlaceholder}
                onAddNew={() => setAddPersonFor('depositedWith')}
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
              <label className="form-label">{isDukandar ? 'उद्देश्य / विवरण (Purpose)' : isContribution ? 'अंशदान विवरण (Purpose)' : 'उद्देश्य / Purpose'}</label>
              <input
                type="text"
                className="form-input"
                placeholder={purposePlaceholder}
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
              {editData ? 'अपडेट करें / Update' : isDukandar ? 'जमा राशि जोड़ें / Save Payment' : isContribution ? 'अंशदान जोड़ें / Save' : isPersonal ? 'आय जोड़ें / Save Income' : 'जोड़ें / Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Inline Add Person Modal */}
      <AddPersonModal
        isOpen={!!addPersonFor}
        onClose={() => setAddPersonFor(null)}
        onPersonAdded={handlePersonAdded}
        eventId={eventId}
      />
    </div>
  );
}
