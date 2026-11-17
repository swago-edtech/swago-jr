import { Suspense } from 'react';
import OrderAnalyticsClient from './OrderAnalyticsClient';

export const dynamic = 'force-dynamic';

export default function OrderAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }
    >
      <OrderAnalyticsClient />
    </Suspense>
  );
}
