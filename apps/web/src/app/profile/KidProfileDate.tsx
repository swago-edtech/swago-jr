'use client';

import { useFormattedDate } from '@/hooks/useFormattedDate';

export default function KidProfileDate({ createdAt }: { createdAt: string }) {
  const formattedDate = useFormattedDate(createdAt, 'date');

  return <>Created: {formattedDate}</>;
}
