'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Expense, ExpenseItem, PAYMENT_METHODS, EXPENSE_CATEGORIES, ITEM_UNITS, PURPOSE_SUGGESTIONS } from '@/types';
import { addExpense, updateExpense } from '@/store';
import { getTodayDate, generateId } from '@/utils/helpers';
import { useToast } from '@/components/Toast';
import AutocompleteInput from '@/components/AutocompleteInput';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  editData?: Expense | null;
  onSaved: () => void;
}

const emptyItem = (): ExpenseItem => ({
  id: generateId(),
  itemName: '',
  quantity: 1,
  unit: 'piece',
  rate: 0,
  total: 0,
});

export default function AddExpenseModal({ isOpen, onClose, eventId, editData, onSaved }: AddExpenseModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    amount: '',
    spentBy: '',
    paidTo: '',
    date: getTodayDate(),
    category: 'miscellaneous' as Expense['category'],
    purpose: '',
    paymentMethod: 'cash' as Expense['paymentMethod'],
    note: '',
  });
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [showItems, setShowItems] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editData) {
      setForm({
        amount: editData.amount.toString(),
        spentBy: editData.spentBy,
        paidTo: editData.paidTo,
        date: editData.date,
        category: editData.category,
        purpose: editData.purpose,
        paymentMethod: editData.paymentMethod,
        note: editData.note,
      });
      setItems(editData.items || []);
      setShowItems((editData.items || []).length > 0);
    } else {
      setForm({
        amount: '',
        spentBy: '',
        paidTo: '',
        date: getTodayDate(),
        category: 'miscellaneous',
        purpose: '',
        paymentMethod: 'cash',
        note: '',
      });
      setItems([]);
      setShowItems(false);
    }
    setErrors({});
  }, [editData, isOpen]);

  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const newItems = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newItems[index] as any)[field] = value;
    // Auto-calculate total
    if (field === 'quantity' || field === 'rate') {
      newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].rate);
    }
    setItems(newItems);

    // Auto-update total amount from items
    const itemTotal = newItems.reduce((sum, it) => sum + it.total, 0);
    if (itemTotal > 0) {
      setForm((prev) => ({ ...prev, amount: itemTotal.toString() }));
    }
  };

  const addItem = () => {
    setItems([...items, emptyItem()]);
    setShowItems(true);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const itemTotal = newItems.reduce((sum, it) => sum + it.total, 0);
    if (itemTotal > 0) {
      setForm((prev) => ({ ...prev, amount: itemTotal.toString() }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      errs.amount = 'कृपया सही राशि दर्ज करें (Amount must be > 0)';
    }
    if (!form.spentBy.trim()) {
      errs.spentBy = 'कृपया नाम दर्ज करें';
    }
    if (!form.paidTo.trim()) {
      errs.paidTo = 'कृपया नाम दर्ज करें';
    }
    if (!form.date) {
      errs.date = 'कृपया तारीख चुनें';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validItems = items.filter((it) => it.itemName.trim() && it.total > 0);

    const data = {
      eventId,
      amount: parseFloat(form.amount),
      spentBy: form.spentBy.trim(),
      paidTo: form.paidTo.trim(),
      date: form.date,
      category: form.category,
      purpose: form.purpose.trim(),
      paymentMethod: form.paymentMethod,
      note: form.note.trim(),
      items: validItems,
    };

    if (editData) {
      updateExpense(editData.id, data);
      showToast('खर्च सफलतापूर्वक अपडेट किया गया।');
    } else {
      addExpense(data);
      showToast('खर्च सफलतापूर्वक दर्ज किया गया।');
    }

    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            {editData ? '✏️ खर्च एडिट करें' : '🧾 खर्च जोड़ें / Add Expense'}
          </h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">खर्च राशि / Expense Amount *</label>
              <div style={{ position: 'relative' }}>
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  className="form-input form-input-currency"
                  placeholder="2500"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="1"
                  step="any"
                />
              </div>
              {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>

            <div className="grid-2">
              {/* Spent By */}
              <div className="form-group">
                <label className="form-label">खर्च करने वाला / Spent By *</label>
                <AutocompleteInput
                  value={form.spentBy}
                  onChange={(val) => setForm({ ...form, spentBy: val })}
                  placeholder="जैसे: Rajesh"
                />
                {errors.spentBy && <div className="form-error">{errors.spentBy}</div>}
              </div>

              {/* Paid To */}
              <div className="form-group">
                <label className="form-label">पैसा प्राप्त करने वाला / Paid To *</label>
                <AutocompleteInput
                  value={form.paidTo}
                  onChange={(val) => setForm({ ...form, paidTo: val })}
                  placeholder="जैसे: Sharma Tent House"
                />
                {errors.paidTo && <div className="form-error">{errors.paidTo}</div>}
              </div>
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

              {/* Category */}
              <div className="form-group">
                <label className="form-label">श्रेणी / Category</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Expense['category'] })}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.labelHi} / {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              {/* Purpose */}
              <div className="form-group">
                <label className="form-label">उद्देश्य / Purpose</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="जैसे: Stage Decoration"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  list="expense-purpose-suggestions"
                />
                <datalist id="expense-purpose-suggestions">
                  {PURPOSE_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label">भुगतान का तरीका / Payment Mode</label>
                <select
                  className="form-input"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as Expense['paymentMethod'] })}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.labelHi} / {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Section */}
            <div style={{
              marginTop: 16,
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingCart size={16} />
                  सामान / Items (वैकल्पिक)
                </h4>
                <button type="button" className="btn btn-sm btn-primary" onClick={addItem}>
                  <Plus size={14} /> आइटम जोड़ें
                </button>
              </div>

              {items.length === 0 && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                  कोई आइटम नहीं जोड़ा गया। ऊपर बटन से जोड़ें।
                </p>
              )}

              {items.map((item, index) => (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: 8,
                  padding: '10px 0',
                  borderBottom: index < items.length - 1 ? '1px solid var(--border-color)' : 'none',
                  alignItems: 'end',
                }}>
                  <div>
                    {index === 0 && <label className="form-label" style={{ fontSize: 11 }}>सामान / Item</label>}
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Water Bottle"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      style={{ fontSize: 13, padding: '8px 10px' }}
                    />
                  </div>
                  <div>
                    {index === 0 && <label className="form-label" style={{ fontSize: 11 }}>मात्रा / Qty</label>}
                    <input
                      type="number"
                      className="form-input"
                      placeholder="100"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      min="0"
                      style={{ fontSize: 13, padding: '8px 10px' }}
                    />
                  </div>
                  <div>
                    {index === 0 && <label className="form-label" style={{ fontSize: 11 }}>दर / Rate (₹)</label>}
                    <input
                      type="number"
                      className="form-input"
                      placeholder="10"
                      value={item.rate || ''}
                      onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                      min="0"
                      step="any"
                      style={{ fontSize: 13, padding: '8px 10px' }}
                    />
                  </div>
                  <div>
                    {index === 0 && <label className="form-label" style={{ fontSize: 11 }}>कुल / Total</label>}
                    <input
                      type="text"
                      className="form-input"
                      value={`₹${item.total}`}
                      readOnly
                      style={{ fontSize: 13, padding: '8px 10px', background: 'var(--bg-secondary)', fontWeight: 600 }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    onClick={() => removeItem(index)}
                    style={{ color: 'var(--expense-color)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {items.length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--text-primary)',
                }}>
                  कुल / Total: ₹{items.reduce((sum, it) => sum + it.total, 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="form-group" style={{ marginTop: 16 }}>
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
            <button type="submit" className="btn btn-expense" style={{ background: '#ef4444' }}>
              <ShoppingCart size={16} />
              {editData ? 'अपडेट करें / Update' : 'खर्च जोड़ें / Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
