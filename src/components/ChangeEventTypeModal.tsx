'use client';

import React, { useState } from 'react';
import { X, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { HisabEventType, EVENT_TYPES, getEventTypeConfig } from '@/types';
import { updateEvent } from '@/store';
import { useToast } from '@/components/Toast';

interface ChangeEventTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  currentType?: HisabEventType;
  onTypeChanged?: (newType: HisabEventType) => void;
}

export default function ChangeEventTypeModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  currentType = 'len_den',
  onTypeChanged,
}: ChangeEventTypeModalProps) {
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState<HisabEventType>(currentType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with currentType whenever modal opens
  React.useEffect(() => {
    setSelectedType(currentType || 'len_den');
  }, [currentType, isOpen]);

  if (!isOpen) return null;

  const currentConfig = getEventTypeConfig(currentType);
  const selectedConfig = getEventTypeConfig(selectedType);

  const handleConfirm = () => {
    if (selectedType === currentType) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    const updated = updateEvent(eventId, { eventType: selectedType });
    setIsSubmitting(false);

    if (updated) {
      showToast(`इवेंट का प्रकार बदलकर "${selectedConfig.shortHi}" कर दिया गया!`);
      if (onTypeChanged) {
        onTypeChanged(selectedType);
      }
      onClose();
    } else {
      showToast('प्रकार बदलने में समस्या आई।', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 580 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <RefreshCw size={20} style={{ color: 'var(--brand-primary)' }} />
              इवेंट का प्रकार बदलें / Change Type
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
              {eventName}
            </p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Informational Banner */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <AlertCircle size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>पुराना हिसाब सुरक्षित रहेगा:</strong>{' '}
              प्रकार बदलने से कोई भी लेनदेन, पैसा या खर्च नहीं हटेगा। सिर्फ देखने का प्रारूप, लेबल्स (जैसे जमा/उधारी/अंशदान) और फीचर्स नए प्रकार के अनुसार बदल जाएंगे।
            </div>
          </div>

          <label className="form-label" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
            नया प्रकार चुनें (Select New Type):
          </label>

          {/* 3 Type Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {EVENT_TYPES.map((typeOption) => {
              const isSelected = selectedType === typeOption.value;
              const isCurrent = currentType === typeOption.value;

              return (
                <div
                  key={typeOption.value}
                  onClick={() => setSelectedType(typeOption.value)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `2px solid ${isSelected ? typeOption.badgeColor : 'var(--border-color)'}`,
                    background: isSelected ? typeOption.badgeBg : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      }}
                    >
                      {typeOption.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                          {typeOption.labelHi}
                        </span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 6,
                              background: 'var(--border-color)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            वर्तमान / Current
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        {typeOption.descHi}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '3px 0 0' }}>
                        • {typeOption.incomeLabel.split('(')[0].trim()} | {typeOption.expenseLabel.split('(')[0].trim()}
                      </p>
                    </div>
                  </div>

                  {/* Radio checkmark */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? typeOption.badgeColor : 'var(--border-color)'}`,
                      background: isSelected ? typeOption.badgeColor : 'transparent',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Change Preview summary */}
          {selectedType !== currentType && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--border-color)',
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              बदलाव: <strong>{currentConfig.icon} {currentConfig.shortHi}</strong> ➔{' '}
              <strong style={{ color: selectedConfig.badgeColor }}>
                {selectedConfig.icon} {selectedConfig.shortHi}
              </strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            रद्द करें / Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isSubmitting || selectedType === currentType}
          >
            <RefreshCw size={15} />
            {selectedType === currentType ? 'यही प्रकार चुना है' : 'प्रकार बदलें / Confirm & Switch'}
          </button>
        </div>
      </div>
    </div>
  );
}
