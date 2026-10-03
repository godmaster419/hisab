'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import MonthlyContributionManager from '@/components/MonthlyContributionManager';

export default function ContributionsPage() {
  return (
    <AppLayout>
      <div className="page-container">
        <MonthlyContributionManager />
      </div>
    </AppLayout>
  );
}
