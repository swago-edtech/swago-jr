'use client';

import React, { useTransition } from 'react';
import { markAsResolved } from './actions';

export default function ResolveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleResolve = () => {
    if (confirm('Are you sure you want to mark this as resolved?')) {
      startTransition(async () => {
        await markAsResolved(id);
      });
    }
  };

  return (
    <button
      onClick={handleResolve}
      disabled={isPending}
      className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Resolving...' : 'Resolve'}
    </button>
  );
}
