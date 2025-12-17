'use client';

import { useFormattedDateTime } from '@/hooks/useFormattedDate';

export default function OrderDateCell({ date }: { date: string }) {
  const { date: dateStr, time: timeStr } = useFormattedDateTime(date);

  return (
    <div>
      <div className="text-sm text-gray-900">{dateStr}</div>
      <div className="text-xs text-gray-500">{timeStr}</div>
    </div>
  );
}
