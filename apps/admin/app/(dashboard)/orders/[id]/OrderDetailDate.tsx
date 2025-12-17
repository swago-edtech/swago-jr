'use client';

import { useFormattedDate } from '@/hooks/useFormattedDate';

export default function OrderDetailDate({ date }: { date: string }) {
  const formattedDate = useFormattedDate(date, 'admin');

  return <p className="text-sm font-medium text-gray-900">{formattedDate}</p>;
}
