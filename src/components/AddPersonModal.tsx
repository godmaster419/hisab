'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, UserCheck } from 'lucide-react';
import { addPerson, updatePerson, getPersonByName, addPersonToEvent, getEvents } from '@/store';
import { useToast } from '@/components/Toast';
import { HisabPerson, HisabEvent } from '@/types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonAdded?: (name: string) => void;
  onPersonUpdated?: (person: HisabPerson) => void;
  eventId?: string;
  editPerson?: HisabPerson | null;
}

export default function AddPersonModal({
  isOpen,
  onClose,
  onPersonAdded,
  onPersonUpdated,
  eventId,
  editPerson,
}: AddPersonModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    note: '',
    selectedEventId: eventId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<HisabEvent[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEvents(getEvents());
      if (editPerson) {
        setForm({
          name: editPerson.name,
          mobile: editPerson.mobile || '',
          note: editPerson.note || '',
          selectedEventId: editPerson.eventIds?.[0] || eventId || '',
        });
      } else {
        setForm({
          name: '',
          mobile: '',
          note: '',
          selectedEventId: eventId || '',
        });
      }
      setErrors({});
    }
  }, [isOpen, editPerson, eventId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      errs.name = 'कृपया नाम दर्ज करें (Name is required)';
    } else {
      const existing = getPersonByName(trimmedName);
      if (existing && (!editPerson || existing.id !== editPerson.id)) {
        errs.name = 'यह नाम पहले से मौजूद है (Name already exists)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const trimmedName = form.name.trim();
    const trimmedMobile = form.mobile.trim();
    const trimmedNote = form.note.trim();

    if (editPerson) {
      const updated = updatePerson(editPerson.id, {
        name: trimmedName,
        mobile: trimmedMobile,
        note: trimmedNote,
        eventIds: form.selectedEventId
          ? Array.from(new Set([...(editPerson.eventIds || []), form.selectedEventId]))
          : editPerson.eventIds,
      });
      showToast('व्यक्ति की जानकारी अपडेट की गई।');
      if (updated && onPersonUpdated) {
        onPersonUpdated(updated);
      }
      onClose();
    } else {
      const eventIdsList = form.selectedEventId ? [form.selectedEventId] : eventId ? [eventId] : [];
      const person = addPerson({
        name: trimmedName,
        mobile: trimmedMobile,
        note: trimmedNote,
        eventIds: eventIdsList,
      });

      if (form.selectedEventId) {
        addPersonToEvent(person.id, form.selectedEventId);
      } else if (eventId) {
        addPersonToEvent(person.id, eventId);
      }

      showToast('व्यक्ति सफलतापूर्वक जोड़ दिया गया।');
      if (onPersonAdded) {
        onPersonAdded(person.name);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEdit = Boolean(editPerson);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            {isEdit ? '✏️ व्यक्ति एडिट करें / Edit Person' : '👤 व्यक्ति जोड़ें / Add Person'}
          </h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name */}
            <div className="form-group">
              <label className="form-label">नाम / Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="जैसे: राजेश कुमार"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            {/* Mobile */}
            <div className="form-group">
              <label className="form-label">मोबाइल नंबर / Mobile Number (वैकल्पिक)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="जैसे: 98XXXXXXXX"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                maxLength={15}
              />
            </div>

            {/* Event selection */}
            {events.length > 0 && (
              <div className="form-group">
                <label className="form-label">संबंधित Event / Associated Event (वैकल्पिक)</label>
                <select
                  className="form-input"
                  value={form.selectedEventId}
                  onChange={(e) => setForm({ ...form, selectedEventId: e.target.value })}
                >
                  <option value="">कोई Event नहीं (Global / सामान्य)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            <div className="form-group">
              <label className="form-label">नोट / Note (वैकल्पिक)</label>
              <input
                type="text"
                className="form-input"
                placeholder="जैसे: Event Coordinator / हलवाई"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              रद्द करें / Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? <Check size={16} /> : <UserPlus size={16} />}
              <span>{isEdit ? 'सेव करें / Save' : 'जोड़ें / Add Person'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
