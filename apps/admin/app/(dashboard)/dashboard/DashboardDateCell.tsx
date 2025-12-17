'use client';

import { useFormattedDate } from '@/hooks/useFormattedDate';

export default function DashboardDateCell({ date }: { date: string }) {
  const formattedDate = useFormattedDate(date, 'table');

  return <span>{formattedDate}</span>;
}
