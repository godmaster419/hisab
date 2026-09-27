'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Sun, Moon, Monitor, Download, Upload, Trash2, Save,
  Globe, Database, Shield,
} from 'lucide-react';
import { getSettings, updateSettings, exportAllData, importData } from '@/store';
import { exportBackupJSON } from '@/utils/export';
import { AppSettings } from '@/types';

export default function SettingsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light', language: 'both', currency: 'INR', currencySymbol: '₹',
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(getSettings());
  }, []);

  const handleThemeChange = (theme: AppSettings['theme']) => {
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    updateSettings({ theme });
    setSettings((prev) => ({ ...prev, theme }));
    showToast('थीम अपडेट की गई');
  };

  const handleExportBackup = () => {
    const data = exportAllData();
    exportBackupJSON(data);
    showToast('डेटा बैकअप डाउनलोड हो रहा है...');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.version && data.events) {
          importData(data);
          showToast('डेटा सफलतापूर्वक इम्पोर्ट किया गया! पेज रीलोड हो रहा है...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast('अमान्य बैकअप फ़ाइल', 'error');
        }
      } catch {
        showToast('फ़ाइल पढ़ने में त्रुटि', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = () => {
    localStorage.clear();
    showToast('सभी डेटा हटा दिया गया। पेज रीलोड हो रहा है...');
    setShowClearConfirm(false);
    setTimeout(() => window.location.reload(), 1500);
  };

  if (!mounted) return <AppLayout><div /></AppLayout>;

  return (
    <AppLayout>
      <div className="page-container" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title">⚙️ सेटिंग्स / Settings</h1>
          <p className="page-subtitle">एप्लिकेशन की सेटिंग्स यहाँ बदलें</p>
        </div>

        {/* Theme */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sun size={18} /> थीम / Theme
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { value: 'light' as const, label: '☀️ Light', labelHi: 'लाइट' },
              { value: 'dark' as const, label: '🌙 Dark', labelHi: 'डार्क' },
              { value: 'system' as const, label: '💻 System', labelHi: 'सिस्टम' },
            ].map((t) => (
              <button
                key={t.value}
                className={`btn ${settings.theme === t.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleThemeChange(t.value)}
                style={{ padding: '14px 16px', flexDirection: 'column', gap: 4 }}
              >
                <span style={{ fontSize: 14 }}>{t.label}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>{t.labelHi}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} /> मुद्रा / Currency
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-primary)' }}>₹</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Indian Rupee (INR)</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>भारतीय रुपया — Indian numbering format (₹1,25,000)</p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} /> डेटा प्रबंधन / Data Management
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Export */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12,
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>📥 डेटा बैकअप / Export Backup</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>अपना पूरा डेटा JSON फ़ाइल में सेव करें</p>
              </div>
              <button className="btn btn-sm btn-primary" onClick={handleExportBackup}>
                <Download size={14} /> Export
              </button>
            </div>

            {/* Import */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12,
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>📤 डेटा इम्पोर्ट / Import Backup</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>बैकअप JSON फ़ाइल से डेटा लोड करें</p>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportBackup}
              />
            </div>

            {/* Clear All Data */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 16, background: 'var(--expense-bg)', borderRadius: 12,
              border: '1px solid var(--expense-border)',
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--expense-color)' }}>🗑️ सारा डेटा मिटाएँ / Clear All Data</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>सावधानी: यह सारा डेटा हमेशा के लिए हटा देगा</p>
              </div>
              <button className="btn btn-sm btn-expense" onClick={() => setShowClearConfirm(true)}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} /> डेटा सुरक्षा / Data Security
          </h3>
          <div style={{
            padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12,
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8,
          }}>
            <p>✅ आपका सारा डेटा आपके ब्राउज़र में सुरक्षित है (localStorage)</p>
            <p>✅ कोई डेटा किसी सर्वर पर नहीं भेजा जाता</p>
            <p>✅ आप कभी भी बैकअप ले सकते हैं</p>
            <p>⚠️ ब्राउज़र डेटा क्लियर करने पर डेटा मिट सकता है — बैकअप रखें!</p>
          </div>
        </div>

        {/* About */}
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <h2 style={{
            fontSize: 28, fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>
            ₹ HISAB
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 8 }}>हर पैसे का साफ हिसाब</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Version 1.0.0</p>
        </div>

        {/* Clear Confirm */}
        <ConfirmDialog
          isOpen={showClearConfirm}
          title="सारा डेटा मिटाएँ?"
          message="क्या आप वाकई सारा डेटा हटाना चाहते हैं? सभी Events, लेनदेन और सेटिंग्स मिट जाएँगी। यह कार्य पूर्ववत नहीं किया जा सकता। पहले बैकअप लें!"
          confirmText="हाँ, सब मिटाएँ"
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      </div>
    </AppLayout>
  );
}
