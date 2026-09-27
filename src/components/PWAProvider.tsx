'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const swUrl = './sw.js';
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.log('HISAB Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
    }

    // 2. Listen for PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show banner if user hasn't dismissed it this session
      const dismissed = sessionStorage.getItem('hisab_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Listen for Online / Offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('hisab_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Offline Alert Badge */}
      {isOffline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#f59e0b',
          color: '#ffffff',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <WifiOff size={16} /> आप ऑफ़लाइन हैं (ऑफ़लाइन मोड में भी पूरा हिसाब चालू रहेगा)
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && deferredPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          left: '24px',
          maxWidth: '420px',
          marginLeft: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '18px',
              }}>
                ₹
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  HISAB App Install करें
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  फ़ोन या कंप्यूटर पर बिना इंटरनेट भी चलाएँ
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={handleDismiss}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              बाद में
            </button>
            <button
              onClick={handleInstallClick}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '12px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} /> इंस्टॉल करें
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
