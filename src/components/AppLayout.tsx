'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Plus,
  Sun,
  Moon,
  Home,
  FileText,
  Coins,
} from 'lucide-react';
import { getSettings, updateSettings } from '@/store';

interface AppLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { href: '/', label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: LayoutDashboard },
  { href: '/contributions', label: 'Contributions', labelHi: 'कंट्रीब्यूशन', icon: Coins },
  { href: '/events', label: 'Events', labelHi: 'इवेंट', icon: Calendar },
  { href: '/people', label: 'People', labelHi: 'लोग', icon: Users },
  { href: '/reports', label: 'Reports', labelHi: 'रिपोर्ट', icon: BarChart3 },
  { href: '/settings', label: 'Settings', labelHi: 'सेटिंग्स', icon: Settings },
];

const bottomNavLinks = [
  { href: '/', label: 'होम', icon: Home },
  { href: '/contributions', label: 'कंट्रीब्यूशन', icon: Coins },
  { href: '/events', label: 'इवेंट', icon: Calendar },
  { href: '/reports', label: 'रिपोर्ट', icon: FileText },
  { href: '/settings', label: 'सेटिंग', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const settings = getSettings();
    const savedTheme = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
    setTheme(savedTheme as 'light' | 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    updateSettings({ theme: newTheme });
  }, [theme]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            HISAB
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>हर पैसे का साफ हिसाब</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none' }} onClick={closeSidebar}>
              <h1>₹ HISAB</h1>
              <p>हर पैसे का साफ हिसाब</p>
            </Link>
            <button
              className="btn btn-icon btn-ghost"
              onClick={closeSidebar}
              style={{ display: 'none' }}
              id="sidebar-close-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={20} />
                <span>{link.labelHi} / {link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid var(--border-color)' }}>
          <button className="sidebar-link" onClick={toggleTheme} style={{ width: '100%' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? 'डार्क मोड' : 'लाइट मोड'}</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        {/* Top Bar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setSidebarOpen(true)}
              style={{ display: 'none' }}
              id="menu-toggle-btn"
            >
              <Menu size={22} />
            </button>
            {/* Show menu on mobile */}
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setSidebarOpen(true)}
              style={{}}
              id="mobile-menu-btn"
            >
              <Menu size={22} />
            </button>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: 20,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                HISAB
              </span>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-icon btn-ghost"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="bottom-nav">
        {bottomNavLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);

          if (link.isSpecial) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bottom-nav-item"
                style={{ position: 'relative' }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  marginTop: -16,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                }}>
                  <Icon size={22} />
                </div>
                <span style={{ fontSize: 10 }}>{link.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        @media (min-width: 769px) {
          #mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          #sidebar-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
