'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import {
  Users, TrendingUp, TrendingDown, ShoppingCart, IndianRupee,
} from 'lucide-react';
import { getEvents, getAllMoneyReceived, getAllExpenses } from '@/store';
import { formatCurrency } from '@/utils/helpers';

interface PersonData {
  name: string;
  moneyGiven: number;
  moneyReceived: number;
  moneySpent: number;
  transactionCount: number;
  events: Set<string>;
}

export default function PeoplePage() {
  const [mounted, setMounted] = useState(false);
  const [people, setPeople] = useState<PersonData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    const allMoney = getAllMoneyReceived();
    const allExpenses = getAllExpenses();
    const events = getEvents();
    const eventNames = Object.fromEntries(events.map((e) => [e.id, e.name]));

    const personMap: Record<string, PersonData> = {};

    const ensure = (name: string) => {
      if (!name) return;
      if (!personMap[name]) {
        personMap[name] = { name, moneyGiven: 0, moneyReceived: 0, moneySpent: 0, transactionCount: 0, events: new Set() };
      }
    };

    allMoney.forEach((m) => {
      ensure(m.givenBy);
      personMap[m.givenBy].moneyGiven += m.amount;
      personMap[m.givenBy].transactionCount += 1;
      personMap[m.givenBy].events.add(m.eventId);

      ensure(m.depositedWith);
      personMap[m.depositedWith].moneyReceived += m.amount;
      personMap[m.depositedWith].transactionCount += 1;
      personMap[m.depositedWith].events.add(m.eventId);
    });

    allExpenses.forEach((e) => {
      ensure(e.spentBy);
      personMap[e.spentBy].moneySpent += e.amount;
      personMap[e.spentBy].transactionCount += 1;
      personMap[e.spentBy].events.add(e.eventId);

      ensure(e.paidTo);
      personMap[e.paidTo].transactionCount += 1;
      personMap[e.paidTo].events.add(e.eventId);
    });

    setPeople(Object.values(personMap).sort((a, b) => b.transactionCount - a.transactionCount));
  }, []);

  const filtered = people.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return <AppLayout><div /></AppLayout>;

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">👥 लोग / People</h1>
          <p className="page-subtitle">सभी Event में शामिल लोगों की जानकारी</p>
        </div>

        <div className="search-input" style={{ marginBottom: 24, maxWidth: 400 }}>
          <Users size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="व्यक्ति खोजें... / Search People..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={36} /></div>
              <h3 className="empty-state-title">कोई व्यक्ति नहीं मिला</h3>
              <p className="empty-state-text">
                {searchQuery ? 'अलग नाम से खोजें' : 'लेनदेन जोड़ने पर लोगों का रिकॉर्ड यहाँ दिखेगा'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((p) => (
              <div key={p.name} className="card card-interactive" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand-primary), #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 20,
                  }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {p.transactionCount} transactions • {p.events.size} events
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--income-bg)', borderRadius: 10 }}>
                    <TrendingUp size={16} style={{ color: 'var(--income-color)', marginBottom: 4 }} />
                    <p style={{ fontSize: 10, color: 'var(--income-color)', fontWeight: 500 }}>दिया / Given</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--income-color)', marginTop: 2 }}>
                      {formatCurrency(p.moneyGiven)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--brand-primary-light)', borderRadius: 10 }}>
                    <IndianRupee size={16} style={{ color: 'var(--brand-primary)', marginBottom: 4 }} />
                    <p style={{ fontSize: 10, color: 'var(--brand-primary)', fontWeight: 500 }}>मिला / Got</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-primary)', marginTop: 2 }}>
                      {formatCurrency(p.moneyReceived)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--expense-bg)', borderRadius: 10 }}>
                    <ShoppingCart size={16} style={{ color: 'var(--expense-color)', marginBottom: 4 }} />
                    <p style={{ fontSize: 10, color: 'var(--expense-color)', fontWeight: 500 }}>खर्च / Spent</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--expense-color)', marginTop: 2 }}>
                      {formatCurrency(p.moneySpent)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
