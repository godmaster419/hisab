'use client';

import React, { useRef, useState } from 'react';
import { Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface SignatureUploadProps {
  label: string;
  subLabel?: string;
  value?: string;
  onChange: (base64: string) => void;
  onClear: () => void;
  placeholderText?: string;
}

export default function SignatureUpload({
  label,
  subLabel,
  value,
  onChange,
  onClear,
  placeholderText = 'हस्ताक्षर की PNG छवि चुनें (Upload PNG Signature)',
}: SignatureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('कृपया केवल इमेज (PNG / JPG) फ़ाइल चुनें।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;

      // Optimize image size using canvas so it doesn't overload localStorage
      const img = new Image();
      img.onload = () => {
        const maxWidth = 500;
        const maxHeight = 200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as PNG to preserve transparency
          const optimizedData = canvas.toDataURL('image/png');
          onChange(optimizedData);
        } else {
          onChange(src);
        }
      };
      img.onerror = () => {
        onChange(src);
      };
      img.src = src;
    };
    reader.onerror = () => {
      setError('फ़ाइल पढ़ने में समस्या हुई। कृपया पुनः प्रयास करें।');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
          ✍️ {label}
        </label>
        {value && (
          <span style={{ fontSize: 11, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            <CheckCircle size={13} /> हस्ताक्षर लोड है
          </span>
        )}
      </div>

      {subLabel && (
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {subLabel}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {value ? (
        // Preview Box
        <div
          style={{
            border: '1.5px solid var(--border-color)',
            borderRadius: 10,
            padding: '12px 16px',
            background: 'var(--bg-card, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
            <div
              style={{
                width: 130,
                height: 56,
                borderRadius: 8,
                border: '1px dashed #cbd5e1',
                background: 'repeating-conic-gradient(#f8fafc 0% 25%, #ffffff 0% 50%) 50% / 14px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                overflow: 'hidden',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Signature preview"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                हस्ताक्षर अपलोड किया गया
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                यह हस्ताक्षर PDF रिपोर्ट में प्रदर्शित होगा
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <Upload size={13} /> बदलें
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClear}
              style={{ fontSize: 12, padding: '6px 10px', color: '#ef4444' }}
              title="हटाएँ"
            >
              <Trash2 size={13} /> हटाएँ
            </button>
          </div>
        </div>
      ) : (
        // Upload Dropzone
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? 'var(--brand-primary)' : 'var(--border-color)'}`,
            borderRadius: 10,
            padding: '18px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? 'var(--brand-primary-light, #eef2ff)' : 'var(--bg-secondary, #fafafa)',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--bg-card, #ffffff)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
              border: '1px solid var(--border-color)',
              color: 'var(--brand-primary)',
            }}
          >
            <Upload size={16} />
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            {placeholderText}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
            क्लिक करें या यहाँ PNG फ़ाइल ड्रैग करें (पारदर्शी बैकग्राउंड सबसे उत्तम)
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: 11.5, marginTop: 6 }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}
