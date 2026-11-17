import { Suspense } from 'react';
import RevenueAnalyticsClient from './RevenueAnalyticsClient';

export default function RevenueAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      }
    >
      <RevenueAnalyticsClient />
    </Suspense>
  );
}
