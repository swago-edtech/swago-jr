'use client';

import { useState, useEffect } from 'react';
import { formatDateIST, formatCustomerDate, getRelativeTime } from '@swago/utils';

/**
 * Hook for formatting dates in customer-facing pages
 * Prevents hydration mismatches by formatting on client-side only
 */
export function useFormattedDate(
  date: Date | string,
  format: 'full' | 'date' | 'time' | 'relative' | 'clean' = 'clean'
) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    // Only format on client side to avoid hydration mismatch
    if (!date) {
      setFormattedDate('N/A');
      return;
    }

    switch (format) {
      case 'clean':
        setFormattedDate(formatCustomerDate(date));
        break;
      case 'relative':
        setFormattedDate(getRelativeTime(date));
        break;
      case 'full':
        setFormattedDate(formatDateIST(date, 'full'));
        break;
      case 'date':
        setFormattedDate(formatDateIST(date, 'date'));
        break;
      case 'time':
        setFormattedDate(formatDateIST(date, 'time'));
        break;
      default:
        setFormattedDate(formatCustomerDate(date));
    }
  }, [date, format]);

  return formattedDate || 'Loading...';
}

/**
 * Hook for relative time that auto-updates
 */
export function useRelativeTime(date: Date | string, autoUpdate = false) {
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    if (!date) {
      setRelativeTime('N/A');
      return;
    }

    const updateTime = () => {
      setRelativeTime(getRelativeTime(date));
    };

    // Initial update
    updateTime();

    // Auto-update every minute if enabled
    if (autoUpdate) {
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [date, autoUpdate]);

  return relativeTime || 'Loading...';
}
